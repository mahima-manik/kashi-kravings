// Auth utilities — bcrypt password hashing + HMAC signed session cookies
// bcrypt is imported dynamically in password functions to avoid Edge Runtime issues in middleware

export interface SessionPayload {
  role: 'admin' | 'sales_rep';
  email: string;
  userId: string;
  exp: number;
}

const BCRYPT_ROUNDS = 10;

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET env var is not set');
  return secret;
}

export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.default.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.default.compare(password, stored);
}

// --- HMAC session cookies (no DB lookup needed in middleware) ---

function bufToBase64(buf: ArrayBuffer | Uint8Array): string {
  return Buffer.from(buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf).toString('base64');
}

function base64ToBuf(b64: string): ArrayBuffer {
  const buf = Buffer.from(b64, 'base64');
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

async function hmacSign(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getAuthSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return bufToBase64(sig);
}

async function hmacVerify(data: string, signature: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getAuthSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const sigBuf = base64ToBuf(signature);
  return crypto.subtle.verify('HMAC', key, sigBuf, new TextEncoder().encode(data));
}

export async function createSessionCookie(payload: Omit<SessionPayload, 'exp'>): Promise<string> {
  const full: SessionPayload = { ...payload, exp: Date.now() + 24 * 60 * 60 * 1000 }; // 24h
  const json = Buffer.from(JSON.stringify(full)).toString('base64');
  const sig = await hmacSign(json);
  return `${json}.${sig}`;
}

export async function verifySessionCookie(cookieValue: string): Promise<SessionPayload | null> {
  const dotIdx = cookieValue.lastIndexOf('.');
  if (dotIdx === -1) return null;

  const json = cookieValue.slice(0, dotIdx);
  const sig = cookieValue.slice(dotIdx + 1);

  const valid = await hmacVerify(json, sig);
  if (!valid) return null;

  try {
    const payload: SessionPayload = JSON.parse(Buffer.from(json, 'base64').toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
