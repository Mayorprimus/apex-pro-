import { createClient } from '@supabase/supabase-js'

// Hardcoded Legacy keys (works without Vercel env vars)
const supabaseUrl = 'https://smnvuvyybhliwrtgqdgx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbnZ1dnl5YmhsaXdydGdxZGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwMTEyMTgsImV4cCI6MjEwNzU4NzIxOH0.9A8EcBUROlejldEEHyEvTWKvTF6dxdPntYYDni7eoBA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types matching our database
export interface DbUser {
  id: string
  name: string
  email: string
  password_hash: string
  phone: string | null
  country: string | null
  balance: number
  equity: number
  margin: number
  free_margin: number
  margin_level: number
  status: string
  verified: boolean
  is_admin: boolean
  joined: string
  bonus_claimed: boolean
  avatar: string | null
  created_at: string
  updated_at: string
}

export interface DbTrade {
  id: string
  user_id: string
  symbol: string
  type: 'BUY' | 'SELL'
  lot: number
  open_price: number
  close_price: number | null
  profit: number
  status: 'OPEN' | 'CLOSED'
  opened_at: string
  closed_at: string | null
}

export interface DbAsset {
  id: string
  symbol: string
  name: string
  price: number
  change_24h: number
  market_cap: number | null
  volume_24h: number | null
  color: string | null
  trend: 'RANDOM' | 'PUMP' | 'DUMP' | 'STABLE'
  trend_rate: number
  sparkline: any[]
  updated_at: string
}

export interface DbPaymentSettings {
  id: string
  crypto_addresses: any[]
  e_wallets: any[]
  bank_details: any
  bonus_amount: number
  deposit_enabled: boolean
  whatsapp_url: string | null
  updated_at: string
}

export interface DbMessage {
  id: string
  user_id: string
  user_name: string
  sender: 'user' | 'admin'
  text: string
  created_at: string
}