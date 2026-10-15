import type { VercelRequest, VercelResponse } from '@vercel/node';

// ==================== CONSTANTS ====================
const SUPABASE_URL = 'https://smnvuvyybhliwrtgqdgx.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbnZ1dnl5YmhsaXdydGdxZGd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjAxMTIxOCwiZXhwIjoyMTA3NTg3MjE4fQ.uycLaxtbgvhX5LBiz94C7kDjrRPAJSH-sYXvUdDYu5E';

const SUPABASE_HEADERS = {
  'apikey': SUPABASE_SERVICE_KEY,
  'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

// ==================== CORS ====================
export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Session-ID');
  if (req.method === 'OPTIONS') { res.status(200).end(); return true; }
  return false;
}

// ==================== SUPABASE REST API HELPERS ====================
async function sb<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: { ...SUPABASE_HEADERS, ...(options.headers || {}) }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${res.status}: ${text}`);
  }
  return res.json();
}

async function sbSingle<T>(path: string, options: RequestInit = {}): Promise<T | null> {
  const arr = await sb<T[]>(`${path}&limit=1`, options);
  return arr[0] ?? null;
}

// ==================== PASSWORD HASHING (Web Crypto) ====================
// Simple PBKDF2-based hash using Web Crypto API (no external deps)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']
  );
  const hash = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
  const hashBytes = new Uint8Array(hash);
  // Format: pbkdf2_sha256$100000$salt$hash (base64)
  return `pbkdf2_sha256$100000$${btoa(String.fromCharCode(...salt))}$${btoa(String.fromCharCode(...hashBytes))}`;
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    // Expected format: pbkdf2_sha256$iterations$salt$hash
    const [algo, iterationsStr, saltB64, hashB64] = hash.split('$');
    if (algo !== 'pbkdf2_sha256') return password === hash; // fallback for old hashes

    const iterations = parseInt(iterationsStr, 10);
    const salt = new Uint8Array(atob(saltB64).split('').map(c => c.charCodeAt(0)));
    const expectedHash = new Uint8Array(atob(hashB64).split('').map(c => c.charCodeAt(0)));

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']
    );
    const derived = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, 256);
    const derivedBytes = new Uint8Array(derived);

    // Constant-time comparison
    if (derivedBytes.length !== expectedHash.length) return false;
    let diff = 0;
    for (let i = 0; i < derivedBytes.length; i++) diff |= derivedBytes[i] ^ expectedHash[i];
    return diff === 0;
  } catch {
    return false;
  }
}

// ==================== SESSION HELPERS ====================
async function getUserFromSession(sessionId: string) {
  if (!sessionId) return null;
  const session = await sbSingle<any>(`sessions?select=user_id,expires_at&id=eq.${sessionId}`);
  if (!session || new Date(session.expires_at) < new Date()) {
    if (session) await sb(`sessions?id=eq.${sessionId}`, { method: 'DELETE' });
    return null;
  }
  return sbSingle<any>(`users?select=*&id=eq.${session.user_id}`);
}

async function createSession(userId: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await sb('sessions', { method: 'POST', body: JSON.stringify({ id: sessionId, user_id: userId, expires_at: expiresAt }) });
  return sessionId;
}

// ==================== MIDDLEWARE ====================
export async function authMiddleware(req: VercelRequest, res: VercelResponse) {
  const sessionId = req.headers['x-session-id'] as string;
  const user = await getUserFromSession(sessionId);
  if (!user) { res.status(401).json({ error: 'Unauthorized' }); return null; }
  (req as any).user = user;
  return user;
}

export async function adminMiddleware(req: VercelRequest, res: VercelResponse) {
  const user = (req as any).user;
  if (!user || !user.is_admin) { res.status(403).json({ error: 'Admin access required' }); return null; }
  return user;
}

export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Session-ID');
  if (req.method === 'OPTIONS') { res.status(200).end(); return true; }
  return false;
}

// ==================== ASSET SIMULATION ====================
export function simulateAssetUpdates(assets: any[]) {
  return assets.map(asset => {
    const isVolatile = asset.symbol.includes('GOLD') || asset.symbol.includes('BTC');
    const defaultVolatility = isVolatile ? 0.002 : 0.0004;
    const open = asset.price;
    const rate = asset.trend_rate || 2;
    const intervalFraction = 2000 / 60000;
    const ratePerInterval = (rate / 100) * intervalFraction;
    let bias = 0;
    if (asset.trend === 'PUMP') bias = ratePerInterval;
    if (asset.trend === 'DUMP') bias = -ratePerInterval;
    if (asset.trend === 'STABLE') bias = (Math.random() - 0.5) * (defaultVolatility * 0.1);
    const changePercent = ((Math.random() - 0.5) * defaultVolatility * 0.3) + bias;
    const close = open * (1 + changePercent);
    const range = Math.abs(close - open);
    const wickMultiplier = isVolatile ? 3 : 1.5;
    const high = Math.max(open, close) + (Math.random() * range * wickMultiplier);
    const low = Math.min(open, close) - (Math.random() * range * wickMultiplier);
    const newSparkline = [...(asset.sparkline || []).slice(1), {
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      open, high, low, close, value: close
    }];
    return { ...asset, price: close, change_24h: (asset.change_24h || 0) + (changePercent * 100), sparkline: newSparkline };
  });
}

// ==================== EXPORTED HELPERS ====================
export async function getUserFromSession(sessionId: string) {
  if (!sessionId) return null;
  const session = await sbSingle<any>(`sessions?select=user_id,expires_at&id=eq.${sessionId}`);
  if (!session || new Date(session.expires_at) < new Date()) {
    if (session) await sb(`sessions?id=eq.${sessionId}`, { method: 'DELETE' });
    return null;
  }
  return sbSingle<any>(`users?select=*&id=eq.${session.user_id}`);
}

export async function createSession(userId: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await sb('sessions', { method: 'POST', body: JSON.stringify({ id: sessionId, user_id: userId, expires_at: expiresAt }) });
  return sessionId;
}

export { hashPassword, verifyPassword, createSession, getUserFromSession, sb, sbSingle };