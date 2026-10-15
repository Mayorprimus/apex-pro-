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

  const { assetId, trend, trendRate } = req.body

  if (!assetId || !trend) {
    return res.status(400).json({ error: 'Missing assetId or trend' })
  }

  const validTrends = ['RANDOM', 'PUMP', 'DUMP', 'STABLE']
  if (!validTrends.includes(trend)) {
    return res.status(400).json({ error: 'Invalid trend' })
  }

  try {
    const updateData: any = { trend }
    if (typeof trendRate === 'number') updateData.trend_rate = trendRate

    const { data: asset, error } = await supabaseAdmin!
      .from('assets')
      .update(updateData)
      .eq('id', assetId)
      .select()
      .single()

    if (error) throw error
    if (!asset) return res.status(404).json({ error: 'Asset not found' })

    return res.json(asset)
  } catch (err: any) {
    console.error('[ADMIN SET TREND]', err)
    return res.status(500).json({ error: 'Failed to set trend' })
  }
}