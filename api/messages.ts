import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sb, sbSingle, authMiddleware, applyCors } from '../_lib/shared';

// GET  /api/messages
// POST /api/messages
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const user = await authMiddleware(req, res);
  if (!user) return;
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