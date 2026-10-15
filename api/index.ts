import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

// ============================================
// SUPABASE HELPERS (inlined) - Hardcoded Legacy keys
// ============================================
const supabaseUrl = 'https://smnvuvyybhliwrtgqdgx.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbnZ1dnl5YmhsaXdydGdxZGd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjAxMTIxOCwiZXhwIjoyMTA3NTg3MjE4fQ.uycLaxtbgvhX5LBiz94C7kDjrRPAJSH-sYXvUdDYu5E'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false } })

async function getUserFromSession(sessionId: string) {
  if (!sessionId || !supabaseAdmin) return null
  const { data: session } = await supabaseAdmin.from('sessions').select('user_id, expires_at').eq('id', sessionId).single()
  if (!session || new Date(session.expires_at) < new Date()) {
    if (session) await supabaseAdmin.from('sessions').delete().eq('id', sessionId)
    return null
  }
  const { data: user } = await supabaseAdmin.from('users').select('*').eq('id', session.user_id).single()
  return user
}

async function createSession(userId: string): Promise<string> {
  if (!supabaseAdmin) throw new Error('No supabase admin client')
  const sessionId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  await supabaseAdmin.from('sessions').insert({ id: sessionId, user_id: userId, expires_at: expiresAt.toISOString() })
  return sessionId
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try { return await bcrypt.compare(password, hash) } catch { return password === hash }
}

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10)
}

// ============================================
// MIDDLEWARE
// ============================================
async function authMiddleware(req: VercelRequest, res: VercelResponse) {
  const sessionId = req.headers['x-session-id'] as string
  const user = await getUserFromSession(sessionId)
  if (!user) { res.status(401).json({ error: 'Unauthorized' }); return null }
  ;(req as any).user = user
  return user
}

async function adminMiddleware(req: VercelRequest, res: VercelResponse) {
  const user = (req as any).user
  if (!user || !user.is_admin) { res.status(403).json({ error: 'Admin access required' }); return null }
  return user
}

// ============================================
// ASSET SIMULATION
// ============================================
function simulateAssetUpdates(assets: any[]) {
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
    const newSparkline = [...(asset.sparkline || []).slice(1), { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), open, high, low, close, value: close }]
    return { ...asset, price: close, change_24h: (asset.change_24h || 0) + (changePercent * 100), sparkline: newSparkline }
  })
}

let cachedAssets: any[] = null
let lastUpdate = 0

// ============================================
// MAIN HANDLER
// ============================================
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Session-ID')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const url = new URL(req.url || '', `https://${req.headers.host}`)
  const path = url.pathname.replace('/api', '')

  try {
    // ===== PUBLIC ROUTES =====

    // GET /api/assets
    if (path === '/assets' && req.method === 'GET') {
      const { data: assets, error } = await supabaseAdmin!.from('assets').select('*').order('symbol')
      if (error) throw error
      const now = Date.now()
      if (!cachedAssets || now - lastUpdate > 2000) {
        cachedAssets = simulateAssetUpdates(assets || [])
        lastUpdate = now
        for (const asset of cachedAssets) {
          supabaseAdmin!.from('assets').update({ price: asset.price, change_24h: asset.change_24h, sparkline: asset.sparkline, updated_at: new Date().toISOString() }).eq('id', asset.id)
        }
      }
      return res.json(cachedAssets || assets || [])
    }

    // GET /api/payment-settings
    if (path === '/payment-settings' && req.method === 'GET') {
      const { data: settings, error } = await supabaseAdmin!.from('payment_settings').select('*').limit(1).single()
      if (error) throw error
      return res.json(settings || {})
    }

    // POST /api/auth/register
    if (path === '/auth/register' && req.method === 'POST') {
      const { name, email, password, phone, country } = req.body
      const cleanEmail = email?.toLowerCase().trim()
      if (!name || !cleanEmail || !password) return res.status(400).json({ error: 'Missing required fields' })
      try {
        const { data: existingUser } = await supabaseAdmin!.from('users').select('id').eq('email', cleanEmail).single()
        if (existingUser) return res.status(400).json({ error: 'This Terminal ID is already commissioned.' })
        const passwordHash = await hashPassword(password)
        const { data: user, error } = await supabaseAdmin!.from('users').insert({
          name, email: cleanEmail, password_hash: passwordHash,
          phone: phone || 'N/A', country: country || 'N/A',
          balance: 0, equity: 0, margin: 0, free_margin: 0, margin_level: 0,
          status: 'Active', verified: true, is_admin: false,
          joined: new Date().toISOString().split('T')[0], bonus_claimed: false, avatar: null
        }).select().single()
        if (error) { console.error('[REGISTER DB ERROR]', error); throw error }
        const sessionId = await createSession(user.id)
        const { password_hash, ...safeUser } = user
        return res.json({ user: safeUser, sessionId })
      } catch (err: any) {
        console.error('[REGISTER ERROR]', err)
        return res.status(500).json({ error: err?.message || 'Registration failed' })
      }
    }

    // POST /api/auth/login
    if (path === '/auth/login' && req.method === 'POST') {
      const { email, password } = req.body
      const cleanEmail = email?.toLowerCase().trim()
      if (!cleanEmail || !password) return res.status(400).json({ error: 'Email and password required' })
      try {
        const { data: user, error } = await supabaseAdmin!.from('users').select('*').eq('email', cleanEmail).single()
        if (error || !user) return res.status(401).json({ error: 'Invalid credentials' })
        const valid = await verifyPassword(password, user.password_hash)
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' })
        const sessionId = await createSession(user.id)
        const { password_hash, ...safeUser } = user
        return res.json({ user: safeUser, sessionId })
      } catch (err: any) {
        console.error('[LOGIN ERROR]', err)
        return res.status(500).json({ error: err?.message || 'Login failed' })
      }
    }

    // ===== PROTECTED USER ROUTES =====
    const user = await authMiddleware(req, res)
    if (!user) return

    // GET /api/user/me
    if (path === '/user/me' && req.method === 'GET') {
      const { data: trades } = await supabaseAdmin!.from('trades').select('*').eq('user_id', user.id).order('opened_at', { ascending: false })
      const { data: cards } = await supabaseAdmin!.from('user_cards').select('*').eq('user_id', user.id)
      const { data: portfolio } = await supabaseAdmin!.from('portfolio').select('*').eq('user_id', user.id)
      const openTrades = trades?.filter(t => t.status === 'OPEN') || []
      const openProfit = openTrades.reduce((sum, t) => sum + (t.profit || 0), 0)
      const equity = (user.balance || 0) + openProfit
      const { password_hash, ...safeUser } = user
      return res.json({ ...safeUser, equity, margin: user.margin || 0, free_margin: user.free_margin || equity, margin_level: equity > 0 ? (equity / (user.margin || 1)) * 100 : 0, cards: cards || [], portfolio: portfolio || [], trades: trades || [] })
    }

    // POST /api/user/claim-bonus
    if (path === '/user/claim-bonus' && req.method === 'POST') {
      if (user.bonus_claimed) return res.status(400).json({ error: 'Bonus already claimed' })
      const { data: settings } = await supabaseAdmin!.from('payment_settings').select('bonus_amount').limit(1).single()
      const bonusAmount = settings?.bonus_amount || 10000
      const newBalance = (user.balance || 0) + bonusAmount
      const { data: updated, error } = await supabaseAdmin!.from('users').update({ balance: newBalance, bonus_claimed: true }).eq('id', user.id).select().single()
      if (error) throw error
      const { password_hash, ...safeUser } = updated
      return res.json({ success: true, balance: newBalance, user: safeUser })
    }

    // POST /api/user/update-profile
    if (path === '/user/update-profile' && req.method === 'POST') {
      const { name, phone, country } = req.body
      const updateData: any = {}
      if (name) updateData.name = name
      if (phone !== undefined) updateData.phone = phone
      if (country !== undefined) updateData.country = country
      const { data: updated, error } = await supabaseAdmin!.from('users').update(updateData).eq('id', user.id).select().single()
      if (error) throw error
      const { password_hash, ...safeUser } = updated
      return res.json(safeUser)
    }

    // POST /api/trades/place
    if (path === '/trades/place' && req.method === 'POST') {
      const { type, lot } = req.body
      const assetId = url.searchParams.get('asset')
      if (!assetId || !type || !lot) return res.status(400).json({ error: 'Missing required fields' })
      if (lot <= 0 || lot > user.balance) return res.status(400).json({ error: 'Invalid position size' })
      const { data: asset } = await supabaseAdmin!.from('assets').select('*').eq('id', assetId).single()
      if (!asset) return res.status(404).json({ error: 'Asset not found' })
      const payoutRate = 0.88
      const profit = lot * payoutRate
      const isWin = Math.random() > 0.48
      const finalProfit = isWin ? profit : -lot
      const { data: trade, error } = await supabaseAdmin!.from('trades').insert({
        user_id: user.id, symbol: asset.symbol, type, lot,
        open_price: asset.price, close_price: asset.price * (isWin ? 1.0001 : 0.9999),
        profit: finalProfit, status: 'CLOSED',
        opened_at: new Date().toISOString(), closed_at: new Date().toISOString()
      }).select().single()
      if (error) throw error
      const newBalance = Math.max(0, (user.balance || 0) + finalProfit)
      await supabaseAdmin!.from('users').update({ balance: newBalance }).eq('id', user.id)
      return res.json({ trade, newBalance, isWin, profit: finalProfit })
    }

    // GET/POST /api/messages
    if (path === '/messages') {
      const isAdmin = user.is_admin
      if (req.method === 'GET') {
        let query = supabaseAdmin!.from('messages').select('*').order('created_at', { ascending: true })
        if (!isAdmin) query = query.eq('user_id', user.id)
        const { data: messages, error } = await query
        if (error) throw error
        return res.json(messages || [])
      }
      if (req.method === 'POST') {
        const { text, sender } = req.body
        if (!text) return res.status(400).json({ error: 'Message text required' })
        const messageSender = isAdmin && sender === 'admin' ? 'admin' : 'user'
        const { data: message, error } = await supabaseAdmin!.from('messages').insert({ user_id: user.id, user_name: user.name, sender: messageSender, text }).select().single()
        if (error) throw error
        return res.json(message)
      }
      return res.status(405).json({ error: 'Method not allowed' })
    }

    // ===== ADMIN ROUTES =====
    const admin = await adminMiddleware(req, res)
    if (!admin) return

    // GET /api/admin/users
    if (path === '/admin/users' && req.method === 'GET') {
      const { data: users, error } = await supabaseAdmin!.from('users').select('id, name, email, balance, status, verified, is_admin, joined, created_at').order('created_at', { ascending: false })
      if (error) throw error
      return res.json(users || [])
    }

    // POST /api/admin/adjust-balance
    if (path === '/admin/adjust-balance' && req.method === 'POST') {
      const { userId, amount } = req.body
      if (!userId || typeof amount !== 'number') return res.status(400).json({ error: 'Missing userId or amount' })
      const { data: targetUser, error: fetchError } = await supabaseAdmin!.from('users').select('balance').eq('id', userId).single()
      if (fetchError || !targetUser) return res.status(404).json({ error: 'User not found' })
      const newBalance = Math.max(0, (targetUser.balance || 0) + amount)
      const { data: updated, error } = await supabaseAdmin!.from('users').update({ balance: newBalance }).eq('id', userId).select().single()
      if (error) throw error
      const { password_hash, ...safeUser } = updated
      return res.json(safeUser)
    }

    // POST /api/admin/set-trend
    if (path === '/admin/set-trend' && req.method === 'POST') {
      const { assetId, trend, trendRate } = req.body
      if (!assetId || !trend) return res.status(400).json({ error: 'Missing assetId or trend' })
      const validTrends = ['RANDOM', 'PUMP', 'DUMP', 'STABLE']
      if (!validTrends.includes(trend)) return res.status(400).json({ error: 'Invalid trend' })
      const updateData: any = { trend }
      if (typeof trendRate === 'number') updateData.trend_rate = trendRate
      const { data: asset, error } = await supabaseAdmin!.from('assets').update(updateData).eq('id', assetId).select().single()
      if (error) throw error
      if (!asset) return res.status(404).json({ error: 'Asset not found' })
      return res.json(asset)
    }

    // POST /api/admin/update-payment-settings
    if (path === '/admin/update-payment-settings' && req.method === 'POST') {
      const settings = req.body
      const { data: existing } = await supabaseAdmin!.from('payment_settings').select('id').limit(1).single()
      let result
      if (existing) {
        const { data, error } = await supabaseAdmin!.from('payment_settings').update({ ...settings, updated_at: new Date().toISOString() }).eq('id', existing.id).select().single()
        if (error) throw error
        result = data
      } else {
        const { data, error } = await supabaseAdmin!.from('payment_settings').insert({ ...settings, updated_at: new Date().toISOString() }).select().single()
        if (error) throw error
        result = data
      }
      return res.json(result)
    }

    // POST /api/admin/update-user-status
    if (path === '/admin/update-user-status' && req.method === 'POST') {
      const { userId, status, verified } = req.body
      if (!userId) return res.status(400).json({ error: 'Missing userId' })
      const updateData: any = {}
      if (status) updateData.status = status
      if (typeof verified === 'boolean') updateData.verified = verified
      const { data: updated, error } = await supabaseAdmin!.from('users').update(updateData).eq('id', userId).select().single()
      if (error) throw error
      if (!updated) return res.status(404).json({ error: 'User not found' })
      const { password_hash, ...safeUser } = updated
      return res.json(safeUser)
    }

    return res.status(404).json({ error: 'Not found' })
  } catch (err: any) {
    console.error('[API]', path, err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}