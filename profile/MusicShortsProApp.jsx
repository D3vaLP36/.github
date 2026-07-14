import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getFirestore, doc, setDoc, collection, onSnapshot,
  updateDoc, addDoc, Timestamp
} from 'firebase/firestore';
import {
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged
} from 'firebase/auth';
import {
  Video, TrendingUp, Settings,
  History, X, Check, ShieldCheck,
  Activity, Sparkles, Cpu, Globe,
  RefreshCw, Play
} from 'lucide-react';

/**
 * MUS!CSHORTS PRO: GOLDEN MASTER BUILD (V5.2)
 * Organization: G3T-!T-.N3T
 * Handle: HuzTL3Rz@pL@3Rzd3vz.CLuB.N3T
 * Infrastructure: Google AI Premium (Verizon Perk) + Cloudflare Edge
 */

// --- CONFIGURATION & INITIALIZATION ---
const getFirebaseConfig = () => {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.__firebase_config || '{}');
  } catch (err) {
    console.error('Invalid __firebase_config JSON', err);
    return {};
  }
};

const getAppId = () => {
  if (typeof window === 'undefined') return 'museshorts-pro-v5';
  return typeof window.__app_id !== 'undefined' ? window.__app_id : 'museshorts-pro-v5';
};

const getRuntimeSettings = () => {
  if (typeof window === 'undefined') {
    return {
      highSpeedMode: false,
      requireCustomToken: false,
      handshakeDelayMs: 2500,
      allowClientSideTopUp: true,
      paymentsApiBase: '/api/payments'
    };
  }

  const defaults = {
    highSpeedMode: false,
    requireCustomToken: false,
    handshakeDelayMs: 2500,
    allowClientSideTopUp: true,
    paymentsApiBase: '/api/payments'
  };
  try {
    const raw = JSON.parse(window.__museshorts_runtime || '{}');
    return {
      highSpeedMode: Boolean(raw.highSpeedMode),
      requireCustomToken: Boolean(raw.requireCustomToken),
      handshakeDelayMs: Number.isFinite(raw.handshakeDelayMs) ? Math.max(150, raw.handshakeDelayMs) : defaults.handshakeDelayMs,
      allowClientSideTopUp: typeof raw.allowClientSideTopUp === 'boolean' ? raw.allowClientSideTopUp : defaults.allowClientSideTopUp,
      paymentsApiBase: typeof raw.paymentsApiBase === 'string' && raw.paymentsApiBase.trim()
        ? raw.paymentsApiBase.trim()
        : defaults.paymentsApiBase
    };
  } catch (err) {
    console.error('Invalid __museshorts_runtime JSON', err);
    return defaults;
  }
};

const firebaseConfig = getFirebaseConfig();
const appId = getAppId();
const runtimeSettings = getRuntimeSettings();
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// --- COMPONENTS ---

const PricingModal = ({ isOpen, onClose, onPurchase }) => {
  if (!isOpen) return null;
  const plans = [
    { id: 'refill', name: 'Refill Pack', price: '$9.99', credits: 50, features: ['50 AI Credits', 'Standard Speed', 'Email Support'], color: 'from-blue-500 to-indigo-500' },
    { id: 'pro', name: 'Studio Pro', price: '$29.00', credits: 500, features: ['500 AI Credits / mo', 'Priority VEO Rendering', 'No Watermarks', 'Commercial License'], recommended: true, color: 'from-blue-600 to-violet-600' }
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative bg-slate-900 border border-white/10 rounded-[3rem] p-12 max-w-4xl w-full shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-500 hover:text-white" type="button"><X size={24} /></button>
        <div className="text-center mb-12 relative z-10">
          <h2 className="text-4xl font-black text-white mb-2 tracking-tighter italic uppercase">Creative Fuel Reserve</h2>
          <p className="text-slate-400">Securely replenish your G3T-!T-.N3T production balance.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 relative z-10">
          {plans.map((plan) => (
            <div key={plan.id} className={`p-8 rounded-[2.5rem] border transition-all hover:scale-[1.02] ${plan.recommended ? 'bg-blue-600/5 border-blue-500/50 shadow-xl shadow-blue-500/10' : 'bg-white/5 border-white/5'}`}>
              {plan.recommended && <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Most Popular Node</div>}
              <h3 className="text-xl font-black text-white mb-2 italic uppercase">{plan.name}</h3>
              <div className="text-4xl font-black text-white mb-8">{plan.price}</div>
              <ul className="space-y-3 mb-10 text-xs text-slate-400 uppercase tracking-wider">
                {plan.features.map((f, i) => <li key={i} className="flex items-center gap-2"><Check size={14} className="text-blue-500" /> {f}</li>)}
              </ul>
              <button onClick={() => onPurchase(plan.credits)} className="w-full py-4 rounded-2xl bg-white text-slate-900 font-black hover:bg-slate-200 transition-all shadow-lg shadow-white/10" type="button">Choose Plan</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  // --- STATE ---
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeMode, setActiveMode] = useState('STUDIO'); // STUDIO, TRENDS, VAULT
  const [subMode, setSubMode] = useState('VEO'); // VEO, IMAGE, LYRICS
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [showPricing, setShowPricing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [outputUrl, setOutputUrl] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const initialAuthToken = typeof window !== 'undefined' ? window.__initial_auth_token : null;
  const outputVideoRef = useRef(null);
  const outputImageRef = useRef(null);
  const [isMobileDevice, setIsMobileDevice] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  // --- AUTH INITIALIZATION ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (runtimeSettings.requireCustomToken && !initialAuthToken) {
          setErrorMessage('Custom token is required by access control but was not provided.');
          return;
        }
        if (initialAuthToken) await signInWithCustomToken(auth, initialAuthToken);
        else await signInAnonymously(auth);
      } catch (err) {
        console.error('Auth Init Error', err);
        setErrorMessage('Authentication failed. Please reload and try again.');
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, [initialAuthToken]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onResize = () => setIsMobileDevice(window.innerWidth < 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // --- DATA SYNC ---
  useEffect(() => {
    if (!user) return;

    // Sync Profile (Credits/Tier)
    const pRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'stats');
    const unsubP = onSnapshot(pRef, (snap) => {
      if (snap.exists()) setProfile(snap.data());
      else setDoc(pRef, { credits: 15, tier: 'Free', renders: 0, perk_verified: false }).catch((err) => {
        console.error('Profile init write error', err);
        setErrorMessage('Failed to initialize profile. Check Firestore rules.');
      });
    }, (err) => console.error('Profile Sync Error', err));

    // Sync History (Vault)
    const vRef = collection(db, 'artifacts', appId, 'users', user.uid, 'vault');
    const unsubV = onSnapshot(vRef, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setHistory(docs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
    }, (err) => console.error('Vault Sync Error', err));

    return () => { unsubP(); unsubV(); };
  }, [user]);

  // --- CORE LOGIC ---
  const handleAction = async (cost, type) => {
    if (!user) {
      setErrorMessage('User is not ready yet. Please wait a moment and retry.');
      return;
    }
    if (!profile || profile.credits < cost) {
      setShowPricing(true);
      return;
    }

    setErrorMessage('');
    setIsGenerating(true);
    setOutputUrl(null);

    try {
      // Simulate/Trigger Google AI Handshake
      const delayMs = runtimeSettings.highSpeedMode ? Math.min(runtimeSettings.handshakeDelayMs, 900) : runtimeSettings.handshakeDelayMs;
      await new Promise((res) => setTimeout(res, delayMs));

      const newUrl = type === 'VEO'
        ? 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
        : 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1000';

      // Deduct Credits
      const pRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'stats');
      await updateDoc(pRef, { credits: profile.credits - cost, renders: (profile.renders || 0) + 1 });

      // Save to Vault
      const vRef = collection(db, 'artifacts', appId, 'users', user.uid, 'vault');
      await addDoc(vRef, {
        type,
        prompt,
        url: newUrl,
        timestamp: Timestamp.now(),
        node: 'G3T-IT-NODE-PRO'
      });

      setOutputUrl(newUrl);
    } catch (err) {
      console.error('Action Error', err);
      setErrorMessage('Failed to generate output. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveScreenshot = () => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No canvas context');

      if (subMode === 'VEO' && outputVideoRef.current) {
        const video = outputVideoRef.current;
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      } else if (outputImageRef.current) {
        const image = outputImageRef.current;
        canvas.width = image.naturalWidth || image.width || 1080;
        canvas.height = image.naturalHeight || image.height || 1920;
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      } else {
        setErrorMessage('No output available for screenshot yet.');
        return;
      }

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `museshorts-${subMode.toLowerCase()}-${Date.now()}.png`;
      link.click();
    } catch (err) {
      console.error('Screenshot error', err);
      setErrorMessage('Failed to capture screenshot from output.');
    }
  };

  const handlePurchase = async (credits) => {
    if (!user) {
      setErrorMessage('User is not signed in yet. Please wait.');
      return;
    }

    if (runtimeSettings.allowClientSideTopUp) {
      const pRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'stats');
      await updateDoc(pRef, { credits: (profile?.credits || 0) + credits, tier: 'Pro' });
      setShowPricing(false);
      return;
    }

    try {
      const response = await fetch(`${runtimeSettings.paymentsApiBase}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, appId, credits })
      });

      if (!response.ok) throw new Error(`Checkout failed: ${response.status}`);
      const data = await response.json();
      if (!data.checkoutUrl) throw new Error('Missing checkoutUrl');

      window.location.assign(data.checkoutUrl);
    } catch (err) {
      console.error('Checkout error', err);
      setErrorMessage('Unable to start secure checkout. Please try again.');
    }
  };

  const handleVaultPreview = (item) => {
    setActiveMode('STUDIO');
    setSubMode(item.type === 'VEO' ? 'VEO' : 'IMAGE');
    setPrompt(item.prompt || '');
    setOutputUrl(item.url || null);
  };

  const handleVaultDownload = async (item) => {
    try {
      const response = await fetch(item.url);
      if (!response.ok) throw new Error(`Download failed: ${response.status}`);
      const blob = await response.blob();
      const extension = item.type === 'VEO' ? 'mp4' : 'jpg';
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `museshorts-${item.type?.toLowerCase() || 'asset'}-${Date.now()}.${extension}`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('Vault download error', err);
      setErrorMessage('Failed to download from vault item.');
    }
  };

  if (!user) return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-12 gap-6">
      <div className="w-16 h-16 bg-blue-600 rounded-2xl animate-pulse flex items-center justify-center font-black text-2xl">G</div>
      <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 animate-pulse">Syncing Google Enterprise Node...</p>
    </div>
  );

  return (
    <div className={`flex h-screen bg-[#000B1A] text-slate-200 overflow-hidden font-sans selection:bg-blue-600 ${isMobileDevice ? 'text-[14px]' : 'text-[16px]'}`}>
      <PricingModal
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
        onPurchase={handlePurchase}
      />

      {/* SIDEBAR */}
      <aside className={`${isSidebarOpen ? 'w-80' : 'w-24'} bg-slate-900 border-r border-white/5 flex flex-col transition-all duration-500 relative z-30 shadow-2xl shadow-black`}>
        <div className="h-24 flex items-center px-8 gap-5 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-xl">
            <Video size={24} strokeWidth={2.5} />
          </div>
          {isSidebarOpen && <span className="font-black text-xl md:text-2xl text-white tracking-tighter italic uppercase">MUS!CSHORTS</span>}
        </div>

        <div className="p-8">
          <div className="bg-white/5 rounded-[2.5rem] p-6 border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 blur-2xl rounded-full"></div>
            <div className="flex justify-between items-center mb-2 relative z-10">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reserve Status</span>
              {profile?.tier === 'Pro' ? <ShieldCheck size={14} className="text-emerald-500" /> : <Activity size={14} className="text-blue-500" />}
            </div>
            <div className="flex items-baseline gap-2 relative z-10">
              <span className="text-5xl font-black text-white tracking-tighter">{profile?.credits || 0}</span>
              <span className="text-xs font-bold text-slate-600 uppercase">CR</span>
            </div>
            {isSidebarOpen && (
              <button onClick={() => setShowPricing(true)} className="mt-4 w-full py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all" type="button">
                Refill Fuel
              </button>
            )}
          </div>
        </div>

        <nav className="flex-1 p-5 space-y-3">
          {[
            { id: 'STUDIO', label: 'Studio', icon: <Cpu size={22} /> },
            { id: 'TRENDS', label: 'Trends', icon: <TrendingUp size={22} /> },
            { id: 'VAULT', label: 'Vault', icon: <History size={22} /> }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveMode(item.id)}
              className={`w-full flex items-center gap-5 px-6 py-5 rounded-3xl transition-all relative group ${activeMode === item.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
              type="button"
            >
              {item.icon}
              {isSidebarOpen && <span className="text-sm font-black tracking-tight uppercase tracking-widest">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-white/5 space-y-4">
          {isSidebarOpen && (
            <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ORG: G3T-!T-.N3T</span>
              </div>
              <p className="text-[8px] font-mono text-slate-700 leading-tight">HuzTL3Rz@pL@3Rzd3vz.CLuB.N3T Signature Node Verified</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="w-full p-5 bg-white/5 rounded-3xl text-slate-400 hover:text-white flex justify-center transition-all" type="button">
            <Settings size={22} />
          </button>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-24 flex items-center justify-between px-12 border-b border-white/5 backdrop-blur-2xl bg-slate-900/10 relative z-20">
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.6em] text-blue-500 mb-1">{activeMode} NODE</h2>
            <span className="text-xs font-black text-slate-400 tracking-widest uppercase italic">cryptic-demon.net</span>
          </div>
          <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/5 shadow-inner">
            <Globe size={16} className="text-blue-500" />
            <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase italic">Node: frequencydemon.net</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar relative z-10">
          <div className="max-w-7xl mx-auto space-y-12">
            {errorMessage && (
              <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">
                <span className="inline-block h-2 w-2 rounded-full bg-red-400"></span>
                <p className="text-xs font-bold tracking-wide uppercase">{errorMessage}</p>
              </div>
            )}
            {/* STUDIO VIEW */}
            {activeMode === 'STUDIO' && (
              <div className="grid lg:grid-cols-12 gap-12 animate-in slide-in-from-bottom-8 duration-700">
                <div className="lg:col-span-4 space-y-8">
                  <div className="flex gap-2">
                    {['VEO', 'IMAGE', 'LYRICS'].map((m) => (
                      <button
                        key={m}
                        onClick={() => setSubMode(m)}
                        className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${subMode === m ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
                        type="button"
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  <div className="bg-slate-900 border border-white/10 rounded-[3rem] p-10 shadow-2xl space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl pointer-events-none"></div>
                    <label className="text-[11px] font-black text-blue-400 uppercase tracking-[0.3em] flex justify-between">
                      Directive Input
                      <span className="text-slate-600 italic">G3T-IT Core</span>
                    </label>
                    <textarea
                      className="w-full bg-black/50 border border-white/5 rounded-[2.5rem] p-8 text-white text-base min-h-[220px] outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-700 leading-relaxed"
                      placeholder={`Enter your ${subMode} vision...`}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                    <button
                      onClick={() => handleAction(subMode === 'VEO' ? 5 : 1, subMode)}
                      disabled={isGenerating || !prompt}
                      className="w-full py-5 md:py-7 rounded-[2.5rem] bg-blue-600 text-white font-black text-lg md:text-xl hover:bg-blue-500 transition-all flex items-center justify-center gap-4 shadow-xl shadow-blue-900/40 disabled:opacity-50 group"
                      type="button"
                    >
                      {isGenerating ? <RefreshCw className="animate-spin" /> : (
                        <>
                          <span className="uppercase italic tracking-tighter text-sm md:text-base">Initialize {subMode}</span>
                          <div className="bg-black/20 px-4 py-1.5 rounded-full text-[10px] font-bold group-hover:bg-black/40 transition-all">
                            {subMode === 'VEO' ? '5 CR' : '1 CR'}
                          </div>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-8 flex flex-col gap-8">
                  <div className="aspect-video bg-black border border-white/10 rounded-[4rem] flex flex-col items-center justify-center relative overflow-hidden shadow-3xl shadow-black/50 group">
                    {outputUrl ? (
                      subMode === 'VEO'
                        ? <video ref={outputVideoRef} src={outputUrl} controls autoPlay loop className="w-full h-full object-cover" />
                        : <img ref={outputImageRef} src={outputUrl} className="w-full h-full object-cover" alt="Output" />
                    ) : isGenerating ? (
                      <div className="text-center space-y-6">
                        <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-xs font-black uppercase tracking-[0.4em] text-blue-500 animate-pulse">Synthesis in Progress</p>
                      </div>
                    ) : (
                      <div className="text-center opacity-10 space-y-8 group-hover:opacity-20 transition-opacity">
                        <Sparkles size={120} className="mx-auto" />
                        <p className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter">Output Monitor</p>
                      </div>
                    )}
                    <div className="absolute top-8 left-8 flex items-center gap-3">
                      <div className="px-5 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-black text-white uppercase tracking-widest">
                        Verizon Pro Network
                      </div>
                      {outputUrl && (
                        <button
                          onClick={handleSaveScreenshot}
                          className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[9px] font-black text-white uppercase tracking-widest hover:bg-white/20 transition-all"
                          type="button"
                        >
                          Save Screenshot
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] space-y-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Latency</span>
                      <div className="text-2xl font-black text-white">42ms</div>
                    </div>
                    <div className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] space-y-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resolution</span>
                      <div className="text-2xl font-black text-white">4K-9:16</div>
                    </div>
                    <div className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] space-y-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">AI Tier</span>
                      <div className="text-2xl font-black text-blue-500 uppercase italic">Pro-1.5</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VAULT VIEW */}
            {activeMode === 'VAULT' && (
              <div className="space-y-12 animate-in fade-in zoom-in duration-700">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {history.length > 0 ? history.map((item) => (
                    <div key={item.id || item.timestamp?.seconds || item.url} className="bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden group shadow-xl hover:border-blue-500/30 transition-all">
                      <div className="aspect-[9/16] relative bg-black flex items-center justify-center">
                        {item.type === 'VEO' ? (
                          <video src={item.url} className="w-full h-full object-cover" />
                        ) : (
                          <img src={item.url} className="w-full h-full object-cover" alt="Vault" />
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
                          <button
                            onClick={() => handleVaultPreview(item)}
                            className="p-4 bg-white rounded-full text-black hover:scale-110 transition-transform"
                            type="button"
                          >
                            <Play size={20} />
                          </button>
                          <button
                            onClick={() => handleVaultDownload(item)}
                            className="text-[10px] font-black uppercase text-white tracking-widest hover:underline"
                            type="button"
                          >
                            Download Master
                          </button>
                        </div>
                      </div>
                      <div className="p-6 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-blue-500 uppercase">{item.type} NODE</span>
                          <span className="text-[10px] font-bold text-slate-600">
                            {item.timestamp?.seconds ? new Date(item.timestamp.seconds * 1000).toLocaleDateString() : 'Unknown date'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 italic">"{item.prompt}"</p>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-full h-96 flex flex-col items-center justify-center opacity-10 space-y-6">
                      <History size={80} />
                      <p className="text-2xl font-black uppercase italic tracking-tighter">Vault Empty</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TRENDS VIEW */}
            {activeMode === 'TRENDS' && (
              <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-right-12 duration-700">
                <div className="bg-slate-900 border border-white/10 rounded-[3rem] p-12 space-y-8 shadow-2xl">
                  <h3 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter">Market Intelligence</h3>
                  <p className="text-slate-400 font-medium leading-relaxed">Gemini 1.5 Pro (Verizon Perk Tier) is scanning global frequencies for viral content patterns in your niche.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 group hover:border-blue-500/50 transition-all">
                      <span className="text-[10px] font-black text-blue-500 uppercase block mb-2">Algorithm Match</span>
                      <div className="text-4xl font-black text-white">94%</div>
                      <p className="text-[10px] font-bold text-slate-600 mt-2 uppercase tracking-widest">Short-form Video Efficiency</p>
                    </div>
                    <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 group hover:border-blue-500/50 transition-all">
                      <span className="text-[10px] font-black text-blue-500 uppercase block mb-2">Trend Velocity</span>
                      <div className="text-4xl font-black text-white">HIGH</div>
                      <p className="text-[10px] font-bold text-slate-600 mt-2 uppercase tracking-widest">CPM Potential: High-Tier</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        :root { font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(37,99,235,0.3); }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
}
