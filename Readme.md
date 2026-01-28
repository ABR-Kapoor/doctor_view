# AuraSutra Doctor Portal

A comprehensive doctor portal for the AuraSutra Ayurvedic healthcare platform.

## 🚀 Features

- **Dashboard**: Overview of appointments, patients, and statistics
- **Appointment Management**: View, confirm, and manage patient appointments
- **Patient Records**: Access patient information and medical history
- **Prescription Management**: Create and manage prescriptions
- **Video Consultations**: Integrated video calling for online appointments
- **Profile Management**: Update professional information and credentials

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and database
- Kinde authentication account
- ZegoCloud account (for video calls)
- Google Gemini API key (for AI features)

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL scripts in order:
   - `Project_DB.sql` - Creates tables and schema
   - `Project_DB_Functions.sql` - Creates functions and triggers

### 3. Environment Variables

Copy `.env.local` and update with your credentials:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Kinde Auth
KINDE_CLIENT_ID=your_client_id
KINDE_CLIENT_SECRET=your_client_secret
KINDE_ISSUER_URL=https://your-domain.kinde.com
KINDE_SITE_URL=http://localhost:3001
KINDE_POST_LOGOUT_REDIRECT_URL=http://localhost:3001
KINDE_POST_LOGIN_REDIRECT_URL=http://localhost:3001/dashboard

# ZegoCloud Video
NEXT_PUBLIC_ZEGO_APP_ID=your_app_id
NEXT_PUBLIC_ZEGO_SERVER_SECRET=your_server_secret

# Google Gemini AI
GOOGLE_API_KEY=your_gemini_api_key

# Razorpay Payments (Optional)
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3001](http://localhost:3001)

## 📁 Project Structure

```
doctor_view/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Doctor dashboard pages
│   ├── page.tsx           # Landing page
│   └── layout.tsx         # Root layout
├── lib/                   # Shared utilities
│   └── shared/           # Database and auth helpers
├── public/               # Static assets
├── Logos/                # Logo files
├── .env.local           # Environment variables
├── Project_DB.sql       # Database schema
└── Project_DB_Functions.sql  # Database functions
```

## 🎨 Key Pages

- **/** - Doctor portal landing page
- **/dashboard** - Doctor dashboard with stats
- **/dashboard/appointments** - Manage appointments
- **/dashboard/patients** - View patient records
- **/dashboard/prescriptions** - Manage prescriptions
- **/dashboard/profile** - Update profile
- **/dashboard/video-call/[id]** - Video consultation

## 🔧 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Kinde Auth
- **Video Calls**: ZegoCloud
- **AI**: Google Gemini
- **UI Components**: Radix UI, Lucide Icons

## 📦 Build for Production

```bash
npm run build
npm start
```

## 🚀 Deployment

See `vercel_deployment_guide.md` for detailed Vercel deployment instructions.

### Quick Deploy to Vercel

1. Import this directory as a new project
2. Set all environment variables
3. Deploy!

## 🔐 Security Notes

- Never commit `.env.local` to git
- Keep service role keys secure
- Update Kinde callback URLs for production
- Enable RLS policies in Supabase

## 📝 License

Private - AuraSutra Healthcare Platform

## 🤝 Support

For issues or questions, contact the development team.