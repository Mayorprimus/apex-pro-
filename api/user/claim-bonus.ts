import type { VercelRequest, VercelResponse } from '@vercel/node'
import { authMiddleware } from '../../_lib/auth'
import { supabaseAdmin } from '../../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await authMiddleware(req, res)
  if (!user) return

  if (user.bonus_claimed) {
    return res.status(400).json({ error: 'Bonus already claimed' })
  }

  try {
    // Get bonus amount from payment settings
    const { data: settings } = await supabaseAdmin!
      .from('payment_settings')
      .select('bonus_amount')
      .limit(1)
      .single()

    const bonusAmount = settings?.bonus_amount || 10000
    const newBalance = (user.balance || 0) + bonusAmount

    const { data: updated, error } = await supabaseAdmin!
      .from('users')
      .update({ 
        balance: newBalance,
        bonus_claimed: true 
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error

    const { password_hash, ...safeUser } = updated
    return res.json({ success: true, balance: newBalance, user: safeUser })

  } catch (err: any) {
    console.error('[CLAIM BONUS]', err)
    return res.status(500).json({ error: 'Failed to claim bonus' })
  }
}