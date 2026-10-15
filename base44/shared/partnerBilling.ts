// Shared partner-advertising billing helpers used by partnerSubscriptionManage,
// adminPartnerManage and patientPartnerAds. Billing is a manual, administrator-
// verified ledger on the PartnerSubscription record until automated card
// billing is connected. A submitted receipt never marks a transaction paid:
// only cash is confirmed at record time; every other method stays pending
// verification until an administrator confirms it, and only confirmed payments
// advance the billing date.
export const DAY_MS = 86400000;

export function planDefaults() {
  return {
    currency: "LYD",
    billing_interval: "month",
    grace_days: 7,
    premium_upgrade_fee: 0,
    intro_offer_enabled: false,
    intro_discount_percent: 0,
    intro_duration_months: 0,
    pharmacy_standard_available: true,
    pharmacy_premium_available: true,
    lab_standard_available: true,
    lab_premium_available: true,
  };
}

export async function loadPlanSettings(base44) {
  const res = await base44.entities.PartnerPlanSettings.filter({}, { limit: 1 });
  const items = res.items || res;
  return items[0] || planDefaults();
}

export function priceFor(settings, partnerType, tier) {
  const v = settings[`${partnerType}_${tier}_price`];
  return typeof v === "number" && v > 0 ? v : null;
}

export function isAvailable(settings, partnerType, tier) {
  return settings[`${partnerType}_${tier}_available`] !== false;
}

// Grace / overdue policy: an unpaid subscription keeps its ad running during
// the grace period (effective 'overdue'); past the grace period the ad stops
// showing (effective 'suspended'). Admin-suspended subs stay suspended.
export function effectiveStatus(sub, settings, now = new Date()) {
  if (sub.status !== "active") return sub.status;
  if (!sub.next_billing_datetime) return "active";
  const overdueMs = now.getTime() - new Date(sub.next_billing_datetime).getTime();
  if (overdueMs <= 0) return "active";
  const grace = (settings.grace_days == null ? 7 : settings.grace_days) * DAY_MS;
  return overdueMs > grace ? "suspended" : "overdue";
}

export function intervalAdvanceMs(interval) {
  return interval === "year" ? 365 * DAY_MS : 30 * DAY_MS;
}

// What the next subscription payment should be, honouring the intro offer.
export function expectedPaymentAmount(sub) {
  const base = sub.price_amount || 0;
  if ((sub.intro_months_remaining || 0) > 0 && (sub.intro_discount_percent || 0) > 0) {
    return Math.round(base * (1 - sub.intro_discount_percent / 100) * 100) / 100;
  }
  return base;
}

// Idempotency: resubmitting the same key returns the existing entry instead of
// creating a duplicate payment record.
export function findExistingPayment(sub, idempotencyKey) {
  if (!idempotencyKey) return null;
  return (sub.payments || []).find((p) => p.idempotency_key && p.idempotency_key === String(idempotencyKey).slice(0, 80)) || null;
}

export function buildPaymentEntry(sub, { amount, method, note, appliesTo, entryType, paymentReference, paymentDate, idempotencyKey }, byName, byRole) {
  const type = entryType || "payment";
  // Refunds and adjustments are administrator actions and are confirmed at
  // record time; cash payments too. Every other method (transfer, card,
  // other) stays pending verification until an administrator confirms it.
  const verification = type !== "payment" || method === "cash" ? "confirmed" : "pending_verification";
  const nowIso = new Date().toISOString();
  return {
    payment_id: `PP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    entry_type: type,
    datetime: nowIso,
    payment_date: paymentDate || nowIso.slice(0, 10),
    amount,
    method: method || "other",
    payment_reference: String(paymentReference || "").trim().slice(0, 120),
    verification,
    verified_by_name: verification === "confirmed" ? (byName || "") : null,
    verified_datetime: verification === "confirmed" ? nowIso : null,
    billing_applied: verification === "confirmed",
    recorded_by_name: byName || "",
    recorded_by_role: byRole || "",
    applies_to: appliesTo || "subscription",
    note: note || "",
    idempotency_key: idempotencyKey ? String(idempotencyKey).slice(0, 80) : "",
  };
}

// Appends a ledger entry and returns the entity update patch. Confirmed
// subscription payments advance the next billing date from the later of now
// and the current next billing date; upgrade-fee payments reduce the
// outstanding fee only; pending-verification payments do not advance billing
// until they are verified.
export function applyPaymentPatch(sub, entry) {
  const payments = [...(sub.payments || []), entry];
  const patch = { payments };
  if (entry.entry_type === "payment" && entry.verification === "confirmed") {
    patch.payments = payments.map((p) => (p.payment_id === entry.payment_id ? { ...p, billing_applied: true } : p));
    if (entry.applies_to === "upgrade_fee") {
      patch.pending_upgrade_fee = Math.max(0, (sub.pending_upgrade_fee || 0) - entry.amount);
    } else {
      const current = sub.next_billing_datetime ? new Date(sub.next_billing_datetime) : null;
      const from = current && current.getTime() > new Date(entry.datetime).getTime() ? current : new Date();
      patch.next_billing_datetime = new Date(
        from.getTime() + intervalAdvanceMs(sub.billing_interval || "month")
      ).toISOString();
      if ((sub.intro_months_remaining || 0) > 0) {
        patch.intro_months_remaining = sub.intro_months_remaining - 1;
      }
    }
  }
  return patch;
}

// Administrator verification of a pending payment: flips the entry to
// confirmed and, the first time only, applies its billing effect. Returns null
// when the entry does not exist or is not pending.
export function verifyPaymentPatch(sub, paymentId, verifierName) {
  const target = (sub.payments || []).find((p) => p.payment_id === paymentId);
  if (!target || target.verification !== "pending_verification") return null;
  const nowIso = new Date().toISOString();
  const payments = (sub.payments || []).map((p) =>
    p.payment_id === paymentId
      ? { ...p, verification: "confirmed", verified_by_name: verifierName, verified_datetime: nowIso }
      : p
  );
  const patch = { payments };
  if (target.entry_type === "payment" && !target.billing_applied) {
    patch.payments = payments.map((p) => (p.payment_id === paymentId ? { ...p, billing_applied: true } : p));
    if (target.applies_to === "upgrade_fee") {
      patch.pending_upgrade_fee = Math.max(0, (sub.pending_upgrade_fee || 0) - target.amount);
    } else {
      const current = sub.next_billing_datetime ? new Date(sub.next_billing_datetime) : null;
      const from = current && current.getTime() > new Date(target.datetime).getTime() ? current : new Date();
      patch.next_billing_datetime = new Date(
        from.getTime() + intervalAdvanceMs(sub.billing_interval || "month")
      ).toISOString();
      if ((sub.intro_months_remaining || 0) > 0) {
        patch.intro_months_remaining = sub.intro_months_remaining - 1;
      }
    }
  }
  return patch;
}

// Audit trail of payment-status changes kept on the subscription.
export function auditEntry(action, byName, paymentId, details) {
  return {
    datetime: new Date().toISOString(),
    action,
    by_name: byName || "",
    payment_id: paymentId || "",
    details: details || "",
  };
}

// The plan view seen by partners — public pricing fields only.
export function publicPlans(settings, partnerType) {
  return {
    currency: settings.currency || "LYD",
    billing_interval: settings.billing_interval || "month",
    grace_days: settings.grace_days == null ? 7 : settings.grace_days,
    premium_upgrade_fee: settings.premium_upgrade_fee || 0,
    intro_offer_enabled: !!settings.intro_offer_enabled,
    intro_discount_percent: settings.intro_discount_percent || 0,
    intro_duration_months: settings.intro_duration_months || 0,
    overdue_policy: settings.overdue_policy || "",
    plan_features: settings.plan_features || [],
    standard: {
      price: priceFor(settings, partnerType, "standard"),
      description: settings[`${partnerType}_standard_description`] || "",
      available: isAvailable(settings, partnerType, "standard"),
    },
    premium: {
      price: priceFor(settings, partnerType, "premium"),
      description: settings[`${partnerType}_premium_description`] || "",
      available: isAvailable(settings, partnerType, "premium"),
    },
  };
}