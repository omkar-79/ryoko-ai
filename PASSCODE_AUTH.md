# Passcode Authentication System

## Overview
Team members set their own passcode when first joining a plan. They use this passcode to authenticate when returning.

## User Flow

### First Time Join
```
User enters invite code
    ↓
Check Firebase: Does member exist for this plan?
    ↓
Not found → Show Join Form:
  - Name (required)
  - Preferences (optional)
  - Set Passcode (required, 4-6 digits)
    ↓
Hash passcode (bcrypt)
    ↓
Create member in Firebase:
  - planId
  - name
  - passcodeHash (hashed)
  - preferences
  - hasAccount: true
  - joinedAt: now
    ↓
Authenticate user (store session)
    ↓
Show plan dashboard
```

### Returning User
```
User enters invite code
    ↓
Query Firebase: Get all members for this plan
    ↓
Show member selection OR name entry
    ↓
User enters their name
    ↓
Find member by name in plan
    ↓
    ├─→ Member found:
    │       ↓
    │   Show passcode entry screen
    │       ↓
    │   User enters passcode
    │       ↓
    │   Verify passcode hash
    │       ↓
    │       ├─→ Correct:
    │       │       ↓
    │       │   Authenticate user
    │       │   Restore session
    │       │   Show "Welcome back, [Name]!"
    │       │   Load plan dashboard
    │       │
    │       └─→ Incorrect:
    │               ↓
    │           Show error message
    │           Allow retry (max 3-5 attempts)
    │
    └─→ Member not found:
            ↓
        Show "Member not found" error
        Option to join as new member
```

## Implementation

### Passcode Requirements
- **Length**: 4-6 characters
- **Format**: Digits only (recommended) or alphanumeric
- **Validation**: Client-side validation before submission
- **Security**: Must be hashed before storing in Firebase

### Passcode Hashing
```typescript
import { hash, compare } from 'bcryptjs';

// When creating member
async function createMember(planId: string, name: string, passcode: string, preferences: any) {
  // Hash the passcode
  const passcodeHash = await hash(passcode, 10); // 10 rounds
  
  const memberRef = doc(collection(db, 'members'));
  await setDoc(memberRef, {
    planId,
    name,
    passcodeHash, // Store hashed version
    preferences,
    hasAccount: true,
    joinedAt: serverTimestamp(),
    status: 'active'
  });
  
  return memberRef.id;
}

// When authenticating
async function authenticateMember(planId: string, name: string, passcode: string) {
  // Find member by planId and name
  const membersRef = collection(db, 'members');
  const q = query(
    membersRef,
    where('planId', '==', planId),
    where('name', '==', name)
  );
  
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    throw new Error('Member not found');
  }
  
  const memberDoc = querySnapshot.docs[0];
  const memberData = memberDoc.data();
  
  // Verify passcode
  const isValid = await compare(passcode, memberData.passcodeHash);
  
  if (!isValid) {
    throw new Error('Incorrect passcode');
  }
  
  // Return member data (without passcodeHash)
  return {
    id: memberDoc.id,
    name: memberData.name,
    preferences: memberData.preferences,
    // Don't return passcodeHash
  };
}
```

### Firebase Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Members collection
    match /members/{memberId} {
      // Allow read if user is authenticated OR if they're querying by planId
      allow read: if request.auth != null || 
                     resource.data.planId == request.resource.data.planId;
      
      // Allow create if providing all required fields
      allow create: if request.resource.data.keys().hasAll(['planId', 'name', 'passcodeHash', 'hasAccount']) &&
                       request.resource.data.hasAccount == true;
      
      // Allow update if user is the member (would need custom auth token)
      // For now, allow update if passcodeHash is not being changed
      allow update: if !request.resource.data.diff(resource.data).affectedKeys().hasAny(['passcodeHash']);
    }
  }
}
```

## UI Components

### 1. Join Form (First Time)
```typescript
interface JoinFormData {
  name: string;
  preferences: {
    budget?: string;
    interests?: string[];
    dietary?: string[];
    accessibility?: string[];
    mustDo?: string[];
    veto?: string[];
  };
  passcode: string;
  confirmPasscode: string;
}
```

### 2. Authentication Form (Returning)
```typescript
interface AuthFormData {
  name: string;
  passcode: string;
}
```

### 3. Member Selection (Optional Enhancement)
- If plan has few members, show list to select from
- User clicks their name, then enters passcode
- Better UX for small groups

## Security Considerations

### 1. Passcode Hashing
- **Never store plain text passcodes**
- Use bcrypt with at least 10 rounds
- Consider using Firebase App Check for additional security

### 2. Rate Limiting
- Limit passcode attempts (e.g., 5 attempts per 15 minutes)
- Store attempt count in Firebase or localStorage
- Show cooldown message if limit reached

### 3. Passcode Strength
- Recommend 6 digits minimum
- Show strength indicator (optional)
- Warn against common passcodes (1234, 0000, etc.)

### 4. Session Management
- Store authenticated session in localStorage or sessionStorage
- Include memberId and planId
- Expire after inactivity (e.g., 7 days)

## Edge Cases

### 1. Multiple Members with Same Name
- Query returns multiple results
- Show selection: "Which [Name] are you?"
- Or: Require unique names per plan (validation)

### 2. Forgotten Passcode
- No recovery mechanism (by design - no email/phone)
- Option: Plan creator can reset member
- Or: Member must re-join with new name

### 3. Passcode Change
- Allow members to change passcode
- Require current passcode verification
- Update hash in Firebase

### 4. Name Change
- Allow members to update name
- Keep same memberId
- Passcode remains the same

## User Experience

### First Time Join
```
"Join [Plan Name] Trip Plan

Enter your details to join:
- Name: [input]
- Preferences: [form]
- Set a passcode (4-6 digits): [input]
- Confirm passcode: [input]

You'll use this passcode to access the plan later."
```

### Returning User
```
"Welcome back to [Plan Name]!

Enter your name: [input]
Enter your passcode: [input]

[Authenticate Button]"
```

### Success Message
```
"Welcome back, [Name]! 👋
You're now logged in to the trip plan."
```

## Benefits

1. **User Control**: Users set their own passcode
2. **Security**: Passcodes are hashed, never stored plain text
3. **Cross-Device**: Works on any device (just need to remember passcode)
4. **Simple**: No email/phone required
5. **Privacy**: Minimal data collection

## Future Enhancements

1. **Biometric Auth**: Use device fingerprint for additional security
2. **Passcode Recovery**: Optional email for passcode reset
3. **Remember Device**: Option to remember device for 30 days
4. **Two-Factor**: Optional 2FA for sensitive operations

