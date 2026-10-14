import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseAdmin, createSession, verifyPassword } from '../../_lib/supabase.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password } = req.body
  const cleanEmail = email?.toLowerCase().trim()

  if (!cleanEmail || !password) {
    return res.status(400).json({ error: 'Email and password required' })
  }

  try {
    const { data: user, error } = await supabaseAdmin!
      .from('users')
      .select('*')
      .eq('email', cleanEmail)
      .single()

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Verify password
    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Create session
    const sessionId = await createSession(user.id)

    // Return user data (without password hash)
    const { password_hash, ...safeUser } = user
    return res.json({ user: safeUser, sessionId })

  } catch (err: any) {
    console.error('[LOGIN]', err)
    return res.status(500).json({ error: 'Login failed' })
  }
}