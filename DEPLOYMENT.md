# Apex Terminal - Vercel + Supabase Deployment Guide

## 📋 Prerequisites
- Vercel account
- Supabase project (created at https://supabase.com)
- GitHub/GitLab repository

---

## 🗄️ Step 1: Set Up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase-schema.sql`
4. Click **Run** to execute the schema

This creates:
- `users` table (with RLS policies)
- `trades` table
- `portfolio` table
- `assets` table (with default forex/crypto assets)
- `payment_settings` table (with default values)
- `messages` table (support chat)
- `user_cards` table
- `sessions` table (for serverless auth)

---

## 🔑 Step 2: Get Supabase Credentials

From your Supabase project:
- **Project URL**: `https://your-project.supabase.co` (Settings → API)
- **Anon/Public Key**: `eyJ...` (Settings → API)
- **Service Role Key**: `eyJ...` (Settings → API → **Keep this secret!**)

---

## 🚀 Step 3: Deploy to Vercel

### Option A: Vercel CLI (Recommended)
```bash
cd apexnetwork-main
npm i -g vercel
vercel login
vercel
```

### Option B: GitHub Integration
1. Push this folder to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Framework preset: **Vite**
5. Build command: `npm run build`
6. Output directory: `dist`

---

## ⚙️ Step 4: Configure Environment Variables in Vercel

In Vercel dashboard → Settings → Environment Variables, add:

| Name | Value | Environment |
|------|-------|-------------|
| `SUPABASE_URL` | `https://smnvuvyybhliwrtgqdgx.supabase.co` | Production, Preview, Development |
| `SUPABASE_ANON_KEY` | `sb_publishable_zLwut2WidNYySQW-c4Tfww_q73NnEWx` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | *(your service role key from Supabase)* | Production, Preview, Development |

---

## 🔐 Step 5: Create Admin User

After deployment, register a user normally, then in Supabase SQL Editor:

```sql
-- Replace with your registered email
UPDATE users 
SET is_admin = TRUE, 
    verified = TRUE,
    status = 'Active'
WHERE email = 'admin1234@gmail.com';
```

Or register with email `admin1234@gmail.com` and it will be auto-promoted if you modify the register endpoint.

---

## ✅ Step 6: Verify Deployment

1. Visit your Vercel URL
2. Register a new account → should get $10,000 bonus
3. Login as admin → access Admin Panel (Command Center in mobile menu)
4. Test all admin functions:
   - View all users
   - Adjust balances
   - Set market trends (PUMP/DUMP/STABLE)
   - Update payment settings
   - Manage user status

---

## 📁 Project Structure

```
apexnetwork-main/
├── api/                          # Vercel Serverless Functions
│   ├── _lib/
│   │   ├── supabase.ts          # Supabase client + bcrypt
│   │   └── auth.ts              # Auth middleware
│   ├── auth/
│   │   ├── register.ts          # User registration
│   │   └── login.ts             # User login
│   ├── user/
│   │   ├── me.ts                # Get current user
│   │   ├── claim-bonus.ts       # Claim $10k bonus
│   │   └── update-profile.ts    # Update profile
│   ├── admin/
│   │   ├── users.ts             # List all users (admin)
│   │   ├── adjust-balance.ts    # Adjust user balance (admin)
│   │   ├── set-trend.ts         # Set asset trend (admin)
│   │   ├── update-payment-settings.ts
│   │   └── update-user-status.ts
│   ├── assets.ts                # Get market assets
│   ├── payment-settings.ts      # Get payment config
│   ├── trades/place.ts          # Place binary option trade
│   └── messages.ts              # Support chat
├── src/
│   ├── services/apiService.ts   # Frontend API client
│   ├── lib/supabase.ts          # Frontend Supabase client
│   └── ...components
├── supabase-schema.sql          # Database schema
├── vercel.json                  # Vercel config
├── .env.example                 # Environment template
└── package.json
```

---

## 🔒 Security Features

- **Passwords**: Hashed with bcrypt (cost factor 10)
- **Sessions**: Secure HTTP-only storage, 30-day expiry
- **RLS**: Row Level Security on all user tables
- **Admin Access**: Protected by `is_admin` flag + email check
- **API Routes**: Serverless functions with session validation

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Copy env file
cp .env.example .env

# Edit .env with your Supabase credentials
# Then start dev server
npm run dev
```

---

## 📝 Notes

- The old `server.ts` (Express) is no longer used - all backend is now in `api/` as serverless functions
- TradingView widget loads externally - works on Vercel
- Real-time price updates happen via 2-second polling from frontend
- Admin panel only accessible to users with `is_admin = true` in database

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Admin access denied" | Check `is_admin = TRUE` in Supabase users table |
| Assets not loading | Verify Supabase URL/keys in Vercel env vars |
| Login fails | Check bcrypt version compatibility |
| Build fails | Run `npm install` locally first |

---

## 🔄 Migrating from Old JSON Database

If you have existing data in `database.json`:

```sql
-- Run in Supabase SQL Editor after schema
-- (Manually insert users, trades, etc. from your JSON)
```

---

**Built with**: React 19, Vite 6, Tailwind 4, Supabase, Vercel