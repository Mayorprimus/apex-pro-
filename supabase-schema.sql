-- Apex Terminal Supabase Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, -- Store bcrypt hash, not plain text
    phone TEXT,
    country TEXT,
    balance DECIMAL(15, 2) DEFAULT 0,
    equity DECIMAL(15, 2) DEFAULT 0,
    margin DECIMAL(15, 2) DEFAULT 0,
    free_margin DECIMAL(15, 2) DEFAULT 0,
    margin_level DECIMAL(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'Active',
    verified BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    joined DATE DEFAULT CURRENT_DATE,
    bonus_claimed BOOLEAN DEFAULT FALSE,
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User cards
CREATE TABLE user_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    brand TEXT NOT NULL,
    last4 TEXT NOT NULL,
    expiry TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trades
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('BUY', 'SELL')),
    lot DECIMAL(15, 2) NOT NULL,
    open_price DECIMAL(20, 8) NOT NULL,
    close_price DECIMAL(20, 8),
    profit DECIMAL(15, 2) DEFAULT 0,
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

-- Portfolio positions
CREATE TABLE portfolio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    asset_id TEXT NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    avg_price DECIMAL(20, 8) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, asset_id)
);

-- Assets (market data)
CREATE TABLE assets (
    id TEXT PRIMARY KEY,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    change_24h DECIMAL(10, 4) DEFAULT 0,
    market_cap DECIMAL(20, 2),
    volume_24h DECIMAL(20, 2),
    color TEXT,
    trend TEXT DEFAULT 'RANDOM' CHECK (trend IN ('RANDOM', 'PUMP', 'DUMP', 'STABLE')),
    trend_rate DECIMAL(10, 4) DEFAULT 2,
    sparkline JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment settings (admin configurable)
CREATE TABLE payment_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crypto_addresses JSONB DEFAULT '[]'::jsonb,
    e_wallets JSONB DEFAULT '[]'::jsonb,
    bank_details JSONB DEFAULT '{}'::jsonb,
    bonus_amount DECIMAL(15, 2) DEFAULT 10000,
    deposit_enabled BOOLEAN DEFAULT TRUE,
    whatsapp_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages (support chat)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'admin')),
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions (for serverless auth)
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_portfolio_user_id ON portfolio(user_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only see/update their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own cards" ON user_cards
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own trades" ON trades
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own trades" ON trades
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own trades" ON trades
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view own portfolio" ON portfolio
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can upsert own portfolio" ON portfolio
    FOR INSERT WITH CHECK (user_id = auth.uid())
    ON CONFLICT (user_id, asset_id) DO UPDATE SET
        amount = EXCLUDED.amount,
        avg_price = EXCLUDED.avg_price,
        updated_at = NOW();

CREATE POLICY "Users can view own messages" ON messages
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (user_id = auth.uid() AND sender = 'user');

-- Admin policies (using is_admin flag)
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
    );

CREATE POLICY "Admins can update all users" ON users
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
    );

CREATE POLICY "Admins can view all trades" ON trades
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
    );

CREATE POLICY "Admins can view all messages" ON messages
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
    );

CREATE POLICY "Admins can send admin messages" ON messages
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
        AND sender = 'admin'
    );

-- Assets are publicly readable
CREATE POLICY "Assets are publicly readable" ON assets
    FOR SELECT USING (TRUE);

-- Payment settings publicly readable, admin writable
CREATE POLICY "Payment settings readable" ON payment_settings
    FOR SELECT USING (TRUE);

CREATE POLICY "Admins can update payment settings" ON payment_settings
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
    );

-- Insert default assets
INSERT INTO assets (id, symbol, name, price, change_24h, market_cap, volume_24h, color, trend, trend_rate) VALUES
('eurusd', 'EUR/USD', 'EUR/USD', 1.0824, 0.15, 0, 0, '#6366f1', 'RANDOM', 2),
('gbpusd', 'GBP/USD', 'GBP/USD', 1.2654, -0.22, 0, 0, '#22c55e', 'RANDOM', 2),
('usdjpy', 'USD/JPY', 'USD/JPY', 151.42, 0.45, 0, 0, '#f59e0b', 'RANDOM', 2),
('xauusd', 'GOLD', 'Gold', 2355.20, 1.12, 0, 0, '#fbbf24', 'RANDOM', 2),
('btcusd', 'BTC/USD', 'Bitcoin', 64250.00, -2.45, 0, 0, '#f97316', 'RANDOM', 2)
ON CONFLICT (id) DO NOTHING;

-- Insert default payment settings
INSERT INTO payment_settings (crypto_addresses, e_wallets, bank_details, bonus_amount, deposit_enabled, whatsapp_url) VALUES
(
    '[
        {"id": "1", "label": "BTC Settlement Ledger", "value": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", "type": "BTC"},
        {"id": "2", "label": "ETH Settlement Ledger", "value": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", "type": "ETH"}
    ]'::jsonb,
    '[
        {"id": "e1", "label": "PayPal Operational", "value": "payments@apex.financial", "type": "PAYPAL"},
        {"id": "e2", "label": "Skrill Global", "value": "skrill-id-99281", "type": "SKRILL"}
    ]'::jsonb,
    '{"bankName": "Apex Capital Reserve", "accountNumber": "APX-7700-4421-001", "swiftCode": "APXGB2L", "holderName": "Apex Financial Group"}'::jsonb,
    10000,
    TRUE,
    'https://wa.me/19453879820'
)
ON CONFLICT DO NOTHING;

-- Create admin user (password: admin1234 - will be hashed by app)
-- You'll need to register via the app or manually insert with bcrypt hash