# Firebase Setup Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name: `atlas-ai-trip-planner` (or your preferred name)
4. Disable Google Analytics (optional) or enable if you want analytics
5. Click "Create project"
6. Wait for project to be created, then click "Continue"

## Step 2: Enable Firestore Database

1. In Firebase Console, click "Firestore Database" in left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (we'll update security rules later)
4. Select a location (choose closest to your users)
5. Click "Enable"

## Step 3: Enable Authentication

1. Click "Authentication" in left sidebar
2. Click "Get started"
3. Enable "Email/Password" provider:
   - Click "Email/Password"
   - Toggle "Enable" 
   - Click "Save"
4. (Optional) Enable "Google" provider for OAuth login

## Step 4: Get Firebase Configuration

1. Click the gear icon ⚙️ next to "Project Overview"
2. Click "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon `</>` to add a web app
5. Register app:
   - App nickname: "Atlas AI Trip Planner"
   - Check "Also set up Firebase Hosting" (optional)
   - Click "Register app"
6. Copy the Firebase configuration object (looks like this):

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Step 5: Set Up Security Rules

1. Go to Firestore Database
2. Click "Rules" tab
3. Replace with these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection (plan creators)
    match /users/{userId} {
      // Users can read/write their own data
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow create during registration
      allow create: if request.auth != null && request.auth.uid == userId;
    }
    
    // Plans collection
    match /plans/{planId} {
      // Allow create if user is authenticated and setting themselves as creator
      allow create: if request.auth != null && 
                       request.resource.data.creatorId == request.auth.uid;
      
      // Creator can read/update/delete their own plans
      allow read, update, delete: if request.auth != null && 
                                     resource.data.creatorId == request.auth.uid;
      
      // Allow read for members (we'll handle member auth separately via passcode)
      // For now, allow public read - members will authenticate via passcode in the app
      allow read: if true;
    }
    
    // Members collection
    match /members/{memberId} {
      // Allow read for all (members authenticate via passcode in app, not Firebase auth)
      // Plan creators (authenticated) and members (unauthenticated) both need to read
      allow read: if true;
      
      // Allow create with required fields (no auth needed - members don't have Firebase auth)
      allow create: if request.resource.data.keys().hasAll(['planId', 'name', 'passcodeHash', 'hasAccount']) &&
                       request.resource.data.hasAccount == true &&
                       request.resource.data.passcodeHash is string &&
                       request.resource.data.passcodeHash.size() > 0;
      
      // Allow update if not changing passcodeHash
      // Members authenticate via passcode in app logic
      allow update: if !request.resource.data.diff(resource.data).affectedKeys().hasAny(['passcodeHash']);
    }
  }
}
```

4. Click "Publish"

## Step 6: Create Indexes (if needed)

Firestore will prompt you to create indexes when you run queries. Click the link in error messages to create them automatically.

## Step 7: Environment Variables

Create a `.env` file in your project root:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_API_KEY=your-gemini-api-key
```

**Important**: Add `.env` to `.gitignore` if not already there!

## Next Steps

After setup, we'll:
1. Install Firebase SDK and dependencies
2. Create Firebase configuration file
3. Set up authentication services
4. Implement passcode hashing
5. Build the UI components

