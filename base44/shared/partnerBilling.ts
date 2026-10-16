// Shared partner-advertising billing helpers used by partnerSubscriptionManage,
// adminPartnerManage, partnerLifecycleScan and patientPartnerAds. Billing is a
// manual, administrator-verified ledger on the PartnerSubscription record until
// automated card billing is connected. A submitted receipt never marks a
// transaction paid: only cash is confirmed at record time; every other method
// stays pending verification until an administrator confirms it, and only
// confirmed payments advance the billing date.
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
    cancellation_policy: "end_of_period",
    pharmacy_standard_available: true,
    pharmacy_premium_available: true,
    lab_standard_available: true,
    lab_premium_available: true,
    hospital_standard_available: true,
    hospital_premium_available: true,
  };
}

export async function loadPlanSettings(base44) {
  const res = await base44.entities.PartnerPlanSettings.filter({}, { limit: 1 });
  const items = res.items || res;
  return items[0] || planDefaults();
}

// Settings field prefix: the schema stores laboratory fields as lab_* —
// pharmacy_* matches directly.
export function planPrefix(partnerType) {
  return partnerType === "laboratory" ? "lab" : partnerType;
}

export function priceFor(settings, partnerType, tier) {
  const v = settings[`${planPrefix(partnerType)}_${tier}_price`];
  return typeof v === "number" && v > 0 ? v : null;
}

export function isAvailable(settings, partnerType, tier) {
  return settings[`${planPrefix(partnerType)}_${tier}_available`] !== false;
}

// Explicit subscription lifecycle. ACTIVE is the only entitlement state:
// a subscription reaches it only after the affiliation and administrative
// approval AND a verified payment. Renewal dates come from the configured
// billing interval; an unpaid billing date is PAST_DUE during the configured
// grace period (the ad keeps running) and SUSPENDED past it (the paid
// advertising entitlement is suspended, so no Premium advertisement shows).
export function effectiveStatus(sub, settings, now = new Date()) {
  const st = sub.status;
  if (st !== "active" && st !== "past_due") return st;
  if (!sub.next_billing_datetime) return "active";
  const overdueMs = now.getTime() - new Date(sub.next_billing_datetime).getTime();
  if (overdueMs <= 0) return "active";
  const grace = (settings.grace_days == null ? 7 : settings.grace_days) * DAY_MS;
  return overdueMs > grace ? "suspended" : "past_due";
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
// and the current next billing date (a verified renewal extends the
// subscription according to the billing policy); upgrade-fee payments reduce
// the outstanding fee only; pending-verification payments do not advance
// billing until they are verified.
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

// Applies an approved tier/price change that was scheduled for a future
// effective date (the next renewal), so the terms of an already-paid period
// are never changed mid-period. Returns the patch to merge, or null when
// nothing is due yet.
export function scheduledTierPatch(sub, adsEntity, now = new Date()) {
  if (!sub.scheduled_tier || !sub.price_effective_datetime) return null;
  if (now.getTime() < new Date(sub.price_effective_datetime).getTime()) return null;
  return {
    tier: sub.scheduled_tier,
    price_amount: sub.scheduled_price_amount != null ? sub.scheduled_price_amount : sub.price_amount,
    scheduled_tier: null,
    scheduled_price_amount: null,
    price_effective_datetime: null,
  };
}

// The state transitions a verified subscription payment produces. A first
// payment activates a PENDING_PAYMENT subscription; a renewal payment caught
// up after the billing date clears PAST_DUE; an automatic overdue suspension
// is lifted by a caught-up payment (an administrator suspension always
// requires an explicit reinstatement).
export function paymentStatusPatch(sub, patch) {
  const paidNow = patch.next_billing_datetime;
  if (!paidNow) return patch;
  if (sub.status === "pending_payment") {
    patch.status = "active";
    if (!sub.start_datetime) patch.start_datetime = new Date().toISOString();
    patch.suspension_reason = null;
  } else if (sub.status === "past_due") {
    patch.status = "active";
    patch.suspension_reason = null;
  } else if (sub.status === "suspended" && String(sub.suspension_reason || "").startsWith("Overdue")) {
    patch.status = "active";
    patch.suspension_reason = null;
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

// Audit trail of sensitive ADMINISTRATIVE subscription actions (approval,
// suspension, reinstatement, cancellation, change decisions) — who did what
// and when. Kept on the subscription record next to the payment audit.
export function adminAuditEntry(action, byName, details) {
  return {
    datetime: new Date().toISOString(),
    action,
    by_name: byName || "",
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
    cancellation_policy: settings.cancellation_policy || "end_of_period",
    plan_features: settings.plan_features || [],
    standard: {
      price: priceFor(settings, partnerType, "standard"),
      description: settings[`${planPrefix(partnerType)}_standard_description`] || "",
      available: isAvailable(settings, partnerType, "standard"),
    },
    premium: {
      price: priceFor(settings, partnerType, "premium"),
      description: settings[`${planPrefix(partnerType)}_premium_description`] || "",
      available: isAvailable(settings, partnerType, "premium"),
    },
  };
}