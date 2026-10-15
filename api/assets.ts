import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseAdmin } from '../_lib/supabase'

// In-memory asset simulation (same as original server)
const simulateAssetUpdates = (assets: any[]) => {
  return assets.map(asset => {
    const isVolatile = asset.symbol.includes('GOLD') || asset.symbol.includes('BTC')
    const defaultVolatility = isVolatile ? 0.002 : 0.0004
    
    const open = asset.price
    const rate = asset.trend_rate || 2
    const intervalFraction = 2000 / 60000
    const ratePerInterval = (rate / 100) * intervalFraction

    let bias = 0
    if (asset.trend === 'PUMP') bias = ratePerInterval
    if (asset.trend === 'DUMP') bias = -ratePerInterval
    if (asset.trend === 'STABLE') bias = (Math.random() - 0.5) * (defaultVolatility * 0.1)

    const changePercent = ((Math.random() - 0.5) * defaultVolatility * 0.3) + bias
    const close = open * (1 + changePercent)
    
    const range = Math.abs(close - open)
    const wickMultiplier = isVolatile ? 3 : 1.5
    const high = Math.max(open, close) + (Math.random() * range * wickMultiplier)
    const low = Math.min(open, close) - (Math.random() * range * wickMultiplier)

    const newSparkline = [...(asset.sparkline || []).slice(1), { 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
      open,
      high,
      low,
      close,
      value: close
    }]

    return {
      ...asset,
      price: close,
      change_24h: (asset.change_24h || 0) + (changePercent * 100),
      sparkline: newSparkline
    }
  })
}

let cachedAssets: any[] = null
let lastUpdate = 0

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Fetch from database
    const { data: assets, error } = await supabaseAdmin!
      .from('assets')
      .select('*')
      .order('symbol')

    if (error) throw error

    // Simulate price updates
    const now = Date.now()
    if (!cachedAssets || now - lastUpdate > 2000) {
      cachedAssets = simulateAssetUpdates(assets || [])
      lastUpdate = now
      
      // Update database with new prices (async, don't wait)
      for (const asset of cachedAssets) {
        supabaseAdmin!.from('assets')
          .update({ 
            price: asset.price, 
            change_24h: asset.change_24h,
            sparkline: asset.sparkline,
            updated_at: new Date().toISOString()
          })
          .eq('id', asset.id)
      }
    }

    return res.json(cachedAssets || assets || [])

  } catch (err: any) {
    console.error('[ASSETS]', err)
    return res.status(500).json({ error: 'Failed to fetch assets' })
  }
}