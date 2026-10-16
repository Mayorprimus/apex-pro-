import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = 'https://smnvuvyybhliwrtgqdgx.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbnZ1dnl5YmhsaXdydGdxZGd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjAxMTIxOCwiZXhwIjoyMTA3NTg3MjE4fQ.uycLaxtbgvhX5LBiz94C7kDjrRPAJSH-sYXvUdDYu5E';
const SUPABASE_HEADERS = {
  'apikey': SUPABASE_SERVICE_KEY,
  'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

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

async function getUserFromSession(sessionId: string) {
  if (!sessionId) return null;
  const session = await sbSingle<any>(`sessions?select=user_id,expires_at&id=eq.${sessionId}`);
  if (!session || new Date(session.expires_at) < new Date()) { if (session) await sb(`sessions?id=eq.${sessionId}`, { method: 'DELETE' }); return null; }
  return sbSingle<any>(`users?select=*&id=eq.${session.user_id}`);
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

  const sessionId = req.headers['x-session-id'] as string;
  let user = null;
  if (sessionId) {
    const session = await sbSingle<any>(`sessions?select=user_id,expires_at&id=eq.${sessionId}`);
    if (!session || new Date(session.expires_at) < new Date()) { if (session) await sb(`sessions?id=eq.${sessionId}`, { method: 'DELETE' }); return res.status(401).json({ error: 'Unauthorized' }); }
    user = await sbSingle<any>(`users?select=*&id=eq.${session.user_id}`);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
  } else {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!user.is_admin) return res.status(403).json({ error: 'Admin access required' });

  try {
    if (action === 'users' && req.method === 'GET') {
      const users = await sb<any[]>(`users?select=id,name,email,balance,status,verified,is_admin,joined,created_at&order=created_at.desc`);
      return res.json(users || []);
    }
    if (action === 'adjust-balance' && req.method === 'POST') {
      const { userId, amount } = req.body;
      if (!userId || typeof amount !== 'number') return res.status(400).json({ error: 'Missing userId or amount' });
      const targetUser = await sbSingle<any>(`users?select=balance&id=eq.${userId}`);
      if (!targetUser) return res.status(404).json({ error: 'User not found' });
      const newBalance = Math.max(0, (targetUser.balance || 0) + amount);
      const updated = await sbSingle<any>(`users?id=eq.${userId}`, { method: 'PATCH', body: JSON.stringify({ balance: newBalance }) });
      if (!updated) throw new Error('Failed to update balance');
      const { password_hash, ...safeUser } = updated;
      return res.json(safeUser);
    }
    if (action === 'set-trend' && req.method === 'POST') {
      const { assetId, trend, trendRate } = req.body;
      if (!assetId || !trend) return res.status(400).json({ error: 'Missing assetId or trend' });
      const validTrends = ['RANDOM', 'PUMP', 'DUMP', 'STABLE'];
      if (!validTrends.includes(trend)) return res.status(400).json({ error: 'Invalid trend' });
      const updateData: any = { trend };
      if (typeof trendRate === 'number') updateData.trend_rate = trendRate;
      const asset = await sbSingle<any>(`assets?id=eq.${assetId}`, { method: 'PATCH', body: JSON.stringify(updateData) });
      if (!asset) return res.status(404).json({ error: 'Asset not found' });
      return res.json(asset);
    }
    if (action === 'update-payment-settings' && req.method === 'POST') {
      const settings = req.body;
      const existing = await sbSingle<any>(`payment_settings?select=id&limit=1`);
      let result;
      if (existing) {
        const updated = await sbSingle<any>(`payment_settings?id=eq.${existing.id}`, { method: 'PATCH', body: JSON.stringify({ ...settings, updated_at: new Date().toISOString() }) });
        if (!updated) throw new Error('Failed to update payment settings');
        result = updated;
      } else {
        const inserted = await sbSingle<any>('payment_settings', { method: 'POST', body: JSON.stringify({ ...settings, updated_at: new Date().toISOString() }) });
        if (!inserted) throw new Error('Failed to insert payment settings');
        result = inserted;
      }
      return res.json(result);
    }
    if (action === 'update-user-status' && req.method === 'POST') {
      const { userId, status, verified } = req.body;
      if (!userId) return res.status(400).json({ error: 'Missing userId' });
      const updateData: any = {};
      if (status) updateData.status = status;
      if (typeof verified === 'boolean') updateData.verified = verified;
      const updated = await sbSingle<any>(`users?id=eq.${userId}`, { method: 'PATCH', body: JSON.stringify(updateData) });
      if (!updated) throw new Error('Failed to update user');
      const { password_hash, ...safeUser } = updated;
      return res.json(safeUser);
    }
    return res.status(404).json({ error: 'Not found' });
  } catch (err: any) {
    console.error('[ADMIN ERROR]', action, err);
    return res.status(500).json({ error: err?.message || 'Admin request failed' });
  }
}