import type { VercelRequest, VercelResponse } from '@vercel/node'
import { authMiddleware } from '../_lib/auth.js'
import { supabaseAdmin } from '../_lib/supabase.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await authMiddleware(req, res)
  if (!user) return

  // Get user's trades
  const { data: trades } = await supabaseAdmin!
    .from('trades')
    .select('*')
    .eq('user_id', user.id)
    .order('opened_at', { ascending: false })

  // Get user's cards
  const { data: cards } = await supabaseAdmin!
    .from('user_cards')
    .select('*')
    .eq('user_id', user.id)

  // Get user's portfolio
  const { data: portfolio } = await supabaseAdmin!
    .from('portfolio')
    .select('*')
    .eq('user_id', user.id)

  // Calculate equity (balance + open trade profits)
  const openTrades = trades?.filter(t => t.status === 'OPEN') || []
  const openProfit = openTrades.reduce((sum, t) => sum + (t.profit || 0), 0)
  const equity = (user.balance || 0) + openProfit

  const { password_hash, ...safeUser } = user

  return res.json({
    ...safeUser,
    equity,
    margin: user.margin || 0,
    free_margin: user.free_margin || equity,
    margin_level: equity > 0 ? (equity / (user.margin || 1)) * 100 : 0,
    cards: cards || [],
    portfolio: portfolio || [],
    trades: trades || []
  })
}