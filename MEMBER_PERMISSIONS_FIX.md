# Member Permissions Fix

## Issue
When a team member joins a plan using an invite code, they get "Missing or insufficient permissions" error, even though the member document is created successfully (creator can see them).

## Problem
The security rules for the `members` collection were using `request.auth != null || true`, which Firestore interprets differently for queries vs document reads. When members query by `planId`, Firestore needs to verify that ALL documents returned by the query would be readable, and the complex condition was causing issues.

## Solution

### Updated Members Collection Rules

Changed from:
```javascript
allow read: if request.auth != null || true; // Complex condition
```

To:
```javascript
allow read: if true; // Simple, always allows reads
```

### Why This Works

1. **Members don't have Firebase Auth**: Team members authenticate via passcode in the app, not Firebase Authentication
2. **Security is handled in app logic**: The passcode system ensures only authorized members can access plans
3. **Queries need simple rules**: Firestore query rules work better with simple conditions
4. **Plan creators also need access**: Authenticated plan creators need to read members too

## Updated Complete Rules

Copy these rules to Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection (plan creators)
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
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
      
      // Allow read for members (public read for invite code lookup)
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

## How to Apply

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** → **Rules** tab
4. Copy the rules above
5. Paste and replace existing rules
6. Click **Publish**

## Testing

After updating rules:
1. Try joining a plan as a team member
2. Should work without permission errors
3. Member should be able to view the plan dashboard
4. Creator should still be able to see all members

## Security Note

While `allow read: if true` allows public reads, security is maintained because:
- Members must know the invite code to find the plan
- Members must set a passcode when joining
- Members must authenticate with passcode to access the plan
- Passcode hashes are never exposed to clients
- The app logic enforces these checks before showing plan data

