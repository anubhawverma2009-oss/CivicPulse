<div align="center">

# CivicPulse AI

**Empowering Communities Through Hyperlocal Civic Action**

![Status](https://img.shields.io/badge/Status-Active-green)
![License](https://img.shields.io/badge/License-MIT-blue)
![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)

[🚀 Live Demo](https://civicpulse-ai-81317196678.asia-southeast1.run.app) • [🐞 Report Issue](https://github.com/anubhawverma2009-oss/CivicPulse/issues) • [📂 GitHub Repository](https://github.com/anubhawverma2009-oss/CivicPulse)

</div>

---

## Overview

CivicPulse AI is an AI-powered civic engagement platform that enables citizens to report, verify, and track local infrastructure issues. Using Gemini API for intelligent analysis and Firebase for real-time data, the platform connects citizens with their communities to solve civic problems faster.

---

## Problem Statement

Indian cities face civic infrastructure challenges:
- Potholes and road damage causing accidents
- Non-functional streetlights creating safety hazards
- Garbage accumulation affecting sanitation
- Water leakage wasting resources
- No tracking system for issue resolution
- Poor communication between citizens and authorities

---

## Solution

CivicPulse AI solves this through:
- **AI Analysis**: Gemini API categorizes issues from photos
- **Community Verification**: Citizens vote to confirm issues
- **Real-Time Tracking**: Live updates from report to resolution
- **Interactive Mapping**: Leaflet + OpenStreetMap for location visualization
- **DrishtiBot AI**: Smart chatbot for civic information
- **Rewards System**: Gamified engagement with badges and points

---

## Features

- AI-assisted issue reporting with photo upload
- Smart categorization and severity scoring
- Community verification voting
- Interactive map with location tracking
- Real-time issue feed
- Impact dashboard
- DrishtiBot AI chatbot
- Leaderboard system
- User badges and rewards
- Secure authentication (Email + Google OAuth)
- Fully responsive design

---

## Technology Stack

**Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion

**Backend**: Firebase, Cloud Firestore, Firebase Storage

**AI**: Gemini API

**Mapping**: Leaflet, OpenStreetMap

**Deployment**: Google Cloud Run

---

## Google Technologies

- **Gemini API** - Photo analysis and text generation
- **Firebase Authentication** - User login and registration
- **Cloud Firestore** - Real-time database
- **Firebase Storage** - Image storage
- **Google Cloud Run** - Application hosting

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/anubhawverma2009-oss/CivicPulse.git
cd CivicPulse

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# Run development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Environment Variables

Create `.env.local`:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## Deployment

### Google Cloud Run

```bash
npm run build

gcloud auth login
gcloud config set project YOUR_PROJECT_ID

gcloud run deploy civicpulse-ai \
  --source . \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated
