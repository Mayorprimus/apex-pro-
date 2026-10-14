import type { VercelRequest, VercelResponse } from '@vercel/node'
import { authMiddleware } from '../_lib/auth.js'
import { supabaseAdmin } from '../_lib/supabase.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await authMiddleware(req, res)
  if (!user) return

  const { name, phone, country } = req.body

  try {
    const updateData: any = {}
    if (name) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (country !== undefined) updateData.country = country

    const { data: updated, error } = await supabaseAdmin!
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error

    const { password_hash, ...safeUser } = updated
    return res.json(safeUser)

  } catch (err: any) {
    console.error('[UPDATE PROFILE]', err)
    return res.status(500).json({ error: 'Failed to update profile' })
  }
}