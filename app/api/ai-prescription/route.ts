import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { diagnosis, symptoms, patientAge, patientGender } = await request.json();

        if (!diagnosis || !symptoms) {
            return NextResponse.json(
                { error: 'Diagnosis and symptoms are required' },
                { status: 400 }
            );
        }

        // Call Google Gemini AI for prescription generation
        const prescription = await generateAIPrescription(diagnosis, symptoms, patientAge, patientGender);

        return NextResponse.json({
            success: true,
            prescription,
        });
    } catch (error) {
        console.error('AI prescription error:', error);
        return NextResponse.json(
            { error: 'Failed to generate prescription' },
            { status: 500 }
        );
    }
}

async function generateAIPrescription(
    diagnosis: string,
    symptoms: string[],
    patientAge?: number,
    patientGender?: string
) {
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        console.warn('Google API Key not found, using fallback prescription');
        return getFallbackPrescription(diagnosis, symptoms);
    }

    try {
        const symptomsText = Array.isArray(symptoms) ? symptoms.join(', ') : symptoms;
        const ageText = patientAge ? `${patientAge} years old` : 'adult';
        const genderText = patientGender || 'patient';

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: `You are an expert Ayurvedic doctor. Create a detailed prescription for the following case:

Diagnosis: ${diagnosis}
Symptoms: ${symptomsText}
Patient: ${ageText}, ${genderText}

Provide a comprehensive Ayurvedic prescription in JSON format with:
{
  "medicines": [
    {
      "name": "Medicine name (Ayurvedic)",
      "dosage": "quantity and form",
      "frequency": "how many times per day",
      "timing": "before/after meals, morning/evening",
      "duration": "number of days"
    }
  ],
  "dietAdvice": "Specific dietary recommendations",
  "lifestyleAdvice": "Lifestyle modifications",
  "followUpDays": number of days for follow-up
}

Recommend 3-5 authentic Ayurvedic medicines suitable for this condition. Be specific with dosages and timings. Focus on classical Ayurvedic formulations.

Respond ONLY with valid JSON, no additional text.`,
                                },
                            ],
                        },
                    ],
                }),
            }
        );

        const data = await response.json();

        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            const text = data.candidates[0].content.parts[0].text;
            const jsonMatch = text.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                const aiPrescription = JSON.parse(jsonMatch[0]);
                return aiPrescription;
            }
        }

        return getFallbackPrescription(diagnosis, symptoms);
    } catch (error) {
        console.error('Gemini API error:', error);
        return getFallbackPrescription(diagnosis, symptoms);
    }
}

function getFallbackPrescription(diagnosis: string, symptoms: string[]) {
    // Intelligent fallback based on common Ayurvedic treatments
    const symptomsText = Array.isArray(symptoms) ? symptoms.join(' ').toLowerCase() : String(symptoms).toLowerCase();

    let medicines = [];

    // Digestive issues
    if (symptomsText.includes('digest') || symptomsText.includes('stomach') || symptomsText.includes('gas')) {
        medicines = [
            {
                name: 'Triphala Churna',
                dosage: '1 teaspoon',
                frequency: 'Twice daily',
                timing: 'After meals with warm water',
                duration: '15 days',
            },
            {
                name: 'Hingwashtak Churna',
                dosage: '1/2 teaspoon',
                frequency: 'Three times daily',
                timing: 'Before meals',
                duration: '10 days',
            },
        ];
    }
    // Stress/Anxiety
    else if (symptomsText.includes('stress') || symptomsText.includes('anxiety') || symptomsText.includes('sleep')) {
        medicines = [
            {
                name: 'Ashwagandha Churna',
                dosage: '1 teaspoon',
                frequency: 'Twice daily',
                timing: 'Morning and before bed with warm milk',
                duration: '30 days',
            },
            {
                name: 'Brahmi Vati',
                dosage: '1 tablet',
                frequency: 'Twice daily',
                timing: 'After breakfast and dinner',
                duration: '20 days',
            },
        ];
    }
    // Pain/Joint issues
    else if (symptomsText.includes('pain') || symptomsText.includes('joint') || symptomsText.includes('arthritis')) {
        medicines = [
            {
                name: 'Yogaraja Guggulu',
                dosage: '2 tablets',
                frequency: 'Twice daily',
                timing: 'After meals with warm water',
                duration: '30 days',
            },
            {
                name: 'Mahayograj Guggulu',
                dosage: '1 tablet',
                frequency: 'Twice daily',
                timing: 'After meals',
                duration: '21 days',
            },
        ];
    }
    // Default
    else {
        medicines = [
            {
                name: 'Chyawanprash',
                dosage: '1 tablespoon',
                frequency: 'Once daily',
                timing: 'Morning with warm milk',
                duration: '30 days',
            },
            {
                name: 'Triphala Churna',
                dosage: '1 teaspoon',
                frequency: 'Once daily',
                timing: 'Before bed with warm water',
                duration: '15 days',
            },
        ];
    }

    return {
        medicines,
        dietAdvice: 'Follow a balanced diet with fresh fruits and vegetables. Avoid processed foods, excessive spicy and oily foods. Drink plenty of warm water throughout the day.',
        lifestyleAdvice: 'Maintain regular sleep schedule (10 PM - 6 AM). Practice yoga or light exercise for 30 minutes daily. Reduce stress through meditation or pranayama.',
        followUpDays: 15,
    };
}
