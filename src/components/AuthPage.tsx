import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Hexagon, Mail, Lock, User, ArrowRight, Github, Phone, Globe, Gift, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { ApiService } from '../services/apiService';

export default function AuthPage({ onLogin }: { onLogin: (data: { name?: string, email: string, isRegistration: boolean, bonusClaimed?: boolean, user?: any }) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showBonusPopup, setShowBonusPopup] = useState(false);
  const [tempUserData, setTempUserData] = useState<any>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    try {
        if (!isLogin) {
            const data = await ApiService.register(name, cleanEmail, password, phone, country);
            ApiService.setSession(data.sessionId);
            setTempUserData(data.user);
            setShowBonusPopup(true);
        } else {
            const data = await ApiService.login(cleanEmail, password);
            ApiService.setSession(data.sessionId);
            onLogin({ email: data.user.email, isRegistration: false, user: data.user });
        }
    } catch (err: any) {
        alert(err.message || "Security protocol failure");
    } finally {
        setLoading(false);
    }
  };

  const handleClaimBonus = async () => {
    setLoading(true);
    try {
        const result = await ApiService.claimBonus();
        const updatedUser = { ...tempUserData, balance: result.balance };
        setShowBonusPopup(false);
        onLogin({ name: tempUserData.name, email: tempUserData.email, isRegistration: true, bonusClaimed: true, user: updatedUser });
    } catch (err: any) {
        alert("Bonus extraction failed: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] transition-colors duration-300 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.05),transparent_50%)]" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-400/5 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4 shadow-xl shadow-indigo-600/20">
            <Hexagon className="text-white w-7 h-7 fill-white/10" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Apex Terminal</h1>
          <p className="text-[var(--text-secondary)] mt-2 font-medium">Next-generation financial terminal</p>
        </div>

        <div className="glass-panel p-8 rounded-3xl relative shadow-2xl transition-all">
          <div className="flex bg-[var(--panel-bg)] p-1 rounded-xl mb-8 border border-[var(--panel-border)]">
            <button 
              onClick={() => setIsLogin(true)}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
                isLogin ? "bg-indigo-600 text-white shadow-xl" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              Sign In
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
                !isLogin ? "bg-indigo-600 text-white shadow-xl" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              Get Started
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] px-1">Identity</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                      <input 
                        type="text" 
                        required 
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-xl pl-11 pr-4 py-3.5 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all font-medium"
                      />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] px-1">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                      <input 
                        type="tel" 
                        placeholder="+1 (555) 000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-xl pl-11 pr-4 py-3.5 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all font-medium text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] px-1">Country</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                      <input 
                        type="text" 
                        placeholder="USA"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-xl pl-11 pr-4 py-3.5 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all font-medium text-xs"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] px-1">Terminal ID</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                <input 
                  type="email" 
                  required 
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-xl pl-11 pr-4 py-3.5 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em]">Secret Key</label>
                {isLogin && <button type="button" className="text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold uppercase tracking-widest transition-colors">Recover</button>}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-xl pl-11 pr-4 py-3.5 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all font-medium"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="flex items-start gap-3 px-1">
                <button
                  type="button"
                  onClick={() => setAgreeToTerms(!agreeToTerms)}
                  className={`w-5 h-5 rounded border-2 mt-0.5 shrink-0 flex items-center justify-center transition-all ${
                    agreeToTerms ? 'bg-indigo-600 border-indigo-600' : 'border-[var(--panel-border)] hover:border-indigo-500'
                  }`}
                >
                  {agreeToTerms && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <span className="text-[10px] font-bold text-[var(--text-secondary)] leading-relaxed">
                  I agree to the{' '}
                  <button type="button" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                    Terms & Conditions
                  </button>{' '}
                  and{' '}
                  <button type="button" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                    Privacy Policy
                  </button>
                </span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || (!isLogin && !agreeToTerms)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 group transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="uppercase tracking-widest text-xs">{isLogin ? 'Establish Connection' : 'Register Terminal'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--panel-border)]"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-[var(--background)] px-4 text-[var(--text-secondary)] font-bold">Terminal Auth</span></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-3 py-3 rounded-xl border border-[var(--panel-border)] hover:bg-[var(--panel-bg)] transition-all text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] uppercase tracking-widest">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" alt="Google" />
              Google
            </button>
            <button className="flex items-center justify-center gap-3 py-3 rounded-xl border border-[var(--panel-border)] hover:bg-[var(--panel-bg)] transition-all text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] uppercase tracking-widest">
              <Github className="w-4 h-4" />
              GitHub
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-8 opacity-50 text-[var(--text-secondary)]">
          <p className="text-center text-[10px] font-bold uppercase tracking-widest">
            High-Security Encryption Enabled
          </p>
          <p className="text-center text-[9px] leading-relaxed uppercase tracking-tight px-4">
            Risk Warning: Trading foreign exchange and derivatives involves significant risk and is not suitable for all investors. You could lose more than your initial deposit.
          </p>
        </div>
      </motion.div>

      {/* Bonus Claim Modal */}
      {showBonusPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="w-full max-w-sm glass-panel p-8 rounded-[2rem] text-center space-y-6"
           >
              <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-indigo-600/40 relative">
                 <Gift className="w-10 h-10 text-white" />
                 <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-[#121214]">
                    <CheckCircle className="w-4 h-4 text-white" />
                 </div>
              </div>

              <div className="space-y-2">
                 <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">TERMINAL BONUS</h2>
                 <p className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest">Verification successful. You are eligible for the institutional welcome grant.</p>
              </div>

              <div className="py-6 px-4 bg-indigo-600/10 rounded-2xl border border-indigo-600/20">
                 <span className="text-4xl font-black text-indigo-400 tracking-tighter tabular-nums">$10,000</span>
                 <p className="text-[10px] text-indigo-500 font-black uppercase mt-1">Operational Liquidity</p>
              </div>

               <button 
                onClick={handleClaimBonus}
                disabled={loading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                 {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Claim Grant'}
              </button>

              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter">Terms and conditions apply for withdrawal of bonus funds.</p>
           </motion.div>
        </div>
      )}
    </div>
  );
}
