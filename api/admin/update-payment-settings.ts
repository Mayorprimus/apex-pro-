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

  const settings = req.body

  try {
    // Get the first (and only) payment settings record
    const { data: existing } = await supabaseAdmin!
      .from('payment_settings')
      .select('id')
      .limit(1)
      .single()

    let result
    if (existing) {
      const { data, error } = await supabaseAdmin!
        .from('payment_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()
      
      if (error) throw error
      result = data
    } else {
      const { data, error } = await supabaseAdmin!
        .from('payment_settings')
        .insert({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      result = data
    }

    return res.json(result)
  } catch (err: any) {
    console.error('[ADMIN UPDATE PAYMENT]', err)
    return res.status(500).json({ error: 'Failed to update payment settings' })
  }
}