import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseAdmin } from '../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { data: settings, error } = await supabaseAdmin!
      .from('payment_settings')
      .select('*')
      .limit(1)
      .single()

    if (error) throw error

    return res.json(settings || {})
  } catch (err: any) {
    console.error('[PAYMENT SETTINGS]', err)
    return res.status(500).json({ error: 'Failed to fetch payment settings' })
  }
}