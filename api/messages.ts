import type { VercelRequest, VercelResponse } from '@vercel/node'
import { authMiddleware, adminMiddleware } from '../_lib/auth.js'
import { supabaseAdmin } from '../_lib/supabase.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await authMiddleware(req, res)
  if (!user) return

  const isAdmin = user.is_admin

  if (req.method === 'GET') {
    try {
      let query = supabaseAdmin!
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })

      if (!isAdmin) {
        query = query.eq('user_id', user.id)
      }

      const { data: messages, error } = await query
      if (error) throw error

      return res.json(messages || [])
    } catch (err: any) {
      console.error('[MESSAGES GET]', err)
      return res.status(500).json({ error: 'Failed to fetch messages' })
    }
  }

  if (req.method === 'POST') {
    const { text, sender } = req.body
    
    if (!text) {
      return res.status(400).json({ error: 'Message text required' })
    }

    // Regular users can only send as 'user'
    const messageSender = isAdmin && sender === 'admin' ? 'admin' : 'user'

    try {
      const { data: message, error } = await supabaseAdmin!
        .from('messages')
        .insert({
          user_id: user.id,
          user_name: user.name,
          sender: messageSender,
          text
        })
        .select()
        .single()

      if (error) throw error

      return res.json(message)
    } catch (err: any) {
      console.error('[MESSAGES POST]', err)
      return res.status(500).json({ error: 'Failed to send message' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}