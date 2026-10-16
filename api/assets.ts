import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = 'https://smnvuvyybhliwrtgqdgx.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbnZ1dnl5YmhsaXdydGdxZGd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjAxMTIxOCwiZXhwIjoyMTA3NTg3MjE4fQ.uycLaxtbgvhX5LBiz94C7kDjrRPAJSH-sYXvUdDYu5E';
const SUPABASE_HEADERS = {
  'apikey': SUPABASE_SERVICE_KEY,
  'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

async function sb<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: { ...SUPABASE_HEADERS, ...(options.headers || {}) }
  });
  if (!res.ok) { const text = await res.text(); throw new Error(`Supabase ${res.status}: ${text}`); }
  return res.json();
}

function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Session-ID');
  if (req.method === 'OPTIONS') { res.status(200).end(); return true; }
  return false;
}

let cachedAssets: any[] | null = null;
let lastUpdate = 0;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const assets = await sb<any[]>(`assets?select=*&order=symbol`);
    const now = Date.now();
    if (!cachedAssets || now - lastUpdate > 2000) {
      cachedAssets = simulateAssetUpdates(assets || []);
      lastUpdate = now;
      for (const asset of cachedAssets) {
        sb(`assets?id=eq.${asset.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            price: asset.price, change_24h: asset.change_24h,
            sparkline: asset.sparkline, updated_at: new Date().toISOString()
          })
        }).catch(() => {});
      }
    }
    return res.json(cachedAssets || assets || []);
  } catch (err: any) {
    console.error('[ASSETS ERROR]', err);
    return res.status(500).json({ error: err?.message || 'Failed to fetch assets' });
  }
}

function simulateAssetUpdates(assets: any[]) {
  return assets.map(asset => {
    const isVolatile = asset.symbol.includes('GOLD') || asset.symbol.includes('BTC');
    const defaultVolatility = isVolatile ? 0.002 : 0.0004;
    const open = asset.price;
    const rate = asset.trend_rate || 2;
    const intervalFraction = 2000 / 60000;
    const ratePerInterval = (rate / 100) * intervalFraction;
    let bias = 0;
    if (asset.trend === 'PUMP') bias = ratePerInterval;
    if (asset.trend === 'DUMP') bias = -ratePerInterval;
    if (asset.trend === 'STABLE') bias = (Math.random() - 0.5) * (defaultVolatility * 0.1);
    const changePercent = ((Math.random() - 0.5) * defaultVolatility * 0.3) + bias;
    const close = open * (1 + changePercent);
    const range = Math.abs(close - open);
    const wickMultiplier = isVolatile ? 3 : 1.5;
    const high = Math.max(open, close) + (Math.random() * range * wickMultiplier);
    const low = Math.min(open, close) - (Math.random() * range * wickMultiplier);
    const newSparkline = [...(asset.sparkline || []).slice(1), {
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      open, high, low, close, value: close
    }];
    return { ...asset, price: close, change_24h: (asset.change_24h || 0) + (changePercent * 100), sparkline: newSparkline };
  });
}