export interface Asset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  color: string;
  sparkline: { time: string; value: number; open: number; high: number; low: number; close: number; }[];
  trend?: 'RANDOM' | 'PUMP' | 'DUMP' | 'STABLE';
  trendRate?: number;
}

export interface PortfolioItem {
  assetId: string;
  amount: number;
  avgPrice: number;
}

export interface Trade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  lot: number;
  openPrice: number;
  closePrice?: number;
  profit: number;
  time: string;
  status: 'OPEN' | 'CLOSED';
}

export interface UserState {
  id: string;
  name: string;
  email: string;
  avatar: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  isAdmin: boolean;
  status: string;
  verified: boolean;
  joined: string;
  phone: string;
  country: string;
  cards: { id: string; brand: string; last4: string; expiry: string; }[];
  portfolio: PortfolioItem[];
  trades: Trade[];
}

export const EMPTY_USER: UserState = {
  id: '',
  name: '',
  email: '',
  avatar: '',
  balance: 0,
  equity: 0,
  margin: 0,
  freeMargin: 0,
  marginLevel: 0,
  isAdmin: false,
  status: '',
  verified: false,
  joined: '',
  phone: '',
  country: '',
  cards: [],
  portfolio: [],
  trades: []
};
