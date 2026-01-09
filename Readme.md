## ✨ Features

### 📊 Dashboard & Analytics
- **Real-time Statistics**: View patient counts, appointments, and earnings
- **Today's Schedule**: Quick view of today's appointments
- **Performance Metrics**: Track consultation completion rates
- **Revenue Analytics**: Monitor earnings and payment history
- **Patient Overview**: Recent patient interactions

### 👥 Patient Management
- **Patient Records**: Complete medical history access
- **Patient Search**: Quick search and filter capabilities
- **Medical History**: View detailed patient health records
- **Medication Adherence**: Track patient adherence to medication
- **Treatment Plans**: Create and track treatment protocols
- **Prescription History**: Access past prescriptions

### 📅 Appointment Management
- **Appointment Queue**: Manage pending, confirmed, and today's appointments
- **Status Tracking**: Real-time appointment status updates
- **Token System**: Queue management for offline appointments
- **Rescheduling**: Easy appointment rescheduling
- **Appointment Filters**: Filter by status, date, type
- **Calendar View**: Visual appointment scheduling

### 💬 Video Consultations
- **HD Video Calls**: ZegoCloud-powered video consultations
- **Screen Sharing**: Share medical images and documents
- **Call Recording**: Record consultations (with consent)
- **In-call Notes**: Take notes during consultations
- **Prescription Creation**: Create prescriptions during calls

### 📝 Prescription Management
- **Digital Prescriptions**: Create and manage e-prescriptions
- **Medicine Database**: Quick access to medicine information
- **Custom Templates**: Save frequently used prescription templates
- **Dosage Guidelines**: Standard dosage recommendations
- **Follow-up Scheduling**: Schedule follow-up appointments

### 🔔 Notifications & Updates
- **Real-time Alerts**: Instant appointment notifications
- **Patient Updates**: Get notified of patient queries
- **System Notifications**: Platform updates and announcements

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14.0.4
- **Language**: TypeScript 5.3.3
- **Styling**: TailwindCSS 3.4.0
- **UI Components**: Custom components
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

### Backend & Services
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Kinde Auth
- **Video**: ZegoCloud WebRTC
- **Real-time**: Supabase Subscriptions
- **Shared Library**: `@aurasutra/shared-lib`

### Development Tools
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Formatting**: Prettier (optional)

## 📖 Usage Guide

### Doctor Registration Flow
```
1. Visit http://localhost:3001
2. Click "Sign Up" → Register via Kinde
3. Complete doctor verification form:
   - Medical license number
   - Specialization certificates
   - Identification documents
4. Wait for admin approval (for now supabase manually approve)
5. Access doctor dashboard
```

### Managing Appointments

#### View Appointments
```
1. Go to "Appointments" in navigation
2. View appointments in tabs:
   - Pending: New requests awaiting approval
   - Confirmed: Approved appointments
   - Rescheduled: Rescheduled by you or patient
   - Today: All appointments for today
3. Click appointment to view details
```

#### Approve Appointment
```
1. Go to "Pending" tab
2. Review patient details and symptoms
3. Click "Approve" to confirm
4. System sends notification to patient
```

#### Reschedule Appointment
```
1. Click "Reschedule" on appointment card
2. Select new date and time
3. Add reason for rescheduling
4. Confirm rescheduling
5. Patient receives notification
```

#### Start Video Consultation
```
1. Go to "Today's Appointments"
2. Find confirmed online appointment
3. Click "Start Video Call" (15 min before)
4. Wait for patient to join
5. Conduct consultation
6. Create prescription during/after call
7. End consultation
```

### Creating Prescriptions

```
1. During or after appointment
2. Click "Create Prescription with AI" (use prescription_gen_Doc)
    - AI will generate prescription based on symptoms and patient history
    - Doctor can review and modify the prescription
3. Doctor can also create prescription manually
   - Fill prescription form:
    - Search and add medicines
    - Specify dosage and frequency
    - Add instructions
    - Set validity period
4. Review and submit
5. Patient receives digital prescription
```

### Viewing Patient Records

```
1. Go to "Patients"
2. Search for patient
3. Click to view profile:
   - Personal information
   - Medical history
   - Past appointments
   - Appointment history
   - Financial history
   - Previous prescriptions
   - Test results
4. Add notes or update records
```