import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './config';
import {
  Member,
  CreateMemberData,
  MemberAuthData,
  MemberPublic,
} from '../../types/member';
import { hashPasscode, verifyPasscode } from '../../utils/passcode';

/**
 * Create a new member (first time join)
 */
export async function createMember(
  memberData: CreateMemberData
): Promise<string> {
  // Hash the passcode
  const passcodeHash = await hashPasscode(memberData.passcode);

  const memberRef = doc(collection(db, 'members'));
  const memberId = memberRef.id;

  const newMember: Omit<Member, 'id'> = {
    planId: memberData.planId,
    name: memberData.name,
    passcodeHash,
    preferences: memberData.preferences,
    joinedAt: new Date(),
    lastActiveAt: new Date(),
    status: 'active',
    hasAccount: true,
  };

  await setDoc(memberRef, {
    ...newMember,
    joinedAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  });

  // Update plan's memberIds array
  const planRef = doc(db, 'plans', memberData.planId);
  const planDoc = await getDoc(planRef);
  if (planDoc.exists()) {
    const planData = planDoc.data();
    const memberIds = planData.memberIds || [];
    await updateDoc(planRef, {
      memberIds: [...memberIds, memberId],
      updatedAt: serverTimestamp(),
    });
  }

  return memberId;
}

/**
 * Authenticate member (returning user)
 */
export async function authenticateMember(
  authData: MemberAuthData
): Promise<MemberPublic | null> {
  // Find member by planId and name
  const membersRef = collection(db, 'members');
  const q = query(
    membersRef,
    where('planId', '==', authData.planId),
    where('name', '==', authData.name)
  );

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null; // Member not found
  }

  const memberDoc = querySnapshot.docs[0];
  const memberData = memberDoc.data() as Member;

  // Verify passcode
  const isValid = await verifyPasscode(authData.passcode, memberData.passcodeHash);

  if (!isValid) {
    throw new Error('Incorrect passcode');
  }

  // Update lastActiveAt
  await updateDoc(memberDoc.ref, {
    lastActiveAt: serverTimestamp(),
  });

  // Return public member data (without passcodeHash)
  return {
    id: memberDoc.id,
    planId: memberData.planId,
    name: memberData.name,
    preferences: memberData.preferences,
    joinedAt: (memberData.joinedAt as Timestamp)?.toDate() || new Date(),
    status: memberData.status,
  };
}

/**
 * Get member by ID
 */
export async function getMember(memberId: string): Promise<MemberPublic | null> {
  const memberRef = doc(db, 'members', memberId);
  const memberDoc = await getDoc(memberRef);

  if (!memberDoc.exists()) {
    return null;
  }

  const data = memberDoc.data() as Member;
  return {
    id: memberDoc.id,
    planId: data.planId,
    name: data.name,
    preferences: data.preferences,
    joinedAt: (data.joinedAt as Timestamp)?.toDate() || new Date(),
    status: data.status,
  };
}

/**
 * Get all members for a plan
 */
export async function getPlanMembers(planId: string): Promise<MemberPublic[]> {
  const membersRef = collection(db, 'members');
  const q = query(membersRef, where('planId', '==', planId));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => {
    const data = doc.data() as Member;
    return {
      id: doc.id,
      planId: data.planId,
      name: data.name,
      preferences: data.preferences,
      joinedAt: (data.joinedAt as Timestamp)?.toDate() || new Date(),
      status: data.status,
    };
  });
}

/**
 * Check if member exists for a plan by name
 */
export async function checkMemberExists(
  planId: string,
  name: string
): Promise<boolean> {
  const membersRef = collection(db, 'members');
  const q = query(
    membersRef,
    where('planId', '==', planId),
    where('name', '==', name)
  );

  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}

/**
 * Update member preferences
 */
export async function updateMemberPreferences(
  memberId: string,
  preferences: Member['preferences']
): Promise<void> {
  const memberRef = doc(db, 'members', memberId);
  await updateDoc(memberRef, {
    preferences,
    lastActiveAt: serverTimestamp(),
  });
}

/**
 * Subscribe to plan members (real-time updates)
 */
export function subscribeToPlanMembers(
  planId: string,
  callback: (members: MemberPublic[]) => void
): () => void {
  const membersRef = collection(db, 'members');
  const q = query(membersRef, where('planId', '==', planId));

  return onSnapshot(q, (querySnapshot) => {
    const members: MemberPublic[] = querySnapshot.docs.map((doc) => {
      const data = doc.data() as Member;
      return {
        id: doc.id,
        planId: data.planId,
        name: data.name,
        preferences: data.preferences,
        joinedAt: (data.joinedAt as Timestamp)?.toDate() || new Date(),
        status: data.status,
      };
    });
    callback(members);
  });
}

