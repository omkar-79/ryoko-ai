<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Ryoko AI Trip Planner

An AI-powered group trip planner that creates personalized itineraries using Google Gemini API and Google Maps.

**Live Demo**: [https://ryoko-ai-trip-planner-upoylsikiq-uc.a.run.app](https://ryoko-ai-trip-planner-upoylsikiq-uc.a.run.app)

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- Firebase account
- Google Cloud account (for API keys)

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the project root with:
   ```env
   VITE_FIREBASE_API_KEY=your-firebase-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
   GEMINI_API_KEY=your-gemini-api-key
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## Documentation

- **[Local Testing Guide](./LOCAL_TESTING.md)** - Comprehensive guide for testing locally
- **[Firebase Setup](./FIREBASE_SETUP.md)** - Firebase project setup instructions
- **[Deployment Guide](./DEPLOYMENT.md)** - Deploy to Google Cloud Run
- **[Architecture Diagram](./ARCHITECTURE_DIAGRAM.md)** - System architecture overview
- **[Project Description](./PROJECT_DESCRIPTION.md)** - Full project documentation

## Features

- 🤝 **Group Collaboration** - Easy invite system for team members
- 🎯 **Preference Aggregation** - Combines everyone's preferences into one plan
- 🤖 **AI-Powered** - Uses Google Gemini with Maps Grounding for accurate itineraries
- 🗺️ **Real Location Data** - Verified places with photos and Google Maps links
- ⚡ **Real-time Updates** - Live synchronization across all users
- 🎨 **Beautiful UI** - Modern, travel-friendly interface

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication)
- **AI**: Google Gemini 2.5 Pro with Maps & Search Grounding
- **Maps**: Google Maps JavaScript API, Places API
- **Deployment**: Docker, nginx, Google Cloud Run

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## License

Private project - All rights reserved
