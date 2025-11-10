# Atlas AI Trip Planner - User Profiles & Group Planning Architecture

## Overview
Add user authentication, group planning, and team collaboration features using Firebase.

## User Flows

### 1. Plan Creator Flow
1. **Registration/Login** (Required for creating plans)
   - Email/Password or Google OAuth
   - Creates user profile in Firestore
   - Gets authenticated session

2. **Create Group Plan**
   - Fill in trip details (destination, dates, etc.)
   - System generates unique invite code (6-8 digits)
   - System generates magic link (shareable URL)
   - Plan saved to Firestore with creator as owner

3. **Invite Team Members**
   - Share invite code or magic link
   - View pending/active members
   - See member preferences

4. **Generate Itinerary**
   - Aggregate all member preferences
   - Generate itinerary considering group preferences
   - Save itinerary to plan

### 2. Team Member Flow (Passcode-Based Authentication)
1. **Receive Invite**
   - Via code: Enter code on landing page
   - Via magic link: Click link, auto-joins plan

2. **First Time Join**
   - Enter invite code
   - Fill join form:
     - **Name** (required)
     - **Preferences** (optional):
       - Budget range
       - Interests (food, culture, adventure, etc.)
       - Dietary restrictions
       - Accessibility needs
       - Veto items
     - **Set Passcode** (required, 4-6 digits or alphanumeric)
   - Information stored in Firebase
   - Member can now access plan

3. **Returning User Authentication**
   - Enter invite code
   - System checks if member exists for this plan
   - If found: Show passcode entry screen
   - User enters their passcode
   - If correct: Authenticate and restore session
   - If incorrect: Show error, allow retry
   - If member not found: Show first-time join form

4. **View Plan**
   - See trip details
   - See other members
   - Update preferences (requires passcode verification)
   - View itinerary (when generated)

## Firebase Services

### 1. Firebase Authentication
- **Plan Creators**: Email/Password or Google OAuth
- **Team Members**: Anonymous auth (optional) or no auth (just store in Firestore)

### 2. Cloud Firestore Database Structure

```
users/
  {userId}/
    email: string
    displayName: string
    createdAt: timestamp
    plansCreated: string[] (planIds)

plans/
  {planId}/
    creatorId: string
    destination: string
    tripDates: string
    groupVibe: string
    mustDoList: string
    vetoList: string
    inviteCode: string (unique, 6-8 digits)
    inviteLink: string (magic link URL)
    status: 'draft' | 'active' | 'completed'
    itinerary: Itinerary | null
    sources: GroundingChunk[]
    createdAt: timestamp
    updatedAt: timestamp
    members: {
      [memberId]: Member
    }

members/
  {memberId}/
    planId: string
    name: string
    passcode: string (hashed password, stored securely in Firebase)
    preferences: {
      budget?: string
      interests?: string[]
      dietary?: string[]
      accessibility?: string[]
      mustDo?: string[]
      veto?: string[]
    }
    joinedAt: timestamp
    lastActiveAt: timestamp
    status: 'pending' | 'active'
    hasAccount: boolean (true once member is created with passcode)
```

### 3. Security Rules (Firestore)
- Plans: Creator can read/write, members can read
- Members: Creator can read/write, member can read/update own data
- Users: Users can read/write own data

## Implementation Plan

### Phase 1: Firebase Setup
1. Install Firebase SDK
2. Initialize Firebase config
3. Set up Firestore
4. Create security rules

### Phase 2: Authentication
1. Create Auth context/provider
2. Login/Register components
3. Protected routes for plan creators
4. Auth state management

### Phase 3: Plan Management
1. Create plan service (Firestore operations)
2. Generate invite codes (unique, check for duplicates)
3. Generate magic links
4. Plan creation UI
5. Plan dashboard (view plans, members, etc.)

### Phase 4: Team Member Features
1. Join plan by code component
2. Join plan by magic link (URL parameter)
3. Member preferences form
4. Member list display
5. Real-time member updates (Firestore listeners)

### Phase 5: Enhanced Itinerary Generation
1. Aggregate member preferences
2. Update prompt to include member preferences
3. Save itinerary to plan
4. Share itinerary with all members

### Phase 6: UI/UX Enhancements
1. Plan sharing UI (copy code/link)
2. Member management UI
3. Preferences aggregation view
4. Real-time collaboration indicators

## Technical Decisions

### Invite Code Generation
- 6-8 digit alphanumeric code
- Check uniqueness in Firestore
- Store in plan document
- Valid for plan lifetime
- **Reusable**: Same code can be used by multiple people to join
- **Persistent**: Code works until plan is deleted/completed

### Magic Link Format
- `https://yourapp.com/join/{planId}?token={uniqueToken}`
- Token stored in plan document
- One-time use or reusable (decide based on security needs)

### Member Identification & Authentication
- No email/phone required
- Use Firestore document ID as memberId
- **Passcode System**: User sets their own passcode when first joining
  - Format: 4-6 digits or alphanumeric (user's choice)
  - Stored in Firebase: Hashed using bcrypt or similar
  - Used to authenticate returning users
- **First Time Join Flow**:
  1. User enters invite code
  2. Query Firestore: Check if any member exists for this plan with their name
  3. If not found: Show join form (name + preferences + set passcode)
  4. Hash passcode and store in Firebase
  5. Create member document with hasAccount = true
- **Returning User Flow**:
  1. User enters invite code
  2. Query Firestore: Get all members for this plan
  3. Show member selection or name entry
  4. User enters their name
  5. Find member by name in plan
  6. If found: Show passcode entry screen
  7. User enters passcode
  8. Verify passcode hash matches stored hash
  9. If correct: Authenticate and restore session
  10. If incorrect: Show error, allow retry
- **Security**:
  - Passcodes are hashed (never store plain text)
  - Use bcrypt or Firebase's built-in hashing
  - Rate limiting on passcode attempts (optional)
- **Benefits**: 
  - User controls their authentication
  - Works across devices (just need to remember passcode)
  - Secure (hashed passwords)
  - Simple UX (no email/phone needed)

### Real-time Updates
- Use Firestore real-time listeners
- Update UI when members join/update preferences
- Show live member count

## File Structure

```
src/
  components/
    auth/
      Login.tsx
      Register.tsx
      AuthProvider.tsx
    plan/
      CreatePlan.tsx
      PlanDashboard.tsx
      InviteMembers.tsx
      MemberList.tsx
      MemberPreferences.tsx
      JoinPlan.tsx
  services/
    firebase/
      config.ts
      auth.ts
      plans.ts
      members.ts
  contexts/
    AuthContext.tsx
    PlanContext.tsx
  types/
    user.ts
    plan.ts
    member.ts
  utils/
    inviteCode.ts
    magicLink.ts
```

## Next Steps
1. Install Firebase dependencies
2. Set up Firebase project
3. Create Firebase config
4. Implement authentication
5. Build plan creation flow
6. Add team member features
7. Integrate with existing itinerary generation

