import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseAdmin, getUserFromSession } from '../_lib/supabase'

// Middleware to verify session
export async function authMiddleware(req: VercelRequest, res: VercelResponse) {
  const sessionId = req.headers['x-session-id'] as string
  const user = await getUserFromSession(sessionId)
  
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }
  
  // Attach user to request
  ;(req as any).user = user
  return user
}

// Admin middleware
export async function adminMiddleware(req: VercelRequest, res: VercelResponse) {
  const user = (req as any).user
  if (!user || !user.is_admin) {
    res.status(403).json({ error: 'Admin access required' })
    return null
  }
  return user
}