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

  const isAdmin = user.is_admin;

  try {
    if (req.method === 'GET') {
      let query = `messages?select=*&order=created_at.asc`;
      if (!isAdmin) query += `&user_id=eq.${user.id}`;
      const messages = await sb<any[]>(query);
      return res.json(messages || []);
    }
    if (req.method === 'POST') {
      const { text, sender } = req.body;
      if (!text) return res.status(400).json({ error: 'Message text required' });
      const messageSender = isAdmin && sender === 'admin' ? 'admin' : 'user';
      const msgData = { user_id: user.id, user_name: user.name, sender: messageSender, text };
      const message = await sbSingle<any>('messages', { method: 'POST', body: JSON.stringify(msgData) });
      if (!message) throw new Error('Failed to insert message');
      return res.json(message);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[MESSAGES ERROR]', err);
    return res.status(500).json({ error: err?.message || 'Request failed' });
  }
}