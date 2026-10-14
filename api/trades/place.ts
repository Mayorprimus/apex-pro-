import type { VercelRequest, VercelResponse } from '@vercel/node'
import { authMiddleware } from '../_lib/auth.js'
import { supabaseAdmin } from '../_lib/supabase.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await authMiddleware(req, res)
  if (!user) return

  const { type, lot } = req.body
  const assetId = req.query.asset as string

  if (!assetId || !type || !lot) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  if (lot <= 0 || lot > user.balance) {
    return res.status(400).json({ error: 'Invalid position size' })
  }

  try {
    // Get current asset price
    const { data: asset } = await supabaseAdmin!
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .single()

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' })
    }

    // Binary options: fixed 88% payout
    const payoutRate = 0.88
    const profit = lot * payoutRate

    // Simulate win/loss (in real app, this would be based on actual price movement)
    // For demo, let's make it 50/50 with slight house edge
    const isWin = Math.random() > 0.48
    const finalProfit = isWin ? profit : -lot
    const status = isWin ? 'CLOSED' : 'CLOSED'

    // Create trade record
    const { data: trade, error } = await supabaseAdmin!
      .from('trades')
      .insert({
        user_id: user.id,
        symbol: asset.symbol,
        type,
        lot,
        open_price: asset.price,
        close_price: asset.price * (isWin ? 1.0001 : 0.9999),
        profit: finalProfit,
        status: 'CLOSED',
        opened_at: new Date().toISOString(),
        closed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Update user balance
    const newBalance = Math.max(0, (user.balance || 0) + finalProfit)
    await supabaseAdmin!
      .from('users')
      .update({ balance: newBalance })
      .eq('id', user.id)

    return res.json({ 
      trade, 
      newBalance,
      isWin,
      profit: finalProfit
    })

  } catch (err: any) {
    console.error('[PLACE TRADE]', err)
    return res.status(500).json({ error: 'Trade failed' })
  }
}