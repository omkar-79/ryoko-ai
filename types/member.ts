export interface MemberPreferences {
  budget?: string;
  interests?: string[];
  dietary?: string[];
  accessibility?: string[];
  mustDo?: string[];
  veto?: string[];
}

export interface Member {
  id: string;
  planId: string;
  name: string;
  passcodeHash: string; // Hashed passcode, never expose to client
  preferences: MemberPreferences;
  joinedAt: Date;
  lastActiveAt: Date;
  status: 'pending' | 'active';
  hasAccount: boolean;
}

export interface CreateMemberData {
  planId: string;
  name: string;
  passcode: string; // Plain text, will be hashed
  preferences: MemberPreferences;
}

export interface MemberAuthData {
  planId: string;
  name: string;
  passcode: string; // Plain text for verification
}

// Member data without sensitive information (for client-side use)
export interface MemberPublic {
  id: string;
  planId: string;
  name: string;
  preferences: MemberPreferences;
  joinedAt: Date;
  status: 'pending' | 'active';
}

