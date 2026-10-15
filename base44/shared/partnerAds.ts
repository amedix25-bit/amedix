// Shared advertisement lifecycle rules used by partnerSubscriptionManage,
// adminPartnerManage and patientPartnerAds. Payment, affiliation approval,
// advertisement approval and subscription status are kept as DISTINCT concepts:
// a payment never publishes an unapproved ad, and an ad approval never marks
// an unpaid subscription as paid.
import { effectiveStatus, DAY_MS } from './partnerBilling.ts';

// Allowed advertisement status transitions, validated on every backend change.
export const AD_TRANSITIONS = {
  draft: ['pending_review'],
  pending_review: ['approved', 'rejected', 'draft'],
  approved: ['scheduled', 'published', 'pending_review'],
  scheduled: ['published', 'paused', 'approved', 'pending_review'],
  published: ['paused', 'expired', 'pending_review'],
  paused: ['published', 'expired', 'pending_review'],
  rejected: ['draft', 'pending_review'],
  expired: [],
};

export function canTransition(from, to) {
  return (AD_TRANSITIONS[from] || []).includes(to);
}

// Validates and normalizes advertisement content written by a partner.
// opts.requireContent enforces title + description (needed to submit for review).
export function validateAdContent(input = {}, opts = {}) {
  const patch = {
    title: String(input.title || '').trim().slice(0, 120),
    description: String(input.description || '').trim().slice(0, 1000),
    services: (Array.isArray(input.services) ? input.services : [])
      .map((s) => String(s || '').trim().slice(0, 80)).filter(Boolean).slice(0, 12),
    contact_phone: String(input.contact_phone || '').trim().slice(0, 40),
    hours: String(input.hours || '').trim().slice(0, 120),
  };
  const cover = String(input.cover_url || '').trim();
  if (cover) {
    // Only images uploaded through the app's own public storage are accepted —
    // arbitrary external links (and anything not https) are rejected.
    if (!/^https:\/\/media\.base44\.com\//i.test(cover) || cover.length > 500) {
      return { error: 'The cover image must be uploaded through AMedix — external image links are not accepted' };
    }
    patch.cover_url = cover;
  } else {
    patch.cover_url = '';
  }
  if (patch.contact_phone && !/^[0-9+\-\s()]{3,20}$/.test(patch.contact_phone)) {
    return { error: 'The contact number contains invalid characters' };
  }
  if (opts.requireContent && (!patch.title || !patch.description)) {
    return { error: 'A title and a description are required to submit the advertisement for review' };
  }
  return { patch };
}

// Date validation for scheduling: start before end, both valid dates.
export function validateCampaignDates(start, end) {
  const s = String(start || '').trim();
  const e = String(end || '').trim();
  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  if (s && !dateRe.test(s)) return { error: 'The campaign start date is not a valid date' };
  if (e && !dateRe.test(e)) return { error: 'The campaign end date is not a valid date' };
  if (s && e && s > e) return { error: 'The campaign start date must be before the end date' };
  return { start_date: s || null, end_date: e || null };
}

// Snapshot of partner contact information reused from the existing profile.
export function partnerProfileSnapshot(partnerType, profile) {
  return {
    partner_id: profile.id,
    partner_name: partnerType === 'pharmacy' ? profile.pharmacy_name : profile.lab_name,
    partner_number: partnerType === 'pharmacy' ? profile.pharmacy_number : profile.lab_number,
    partner_logo_url: profile.logo_url || '',
    partner_address: profile.address || '',
    partner_phone: profile.phone || '',
    partner_whatsapp: profile.whatsapp_number || '',
  };
}

// Whether an advertisement may be displayed to patients right now. Kept as a
// pure function so the patient feed, the lifecycle scan and the admin view
// agree. A scheduled ad appears only from its start date; every ad stops after
// its end date. ACTIVE, PAST_DUE (grace period still running) and
// CANCELLATION_PENDING (still within the paid period under the end-of-period
// policy) subscriptions keep their ad; SUSPENDED, PENDING_PAYMENT, CANCELLED
// and pending-approval subscriptions hide it entirely — a suspended
// subscription can never display a Premium advertisement.
export function adDisplayEligible(ad, sub, settings, now = new Date()) {
  if (!sub) return { eligible: false, reason: 'subscription_inactive' };
  const effective = effectiveStatus(sub, settings, now);
  if (!['active', 'past_due', 'cancellation_pending'].includes(effective)) {
    return { eligible: false, reason: 'subscription_inactive', effective };
  }
  const today = now.toISOString().slice(0, 10);
  if (ad.campaign_start_date && today < ad.campaign_start_date) {
    return { eligible: false, reason: 'before_start', effective };
  }
  if (ad.campaign_end_date && today > ad.campaign_end_date) {
    return { eligible: false, reason: 'after_end', effective };
  }
  if (ad.status === 'published') return { eligible: true, reason: 'published', effective };
  if (ad.status === 'scheduled') return { eligible: true, reason: 'in_window', effective };
  return { eligible: false, reason: ad.status, effective };
}