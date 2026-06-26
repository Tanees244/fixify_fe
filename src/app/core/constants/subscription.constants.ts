import { SubscriptionPlan } from '../models/fixify.models';

export function formatPriceLabel(price: number): string {
  return price === 0 ? '$0/mo' : `$${price}/mo`;
}

export function planById(plans: SubscriptionPlan[], id: string): SubscriptionPlan | undefined {
  return plans.find((p) => p.id === id);
}

export function planLabelFrom(plans: SubscriptionPlan[], id: string): string {
  return planById(plans, id)?.name ?? id;
}

export function planPriceFrom(plans: SubscriptionPlan[], id: string): number {
  return planById(plans, id)?.price ?? 0;
}

export function planColorFrom(plans: SubscriptionPlan[], id: string): string {
  return planById(plans, id)?.color ?? '#6b88ad';
}

/** @deprecated Prefer SubscriptionsDataService.subscriptionPlans (live data). */
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [];
