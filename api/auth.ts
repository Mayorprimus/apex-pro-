import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = 'https://smnvuvyybhliwrtgqdgx.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbnZ1dnl5YmhsaXdydGdxZGd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjAxMTIxOCwiZXhwIjoyMTA3NTg3MjE4fQ.uycLaxtbgvhX5LBiz94C7kDjrRPAJSH-sYXvUdDYu5E';
const SUPABASE_HEADERS = {
  'apikey': SUPABASE_SERVICE_KEY,
  'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};
const crypto = require('crypto');

async function sb<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: { ...SUPABASE_HEADERS, ...(options.headers || {}) }
  });
  if (!res.ok) { const text = await res.text(); throw new Error(`Supabase ${res.status}: ${text}`); }
  return res.json();
}

async function sbSingle<T>(path: string, options: RequestInit = {}): Promise<T | null> {
  const arr = await sb<T[]>(`${path}&limit=1`, options);
  return arr[0] ?? null;
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  return `pbkdf2_sha256$100000$${salt.toString('base64')}$${hash.toString('base64')}`;
}

function verifyPassword(password: string, hash: string): boolean {
  try {
    const [algo, iterationsStr, saltB64, hashB64] = hash.split('$');
    if (algo !== 'pbkdf2_sha256') return password === hash;
    const iterations = parseInt(iterationsStr, 10);
    const salt = Buffer.from(saltB64, 'base64');
    const expectedHash = Buffer.from(hashB64, 'base64');
    const derived = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256');
    if (derived.length !== expectedHash.length) return false;
    let diff = 0;
    for (let i = 0; i < derived.length; i++) diff |= derived[i] ^ expectedHash[i];
    return diff === 0;
  } catch { return false; }
}

async function getUserFromSession(sessionId: string) {
  if (!sessionId) return null;
  const session = await sbSingle<any>(`sessions?select=user_id,expires_at&id=eq.${sessionId}`);
  if (!session || new Date(session.expires_at) < new Date()) { if (session) await sb(`sessions?id=eq.${sessionId}`, { method: 'DELETE' }); return null; }
  return sbSingle<any>(`users?select=*&id=eq.${session.user_id}`);
}

async function createSession(userId: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await sb('sessions', { method: 'POST', body: JSON.stringify({ id: sessionId, user_id: userId, expires_at: expiresAt }) });
  return sessionId;
}

function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Session-ID');
  if (req.method === 'OPTIONS') { res.status(200).end(); return true; }
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  const action = req.query.action as string;

  try {
    if (action === 'register' && req.method === 'POST') {
      const { name, email, password, phone, country } = req.body;
      const cleanEmail = email?.toLowerCase().trim();
      if (!name || !cleanEmail || !password) return res.status(400).json({ error: 'Missing required fields' });

      await sb('users?select=id&limit=1');

      const existingUser = await sbSingle<any>(`users?select=id&email=eq.${cleanEmail}`);
      if (existingUser) return res.status(400).json({ error: 'This Terminal ID is already commissioned.' });

      const passwordHash = await hashPassword(password);
      const userArr = await sb<any[]>('users', { method: 'POST', body: JSON.stringify({
        name, email: cleanEmail, password_hash: passwordHash,
        phone: phone || 'N/A', country: country || 'N/A',
        balance: 0, equity: 0, margin: 0, free_margin: 0, margin_level: 0,
        status: 'Active', verified: true, is_admin: false,
        joined: new Date().toISOString().split('T')[0], bonus_claimed: false, avatar: null
      }) });
      if (!userArr?.[0]) throw new Error('Database error: user not returned');
      const user = userArr[0];

      const sessionId = await createSession(user.id);
      const { password_hash, ...safeUser } = user;
      return res.json({ user: safeUser, sessionId });
    }

    if (action === 'login' && req.method === 'POST') {
      const { email, password } = req.body;
      const cleanEmail = email?.toLowerCase().trim();
      if (!cleanEmail || !password) return res.status(400).json({ error: 'Email and password required' });

      const user = await sbSingle<any>(`users?select=*&email=eq.${cleanEmail}`);
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      const valid = await verifyPassword(password, user.password_hash);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

      const sessionId = await createSession(user.id);
      const { password_hash, ...safeUser } = user;
      return res.json({ user: safeUser, sessionId });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err: any) {
    console.error('[AUTH ERROR]', action, err);
    return res.status(500).json({ error: err?.message || 'Authentication failed', details: err?.toString() });
  }
}