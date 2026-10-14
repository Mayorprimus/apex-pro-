import type { VercelRequest, VercelResponse } from '@vercel/node'
import { authMiddleware, adminMiddleware } from '../_lib/auth.js'
import { supabaseAdmin } from '../_lib/supabase.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await authMiddleware(req, res)
  if (!user) return

  const admin = await adminMiddleware(req, res)
  if (!admin) return

  try {
    const { data: users, error } = await supabaseAdmin!
      .from('users')
      .select('id, name, email, balance, status, verified, is_admin, joined, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    return res.json(users || [])
  } catch (err: any) {
    console.error('[ADMIN USERS]', err)
    return res.status(500).json({ error: 'Failed to fetch users' })
  }
}