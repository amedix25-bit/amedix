import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import {
  CODE_TTL_MINUTES,
  GLOBAL_HOURLY_CAP,
  MAX_ATTEMPTS,
  MAX_SENDS_PER_WINDOW,
  RESEND_COOLDOWN_SECONDS,
  SEND_WINDOW_MINUTES,
  constantTimeEqual,
  generateSixDigitCode,
  hashCode,
  normalizeEmail,
  normalizeLibyanPhone,
  sendEmailCode,
  sendSmsCode,
} from '../../shared/signupOtp.ts';

// Sign-up verification gate. Runs before the existing registration form:
// the visitor proves their phone number (SMS through Resala) or their email
// address (code by email) and only then continues into the unchanged
// registration flow. Codes are stored only as salted hashes, expire after
// 10 minutes, allow 5 attempts, and are rate limited per destination.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action !== 'send' && action !== 'verify') {
      return Response.json({ error: 'Unknown action.' }, { status: 400 });
    }

    const store = base44.asServiceRole.entities.SignupOtp;

    if (action === 'send') {
      const channel = body?.channel === 'sms' ? 'sms' : body?.channel === 'email' ? 'email' : null;
      if (!channel) return Response.json({ error: 'Choose phone or email verification.' }, { status: 400 });

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

      let code = '';
      let providerPinId = '';

      if (channel === 'sms') {
        const apiKey = secrets.get('resala');
        if (!apiKey) {
          return Response.json({ error: 'SMS verification is not configured yet. Please use email verification.' }, { status: 503 });
        }
        try {
          const sent = await sendSmsCode(apiKey, destination);
          code = sent.pin;
          providerPinId = sent.providerPinId;
        } catch (smsError) {
          return Response.json({ error: smsError.message }, { status: 502 });
        }
      } else {
        code = generateSixDigitCode();
        try {
          await sendEmailCode(base44.asServiceRole, destination, code);
        } catch (mailError) {
          return Response.json({ error: mailError.message }, { status: 502 });
        }
      }

      // A newer code always supersedes any code still outstanding.
      await store
        .updateMany({ destination, status: 'pending' }, { $set: { status: 'expired' } })
        .catch(() => null);

      const salt = crypto.randomUUID();
      const challenge = await store.create({
        channel,
        destination,
        challenge_token: crypto.randomUUID(),
        code_hash: await hashCode(code, salt),
        code_salt: salt,
        status: 'pending',
        attempts: 0,
        max_attempts: MAX_ATTEMPTS,
        expires_datetime: new Date(now + CODE_TTL_MINUTES * 60 * 1000).toISOString(),
        cooldown_until: new Date(now + RESEND_COOLDOWN_SECONDS * 1000).toISOString(),
        sent_datetime: new Date(now).toISOString(),
        provider_pin_id: providerPinId,
      });

      return Response.json({
        ok: true,
        channel,
        destination,
        challenge_token: challenge.challenge_token,
        expires_in: CODE_TTL_MINUTES * 60,
        resend_after: RESEND_COOLDOWN_SECONDS,
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
      return Response.json({ error: 'This code has expired. Request a new one.', expired: true }, { status: 400 });
    }

    if (new Date(challenge.expires_datetime).getTime() < Date.now()) {
      await store.update(challenge.id, { status: 'expired' }).catch(() => null);
      return Response.json({ error: 'This code has expired. Request a new one.', expired: true }, { status: 400 });
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