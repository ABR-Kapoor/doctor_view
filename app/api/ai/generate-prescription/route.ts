import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(request: NextRequest) {
    try {
        const { pid, aid } = await request.json();

        if (!pid) {
            return NextResponse.json(
                { success: false, error: 'Patient ID required' },
                { status: 400 }
            );
        }

        // Fetch comprehensive patient data
        const patientData = await fetchPatientData(pid, aid);

        if (!patientData.success) {
            return NextResponse.json(
                { success: false, error: 'Failed to fetch patient data' },
                { status: 500 }
            );
        }

        // Generate prescription using Gemini AI
        const aiPrescription = await generatePrescriptionWithAI(patientData.data);

        return NextResponse.json({
            success: true,
            ...aiPrescription,
        });
    } catch (error: any) {
        console.error('AI Prescription Generation Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to generate prescription' },
            { status: 500 }
        );
    }
}

async function fetchPatientData(pid: string, aid?: string) {
    try {
        // Get patient with user details
        const { data: patient, error: patientError } = await supabase
            .from('patients')
            .select(`
        *,
        user:users(name, email)
      `)
            .eq('pid', pid)
            .single();

        if (patientError) throw patientError;

        // Get current appointment if aid provided
        let currentAppointment = null;
        if (aid) {
            const { data: apt } = await supabase
                .from('appointments')
                .select('*')
                .eq('aid', aid)
                .single();
            currentAppointment = apt;
        }

        // Get previous prescriptions (last 3 months)
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const { data: previousPrescriptions } = await supabase
            .from('prescriptions')
            .select('*')
            .eq('pid', pid)
            .gte('created_at', threeMonthsAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(5);

        // Get medication adherence data
        const { data: adherenceData } = await supabase
            .from('medication_adherence')
            .select('*')
            .eq('pid', pid)
            .order('scheduled_date', { ascending: false })
            .limit(20);

        return {
            success: true,
            data: {
                patient,
                currentAppointment,
                previousPrescriptions: previousPrescriptions || [],
                adherenceData: adherenceData || [],
            },
        };
    } catch (error) {
        console.error('Fetch patient data error:', error);
        return { success: false, error };
    }
}

async function generatePrescriptionWithAI(data: any) {
    const { patient, currentAppointment, previousPrescriptions, adherenceData } = data;

    // Prepare context for AI
    const patientLocation = {
        city: patient.city || 'Not specified',
        state: patient.state || 'Not specified',
        country: patient.country || 'India',
    };

    const currentSymptoms = currentAppointment?.chief_complaint || 'General consultation';

    // Analyze adherence patterns
    const adherenceSummary = analyzeAdherence(adherenceData);

    // Build comprehensive prompt with ALL available patient data
    const prompt = `You are Dr. Manas AI, an expert Ayurvedic physician assistant. Generate a comprehensive, personalized prescription based on the following patient data:

**PATIENT PROFILE:**
- Name: ${patient.user?.name || 'Patient'}
- Age: ${patient.age || 'Not specified'}
- Gender: ${patient.gender || 'Not specified'}
- Blood Group: ${patient.blood_group || 'Not specified'}
- Location: ${patientLocation.city}, ${patientLocation.state}, ${patientLocation.country}

**MEDICAL HISTORY:**
- Allergies: ${patient.allergies?.join(', ') || 'None reported'}
- Current Medications: ${patient.current_medications?.join(', ') || 'None'}
- Chronic Conditions: ${patient.chronic_conditions?.join(', ') || 'None'}

**CURRENT CONSULTATION:**
- Chief Complaint: ${currentSymptoms}
- Additional Symptoms: ${currentAppointment?.symptoms?.join(', ') || 'None specified'}
- Doctor's Notes: ${currentAppointment?.doctor_notes || 'None'}

**PRESCRIPTION HISTORY (Last 3 months):**
${previousPrescriptions.length > 0
            ? previousPrescriptions.map((p: any) => `
  - Date: ${new Date(p.created_at).toLocaleDateString()}
  - Diagnosis: ${p.diagnosis}
  - Medicines: ${JSON.stringify(p.medicines).slice(0, 150)}
  - Adherence: ${p.ai_suggestions?.adherence || 'Not tracked'}
`).join('\n')
            : 'No previous prescriptions'}

**MEDICATION ADHERENCE RECORD:**
${adherenceSummary}
${adherenceData.length > 0 ? `\nRecent adherence issues: ${adherenceData.filter((a: any) => a.is_skipped).map((a: any) => a.medicine_name).slice(0, 3).join(', ') || 'None'}` : ''}

**CRITICAL SAFETY GUIDELINES:**
1. **ALLERGY CHECK**: Cross-check ALL medicines against patient allergies: ${patient.allergies?.join(', ') || 'None'}
2. **DRUG INTERACTIONS**: Check interactions with current medications: ${patient.current_medications?.join(', ') || 'None'}
3. **CHRONIC CONDITIONS**: Consider ongoing treatment for: ${patient.chronic_conditions?.join(', ') || 'None'}
4. **LOCATION-AWARE**: Medicines must be available in ${patientLocation.city}, ${patientLocation.state}
5. **ADHERENCE**: If previous adherence was poor, suggest easier regimens or alternatives
6. **SEASON**: Consider ${new Date().toLocaleString('default', { month: 'long' })} season in ${patientLocation.state}
7. **MEDICINE TYPE**: 
   - PREFER Ayurvedic/Alternative medicines for most cases
   - For EXTREME/EMERGENCY cases requiring quick relief, you MAY include Allopathic medicines
   - Clearly mark allopathic medicines in notes field

**OUTPUT FORMAT (STRICT JSON):**
{
  "diagnosis": "Clear, comprehensive diagnosis based on symptoms and history",
  "symptoms": ["symptom1", "symptom2", "symptom3"],
  "medicines": [
    {
      "name": "Medicine name (avoid if allergic, check drug interactions)",
      "dosage": "Specific dosage (e.g., 500mg, 1 teaspoon)",
      "frequency": "How often (e.g., Twice daily, Before meals)",
      "duration": "MUST be simple text like: 7 days, 2 weeks, 1 month, 3 months - NO complex descriptions",
      "notes": "Special instructions. Mark if Allopathic medicine for emergency"
    }
  ],
  "instructions": "Detailed instructions considering patient's chronic conditions and current medications",
  "dietAdvice": "Location and season-appropriate diet for ${patientLocation.city} in ${new Date().toLocaleString('default', { month: 'long' })}",
  "followUpDays": 7,
  "safetyNotes": "Important safety information considering allergies and drug interactions"
}

RESPOND ONLY WITH VALID JSON. No additional text.`;

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Parse JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON in AI response');
        }

        const prescription = JSON.parse(jsonMatch[0]);

        // Sanitize medicine durations to simple formats
        if (prescription.medicines && Array.isArray(prescription.medicines)) {
            prescription.medicines = prescription.medicines.map((med: any) => ({
                ...med,
                // Clean up duration to simple format
                duration: simplifyDuration(med.duration || '7 days')
            }));
        }

        // Calculate follow-up date
        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + (prescription.followUpDays || 7));

        return {
            diagnosis: prescription.diagnosis,
            symptoms: prescription.symptoms,
            medicines: prescription.medicines,
            instructions: prescription.instructions,
            dietAdvice: prescription.dietAdvice,
            followUpDate: followUpDate.toISOString().split('T')[0],
            safetyNotes: prescription.safetyNotes || '',
        };
    } catch (error) {
        console.error('Gemini AI Error:', error);
        throw new Error('Failed to generate prescription with AI');
    }
}

function simplifyDuration(duration: string): string {
    // Extract numbers and common time units
    const durationLower = duration.toLowerCase();

    // Try to extract simple duration patterns
    if (durationLower.includes('day')) {
        const match = durationLower.match(/(\d+)\s*day/);
        return match ? `${match[1]} days` : '7 days';
    }
    if (durationLower.includes('week')) {
        const match = durationLower.match(/(\d+)\s*week/);
        return match ? `${match[1]} weeks` : '2 weeks';
    }
    if (durationLower.includes('month')) {
        const match = durationLower.match(/(\d+)\s*month/);
        return match ? `${match[1]} months` : '1 month';
    }
    if (durationLower.includes('year')) {
        const match = durationLower.match(/(\d+)\s*year/);
        return match ? `${match[1]} years` : '1 year';
    }

    // If already simple format, return as is
    if (/^\d+\s+(day|days|week|weeks|month|months|year|years)$/i.test(duration.trim())) {
        return duration.trim();
    }

    // Default fallback
    return '7 days';
}

function analyzeAdherence(adherenceData: any[]): string {
    if (!adherenceData || adherenceData.length === 0) {
        return 'No adherence data available';
    }

    const total = adherenceData.length;
    const taken = adherenceData.filter((a) => a.is_taken).length;
    const skipped = adherenceData.filter((a) => a.is_skipped).length;
    const adherenceRate = ((taken / total) * 100).toFixed(0);

    return `Adherence Rate: ${adherenceRate}% (${taken}/${total} doses taken, ${skipped} skipped)`;
}
