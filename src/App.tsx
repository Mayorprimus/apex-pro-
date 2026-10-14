import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ApiService } from './services/apiService';
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  History,
  Settings,
  Search,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Menu,
  X,
  Newspaper,
  Plus,
  ArrowRight,
  Activity,
  BarChart3,
  Globe,
  Clock,
  ArrowUp,
  ArrowDown,
  ChevronUp,
  ChevronDown,
  CreditCard,
  Banknote,
  ShieldCheck,
  Zap,
  ArrowUpDown,
  User,
  Minus,
  Shuffle,
  Anchor,
  TrendingDown,
  Hexagon,
  Sun,
  Moon,
  Camera,
  MessageSquare,
  Send,
  Phone,
  MessageCircle,
  ShieldAlert,
  LogOut
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  ReferenceLine
} from 'recharts';
import { cn } from './lib/utils';
import { Asset, Trade, UserState, EMPTY_USER } from './mockData';
import AuthPage from './components/AuthPage';

// Custom Candlestick Component for professional clear rendering
const CandleStick = (props: any) => {
  const { x, y, width, height, payload } = props;
  if (!payload || height === undefined) return null;

  const isUp = payload.close >= payload.open;
  // Professional trading colors (High Contrast Emerald / High Contrast Ruby)
  const color = isUp ? '#22c55e' : '#ef4444';

  const bodyHeight = Math.max(3, height);
  const wickColor = isUp ? '#4ade80' : '#f87171'; // Slightly lighter color for wicks to stand out

  return (
    <g>
      {/* Wick line - Sharper 2px for clarity on all zoom levels */}
      <line
        x1={x + width / 2}
        y1={payload.high > payload.low ? y - (payload.high - Math.max(payload.open, payload.close)) * (bodyHeight / Math.abs(payload.close - payload.open || 1)) : y}
        x2={x + width / 2}
        y2={payload.high > payload.low ? y + bodyHeight + (Math.min(payload.open, payload.close) - payload.low) * (bodyHeight / Math.abs(payload.close - payload.open || 1)) : y + bodyHeight}
        stroke={wickColor}
        strokeWidth={2}
        shapeRendering="crispEdges"
      />
      {/* Body - Enhanced thickness and dark border for depth */}
      <rect
        x={x}
        y={y}
        width={width}
        height={bodyHeight}
        fill={color}
        stroke="rgba(0,0,0,0.3)"
        strokeWidth={1}
        shapeRendering="crispEdges"
      />
    </g>
  );
};


// --- Shared Components ---

// --- Withdrawal Popup Data ---
const RECENT_WITHDRAWALS = [
  { id: 1, name: "Alex M.", amount: 1250, location: "UK", time: "2 min ago" },
  { id: 2, name: "Sarah K.", amount: 4850, location: "Germany", time: "just now" },
  { id: 3, name: "Elena P.", amount: 920, location: "Spain", time: "5 min ago" },
  { id: 4, name: "David L.", amount: 12400, location: "USA", time: "just now" },
  { id: 5, name: "Maria S.", amount: 3100, location: "Brazil", time: "1 min ago" },
];

function TradingViewWidget({ symbol }: { symbol: string }) {
  const container = React.useRef<HTMLDivElement>(null);
  const widgetId = React.useMemo(() => `tv-chart-${Math.random().toString(36).substring(2, 9)}`, []);
  const isLight = document.documentElement.classList.contains('light');

  React.useEffect(() => {
    const containerRef = container.current;
    if (!containerRef) return;

    // Remove existing content to ensure no duplicate widgets
    containerRef.innerHTML = '';

    // Create the div that will hold the widget
    const widgetDiv = document.createElement('div');
    widgetDiv.id = widgetId;
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    containerRef.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": symbol.includes('/') ? `FX:${symbol.replace('/', '')}` : `BINANCE:${symbol.replace('/', '')}`,
      "interval": "1",
      "timezone": "Etc/UTC",
      "theme": isLight ? "light" : "dark",
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "hide_top_toolbar": false,
      "hide_legend": false,
      "save_image": false,
      "backgroundColor": isLight ? "rgba(248, 250, 252, 1)" : "rgba(2, 2, 3, 1)",
      "gridColor": isLight ? "rgba(0, 0, 0, 0.03)" : "rgba(255, 255, 255, 0.03)",
      "container_id": widgetId
    });

    widgetDiv.appendChild(script);

    return () => {
      if (containerRef) {
        containerRef.innerHTML = "";
      }
    };
  }, [symbol, widgetId, isLight]);

  return (
    <div className="tradingview-widget-container h-full w-full" ref={container} />
  );
}

const WithdrawalPopup = () => {
  const [current, setCurrent] = React.useState(0);
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % RECENT_WITHDRAWALS.length);
        setShow(true);
      }, 500);
    }, 8000);

    const firstTimeout = setTimeout(() => setShow(true), 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(firstTimeout);
    };
  }, []);

  const item = RECENT_WITHDRAWALS[current];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          className="fixed bottom-24 left-8 z-[100] flex items-center gap-4 bg-[var(--panel-bg)] backdrop-blur-xl border border-[var(--panel-border)] p-4 rounded-2xl shadow-2xl max-w-xs pointer-events-none"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
            <ArrowDownRight className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">New Withdrawal</p>
            <p className="text-[11px] font-bold text-white leading-tight">
              {item.name} from {item.location} just withdrew <span className="text-emerald-400 font-mono">${item.amount.toLocaleString()}</span>
            </p>
            <p className="text-[8px] text-zinc-500 font-bold uppercase mt-1 italic">{item.time}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  React.useEffect(() => {
    const timer = setTimeout(onFinish, 1200);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="data-grid-bg absolute inset-0 opacity-20" />
      <div className="scanline" />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center rotate-45 border border-indigo-400 shadow-[0_0_50px_rgba(79,70,229,0.4)] mb-12">
          <Hexagon className="text-white w-10 h-10 -rotate-45 fill-white/10" />
        </div>

        <h1 className="text-4xl font-black text-indigo-500 italic tracking-tighter uppercase mb-2">
          Apex <span className="text-indigo-400">Terminal</span>
        </h1>

        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Establishing Secure Node</span>
        </div>

        <div className="w-64 h-1 bg-white/5 rounded-full mt-8 overflow-hidden">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="h-full bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.8)]"
          />
        </div>
      </motion.div>

      <div className="absolute bottom-12 left-12 flex flex-col">
        <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Protocol Version</span>
        <span className="text-[10px] font-mono text-zinc-500">v4.2.2-stable.build_88</span>
      </div>
    </motion.div>
  );
};

const TechnicalHeader = ({ user, theme, setTheme, setActiveTab, onMenuToggle }: { user: any, theme: 'dark' | 'light', setTheme: (t: 'dark' | 'light') => void, setActiveTab: (t: string) => void, onMenuToggle?: () => void }) => {
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 border-b border-[var(--panel-border)] bg-[var(--panel-bg)] flex items-center justify-between px-4 md:px-6 sticky top-0 z-50 backdrop-blur-md">
      <div className="flex items-center gap-4 md:gap-8">
        <button onClick={onMenuToggle} className="md:hidden p-2 text-zinc-400 hover:text-white">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded flex items-center justify-center rotate-45 group shrink-0">
            <Hexagon className="text-white w-4 h-4 -rotate-45" />
          </div>
          <span className="text-sm md:text-lg font-black tracking-tight text-[var(--text-primary)] uppercase italic truncate">Apex<span className="text-indigo-500">Terminal</span></span>
        </div>

        <div className="hidden lg:flex items-center gap-6 border-l border-[var(--panel-border)] pl-8">
          <div className="flex flex-col">
            <span className="terminal-label">Market Status</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider leading-none">Global Active</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="terminal-label">System Time</span>
            <span className="terminal-value text-[11px] uppercase tabular-nums">{time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })} UTC</span>
          </div>
          <div className="flex flex-col">
            <span className="terminal-label">Latency</span>
            <span className="terminal-value text-[11px] text-emerald-500">12ms</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="flex items-center gap-3 bg-[var(--background)] px-2 md:px-4 py-1.5 md:py-2 rounded-lg border border-[var(--panel-border)] shrink-0">
          <div className="flex flex-col items-end">
            <span className="terminal-label opacity-40 italic hidden xs:block">Equity</span>
            <span className="terminal-value text-[11px] md:text-sm tabular-nums">${user.equity.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
          </div>
          <div className="w-px h-6 bg-[var(--panel-border)] hidden sm:block" />
          <div className="hidden sm:flex flex-col items-end">
            <span className="terminal-label opacity-40 italic">Margin</span>
            <span className="terminal-value text-sm text-indigo-400 tabular-nums">98.2%</span>
          </div>
        </div>

        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 md:p-2.5 rounded-lg hover:bg-white/5 transition-colors shrink-0">
          {theme === 'dark' ? <Sun className="w-4 h-4 text-zinc-400" /> : <Moon className="w-4 h-4 text-zinc-400" />}
        </button>

        <div
          onClick={() => setActiveTab('profile')}
          className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-[var(--panel-border)] shrink-0 cursor-pointer group"
        >
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] font-bold text-[var(--text-primary)] leading-none group-hover:text-indigo-500 transition-colors uppercase italic">{user.name.split(' ')[0]}</span>
            <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">{user.isAdmin ? 'Admin' : 'Trader'}</span>
          </div>
          {user.avatar ? (
            <img src={user.avatar} alt="Avatar" className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-[var(--panel-border)] group-hover:border-indigo-500 transition-all object-cover" />
          ) : (
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white border border-[var(--panel-border)] group-hover:border-indigo-500 transition-all">
              {(user.name || '?').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};


const CommandRail = ({ activeTab, setActiveTab, isAdmin }: { activeTab: string, setActiveTab: (t: string) => void, isAdmin?: boolean }) => {
  const rails = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'CMD' },
    { id: 'markets', icon: TrendingUp, label: 'TRD' },
    { id: 'news', icon: Globe, label: 'INT' },
    { id: 'history', icon: History, label: 'HST' },
    { id: 'profile', icon: User, label: 'USR' },
    ...(isAdmin ? [{ id: 'admin', icon: ShieldAlert, label: 'ADM' }] : []),
    { id: 'settings', icon: Settings, label: 'SYS' },
  ];

  return (
    <nav className="w-20 border-r border-[var(--panel-border)] bg-[var(--panel-bg)] flex flex-col items-center py-8 gap-1 hidden md:flex">
      {rails.map((rail) => (
        <button
          key={rail.id}
          onClick={() => setActiveTab(rail.id)}
          className={cn(
            "w-14 h-14 flex flex-col items-center justify-center gap-1 transition-all relative group",
            activeTab === rail.id
              ? "text-[var(--text-primary)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          )}
        >
          <rail.icon className={cn("w-5 h-5", activeTab === rail.id ? "text-indigo-500" : "")} />
          <span className="text-[8px] font-black tracking-widest">{rail.label}</span>
          {activeTab === rail.id && (
            <motion.div
              layoutId="rail-indicator"
              className="absolute left-0 w-1 h-6 bg-indigo-600 rounded-r-full"
            />
          )}
          <div className="absolute left-full ml-4 px-3 py-2 bg-[var(--panel-bg)] text-[var(--text-primary)] text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[var(--panel-border)] shadow-2xl">
            {rail.id.toUpperCase()} MODULE
          </div>
        </button>
      ))}
    </nav>
  );
};

const DashboardView = ({ setActiveTab, user, assets, onCloseTrade }: {
  setActiveTab: (t: string) => void,
  user: UserState,
  assets: Asset[],
  onCloseTrade: (id: string) => void
}) => {
  const openTrades = (user.trades || []).filter(t => t.status === 'OPEN');

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto overflow-y-auto h-full pb-32 data-grid-bg no-scrollbar">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[var(--panel-border)]">
        <div>
          <span className="terminal-label">Operational Overview</span>
          <h1 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] italic tracking-tighter uppercase mt-1">Terminal <span className="text-indigo-500">Node_01</span></h1>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-start md:items-end">
            <span className="terminal-label">Account P/L</span>
            <span className="text-xl md:text-2xl font-mono font-bold text-emerald-500 tabular-nums">+$1,452.20 <span className="text-[10px] font-black italic">(+12.4%)</span></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">            {[
            { label: 'Primary Balance', value: user.balance, sub: 'USD Liquid', color: 'text-[var(--text-primary)]' },
            { label: 'Active Exposure', value: user.balance * 0.4, sub: 'Margin in Use', color: 'text-indigo-400' },
            { label: 'Free Margin', value: user.freeMargin, sub: 'Available Leverage', color: 'text-emerald-400' }
          ].map((stat, i) => (
            <div key={i} className="terminal-panel p-6 rounded-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600 opacity-40" />
              <span className="terminal-label mb-2 block">{stat.label}</span>
              <div className="flex items-baseline gap-2">
                <span className={cn("text-3xl font-mono font-bold tracking-tighter tabular-nums", stat.color)}>${stat.value.toLocaleString()}</span>
                <span className="text-[10px] font-black text-zinc-500 uppercase">{stat.sub}</span>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] font-black text-emerald-500 uppercase">+1.2% Cycle</span>
              </div>
            </div>
          ))}
          </div>

          <div className="terminal-panel p-8 rounded-[2rem] h-80 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full p-6 z-10 flex justify-between items-start">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Operational Performance</h3>
                <p className="text-[9px] font-bold text-zinc-500 uppercase mt-0.5">Real-time capital growth telemetry</p>
              </div>
              <div className="flex gap-2">
                <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <span className="text-[10px] font-black text-emerald-500 font-mono">+$4,210.50</span>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 pt-20">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={assets[0]?.sparkline || []}>
                  <defs>
                    <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorGrowth)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="terminal-panel rounded-[2rem] overflow-hidden">
            <div className="px-8 py-6 border-b border-[var(--panel-border)] bg-[var(--panel-bg)]/30 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Active Order Stream</h3>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase mt-0.5 tracking-tighter">Real-time terminal execution monitoring</p>
                </div>
              </div>
              <button onClick={() => setActiveTab('markets')} className="px-4 py-2 bg-indigo-600 rounded-lg text-[9px] font-black uppercase text-white hover:bg-indigo-500 transition-all">New Order +</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[var(--panel-bg)] border-b border-[var(--panel-border)]">
                  <tr>
                    <th className="px-8 py-4 terminal-label font-black text-[8px]">Instrument</th>
                    <th className="px-6 py-4 terminal-label font-black text-[8px]">Side</th>
                    <th className="px-6 py-4 terminal-label font-black text-[8px]">Size (LOT)</th>
                    <th className="px-6 py-4 terminal-label font-black text-[8px]">Entry PX</th>
                    <th className="px-6 py-4 terminal-label font-black text-[8px] text-right">Yield</th>
                    <th className="px-8 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--panel-border)]">
                  {openTrades.map(trade => (
                    <tr key={trade.id} className="hover:bg-[var(--panel-hover)] transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-[var(--text-primary)] tracking-widest">{trade.symbol}</span>
                          <span className="text-[9px] font-mono text-[var(--text-secondary)] italic mt-0.5">{trade.time}</span>
                        </div>
                      </td>
                      <td className="px-6 py-6 font-black">
                        <span className={cn("px-3 py-1 rounded text-[9px] uppercase tracking-widest border", trade.type === 'BUY' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20")}>
                          {trade.type}
                        </span>
                      </td>
                      <td className="px-6 py-6 terminal-value text-[var(--text-secondary)]">{trade.lot.toFixed(2)}</td>
                      <td className="px-6 py-6 terminal-value text-[var(--text-secondary)] italic">{trade.openPrice.toFixed(4)}</td>
                      <td className="px-6 py-6 text-right">
                        <div className="flex flex-col items-end">
                          <span className={cn("text-lg font-mono font-bold tracking-tighter tabular-nums", trade.profit >= 0 ? "text-emerald-500" : "text-rose-500")}>
                            {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}
                          </span>
                          <span className="text-[8px] font-black text-[var(--text-muted)] italic uppercase">Locked +88% Payout</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button onClick={() => onCloseTrade(trade.id)} className="w-10 h-10 rounded-lg border border-white/5 flex items-center justify-center hover:bg-rose-500/20 hover:text-rose-500 text-zinc-600 transition-all opacity-0 group-hover:opacity-100">
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="terminal-panel p-6 rounded-2xl border-indigo-600/20 relative overflow-hidden">
            <div className="scanline" />
            <div className="flex items-center justify-between mb-6">
              <h4 className="terminal-label text-indigo-400">Security Status</h4>
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Zap className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white uppercase italic">Node Secure</p>
                  <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-tight">Identity Fully Verified</p>
                </div>
              </div>
              <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                <span className="text-[8px] font-black text-zinc-600 uppercase mb-2 block">Terminal Reputation Score</span>
                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="w-[92%] h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                </div>
              </div>
            </div>
          </div>

          <div className="terminal-panel p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h4 className="terminal-label">Recent Intelligence</h4>
              <Globe className="w-4 h-4 text-zinc-600" />
            </div>
            <div className="space-y-4">
              {[
                { pair: 'EUR/USD', msg: 'Whale Movement Detected', time: '2m ago', vol: '1.2B' },
                { pair: 'BTC/USD', msg: 'Resistance Level Hit', time: '8m ago', vol: '450M' },
                { pair: 'GBP/JPY', msg: 'Sudden Volatility Spike', time: '14m ago', vol: '12M' }
              ].map((intel, idx) => (
                <div key={idx} className="pb-4 border-b border-white/5 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-black text-white tracking-widest">{intel.pair}</span>
                    <span className="text-[8px] text-zinc-600 font-bold uppercase">{intel.time}</span>
                  </div>
                  <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-tighter mb-1.5">{intel.msg}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-indigo-500" />
                    <span className="text-[8px] font-black text-indigo-500 uppercase">VOL: {intel.vol}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- View: Markets (Trading Terminal) ---

const MarketsView = ({ selectedAsset, setSelectedAsset, assets, onPlaceTrade, user }: {
  selectedAsset: Asset | null,
  setSelectedAsset: (a: Asset) => void,
  assets: Asset[],
  onPlaceTrade: (type: 'BUY' | 'SELL', lot: number) => void,
  user: UserState
}) => {
  const [lot, setLot] = useState('100');
  const [timeframe, setTimeframe] = useState('15m');
  const [isAssetMenuOpen, setIsAssetMenuOpen] = useState(false);

  if (!selectedAsset) {
    return <div className="p-8 text-zinc-500 text-sm font-bold uppercase tracking-widest">Loading market data...</div>;
  }

  const activePositions = (user.trades || []).filter(t => t.status === 'OPEN' && t.symbol === selectedAsset.symbol);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[var(--background)] animate-in fade-in duration-700 h-full overflow-hidden relative">
      <div className="h-14 border-b border-[var(--panel-border)] bg-[var(--panel-bg)]/40 flex items-center justify-between px-3 md:px-6 shrink-0 z-20">
        <div className="flex items-center gap-2 md:gap-6">
          <div className="relative">
            <button
              onClick={() => setIsAssetMenuOpen(!isAssetMenuOpen)}
              className="flex items-center gap-2 md:gap-3 px-2 py-1.5 hover:bg-white/5 rounded transition-colors group border border-transparent hover:border-white/10"
            >
              <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center shrink-0">
                <Activity className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs md:text-sm font-black text-white tracking-widest">{selectedAsset.symbol}</span>
              <ChevronDown className="w-3 h-3 text-zinc-500 group-hover:text-white transition-colors" />
            </button>

            <AnimatePresence>
              {isAssetMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                  className="absolute top-full left-0 mt-2 w-72 bg-[var(--background)] border border-[var(--panel-border)] rounded-xl shadow-2xl z-[100] overflow-hidden backdrop-blur-3xl"
                >
                  <div className="p-3 border-b border-[var(--panel-border)] flex items-center justify-between">
                    <span className="terminal-label">Watchlist</span>
                    <Search className="w-3 h-3 text-[var(--text-secondary)]" />
                  </div>
                  <div className="max-h-96 overflow-y-auto p-2 custom-scrollbar">
                    {assets.map(asset => (
                      <button
                        key={asset.id}
                        onClick={() => { setSelectedAsset(asset); setIsAssetMenuOpen(false); }}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-lg text-left transition-all",
                          asset.id === selectedAsset.id ? "bg-indigo-600/10 text-indigo-400" : "hover:bg-[var(--panel-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        )}
                      >
                        <span className="text-xs font-black tracking-widest">{asset.symbol}</span>
                        <span className="text-xs font-mono">${asset.price.toFixed(4)}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="w-px h-6 bg-white/5" />

          <div className="hidden sm:flex items-center gap-4">
            <div className="flex flex-col">
              <span className="terminal-label text-[8px]">Index Price</span>
              <span className="terminal-value text-xs tabular-nums text-indigo-500 font-mono">
                {selectedAsset.price.toFixed(4)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="terminal-label text-[8px]">Payout Rate</span>
              <span className="terminal-value text-xs text-emerald-500 font-mono tracking-tighter">+88%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar">
          {['1m', '5m', '15m', '1h', '4h'].map(t => (
            <button key={t} onClick={() => setTimeframe(t)} className={cn("px-2 py-1 rounded text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all shrink-0", t === timeframe ? "text-indigo-400 bg-indigo-500/10" : "text-zinc-600 hover:text-zinc-300")}>{t}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden pb-16 md:pb-0">
        <div className="flex-1 border-b md:border-b-0 md:border-r border-[var(--panel-border)] relative z-10 min-h-[300px] md:min-h-0">
          <TradingViewWidget symbol={selectedAsset.symbol} />
        </div>

        <div className="w-full md:w-80 flex flex-col bg-[var(--panel-bg)] divide-y divide-[var(--panel-border)] shrink-0 overflow-y-auto custom-scrollbar">
          <div className="p-4 md:p-6 space-y-6">
            <div className="flex flex-col gap-1">
              <h4 className="terminal-label text-indigo-500">Order Execution</h4>
              <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-tight">Real-time binary settlement</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="terminal-label opacity-40">Position Size</label>
                  <span className="text-[8px] font-black text-indigo-500 uppercase font-mono">Bal: ${user.balance.toLocaleString()}</span>
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 font-black">$</div>
                  <input
                    type="number"
                    value={lot}
                    onChange={(e) => setLot(e.target.value)}
                    className="w-full bg-[var(--background)] border border-[var(--panel-border)] rounded-xl pl-8 pr-4 py-3.5 text-lg font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-indigo-600 transition-all shadow-inner"
                  />
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {['50', '250', '500', '1K'].map(preset => (
                    <button
                      key={preset}
                      onClick={() => setLot(preset.replace('K', '000'))}
                      className="py-1.5 bg-white/5 rounded text-[8px] font-black text-zinc-500 hover:text-white hover:bg-white/10 transition-colors uppercase"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                <button
                  onClick={() => onPlaceTrade('BUY', parseFloat(lot))}
                  className="group relative h-20 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all"
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10 flex flex-col items-center">
                    <ChevronUp className="w-6 h-6 text-white group-hover:-translate-y-0.5 transition-transform" />
                    <span className="text-sm font-black text-white uppercase tracking-widest italic">Trade Higher</span>
                  </div>
                </button>

                <button
                  onClick={() => onPlaceTrade('SELL', parseFloat(lot))}
                  className="group relative h-20 overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 shadow-xl shadow-rose-500/20 active:scale-[0.98] transition-all"
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10 flex flex-col items-center">
                    <span className="text-sm font-black text-white uppercase tracking-widest italic">Trade Lower</span>
                    <ChevronDown className="w-6 h-6 text-white group-hover:translate-y-0.5 transition-transform" />
                  </div>
                </button>
              </div>
            </div>

            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Fixed Yield</span>
                <span className="text-[10px] font-mono font-bold text-emerald-500">88.0%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Estimated Profit</span>
                <span className="text-[10px] font-mono font-bold text-white">${(parseFloat(lot) * 0.88).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 bg-[var(--panel-bg)]/20">
            <div className="px-6 py-4 border-b border-white/5 bg-white/[0.01] flex justify-between items-center">
              <h4 className="terminal-label text-indigo-400">Open Nodes</h4>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse" />
                <span className="text-[8px] font-black text-indigo-500/60 uppercase">{activePositions.length} Active</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {activePositions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30">
                  <Activity className="w-5 h-5 text-zinc-600 mb-2" />
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-600">Syncing Stream</span>
                </div>
              ) : (
                activePositions.map((p) => (
                  <div key={p.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl group hover:bg-white/[0.04] transition-all border-l-2 border-l-indigo-500/30">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest", p.type === 'BUY' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                        {p.type} {p.lot}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-white">{p.openPrice.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-[8px] font-bold text-zinc-500 uppercase italic">Dynamic P/L</span>
                      <span className={cn("text-xs font-mono font-bold tabular-nums", p.profit >= 0 ? "text-emerald-500" : "text-rose-500")}>
                        {p.profit >= 0 ? '+' : ''}${p.profit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- View: Support Chat Overlay ---

const SupportChat = ({ isOpen, onClose, messages, onSendMessage }: { isOpen: boolean, onClose: () => void, messages: any[], onSendMessage: (txt: string) => void }) => {
  const [input, setInput] = useState('');
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50, x: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 50, x: 50 }}
          className="fixed bottom-24 right-6 w-80 md:w-96 h-[500px] glass-panel rounded-[2.5rem] shadow-2xl z-[100] flex flex-col overflow-hidden border-2 border-indigo-600/20 bg-[var(--background)]/90 backdrop-blur-2xl"
        >
          <div className="bg-indigo-600 p-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black text-white uppercase tracking-widest">Apex Support</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-indigo-100/60 uppercase">Operational</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white">
              <X className="w-5 h-5" />
            </button>
          </div>



          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex flex-col max-w-[80%]", msg.sender === 'user' ? "ml-auto items-end" : "mr-auto items-start")}>
                <div className={cn(
                  "p-4 rounded-2xl text-[11px] font-medium leading-relaxed shadow-sm",
                  msg.sender === 'user' ? "bg-indigo-600 text-white rounded-tr-none" : "bg-[var(--panel-bg)] text-[var(--text-primary)] border border-[var(--panel-border)] rounded-tl-none"
                )}>
                  {msg.text}
                </div>
                <span className="text-[8px] font-bold text-[var(--text-secondary)] uppercase mt-1 px-1">{msg.time}</span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-[var(--panel-bg)] border-t border-[var(--panel-border)]">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Secure message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { onSendMessage(input); setInput(''); } }}
                className="flex-1 bg-[var(--background)] border border-[var(--panel-border)] rounded-xl px-4 py-3 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
              <button
                onClick={() => { onSendMessage(input); setInput(''); }}
                className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- View: Portfolio (Forex Terminal) ---

// --- View: News ---

const NewsView = () => {
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const news = [
    { id: 1, title: "Federal Reserve hints at interest rate cuts in upcoming Q3 meeting", source: "Market Watch", time: "12m ago", impact: "High", content: "The Federal Reserve has signaled a potential shift in monetary policy as inflation continues to moderate. Federal Reserve Chair Jerome Powell indicated that the central bank is considering rate cuts in the upcoming Q3 meeting, citing improved economic conditions and cooling inflation data. Market analysts expect a 25 basis point cut as the most likely scenario." },
    { id: 2, title: "EUR/USD breaks key resistance level at 1.0850 amid dollar weakness", source: "FX Street", time: "45m ago", impact: "Medium", content: "The EUR/USD pair surged past the critical 1.0850 resistance level during today's trading session, driven by broad US dollar weakness. The move was supported by better-than-expected Eurozone industrial production data and growing expectations that the ECB will maintain its current policy stance." },
    { id: 3, title: "Gold prices hit all-time high as safe-haven demand surges globally", source: "Bloomberg", time: "2h ago", impact: "High", content: "Gold prices reached a new all-time high today, crossing the $2,400 mark as geopolitical tensions and economic uncertainty drove investors toward safe-haven assets. Analysts cite weakening US dollar, falling bond yields, and central bank buying as key catalysts for the rally." },
    { id: 4, title: "BoE Governor Bailey speaks on inflation targets and monetary policy", source: "Reuters", time: "3h ago", impact: "High", content: "Bank of England Governor Andrew Bailey delivered a comprehensive speech on the UK's inflation outlook and monetary policy trajectory. He emphasized that while inflation has fallen significantly, the BoE remains vigilant and will continue to assess data before making any rate decisions." },
    { id: 5, title: "Nikkei 225 slides as Yen intervention fears grow in Tokyo", source: "Nikkei Asia", time: "5h ago", impact: "Medium", content: "Japan's Nikkei 225 index fell sharply today amid growing speculation that Japanese authorities may intervene in the currency markets to support the yen. Traders are closely watching for any signs of intervention as USD/JPY approaches the 152 level." },
    { id: 6, title: "OPEC+ maintains production cuts amid global demand concerns", source: "Reuters", time: "6h ago", impact: "High", content: "OPEC+ has decided to maintain its current production cuts through the end of the year, citing ongoing uncertainty about global oil demand. The decision was widely expected by markets, with crude oil prices remaining relatively stable following the announcement." },
    { id: 7, title: "S&P 500 hits new record high as tech stocks rally", source: "CNBC", time: "7h ago", impact: "Medium", content: "The S&P 500 index reached a new all-time high today, driven by a broad rally in technology stocks. Nvidia, Microsoft, and Apple were among the top performers as investors remain optimistic about AI-driven growth prospects." },
    { id: 8, title: "Bitcoin volatility spikes as SEC deadline approaches", source: "CoinDesk", time: "8h ago", impact: "High", content: "Bitcoin prices experienced increased volatility today as the market awaits a key SEC decision on multiple spot Bitcoin ETF applications. Trading volumes surged as institutional investors position themselves ahead of the regulatory announcement." },
    { id: 9, title: "European Central Bank holds rates steady at 4.5%", source: "Bloomberg", time: "9h ago", impact: "High", content: "The European Central Bank maintained its key interest rate at 4.5% today, in line with market expectations. ECB President Christine Lagarde indicated that the bank is taking a data-dependent approach and will carefully monitor economic indicators before making any adjustments." },
    { id: 10, title: "US Dollar Index drops to three-month low on weak jobs data", source: "FX Street", time: "10h ago", impact: "Medium", content: "The US Dollar Index extended its decline to a three-month low following worse-than-expected employment data. Non-farm payrolls came in significantly below forecasts, raising expectations that the Fed may need to cut rates sooner rather than later." },
    { id: 11, title: "China's GDP growth beats expectations at 5.3%", source: "Reuters", time: "11h ago", impact: "Medium", content: "China's economy grew at a faster-than-expected pace in the first quarter, with GDP expanding 5.3% year-on-year. The data provides some relief to policymakers who have been implementing various stimulus measures to support economic recovery." },
    { id: 12, title: "Wheat futures surge as weather concerns hit global supply", source: "Bloomberg", time: "12h ago", impact: "Low", content: "Wheat futures prices jumped sharply today as adverse weather conditions in major producing regions raised concerns about global supply. Drought conditions in parts of the US and excessive rainfall in Europe have impacted crop yields." },
  ];

  return (
    <div className="h-full flex flex-col gap-6 animate-in slide-in-from-right duration-500">
      <div className="px-8 pt-8">
        <span className="terminal-label">Intelligence Stream</span>
        <h2 className="text-2xl font-black text-[var(--text-primary)] italic uppercase tracking-tighter">Market <span className="text-indigo-500">Intelligence</span></h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-8">
        <div className="lg:col-span-2 space-y-3 md:space-y-4">
          {news.map((item) => (
            <div key={item.id} onClick={() => setSelectedArticle(item)} className="glass-panel p-6 rounded-3xl hover:bg-indigo-600/5 transition-all border group cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border",
                    item.impact === 'High' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                    item.impact === 'Medium' ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" :
                    "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  )}>
                    {item.impact} Impact
                  </div>
                  <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">{item.source} &bull; {item.time}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-indigo-600 transition-colors leading-tight">{item.title}</h3>
            </div>
          ))}
        </div>
        <div className="space-y-6 text-sm text-zinc-500">
          <div className="glass-panel p-6 rounded-3xl bg-indigo-600/10 border-indigo-600/20">
            <h4 className="text-indigo-400 font-black uppercase tracking-widest text-[10px] mb-4">Economic Calendar</h4>
            <div className="space-y-4">
              {[
                { event: "USD CPI m/m", time: "Today 15:30", forecast: "0.4%", prev: "0.3%" },
                { event: "GBP GDP q/q", time: "Tomorrow 09:00", forecast: "0.1%", prev: "0.0%" },
                { event: "EUR ECB Press Conf", time: "Thu 14:45", forecast: "--", prev: "--" },
                { event: "JPY Interest Rate", time: "Fri 03:00", forecast: "0.10%", prev: "0.10%" },
              ].map((cal, i) => (
                <div key={i} className="flex flex-col gap-1 pb-3 border-b border-white/5">
                  <div className="flex justify-between font-bold text-[var(--text-secondary)]">
                    <span>{cal.event}</span>
                    <span className="text-[var(--text-primary)] font-mono">{cal.time}</span>
                  </div>
                  <div className="flex justify-between text-[10px] uppercase font-black tracking-tighter">
                    <span>F: {cal.forecast}</span>
                    <span>P: {cal.prev}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-panel p-6 rounded-3xl bg-emerald-600/5 border-emerald-600/10">
            <h4 className="text-emerald-400 font-black uppercase tracking-widest text-[10px] mb-4">Market Sentiment</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase text-zinc-500">Bullish</span>
                <span className="text-[10px] font-black text-emerald-500">62%</span>
              </div>
              <div className="w-full h-2 bg-[var(--background)] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full" style={{ width: '62%' }} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase text-zinc-500">Bearish</span>
                <span className="text-[10px] font-black text-rose-500">38%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Article Detail Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-[var(--background)] border border-[var(--panel-border)] rounded-[2.5rem] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border",
                      selectedArticle.impact === 'High' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                      selectedArticle.impact === 'Medium' ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" :
                      "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    )}>
                      {selectedArticle.impact} Impact
                    </div>
                    <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">{selectedArticle.source} &bull; {selectedArticle.time}</span>
                  </div>
                  <button onClick={() => setSelectedArticle(null)} className="p-3 hover:bg-[var(--panel-bg)] rounded-2xl transition-colors">
                    <X className="w-5 h-5 text-[var(--text-secondary)]" />
                  </button>
                </div>
                <h2 className="text-2xl font-black text-[var(--text-primary)] leading-tight">{selectedArticle.title}</h2>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{selectedArticle.content}</p>
                <div className="flex gap-4 pt-4 border-t border-[var(--panel-border)]">
                  <button onClick={() => setSelectedArticle(null)} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-500 transition-all">
                    Close Article
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- View: History ---

const HistoryView = ({ user }: { user: UserState }) => {
  const closedTrades = (user.trades || []).filter(t => t.status === 'CLOSED');
  const totalPL = closedTrades.reduce((sum, t) => sum + t.profit, 0);

  return (
    <div className="h-full flex flex-col gap-6 animate-in slide-in-from-bottom duration-500 p-4 md:p-8 no-scrollbar overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="terminal-label">Execution History Ledger</span>
          <h2 className="text-2xl font-black text-[var(--text-primary)] italic uppercase tracking-tighter">Capital <span className="text-indigo-500">Ledger</span></h2>
        </div>
        <div className="flex gap-2">
          <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Efficiency: 94.2%</span>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border-[var(--panel-border)] bg-[var(--panel-bg)]/20">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase font-bold">Total P/L</span>
              <span className={cn("text-xl font-bold tabular-nums", totalPL >= 0 ? "text-emerald-400" : "text-rose-400")}>
                {totalPL >= 0 ? '+' : ''}${totalPL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-px h-10 bg-[var(--panel-border)]" />
            <div className="flex flex-col">
              <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold">Closed Trades</span>
              <span className="text-xl font-bold text-[var(--text-primary)]">{closedTrades.length}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-zinc-800 rounded-xl text-xs font-bold text-zinc-200">All Time</button>
            <button className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-colors">Export CSV</button>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-[10px] text-[var(--text-secondary)] uppercase font-bold border-b border-[var(--panel-border)] shadow-sm">
              <tr>
                <th className="px-4 py-4 terminal-label">Assets</th>
                <th className="px-4 py-4 terminal-label">Type</th>
                <th className="px-4 py-4 terminal-label">Execution</th>
                <th className="px-4 py-4 terminal-label">Lot</th>
                <th className="px-4 py-4 terminal-label">Price Entry/Exit</th>
                <th className="px-4 py-4 terminal-label text-right">Yield</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--panel-border)]/30">
              {closedTrades.map((trade) => (
                <tr key={trade.id} className="hover:bg-[var(--panel-bg)]/40 transition-colors group">
                  <td className="px-4 py-5">
                    <span className="font-bold text-[var(--text-primary)] tracking-widest">{trade.symbol}</span>
                  </td>
                  <td className="px-4 py-5 font-black">
                    <span className={cn("text-[9px] px-2 py-0.5 rounded uppercase tracking-widest border", trade.type === 'BUY' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20")}>
                      {trade.type}
                    </span>
                  </td>
                  <td className="px-4 py-5">
                    <span className="text-[10px] text-[var(--text-secondary)] uppercase font-medium">{trade.time}</span>
                  </td>
                  <td className="px-4 py-5 font-mono font-bold text-[var(--text-secondary)]">{(trade.lot || 0).toFixed(2)}</td>
                  <td className="px-4 py-5">
                    <div className="flex flex-col">
                      <span className="font-mono text-xs text-[var(--text-primary)]">{(trade.openPrice || 0).toFixed(4)}</span>
                      <span className="font-mono text-[10px] text-zinc-500">{(trade.closePrice || 0).toFixed(4)}</span>
                    </div>
                  </td>
                  <td className={cn("px-4 py-5 text-right font-bold font-mono tracking-tighter text-sm", trade.profit >= 0 ? "text-emerald-500" : "text-rose-500")}>
                    {trade.profit >= 0 ? '+' : ''}${trade.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- View: Admin Panel ---

const AdminView = ({
  assets,
  setAssets,
  platformUsers,
  setPlatformUsers,
  paymentSettings,
  setPaymentSettings,
  currentUser,
  setCurrentUser,
  messages,
  onReply
}: {
  assets: Asset[],
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>,
  platformUsers: any[],
  setPlatformUsers: React.Dispatch<React.SetStateAction<any[]>>,
  paymentSettings: any,
  setPaymentSettings: React.Dispatch<React.SetStateAction<any>>,
  currentUser: UserState,
  setCurrentUser: React.Dispatch<React.SetStateAction<UserState>>,
  messages: any[],
  onReply: (text: string) => Promise<void> | void
}) => {
  const [adminSubTab, setAdminSubTab] = useState<'monitor' | 'investors' | 'markets' | 'config' | 'cs'>('monitor');
  const [searchUser, setSearchUser] = useState('');
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [adminReplyText, setAdminReplyText] = useState('');

  const creditInputRef = React.useRef<HTMLInputElement>(null);
  const debitInputRef = React.useRef<HTMLInputElement>(null);

  // Sync platform users with server
  React.useEffect(() => {
    if (adminSubTab === 'investors' || adminSubTab === 'monitor') {
      const fetchUsers = async () => {
        try {
          const users = await ApiService.getAdminUsers();
          setPlatformUsers(users);
        } catch (err) {
          console.error("Failed to fetch platform users", err);
        }
      };
      fetchUsers();
    }
  }, [adminSubTab]);

  const handleAdjustBalance = async (userId: string, amount: number) => {
    if (isNaN(amount)) return;
    try {
      const updatedUser = await ApiService.adjustBalance(userId, amount);
      setPlatformUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
      // If it's the current user, sync the main user state too
      if (userId === currentUser.id) {
        setCurrentUser(prev => ({ ...prev, balance: updatedUser.balance }));
      }
    } catch (err) {
      alert("Balance adjustment unauthorized");
    }
  };

  const handleSetTrend = async (assetId: string, trend: Asset['trend'], trendRate?: number) => {
    try {
      const updatedAsset = await ApiService.setTrend(assetId, trend || 'RANDOM', trendRate);
      setAssets(prev => prev.map(a => a.id === assetId ? updatedAsset : a));
    } catch (err) {
      alert("Trend protocol command rejected");
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in zoom-in-95 duration-500 pb-24 px-3 md:px-6 min-w-0 max-w-full">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-2 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <span className="terminal-label text-indigo-400">Security Protocol</span>
            <h2 className="text-xl md:text-2xl font-black text-[var(--text-primary)] italic uppercase tracking-tighter">Command <span className="text-indigo-500">Hierarchy</span></h2>
          </div>
        </div>
        <div className="flex bg-[var(--background)] p-1 rounded-2xl border border-[var(--panel-border)] overflow-x-auto no-scrollbar max-w-full inline-flex self-start md:self-auto">
          {[
            { id: 'monitor', label: 'Surveillance', icon: Activity },
            { id: 'investors', label: 'Operator Deck', icon: User },
            { id: 'markets', label: 'Sim Lab', icon: BarChart3 },
            { id: 'config', label: 'Protocol', icon: Settings },
            { id: 'cs', label: 'Support', icon: MessageSquare }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setAdminSubTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                adminSubTab === tab.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {adminSubTab === 'monitor' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {[
              { label: 'Total Volume Index', value: '$0.00', icon: BarChart3, color: 'text-indigo-400' },
              { label: 'Network Operators', value: platformUsers.length, icon: Activity, color: 'text-emerald-400' },
              { label: 'Core System Load', value: '—', icon: Zap, color: 'text-amber-400' },
              { label: 'Daily Revenue Pool', value: '$0.00', icon: Banknote, color: 'text-rose-400' },
            ].map((stat) => (
              <div key={`stat-${stat.label}`} className="glass-panel p-5 rounded-3xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                  <span className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Global Telemetry</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black text-[var(--text-primary)] tabular-nums tracking-tighter">{stat.value}</span>
                  <span className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-wider mt-1">{stat.label}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-panel p-6 rounded-3xl bg-rose-600/5 border-rose-600/10 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-600/10 flex items-center justify-center">
                <Search className="w-4 h-4 text-rose-500" />
              </div>
              <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Platform Activity Log</h4>
            </div>
            <div className="space-y-3">
              {[
                { t: '12:58:21', msg: 'Admin override executed: Volatility Boost v2.1' },
                { t: '12:57:44', msg: 'High frequency trade detected: u2 -> EurUsd' },
                { t: '12:57:12', msg: 'New Terminal Registration: Sarah Jenkins (Pro)' },
                { t: '12:56:01', msg: 'Protocol update: Payment gateways synchronized' },
              ].map((log, idx) => (
                <div key={`admin-log-${idx}-${log.t}`} className="flex gap-2 text-[10px] font-mono leading-tight">
                  <span className="text-[var(--text-secondary)] opacity-70">[{log.t}]</span>
                  <span className="text-[var(--text-secondary)] uppercase font-bold tracking-tight">{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {adminSubTab === 'investors' && (
        <div className="glass-panel rounded-3xl overflow-hidden animate-in slide-in-from-bottom duration-500">
          <div className="p-6 border-b border-[var(--panel-border)] bg-[var(--panel-bg)] flex justify-between items-center gap-4">
            <h3 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-[.3em]">Operator Management</h3>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="IDENTIFY BY NAME / EMAIL / UID..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full bg-[var(--background)] border border-[var(--panel-border)] rounded-2xl pl-12 pr-6 py-3 text-[10px] font-black text-[var(--text-primary)] focus:ring-1 focus:ring-indigo-600 focus:outline-none transition-all uppercase tracking-widest"
              />
            </div>
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap min-w-[600px]">
              <thead className="text-[9px] text-[var(--text-secondary)] uppercase font-black tracking-widest border-b border-[var(--panel-border)] bg-[var(--panel-bg)]">
                <tr>
                  <th className="px-6 py-5">User Designation</th>
                  <th className="px-4 py-5">Valuation</th>
                  <th className="px-4 py-5">State</th>
                  <th className="px-4 py-5">Integrity</th>
                  <th className="px-6 py-5 text-right">Intervention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--panel-border)]/50">
                {Array.isArray(platformUsers) && platformUsers.filter(u =>
                  (u.name || '').toLowerCase().includes(searchUser.toLowerCase()) ||
                  (u.email || '').toLowerCase().includes(searchUser.toLowerCase())
                ).map((u) => (
                  <tr key={u.id} className="hover:bg-indigo-600/5 transition-all group">
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-[var(--text-primary)] text-xs">{u.name}</span>
                        <span className="text-[9px] text-[var(--text-secondary)] font-medium uppercase tracking-tight">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-6 font-mono text-[var(--text-secondary)] font-bold">${u.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-6">
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border",
                        u.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          u.status === 'Suspended' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          u.status === 'Flagged' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                      )}>
                        {u.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-6">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]", u.verified ? "bg-emerald-500 shadow-emerald-500/50" : "bg-amber-500 shadow-amber-500/50")} />
                        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">{u.verified ? 'Verified' : 'Pending'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleAdjustBalance(u.id, 1000)} className="p-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white rounded-lg border border-emerald-600/20 transition-all">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleAdjustBalance(u.id, -1000)} className="p-2 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white rounded-lg border border-rose-600/20 transition-all">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setViewingUser(u)}
                          className="px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-500 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all border border-indigo-600/20 ml-2"
                        >
                          Audit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <AnimatePresence>
            {viewingUser && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-full max-w-lg bg-[var(--background)] border border-[var(--panel-border)] rounded-[2.5rem] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden"
                >
                  <div className="p-8 space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-widest">Operator Dossier</h3>
                        <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">{viewingUser.name} // {viewingUser.id}</span>
                      </div>
                      <button onClick={() => setViewingUser(null)} className="p-3 hover:bg-[var(--panel-bg)] rounded-2xl transition-colors">
                        <X className="w-5 h-5 text-[var(--text-secondary)]" />
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div className="p-6 rounded-3xl bg-[var(--panel-bg)] border border-[var(--panel-border)] space-y-4">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-4 h-4 text-indigo-500" />
                          <h4 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">Account Controls</h4>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          <div className="flex gap-2">
                            {['Active', 'Suspended', 'Flagged'].map((st) => (
                              <button
                                key={st}
                                onClick={async () => {
                                  try {
                                    const updated = await ApiService.updateUserStatus(viewingUser.id, st);
                                    setViewingUser(updated);
                                    setPlatformUsers((prev: any[]) => prev.map((u: any) => u.id === updated.id ? updated : u));
                                  } catch (e) { alert("Status update failed"); }
                                }}
                                className={cn(
                                  "flex-1 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border",
                                  viewingUser.status === st
                                    ? st === 'Active' ? 'bg-emerald-600 text-white border-emerald-500' :
                                      st === 'Suspended' ? 'bg-rose-600 text-white border-rose-500' :
                                      'bg-amber-600 text-white border-amber-500'
                                    : 'bg-[var(--background)] text-[var(--text-secondary)] border-[var(--panel-border)] hover:border-white/20'
                                )}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--background)] border border-[var(--panel-border)]">
                            <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest flex-1">Verification</span>
                            <button
                              onClick={async () => {
                                try {
                                  const updated = await ApiService.updateUserStatus(viewingUser.id, viewingUser.status, !viewingUser.verified);
                                  setViewingUser(updated);
                                  setPlatformUsers((prev: any[]) => prev.map((u: any) => u.id === updated.id ? updated : u));
                                } catch (e) { alert("Verification toggle failed"); }
                              }}
                              className={cn(
                                "px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all",
                                viewingUser.verified ? "bg-emerald-600/20 text-emerald-400" : "bg-amber-600/20 text-amber-400"
                              )}
                            >
                              {viewingUser.verified ? 'Verified' : 'Unverified'}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 rounded-2xl bg-[var(--panel-bg)] border border-[var(--panel-border)]">
                          <span className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest block mb-1">Current Liquidity</span>
                          <span className="text-xl font-black text-[var(--text-primary)] font-mono tracking-tighter">${viewingUser.balance.toLocaleString()}</span>
                        </div>
                        <div className="p-5 rounded-2xl bg-[var(--panel-bg)] border border-[var(--panel-border)]">
                          <span className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest block mb-1">Account State</span>
                          <span className={cn(
                            "text-sm font-black uppercase tracking-widest",
                            viewingUser.status === 'Active' ? 'text-emerald-500' :
                            viewingUser.status === 'Suspended' ? 'text-rose-500' :
                            'text-amber-500'
                          )}>{viewingUser.status}</span>
                        </div>
                        {viewingUser.joined && (
                          <div className="col-span-2 p-5 rounded-2xl bg-[var(--panel-bg)]/50 border border-[var(--panel-border)]">
                            <span className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest block mb-1">Registration Protocol Executed</span>
                            <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase">{viewingUser.joined}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Deposit Flow</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            defaultValue="1000"
                            ref={creditInputRef}
                            className="flex-1 bg-[var(--background)] border border-[var(--panel-border)] rounded-xl px-4 py-3 text-xs font-mono text-[var(--text-primary)] focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              const amt = parseFloat(creditInputRef.current?.value || "0");
                              handleAdjustBalance(viewingUser.id, amt);
                            }}
                            className="px-6 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all font-mono"
                          >
                            CREDIT
                          </button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Debit Flow</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            defaultValue="1000"
                            ref={debitInputRef}
                            className="flex-1 bg-[var(--background)] border border-[var(--panel-border)] rounded-xl px-4 py-3 text-xs font-mono text-[var(--text-primary)] focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              const amt = parseFloat(debitInputRef.current?.value || "0");
                              handleAdjustBalance(viewingUser.id, -amt);
                            }}
                            className="px-6 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 transition-all font-mono"
                          >
                            DEBIT
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setViewingUser(null)}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-indigo-600/30 active:scale-[0.98] transition-all"
                    >
                      COMMIT & CLOSE
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {adminSubTab === 'markets' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 animate-in slide-in-from-left duration-500 min-w-0 max-w-full">
          {assets.map((asset) => (
            <div key={asset.id} className="glass-panel p-6 rounded-[2rem] bg-[var(--panel-bg)]/20 border-[var(--panel-border)] flex flex-col gap-5 hover:border-indigo-600/30 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-black text-[var(--text-primary)] tracking-widest">{asset.symbol}</span>
                  <span className="text-[9px] text-[var(--text-secondary)] font-bold uppercase">{asset.name}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-black text-indigo-400 font-mono tracking-tighter">{(asset.price || 0).toFixed(asset.symbol === 'GOLD' || (asset.symbol && asset.symbol.includes('JPY')) ? 2 : 4)}</span>
                  <span className={cn("text-[9px] font-black tracking-widest", (asset.trend === 'PUMP' || (!asset.trend && asset.change24h > 0)) ? "text-emerald-500" : "text-rose-500")}>
                    {asset.trend || 'AUTO'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'RANDOM', label: 'Randomized', icon: Shuffle, color: 'hover:bg-zinc-800' },
                  { id: 'STABLE', label: 'Stabilized', icon: Anchor, color: 'hover:bg-indigo-600' },
                  { id: 'PUMP', label: 'Force Pump', icon: TrendingUp, color: 'hover:bg-emerald-600' },
                  { id: 'DUMP', label: 'Force Dump', icon: TrendingDown, color: 'hover:bg-rose-600' }
                ].map((t) => (
                  <button
                    key={`trend-${asset.id}-${t.id}`}
                    onClick={() => handleSetTrend(asset.id, t.id as any)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-3 rounded-2xl border transition-all text-left",
                      (asset.trend === t.id || (!asset.trend && t.id === 'RANDOM'))
                        ? "bg-[var(--panel-border)] border-[var(--panel-border)] shadow-inner"
                        : "bg-[var(--background)] border-[var(--panel-border)] text-[var(--text-secondary)] " + t.color + " hover:text-white hover:border-transparent"
                    )}
                  >
                    <t.icon className="w-3.5 h-3.5" />
                    <span className="text-[8px] font-black uppercase tracking-widest">{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Speed Rate Slider */}
              <div className="space-y-2 border-t border-[var(--panel-border)] pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Speed Rate (%/min)</span>
                  <span className="text-[10px] font-black text-indigo-400 font-mono">{asset.trendRate || 2}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="20"
                  step="0.1"
                  value={asset.trendRate || 2}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    handleSetTrend(asset.id, asset.trend || 'RANDOM', val);
                  }}
                  className="w-full h-2 bg-[var(--background)] rounded-full appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[7px] text-zinc-600 font-bold uppercase tracking-wider">
                  <span>Slow 0.1%</span>
                  <span>Fast 20%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}            {adminSubTab === 'cs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6 animate-in slide-in-from-right duration-500 min-w-0 max-w-full">
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="glass-panel rounded-3xl overflow-hidden flex flex-col bg-[var(--panel-bg)]">
              <div className="p-5 border-b border-[var(--panel-border)] bg-[var(--background)]/50">
                <h3 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">Active Channels ({messages.length})</h3>
              </div>
              <div className="flex-1 p-2 space-y-1">
                {Array.from(new Set(messages.filter(m => m.sender !== 'admin').map(m => m.userName || 'Unknown'))).map((uname) => (
                  <div key={uname} className="p-4 rounded-2xl bg-indigo-600/10 border border-indigo-600/20 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-xs">
                      {uname.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-[var(--text-primary)]">{uname}</span>
                      <span className="text-[9px] text-emerald-500 font-bold uppercase">Online</span>
                    </div>
                  </div>
                ))}
                {messages.filter(m => m.sender !== 'admin').length === 0 && (
                  <div className="p-4 text-center text-[10px] text-zinc-500 font-bold uppercase">No active user channels</div>
                )}
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl bg-indigo-600/5 border-indigo-600/10 space-y-4">
              <div className="flex flex-col gap-1">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">WhatsApp Protocol</h4>
                <p className="text-[9px] text-zinc-600 font-bold uppercase">Configure global support endpoint.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[.3em] pl-1">Target URL</label>
                  <input
                    type="text"
                    value={paymentSettings.whatsappUrl || ''}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, whatsappUrl: e.target.value })}
                    placeholder="https://wa.me/..."
                    className="w-full h-12 bg-[var(--background)] border border-[var(--panel-border)] rounded-xl px-4 font-black text-[10px] text-[var(--text-primary)] focus:ring-1 focus:ring-indigo-600 focus:outline-none transition-all"
                  />
                </div>
                <button
                  onClick={async () => {
                    try {
                      await ApiService.updatePaymentSettings(paymentSettings);
                      alert("WhatsApp protocol updated.");
                    } catch (err) {
                      alert("Update failed: Admin auth required");
                    }
                  }}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all"
                >
                  Confirm Endpoint
                </button>
              </div>
            </div>

          </div>

          <div className="lg:col-span-2 glass-panel rounded-[2.5rem] overflow-hidden flex flex-col h-[400px] md:h-[600px] bg-[var(--panel-bg)]">
            <div className="p-6 border-b border-[var(--panel-border)] bg-[var(--background)]/30 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-indigo-500" />
                <span className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">Secure Communication Bridge</span>
              </div>
              <span className="px-3 py-1 bg-indigo-600/10 rounded-full text-[9px] font-black text-indigo-500 uppercase">Encrypted</span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {messages.map((msg: any) => (
                <div key={msg.id} className={cn("flex flex-col max-w-[80%]", msg.sender === 'admin' ? "ml-auto items-end" : "mr-auto items-start")}>
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[8px] font-black text-[var(--text-secondary)] uppercase">{msg.sender === 'admin' ? 'Operator' : 'User'}</span>
                    <span className="text-[8px] font-bold text-zinc-500">{msg.time}</span>
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl text-[11px] font-medium leading-relaxed shadow-sm",
                    msg.sender === 'admin' ? "bg-indigo-600 text-white rounded-tr-none" : "bg-[var(--background)] text-[var(--text-primary)] border border-[var(--panel-border)] rounded-tl-none"
                  )}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-[var(--background)]/50 border-t border-[var(--panel-border)]">
              <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Dispatch response..."
                    value={adminReplyText}
                    onChange={(e) => setAdminReplyText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { onReply(adminReplyText); setAdminReplyText(''); } }}
                    className="flex-1 bg-[var(--background)] border border-[var(--panel-border)] rounded-2xl px-6 py-4 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-indigo-600 shadow-inner"
                  />
                  <button
                    onClick={async () => { await onReply(adminReplyText); setAdminReplyText(''); }}
                    className="px-8 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-xl shadow-indigo-600/20"
                  >
                  <Send className="w-4 h-4" />
                  Transmit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {adminSubTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6 animate-in zoom-in-95 duration-500 min-w-0 max-w-full">
          {/* Crypto & E-Wallets */}
          <div className="space-y-6">
            <div className="glass-panel p-8 rounded-[2.5rem] bg-[var(--panel-bg)] border-[var(--panel-border)] space-y-8 h-fit">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-[.2em]">Asset Gateways</h3>
                  <button
                    onClick={() => {
                      const newAddr = { id: Date.now().toString(), label: 'New Asset Ledger', value: '', type: 'USDT' };
                      setPaymentSettings({ ...paymentSettings, cryptoAddresses: [...paymentSettings.cryptoAddresses, newAddr] });
                    }}
                    className="p-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-500 hover:text-white rounded-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">Update global terminal payment endpoints.</p>
              </div>

              <div className="space-y-4">
                {paymentSettings.cryptoAddresses.map((addr: any, idx: number) => (
                  <div key={addr.id} className="p-4 rounded-2xl bg-[var(--background)]/40 border border-[var(--panel-border)] space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Wallet className="w-4 h-4 text-indigo-500" />
                        <input
                          type="text"
                          value={addr.label}
                          onChange={(e) => {
                            const newAddrs = [...paymentSettings.cryptoAddresses];
                            newAddrs[idx].label = e.target.value;
                            setPaymentSettings({ ...paymentSettings, cryptoAddresses: newAddrs });
                          }}
                          className="bg-transparent border-none p-0 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[.2em] focus:ring-0 w-full"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const newAddrs = paymentSettings.cryptoAddresses.filter((a: any) => a.id !== addr.id);
                          setPaymentSettings({ ...paymentSettings, cryptoAddresses: newAddrs });
                        }}
                        className="p-1.5 text-[var(--text-secondary)] hover:text-rose-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Asset Type (e.g. USDT)"
                        value={addr.type}
                        onChange={(e) => {
                          const newAddrs = [...paymentSettings.cryptoAddresses];
                          newAddrs[idx].type = e.target.value;
                          setPaymentSettings({ ...paymentSettings, cryptoAddresses: newAddrs });
                        }}
                        className="w-20 bg-[var(--background)] border border-[var(--panel-border)] rounded-xl px-4 py-2 text-[10px] font-mono text-[var(--text-primary)] focus:outline-none uppercase text-center"
                      />
                      <input
                        type="text"
                        placeholder="Wallet Address..."
                        value={addr.value}
                        onChange={(e) => {
                          const newAddrs = [...paymentSettings.cryptoAddresses];
                          newAddrs[idx].value = e.target.value;
                          setPaymentSettings({ ...paymentSettings, cryptoAddresses: newAddrs });
                        }}
                        className="flex-1 bg-[var(--background)] border border-[var(--panel-border)] rounded-xl px-4 py-2 text-[10px] font-mono text-[var(--text-primary)] focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel p-8 rounded-[2.5rem] bg-[var(--panel-bg)] border-[var(--panel-border)] space-y-8 h-fit">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-[.2em]">E-Wallet Matrix</h3>
                  <button
                    onClick={() => {
                      const newWallet = { id: Date.now().toString(), label: 'New E-Wallet', value: '', type: 'PAYPAL' };
                      setPaymentSettings({ ...paymentSettings, eWallets: [...paymentSettings.eWallets, newWallet] });
                    }}
                    className="p-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white rounded-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">Manage digital wallet endpoints.</p>
              </div>

              <div className="space-y-4">
                {paymentSettings.eWallets.map((wallet: any, idx: number) => (
                  <div key={wallet.id} className="p-4 rounded-2xl bg-[var(--background)]/40 border border-[var(--panel-border)] space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-emerald-500" />
                        <input
                          type="text"
                          value={wallet.label}
                          onChange={(e) => {
                            const newWallets = [...paymentSettings.eWallets];
                            newWallets[idx].label = e.target.value;
                            setPaymentSettings({ ...paymentSettings, eWallets: newWallets });
                          }}
                          className="bg-transparent border-none p-0 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[.2em] focus:ring-0 w-full"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const newWallets = paymentSettings.eWallets.filter((w: any) => w.id !== wallet.id);
                          setPaymentSettings({ ...paymentSettings, eWallets: newWallets });
                        }}
                        className="p-1.5 text-[var(--text-secondary)] hover:text-rose-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={wallet.type}
                        onChange={(e) => {
                          const newWallets = [...paymentSettings.eWallets];
                          newWallets[idx].type = e.target.value;
                          setPaymentSettings({ ...paymentSettings, eWallets: newWallets });
                        }}
                        className="w-24 bg-[var(--background)] border border-[var(--panel-border)] rounded-xl px-2 py-2 text-[8px] font-black text-[var(--text-primary)] focus:outline-none uppercase"
                      >
                        <option value="PAYPAL">PAYPAL</option>
                        <option value="SKRILL">SKRILL</option>
                        <option value="NETELLER">NETELLER</option>
                        <option value="STRIPE">STRIPE</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Wallet Email/ID..."
                        value={wallet.value}
                        onChange={(e) => {
                          const newWallets = [...paymentSettings.eWallets];
                          newWallets[idx].value = e.target.value;
                          setPaymentSettings({ ...paymentSettings, eWallets: newWallets });
                        }}
                        className="flex-1 bg-[var(--background)] border border-[var(--panel-border)] rounded-xl px-4 py-2 text-[10px] font-mono text-[var(--text-primary)] focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bank & Cards Policy */}
          <div className="space-y-6">
            <div className="glass-panel p-8 rounded-[2.5rem] bg-[var(--panel-bg)] border-[var(--panel-border)] space-y-8">
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-[.2em]">Institutional Gateways</h3>
                <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">Global Wire & Financial Settlements.</p>
              </div>

              <div className="grid grid-cols-1 gap-5">
                {[
                  { label: 'Settlement Node Name', field: 'bankName' },
                  { label: 'Operational Registry ID', field: 'accountNumber' },
                  { label: 'Network Routing Code', field: 'swiftCode' },
                  { label: 'Account Holder Identity', field: 'holderName' }
                ].map((f) => (
                  <div key={f.field} className="space-y-2">
                    <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[.3em] pl-1">{f.label}</label>
                    <input
                      type="text"
                      value={(paymentSettings.bankDetails as any)[f.field]}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, bankDetails: { ...paymentSettings.bankDetails, [f.field]: e.target.value } })}
                      className="w-full h-14 bg-[var(--background)] border border-[var(--panel-border)] rounded-2xl px-6 font-black uppercase tracking-widest text-[10px] text-[var(--text-primary)] focus:ring-1 focus:ring-indigo-600 focus:outline-none transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel p-8 rounded-[2.5rem] bg-[var(--panel-bg)] border-[var(--panel-border)] space-y-8 h-fit">
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-[.2em]">System Parameters</h3>
                <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">Global operational configuration.</p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--background)] border border-[var(--panel-border)]">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Deposit Status</span>
                    <span className="text-[8px] text-zinc-500 font-bold uppercase">Toggle global funding capability</span>
                  </div>
                  <button
                    onClick={() => setPaymentSettings({ ...paymentSettings, depositEnabled: !paymentSettings.depositEnabled })}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                      paymentSettings.depositEnabled ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                    )}
                  >
                    {paymentSettings.depositEnabled ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[.3em] pl-1">Bonus Claim Allocation ($)</label>
                  <input
                    type="number"
                    value={paymentSettings.bonusAmount}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, bonusAmount: parseInt(e.target.value) || 0 })}
                    className="w-full h-14 bg-[var(--background)] border border-[var(--panel-border)] rounded-2xl px-6 font-black uppercase tracking-widest text-[10px] text-[var(--text-primary)] focus:ring-1 focus:ring-indigo-600 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="glass-panel p-8 rounded-[2.5rem] bg-indigo-600/5 border-indigo-600/10 space-y-6">
              <div className="flex flex-col gap-1">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Protocol Persistence</h4>
                <p className="text-[9px] text-zinc-600 font-bold uppercase">Executing synchronization will update all operator-facing ledgers instantly.</p>
              </div>
              <button
                onClick={async () => {
                  try {
                    await ApiService.updatePaymentSettings(paymentSettings);
                    alert("Financial protocols synchronized with central node.");
                  } catch (err) {
                    alert("Synchronization failure: Admin auth required");
                  }
                }}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-indigo-600/30 active:scale-[0.98] transition-all"
              >
                Synchronize Protocols
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProfileView = ({ user, setUser }: { user: UserState, setUser: React.Dispatch<React.SetStateAction<UserState>> }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user.name);
  const [editedPhone, setEditedPhone] = useState(user.phone || '');
  const [editedCountry, setEditedCountry] = useState(user.country || '');
  const [profileSaved, setProfileSaved] = useState(false);

  const handleSave = async () => {
    try {
      const updated = await ApiService.updateProfile({ name: editedName, phone: editedPhone, country: editedCountry });
      setUser(prev => ({ ...prev, name: updated.name, phone: updated.phone, country: updated.country }));
      setIsEditing(false);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch {
      setUser(prev => ({ ...prev, name: editedName, phone: editedPhone, country: editedCountry }));
      setIsEditing(false);
    }
  };

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-[1200px] mx-auto overflow-y-auto h-full pb-32 no-scrollbar">
      <div className="flex flex-col md:flex-row items-center gap-8 pb-8 border-b border-[var(--panel-border)]">
        <div className="relative group">
          <div className="absolute -inset-1 blur-2xl bg-indigo-500/30 group-hover:bg-indigo-500/50 transition-all opacity-0 group-hover:opacity-100" />
          {user.avatar ? (
            <img src={user.avatar} alt="Profile" className="relative w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] border-4 border-[var(--panel-border)] shadow-2xl object-cover" />
          ) : (
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] border-4 border-[var(--panel-border)] shadow-2xl bg-indigo-600 flex items-center justify-center">
              <span className="text-5xl md:text-6xl font-black text-white">{initials}</span>
            </div>
          )}
          <button className="absolute bottom-2 right-2 p-3 bg-indigo-600 text-white rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all">
            <Camera className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-600/10 border border-indigo-600/30 rounded-full">
            <ShieldCheck className="w-3 h-3 text-indigo-500" />
            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{user.verified ? 'Verified' : 'Unverified'} Institutional Operator</span>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="text-4xl md:text-5xl font-black text-[var(--text-primary)] italic tracking-tighter uppercase bg-transparent border-b border-indigo-500 max-w-full focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Phone</label>
                  <input
                    value={editedPhone}
                    onChange={(e) => setEditedPhone(e.target.value)}
                    className="w-full bg-[var(--background)] border border-[var(--panel-border)] rounded-xl px-4 py-3 text-xs font-bold text-[var(--text-primary)] focus:outline-none"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Country</label>
                  <input
                    value={editedCountry}
                    onChange={(e) => setEditedCountry(e.target.value)}
                    className="w-full bg-[var(--background)] border border-[var(--panel-border)] rounded-xl px-4 py-3 text-xs font-bold text-[var(--text-primary)] focus:outline-none"
                    placeholder="United States"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-center md:justify-start">
                <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-500 transition-all">Save Changes</button>
                <button onClick={() => { setIsEditing(false); setEditedName(user.name); setEditedPhone(user.phone || ''); setEditedCountry(user.country || ''); }} className="px-6 py-2 bg-[var(--panel-border)] text-[var(--text-secondary)] rounded-xl text-xs font-black uppercase tracking-widest hover:text-[var(--text-primary)] transition-all">Cancel</button>
              </div>
              {profileSaved && <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Profile saved successfully</span>}
            </div>
          ) : (
            <>
              <h1 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] italic tracking-tighter uppercase">{user.name || 'Unnamed Operator'}</h1>
              <p className="text-[var(--text-secondary)] font-medium max-w-xl mx-auto md:mx-0">{user.email}</p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <User className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">ID: {user.id || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Globe className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">{user.country || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Phone className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">{user.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Joined: {user.joined || '—'}</span>
                </div>
                <button onClick={() => setIsEditing(true)} className="text-xs font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-400 transition-colors ml-2 underline underline-offset-4">Edit Profile</button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        <div className="terminal-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="terminal-label">Account Summary</h3>
            <Wallet className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Balance</span>
              <span className="text-sm font-mono font-black text-emerald-400">${user.balance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Equity</span>
              <span className="text-sm font-mono font-black text-[var(--text-primary)]">${user.equity.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Free Margin</span>
              <span className="text-sm font-mono font-black text-indigo-400">${user.freeMargin.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Open Trades</span>
              <span className="text-sm font-mono font-black text-[var(--text-primary)]">{(user.trades || []).filter(t => t.status === 'OPEN').length}</span>
            </div>
          </div>
        </div>

        <div className="terminal-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="terminal-label">Account Status</h3>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--background)] border border-[var(--panel-border)]">
              <div className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">Status: {user.status || 'Active'}</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--background)] border border-[var(--panel-border)]">
              <div className={`w-2 h-2 rounded-full ${user.verified ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">Verification: {user.verified ? 'Complete' : 'Pending'}</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--background)] border border-[var(--panel-border)]">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">2FA Security Active</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--background)] border border-[var(--panel-border)]">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">IP Whitelisting Enabled</span>
            </div>
          </div>
        </div>

        <div className="terminal-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="terminal-label">Contact Info</h3>
            <Phone className="w-4 h-4 text-amber-500" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Email</span>
              <span className="text-sm font-mono text-[var(--text-primary)]">{user.email || '—'}</span>
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Phone</span>
              <span className="text-sm font-mono text-[var(--text-primary)]">{user.phone || '—'}</span>
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Country</span>
              <span className="text-sm font-mono text-[var(--text-primary)]">{user.country || '—'}</span>
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Role</span>
              <span className="text-sm font-mono text-indigo-400">{user.isAdmin ? 'Administrator' : 'Trader'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- View: Account ---

const AccountView = ({ user, setUser, paymentSettings }: { user: UserState, setUser: React.Dispatch<React.SetStateAction<UserState>>, paymentSettings: any }) => {
  const [activeSubTab, setActiveSubTab] = useState<'deposit' | 'withdraw' | 'security' | 'account'>('deposit');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [selectedWithdrawMethod, setSelectedWithdrawMethod] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  return (
    <div className="h-full flex flex-col min-h-0 bg-[var(--background)] animate-in fade-in duration-700 p-3 md:p-8 overflow-y-auto custom-scrollbar pb-32">
      <div className="mb-8">
        <span className="terminal-label">Financial Services Matrix</span>
        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Financial <span className="text-indigo-500">Terminal</span></h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-8">
        {/* Left: Navigation & Profile Info */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl mb-6">
            <div className="flex bg-[var(--background)] p-1 rounded-2xl border border-[var(--panel-border)] mb-6 shadow-inner">
              {(['deposit', 'withdraw', 'account', 'security'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveSubTab(tab)}
                  className={cn(
                    "flex-1 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                    activeSubTab === tab ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Account Summary Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-600/20 to-transparent border border-indigo-600/20 mb-4">
              <div className="flex flex-col gap-2">
                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Account Tier</span>
                <span className="text-sm font-black text-white uppercase tracking-widest">Premium Trader</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-[var(--background)] rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full" />
                  </div>
                  <span className="text-[8px] font-black text-emerald-400">Gold</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-[var(--background)] border border-[var(--panel-border)] group hover:border-indigo-600/50 transition-all cursor-pointer shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Verification</span>
                    <span className={cn("text-sm font-bold", user.verified ? "text-emerald-500" : "text-amber-500")}>{user.verified ? 'Identity Verified' : 'Verification Pending'}</span>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--background)] border border-[var(--panel-border)] shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Execution</span>
                    <span className="text-sm font-bold text-[var(--text-primary)]">Instant Execution</span>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--background)] border border-[var(--panel-border)] shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-amber-400 font-black uppercase tracking-widest">Leverage</span>
                    <span className="text-sm font-bold text-[var(--text-primary)]">1:100</span>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--background)] border border-[var(--panel-border)] shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-rose-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-rose-400 font-black uppercase tracking-widest">Total Trades</span>
                    <span className="text-sm font-bold text-[var(--text-primary)]">{(user.trades || []).length} Orders</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl border-rose-500/10">
            <h4 className="text-rose-400 font-black uppercase tracking-widest text-[10px] mb-2">Notice</h4>
            <p className="text-zinc-500 text-[10px] leading-relaxed">Trading CFDs involves significant risk. 74-89% of retail investor accounts lose money. Ensure you understand the risks.</p>
          </div>
        </div>

        {/* Right: Active Tab Content */}
        <div className="lg:col-span-2">
          {activeSubTab === 'deposit' && (
            <div className="glass-panel p-6 md:p-8 rounded-3xl space-y-6 md:space-y-8 animate-in fade-in duration-500">
              {!paymentSettings.depositEnabled ? (
                <div className="h-64 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                    <ShieldAlert className="w-8 h-8 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Deposit Protocol Suspended</h3>
                    <p className="text-zinc-500 text-sm font-bold uppercase mt-2">For deposit contact admin on WhatsApp</p>
                    {paymentSettings.whatsappUrl && (
                      <div className="flex flex-col gap-2 mt-4">
                        <a href={paymentSettings.whatsappUrl} target="_blank" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-4">MESSAGE OPERATOR</a>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      // Close the current tab and open chat
                      const chatBtn = document.querySelector('button[class*="fixed bottom-24"]') as HTMLButtonElement;
                      if (chatBtn) chatBtn.click();
                    }}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20"
                  >
                    Open Support Channel
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <h3 className="text-lg md:text-xl font-black text-[var(--text-primary)] tracking-widest uppercase">Select Deposit Method</h3>
                    <p className="text-[var(--text-secondary)] text-[10px] md:text-xs font-bold uppercase tracking-tighter">Funds are credited instantly to your operational ledger.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {[
                      { id: 'wire', label: 'Bank Wire', icon: Banknote, subtitle: 'SWIFT / SEPA' },
                      { id: 'crypto', label: 'Digital Assets', icon: TrendingUp, subtitle: 'BTC, ETH, USDT' },
                      { id: 'wallet', label: 'E-Wallet', icon: Globe, subtitle: 'PayPal / Skrill' }
                    ].map((method) => (
                      <button
                        key={method.id}
                        onClick={() => {
                          setSelectedMethod(method.id);
                        }}
                        className={cn(
                          "p-6 rounded-2xl bg-[var(--background)] border transition-all text-left flex flex-col gap-4 active:scale-[0.98] shadow-sm",
                          selectedMethod === method.id ? "border-indigo-600 ring-1 ring-indigo-600/50" : "border-[var(--panel-border)] hover:border-indigo-600/30"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                          selectedMethod === method.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "bg-[var(--panel-bg)] text-[var(--text-secondary)] border border-[var(--panel-border)]"
                        )}>
                          <method.icon className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                          <span className={cn("text-sm font-black uppercase tracking-widest", selectedMethod === method.id ? "text-indigo-600 dark:text-indigo-400" : "text-[var(--text-primary)]")}>{method.label}</span>
                          <span className="text-[10px] text-[var(--text-secondary)] font-bold">{method.subtitle}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {selectedMethod === 'wire' && (
                    <div className="space-y-4 animate-in slide-in-from-top duration-300">
                      <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Bank Wire Matrix</h4>
                      <div className="p-6 rounded-3xl bg-[var(--panel-bg)] border border-[var(--panel-border)] space-y-6">
                        {[
                          { label: 'Settlement Bank', value: paymentSettings.bankDetails.bankName },
                          { label: 'Account Number', value: paymentSettings.bankDetails.accountNumber },
                          { label: 'SWIFT / BIC', value: paymentSettings.bankDetails.swiftCode },
                          { label: 'Beneficiary', value: paymentSettings.bankDetails.holderName }
                        ].map((item, i) => (
                          <div key={i} className="flex flex-col gap-1 border-b border-[var(--panel-border)]/50 pb-4 last:border-0 last:pb-0">
                            <span className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{item.label}</span>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[var(--text-primary)] tracking-widest">{item.value}</span>
                              <button onClick={() => { navigator.clipboard.writeText(item.value); alert('Copied: ' + item.label); }} className="text-indigo-500 hover:text-white transition-colors">
                                <History className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedMethod === 'wallet' && (
                    <div className="space-y-4 animate-in slide-in-from-top duration-300">
                      <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">E-Wallet Gateways</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {paymentSettings.eWallets.map((wallet: any) => (
                          <div key={wallet.id} className="p-5 rounded-3xl bg-[var(--panel-bg)] border border-[var(--panel-border)] flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                              <div className="px-2 py-1 bg-emerald-600/10 rounded text-[8px] font-black text-emerald-500 uppercase tracking-widest">{wallet.type}</div>
                              <span className="text-[8px] text-[var(--text-secondary)] font-bold uppercase">{wallet.label}</span>
                            </div>
                            <div className="flex items-center justify-between bg-[var(--background)] rounded-xl px-4 py-2 border border-[var(--panel-border)]">
                              <span className="text-[10px] font-mono text-[var(--text-secondary)] truncate max-w-[150px]">{wallet.value}</span>
                              <button onClick={() => { navigator.clipboard.writeText(wallet.value); alert('Wallet address copied'); }} className="text-[var(--text-secondary)] hover:text-emerald-500">
                                <History className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedMethod === 'crypto' && (
                    <div className="space-y-4 animate-in slide-in-from-top duration-300">
                      <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Available Settlement Ledgers</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {paymentSettings.cryptoAddresses.map((addr: any) => (
                          <div key={addr.id} className="p-4 rounded-2xl bg-[var(--panel-bg)]/30 border border-[var(--panel-border)] flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">{addr.type}</span>
                              <span className="text-[8px] text-[var(--text-secondary)] font-bold uppercase">{addr.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                readOnly
                                value={addr.value}
                                className="flex-1 bg-[var(--background)] border border-[var(--panel-border)] rounded-lg px-3 py-2 text-[9px] font-mono text-[var(--text-secondary)] focus:outline-none"
                              />
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(addr.value);
                                  alert('Address copied to clipboard');
                                }}
                                className="p-2 bg-[var(--panel-border)] hover:bg-zinc-700 rounded-lg text-[var(--text-secondary)] transition-colors"
                              >
                                <History className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-6 border-t border-zinc-900">
                    <button
                      onClick={() => {
                        if (selectedMethod) {
                          setUser((prev: any) => ({ ...prev, balance: prev.balance + 5000 }));
                          alert(`Mock Deposit of $5,000 processed via ${selectedMethod}.`);
                        }
                      }}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-indigo-600/20 hover:scale-[1.01] transition-all"
                    >
                      Confirm Protocol Selection
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeSubTab === 'withdraw' && (
            <div className="glass-panel p-6 md:p-8 rounded-3xl bg-[var(--panel-bg)] border-[var(--panel-border)] space-y-6 md:space-y-8 animate-in fade-in duration-500">
              <div className="space-y-2">
                <h3 className="text-lg md:text-xl font-black text-[var(--text-primary)] tracking-widest uppercase">Select Withdrawal Route</h3>
                <p className="text-[var(--text-secondary)] text-[10px] md:text-xs font-bold uppercase tracking-tighter">Funds are processed according to institutional settlement protocols.</p>
              </div>                 <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 md:gap-4">
                {[
                  { id: 'wire', label: 'Institutional Wire', icon: Banknote, subtitle: 'SWIFT Settlement' },
                  { id: 'crypto', label: 'Digital Ledger', icon: TrendingUp, subtitle: 'Blockchain TX' },
                  { id: 'wallet', label: 'E-Gateway', icon: Globe, subtitle: 'Instant Wallet' }
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedWithdrawMethod(method.id)}
                    className={cn(
                      "p-6 rounded-2xl bg-[var(--background)] border transition-all text-left flex flex-col gap-4 active:scale-[0.98]",
                      selectedWithdrawMethod === method.id ? "border-rose-600 ring-1 ring-rose-600/50" : "border-[var(--panel-border)] hover:border-rose-600/30"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                      selectedWithdrawMethod === method.id ? "bg-rose-600 text-white" : "bg-[var(--panel-bg)] text-[var(--text-secondary)] border border-[var(--panel-border)]"
                    )}>
                      <method.icon className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col">
                      <span className={cn("text-sm font-black uppercase tracking-widest", selectedWithdrawMethod === method.id ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]")}>{method.label}</span>
                      <span className="text-[10px] text-[var(--text-secondary)] font-bold">{method.subtitle}</span>
                    </div>
                  </button>
                ))}
              </div>

              {selectedWithdrawMethod && (
                <div className="space-y-6 animate-in slide-in-from-top duration-300">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest pl-1">Amount to Transfer</label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="0.00"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          className="w-full h-14 bg-[var(--background)] border border-[var(--panel-border)] rounded-2xl px-6 font-black text-[var(--text-primary)] font-mono focus:ring-2 focus:ring-rose-600/30 transition-all text-xl"
                        />
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-[var(--text-secondary)] text-sm">USD</span>
                      </div>
                    </div>

                    {selectedWithdrawMethod === 'crypto' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest pl-1">Destination Address</label>
                        <input type="text" placeholder="Paste Wallet Address..." className="w-full h-14 bg-[var(--background)] border border-[var(--panel-border)] rounded-2xl px-6 font-bold text-[var(--text-primary)] focus:ring-2 focus:ring-rose-600/30 transition-all font-mono text-xs" />
                      </div>
                    )}

                    {selectedWithdrawMethod === 'wire' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest pl-1">Beneficiary Account (IBAN/Number)</label>
                        <input type="text" placeholder="Enter Full Bank Details..." className="w-full h-14 bg-[var(--background)] border border-[var(--panel-border)] rounded-2xl px-6 font-bold text-[var(--text-primary)] focus:ring-2 focus:ring-rose-600/30 transition-all" />
                      </div>
                    )}

                    {selectedWithdrawMethod === 'wallet' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest pl-1">E-Wallet ID / Email</label>
                        <input type="email" placeholder="Verification Email..." className="w-full h-14 bg-[var(--background)] border border-[var(--panel-border)] rounded-2xl px-6 font-bold text-[var(--text-primary)] focus:ring-2 focus:ring-rose-600/30 transition-all" />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={async () => {
                      const amt = parseFloat(withdrawAmount);
                      if (amt > user.balance) {
                        alert('Insufficient ledger balance for this protocol.');
                        return;
                      }
                      try {
                        await ApiService.adjustBalance(user.id, -amt);
                        alert(`Withdrawal request for $${withdrawAmount} via ${selectedWithdrawMethod} has been submitted for verification.`);
                        setUser(prev => ({ ...prev, balance: prev.balance - amt }));
                        setWithdrawAmount('');
                      } catch (err) {
                        alert("Withdrawal failed: Ledger unavailable");
                      }
                    }}
                    className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-rose-600/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                    Execute Transfer Protocol
                  </button>
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'account' && (
            <div className="glass-panel p-6 md:p-8 rounded-3xl space-y-6 md:space-y-8 animate-in fade-in duration-500">
              <div className="space-y-2">
                <h3 className="text-lg md:text-xl font-black text-[var(--text-primary)] tracking-widest uppercase">Account Details</h3>
                <p className="text-[var(--text-secondary)] text-[10px] md:text-xs font-bold uppercase tracking-tighter">Your trading account configuration and limits.</p>
              </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div className="p-5 rounded-2xl bg-[var(--background)] border border-[var(--panel-border)] space-y-3">
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Account ID</span>
                  <span className="text-sm font-mono font-black text-[var(--text-primary)]">{user.id || '—'}</span>
                </div>
                <div className="p-5 rounded-2xl bg-[var(--background)] border border-[var(--panel-border)] space-y-3">
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Account Type</span>
                  <span className="text-sm font-black text-indigo-400 uppercase tracking-widest">Premium</span>
                </div>
                <div className="p-5 rounded-2xl bg-[var(--background)] border border-[var(--panel-border)] space-y-3">
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Leverage</span>
                  <span className="text-sm font-black text-amber-400">1:100</span>
                </div>
                <div className="p-5 rounded-2xl bg-[var(--background)] border border-[var(--panel-border)] space-y-3">
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Base Currency</span>
                  <span className="text-sm font-black text-[var(--text-primary)]">USD</span>
                </div>
                <div className="p-5 rounded-2xl bg-[var(--background)] border border-[var(--panel-border)] space-y-3">
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Margin Call Level</span>
                  <span className="text-sm font-black text-rose-400">100%</span>
                </div>
                <div className="p-5 rounded-2xl bg-[var(--background)] border border-[var(--panel-border)] space-y-3">
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Stop Out Level</span>
                  <span className="text-sm font-black text-rose-500">50%</span>
                </div>
                <div className="p-5 rounded-2xl bg-[var(--background)] border border-[var(--panel-border)] space-y-3">
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Commission</span>
                  <span className="text-sm font-black text-[var(--text-primary)]">$3.5 per lot</span>
                </div>
                <div className="p-5 rounded-2xl bg-[var(--background)] border border-[var(--panel-border)] space-y-3">
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Max Open Positions</span>
                  <span className="text-sm font-black text-[var(--text-primary)]">50</span>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-600/10 to-transparent border border-indigo-600/20 space-y-4">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Trading Conditions</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[10px]">
                  <div className="flex flex-col gap-1">
                    <span className="text-zinc-500 font-bold uppercase">Min Deposit</span>
                    <span className="text-[var(--text-primary)] font-black">$10</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-zinc-500 font-bold uppercase">Max Leverage</span>
                    <span className="text-[var(--text-primary)] font-black">1:500</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-zinc-500 font-bold uppercase">Spread Type</span>
                    <span className="text-[var(--text-primary)] font-black">Variable</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'security' && (
            <div className="glass-panel p-6 md:p-8 rounded-3xl space-y-6 md:space-y-8 animate-in fade-in duration-500">
              <div className="space-y-2">
                <h3 className="text-lg md:text-xl font-black text-[var(--text-primary)] tracking-widest uppercase">Security Settings</h3>
                <p className="text-[var(--text-secondary)] text-[10px] md:text-xs font-bold uppercase tracking-tighter">Manage your account security and access controls.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 rounded-2xl bg-[var(--background)] border border-[var(--panel-border)]">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">Two-Factor Authentication</span>
                    <span className="text-[8px] text-zinc-500 font-bold uppercase">Protect your account with 2FA</span>
                  </div>
                  <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all">
                    Enable
                  </button>
                </div>

                <div className="flex items-center justify-between p-5 rounded-2xl bg-[var(--background)] border border-[var(--panel-border)]">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">Change Password</span>
                    <span className="text-[8px] text-zinc-500 font-bold uppercase">Update your login credentials</span>
                  </div>
                  <button className="px-6 py-2.5 bg-[var(--panel-border)] text-[var(--text-secondary)] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-zinc-600 transition-all">
                    Update
                  </button>
                </div>

                <div className="flex items-center justify-between p-5 rounded-2xl bg-[var(--background)] border border-[var(--panel-border)]">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">Session Management</span>
                    <span className="text-[8px] text-zinc-500 font-bold uppercase">View active sessions and devices</span>
                  </div>
                  <button className="px-6 py-2.5 bg-[var(--panel-border)] text-[var(--text-secondary)] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-zinc-600 transition-all">
                    Review
                  </button>
                </div>

                <div className="flex items-center justify-between p-5 rounded-2xl bg-[var(--background)] border border-[var(--panel-border)]">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">IP Whitelisting</span>
                    <span className="text-[8px] text-zinc-500 font-bold uppercase">Restrict access to trusted IPs</span>
                  </div>
                  <button className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all">
                    Active
                  </button>
                </div>

                <div className="flex items-center justify-between p-5 rounded-2xl bg-[var(--background)] border border-[var(--panel-border)]">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">KYC Documents</span>
                    <span className="text-[8px] text-zinc-500 font-bold uppercase">Upload verification documents</span>
                  </div>
                  <button className="px-6 py-2.5 bg-amber-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-500 transition-all">
                    Upload
                  </button>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-rose-600/5 border border-rose-600/10">
                <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-4">Recent Login Activity</h4>
                <div className="space-y-3">
                  {[
                    { device: 'Chrome / Windows', location: 'New York, US', time: '2 minutes ago', ip: '192.168.1.1' },
                    { device: 'Safari / macOS', location: 'London, UK', time: 'Yesterday at 14:32', ip: '10.0.0.1' },
                  ].map((session, i) => (
                    <div key={i} className="flex flex-col gap-1 p-3 rounded-xl bg-[var(--background)] border border-[var(--panel-border)]">
                      <div className="flex justify-between">
                        <span className="text-[10px] font-bold text-[var(--text-primary)]">{session.device}</span>
                        <span className="text-[8px] text-zinc-500 font-mono">{session.ip}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[8px] text-zinc-500">{session.location}</span>
                        <span className="text-[8px] text-zinc-600">{session.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('apex_theme');
    return (saved as 'dark' | 'light') || 'dark';
  });
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('apex_theme', theme);
  }, [theme]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [user, setUser] = useState(EMPTY_USER);
  const [platformUsers, setPlatformUsers] = useState<any[]>([]);
  const [paymentSettings, setPaymentSettings] = useState({
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
  });
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);

  // Load messages from server on mount
  React.useEffect(() => {
    if (!isAuthenticated) return;
    ApiService.getMessages().then(msgs => {
      setMessages(msgs.length > 0 ? msgs : [
        { id: 1, sender: 'system', text: 'Protocol established. How can we assist your operations today?', time: '09:00', userName: 'System', userId: 'sys' }
      ]);
    }).catch(() => {
      setMessages([
        { id: 1, sender: 'system', text: 'Protocol established. How can we assist your operations today?', time: '09:00', userName: 'System', userId: 'sys' }
      ]);
    });
  }, [isAuthenticated]);

  const selectedAsset = (assets.find(a => a.id === selectedAssetId) || assets[0]) || null;

  // Simulation of market movements (Sync with Server)
  React.useEffect(() => {
    if (!isAuthenticated) return;

    const fetchAssets = async () => {
      try {
        const data = await ApiService.getAssets();
        setAssets(data);
        if (data.length > 0 && !selectedAssetId) {
          setSelectedAssetId(data[0].id);
        }
      } catch (err) {
        console.error("Asset sync failed", err);
      }
    };

    const fetchPaymentSettings = async () => {
      try {
        const data = await ApiService.getPaymentSettings();
        setPaymentSettings(prev => ({
          ...prev,
          ...data,
          // Ensure critical nested objects exist
          cryptoAddresses: data.cryptoAddresses || prev.cryptoAddresses || [],
          eWallets: data.eWallets || prev.eWallets || [],
          bankDetails: { ...(prev.bankDetails || {}), ...(data.bankDetails || {}) },
          bonusAmount: data.bonusAmount ?? prev.bonusAmount ?? 0,
          depositEnabled: data.depositEnabled ?? prev.depositEnabled ?? true
        }));
      } catch (err) {
        console.error("Payment settings sync failed", err);
      }
    };

    fetchAssets();
    fetchPaymentSettings();
    const interval = setInterval(fetchAssets, 2000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Persistent Session Check
  React.useEffect(() => {
    const checkSession = async () => {
      const storedSession = localStorage.getItem("z_session_id");
      if (storedSession) {
        try {
          const userData = await ApiService.getMe();
          setUser({ ...EMPTY_USER, ...userData });
          setIsAuthenticated(true);
        } catch (err) {
          ApiService.clearSession();
        }
      }
    };
    checkSession();
  }, []);

  // Recalculate trade profits and account metrics when prices move
  React.useEffect(() => {
    setUser(prevUser => {
      const tradesToUpdate = Array.isArray(prevUser.trades) ? prevUser.trades : [];
      const updatedTrades = tradesToUpdate.map(trade => {
        if (trade.status === 'CLOSED') return trade;

        const asset = assets.find(a => a.symbol === trade.symbol);
        if (!asset) return trade;

        // Forex uses 100k units per lot, Gold 100 units, BTC 1 unit
        let multiplier = 100000;
        if (trade.symbol === 'GOLD') multiplier = 100;
        if (trade.symbol === 'BTC/USD') multiplier = 1;

        const pipsChange = trade.type === 'BUY'
          ? (asset.price - trade.openPrice)
          : (trade.openPrice - asset.price);

        const profit = pipsChange * trade.lot * multiplier;

        return { ...trade, profit };
      });

      const openTrades = Array.isArray(updatedTrades) ? updatedTrades.filter(t => t.status === 'OPEN') : [];
      const totalProfit = openTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
      const equity = Math.max(0, (prevUser.balance || 0) + totalProfit);
      const margin = openTrades.reduce((sum, t) => {
        // Simple margin calculation: 1% for FX, 2% for commodities/crypto
        const rate = t.symbol.includes('/') ? 0.002 : 0.01;
        const asset = assets.find(a => a.symbol === t.symbol);
        if (!asset) return sum;
        let multiplier = 100000;
        if (t.symbol === 'GOLD') multiplier = 100;
        if (t.symbol === 'BTC/USD') multiplier = 1;
        return sum + (asset.price * t.lot * multiplier * rate);
      }, 0);

      return {
        ...prevUser,
        trades: updatedTrades,
        equity: equity,
        margin: margin,
        freeMargin: equity - margin
      };
    });
  }, [assets]);



  const handlePlaceTrade = async (type: 'BUY' | 'SELL', lot: number) => {
    const asset = assets.find(a => a.id === selectedAssetId);
    if (!asset) return;

    try {
      const result = await ApiService.placeTrade(asset.id, type, lot);
      
      if (result.trade) {
        // Add the new trade to user's trades
        setUser(prev => ({
          ...prev,
          balance: result.newBalance,
          trades: [result.trade, ...prev.trades]
        }));
      }
    } catch (err) {
      console.error("Trade execution failed", err);
      alert("Trade execution failed: " + (err as Error).message);
    }
  };

  const handleCloseTrade = async (tradeId: string) => {
    // In the new binary options system, trades are closed immediately with win/loss
    // This function is kept for compatibility but trades auto-close
    setUser(prev => {
      const trade = prev.trades.find(t => t.id === tradeId);
      if (!trade || trade.status === 'CLOSED') return prev;

      const updatedTrades = prev.trades.map(t =>
        t.id === tradeId
          ? { ...t, status: 'CLOSED' as const, closePrice: assets.find(a => a.symbol === t.symbol)?.price || t.openPrice }
          : t
      );

      return {
        ...prev,
        balance: Math.max(0, prev.balance + trade.profit),
        trades: updatedTrades
      };
    });
  };

  const handleUpdateAvatar = (url: string) => {
    setUser(prev => ({ ...prev, avatar: url }));
  };

  const handleSendMessage = async (text: string, sender: 'user' | 'admin' = 'user') => {
    if (!text.trim()) return;
    try {
      const savedMsg = await ApiService.sendMessage(text, sender);
      setMessages(prev => [...prev, savedMsg]);
    } catch {
      // Fallback: add locally
      const newMessage = {
        id: Date.now(),
        sender,
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        userName: user.name,
        userId: user.id
      };
      setMessages(prev => [...prev, newMessage]);
    }
  };

  const handleAuth = async (data: { name?: string, email: string, isRegistration: boolean, bonusClaimed?: boolean, user?: any }) => {
    try {
      // Use passed user if available, fallback to getMe
      const userData = data.user || await ApiService.getMe();
      setUser({ ...EMPTY_USER, ...userData, trades: userData.trades || [] });
      setIsAuthenticated(true);
    } catch (err) {
      console.error("Auth sync failed", err);
    }
  };

  if (!isAuthenticated) {
    return <AuthPage onLogin={handleAuth} />;
  }

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView setActiveTab={setActiveTab} user={user} assets={assets} onCloseTrade={handleCloseTrade} />;
      case 'markets': return <MarketsView selectedAsset={selectedAsset} setSelectedAsset={(a) => setSelectedAssetId(a.id)} assets={assets} onPlaceTrade={handlePlaceTrade} user={user} />;
      case 'news': return <NewsView />;
      case 'history': return <HistoryView user={user} />;
      case 'profile': return <ProfileView user={user} setUser={setUser} />;
      case 'admin': return (
        <AdminView
          assets={assets}
          setAssets={setAssets}
          platformUsers={platformUsers}
          setPlatformUsers={setPlatformUsers}
          paymentSettings={paymentSettings}
          setPaymentSettings={setPaymentSettings}
          currentUser={user}
          setCurrentUser={setUser}
          messages={messages}
          onReply={(text) => handleSendMessage(text, 'admin')}
        />
      );
      case 'settings': return <AccountView user={user} setUser={setUser} paymentSettings={paymentSettings} />;
      default: return <DashboardView setActiveTab={setActiveTab} user={user} assets={assets} onCloseTrade={handleCloseTrade} />;
    }
  };

  const handleLogout = () => {
    ApiService.clearSession();
    setIsAuthenticated(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className={cn(
      "min-h-screen flex flex-col transition-all duration-500 font-sans selection:bg-indigo-500/30",
      theme === 'light' ? 'light bg-white text-slate-900' : 'dark bg-[#020203] text-white'
    )}>
      <AnimatePresence>
        {isLoading && <SplashScreen onFinish={() => setIsLoading(false)} />}
      </AnimatePresence>

      {!isLoading && <WithdrawalPopup />}

      {/* High Density System Header */}
      <TechnicalHeader
        user={user}
        theme={theme}
        setTheme={setTheme}
        setActiveTab={setActiveTab}
        onMenuToggle={() => setIsMobileMenuOpen(true)}
      />

      <main className="flex-1 flex overflow-hidden relative">
        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                className="fixed inset-y-0 left-0 w-72 bg-[var(--panel-bg)] backdrop-blur-2xl border-r border-[var(--panel-border)] z-[101] md:hidden p-6 flex flex-col"
              >
                <div className="flex items-center justify-between mb-8">
                  <span className="text-xl font-black italic text-[var(--text-primary)] uppercase tracking-tighter">Apex <span className="text-indigo-500">Terminal</span></span>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-[var(--text-secondary)]"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar">
                  <div>
                    <h3 className="terminal-label mb-4">System Modules</h3>
                    <div className="space-y-1">
                      {[
                        { id: 'dashboard', icon: LayoutDashboard, label: 'Operational Dashboard' },
                        { id: 'markets', icon: TrendingUp, label: 'Trading Terminal' },
                        { id: 'news', icon: Globe, label: 'Market Intelligence' },
                        { id: 'history', icon: History, label: 'Capital Ledger' },
                        { id: 'profile', icon: User, label: 'Operator Dossier' },
                      ].map(item => (
                        <button
                          key={item.id}
                          onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                            activeTab === item.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-[var(--text-secondary)] hover:bg-white/5"
                          )}
                        >
                          <item.icon className="w-4 h-4" />
                          <span className="text-[11px] font-black uppercase tracking-widest leading-none">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="terminal-label mb-4 opacity-40">Strategic Access</h3>
                    <div className="space-y-1">
                      {user.isAdmin && (
                        <button
                          onClick={() => { setActiveTab('admin'); setIsMobileMenuOpen(false); }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border border-indigo-500/30",
                            activeTab === 'admin' ? "bg-indigo-600/20 text-indigo-400" : "text-indigo-500 hover:bg-indigo-600/10"
                          )}
                        >
                          <ShieldAlert className="w-4 h-4" />
                          <span className="text-[11px] font-black uppercase tracking-widest leading-none">Command Center</span>
                        </button>
                      )}

                      <button
                        onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                          activeTab === 'settings' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-[var(--text-secondary)] hover:bg-white/5"
                        )}
                      >
                        <Settings className="w-4 h-4" />
                        <span className="text-[11px] font-black uppercase tracking-widest leading-none">System Settings</span>
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="mt-auto w-full flex items-center gap-3 px-4 py-4 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all border border-rose-500/20"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-[11px] font-black uppercase tracking-widest leading-none">Terminate Session</span>
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Terminal Rail Navigation */}
        <CommandRail activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={user.isAdmin} />

        {/* Viewport Container */}
        <div className="flex-1 overflow-y-auto relative custom-scrollbar flex flex-col h-[calc(100vh-64px)] md:h-[calc(100vh-64px)]">
          <div className="flex-1">
            {renderView()}
          </div>
        </div>
      </main>


      {/* Persistent Support Portal */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-24 md:bottom-8 right-8 w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-600/30 z-[60] transition-all active:scale-95 group"
      >
        <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-black rounded-full" />
      </button>

      <SupportChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={messages}
        paymentSettings={paymentSettings}
        onSendMessage={async (txt) => {
          await handleSendMessage(txt);
          setTimeout(() => {
            handleSendMessage("Analysis: Data stream acknowledged. Your protocol has been validated by our intelligence node.", 'admin');
          }, 1000);
        }}
      />


      {/* Mobile Bottom Navigation (Persistent State) */}
      <div className="md:hidden fixed bottom-1 left-0 right-0 z-50 px-6 pb-6 pt-2 pointer-events-none">
        <div className="bg-[var(--panel-bg)]/80 backdrop-blur-2xl border border-[var(--panel-border)] rounded-full h-16 flex items-center justify-around px-4 pointer-events-auto shadow-[var(--card-shadow)] ring-1 ring-white/5">
          {[
            { id: 'dashboard', label: 'Wallet', icon: Wallet },
            { id: 'markets', label: 'Trade', icon: TrendingUp },
            { id: 'news', label: 'Feed', icon: Globe },
            { id: 'profile', label: 'User', icon: User },
            { id: 'settings', label: 'Gear', icon: Settings }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "relative flex flex-col items-center justify-center w-12 h-12 transition-all duration-300",
                activeTab === item.id ? "text-indigo-500 scale-110" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <item.icon className={cn("w-5 h-5 transition-transform", activeTab === item.id && "drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]")} />
              <AnimatePresence>
                {activeTab === item.id && (
                  <motion.div
                    layoutId="active-nav-dot"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="absolute -bottom-1 w-1 h-1 bg-indigo-500 rounded-full"
                  />
                )}
              </AnimatePresence>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
