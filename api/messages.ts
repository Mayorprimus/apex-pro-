import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createSupabaseAdmin, authMiddleware, applyCors } from '../_lib/shared';

// GET  /api/messages
// POST /api/messages
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const user = await authMiddleware(req, res);
  if (!user) return;
  const isAdmin = user.is_admin;

  try {
    if (req.method === 'GET') {
      const client = createSupabaseAdmin();
      let query = client.from('messages').select('*').order('created_at', { ascending: true });
      if (!isAdmin) query = query.eq('user_id', user.id);
      const { data: messages, error } = await query;
      if (error) throw error;
      return res.json(messages || []);
    }

    if (req.method === 'POST') {
      const { text, sender } = req.body;
      if (!text) return res.status(400).json({ error: 'Message text required' });
      const messageSender = isAdmin && sender === 'admin' ? 'admin' : 'user';

      const client = createSupabaseAdmin();
      const { data: message, error } = await client.from('messages').insert({
        user_id: user.id, user_name: user.name, sender: messageSender, text
      }).select().single();
      if (error) throw error;
      return res.json(message);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[MESSAGES ERROR]', err);
    return res.status(500).json({ error: err?.message || 'Request failed' });
  }
}