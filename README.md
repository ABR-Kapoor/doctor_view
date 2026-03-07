<p align="center">
  <img src="./public/Logos/logo.png" alt="AuraSutra Logo" width="120" />
</p>

<h1 align="center">AuraSutra Doctor Portal</h1>

<p align="center">
  <strong>Professional portal for Ayurvedic healthcare practitioners</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js" alt="Next.js 14" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=flat-square&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=flat-square&logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=flat-square&logo=google" alt="Google Gemini" />
  <img src="https://img.shields.io/badge/ZegoCloud-Video-FF5A00?style=flat-square" alt="ZegoCloud" />
  <img src="https://img.shields.io/badge/Kinde-Auth-6C47FF?style=flat-square" alt="Kinde Auth" />
  <img src="https://img.shields.io/badge/Resend-Email-000000?style=flat-square" alt="Resend" />
  <img src="https://img.shields.io/badge/Lingo.dev-i18n-FF6B35?style=flat-square" alt="Lingo.dev" />
  <img src="https://img.shields.io/badge/Port-3001-green?style=flat-square" alt="Port 3001" />
</p>

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Authentication and Authorization](#authentication-and-authorization)
- [AI Prescription Engine](#ai-prescription-engine)
- [Multi-Language Support](#multi-language-support)
- [Video Call Integration](#video-call-integration)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [User Flow](#user-flow)

---

## Overview

The **AuraSutra Doctor Portal** is the practitioner-facing module of the AuraSutra Ayurvedic Healthcare Platform. It is a full-featured Next.js 14 application (App Router) that runs on **port 3001** and provides Ayurvedic doctors with a comprehensive dashboard to manage their practice -- from patient consultations and appointment scheduling to AI-powered prescription generation and real-time video calls.

Key highlights:

- **AI-Powered Prescriptions** via Google Gemini (dual-model architecture with safety checks)
- **1-on-1 Video Consultations** through ZegoCloud with live call timers
- **Real-Time Adherence Tracking** with 5-second polling and medicine-wise breakdowns
- **14-Language Support** powered by Lingo.dev translation SDK
- **Glass-Morphism UI** with Framer Motion animations and Recharts data visualizations

---

## Architecture

```
+------------------------------------------------------------------+
|                       CLIENT BROWSER                             |
|                                                                  |
|  +------------------+  +------------------+  +----------------+  |
|  |  Dashboard UI    |  |  Video Call UI   |  |  Profile UI    |  |
|  |  (React 18)      |  |  (ZegoCloud)    |  |  (Radix UI)    |  |
|  +--------+---------+  +--------+---------+  +-------+--------+  |
|           |                     |                     |          |
+------------------------------------------------------------------+
            |                     |                     |
            v                     v                     v
+------------------------------------------------------------------+
|                     NEXT.JS 14 APP ROUTER                        |
|                        (Port 3001)                               |
|                                                                  |
|  +--------------------+  +--------------------+                  |
|  |  Server Components |  |  API Routes (23)   |                  |
|  |  (Dashboard Layout)|  |  /api/doctor/*     |                  |
|  +--------------------+  |  /api/ai/*         |                  |
|                          |  /api/auth/*        |                  |
|  +--------------------+  |  /api/translate     |                  |
|  |  Client Components |  |  /api/zego-token   |                  |
|  |  (Charts, Forms)   |  +--------------------+                  |
|  +--------------------+                                          |
+------------------------------------------------------------------+
            |              |              |              |
            v              v              v              v
+----------+--+  +--------+---+  +-------+----+  +-----+------+
| PostgreSQL  |  | Google     |  | ZegoCloud  |  | Nhost      |
| (Neon)      |  | Gemini AI  |  | Video SDK  |  | Storage    |
| - users     |  | - Pro      |  | - JWT Auth |  | - Images   |
| - doctors   |  | - 2.5 Flash|  | - WebRTC   |  | - Uploads  |
| - patients  |  +------------+  +------------+  +------------+
| - appts     |
| - Rx        |  +------------+  +------------+
| - adherence |  | Kinde Auth |  | Resend     |
| - finance   |  | - OAuth    |  | - Email    |
+-----------+-+  | - Google   |  | - Notifs   |
                 +------------+  +------------+
                                                  +------------+
                                                  | Lingo.dev  |
                                                  | - 14 langs |
                                                  | - Text/HTML|
                                                  | - Objects  |
                                                  +------------+
```

---

## Tech Stack

| Category           | Technology                                             |
| :----------------- | :----------------------------------------------------- |
| **Framework**      | Next.js 14 (App Router)                                |
| **Language**       | TypeScript 5.3                                         |
| **UI Library**     | React 18                                               |
| **Styling**        | Tailwind CSS 3.4, tailwindcss-animate                  |
| **Components**     | Radix UI (Dialog, Select, Tabs, Toast, Avatar, etc.)   |
| **Icons**          | Lucide React                                           |
| **Animations**     | Framer Motion 10                                       |
| **Charts**         | Recharts 2.10                                          |
| **Database**       | PostgreSQL via Neon (serverless), `postgres` npm driver |
| **Authentication** | Kinde Auth (Google OAuth)                              |
| **AI Engine**      | Google Gemini Pro + Gemini 2.5 Flash                   |
| **Video Calls**    | ZegoCloud UIKit Prebuilt                               |
| **File Storage**   | Nhost (profile images)                                 |
| **Email**          | Resend API                                             |
| **Translation**    | Lingo.dev SDK (14 languages)                           |
| **Utilities**      | date-fns, clsx, tailwind-merge, class-variance-authority |
| **Notifications**  | react-hot-toast                                        |
| **Deployment**     | Vercel                                                 |

---

## Project Structure

```
doctor_view/
|
+-- app/
|   +-- api/                              # API Route Handlers (23 endpoints)
|   |   +-- admin/
|   |   |   +-- enable-adherence/         #   POST  Enable adherence tracking
|   |   +-- ai-prescription/             #   POST  Basic AI prescription (Gemini Pro)
|   |   +-- ai/
|   |   |   +-- generate-prescription/   #   POST  Advanced "Dr. Manas AI" (Gemini 2.5 Flash)
|   |   +-- appointments/
|   |   |   +-- [aid]/
|   |   |       +-- start-call/          #   POST  Start video call, record timestamp
|   |   |       +-- call-duration/       #   PATCH Update call duration
|   |   +-- auth/
|   |   |   +-- [kindeAuth]/             #   *     Kinde auth handler (all methods)
|   |   |   +-- sync/                    #   POST  Sync user from Kinde to DB
|   |   +-- clinics/                     #   GET   List available clinics
|   |   +-- doctor/
|   |   |   +-- adherence/
|   |   |   |   +-- [prescription_id]/   #   GET   Adherence stats per prescription
|   |   |   +-- appointments/            #   GET   List appointments
|   |   |   |                            #   PATCH Update appointment status
|   |   |   |                            #   DELETE Cancel appointment
|   |   |   +-- dashboard/               #   GET   Dashboard statistics + chart data
|   |   |   +-- patients/                #   GET   Patient list with search
|   |   |   |   +-- [patientId]/         #   GET   Patient detail (full profile)
|   |   |   +-- prescriptions/           #   POST  Create prescription
|   |   |   |   |                        #   GET   List prescriptions
|   |   |   |   +-- [prescription_id]/   #   PATCH Update prescription
|   |   |   |       |                    #   DELETE Soft-delete prescription
|   |   |   |       +-- send/            #   POST  Send prescription to patient
|   |   |   +-- profile/                 #   GET   Fetch doctor profile
|   |   |                                #   PATCH Update doctor profile
|   |   +-- sync-user/                   #   GET   Lightweight user sync
|   |   +-- translate/                   #   POST  Translate text/object/HTML
|   |   +-- upload-profile-picture/      #   POST  Upload image to Nhost
|   |   +-- zego-token/                  #   POST  Generate ZegoCloud JWT token
|   |   +-- test-db/                     #   GET   Database connectivity test
|   |   +-- test-email/                  #   GET   Email delivery test
|   |
|   +-- dashboard/
|   |   +-- layout.tsx                    # Server-side auth guard + sidebar layout
|   |   +-- page.tsx                      # Main dashboard (stats cards + charts)
|   |   +-- appointments/
|   |   |   +-- page.tsx                  # Appointment management (confirm/decline/call)
|   |   +-- patients/
|   |   |   +-- page.tsx                  # Patient list with search + card grid
|   |   |   +-- [patientId]/
|   |   |       +-- page.tsx              # Patient detail (profile, history, meds)
|   |   +-- prescriptions/
|   |   |   +-- page.tsx                  # Prescription list
|   |   |   +-- new/
|   |   |   |   +-- page.tsx              # Create new prescription (manual + AI)
|   |   |   +-- [prescription_id]/
|   |   |       +-- edit/
|   |   |       |   +-- page.tsx          # Edit existing prescription
|   |   |       +-- progress/
|   |   |           +-- page.tsx          # Adherence progress (real-time polling)
|   |   +-- profile/
|   |   |   +-- page.tsx                  # Doctor profile editor
|   |   +-- video-call/
|   |       +-- [aid]/
|   |           +-- page.tsx              # ZegoCloud video call room
|   |
|   +-- components/                       # Dashboard-scoped components
|   |   +-- CollapsibleSidebar.tsx        #   Responsive sidebar navigation
|   |   +-- DashboardLayoutClient.tsx     #   Client wrapper for dashboard layout
|   |   +-- LanguageSwitcher.tsx          #   Language selection dropdown (14 langs)
|   |   +-- ProfilePicture.tsx            #   Profile image with Nhost upload
|   |   +-- SidebarNavigation.tsx         #   Navigation links + active state
|   |   +-- TranslatedText.tsx            #   Auto-translating text component
|   |
|   +-- contexts/
|   |   +-- LanguageContext.tsx            # Language state + translation methods
|   |
|   +-- hooks/                            # (referenced via contexts)
|   |   +-- useTranslation.ts             # Translation hook
|   |
|   +-- globals.css                       # Global styles + glass-morphism classes
|   +-- layout.tsx                        # Root layout (LanguageProvider, Toaster)
|   +-- page.tsx                          # Landing page
|
+-- components/                           # Shared top-level components
|   +-- AuthSync.tsx                      #   Auto-sync Kinde user to database
|   +-- DoctorProfileCheck.tsx            #   Profile completeness checker
|   +-- ProfileCompletionModal.tsx        #   Blocking modal for incomplete profiles
|
+-- lib/
|   +-- db.ts                             # PostgreSQL connection (Neon, SSL, pool)
|   +-- shared/
|       +-- types.ts                      # TypeScript interfaces (20+ types)
|       +-- auth-helpers.ts               # Authentication utility functions
|       +-- profile-utils.ts              # Profile completeness calculations
|       +-- notifications/                # Email notification templates
|       +-- greetings.ts                  # Time-based greeting strings
|       +-- utils.ts                      # General utility functions
|       +-- index.ts                      # Barrel exports
|
+-- public/
|   +-- Logos/                            # Brand logos and assets
|   +-- homepage.png                      # Landing page hero image
|   +-- landing-bg.jpg                    # Background image
|
+-- package.json                          # Dependencies and scripts
+-- next.config.js                        # Next.js configuration (port 3001)
+-- tailwind.config.ts                    # Tailwind theme (Ayurvedic color palette)
+-- tsconfig.json                         # TypeScript configuration
+-- vercel.json                           # Vercel deployment settings
+-- postcss.config.js                     # PostCSS with autoprefixer
```

---

## Features

### 1. Dashboard with Real-Time Statistics

The main dashboard presents an at-a-glance view of the doctor's practice with four key metrics:

- **Upcoming Appointments** -- count of scheduled/confirmed appointments
- **Active Prescriptions** -- currently active prescriptions across all patients
- **Total Patients** -- lifetime patient count with progress indicator
- **Monthly Revenue / Pending Approvals** -- conditional display based on pending actions

Two interactive charts provide trend analysis:
- **Appointment Bar Chart** (6-month history) via Recharts `BarChart`
- **Patient Growth Line Chart** (4-week trend) via Recharts `LineChart`

### 2. Appointment Management

Full lifecycle management for patient appointments:

| Action    | Description                                              |
| :-------- | :------------------------------------------------------- |
| Confirm   | Accept a pending appointment request                     |
| Decline   | Reject an appointment with reason                        |
| Start Call| Launch ZegoCloud video call, record `call_started_at`    |
| Complete  | Mark appointment as finished, record duration            |
| Cancel    | Cancel with reason and optional notification             |

### 3. Patient Management

- **Search** -- real-time search across patient names
- **Card Grid** -- visual patient cards with adherence rate badges
- **Patient Detail View** -- complete patient profile including:
  - Personal information and emergency contacts
  - Allergies, chronic conditions, current medications
  - Blood group, age, gender
  - Full appointment history with the doctor
  - Linked prescriptions and adherence data

### 4. Prescription System

#### Manual Prescription Creation
Doctors can manually create prescriptions with:
- Diagnosis and symptom selection
- Multiple medicines with dosage, frequency, duration, and notes
- Dietary advice and lifestyle instructions
- Follow-up date scheduling

#### AI-Powered Prescription Generation
Two tiers of AI assistance (see [AI Prescription Engine](#ai-prescription-engine)):
- **Basic Mode** -- Gemini Pro with intelligent fallback prescriptions
- **Advanced "Dr. Manas AI"** -- Gemini 2.5 Flash with full patient context

#### Prescription Lifecycle
- **Create** -- manual or AI-assisted
- **Edit** -- modify any field of an existing prescription
- **Send** -- deliver to patient with email notification via Resend
- **Delete** -- soft-delete (marks inactive, preserves data)

### 5. Prescription Adherence Tracking

Real-time monitoring of patient medication compliance:
- **5-second polling interval** for live updates
- **Overall adherence percentage** with visual progress bars
- **Medicine-wise breakdown** -- individual tracking per medicine
- **Dose-level detail** -- taken, skipped, and pending doses
- **Skip reason tracking** -- understand why patients miss doses

### 6. Video Consultations

Integrated 1-on-1 video calls powered by ZegoCloud:
- Server-generated JWT tokens (Token04 algorithm)
- Appointment-linked call rooms (room ID = appointment ID)
- Live call timer with duration tracking
- Automatic `call_started_at` and `call_duration_minutes` recording
- Post-call summary and status update

### 7. Doctor Profile Management

Comprehensive profile editor with 22 Ayurvedic specializations:
- Personal information (name, phone, profile picture)
- Professional details (qualification, registration number, experience)
- Consultation fee setting
- Clinic affiliation (select from registered clinics or enter custom)
- Address and location information
- Languages spoken
- Custom specialization keywords
- Bio/description

**Profile Completeness Check**: A blocking modal (`ProfileCompletionModal`) appears on all non-profile pages if the doctor's profile is incomplete, showing the completion percentage and missing fields.

### 8. Multi-Language Support (14 Languages)

| Code | Language   | Code | Language   |
| :--- | :--------- | :--- | :--------- |
| `en` | English    | `ar` | Arabic     |
| `es` | Spanish    | `pt` | Portuguese |
| `fr` | French     | `ja` | Japanese   |
| `de` | German     | `bn` | Bengali    |
| `hi` | Hindi      | `te` | Telugu     |
| `zh` | Chinese    | `mr` | Marathi    |
|      |            | `ta` | Tamil      |
|      |            | `gu` | Gujarati   |

Translation features:
- **Text translation** -- plain strings via `localizeText`
- **Object translation** -- structured JSON objects via `localizeObject`
- **HTML translation** -- rich HTML content via `localizeHtml`
- **Client-side caching** -- avoids redundant API calls
- **Static translation fallbacks** -- instant delivery for common strings
- **`<TranslatedText>` component** -- wraps any text for automatic translation
- **Language persistence** -- saved to `localStorage`

### 9. Glass-Morphism UI Design

The interface uses a custom Ayurvedic-themed design system:
- **Primary palette**: Emerald/teal greens (`#10B981`, `#059669`, `#047857`)
- **Glass panels**: Semi-transparent cards with backdrop blur
- **Custom shadows**: Green-tinted box shadows (`green-sm` through `green-xl`)
- **Animations**: Fade-in, slide-up, pulse, and accordion via `tailwindcss-animate`
- **Fonts**: Poppins (primary), Noto Sans Devanagari (Hindi/Sanskrit support)
- **Appointment status colors**: Confirmed (green), Pending (yellow), Cancelled (red), Completed (blue)

---

## API Reference

### Authentication

| Method | Endpoint               | Description                                    |
| :----- | :--------------------- | :--------------------------------------------- |
| `*`    | `/api/auth/[kindeAuth]`| Kinde authentication handler (all HTTP methods)|
| `POST` | `/api/auth/sync`       | Sync authenticated user from Kinde to database |
| `GET`  | `/api/sync-user`       | Lightweight user sync (returns user object)     |

### Doctor Profile

| Method  | Endpoint              | Description                                   |
| :------ | :-------------------- | :-------------------------------------------- |
| `GET`   | `/api/doctor/profile` | Fetch doctor profile with clinic data          |
| `PATCH` | `/api/doctor/profile` | Update doctor and/or user profile fields       |

**Query Parameters (GET):** `uid` (required) -- the doctor's user ID

**Request Body (PATCH):**
```json
{
  "uid": "string",
  "user": { "name": "string", "phone": "string", "profile_image_url": "string" },
  "doctor": { "specialization": ["string"], "qualification": "string", "..." : "..." }
}
```

### Dashboard

| Method | Endpoint                | Description                                 |
| :----- | :---------------------- | :------------------------------------------ |
| `GET`  | `/api/doctor/dashboard` | Dashboard statistics and chart data          |

**Query Parameters:** `uid` (required)

**Response includes:** `todayAppointments`, `totalPatients`, `pendingRequests`, `activePrescriptions`, `pendingApprovals`, `monthlyRevenue`, `appointmentsData` (6-month bar chart), `patientsData` (4-week line chart)

### Appointments

| Method   | Endpoint                               | Description                          |
| :------- | :------------------------------------- | :----------------------------------- |
| `GET`    | `/api/doctor/appointments`             | List appointments (with filters)     |
| `PATCH`  | `/api/doctor/appointments`             | Update appointment status            |
| `DELETE` | `/api/doctor/appointments`             | Cancel an appointment                |
| `POST`   | `/api/appointments/[aid]/start-call`   | Record call start timestamp          |
| `PATCH`  | `/api/appointments/[aid]/call-duration`| Update call duration in minutes      |

### Patients

| Method | Endpoint                          | Description                              |
| :----- | :-------------------------------- | :--------------------------------------- |
| `GET`  | `/api/doctor/patients`            | List patients with search capability     |
| `GET`  | `/api/doctor/patients/[patientId]`| Full patient detail (profile + history)  |

### Prescriptions

| Method   | Endpoint                                          | Description                       |
| :------- | :------------------------------------------------ | :-------------------------------- |
| `POST`   | `/api/doctor/prescriptions`                       | Create a new prescription         |
| `GET`    | `/api/doctor/prescriptions`                       | List prescriptions (with filters) |
| `PATCH`  | `/api/doctor/prescriptions/[prescription_id]`     | Update an existing prescription   |
| `DELETE` | `/api/doctor/prescriptions/[prescription_id]`     | Soft-delete a prescription        |
| `POST`   | `/api/doctor/prescriptions/[prescription_id]/send`| Send prescription to patient      |

### Adherence

| Method | Endpoint                                      | Description                          |
| :----- | :-------------------------------------------- | :----------------------------------- |
| `GET`  | `/api/doctor/adherence/[prescription_id]`     | Get adherence stats per prescription |

### AI Prescription Generation

| Method | Endpoint                        | Description                                    |
| :----- | :------------------------------ | :--------------------------------------------- |
| `POST` | `/api/ai-prescription`          | Basic AI prescription (Gemini Pro + fallback)  |
| `POST` | `/api/ai/generate-prescription` | Advanced "Dr. Manas AI" (Gemini 2.5 Flash)    |

**Basic endpoint body:**
```json
{ "diagnosis": "string", "symptoms": ["string"], "patientAge": 30, "patientGender": "male" }
```

**Advanced endpoint body:**
```json
{ "pid": "patient-uuid", "aid": "appointment-uuid (optional)" }
```

### Utility

| Method | Endpoint                     | Description                          |
| :----- | :--------------------------- | :----------------------------------- |
| `GET`  | `/api/clinics`               | List available clinics               |
| `POST` | `/api/upload-profile-picture`| Upload image to Nhost storage        |
| `POST` | `/api/translate`             | Translate text/object/HTML via Lingo |
| `POST` | `/api/zego-token`            | Generate ZegoCloud JWT token         |
| `POST` | `/api/admin/enable-adherence`| Enable adherence tracking for Rx     |

---

## Database Schema

The application interacts with the following PostgreSQL tables hosted on Neon:

```
+------------------+       +------------------+       +------------------+
|     users        |       |     doctors      |       |     patients     |
+------------------+       +------------------+       +------------------+
| uid         (PK) |<------| uid         (FK) |       | pid         (PK) |
| auth_id          |       | did         (PK) |       | uid         (FK) |
| email            |       | specialization[] |       | date_of_birth    |
| phone (UNIQUE)   |       | qualification    |       | gender           |
| role             |       | registration_num |       | blood_group      |
| name             |       | years_experience |       | allergies[]      |
| profile_image_url|       | consultation_fee |       | medications[]    |
| is_verified      |       | bio              |       | conditions[]     |
| is_active        |       | clinic_id   (FK) |       | address fields   |
| created_at       |       | clinic_name      |       | emergency_contact|
| updated_at       |       | address fields   |       | connected_doctors|
| last_login       |       | languages[]      |       | created_at       |
+------------------+       | custom_specs     |       +------------------+
                           | is_verified      |
                           +------------------+
                                    |
          +-------------------------+-------------------------+
          |                         |                         |
+---------+--------+  +------------+---------+  +-------------+--------+
|   appointments   |  |    prescriptions     |  | doctor_patient_rels   |
+------------------+  +----------------------+  +----------------------+
| aid         (PK) |  | prescription_id (PK) |  | relationship_id (PK) |
| pid         (FK) |  | aid            (FK)  |  | did            (FK)  |
| did         (FK) |  | pid            (FK)  |  | pid            (FK)  |
| mode             |  | did            (FK)  |  | is_primary           |
| status           |  | diagnosis            |  | status               |
| scheduled_date   |  | symptoms[]           |  | first_appt_date      |
| scheduled_time   |  | medicines    (JSONB) |  | last_appt_date       |
| start/end_time   |  | instructions         |  | total_appointments   |
| duration_minutes |  | diet_advice          |  +----------------------+
| chief_complaint  |  | follow_up_date       |
| symptoms[]       |  | ai_generated         |         +--------------------+
| doctor_notes     |  | is_active            |         | finance_transactions|
| call_started_at  |  | sent_to_patient      |         +--------------------+
| call_duration    |  | sent_at              |         | transaction_id (PK)|
| payment_id       |  +----------------------+         | aid           (FK) |
| payment_status   |           |                       | pid           (FK) |
+------------------+           |                       | did           (FK) |
                    +----------+----------+             | type               |
                    | medication_adherence|             | amount             |
                    +---------------------+             | currency           |
                    | adherence_id   (PK) |             | status             |
                    | prescription_id(FK) |             | razorpay fields    |
                    | pid            (FK) |             | created_at         |
                    | medicine_name       |             +--------------------+
                    | scheduled_date      |
                    | scheduled_time      |    +------------------+
                    | taken_at            |    |     clinics      |
                    | is_taken            |    +------------------+
                    | is_skipped          |    | clinic_id   (PK) |
                    | skip_reason         |    | uid         (FK) |
                    | synced              |    | clinic_name      |
                    +---------------------+    | registration_num |
                                               | address fields   |
                                               | phone, email     |
                                               | is_verified      |
                                               +------------------+
```

### Key Relationships

- `users` 1:1 `doctors` -- every doctor has a user account
- `doctors` N:1 `clinics` -- doctors optionally affiliate with a clinic
- `doctors` 1:N `appointments` -- a doctor has many appointments
- `patients` 1:N `appointments` -- a patient books many appointments
- `prescriptions` belong to an appointment (optional), patient, and doctor
- `medication_adherence` tracks each scheduled dose per prescription
- `doctor_patient_relationships` tracks the ongoing relationship between a doctor and patient
- `finance_transactions` records payment data for consultations

---

## Authentication and Authorization

Authentication is handled by **Kinde Auth** with Google OAuth as the identity provider.

### Flow

```
User visits /dashboard
        |
        v
[Server Component: layout.tsx]
        |
        +-- getKindeServerSession()
        |       |
        |       +-- Not authenticated --> redirect('/')
        |       |
        |       +-- Authenticated --> fetch user from DB
        |               |
        |               +-- role === 'patient' --> redirect('/unauthorized')
        |               |
        |               +-- role === 'doctor' --> render dashboard
        |
        +-- <AuthSync />       <-- syncs Kinde user to DB on each load
        +-- <DoctorProfileCheck /> <-- checks profile completeness
        +-- <DashboardLayoutClient> <-- sidebar + content
```

### Key Points

- **Server-side guard**: The dashboard layout is a server component that checks authentication before rendering any child routes.
- **Role enforcement**: Only users with `role = 'doctor'` can access the dashboard. Patient accounts are explicitly redirected.
- **User sync**: The `AuthSync` component ensures the Kinde user is always reflected in the local PostgreSQL database.
- **Profile gating**: `DoctorProfileCheck` displays a blocking modal if the doctor's profile is incomplete, redirecting them to `/dashboard/profile`.

---

## AI Prescription Engine

The portal includes a dual-tier AI prescription system powered by Google Gemini.

### Tier 1: Basic AI Prescription (`/api/ai-prescription`)

- **Model**: Gemini Pro (via REST API)
- **Input**: Diagnosis, symptoms, patient age, patient gender
- **Behavior**: Generates Ayurvedic prescriptions with medicines, dosage, dietary advice, and follow-up scheduling
- **Fallback**: If the API key is missing or the API call fails, intelligent fallback prescriptions are returned based on symptom keyword matching:
  - Digestive issues --> Triphala Churna, Hingwashtak Churna
  - Stress/Anxiety --> Ashwagandha Churna, Brahmi Vati
  - Pain/Joint issues --> Yogaraja Guggulu, Mahayograj Guggulu
  - General --> Chyawanprash, Triphala Churna

### Tier 2: Advanced "Dr. Manas AI" (`/api/ai/generate-prescription`)

- **Model**: Gemini 2.5 Flash (via `@google/generative-ai` SDK)
- **Input**: Patient ID (fetches full context automatically)
- **Context gathered**:
  - Complete patient profile (age, gender, blood group, location)
  - Medical history (allergies, current medications, chronic conditions)
  - Current appointment details (chief complaint, symptoms, doctor notes)
  - Last 3 months of prescription history (up to 5 prescriptions)
  - Recent medication adherence data (last 20 entries)

**Safety checks built into the prompt**:
1. **Allergy cross-check** -- all suggested medicines are checked against patient allergies
2. **Drug interaction screening** -- considers current medications
3. **Chronic condition awareness** -- accounts for ongoing treatments
4. **Location-aware** -- ensures medicines are available in the patient's city/state
5. **Adherence-informed** -- suggests simpler regimens if past adherence was poor
6. **Seasonal awareness** -- considers the current month and patient's geographic location
7. **Medicine type preference** -- prefers Ayurvedic medicines; allows allopathic only for emergencies

**Output format**: Structured JSON with diagnosis, symptoms, medicines (name, dosage, frequency, duration, notes), instructions, diet advice, follow-up date, and safety notes.

---

## Multi-Language Support

Translation is implemented through a three-layer architecture:

```
[TranslatedText Component]
        |
        v
[LanguageContext] --> checks static translations (instant)
        |                      |
        |               not found
        v                      v
[Client cache] -----> [/api/translate] --> [Lingo.dev SDK]
   (in-memory)              |
                            v
                     localizeText()
                     localizeObject()
                     localizeHtml()
```

### Supported Locales

`en`, `es`, `fr`, `de`, `hi`, `zh`, `ar`, `pt`, `ja`, `bn`, `te`, `mr`, `ta`, `gu`

### Usage in Components

```tsx
import { TranslatedText } from '@/app/components/TranslatedText';

// Automatic translation based on selected locale
<TranslatedText>Good Morning</TranslatedText>
```

### Programmatic Translation

```tsx
import { useLanguage } from '@/app/contexts/LanguageContext';

const { translate, translateObject, translateHtml } = useLanguage();

const translated = await translate('Hello, Doctor');
```

---

## Video Call Integration

Video consultations are powered by **ZegoCloud UIKit Prebuilt** with server-side JWT token generation.

### Token Generation Flow

```
Doctor clicks "Start Call"
        |
        v
POST /api/zego-token
  { roomID: appointment.aid, userID: doctor.uid, userName: doctor.name }
        |
        v
Server generates Token04 (HS256 JWT)
  - appId, userId, nonce, ctime, expire (1 hour)
        |
        v
Client initializes ZegoCloud UIKit with token
        |
        v
POST /api/appointments/[aid]/start-call
  - Records call_started_at timestamp
        |
        v
Video call in progress (live timer displayed)
        |
        v
PATCH /api/appointments/[aid]/call-duration
  - Records call_duration_minutes
  - Updates appointment status
```

### Call Features

- 1-on-1 video/audio with screen sharing
- Room ID derived from appointment ID (ensures correct patient-doctor pairing)
- JWT tokens with 1-hour expiry
- Automatic call duration tracking
- Post-call appointment status update to "completed"

---

## Environment Variables

Create a `.env.local` file in the `doctor_view/` directory with the following variables:

```env
# ------------------------------------------
# Database (Neon PostgreSQL)
# ------------------------------------------
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# ------------------------------------------
# Kinde Authentication
# ------------------------------------------
KINDE_CLIENT_ID=your_kinde_client_id
KINDE_CLIENT_SECRET=your_kinde_client_secret
KINDE_ISSUER_URL=https://your-app.kinde.com
KINDE_SITE_URL=http://localhost:3001
KINDE_POST_LOGOUT_REDIRECT_URL=http://localhost:3001
KINDE_POST_LOGIN_REDIRECT_URL=http://localhost:3001/dashboard

# ------------------------------------------
# Google Gemini AI
# ------------------------------------------
GOOGLE_API_KEY=your_google_gemini_api_key

# ------------------------------------------
# ZegoCloud Video Calls
# ------------------------------------------
NEXT_PUBLIC_ZEGO_APP_ID=your_zego_app_id
NEXT_PUBLIC_ZEGO_SERVER_SECRET=your_zego_server_secret

# ------------------------------------------
# Nhost File Storage
# ------------------------------------------
NEXT_PUBLIC_NHOST_SUBDOMAIN=your_nhost_subdomain
NEXT_PUBLIC_NHOST_REGION=your_nhost_region

# ------------------------------------------
# Resend Email
# ------------------------------------------
RESEND_API_KEY=your_resend_api_key

# ------------------------------------------
# Lingo.dev Translation
# ------------------------------------------
LINGODOTDEV_API_KEY=your_lingodotdev_api_key
```

> **Note**: Do not commit `.env.local` to version control. The `.gitignore` file should exclude it by default.

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x (or yarn/pnpm)
- **PostgreSQL** database (Neon recommended for serverless)
- Active accounts for: Kinde, Google AI Studio, ZegoCloud, Nhost, Resend, Lingo.dev

### Installation

1. **Clone the repository** (if not already done):

   ```bash
   git clone <repository-url>
   cd aurasutra-v1/doctor_view
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure environment variables**:

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual credentials
   ```

4. **Set up the database**:

   Ensure your Neon PostgreSQL database has the required tables (see [Database Schema](#database-schema)). SQL migration scripts may be located in the `sql/` directory.

5. **Start the development server**:

   ```bash
   npm run dev
   ```

   The application will be available at **http://localhost:3001**.

6. **Open in browser** and log in with a Google account through Kinde Auth.

---

## Scripts

| Command         | Description                                |
| :-------------- | :----------------------------------------- |
| `npm run dev`   | Start development server on port 3001      |
| `npm run build` | Create optimized production build           |
| `npm run start` | Start production server on port 3001        |
| `npm run lint`  | Run ESLint on the codebase                  |

---

## Deployment

The project is configured for deployment on **Vercel** via `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### Vercel Deployment Steps

1. Connect your repository to Vercel
2. Set the **Root Directory** to `doctor_view`
3. Configure all environment variables in the Vercel dashboard (see [Environment Variables](#environment-variables))
4. Set **KINDE_SITE_URL** and related redirect URLs to your production domain
5. Deploy

### Image Domains

The following remote image domains are whitelisted in `next.config.js`:

- `lh3.googleusercontent.com` -- Google profile pictures
- `avatars.githubusercontent.com` -- GitHub avatars
- `ynwkhelqhehjlxlhhjfj.storage.ap-south-1.nhost.run` -- Nhost file storage

---

## User Flow

```
+------------------+     +------------------+     +---------------------+
|                  |     |                  |     |                     |
|  Landing Page    +---->+  Kinde Login     +---->+  Auth Sync          |
|  (/)             |     |  (Google OAuth)  |     |  (Kinde -> DB)      |
|                  |     |                  |     |                     |
+------------------+     +------------------+     +----------+----------+
                                                             |
                         +-----------------------------------+
                         |
                         v
          +--------------+---------------+
          |                              |
          |  Profile Complete?           |
          |                              |
          +---+--------------------+-----+
              |                    |
              | NO                 | YES
              v                    v
+-------------+--------+   +------+--------------+
| Profile Completion   |   |                     |
| Modal (blocking)     |   |  Dashboard          |
| -> /dashboard/profile|   |  (Stats + Charts)   |
+-----------+----------+   +---+---+---+---+-----+
            |                  |   |   |   |
            +------------------+   |   |   |
                                   |   |   |
              +--------------------+   |   +--------------------+
              |                        |                        |
              v                        v                        v
+-------------+------+  +--------------+------+  +--------------+------+
|                    |  |                     |  |                     |
|  Appointments      |  |  Patients           |  |  Prescriptions      |
|  - Confirm/Decline |  |  - Search/Browse    |  |  - Create (Manual)  |
|  - Start Video Call|  |  - View Detail      |  |  - Create (AI)      |
|  - Complete        |  |  - History          |  |  - Edit / Send      |
|  - Cancel          |  |  - Adherence Rates  |  |  - Track Adherence  |
|                    |  |                     |  |  - Delete (Soft)    |
+--------+-----------+  +---------------------+  +---------------------+
         |
         v
+--------+-----------+
|                    |
|  Video Call        |
|  (ZegoCloud)       |
|  - Live Timer      |
|  - Duration Track  |
|  - Auto-Complete   |
|                    |
+--------------------+
```

---

## License

This project is part of the AuraSutra Ayurvedic Healthcare Platform. All rights reserved.

---

<p align="center">
  Built with care for Ayurvedic practitioners worldwide.
</p>
