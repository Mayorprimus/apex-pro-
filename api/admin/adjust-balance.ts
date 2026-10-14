import type { VercelRequest, VercelResponse } from '@vercel/node'
import { authMiddleware, adminMiddleware } from '../_lib/auth.js'
import { supabaseAdmin } from '../_lib/supabase.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await authMiddleware(req, res)
  if (!user) return

  const admin = await adminMiddleware(req, res)
  if (!admin) return

  const { userId, amount } = req.body

  if (!userId || typeof amount !== 'number') {
    return res.status(400).json({ error: 'Missing userId or amount' })
  }

  try {
    const { data: targetUser, error: fetchError } = await supabaseAdmin!
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single()

    if (fetchError || !targetUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    const newBalance = Math.max(0, (targetUser.balance || 0) + amount)

    const { data: updated, error } = await supabaseAdmin!
      .from('users')
      .update({ balance: newBalance })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    const { password_hash, ...safeUser } = updated
    return res.json(safeUser)

  } catch (err: any) {
    console.error('[ADMIN ADJUST BALANCE]', err)
    return res.status(500).json({ error: 'Failed to adjust balance' })
  }
}