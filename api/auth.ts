import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sb, sbSingle, hashPassword, createSession, verifyPassword, applyCors } from '../_lib/shared';

// POST /api/auth?action=register | ?action=login
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  const action = req.query.action as string;

  try {
    if (action === 'register' && req.method === 'POST') {
      const { name, email, password, phone, country } = req.body;
      const cleanEmail = email?.toLowerCase().trim();
      if (!name || !cleanEmail || !password) return res.status(400).json({ error: 'Missing required fields' });

      // Test connection
      await sb('users?select=id&limit=1');

      const { data: existingUser } = await sbSingle<any>(`users?select=id&email=eq.${cleanEmail}`);
      if (existingUser) return res.status(400).json({ error: 'This Terminal ID is already commissioned.' });

      const passwordHash = await hashPassword(password);
      const { data: user, error } = await sb<any[]>('users', {
        method: 'POST',
        body: JSON.stringify({
          name, email: cleanEmail, password_hash: passwordHash,
          phone: phone || 'N/A', country: country || 'N/A',
          balance: 0, equity: 0, margin: 0, free_margin: 0, margin_level: 0,
          status: 'Active', verified: true, is_admin: false,
          joined: new Date().toISOString().split('T')[0], bonus_claimed: false, avatar: null
        })
      });
      if (error || !user?.[0]) throw new Error(`Database error: ${error}`);
      const user = user[0];

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