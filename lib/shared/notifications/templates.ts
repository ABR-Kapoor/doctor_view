import { format } from 'date-fns';

export interface AppointmentEmailData {
  recipientName: string;
  recipientType: 'patient' | 'doctor';
  patientName: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  mode: string;
  chiefComplaint: string;
  meetingLink?: string;
  tokenNumber?: number;
}

export interface PrescriptionEmailData {
  recipientName: string;
  recipientType: 'patient' | 'doctor';
  patientName: string;
  doctorName: string;
  diagnosis: string;
  medicines: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  instructions?: string;
  dashboardLink: string;
}

export function generateAppointmentCreatedEmail(data: AppointmentEmailData): string {
  const {
    recipientName,
    recipientType,
    patientName,
    doctorName,
    appointmentDate,
    appointmentTime,
    mode,
    chiefComplaint,
    meetingLink,
    tokenNumber,
  } = data;

  const modeDisplay = mode === 'online' ? 'Online Consultation' : 'In-Person Visit';
  const greeting = recipientType === 'patient' ? 'Dear' : 'Dear Dr.';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6; 
          color: #333; 
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container { 
          max-width: 600px; 
          margin: 20px auto; 
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 30px;
          text-align: center;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: white;
          margin-bottom: 10px;
          letter-spacing: 1px;
        }
        .header-subtitle {
          color: rgba(255,255,255,0.9);
          font-size: 14px;
          margin: 0;
        }
        .content { 
          padding: 40px 30px;
        }
        .greeting {
          font-size: 16px;
          color: #333;
          margin-bottom: 20px;
        }
        .detail-box { 
          background: #f8f9fa;
          padding: 25px;
          margin: 25px 0;
          border-radius: 6px;
          border-left: 4px solid #667eea;
        }
        .detail-row { 
          margin: 12px 0;
          font-size: 15px;
        }
        .label { 
          font-weight: 600;
          color: #555;
          display: inline-block;
          min-width: 140px;
        }
        .value { 
          color: #333;
        }
        .button { 
          display: inline-block;
          padding: 14px 32px;
          background: #667eea;
          color: white !important;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 15px;
          transition: background 0.3s;
        }
        .button:hover {
          background: #5568d3;
        }
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        .note {
          background: #e8f4f8;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #0ea5e9;
          margin: 20px 0;
          font-size: 14px;
          color: #0c4a6e;
        }
        .signature {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
        .signature-text {
          font-size: 15px;
          color: #333;
          margin: 5px 0;
        }
        .ceo-name {
          font-weight: 600;
          color: #667eea;
        }
        .footer { 
          background: #f8f9fa;
          text-align: center;
          padding: 25px;
          color: #6b7280;
          font-size: 13px;
        }
        .footer p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🌿 AuraSutra</div>
          <p class="header-subtitle">Holistic Healthcare Platform</p>
        </div>
        
        <div class="content">
          <p class="greeting">${greeting} ${recipientName},</p>
          
          <p>We're pleased to confirm your appointment has been successfully scheduled.</p>
          
          <div class="detail-box">
            <div class="detail-row">
              <span class="label">Patient:</span>
              <span class="value">${patientName}</span>
            </div>
            
            <div class="detail-row">
              <span class="label">Doctor:</span>
              <span class="value">Dr. ${doctorName}</span>
            </div>
            
            <div class="detail-row">
              <span class="label">Date:</span>
              <span class="value">${appointmentDate}</span>
            </div>
            
            <div class="detail-row">
              <span class="label">Time:</span>
              <span class="value">${appointmentTime}</span>
            </div>
            
            <div class="detail-row">
              <span class="label">Consultation Mode:</span>
              <span class="value">${modeDisplay}</span>
            </div>
            
            ${tokenNumber ? `
            <div class="detail-row">
              <span class="label">Token Number:</span>
              <span class="value">#${tokenNumber}</span>
            </div>
            ` : ''}
            
            <div class="detail-row">
              <span class="label">Chief Complaint:</span>
              <span class="value">${chiefComplaint}</span>
            </div>
          </div>
          
          ${meetingLink ? `
          <div class="button-container">
            <a href="${meetingLink}" class="button">Join Video Consultation</a>
            <p style="font-size: 13px; color: #6b7280; margin-top: 10px;">Click the button above at your scheduled appointment time</p>
          </div>
          ` : ''}
          
          <div class="note">
            ${recipientType === 'patient'
      ? '📌 Please arrive 10 minutes early for in-person appointments. For online consultations, ensure you have a stable internet connection.'
      : '📌 Please review the patient\'s medical history and chief complaint before the appointment.'}
          </div>
          
          <p style="font-size: 14px; color: #6b7280;">If you need to reschedule or cancel, please do so at least 24 hours in advance.</p>
          
          <div class="signature">
            <p class="signature-text">Best regards,</p>
            <p class="signature-text"><strong>Team AuraSutra</strong></p>
            <p class="signature-text"><span class="ceo-name">Abeer Kapoor</span>, CEO</p>
          </div>
        </div>
        
        <div class="footer">
          <p>This is an automated message from AuraSutra Healthcare Platform</p>
          <p>© 2026 AuraSutra. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generatePrescriptionCreatedEmail(data: PrescriptionEmailData): string {
  const {
    recipientName,
    recipientType,
    patientName,
    doctorName,
    diagnosis,
    medicines,
    instructions,
    dashboardLink,
  } = data;

  const greeting = recipientType === 'patient' ? 'Dear' : 'Dear Dr.';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6; 
          color: #333; 
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container { 
          max-width: 600px; 
          margin: 20px auto; 
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          padding: 40px 30px;
          text-align: center;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: white;
          margin-bottom: 10px;
          letter-spacing: 1px;
        }
        .header-subtitle {
          color: rgba(255,255,255,0.9);
          font-size: 14px;
          margin: 0;
        }
        .content { 
          padding: 40px 30px;
        }
        .greeting {
          font-size: 16px;
          color: #333;
          margin-bottom: 20px;
        }
        .detail-box { 
          background: #f8f9fa;
          padding: 25px;
          margin: 25px 0;
          border-radius: 6px;
          border-left: 4px solid #10b981;
        }
        .detail-row {
          margin: 12px 0;
          font-size: 15px;
        }
        .label { 
          font-weight: 600;
          color: #555;
          display: inline-block;
          min-width: 100px;
        }
        .value { 
          color: #333;
        }
        .medicine-item { 
          background: #f0fdf4;
          padding: 18px;
          margin: 12px 0;
          border-radius: 6px;
          border: 1px solid #bbf7d0;
        }
        .medicine-name {
          font-weight: 600;
          font-size: 16px;
          color: #166534;
          margin-bottom: 8px;
        }
        .medicine-details {
          font-size: 14px;
          color: #4b5563;
          line-height: 1.8;
        }
        .button { 
          display: inline-block;
          padding: 14px 32px;
          background: #10b981;
          color: white !important;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 15px;
        }
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        .warning-box {
          background: #fef3c7;
          padding: 18px;
          border-radius: 6px;
          border-left: 4px solid #f59e0b;
          margin: 25px 0;
        }
        .warning-text {
          margin: 0;
          color: #92400e;
          font-size: 14px;
        }
        .signature {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
        .signature-text {
          font-size: 15px;
          color: #333;
          margin: 5px 0;
        }
        .ceo-name {
          font-weight: 600;
          color: #10b981;
        }
        .footer { 
          background: #f8f9fa;
          text-align: center;
          padding: 25px;
          color: #6b7280;
          font-size: 13px;
        }
        .footer p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🌿 AuraSutra</div>
          <p class="header-subtitle">Holistic Healthcare Platform</p>
        </div>
        
        <div class="content">
          <p class="greeting">${greeting} ${recipientName},</p>
          
          <p>${recipientType === 'patient'
      ? `Dr. ${doctorName} has created a new prescription for you. Please review the details below and follow the instructions carefully.`
      : `You have successfully created a prescription for ${patientName}. A copy has been sent to the patient.`}</p>
          
          <div class="detail-box">
            <div class="detail-row">
              <span class="label">Patient:</span>
              <span class="value">${patientName}</span>
            </div>
            
            <div class="detail-row">
              <span class="label">Doctor:</span>
              <span class="value">Dr. ${doctorName}</span>
            </div>
            
            <div class="detail-row">
              <span class="label">Diagnosis:</span>
              <span class="value">${diagnosis}</span>
            </div>
          </div>
          
          <div class="detail-box">
            <h3 style="margin-top: 0; color: #10b981; font-size: 18px;">Prescribed Medicines</h3>
            ${medicines.map(medicine => `
              <div class="medicine-item">
                <div class="medicine-name">💊 ${medicine.name}</div>
                <div class="medicine-details">
                  <div><strong>Dosage:</strong> ${medicine.dosage}</div>
                  <div><strong>Frequency:</strong> ${medicine.frequency}</div>
                  <div><strong>Duration:</strong> ${medicine.duration}</div>
                </div>
              </div>
            `).join('')}
          </div>
          
          ${instructions ? `
          <div class="detail-box">
            <h3 style="margin-top: 0; color: #10b981; font-size: 18px;">Special Instructions</h3>
            <p style="margin: 0; font-size: 15px;">${instructions}</p>
          </div>
          ` : ''}
          
          <div class="button-container">
            <a href="${dashboardLink}" class="button">View Full Prescription</a>
          </div>
          
          ${recipientType === 'patient' ? `
          <div class="warning-box">
            <p class="warning-text">
              <strong>⚠️ Important:</strong> Please follow the prescribed dosage and duration exactly as specified. 
              Do not stop or modify your medication without consulting your doctor first.
            </p>
          </div>
          ` : ''}
          
          <div class="signature">
            <p class="signature-text">Best regards,</p>
            <p class="signature-text"><strong>Team AuraSutra</strong></p>
            <p class="signature-text"><span class="ceo-name">Abeer Kapoor</span>, CEO</p>
          </div>
        </div>
        
        <div class="footer">
          <p>This is an automated message from AuraSutra Healthcare Platform</p>
          <p>© 2026 AuraSutra. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
