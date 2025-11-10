# Firestore Security Rules Fix

## Issue
"Missing or insufficient permissions" error when creating a plan.

## Problem
The security rules were checking `resource.data.creatorId` for write operations, but `resource` doesn't exist for new documents. We need to use `request.resource.data` for create operations.

## Solution

### Updated Rules

**Copy and paste these rules into your Firebase Console → Firestore Database → Rules:**

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

## Key Changes

1. **Plans Create Rule**: Changed from checking `resource.data.creatorId` to `request.resource.data.creatorId` for create operations
2. **Separated Operations**: Split read/update/delete from create for better control
3. **Members Read**: Allow read for queries (members authenticate via passcode in app, not Firebase auth)

## How to Apply

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** → **Rules** tab
4. Copy the rules above
5. Paste and replace existing rules
6. Click **Publish**

## Testing

After updating rules:
1. Try creating a plan again
2. Should work without permission errors
3. If you still get errors, check browser console for specific rule violations

## Note

The rules file `firestore.rules` has been created in your project for reference, but you need to manually update them in Firebase Console.
