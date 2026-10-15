import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------- CORS ----------
export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Session-ID');
  if (req.method === 'OPTIONS') { res.status(200).end(); return true; }
  return false;
}

// ---------- Lazy Supabase (created per-request) ----------
function createSupabaseAdmin() {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    'https://smnvuvyybhliwrtgqdgx.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbnZ1dnl5YmhsaXdydGdxZGd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjAxMTIxOCwiZXhwIjoyMTA3NTg3MjE4fQ.uycLaxtbgvhX5LBiz94C7kDjrRPAJSH-sYXvUdDYu5E',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ---------- Lazy bcrypt ----------
function getBcrypt() {
  return require('bcryptjs');
}

// ---------- Session helpers ----------
async function getUserFromSession(sessionId: string) {
  if (!sessionId) return null;
  const client = createSupabaseAdmin();
  const { data: session } = await client.from('sessions').select('user_id, expires_at').eq('id', sessionId).single();
  if (!session || new Date(session.expires_at) < new Date()) {
    if (session) await client.from('sessions').delete().eq('id', sessionId);
    return null;
  }
  const { data: user } = await client.from('users').select('*').eq('id', session.user_id).single();
  return user;
}

async function createSession(userId: string): Promise<string> {
  const client = createSupabaseAdmin();
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await client.from('sessions').insert({ id: sessionId, user_id: userId, expires_at: expiresAt.toISOString() });
  return sessionId;
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = getBcrypt();
  try { return await bcrypt.compare(password, hash); } catch { return password === hash; }
}

async function hashPassword(password: string): Promise<string> {
  const bcrypt = getBcrypt();
  return await bcrypt.hash(password, 10);
}

// ---------- Middleware ----------
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

// ---------- Asset simulation ----------
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

// Export the factory functions so handlers can use them
export { createSupabaseAdmin, getBcrypt, hashPassword, verifyPassword, createSession, getUserFromSession };