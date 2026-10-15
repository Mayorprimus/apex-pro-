import type { VercelRequest, VercelResponse } from '@vercel/node'
import { authMiddleware, adminMiddleware } from '../../_lib/auth'
import { supabaseAdmin } from '../../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await authMiddleware(req, res)
  if (!user) return

  const admin = await adminMiddleware(req, res)
  if (!admin) return

  const { userId, status, verified } = req.body

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' })
  }

  try {
    const updateData: any = {}
    if (status) updateData.status = status
    if (typeof verified === 'boolean') updateData.verified = verified

    const { data: updated, error } = await supabaseAdmin!
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    if (!updated) return res.status(404).json({ error: 'User not found' })

    const { password_hash, ...safeUser } = updated
    return res.json(safeUser)

  } catch (err: any) {
    console.error('[ADMIN UPDATE USER STATUS]', err)
    return res.status(500).json({ error: 'Failed to update user' })
  }
}