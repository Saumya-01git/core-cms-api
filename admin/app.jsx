const { useState, useEffect, useContext, createContext, useMemo, useRef } = React;

const API_BASE = '/api';

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('cms_token'));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cms_user') || 'null');
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const apiFetch = async (endpoint, options = {}) => {
    const headers = { ...options.headers };
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    if (res.status === 401) {
      logout();
      throw new Error('Session expired. Please log in again.');
    }
    return res;
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    apiFetch('/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem('cms_user', JSON.stringify(data.user));
        } else {
          logout();
        }
      })
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Login failed');
    }
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('cms_token', data.token);
    localStorage.setItem('cms_user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('cms_token');
    localStorage.removeItem('cms_user');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, apiFetch, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

const useAuth = () => useContext(AuthContext);

// --- Toast Component ---
function Toast({ toast, onClose }) {
  if (!toast) return null;
  const isErr = toast.type === 'error';
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl transition-all duration-300 border ${
      isErr ? 'bg-red-950/90 border-red-500/40 text-red-200' : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
    } backdrop-blur-md`}>
      <span className="text-base">{isErr ? '⚠️' : '✅'}</span>
      <span className="text-sm font-medium">{toast.message}</span>
      <button onClick={onClose} className="ml-3 text-slate-400 hover:text-white">&times;</button>
    </div>
  );
}

// --- Password Strength Evaluator & Rules ---
function evaluatePassword(pwd = '') {
  const rules = [
    { id: 'length', label: 'At least 8 characters (8+)', met: pwd.length >= 8 },
    { id: 'upper', label: 'One uppercase letter (A-Z)', met: /[A-Z]/.test(pwd) },
    { id: 'lower', label: 'One lowercase letter (a-z)', met: /[a-z]/.test(pwd) },
    { id: 'number', label: 'One numeric digit (0-9)', met: /[0-9]/.test(pwd) },
    { id: 'special', label: 'One special symbol (!@#$%^&*)', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pwd) }
  ];
  const passedCount = rules.filter(r => r.met).length;
  let strengthLabel = 'Very Weak';
  let barColor = 'bg-rose-500';
  if (passedCount === 5) {
    strengthLabel = 'Strong & Compliant';
    barColor = 'bg-emerald-400';
  } else if (passedCount >= 4) {
    strengthLabel = 'Good';
    barColor = 'bg-indigo-400';
  } else if (passedCount >= 3) {
    strengthLabel = 'Moderate';
    barColor = 'bg-amber-400';
  } else if (passedCount >= 2) {
    strengthLabel = 'Weak';
    barColor = 'bg-orange-500';
  }
  return { rules, passedCount, isValid: passedCount === 5, strengthLabel, barColor };
}

function PasswordStrengthWidget({ password = '', showDetails = true }) {
  if (!password) return null;
  const { rules, passedCount, isValid, strengthLabel, barColor } = evaluatePassword(password);
  const percent = Math.min(100, Math.round((passedCount / 5) * 100));

  return (
    <div className="mt-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
      <div className="flex items-center justify-between font-mono">
        <span className="text-slate-400 text-[11px]">Security Strength:</span>
        <span className={`font-bold text-[11px] ${isValid ? 'text-emerald-400' : 'text-amber-300'}`}>
          {strengthLabel} ({passedCount}/5)
        </span>
      </div>

      {/* Strength Bar */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-300`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>

      {/* Rules Checklist */}
      {showDetails && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
          {rules.map(r => (
            <div key={r.id} className="flex items-center gap-1.5 text-[11px]">
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${
                r.met ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-500 border border-slate-700'
              }`}>
                {r.met ? '✓' : '○'}
              </span>
              <span className={r.met ? 'text-slate-200' : 'text-slate-500'}>
                {r.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Login Screen with Demo Access & Security Policies ---
function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (targetEmail, targetPassword) => {
    setError('');
    setIsSubmitting(true);
    try {
      await login(targetEmail, targetPassword);
    } catch (err) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLoginSubmit(email, password);
  };

  const handleDemoInstantAccess = () => {
    setEmail('admin@portfolio.local');
    setPassword('Admin@123456');
    handleLoginSubmit('admin@portfolio.local', 'Admin@123456');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-[#070b14] via-[#0b1329] to-[#070b14]">
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-600/20 rounded-full blur-[128px] pointer-events-none"></div>

      <div className="w-full max-w-lg relative z-10 space-y-6">
        {/* Main Login Card */}
        <div className="glass-panel p-8 sm:p-10 rounded-3xl shadow-2xl border border-white/10">
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-3">
              <span className="text-2xl font-bold text-white tracking-wider">⚡</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Core CMS Admin</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">Headless Content Architecture & Role-Based Control</p>
          </div>

          {/* Demo Access Callout Banner */}
          <div className="mb-6 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Demo Access Mode</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                Evaluation Access
              </span>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              Exploring this portfolio CMS engine? Use the pre-configured administrator credentials below:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded-xl bg-slate-900/90 border border-indigo-500/20">
                <span className="text-[10px] text-slate-400 block font-sans">Username:</span>
                <span className="text-indigo-300 font-bold select-all">admin@portfolio.local</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/90 border border-indigo-500/20">
                <span className="text-[10px] text-slate-400 block font-sans">Password:</span>
                <span className="text-indigo-300 font-bold select-all">Admin@123456</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleDemoInstantAccess}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>⚡</span>
                <span>One-Click Demo Access</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@portfolio.local');
                  setPassword('Admin@123456');
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs border border-slate-700 transition cursor-pointer"
              >
                Fill Fields
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Administrator Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@portfolio.local"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700/60 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 placeholder-slate-500 text-sm outline-none transition font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Admin Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700/60 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 placeholder-slate-500 text-sm outline-none transition font-mono"
              />
              {/* Real-time strength evaluator */}
              <PasswordStrengthWidget password={password} showDetails={false} />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/30 transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isSubmitting ? 'Verifying authentication...' : 'Sign In with Credentials →'}
            </button>
          </form>

          {/* Password Security Rules Box */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 mb-2">
              <span>🛡️</span>
              <span className="font-bold text-slate-300 uppercase tracking-wider">Password Security Standards</span>
            </div>
            <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
              <li>Minimum 8 characters length</li>
              <li>Includes uppercase (A-Z) & lowercase (a-z) letters</li>
              <li>Includes numeric digits (0-9) & special symbols (!@#$...)</li>
              <li>Stored with 10 bcrypt salt rounds and verified via stateless JWT</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Dashboard Screen (Day 5) ---
function DashboardScreen({ setView }) {
  const { apiFetch } = useAuth();
  const [stats, setStats] = useState({
    projects: 0,
    blogs: 0,
    blogViews: 0,
    skills: 0,
    testimonials: 0,
    messages: 0,
    unreadMessages: 0,
    services: 0
  });
  const [health, setHealth] = useState({ status: 'checking', latencyMs: 0 });
  const [recentMessages, setRecentMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [hRes, pRes, bRes, sRes, tRes, mRes, servRes] = await Promise.all([
          apiFetch('/health').then(r => r.json()).catch(() => ({})),
          apiFetch('/projects').then(r => r.json()).catch(() => ({ data: [] })),
          apiFetch('/blogs?all=true').then(r => r.json()).catch(() => ({ data: [] })),
          apiFetch('/skills').then(r => r.json()).catch(() => ({ data: [] })),
          apiFetch('/testimonials?all=true').then(r => r.json()).catch(() => ({ data: [] })),
          apiFetch('/contact').then(r => r.json()).catch(() => ({ data: [] })),
          apiFetch('/services?all=true').then(r => r.json()).catch(() => ({ data: [] }))
        ]);

        if (hRes.database) {
          setHealth({ status: hRes.status, latencyMs: hRes.database.latencyMs || 2 });
        }

        const blogsList = bRes.data || [];
        const msgs = mRes.data || [];

        setStats({
          projects: (pRes.data || []).length,
          blogs: blogsList.length,
          blogViews: blogsList.reduce((acc, b) => acc + (b.views || 0), 0),
          skills: (sRes.data || []).length,
          testimonials: (tRes.data || []).length,
          messages: msgs.length,
          unreadMessages: msgs.filter(m => !m.isRead).length,
          services: (servRes.data || []).length
        });

        setRecentMessages(msgs.slice(0, 5));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-[#C2AFF0] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const statCards = [
    { label: 'Showcase Projects', val: stats.projects, icon: '💼', view: 'projects' },
    { label: 'Technical Articles', val: stats.blogs, sub: `${stats.blogViews} total reads`, icon: '✍️', view: 'blogs' },
    { label: 'Core Skills', val: stats.skills, icon: '⚡', view: 'skills' },
    { label: 'Endorsements', val: stats.testimonials, icon: '⭐', view: 'testimonials' },
    { label: 'Inbound Inquiries', val: stats.messages, sub: `${stats.unreadMessages} unread`, icon: '📬', view: 'messages', badge: stats.unreadMessages },
    { label: 'Services', val: stats.services, icon: '🛠️', view: 'services' }
  ];

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Hero Welcome Banner */}
      <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-[#2D5D7B]/40 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#9191E9]/20 border border-[#9191E9]/35 text-[#C2AFF0] text-sm font-bold font-mono mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Live Headless API Online</span>
            </div>
            <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Portfolio <span className="text-gradient-aurora">Control Center</span>
            </h2>
            <p className="text-slate-300 text-base sm:text-lg mt-2.5 max-w-2xl leading-relaxed">
              All portfolio content is secured in PostgreSQL and served in real-time to your reactive client via clean REST APIs.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setView('projects')}
              className="px-6 py-3.5 rounded-2xl text-base font-extrabold bg-gradient-to-r from-[#9191E9] via-[#8585E6] to-[#457EAC] hover:from-[#9d9df0] hover:to-[#5590c2] text-white shadow-xl shadow-[#9191E9]/30 hover:scale-[1.02] transition cursor-pointer"
            >
              + Add Project
            </button>
            <button
              onClick={() => setView('blogs')}
              className="px-6 py-3.5 rounded-2xl text-base font-bold bg-[#1c3041] hover:bg-[#253f56] text-slate-200 border border-[#2D5D7B]/50 transition cursor-pointer"
            >
              ✍️ Write Article
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Big Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
        {statCards.map((card, i) => (
          <div
            key={i}
            onClick={() => setView(card.view)}
            className="glass-card p-7 sm:p-8 rounded-3xl border border-[#2D5D7B]/40 hover:border-[#C2AFF0]/60 transition duration-300 cursor-pointer group shadow-xl hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl sm:text-4xl">{card.icon}</span>
              {card.badge > 0 && (
                <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-rose-500 text-white animate-pulse shadow-md">
                  {card.badge} New
                </span>
              )}
            </div>
            <p className="text-slate-300 text-sm sm:text-base font-bold uppercase tracking-wider font-mono">{card.label}</p>
            <p className="font-heading text-4xl sm:text-6xl font-extrabold text-white mt-2 group-hover:text-[#C2AFF0] transition">{card.val}</p>
            {card.sub && <p className="text-sm text-[#9191E9] mt-3 font-medium">{card.sub}</p>}
          </div>
        ))}
      </div>

      {/* Database Health & Recent Inquiries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-8 sm:p-9 rounded-3xl border border-[#2D5D7B]/40 shadow-xl space-y-5">
          <h3 className="font-heading font-extrabold text-white text-xl sm:text-2xl flex items-center gap-3">
            <span>🩺</span> System Health & Database
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-[#142330]/80 border border-[#2D5D7B]/50 text-base">
              <span className="text-slate-300 font-semibold">Database Engine</span>
              <span className="text-white font-bold font-mono">PostgreSQL via Prisma</span>
            </div>
            <div className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-[#142330]/80 border border-[#2D5D7B]/50 text-base">
              <span className="text-slate-300 font-semibold">Database Latency</span>
              <span className="text-emerald-400 font-mono font-bold text-lg">{health.latencyMs} ms</span>
            </div>
            <div className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-[#142330]/80 border border-[#2D5D7B]/50 text-base">
              <span className="text-slate-300 font-semibold">API Gateway</span>
              <span className="text-[#C2AFF0] font-mono font-bold text-base">/api (Express.js)</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-8 sm:p-9 rounded-3xl border border-[#2D5D7B]/40 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading font-extrabold text-white text-xl sm:text-2xl flex items-center gap-3">
                <span>📬</span> Recent Inquiries
              </h3>
              <button
                onClick={() => setView('messages')}
                className="text-sm sm:text-base text-[#C2AFF0] hover:text-white font-bold transition"
              >
                View All &rarr;
              </button>
            </div>
            {recentMessages.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-base">
                No inquiries yet. Submissions from the contact form will show up here.
              </div>
            ) : (
              <div className="space-y-3">
                {recentMessages.map(msg => (
                  <div
                    key={msg.id}
                    onClick={() => setView('messages')}
                    className="p-4 rounded-2xl bg-[#142330]/80 hover:bg-[#1a2d3d] border border-[#2D5D7B]/40 transition cursor-pointer flex items-center justify-between"
                  >
                    <div className="truncate mr-3">
                      <p className="text-base font-bold text-white truncate">{msg.name}</p>
                      <p className="text-sm text-slate-400 truncate mt-0.5">{msg.subject || msg.message}</p>
                    </div>
                    {!msg.isRead && (
                      <span className="w-3 h-3 rounded-full bg-rose-500 flex-shrink-0 animate-pulse"></span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- CRUD: About (Day 6) ---
function AboutScreen({ showToast }) {
  const { apiFetch } = useAuth();
  const [data, setData] = useState({
    title: '', subtitle: '', bio: '', heroImage: '', resumeUrl: '',
    location: '', email: '', phone: '', githubUrl: '', linkedinUrl: '', twitterUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch('/about')
      .then(r => r.json())
      .then(res => {
        if (res.data) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch('/about', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (json.success) {
        showToast('About profile updated successfully!');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-slate-300 text-lg">Loading About profile...</div>;

  return (
    <div className="space-y-8 max-w-5xl animate-fadeIn">
      <div>
        <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <span>👤</span>
          <span>About & <span className="text-gradient-aurora">Bio Profile</span></span>
        </h2>
        <p className="text-base sm:text-lg text-slate-300 mt-2 max-w-2xl leading-relaxed">
          Manage your hero introduction, biography narrative, contact coordinates, and social profile links.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel p-8 sm:p-12 rounded-3xl border border-[#2D5D7B]/40 space-y-8 shadow-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2.5">
              Headline Title
            </label>
            <input
              type="text"
              value={data.title || ''}
              onChange={e => setData({ ...data, title: e.target.value })}
              placeholder="Full Stack Engineer & Cyber Security Specialist"
              className="w-full px-5 py-4 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] focus:ring-2 focus:ring-[#C2AFF0]/20 text-white placeholder-slate-500 text-base sm:text-lg outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2.5">
              Subtitle
            </label>
            <input
              type="text"
              value={data.subtitle || ''}
              onChange={e => setData({ ...data, subtitle: e.target.value })}
              placeholder="Engineering resilient web architectures & cryptographic systems"
              className="w-full px-5 py-4 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] focus:ring-2 focus:ring-[#C2AFF0]/20 text-white placeholder-slate-500 text-base sm:text-lg outline-none transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2.5">
            Full Biography Narrative
          </label>
          <textarea
            rows="5"
            value={data.bio || ''}
            onChange={e => setData({ ...data, bio: e.target.value })}
            placeholder="Tell your story, engineering passions, and architectural philosophy..."
            className="w-full px-5 py-4 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] focus:ring-2 focus:ring-[#C2AFF0]/20 text-white placeholder-slate-500 text-base sm:text-lg outline-none transition leading-relaxed"
          ></textarea>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2.5">
              Location
            </label>
            <input
              type="text"
              value={data.location || ''}
              onChange={e => setData({ ...data, location: e.target.value })}
              placeholder="Chennai, India"
              className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2.5">
              Public Email
            </label>
            <input
              type="email"
              value={data.email || ''}
              onChange={e => setData({ ...data, email: e.target.value })}
              placeholder="saumya.dev@portfolio.local"
              className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2.5">
              Resume URL / Path
            </label>
            <input
              type="text"
              value={data.resumeUrl || ''}
              onChange={e => setData({ ...data, resumeUrl: e.target.value })}
              placeholder="/uploads/resume.pdf"
              className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2.5">
              GitHub Profile
            </label>
            <input
              type="text"
              value={data.githubUrl || ''}
              onChange={e => setData({ ...data, githubUrl: e.target.value })}
              placeholder="https://github.com/..."
              className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2.5">
              LinkedIn Profile
            </label>
            <input
              type="text"
              value={data.linkedinUrl || ''}
              onChange={e => setData({ ...data, linkedinUrl: e.target.value })}
              placeholder="https://linkedin.com/in/..."
              className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2.5">
              Twitter / X Profile
            </label>
            <input
              type="text"
              value={data.twitterUrl || ''}
              onChange={e => setData({ ...data, twitterUrl: e.target.value })}
              placeholder="https://x.com/..."
              className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-[#2D5D7B]/40 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#9191E9] via-[#8585E6] to-[#457EAC] hover:from-[#9d9df0] hover:to-[#5590c2] text-white font-extrabold text-base shadow-xl shadow-[#9191E9]/30 hover:scale-[1.02] transition cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile Changes 💾'}
          </button>
        </div>
      </form>
    </div>
  );
}

// --- CRUD: Skills (Day 6) ---
function SkillsScreen({ showToast }) {
  const { apiFetch } = useAuth();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', category: 'Frontend', proficiency: 85, icon: '', order: 0 });

  const loadSkills = () => {
    apiFetch('/skills')
      .then(r => r.json())
      .then(res => setSkills(res.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadSkills(); }, []);

  const openModal = (skill = null) => {
    if (skill) {
      setEditingId(skill.id);
      setFormData({
        name: skill.name,
        category: skill.category,
        proficiency: skill.proficiency,
        icon: skill.icon || '',
        order: skill.order
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', category: 'Frontend', proficiency: 85, icon: '', order: 0 });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const endpoint = editingId ? `/skills/${editingId}` : '/skills';
      const method = editingId ? 'PUT' : 'POST';
      const res = await apiFetch(endpoint, { method, body: JSON.stringify(formData) });
      const json = await res.json();
      if (json.success) {
        showToast(editingId ? 'Skill updated' : 'Skill added');
        setModalOpen(false);
        loadSkills();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this skill?')) return;
    try {
      const res = await apiFetch(`/skills/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('Skill deleted');
        loadSkills();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>⚡</span>
            <span>Skills & <span className="text-gradient-aurora">Competencies</span></span>
          </h2>
          <p className="text-base sm:text-lg text-slate-300 mt-2 max-w-2xl leading-relaxed">
            Manage your technical competencies, frameworks, security toolkits, and proficiency meters.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#9191E9] via-[#8585E6] to-[#457EAC] hover:from-[#9d9df0] hover:to-[#5590c2] text-white font-extrabold text-base shadow-xl shadow-[#9191E9]/30 hover:scale-[1.02] transition cursor-pointer self-start sm:self-auto"
        >
          + Add Skill
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-300 text-lg">Loading skills...</div>
      ) : skills.length === 0 ? (
        <div className="glass-panel p-16 text-center rounded-3xl text-slate-400 text-lg">
          No skills added yet. Click "+ Add Skill" to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map(s => (
            <div key={s.id} className="glass-card p-6 sm:p-7 rounded-3xl border border-[#2D5D7B]/40 hover:border-[#C2AFF0]/60 transition duration-300 flex flex-col justify-between group shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs sm:text-sm font-bold px-3 py-1 rounded-full bg-[#9191E9]/20 text-[#C2AFF0] border border-[#9191E9]/35 font-mono">
                    {s.category}
                  </span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => openModal(s)} className="text-sm font-bold text-slate-300 hover:text-white transition">Edit</button>
                    <button onClick={() => handleDelete(s.id)} className="text-sm font-bold text-rose-400 hover:text-rose-300 transition">Delete</button>
                  </div>
                </div>
                <h4 className="font-heading font-extrabold text-white text-xl sm:text-2xl mt-2">{s.name}</h4>
              </div>

              <div className="mt-6">
                <div className="flex justify-between text-sm text-slate-300 mb-2 font-mono">
                  <span>Proficiency</span>
                  <span className="font-bold text-[#C2AFF0]">{s.proficiency}%</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden border border-[#2D5D7B]/40">
                  <div className="h-full bg-gradient-to-r from-[#9191E9] via-[#8585E6] to-[#457EAC] rounded-full transition-all duration-500" style={{ width: `${s.proficiency}%` }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-[#2D5D7B]/50 w-full max-w-lg shadow-2xl animate-fadeIn">
            <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-white mb-6 border-b border-[#2D5D7B]/40 pb-4">
              {editingId ? 'Edit Technical Skill' : 'Add New Technical Skill'}
            </h3>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2">Skill Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. React.js, PostgreSQL, Docker, Wireshark"
                  className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition"
                >
                  <option value="Frontend">Frontend Development</option>
                  <option value="Backend">Backend & REST APIs</option>
                  <option value="Database">Database & Caching</option>
                  <option value="DevOps & Cloud">DevOps & Cloud Infrastructure</option>
                  <option value="Security & Systems">Security & Cryptographic Systems</option>
                  <option value="Tools & Architecture">Architecture & Engineering Tools</option>
                </select>
              </div>
              <div>
                <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2">Proficiency Level ({formData.proficiency}%)</label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={formData.proficiency}
                  onChange={e => setFormData({ ...formData, proficiency: parseInt(e.target.value, 10) })}
                  className="w-full accent-[#9191E9] cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t border-[#2D5D7B]/40">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-6 py-3 rounded-2xl text-base font-bold bg-[#1c3041] text-slate-300 hover:bg-[#253f56] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-7 py-3 rounded-2xl text-base font-extrabold bg-gradient-to-r from-[#9191E9] via-[#8585E6] to-[#457EAC] text-white shadow-lg transition cursor-pointer"
                >
                  Save Skill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- CRUD: Projects (Day 6) ---
function ProjectsScreen({ showToast }) {
  const { apiFetch } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '', slug: '', description: '', content: '', coverImage: '', tags: '', demoUrl: '', githubUrl: '', isFeatured: false
  });

  const loadProjects = () => {
    apiFetch('/projects')
      .then(r => r.json())
      .then(res => setProjects(res.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProjects(); }, []);

  const openModal = (proj = null) => {
    if (proj) {
      setEditingId(proj.id);
      setFormData({
        title: proj.title,
        slug: proj.slug,
        description: proj.description,
        content: proj.content || '',
        coverImage: proj.coverImage || '',
        tags: (proj.tags || []).join(', '),
        demoUrl: proj.demoUrl || '',
        githubUrl: proj.githubUrl || '',
        isFeatured: proj.isFeatured
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '', slug: '', description: '', content: '', coverImage: '', tags: '', demoUrl: '', githubUrl: '', isFeatured: false
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const endpoint = editingId ? `/projects/${editingId}` : '/projects';
      const method = editingId ? 'PUT' : 'POST';
      const res = await apiFetch(endpoint, { method, body: JSON.stringify(formData) });
      const json = await res.json();
      if (json.success) {
        showToast(editingId ? 'Project updated' : 'Project created');
        setModalOpen(false);
        loadProjects();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      const res = await apiFetch(`/projects/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('Project deleted');
        loadProjects();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>💼</span>
            <span>Showcase <span className="text-gradient-aurora">Projects</span></span>
          </h2>
          <p className="text-base sm:text-lg text-slate-300 mt-2 max-w-2xl leading-relaxed">
            Curate engineering projects with live interactive previews, tech stacks, GitHub repos, and featured flags.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#9191E9] via-[#8585E6] to-[#457EAC] hover:from-[#9d9df0] hover:to-[#5590c2] text-white font-extrabold text-base shadow-xl shadow-[#9191E9]/30 hover:scale-[1.02] transition cursor-pointer self-start sm:self-auto"
        >
          + Add Project
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-300 text-lg">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="glass-panel p-16 text-center rounded-3xl text-slate-400 text-lg">
          No projects created yet. Click "+ Add Project" to showcase your work.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {projects.map(p => (
            <div key={p.id} className="glass-card rounded-3xl overflow-hidden flex flex-col justify-between group border border-[#2D5D7B]/40 hover:border-[#C2AFF0]/60 transition duration-300 shadow-xl">
              <div>
                {p.coverImage ? (
                  <img src={p.coverImage} alt={p.title} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-[#2D5D7B]/50 via-[#172735] to-[#457EAC]/30 flex items-center justify-center text-4xl">
                    🚀
                  </div>
                )}
                <div className="p-6 sm:p-7">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-sm text-[#C2AFF0] font-bold">/{p.slug}</span>
                    {p.isFeatured && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/35 font-mono">
                        ★ Featured
                      </span>
                    )}
                  </div>
                  <h3 className="font-heading font-extrabold text-white text-xl sm:text-2xl mt-1">{p.title}</h3>
                  <p className="text-base text-slate-300 mt-2.5 line-clamp-3 leading-relaxed">{p.description}</p>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {(p.tags || []).map((t, idx) => (
                      <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-[#142330]/90 text-slate-200 border border-[#2D5D7B]/40 font-mono">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-7 pt-0 border-t border-[#2D5D7B]/30 flex items-center justify-between text-base">
                <div className="flex items-center gap-4">
                  {p.demoUrl && <a href={p.demoUrl} target="_blank" className="text-[#C2AFF0] hover:text-white font-bold transition">Live Demo ↗</a>}
                  {p.githubUrl && <a href={p.githubUrl} target="_blank" className="text-slate-300 hover:text-white font-bold transition">GitHub ↗</a>}
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => openModal(p)} className="text-sm sm:text-base font-bold text-slate-300 hover:text-white transition">Edit</button>
                  <button onClick={() => handleDelete(p.id)} className="text-sm sm:text-base font-bold text-rose-400 hover:text-rose-300 transition">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
          <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-[#2D5D7B]/50 w-full max-w-2xl my-8 shadow-2xl animate-fadeIn">
            <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-white mb-6 border-b border-[#2D5D7B]/40 pb-4">
              {editingId ? 'Edit Project' : 'Create New Project'}
            </h3>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2">Project Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Next-Gen Cyber Security Threat Monitor"
                  className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2">Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="cyber-threat-monitor"
                    className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2">Cover Image URL</label>
                  <input
                    type="text"
                    value={formData.coverImage}
                    onChange={e => setFormData({ ...formData, coverImage: e.target.value })}
                    placeholder="/uploads/... or https://..."
                    className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2">Brief Summary</label>
                <textarea
                  rows="3"
                  required
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="High-level engineering overview..."
                  className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition leading-relaxed"
                ></textarea>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2">Demo URL</label>
                  <input
                    type="text"
                    value={formData.demoUrl}
                    onChange={e => setFormData({ ...formData, demoUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2">GitHub URL</label>
                  <input
                    type="text"
                    value={formData.githubUrl}
                    onChange={e => setFormData({ ...formData, githubUrl: e.target.value })}
                    placeholder="https://github.com/..."
                    className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2">Tech Stack Tags (comma separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={e => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="React, TypeScript, TailwindCSS, PostgreSQL, Docker"
                  className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition font-mono"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="projFeatured"
                  checked={formData.isFeatured}
                  onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-5 h-5 accent-[#9191E9] rounded cursor-pointer"
                />
                <label htmlFor="projFeatured" className="text-base font-bold text-white cursor-pointer">
                  Feature this project on the portfolio homepage
                </label>
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t border-[#2D5D7B]/40">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-6 py-3 rounded-2xl text-base font-bold bg-[#1c3041] text-slate-300 hover:bg-[#253f56] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-7 py-3 rounded-2xl text-base font-extrabold bg-gradient-to-r from-[#9191E9] via-[#8585E6] to-[#457EAC] text-white shadow-lg transition cursor-pointer"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- CRUD: Blogs (Day 7) ---
function BlogsScreen({ showToast }) {
  const { apiFetch } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '', slug: '', excerpt: '', content: '', coverImage: '', tags: '', isPublished: true
  });

  const loadBlogs = () => {
    apiFetch('/blogs?all=true')
      .then(r => r.json())
      .then(res => setBlogs(res.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadBlogs(); }, []);

  const openModal = (blog = null) => {
    if (blog) {
      setEditingId(blog.id);
      setFormData({
        title: blog.title,
        slug: blog.slug,
        excerpt: blog.excerpt,
        content: blog.content,
        coverImage: blog.coverImage || '',
        tags: (blog.tags || []).join(', '),
        isPublished: blog.isPublished
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '', slug: '', excerpt: '', content: '', coverImage: '', tags: '', isPublished: true
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const endpoint = editingId ? `/blogs/${editingId}` : '/blogs';
      const method = editingId ? 'PUT' : 'POST';
      const res = await apiFetch(endpoint, { method, body: JSON.stringify(formData) });
      const json = await res.json();
      if (json.success) {
        showToast(editingId ? 'Blog updated' : 'Blog published');
        setModalOpen(false);
        loadBlogs();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    try {
      const res = await apiFetch(`/blogs/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('Blog deleted');
        loadBlogs();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>✍️</span>
            <span>Articles & <span className="text-gradient-aurora">Technical Blogs</span></span>
          </h2>
          <p className="text-base sm:text-lg text-slate-300 mt-2 max-w-2xl leading-relaxed">
            Write, publish, and distribute engineering deep-dives, architectural case studies, and tutorials.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#9191E9] via-[#8585E6] to-[#457EAC] hover:from-[#9d9df0] hover:to-[#5590c2] text-white font-extrabold text-base shadow-xl shadow-[#9191E9]/30 hover:scale-[1.02] transition cursor-pointer self-start sm:self-auto"
        >
          ✍️ Write Article
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-300 text-lg">Loading articles...</div>
      ) : blogs.length === 0 ? (
        <div className="glass-panel p-16 text-center rounded-3xl text-slate-400 text-lg">
          No articles written yet. Click "Write Article" to publish your first post.
        </div>
      ) : (
        <div className="space-y-5">
          {blogs.map(b => (
            <div key={b.id} className="glass-panel p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 border border-[#2D5D7B]/40 hover:border-[#C2AFF0]/60 transition duration-300 shadow-xl">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-3 font-mono">
                  <span className={`text-xs sm:text-sm px-3 py-1 rounded-full font-bold ${
                    b.isPublished ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/35' : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {b.isPublished ? 'Published' : 'Draft'}
                  </span>
                  <span className="text-sm text-[#C2AFF0] font-bold">/{b.slug}</span>
                  <span className="text-sm text-slate-400">👁️ {b.views || 0} reads</span>
                </div>
                <h3 className="font-heading font-extrabold text-white text-xl sm:text-2xl mt-1">{b.title}</h3>
                <p className="text-base text-slate-300 line-clamp-2 leading-relaxed">{b.excerpt}</p>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-center">
                <button onClick={() => openModal(b)} className="px-5 py-2.5 rounded-xl bg-[#22394c] hover:bg-[#2c4a63] text-sm sm:text-base font-bold text-slate-200 border border-[#457EAC]/30 transition cursor-pointer">
                  Edit
                </button>
                <button onClick={() => handleDelete(b.id)} className="px-5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-sm sm:text-base font-bold text-rose-300 border border-rose-500/25 transition cursor-pointer">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
          <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-[#2D5D7B]/50 w-full max-w-2xl my-8 shadow-2xl animate-fadeIn">
            <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-white mb-6 border-b border-[#2D5D7B]/40 pb-4">
              {editingId ? 'Edit Article' : 'Compose New Article'}
            </h3>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2">Article Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Modern Web Security & Zero-Trust Architecture"
                  className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="modern-web-security"
                  className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition font-mono"
                />
              </div>
              <div>
                <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2">Excerpt Summary</label>
                <textarea
                  rows="2"
                  required
                  value={formData.excerpt}
                  onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Short engaging teaser..."
                  className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition leading-relaxed"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2">Full Content (Markdown supported)</label>
                <textarea
                  rows="8"
                  required
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your article markdown..."
                  className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition font-mono text-sm leading-relaxed"
                ></textarea>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="blogPublished"
                  checked={formData.isPublished}
                  onChange={e => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="w-5 h-5 accent-[#9191E9] rounded cursor-pointer"
                />
                <label htmlFor="blogPublished" className="text-base font-bold text-white cursor-pointer">
                  Publish publicly on the portfolio
                </label>
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t border-[#2D5D7B]/40">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-6 py-3 rounded-2xl text-base font-bold bg-[#1c3041] text-slate-300 hover:bg-[#253f56] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-7 py-3 rounded-2xl text-base font-extrabold bg-gradient-to-r from-[#9191E9] via-[#8585E6] to-[#457EAC] text-white shadow-lg transition cursor-pointer"
                >
                  Save Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- CRUD: Experience (Day 7) ---
function ExperienceScreen({ showToast }) {
  const { apiFetch } = useAuth();
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    role: '', company: '', companyUrl: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '', highlights: ''
  });

  const loadExperiences = () => {
    apiFetch('/experience')
      .then(r => r.json())
      .then(res => setExperiences(res.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadExperiences(); }, []);

  const openModal = (exp = null) => {
    if (exp) {
      setEditingId(exp.id);
      setFormData({
        role: exp.role,
        company: exp.company,
        companyUrl: exp.companyUrl || '',
        location: exp.location || '',
        startDate: exp.startDate,
        endDate: exp.endDate || '',
        isCurrent: exp.isCurrent,
        description: exp.description,
        highlights: (exp.highlights || []).join('\n')
      });
    } else {
      setEditingId(null);
      setFormData({
        role: '', company: '', companyUrl: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '', highlights: ''
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const endpoint = editingId ? `/experience/${editingId}` : '/experience';
      const method = editingId ? 'PUT' : 'POST';
      const res = await apiFetch(endpoint, { method, body: JSON.stringify(formData) });
      const json = await res.json();
      if (json.success) {
        showToast(editingId ? 'Experience updated' : 'Experience added');
        setModalOpen(false);
        loadExperiences();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this experience record?')) return;
    try {
      const res = await apiFetch(`/experience/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('Experience deleted');
        loadExperiences();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>⏳</span>
            <span>Experience & <span className="text-gradient-aurora">Career Timeline</span></span>
          </h2>
          <p className="text-base sm:text-lg text-slate-300 mt-2 max-w-2xl leading-relaxed">
            Manage your professional journey, company roles, engineering contributions, and key milestones.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#9191E9] via-[#8585E6] to-[#457EAC] hover:from-[#9d9df0] hover:to-[#5590c2] text-white font-extrabold text-base shadow-xl shadow-[#9191E9]/30 hover:scale-[1.02] transition cursor-pointer self-start sm:self-auto"
        >
          + Add Experience
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-300 text-lg">Loading experience records...</div>
      ) : experiences.length === 0 ? (
        <div className="glass-panel p-16 text-center rounded-3xl text-slate-400 text-lg">
          No experience records added yet. Click "+ Add Experience" to build your timeline.
        </div>
      ) : (
        <div className="space-y-6">
          {experiences.map(exp => (
            <div key={exp.id} className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#2D5D7B]/40 hover:border-[#C2AFF0]/60 transition duration-300 flex flex-col sm:flex-row sm:items-start justify-between gap-6 shadow-xl">
              <div className="space-y-2.5 max-w-3xl">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-heading font-extrabold text-white text-xl sm:text-2xl">{exp.role}</h3>
                  <span className="text-base sm:text-lg font-bold text-[#C2AFF0]">@ {exp.company}</span>
                  {exp.isCurrent && (
                    <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 font-mono">
                      Current Role
                    </span>
                  )}
                </div>
                <p className="text-sm sm:text-base font-mono text-slate-400">
                  {exp.startDate} &mdash; {exp.isCurrent ? 'Present' : exp.endDate} {exp.location ? `• ${exp.location}` : ''}
                </p>
                <p className="text-base text-slate-300 leading-relaxed pt-1">{exp.description}</p>
                {exp.highlights && exp.highlights.length > 0 && (
                  <ul className="list-disc list-inside space-y-1.5 text-slate-300 text-base pt-2">
                    {exp.highlights.map((h, i) => (
                      <li key={i} className="leading-relaxed">{h}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex items-center gap-3 self-end sm:self-start">
                <button onClick={() => openModal(exp)} className="px-5 py-2.5 rounded-xl bg-[#22394c] hover:bg-[#2c4a63] text-sm sm:text-base font-bold text-slate-200 border border-[#457EAC]/30 transition cursor-pointer">
                  Edit
                </button>
                <button onClick={() => handleDelete(exp.id)} className="px-5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-sm sm:text-base font-bold text-rose-300 border border-rose-500/25 transition cursor-pointer">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
          <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-[#2D5D7B]/50 w-full max-w-2xl my-8 shadow-2xl animate-fadeIn">
            <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-white mb-6 border-b border-[#2D5D7B]/40 pb-4">
              {editingId ? 'Edit Experience' : 'Add Experience Record'}
            </h3>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2">Role Title</label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    placeholder="Cyber Security Lead"
                    className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2">Company / Organization</label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                    placeholder="VIT Chennai / Enterprise"
                    className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2">Start Date</label>
                  <input
                    type="text"
                    required
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    placeholder="Aug 2024"
                    className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2">End Date (or 'Present')</label>
                  <input
                    type="text"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    placeholder="Present"
                    className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Chennai, India"
                  className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2">Description</label>
                <textarea
                  rows="3"
                  required
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summary of responsibilities and scope..."
                  className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition leading-relaxed"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2">Key Highlights (one bullet per line)</label>
                <textarea
                  rows="4"
                  value={formData.highlights}
                  onChange={e => setFormData({ ...formData, highlights: e.target.value })}
                  placeholder="Architected cryptographic auth flow&#10;Integrated zero-trust RBAC engine"
                  className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition font-mono text-sm leading-relaxed"
                ></textarea>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="expCurrent"
                  checked={formData.isCurrent}
                  onChange={e => setFormData({ ...formData, isCurrent: e.target.checked })}
                  className="w-5 h-5 accent-[#9191E9] rounded cursor-pointer"
                />
                <label htmlFor="expCurrent" className="text-base font-bold text-white cursor-pointer">
                  This is my current role
                </label>
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t border-[#2D5D7B]/40">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-6 py-3 rounded-2xl text-base font-bold bg-[#1c3041] text-slate-300 hover:bg-[#253f56] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-7 py-3 rounded-2xl text-base font-extrabold bg-gradient-to-r from-[#9191E9] via-[#8585E6] to-[#457EAC] text-white shadow-lg transition cursor-pointer"
                >
                  Save Experience
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- CRUD: Testimonials (Day 7) ---
function TestimonialsScreen({ showToast }) {
  const { apiFetch } = useAuth();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    authorName: '', authorRole: '', company: '', content: '', rating: 5, isApproved: true
  });

  const loadTestimonials = () => {
    apiFetch('/testimonials?all=true')
      .then(r => r.json())
      .then(res => setTestimonials(res.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTestimonials(); }, []);

  const openModal = (t = null) => {
    if (t) {
      setEditingId(t.id);
      setFormData({
        authorName: t.authorName,
        authorRole: t.authorRole,
        company: t.company || '',
        content: t.content,
        rating: t.rating || 5,
        isApproved: t.isApproved
      });
    } else {
      setEditingId(null);
      setFormData({
        authorName: '', authorRole: '', company: '', content: '', rating: 5, isApproved: true
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const endpoint = editingId ? `/testimonials/${editingId}` : '/testimonials';
      const method = editingId ? 'PUT' : 'POST';
      const res = await apiFetch(endpoint, { method, body: JSON.stringify(formData) });
      const json = await res.json();
      if (json.success) {
        showToast(editingId ? 'Testimonial updated' : 'Testimonial added');
        setModalOpen(false);
        loadTestimonials();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const toggleApproval = async (t) => {
    try {
      const updatedStatus = !t.isApproved;
      const res = await apiFetch(`/testimonials/${t.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isApproved: updatedStatus })
      });
      const json = await res.json();
      if (json.success) {
        showToast(updatedStatus ? 'Testimonial approved & published!' : 'Testimonial marked pending moderation');
        loadTestimonials();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;
    try {
      const res = await apiFetch(`/testimonials/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('Testimonial deleted');
        loadTestimonials();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>⭐</span>
            <span>Client & Colleague <span className="text-gradient-aurora">Endorsements</span></span>
          </h2>
          <p className="text-base sm:text-lg text-slate-300 mt-2 max-w-2xl leading-relaxed">
            Curate recommendations, reviews, and publicly submitted endorsements from collaborators and recruiters.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#9191E9] via-[#8585E6] to-[#457EAC] hover:from-[#9d9df0] hover:to-[#5590c2] text-white font-extrabold text-base shadow-xl shadow-[#9191E9]/30 hover:scale-[1.02] transition cursor-pointer self-start sm:self-auto"
        >
          + Add Testimonial
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-300 text-lg">Loading endorsements...</div>
      ) : testimonials.length === 0 ? (
        <div className="glass-panel p-16 text-center rounded-3xl text-slate-400 text-lg">
          No testimonials yet. Click "+ Add Testimonial" or accept submissions from the public website!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {testimonials.map(t => (
            <div key={t.id} className="glass-card p-7 sm:p-8 rounded-3xl border border-[#2D5D7B]/40 hover:border-[#C2AFF0]/60 transition duration-300 flex flex-col justify-between group shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-amber-400 text-lg tracking-wider">{'★'.repeat(t.rating || 5)}</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleApproval(t)}
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition cursor-pointer ${
                        t.isApproved
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 hover:bg-emerald-500/25'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse hover:bg-amber-500/30'
                      }`}
                    >
                      {t.isApproved ? '✓ Published' : '⏳ Click to Approve'}
                    </button>
                  </div>
                </div>
                <p className="text-base sm:text-lg text-slate-200 italic mb-6 leading-relaxed">
                  "{t.content}"
                </p>
              </div>

              <div className="pt-5 border-t border-[#2D5D7B]/40 flex items-center justify-between">
                <div>
                  <p className="font-heading font-extrabold text-white text-lg sm:text-xl">{t.authorName}</p>
                  <p className="text-sm text-[#C2AFF0] font-medium">{t.authorRole} {t.company ? `• ${t.company}` : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => openModal(t)} className="text-sm font-bold text-slate-300 hover:text-white transition">Edit</button>
                  <button onClick={() => handleDelete(t.id)} className="text-sm font-bold text-rose-400 hover:text-rose-300 transition">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-[#2D5D7B]/50 w-full max-w-lg shadow-2xl animate-fadeIn">
            <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-white mb-6 border-b border-[#2D5D7B]/40 pb-4">
              {editingId ? 'Edit Testimonial' : 'Add Testimonial'}
            </h3>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2">Author Name</label>
                <input
                  type="text"
                  required
                  value={formData.authorName}
                  onChange={e => setFormData({ ...formData, authorName: e.target.value })}
                  placeholder="Sarah Jenkins"
                  className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2">Role / Title</label>
                  <input
                    type="text"
                    required
                    value={formData.authorRole}
                    onChange={e => setFormData({ ...formData, authorRole: e.target.value })}
                    placeholder="VP of Engineering"
                    className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2">Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Stripe / Google"
                    className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2">Endorsement Text</label>
                <textarea
                  rows="4"
                  required
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Describe your working relationship, technical strengths, and impact..."
                  className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition leading-relaxed"
                ></textarea>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="testApproved"
                  checked={formData.isApproved}
                  onChange={e => setFormData({ ...formData, isApproved: e.target.checked })}
                  className="w-5 h-5 accent-[#9191E9] rounded cursor-pointer"
                />
                <label htmlFor="testApproved" className="text-base font-bold text-white cursor-pointer">
                  Approved & published on portfolio website
                </label>
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t border-[#2D5D7B]/40">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-6 py-3 rounded-2xl text-base font-bold bg-[#1c3041] text-slate-300 hover:bg-[#253f56] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-7 py-3 rounded-2xl text-base font-extrabold bg-gradient-to-r from-[#9191E9] via-[#8585E6] to-[#457EAC] text-white shadow-lg transition cursor-pointer"
                >
                  Save Testimonial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- CRUD: Services (Day 7) ---
function ServicesScreen({ showToast }) {
  const { apiFetch } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', features: '', icon: '⚡' });

  const loadServices = () => {
    apiFetch('/services?all=true')
      .then(r => r.json())
      .then(res => setServices(res.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadServices(); }, []);

  const openModal = (s = null) => {
    if (s) {
      setEditingId(s.id);
      setFormData({
        title: s.title,
        description: s.description,
        features: (s.features || []).join(', '),
        icon: s.icon || '⚡'
      });
    } else {
      setEditingId(null);
      setFormData({ title: '', description: '', features: '', icon: '⚡' });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const endpoint = editingId ? `/services/${editingId}` : '/services';
      const method = editingId ? 'PUT' : 'POST';
      const res = await apiFetch(endpoint, { method, body: JSON.stringify(formData) });
      const json = await res.json();
      if (json.success) {
        showToast(editingId ? 'Service updated' : 'Service created');
        setModalOpen(false);
        loadServices();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      const res = await apiFetch(`/services/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('Service deleted');
        loadServices();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>🛠️</span>
            <span>Engineering <span className="text-gradient-aurora">Services</span></span>
          </h2>
          <p className="text-base sm:text-lg text-slate-300 mt-2 max-w-2xl leading-relaxed">
            Manage your service offerings, technical consulting packages, and deliverables.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#9191E9] via-[#8585E6] to-[#457EAC] hover:from-[#9d9df0] hover:to-[#5590c2] text-white font-extrabold text-base shadow-xl shadow-[#9191E9]/30 hover:scale-[1.02] transition cursor-pointer self-start sm:self-auto"
        >
          + Add Service
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-300 text-lg">Loading services...</div>
      ) : services.length === 0 ? (
        <div className="glass-panel p-16 text-center rounded-3xl text-slate-400 text-lg">
          No services created yet. Click "+ Add Service" to offer engineering capabilities.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {services.map(s => (
            <div key={s.id} className="glass-card p-7 sm:p-8 rounded-3xl border border-[#2D5D7B]/40 hover:border-[#C2AFF0]/60 transition duration-300 flex flex-col justify-between group shadow-xl">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#9191E9]/20 border border-[#9191E9]/35 flex items-center justify-center text-3xl mb-5 shadow-lg">
                  {s.icon || '⚡'}
                </div>
                <h3 className="font-heading font-extrabold text-white text-xl sm:text-2xl mb-2.5">{s.title}</h3>
                <p className="text-base text-slate-300 leading-relaxed mb-6">{s.description}</p>
                {s.features && s.features.length > 0 && (
                  <ul className="space-y-2 mb-6">
                    {s.features.map((f, i) => (
                      <li key={i} className="text-sm sm:text-base text-slate-300 flex items-center gap-2">
                        <span className="text-[#C2AFF0] font-bold">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="pt-5 border-t border-[#2D5D7B]/40 flex items-center justify-end gap-4">
                <button onClick={() => openModal(s)} className="text-sm sm:text-base font-bold text-slate-300 hover:text-white transition">Edit</button>
                <button onClick={() => handleDelete(s.id)} className="text-sm sm:text-base font-bold text-rose-400 hover:text-rose-300 transition">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-[#2D5D7B]/50 w-full max-w-lg shadow-2xl animate-fadeIn">
            <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-white mb-6 border-b border-[#2D5D7B]/40 pb-4">
              {editingId ? 'Edit Service' : 'Add New Service'}
            </h3>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2">Service Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Full-Stack Web Engineering"
                  className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2">Icon Emoji</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={e => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="⚡, 🛡️, 🚀, ☁️"
                  className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2">Description</label>
                <textarea
                  rows="3"
                  required
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Overview of deliverables and scope..."
                  className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition leading-relaxed"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200 mb-2">Key Features (comma separated)</label>
                <input
                  type="text"
                  value={formData.features}
                  onChange={e => setFormData({ ...formData, features: e.target.value })}
                  placeholder="REST API Design, RBAC Auth, High Performance, Docker Deployment"
                  className="w-full px-5 py-3.5 rounded-2xl bg-[#142330]/90 border border-[#2D5D7B]/60 focus:border-[#C2AFF0] text-white text-base outline-none transition"
                />
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t border-[#2D5D7B]/40">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-6 py-3 rounded-2xl text-base font-bold bg-[#1c3041] text-slate-300 hover:bg-[#253f56] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-7 py-3 rounded-2xl text-base font-extrabold bg-gradient-to-r from-[#9191E9] via-[#8585E6] to-[#457EAC] text-white shadow-lg transition cursor-pointer"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Messages Inbox (Day 7) ---
function MessagesScreen({ showToast }) {
  const { apiFetch } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const loadMessages = () => {
    apiFetch('/contact')
      .then(r => r.json())
      .then(res => setMessages(res.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadMessages(); }, []);

  const toggleRead = async (msg) => {
    try {
      const res = await apiFetch(`/contact/${msg.id}/read`, {
        method: 'PATCH',
        body: JSON.stringify({ isRead: !msg.isRead })
      });
      const json = await res.json();
      if (json.success) {
        loadMessages();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      const res = await apiFetch(`/contact/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('Message deleted');
        if (selectedMessage && selectedMessage.id === id) setSelectedMessage(null);
        loadMessages();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <span>📬</span>
          <span>Contact Inquiries <span className="text-gradient-aurora">Inbox</span></span>
        </h2>
        <p className="text-base sm:text-lg text-slate-300 mt-2 max-w-2xl leading-relaxed">
          Manage inbound outreach, project opportunities, and messages submitted from your contact form.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-300 text-lg">Loading inbox...</div>
      ) : messages.length === 0 ? (
        <div className="glass-panel p-16 text-center rounded-3xl text-slate-400 text-lg">
          Your inbox is clear. Messages submitted through the contact form will show up here.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 glass-panel rounded-3xl divide-y divide-[#2D5D7B]/30 overflow-hidden border border-[#2D5D7B]/40 shadow-xl">
            {messages.map(m => (
              <div
                key={m.id}
                onClick={() => {
                  setSelectedMessage(m);
                  if (!m.isRead) toggleRead(m);
                }}
                className={`p-5 cursor-pointer transition ${
                  selectedMessage?.id === m.id ? 'bg-[#9191E9]/20 border-l-4 border-[#C2AFF0]' : 'hover:bg-[#1c3041]/70'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-base font-bold ${m.isRead ? 'text-slate-300' : 'text-white'}`}>{m.name}</span>
                  {!m.isRead && <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>}
                </div>
                <p className="text-sm text-[#C2AFF0] font-mono truncate">{m.email}</p>
                <p className="text-sm text-slate-400 truncate mt-1">{m.subject || m.message}</p>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2 glass-panel p-8 sm:p-10 rounded-3xl border border-[#2D5D7B]/40 shadow-2xl">
            {selectedMessage ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#2D5D7B]/40">
                  <div>
                    <h3 className="font-heading font-extrabold text-2xl text-white">{selectedMessage.subject || 'Portfolio Inquiry'}</h3>
                    <p className="text-base text-slate-300 mt-1">
                      From: <strong className="text-white font-bold">{selectedMessage.name}</strong> (<span className="text-[#C2AFF0] font-mono">{selectedMessage.email}</span>)
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject || 'Your Portfolio Inquiry')}`}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#9191E9] to-[#457EAC] text-white text-sm sm:text-base font-extrabold shadow-md hover:scale-[1.02] transition"
                    >
                      Reply via Email ✉️
                    </a>
                    <button
                      onClick={() => handleDelete(selectedMessage.id)}
                      className="px-5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-sm sm:text-base font-bold text-rose-300 border border-rose-500/25 transition cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-[#142330]/80 border border-[#2D5D7B]/50 text-slate-200 text-base sm:text-lg leading-relaxed whitespace-pre-wrap font-sans">
                  {selectedMessage.message}
                </div>
              </div>
            ) : (
              <div className="text-center py-24 text-slate-400 text-lg">
                Select an inquiry from the left panel to review message details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Media Library (Day 7) ---
function MediaScreen({ showToast }) {
  const { apiFetch } = useAuth();
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadMedia = () => {
    apiFetch('/upload')
      .then(r => r.json())
      .then(res => setMediaList(res.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadMedia(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await apiFetch('/upload', {
        method: 'POST',
        body: formData
      });
      const json = await res.json();
      if (json.success) {
        showToast('Image uploaded successfully!');
        loadMedia();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url);
    showToast('Copied URL to clipboard!');
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this media file?')) return;
    try {
      const res = await apiFetch(`/upload/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('Media deleted');
        loadMedia();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>🖼️</span>
            <span>Media & <span className="text-gradient-aurora">Asset Library</span></span>
          </h2>
          <p className="text-base sm:text-lg text-slate-300 mt-2 max-w-2xl leading-relaxed">
            Upload, store, and copy URL links for cover images, project screenshots, avatars, and diagrams.
          </p>
        </div>
        <div>
          <label className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#9191E9] via-[#8585E6] to-[#457EAC] hover:from-[#9d9df0] hover:to-[#5590c2] text-white font-extrabold text-base shadow-xl shadow-[#9191E9]/30 hover:scale-[1.02] transition cursor-pointer inline-flex items-center gap-2.5">
            <span>{uploading ? 'Uploading...' : '📁 Upload Image'}</span>
            <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="hidden" />
          </label>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-300 text-lg">Loading media library...</div>
      ) : mediaList.length === 0 ? (
        <div className="glass-panel p-16 text-center rounded-3xl text-slate-400 text-lg">
          No images uploaded yet. Click "Upload Image" to add visual assets.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {mediaList.map(m => (
            <div key={m.id} className="glass-card rounded-2xl overflow-hidden group border border-[#2D5D7B]/40 hover:border-[#C2AFF0]/60 transition duration-300 relative flex flex-col justify-between shadow-xl">
              <div className="w-full h-36 bg-slate-900 flex items-center justify-center overflow-hidden">
                <img src={m.url} alt={m.originalName} className="w-full h-full object-cover group-hover:scale-105 transition" />
              </div>
              <div className="p-4">
                <p className="text-sm font-bold text-slate-200 truncate">{m.originalName}</p>
                <p className="text-xs text-[#C2AFF0] font-mono mt-0.5">{(m.size / 1024).toFixed(1)} KB</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2D5D7B]/30">
                  <button onClick={() => copyUrl(m.url)} className="text-xs sm:text-sm text-[#9191E9] hover:text-[#C2AFF0] font-bold transition">
                    Copy URL
                  </button>
                  <button onClick={() => handleDelete(m.id)} className="text-xs sm:text-sm text-rose-400 hover:text-rose-300 font-bold transition">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Security & Password Management Screen ---
function SecurityScreen({ showToast }) {
  const { user, apiFetch } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const newEvaluation = evaluatePassword(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!newEvaluation.isValid) {
      setStatusMsg({ type: 'error', text: 'New password must satisfy all 5 strength requirements.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiFetch('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to change password');
      }

      showToast('Admin password changed successfully! Account is secured.', 'success');
      setStatusMsg({ type: 'success', text: 'Password successfully updated in database.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <span className="text-2xl">🔒</span>
          <span>Security & Authentication Settings</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Manage your administrator credentials, enforce password policy rules, and update login authentication keys.
        </p>
      </div>

      {/* Account Info Card */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold block mb-1">
            Active Admin Account
          </span>
          <h3 className="text-lg font-bold text-white">{user?.name || 'Administrator'}</h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">{user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold font-mono">
            Role: {user?.role || 'ADMIN'}
          </span>
          <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold font-mono">
            JWT: Active
          </span>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-white">Change Account Password</h3>
          <p className="text-xs text-slate-400 mt-1">
            Enforces strict enterprise security: minimum 8 characters with mixed casing, digits, and special characters.
          </p>
        </div>

        {statusMsg && (
          <div className={`p-4 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-3 border ${
            statusMsg.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}>
            <span>{statusMsg.type === 'error' ? '⚠️' : '✅'}</span>
            <span>{statusMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Current Admin Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700/60 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 placeholder-slate-500 text-sm outline-none transition pr-16 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-mono px-2 py-1"
              >
                {showCurrent ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new strong password"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700/60 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 placeholder-slate-500 text-sm outline-none transition pr-16 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-mono px-2 py-1"
              >
                {showNew ? "Hide" : "Show"}
              </button>
            </div>
            {/* Real-Time Password Strength Widget */}
            <PasswordStrengthWidget password={newPassword} showDetails={true} />
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700/60 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 placeholder-slate-500 text-sm outline-none transition font-mono"
            />
            {confirmPassword.length > 0 && (
              <p className={`text-[11px] mt-1.5 flex items-center gap-1.5 font-medium ${
                passwordsMatch ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                <span>{passwordsMatch ? '✓ Passwords match' : '✕ Passwords do not match'}</span>
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <span className="text-[11px] text-slate-500 font-mono">
              Changes immediately update the database with 10 bcrypt salt rounds.
            </span>
            <button
              type="submit"
              disabled={isSubmitting || !newEvaluation.isValid || !passwordsMatch}
              className="px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/30 transition duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? 'Securing Account...' : 'Update Password 🔒'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Main Admin Layout ---
function AdminLayout() {
  const { user, logout } = useAuth();
  const [view, setView] = useState('dashboard');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'about', label: 'About & Bio', icon: '👤' },
    { id: 'skills', label: 'Skills', icon: '⚡' },
    { id: 'projects', label: 'Projects', icon: '💼' },
    { id: 'blogs', label: 'Blog Posts', icon: '✍️' },
    { id: 'experience', label: 'Experience', icon: '⏳' },
    { id: 'testimonials', label: 'Testimonials', icon: '⭐' },
    { id: 'services', label: 'Services', icon: '🛠️' },
    { id: 'messages', label: 'Inquiries', icon: '📬' },
    { id: 'media', label: 'Media Library', icon: '🖼️' },
    { id: 'security', label: 'Security & Password', icon: '🔒' },
  ];

  return (
    <div className="min-h-screen flex bg-[#070b14] text-slate-100">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Sidebar */}
      <aside className="w-64 glass-panel border-r border-white/5 hidden md:flex flex-col justify-between p-4 sticky top-0 h-screen">
        <div>
          <div className="flex items-center gap-3 px-3 py-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30">
              ⚡
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-white leading-none">CORE CMS</h1>
              <span className="text-[10px] font-mono font-semibold text-indigo-400">Headless Engine</span>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map(item => {
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    active
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/5 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <div className="truncate mr-2">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Admin'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
              {user?.role || 'ADMIN'}
            </span>
          </div>

          <button
            onClick={() => setView('security')}
            className={`w-full py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              view === 'security'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300'
            }`}
          >
            <span>🔒</span>
            <span>Security Settings</span>
          </button>

          <button
            onClick={logout}
            className="w-full py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition"
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="glass-panel border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">CMS /</span>
            <span className="text-sm font-bold text-white capitalize">{view}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('security')}
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>🔒</span>
              <span>Change Password</span>
            </button>
            <a
              href="/"
              target="_blank"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20"
            >
              Public API Root ↗
            </a>
          </div>
        </header>

        <div className="p-6 sm:p-8 flex-1">
          {view === 'dashboard' && <DashboardScreen setView={setView} showToast={showToast} />}
          {view === 'about' && <AboutScreen showToast={showToast} />}
          {view === 'skills' && <SkillsScreen showToast={showToast} />}
          {view === 'projects' && <ProjectsScreen showToast={showToast} />}
          {view === 'blogs' && <BlogsScreen showToast={showToast} />}
          {view === 'experience' && <ExperienceScreen showToast={showToast} />}
          {view === 'testimonials' && <TestimonialsScreen showToast={showToast} />}
          {view === 'services' && <ServicesScreen showToast={showToast} />}
          {view === 'messages' && <MessagesScreen showToast={showToast} />}
          {view === 'media' && <MediaScreen showToast={showToast} />}
          {view === 'security' && <SecurityScreen showToast={showToast} />}
        </div>
      </main>
    </div>
  );
}

// --- Interactive Mathematical & Cyber Engineering Background ---
function AdminMathCanvasBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const mouse = { x: -1000, y: -1000, active: false };
    const ripples = [];

    const mathTokensList = [
      '∑(x_i - μ)²',
      'O(log n)',
      '∫ e^(-x²) dx',
      'e^(iπ) + 1 = 0',
      'det(A - λI) = 0',
      '∇ × E = -∂B/∂t',
      'lim (x→0) sin(x)/x = 1',
      'f\'(x) = 2x + C',
      'π ≈ 3.14159265',
      '0x7FFD_004A',
      'λ => next()',
      'JWT.verify(token)',
      'HTTP/2 200 OK',
      'POST /api/v1/auth',
      'sha256(secret + salt)',
      'Prisma.connect()',
      'SELECT * FROM "Metrics"',
      'Cache: 99.8% hit',
      'AES-GCM-256',
      'k8s:pod/ready'
    ];

    const isMobile = window.innerWidth < 768;
    const NODE_COUNT = isMobile ? 28 : 55;
    const CONNECT_DIST = isMobile ? 90 : 130;
    const MOUSE_CONNECT_DIST = isMobile ? 110 : 170;
    const TOKEN_COUNT = isMobile ? 8 : 16;

    // Light neon / cyber colors for admin portal
    const colors = [
      { r: 56, g: 189, b: 248, hex: '#38bdf8' },  // Ice Cyan
      { r: 52, g: 211, b: 153, hex: '#34d399' },  // Soft Emerald
      { r: 192, g: 132, b: 252, hex: '#c084fc' }, // Light Violet
      { r: 251, g: 191, b: 36, hex: '#fbbf24' }   // Soft Amber
    ];

    const nodes = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 2.2 + 1.2,
        color: colors[i % colors.length],
        pulseOffset: Math.random() * Math.PI * 2
      });
    }

    const tokens = [];
    for (let i = 0; i < TOKEN_COUNT; i++) {
      tokens.push({
        text: mathTokensList[i % mathTokensList.length],
        x: Math.random() * width,
        y: Math.random() * height,
        vy: -0.2 - Math.random() * 0.25,
        wavePhase: Math.random() * Math.PI * 2,
        color: colors[i % colors.length],
        fontSize: Math.floor(Math.random() * 2) + 11,
        opacity: 0.18 + Math.random() * 0.16
      });
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
      mouse.active = false;
    };

    const handleClick = (e) => {
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: 180,
        opacity: 0.75,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('click', handleClick);

    let time = 0;
    const render = () => {
      time += 0.016;
      ctx.clearRect(0, 0, width, height);

      // Ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += 3.5;
        r.opacity *= 0.96;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r.color.r}, ${r.color.g}, ${r.color.b}, ${r.opacity})`;
        ctx.lineWidth = 1.6;
        ctx.stroke();

        if (r.opacity < 0.02 || r.radius > r.maxRadius) {
          ripples.splice(i, 1);
        }
      }

      // Mathematical Tokens
      ctx.textBaseline = 'middle';
      for (let i = 0; i < tokens.length; i++) {
        const tok = tokens[i];
        tok.y += tok.vy;
        tok.wavePhase += 0.012;
        const currentX = tok.x + Math.sin(tok.wavePhase) * 18;

        if (tok.y < -30) {
          tok.y = height + 20;
          tok.x = Math.random() * width;
        }

        ctx.font = `${tok.fontSize}px "JetBrains Mono", monospace`;
        ctx.fillStyle = `rgba(${tok.color.r}, ${tok.color.g}, ${tok.color.b}, ${tok.opacity})`;
        ctx.fillText(tok.text, currentX, tok.y);
      }

      // Constellation Nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.x += node.vx;
        node.y += node.vy;

        if (node.x <= 0 || node.x >= width) node.vx *= -1;
        if (node.y <= 0 || node.y >= height) node.vy *= -1;

        if (mouse.active) {
          const dx = mouse.x - node.x;
          const dy = mouse.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_CONNECT_DIST) {
            const mouseAlpha = (1 - dist / MOUSE_CONNECT_DIST) * 0.45;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(${node.color.r}, ${node.color.g}, ${node.color.b}, ${mouseAlpha})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();

            const force = (1 - dist / MOUSE_CONNECT_DIST) * 0.22;
            node.x += (dx / dist) * force;
            node.y += (dy / dist) * force;
          }
        }

        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * 0.26;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(${node.color.r}, ${node.color.g}, ${node.color.b}, ${alpha})`;
            ctx.lineWidth = 0.85;
            ctx.stroke();
          }
        }

        const pulse = Math.sin(time * 3 + node.pulseOffset) * 0.5 + 0.5;
        const currentRadius = node.radius + pulse * 1.1;
        const glowAlpha = 0.45 + pulse * 0.35;

        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${node.color.r}, ${node.color.g}, ${node.color.b}, ${glowAlpha * 0.16})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${node.color.r}, ${node.color.g}, ${node.color.b}, ${glowAlpha})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Dynamic Moving Ambient Gradients */}
      <div className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-[#38bdf8]/15 via-[#34d399]/10 to-transparent blur-[140px] animate-admin-aurora-1"></div>
      <div className="absolute top-[35%] -right-[15%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-bl from-[#c084fc]/15 via-[#38bdf8]/10 to-transparent blur-[150px] animate-admin-aurora-2"></div>
      <div className="absolute -bottom-[15%] left-[25%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-[#34d399]/15 via-[#c084fc]/12 to-transparent blur-[160px] animate-admin-aurora-3"></div>

      {/* Cyber Perspective Grid & Scanline */}
      <div className="absolute inset-0 admin-cyber-grid opacity-35"></div>
      <div className="absolute inset-0 admin-scanline"></div>

      {/* Interactive 60 FPS Mathematical Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

// --- App Root ---
function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#080d1a] text-slate-100 overflow-x-hidden selection:bg-cyan-500 selection:text-slate-950">
      <AdminMathCanvasBackground />
      <div className="relative z-10">
        {user ? <AdminLayout /> : <LoginScreen />}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
