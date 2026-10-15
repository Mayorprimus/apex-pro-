import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, createSession, verifyPassword, hashPassword, applyCors } from '../_lib/shared';

// POST /api/auth?action=register | ?action=login
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  const action = req.query.action as string;

  try {
    if (action === 'register' && req.method === 'POST') {
      const { name, email, password, phone, country } = req.body;
      const cleanEmail = email?.toLowerCase().trim();
      if (!name || !cleanEmail || !password) return res.status(400).json({ error: 'Missing required fields' });

      const { data: connProbe, error: connError } = await supabaseAdmin.from('users').select('id').limit(1);
      if (connError) throw new Error(`Supabase connection failed: ${connError.message}`);

      const { data: existingUser } = await supabaseAdmin.from('users').select('id').eq('email', cleanEmail).single();
      if (existingUser) return res.status(400).json({ error: 'This Terminal ID is already commissioned.' });

      const passwordHash = await hashPassword(password);
      const { data: user, error } = await supabaseAdmin.from('users').insert({
        name, email: cleanEmail, password_hash: passwordHash,
        phone: phone || 'N/A', country: country || 'N/A',
        balance: 0, equity: 0, margin: 0, free_margin: 0, margin_level: 0,
        status: 'Active', verified: true, is_admin: false,
        joined: new Date().toISOString().split('T')[0], bonus_claimed: false, avatar: null
      }).select().single();
      if (error) throw new Error(`Database error: ${error.message} (code: ${error.code})`);

      const sessionId = await createSession(user.id);
      const { password_hash, ...safeUser } = user;
      return res.json({ user: safeUser, sessionId });
    }

    if (action === 'login' && req.method === 'POST') {
      const { email, password } = req.body;
      const cleanEmail = email?.toLowerCase().trim();
      if (!cleanEmail || !password) return res.status(400).json({ error: 'Email and password required' });

      const { data: connProbe, error: connError } = await supabaseAdmin.from('users').select('id').limit(1);
      if (connError) throw new Error(`Supabase connection failed: ${connError.message}`);

      const { data: user, error } = await supabaseAdmin.from('users').select('*').eq('email', cleanEmail).single();
      if (error || !user) return res.status(401).json({ error: 'Invalid credentials' });

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
