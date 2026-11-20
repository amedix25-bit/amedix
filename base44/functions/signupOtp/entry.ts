import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import {
  GLOBAL_HOURLY_CAP,
  MAX_ATTEMPTS,
  MAX_SENDS_PER_WINDOW,
  RESEND_COOLDOWN_SECONDS,
  SEND_WINDOW_MINUTES,
  codeTtlMinutes,
  constantTimeEqual,
  generateSixDigitCode,
  hashCode,
  hashDestination,
  logRegistrationEvent,
  normalizeEmail,
  normalizeLibyanPhone,
  sendEmailCode,
  sendSmsCode,
} from '../../shared/signupOtp.ts';

// Sign-up / recovery verification gate. The visitor proves their phone number
// (SMS through Resala) or their email address (code by email).
//
// Delivery rules that keep a delayed or repeated email from confusing anyone:
//   • Codes are stored only as salted hashes, expire, allow 5 attempts and are
//     rate limited per destination and overall.
//   • There is at most ONE outstanding challenge per destination. A resend
//     keeps that challenge and its token, so the screen the user already has
//     keeps working and only one code is ever valid.
//   • The previous code is replaced only AFTER the new one was dispatched. If
//     the provider refuses the send, the old code stays valid and the caller is
//     told so instead of being left with nothing.
//   • Every send, resend, failure and verification is recorded in
//     RegistrationEvent (fingerprinted destination, never a code).

function purposeOf(body) {
  return body?.purpose === 'recovery' ? 'recovery' : 'signup';
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (!['send', 'verify', 'status'].includes(action)) {
      return Response.json({ error: 'Unknown action.' }, { status: 400 });
    }

    const service = base44.asServiceRole;
    const store = service.entities.SignupOtp;
    const events = service.entities.RegistrationEvent;

    if (action === 'status') {
      const token = typeof body?.challenge_token === 'string' ? body.challenge_token : '';
      if (!/^[0-9a-fA-F-]{20,64}$/.test(token)) return Response.json({ valid: false });
      const { items } = await store.filter({ challenge_token: token }, { limit: 1 });
      const challenge = items[0];
      if (!challenge) return Response.json({ valid: false, reason: 'unknown' });
      const expiresIn = Math.max(Math.ceil((new Date(challenge.expires_datetime).getTime() - Date.now()) / 1000), 0);
      return Response.json({
        valid: challenge.status === 'pending' && expiresIn > 0,
        status: challenge.status,
        delivery_status: challenge.delivery_status || 'sent',
        expires_in: expiresIn,
        send_count: challenge.send_count || 1,
      });
    }

    if (action === 'send') {
      const channel = body?.channel === 'sms' ? 'sms' : body?.channel === 'email' ? 'email' : null;
      if (!channel) return Response.json({ error: 'Choose phone or email verification.' }, { status: 400 });

      const purpose = purposeOf(body);
      const destination =
        channel === 'sms' ? normalizeLibyanPhone(body?.destination) : normalizeEmail(body?.destination);
      if (!destination) {
        return Response.json(
          {
            error:
              channel === 'sms'
                ? 'Enter a valid Libyan mobile number (091, 092, 093 or 094 followed by 7 digits).'
                : 'Enter a valid email address.',
          },
          { status: 400 }
        );
      }

      const now = Date.now();
      const destinationHash = await hashDestination(destination);

      // Bound the total volume so the endpoint cannot be used to pump out SMS.
      const hourAgo = new Date(now - 60 * 60 * 1000).toISOString();
      const recentTotal = await store.count({ created_date: { $gte: hourAgo } });
      if (recentTotal >= GLOBAL_HOURLY_CAP) {
        return Response.json(
          { error: 'Too many verification requests right now. Please try again in a little while.' },
          { status: 429 }
        );
      }

      const { items } = await store.filter({ destination }, { sort: '-created_date', limit: 10 });

      const lastWait = items[0]?.cooldown_until ? new Date(items[0].cooldown_until).getTime() : 0;
      if (lastWait > now) {
        const retryAfter = Math.ceil((lastWait - now) / 1000);
        return Response.json(
          { error: `Please wait ${retryAfter} seconds before requesting another code.`, retry_after: retryAfter },
          { status: 429 }
        );
      }

      const windowStart = now - SEND_WINDOW_MINUTES * 60 * 1000;
      const recentForDestination = items.filter(
        (item) => new Date(item.created_date).getTime() >= windowStart
      ).length;
      if (recentForDestination >= MAX_SENDS_PER_WINDOW) {
        return Response.json(
          { error: 'Too many codes were requested for this number or email. Please try again later.' },
          { status: 429 }
        );
      }

      // The code that is still usable, if any. A resend re-uses this challenge
      // instead of opening a second one.
      const active = items.find(
        (item) => item.status === 'pending' && new Date(item.expires_datetime).getTime() > now
      );

      let code = '';
      let providerPinId = '';
      let deliveryError = '';

      if (channel === 'sms') {
        const apiKey = secrets.get('resala');
        if (!apiKey) {
          return Response.json(
            { error: 'SMS verification is not configured yet. Please use email verification.' },
            { status: 503 }
          );
        }
        try {
          const sent = await sendSmsCode(apiKey, destination);
          code = sent.pin;
          providerPinId = sent.providerPinId;
        } catch (smsError) {
          deliveryError = smsError.message;
        }
      } else {
        code = generateSixDigitCode();
        try {
          await sendEmailCode(service, destination, code);
        } catch (mailError) {
          deliveryError = mailError.message;
          await logRegistrationEvent(events, 'code_delivery_failed', {
            channel,
            purpose,
            destination_hash: destinationHash,
            detail: String(mailError.delivery || mailError.code || 'provider_rejected'),
          });
        }
      }

      if (deliveryError) {
        // Nothing was replaced: a code the user already received is still
        // valid, and the message says so rather than leaving them stuck.
        return Response.json(
          {
            error: active
              ? `${deliveryError} The code you already received is still valid.`
              : deliveryError,
            previous_code_still_valid: !!active,
          },
          { status: 502 }
        );
      }

      const ttlMinutes = codeTtlMinutes(purpose);
      const expiresDatetime = new Date(now + ttlMinutes * 60 * 1000).toISOString();
      const cooldownUntil = new Date(now + RESEND_COOLDOWN_SECONDS * 1000).toISOString();
      const salt = crypto.randomUUID();
      const codeHash = await hashCode(code, salt);

      if (active) {
        // Replace the code inside the existing challenge — same token, fresh
        // attempts, fresh expiry. Only the newest code works, and the screen
        // the user is already looking at keeps working.
        await store.update(active.id, {
          purpose,
          code_hash: codeHash,
          code_salt: salt,
          attempts: 0,
          max_attempts: MAX_ATTEMPTS,
          status: 'pending',
          expires_datetime: expiresDatetime,
          cooldown_until: cooldownUntil,
          last_sent_datetime: new Date(now).toISOString(),
          send_count: (active.send_count || 1) + 1,
          delivery_status: 'sent',
          delivery_error: '',
          provider_pin_id: providerPinId,
        });

        await logRegistrationEvent(events, 'code_resent', {
          channel,
          purpose,
          destination_hash: destinationHash,
          detail: `send_count:${(active.send_count || 1) + 1}`,
        });

        return Response.json({
          ok: true,
          channel,
          purpose,
          destination,
          challenge_token: active.challenge_token,
          expires_in: ttlMinutes * 60,
          resend_after: RESEND_COOLDOWN_SECONDS,
          replaced: true,
          send_count: (active.send_count || 1) + 1,
        });
      }

      // A newer code supersedes any other outstanding challenge for this
      // destination (an older channel or purpose). This runs only after the new
      // code was successfully dispatched.
      await store
        .updateMany({ destination, status: 'pending' }, { $set: { status: 'expired' } })
        .catch(() => null);

      const challenge = await store.create({
        channel,
        purpose,
        destination,
        challenge_token: crypto.randomUUID(),
        code_hash: codeHash,
        code_salt: salt,
        status: 'pending',
        attempts: 0,
        max_attempts: MAX_ATTEMPTS,
        send_count: 1,
        delivery_status: 'sent',
        delivery_error: '',
        expires_datetime: expiresDatetime,
        cooldown_until: cooldownUntil,
        sent_datetime: new Date(now).toISOString(),
        last_sent_datetime: new Date(now).toISOString(),
        provider_pin_id: providerPinId,
      });

      await logRegistrationEvent(events, 'code_requested', {
        channel,
        purpose,
        destination_hash: destinationHash,
        detail: 'first_send',
      });

      return Response.json({
        ok: true,
        channel,
        purpose,
        destination,
        challenge_token: challenge.challenge_token,
        expires_in: ttlMinutes * 60,
        resend_after: RESEND_COOLDOWN_SECONDS,
        replaced: false,
        send_count: 1,
      });
    }

    // action === 'verify'
    const token = typeof body?.challenge_token === 'string' ? body.challenge_token : '';
    const code = String(body?.code || '').replace(/\D/g, '');

    if (!/^[0-9a-fA-F-]{20,64}$/.test(token)) {
      return Response.json({ error: 'Request a verification code first.' }, { status: 400 });
    }
    if (!/^\d{4,6}$/.test(code)) {
      return Response.json({ error: 'Enter the 6-digit code you received.' }, { status: 400 });
    }

    const { items } = await store.filter({ challenge_token: token }, { limit: 1 });
    const challenge = items[0];
    if (!challenge) {
      return Response.json({ error: 'This code is no longer valid. Request a new one.' }, { status: 404 });
    }

    const destinationHash = await hashDestination(challenge.destination);

    if (challenge.status === 'verified') {
      return Response.json({ ok: true, verified: true, channel: challenge.channel, destination: challenge.destination });
    }
    if (challenge.status === 'locked') {
      return Response.json(
        { error: 'Too many incorrect attempts. Request a new code.', locked: true },
        { status: 429 }
      );
    }
    if (challenge.status !== 'pending') {
      return Response.json(
        { error: 'That code is no longer valid — a newer code was sent. Use the most recent email.', expired: true },
        { status: 400 }
      );
    }

    if (new Date(challenge.expires_datetime).getTime() < Date.now()) {
      await store.update(challenge.id, { status: 'expired' }).catch(() => null);
      return Response.json(
        { error: 'This code has expired. Request a new one.', expired: true },
        { status: 400 }
      );
    }

    const maxAttempts = challenge.max_attempts || MAX_ATTEMPTS;
    if ((challenge.attempts || 0) >= maxAttempts) {
      await store.update(challenge.id, { status: 'locked' }).catch(() => null);
      return Response.json(
        { error: 'Too many incorrect attempts. Request a new code.', locked: true },
        { status: 429 }
      );
    }

    const submitted = await hashCode(code, challenge.code_salt);
    if (!constantTimeEqual(submitted, challenge.code_hash)) {
      const attempts = (challenge.attempts || 0) + 1;
      const locked = attempts >= maxAttempts;
      await store.update(challenge.id, {
        attempts,
        status: locked ? 'locked' : 'pending',
      });
      await logRegistrationEvent(events, 'code_rejected', {
        channel: challenge.channel,
        purpose: challenge.purpose || 'signup',
        destination_hash: destinationHash,
        detail: locked ? `locked_after:${attempts}` : `attempt:${attempts}`,
      });
      return Response.json(
        {
          error: locked
            ? 'Too many incorrect attempts. Request a new code.'
            : `That code is not correct. ${maxAttempts - attempts} attempt${maxAttempts - attempts === 1 ? '' : 's'} left.`,
          attempts_remaining: Math.max(maxAttempts - attempts, 0),
          locked,
        },
        { status: locked ? 429 : 400 }
      );
    }

    await store.update(challenge.id, {
      status: 'verified',
      attempts: (challenge.attempts || 0) + 1,
      verified_datetime: new Date().toISOString(),
    });

    await logRegistrationEvent(events, 'code_verified', {
      channel: challenge.channel,
      purpose: challenge.purpose || 'signup',
      destination_hash: destinationHash,
      detail: `sends:${challenge.send_count || 1}`,
    });

    return Response.json({
      ok: true,
      verified: true,
      channel: challenge.channel,
      destination: challenge.destination,
    });
  } catch (error) {
    return Response.json(
      { error: 'We could not complete the verification. Please try again.' },
      { status: 500 }
    );
  }
}