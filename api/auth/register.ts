import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseAdmin, createSession, hashPassword, verifyPassword } from '../_lib/supabase.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { name, email, password, phone, country } = req.body
  const cleanEmail = email?.toLowerCase().trim()

  if (!name || !cleanEmail || !password) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    // Check if user exists
    const { data: existingUser } = await supabaseAdmin!
      .from('users')
      .select('id')
      .eq('email', cleanEmail)
      .single()

    if (existingUser) {
      return res.status(400).json({ 
        error: 'This Terminal ID is already commissioned. Please use the Sign In tab.' 
      })
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const { data: user, error } = await supabaseAdmin!
      .from('users')
      .insert({
        name,
        email: cleanEmail,
        password_hash: passwordHash,
        phone: phone || 'N/A',
        country: country || 'N/A',
        balance: 0,
        equity: 0,
        margin: 0,
        free_margin: 0,
        margin_level: 0,
        status: 'Active',
        verified: true,
        is_admin: false,
        joined: new Date().toISOString().split('T')[0],
        bonus_claimed: false,
        avatar: null
      })
      .select()
      .single()

    if (error) throw error

    // Create session
    const sessionId = await createSession(user.id)

    // Return user data (without password hash)
    const { password_hash, ...safeUser } = user
    return res.json({ user: safeUser, sessionId })

  } catch (err: any) {
    console.error('[REGISTER]', err)
    return res.status(500).json({ error: 'Registration failed' })
  }
}