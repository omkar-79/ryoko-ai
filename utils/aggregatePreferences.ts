import { MemberPreferences } from '../types/member';

/**
 * Aggregates member preferences into a group vibe string
 */
export function aggregateGroupVibe(
  preferences: MemberPreferences[],
  baseVibe: string
): string {
  const budgets = preferences.map((p) => p.budget).filter(Boolean);
  const interests = preferences.flatMap((p) => p.interests || []).filter(Boolean);
  const dietary = preferences.flatMap((p) => p.dietary || []).filter(Boolean);

  // Start with base vibe, or empty string if not provided
  let aggregated = baseVibe || '';

  if (budgets.length > 0) {
    const budgetText = budgets.join(', ');
    if (aggregated) {
      aggregated += ` Budget considerations: ${budgetText}.`;
    } else {
      aggregated = `Budget considerations: ${budgetText}.`;
    }
  }

  if (interests.length > 0) {
    const uniqueInterests = [...new Set(interests)];
    const interestsText = uniqueInterests.join(', ');
    if (aggregated) {
      aggregated += ` Group interests include: ${interestsText}.`;
    } else {
      aggregated = `Group interests include: ${interestsText}.`;
    }
  }

  if (dietary.length > 0) {
    const uniqueDietary = [...new Set(dietary)];
    const dietaryText = uniqueDietary.join(', ');
    if (aggregated) {
      aggregated += ` Dietary preferences: ${dietaryText}.`;
    } else {
      aggregated = `Dietary preferences: ${dietaryText}.`;
    }
  }

  return aggregated.trim() || baseVibe || '';
}

/**
 * Aggregates must-do items from all members
 */
export function aggregateMustDo(
  preferences: MemberPreferences[],
  baseMustDo: string
): string {
  const memberMustDos = preferences.flatMap((p) => p.mustDo || []).filter(Boolean);
  
  if (memberMustDos.length === 0) {
    return baseMustDo;
  }

  // Combine base must-do with member must-dos
  const allMustDos = baseMustDo 
    ? [baseMustDo, ...memberMustDos]
    : memberMustDos;

  // Remove duplicates and join
  const uniqueMustDos = [...new Set(allMustDos)];
  return uniqueMustDos.join(', ');
}

/**
 * Aggregates veto items from all members
 */
export function aggregateVeto(
  preferences: MemberPreferences[],
  baseVeto: string
): string {
  const memberVetos = preferences.flatMap((p) => p.veto || []).filter(Boolean);
  
  if (memberVetos.length === 0) {
    return baseVeto;
  }

  // Combine base veto with member vetos
  const allVetos = baseVeto 
    ? [baseVeto, ...memberVetos]
    : memberVetos;

  // Remove duplicates and join
  const uniqueVetos = [...new Set(allVetos)];
  return uniqueVetos.join(', ');
}

