// Shared helpers for the AMedix sign-up verification gate (phone / email OTP).
// Nothing here ever reveals a code: codes are hashed with a per-challenge salt
// and compared in constant time, and the Resala API key stays server-side.

export const RESALA_BASE_URL = 'https://dev.resala.ly/api/v1';
export const RESALA_SERVICE_NAME = 'AMedix';

export const CODE_TTL_MINUTES = 10;
export const RESEND_COOLDOWN_SECONDS = 60;
export const SEND_WINDOW_MINUTES = 15;
export const MAX_SENDS_PER_WINDOW = 3;
export const MAX_ATTEMPTS = 5;
export const GLOBAL_HOURLY_CAP = 200;

// Libyan mobile: 091 / 092 / 093 / 094 followed by 7 digits.
// Accepts 0911234567, 218911234567, +218 91 123 4567 and spaced or dashed forms.
export function normalizeLibyanPhone(input) {
  const digits = String(input || '').replace(/[^\d]/g, '');
  let local = digits;
  if (local.startsWith('00218')) local = local.slice(5);
  else if (local.startsWith('218')) local = local.slice(3);
  if (local.startsWith('0')) local = local.slice(1);
  if (!/^9[1-4]\d{7}$/.test(local)) return null;
  return `218${local}`;
}

export function normalizeEmail(input) {
  const value = String(input || '').trim().toLowerCase();
  if (value.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return null;
  return value;
}

export function generateSixDigitCode() {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const value = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  return String(value % 1000000).padStart(6, '0');
}

export async function hashCode(code, salt) {
  const data = new TextEncoder().encode(`${salt}:${code}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Length-safe comparison that does not leak where two strings differ.
export function constantTimeEqual(a, b) {
  const left = String(a || '');
  const right = String(b || '');
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) {
    diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return diff === 0;
}

// Sends the verification code by SMS through Resala and returns the generated
// PIN together with the provider message id. The PIN never leaves the server.
export async function sendSmsCode(apiKey, phone) {
  const url = new URL(`${RESALA_BASE_URL}/pins`);
  url.searchParams.set('service_name', RESALA_SERVICE_NAME);
  url.searchParams.set('len', '6');

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ phone }),
    signal: AbortSignal.timeout(15000),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const type = String(data?.type || '');
    const messages = {
      AccountExpired: 'SMS verification is unavailable because the AMedix SMS account has expired. Please use email verification.',
      InsufficientCredit: 'SMS verification is temporarily unavailable. Please use email verification.',
      Unauthorized: 'SMS verification is not configured correctly. Please use email verification.',
      TokenExpired: 'SMS verification is not configured correctly. Please use email verification.',
      InputValidation: 'Enter a valid Libyan mobile number (091, 092, 093 or 094).',
      BadRequest: 'The mobile number could not be accepted. Please check it and try again.',
    };
    const error = new Error(messages[type] || 'The SMS could not be sent right now. Please try again or use email verification.');
    error.code = response.status;
    throw error;
  }

  const pin = String(data?.pin || '');
  if (!/^\d{4,6}$/.test(pin)) {
    const error = new Error('The SMS could not be sent right now. Please try again or use email verification.');
    error.code = 502;
    throw error;
  }

  return { pin, providerPinId: String(data?.id || ''), senderName: String(data?.sender_name || '') };
}

// Sends the verification code by email as a transactional message.
export async function sendEmailCode(serviceRole, email, code) {
  const html = `
    <div style="background:#f3f5f7;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:24px;overflow:hidden;">
        <tr><td style="background:#17334f;padding:20px 28px;color:#ffffff;font-size:18px;font-weight:700;">AMedix</td></tr>
        <tr><td style="padding:28px;">
          <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#17334f;">Verify your email address</p>
          <p style="margin:0 0 20px;font-size:14px;color:#667185;line-height:1.6;">Enter this code to continue creating your AMedix account.</p>
          <p style="margin:0 0 20px;font-size:34px;font-weight:700;letter-spacing:8px;color:#17334f;">${code}</p>
          <p style="margin:0;font-size:13px;color:#667185;line-height:1.6;">This code expires in ${CODE_TTL_MINUTES} minutes. If you did not request it, you can ignore this email.</p>
        </td></tr>
      </table>
    </div>`;

  const result = await serviceRole.integrations.Core.SendEmail({
    to: email,
    subject: 'Your AMedix verification code',
    html,
    text: `Your AMedix verification code is ${code}. It expires in ${CODE_TTL_MINUTES} minutes.`,
    category: 'transactional',
  });

  if (result && result.success === false) {
    const error = new Error('The email could not be sent right now. Please try again or use phone verification.');
    error.code = 502;
    throw error;
  }
  return result;
}