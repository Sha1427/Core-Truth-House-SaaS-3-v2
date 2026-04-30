/**
 * planAccess.js
 * Plan access configuration.
 * Aligns with routeConfig.js plan names (lowercase).
 */
import { ROUTES, PLAN_ORDER, isGated as routeIsGated } from './routeConfig';

// Plan display names and prices for upgrade prompts
export const PLAN_INFO = {
  free:       { name: 'Free',           price: 0,   order: 0, plan: 'free' },
  audit:      { name: 'Brand Audit',    price: 0,   order: 1, plan: 'audit' },
  foundation: { name: 'The Foundation', price: 47,  order: 2, plan: 'foundation' },
  structure:  { name: 'The Structure',  price: 97,  order: 3, plan: 'structure' },
  house:      { name: 'The House',      price: 197, order: 4, plan: 'house' },
  estate:     { name: 'The Estate',     price: 397, order: 5, plan: 'estate' },
};

// Backward compat: map UPPERCASE names to lowercase
const PLAN_NORMALIZE = {
  FREE: 'free', AUDIT: 'audit', FOUNDATION: 'foundation',
  STRUCTURE: 'structure', HOUSE: 'house', ESTATE: 'estate', LEGACY: 'legacy',
  free: 'free', audit: 'audit', foundation: 'foundation',
  structure: 'structure', house: 'house', estate: 'estate', legacy: 'legacy',
};

export function normalizePlan(plan) {
  return PLAN_NORMALIZE[plan] || 'foundation';
}

/**
 * Check if a plan has access to a route.
 */
export function canAccess(userPlan, route, isSuperAdmin = false) {
  if (isSuperAdmin) return true;
  const normalized = normalizePlan(userPlan);
  return !routeIsGated(route, normalized);
}

/**
 * Get the minimum plan required to access a route.
 */
export function getRequiredPlan(route) {
  const r = ROUTES.find(x => x.path === route);
  return r?.requiredPlan || null;
}

/**
 * Get the upgrade target plan info for a locked route.
 */
export function getUpgradeTarget(route) {
  const required = getRequiredPlan(route);
  return required ? PLAN_INFO[required] : PLAN_INFO.foundation;
}
