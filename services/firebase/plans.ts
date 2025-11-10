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
import { Plan, CreatePlanData } from '../../types/plan';
import { generateInviteCode, generateMagicLink } from '../../utils/inviteCode';
import { removeUndefined } from '../../utils/firebase';
import { aggregateGroupVibe, aggregateMustDo, aggregateVeto } from '../../utils/aggregatePreferences';

/**
 * Safely converts a Firestore timestamp to a Date object
 * Handles Timestamp, Date, or undefined/null values
 */
function toDate(value: any): Date {
  if (!value) {
    return new Date();
  }
  
  // If it's already a Date, return it
  if (value instanceof Date) {
    return value;
  }
  
  // If it's a Firestore Timestamp, convert it
  if (value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  
  // If it's a number (timestamp), convert it
  if (typeof value === 'number') {
    return new Date(value);
  }
  
  // Fallback to current date
  return new Date();
}

/**
 * Create a new plan
 */
export async function createPlan(
  creatorId: string,
  planData: CreatePlanData
): Promise<string> {
  // Generate unique invite code
  let inviteCode = generateInviteCode();
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  // Ensure invite code is unique
  while (!isUnique && attempts < maxAttempts) {
    const existingPlan = await getPlanByInviteCode(inviteCode);
    if (!existingPlan) {
      isUnique = true;
    } else {
      inviteCode = generateInviteCode();
      attempts++;
    }
  }

  if (!isUnique) {
    throw new Error('Failed to generate unique invite code');
  }

  const planRef = doc(collection(db, 'plans'));
  const planId = planRef.id;
  const inviteLink = generateMagicLink(planId);

  const newPlan: Omit<Plan, 'id'> = {
    creatorId,
    ...planData,
    inviteCode,
    inviteLink,
    status: 'draft',
    itinerary: null,
    sources: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    memberIds: [],
  };

  await setDoc(planRef, {
    ...newPlan,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Update user's plansCreated array
  const userRef = doc(db, 'users', creatorId);
  const userDoc = await getDoc(userRef);
  if (userDoc.exists()) {
    const userData = userDoc.data();
    const plansCreated = userData.plansCreated || [];
    await updateDoc(userRef, {
      plansCreated: [...plansCreated, planId],
    });
  }

  return planId;
}

/**
 * Get plan by ID
 */
export async function getPlan(planId: string): Promise<Plan | null> {
  const planRef = doc(db, 'plans', planId);
  const planDoc = await getDoc(planRef);

  if (!planDoc.exists()) {
    return null;
  }

  const data = planDoc.data();
  return {
    id: planDoc.id,
    ...data,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  } as Plan;
}

/**
 * Get plan by invite code
 */
export async function getPlanByInviteCode(
  inviteCode: string
): Promise<Plan | null> {
  const plansRef = collection(db, 'plans');
  const q = query(plansRef, where('inviteCode', '==', inviteCode));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  const planDoc = querySnapshot.docs[0];
  const data = planDoc.data();
  return {
    id: planDoc.id,
    ...data,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  } as Plan;
}

/**
 * Get all plans for a creator
 */
export async function getCreatorPlans(creatorId: string): Promise<Plan[]> {
  const plansRef = collection(db, 'plans');
  const q = query(plansRef, where('creatorId', '==', creatorId));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as Plan;
  });
}

/**
 * Update plan
 */
export async function updatePlan(
  planId: string,
  updates: Partial<Plan>
): Promise<void> {
  const planRef = doc(db, 'plans', planId);
  
  // Remove undefined values before saving (Firebase doesn't allow undefined)
  const cleanedUpdates = removeUndefined({
    ...updates,
    updatedAt: serverTimestamp(),
  });
  
  await updateDoc(planRef, cleanedUpdates);
}

/**
 * Save itinerary to plan
 */
export async function saveItineraryToPlan(
  planId: string,
  itinerary: Plan['itinerary'],
  sources: Plan['sources']
): Promise<void> {
  await updatePlan(planId, {
    itinerary,
    sources,
    status: 'active',
  });
}

/**
 * Update plan with aggregated member preferences
 */
export async function updatePlanWithMemberPreferences(
  planId: string,
  memberPreferences: any[]
): Promise<void> {
  // Get current plan to preserve base values
  const plan = await getPlan(planId);
  if (!plan) {
    throw new Error('Plan not found');
  }

  // Aggregate preferences
  const aggregatedVibe = aggregateGroupVibe(memberPreferences, plan.groupVibe);
  const aggregatedMustDo = aggregateMustDo(memberPreferences, plan.mustDoList);
  const aggregatedVeto = aggregateVeto(memberPreferences, plan.vetoList);

  // Update plan with aggregated values
  await updatePlan(planId, {
    groupVibe: aggregatedVibe,
    mustDoList: aggregatedMustDo,
    vetoList: aggregatedVeto,
  });
}

/**
 * Subscribe to plan updates (real-time)
 */
export function subscribeToPlan(
  planId: string,
  callback: (plan: Plan | null) => void
): () => void {
  const planRef = doc(db, 'plans', planId);

  return onSnapshot(planRef, (planDoc) => {
    if (!planDoc.exists()) {
      callback(null);
      return;
    }

    const data = planDoc.data();
    const plan: Plan = {
      id: planDoc.id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as Plan;
    callback(plan);
  });
}

