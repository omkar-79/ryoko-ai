export interface User {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Date;
  plansCreated: string[]; // Array of planIds
}

export interface UserProfile {
  email: string;
  displayName: string;
}

