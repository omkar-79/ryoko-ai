# Re-join Behavior Specification (Firebase-Based)

## Overview
Use Firebase to track returning members via a unique `userCode` stored in both localStorage and Firestore.

## User Code System

### What is userCode?
- Unique identifier generated when user first joins any plan
- Stored in:
  1. **localStorage**: `atlas_userCode` (persists across plans)
  2. **Firebase**: Each member document has `userCode` field
- Format: Random alphanumeric string (e.g., "ABC123XYZ", "X7K9M2P")
- Purpose: Identify same user across different plans and devices

### Generation
```typescript
function generateUserCode(): string {
  // Generate 9-character alphanumeric code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 9; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
```

## Re-join Flow

### Scenario 1: First Time User (No userCode)
```
User enters invite code
    ↓
Check localStorage for 'atlas_userCode'
    ↓
Not found → Generate new userCode
    ↓
Store in localStorage: atlas_userCode = "ABC123XYZ"
    ↓
User fills join form (name + preferences)
    ↓
Create member in Firestore:
  - memberId: auto-generated
  - planId: from invite code
  - userCode: "ABC123XYZ"
  - name: user input
  - preferences: user input
  - hasAccount: true
  - joinedAt: now
    ↓
Show plan dashboard
```

### Scenario 2: Returning User (Has userCode)
```
User enters invite code
    ↓
Check localStorage for 'atlas_userCode'
    ↓
Found: "ABC123XYZ"
    ↓
Query Firestore:
  members collection
  WHERE planId = {planId} AND userCode = "ABC123XYZ"
    ↓
    ├─→ Member found:
    │       ↓
    │   Restore member data
    │       ↓
    │   Show "Welcome back, [Name]!" message
    │       ↓
    │   Load plan dashboard with their preferences
    │
    └─→ Member not found:
            ↓
        User fills join form (name + preferences)
            ↓
        Create NEW member in Firestore:
          - memberId: auto-generated
          - planId: from invite code
          - userCode: "ABC123XYZ" (reuse existing)
          - name: user input
          - preferences: user input
          - hasAccount: true
          - joinedAt: now
            ↓
        Show plan dashboard
```

## Firebase Query

### Check if User Already Joined Plan
```typescript
async function checkExistingMember(planId: string, userCode: string) {
  const membersRef = collection(db, 'members');
  const q = query(
    membersRef,
    where('planId', '==', planId),
    where('userCode', '==', userCode)
  );
  
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    // Member exists - return first match
    const memberDoc = querySnapshot.docs[0];
    return {
      id: memberDoc.id,
      ...memberDoc.data()
    };
  }
  
  return null; // No existing member
}
```

## Implementation Code

### Get or Create UserCode
```typescript
function getUserCode(): string {
  let userCode = localStorage.getItem('atlas_userCode');
  
  if (!userCode) {
    // Generate new userCode
    userCode = generateUserCode();
    localStorage.setItem('atlas_userCode', userCode);
  }
  
  return userCode;
}
```

### Join Plan with Re-join Check
```typescript
async function joinPlan(planId: string, name: string, preferences: any) {
  const userCode = getUserCode();
  
  // Check if user already joined this plan
  const existingMember = await checkExistingMember(planId, userCode);
  
  if (existingMember) {
    // Welcome back!
    return {
      member: existingMember,
      isReturning: true
    };
  }
  
  // Create new member
  const memberRef = doc(collection(db, 'members'));
  const newMember = {
    planId,
    userCode,
    name,
    preferences,
    hasAccount: true,
    joinedAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
    status: 'active'
  };
  
  await setDoc(memberRef, newMember);
  
  return {
    member: { id: memberRef.id, ...newMember },
    isReturning: false
  };
}
```

## Benefits

1. **Persistent**: userCode stored in Firebase, survives localStorage clearing
2. **Cross-Device**: If user manually enters userCode on new device, can restore
3. **Multi-Plan**: Same userCode works across multiple plans
4. **Privacy**: No email/phone, just anonymous identifier
5. **Reliable**: Firebase query ensures accurate member lookup

## Edge Cases

### 1. localStorage Cleared
- UserCode lost from localStorage
- Generate new userCode
- Creates new member (even if they had joined before)
- **Note**: This is acceptable - user can still join, just as new member

### 2. Multiple Plans
- Same userCode can be used in multiple plans
- Each plan has separate member document
- Query filters by both planId AND userCode

### 3. UserCode Collision
- Very unlikely (9 chars = 36^9 combinations)
- If collision occurs, Firestore will have separate documents
- Query will return correct member for that plan

### 4. Plan Deleted
- Query returns no results
- User can create new member for new plan
- userCode remains in localStorage for future use

## User Experience

### Welcome Back Message
```
"Welcome back, [Name]! 👋
You're already part of this trip plan.
Your preferences are saved below."
```

### First Time Join
```
"Join [Plan Name] Trip Plan
Enter your name and preferences to join the group."
```

## Future Enhancement: Manual UserCode Entry
- Allow users to manually enter their userCode on new devices
- Store userCode in Firebase, sync across devices
- Optional feature for power users
