# Local Testing Guide

This guide will help you set up and test Ryoko AI Trip Planner locally on your machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Firebase Account** - [Sign up](https://firebase.google.com/)
- **Google Cloud Account** - For API keys
- **Git** (optional, for cloning the repository)

## Step 1: Clone/Download the Project

If you have the project in a repository:
```bash
git clone <repository-url>
cd atlas_-ai-trip-planner
```

Or if you already have the project locally, navigate to the project directory:
```bash
cd atlas_-ai-trip-planner
```

## Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- React and React DOM
- Firebase SDK
- Google GenAI SDK
- Framer Motion
- React Router DOM
- Tailwind CSS
- And other dependencies

## Step 3: Set Up Firebase

Follow the instructions in [`FIREBASE_SETUP.md`](./FIREBASE_SETUP.md) to:
1. Create a Firebase project
2. Enable Firestore Database
3. Enable Authentication (Email/Password and optionally Google)
4. Get your Firebase configuration
5. Set up Firestore security rules (copy from `firestore.rules`)

## Step 4: Get API Keys

You'll need the following API keys:

### 1. Gemini API Key
- Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
- Create a new API key
- Copy the key

### 2. Google Maps API Key
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Enable the following APIs:
  - Maps JavaScript API
  - Places API
  - Geocoding API
  - Static Maps API
- Create credentials (API Key)
- Copy the key

### 3. Firebase Configuration
- From Firebase Console → Project Settings → Your apps
- Copy all Firebase config values

## Step 5: Create Environment File

Create a `.env` file in the project root directory:

```bash
touch .env
```

Add the following environment variables to `.env`:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Gemini API Key
GEMINI_API_KEY=your-gemini-api-key
```

**Important**: 
- Replace all placeholder values with your actual keys
- Never commit `.env` to version control (it's already in `.gitignore`)
- All `VITE_*` variables are embedded at build time and will be visible in the browser

## Step 6: Run the Development Server

```bash
npm run dev
```

The app will start on `http://localhost:3000` (or the next available port).

You should see output like:
```
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

## Step 7: Testing the Application

### Test Flow 1: Creator Registration and Plan Creation

1. **Open the app** in your browser: `http://localhost:3000`
2. **Click "Get Started"** or navigate to Register
3. **Create an account**:
   - Enter email and password
   - Click "Register"
4. **Create a new plan**:
   - Click "Create New Plan"
   - Fill in:
     - Destination (e.g., "Tokyo, Japan")
     - Trip Dates (e.g., "March 15-22, 2024")
     - Your preferences (budget, interests, must-dos, vetos)
   - Click "Create Plan"
5. **Verify**:
   - You should see the plan dashboard
   - Note the invite code in the top right corner
   - You should see yourself as a team member

### Test Flow 2: Member Joining (No Account Required)

1. **Open a new incognito/private browser window** (or use a different browser)
2. **Navigate to** `http://localhost:3000`
3. **Click "Have an invite code?"** or go to `/join`
4. **Enter the invite code** from Flow 1
5. **Select or create a member**:
   - If members exist, select your name
   - If new, click "Join as New Member"
6. **Set a passcode** (remember this for re-joining)
7. **Add your preferences**:
   - Budget range
   - Interests
   - Must-do items
   - Veto items
8. **Submit** and verify you're redirected to the plan dashboard

### Test Flow 3: Re-joining as Member

1. **In the same browser** (or clear localStorage), go to `/join`
2. **Enter the same invite code**
3. **Select your member name** from the list
4. **Enter your passcode**
5. **Verify** you're redirected to the plan dashboard

### Test Flow 4: Generate Itinerary

1. **As the plan creator**, go to the plan dashboard
2. **Verify group preferences** are aggregated from all members
3. **Click "Generate Itinerary"**
4. **Wait for generation** (30-60 seconds):
   - You'll see a loading spinner
   - Console will show progress logs
5. **Verify the itinerary**:
   - Should display day-by-day activities
   - Each activity should have:
     - Time and location
     - Description
     - Google Maps link (if available)
     - Place photos (if available)
   - Hidden gems should appear
   - Hotels should be listed

### Test Flow 5: Edit Group Preferences

1. **As any member** (creator or team member), go to the plan dashboard
2. **Click "Edit"** on any preference section:
   - Group Vibe
   - Must-Do Items
   - Veto Items
3. **Make changes** and click "Save"
4. **Verify** changes are reflected immediately
5. **Open in another browser** to verify real-time updates

### Test Flow 6: Expandable Activity Cards

1. **View an itinerary** (after generation)
2. **Click "View"** on any activity card
3. **Verify**:
   - Card expands to show full details
   - Description is visible
   - Location information is shown
   - "Map" button appears (if Google Maps link exists)
   - Place photo loads (if available)
4. **Click outside** or press `Escape` to close
5. **Click "Map" button** to verify it opens Google Maps in a new tab

## Step 8: Check Browser Console

Open browser DevTools (F12) and check the Console tab for:
- ✅ No errors
- ✅ Firebase connection successful
- ✅ API calls completing
- ✅ Grounding sources being found

Common logs to look for:
```
Starting API call...
API call completed, processing response...
Successfully extracted itinerary JSON
Found X sources
Grounding verification: X Google Maps sources, Y Google Search sources
```

## Step 9: Test Firebase Integration

### Verify Firestore Data

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to Firestore Database
3. Verify collections:
   - `users` - Should have your user document
   - `plans` - Should have your plan document
   - `members` - Should have member documents

### Verify Authentication

1. In Firebase Console → Authentication
2. Verify your user account appears
3. Test logout/login flow in the app

## Common Issues and Solutions

### Issue: "API_KEY environment variable not set"

**Solution**: 
- Check that `GEMINI_API_KEY` is set in `.env`
- Restart the dev server after adding environment variables
- Vite requires `VITE_*` prefix for client-side variables, but `GEMINI_API_KEY` is used server-side in `vite.config.ts`

### Issue: "Firebase: Error (auth/configuration-not-found)"

**Solution**:
- Verify all `VITE_FIREBASE_*` variables are set in `.env`
- Check that values match your Firebase project settings
- Restart the dev server

### Issue: "Google Maps JavaScript API not loaded"

**Solution**:
- Verify `VITE_GOOGLE_MAPS_API_KEY` is set
- Check that Maps JavaScript API is enabled in Google Cloud Console
- Check browser console for API key errors

### Issue: "Missing or insufficient permissions" in Firestore

**Solution**:
- Verify Firestore security rules are deployed
- Check `firestore.rules` file matches the rules in Firebase Console
- Deploy rules: `firebase deploy --only firestore:rules` (if using Firebase CLI)

### Issue: Port 3000 already in use

**Solution**:
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- --port 3001
```

### Issue: Images not loading

**Solution**:
- Check browser console for CORS errors
- Verify Google Maps API key has Places API enabled
- Check that Static Maps API is enabled
- Verify API key restrictions allow your localhost domain

### Issue: Itinerary generation takes too long or times out

**Solution**:
- Check Gemini API quota limits
- Verify API key is valid and has proper permissions
- Check network tab for API call status
- Review console logs for specific errors

## Testing Checklist

Use this checklist to ensure everything works:

- [ ] App loads without errors
- [ ] Can register a new user account
- [ ] Can login with existing account
- [ ] Can create a new plan
- [ ] Invite code is displayed and can be copied
- [ ] Can join plan as a new member (no account)
- [ ] Can re-join plan with passcode
- [ ] Member preferences are saved
- [ ] Group preferences aggregate correctly
- [ ] Can edit group preferences
- [ ] Can generate itinerary
- [ ] Itinerary displays with all activities
- [ ] Activity cards are expandable
- [ ] Google Maps links work
- [ ] Place photos load (if available)
- [ ] Real-time updates work (test in multiple browsers)
- [ ] Logout works correctly

## Debugging Tips

1. **Check Browser Console**: Always check for errors or warnings
2. **Check Network Tab**: Verify API calls are successful
3. **Check Firebase Console**: Verify data is being saved correctly
4. **Use React DevTools**: Inspect component state and props
5. **Check LocalStorage**: Verify `ryoko_userCode` is stored for members

## Next Steps

After local testing is successful:
- Review the code for any improvements
- Test edge cases (empty preferences, long text, special characters)
- Test on different browsers (Chrome, Firefox, Safari)
- Test responsive design on mobile devices
- Prepare for deployment (see `DEPLOYMENT.md`)

## Additional Resources

- [Firebase Setup Guide](./FIREBASE_SETUP.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Architecture Diagram](./ARCHITECTURE_DIAGRAM.md)
- [Vite Documentation](https://vitejs.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Google Maps API Documentation](https://developers.google.com/maps/documentation)

---

**Happy Testing! 🚀**

