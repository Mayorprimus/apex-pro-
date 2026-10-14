import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseUrl = process.env.SUPABASE_URL || 'https://smnvuvyybhliwrtgqdgx.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Service role client for admin operations (bypasses RLS)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null

// Regular client for user operations
export const supabase = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || '')

// Helper to get user from session token
export async function getUserFromSession(sessionId: string) {
  if (!sessionId) return null
  
  const { data: session } = await supabaseAdmin?.from('sessions')
    .select('user_id, expires_at')
    .eq('id', sessionId)
    .single()
  
  if (!session || new Date(session.expires_at) < new Date()) {
    // Clean up expired session
    if (session) await supabaseAdmin?.from('sessions').delete().eq('id', sessionId)
    return null
  }
  
  const { data: user } = await supabaseAdmin?.from('users')
    .select('*')
    .eq('id', session.user_id)
    .single()
  
  return user
}

// Create new session
export async function createSession(userId: string): Promise<string> {
  const sessionId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  
  await supabaseAdmin?.from('sessions').insert({
    id: sessionId,
    user_id: userId,
    expires_at: expiresAt.toISOString()
  })
  
  return sessionId
}

// Delete session
export async function deleteSession(sessionId: string) {
  await supabaseAdmin?.from('sessions').delete().eq('id', sessionId)
}

// Verify password (using bcrypt)
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash)
  } catch {
    // Fallback for plain text passwords (migration period)
    return password === hash
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10)
}