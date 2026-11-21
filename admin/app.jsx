const { useState, useEffect, useContext, createContext, useMemo } = React;

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

// --- Login Screen (Day 5) ---
function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-[#070b14] via-[#0b1329] to-[#070b14]">
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-600/20 rounded-full blur-[128px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="glass-panel p-8 sm:p-10 rounded-3xl shadow-2xl border border-white/10">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4">
              <span className="text-2xl font-bold text-white tracking-wider">⚡</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Core CMS Admin</h1>
            <p className="text-slate-400 text-sm mt-1">Sign in to manage your headless portfolio</p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@portfolio.local"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700/60 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 placeholder-slate-500 text-sm outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700/60 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 placeholder-slate-500 text-sm outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/30 transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Verifying credentials...' : 'Access CMS Dashboard →'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={() => {
                setEmail('admin@portfolio.local');
                setPassword('Admin@123456');
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg border border-indigo-500/20 transition"
            >
              Fill Default Seed Credentials
            </button>
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
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const statCards = [
    { label: 'Projects', val: stats.projects, icon: '💼', view: 'projects' },
    { label: 'Blogs / Articles', val: stats.blogs, sub: `${stats.blogViews} views`, icon: '✍️', view: 'blogs' },
    { label: 'Skills', val: stats.skills, icon: '⚡', view: 'skills' },
    { label: 'Testimonials', val: stats.testimonials, icon: '⭐', view: 'testimonials' },
    { label: 'Inbound Inquiries', val: stats.messages, sub: `${stats.unreadMessages} unread`, icon: '📬', view: 'messages', badge: stats.unreadMessages },
    { label: 'Services', val: stats.services, icon: '🛠️', view: 'services' }
  ];

  return (
    <div className="space-y-8">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 relative overflow-hidden bg-gradient-to-r from-indigo-900/30 via-slate-900/40 to-slate-900/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
              <span>●</span> Live Headless API Connected
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Portfolio Control Center</h2>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              All portfolio content is stored in PostgreSQL and delivered to your frontend via clean REST APIs.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('projects')}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition"
            >
              + Add Project
            </button>
            <button
              onClick={() => setView('blogs')}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition"
            >
              ✍️ Write Blog
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {statCards.map((card, i) => (
          <div
            key={i}
            onClick={() => setView(card.view)}
            className="glass-card p-5 sm:p-6 rounded-2xl hover:border-indigo-500/50 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
              {card.badge > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white animate-pulse">
                  {card.badge} New
                </span>
              )}
            </div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{card.label}</p>
            <p className="text-3xl font-extrabold text-white mt-1 group-hover:text-indigo-400 transition">{card.val}</p>
            {card.sub && <p className="text-xs text-slate-400 mt-2">{card.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-white/10">
          <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
            <span>🩺</span> System Health & Database
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5 text-sm">
              <span className="text-slate-400">Database Engine</span>
              <span className="text-slate-200 font-medium">PostgreSQL via Prisma</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5 text-sm">
              <span className="text-slate-400">Database Latency</span>
              <span className="text-emerald-400 font-mono font-medium">{health.latencyMs} ms</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5 text-sm">
              <span className="text-slate-400">API Gateway</span>
              <span className="text-indigo-400 font-mono text-xs">/api (Express.js)</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <span>📬</span> Recent Inquiries
            </h3>
            <button
              onClick={() => setView('messages')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              View All &rarr;
            </button>
          </div>
          {recentMessages.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No inquiries yet. Submissions from the contact form will show up here.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentMessages.map(msg => (
                <div
                  key={msg.id}
                  onClick={() => setView('messages')}
                  className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/5 transition cursor-pointer flex items-center justify-between"
                >
                  <div className="truncate mr-3">
                    <p className="text-sm font-semibold text-slate-200 truncate">{msg.name}</p>
                    <p className="text-xs text-slate-400 truncate">{msg.subject || msg.message}</p>
                  </div>
                  {!msg.isRead && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0"></span>
                  )}
                </div>
              ))}
            </div>
          )}
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

  if (loading) return <div className="text-center py-12 text-slate-400">Loading About profile...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">About & Bio Profile</h2>
          <p className="text-sm text-slate-400">Manage hero intro, biography, and social links</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Headline Title</label>
            <input
              type="text"
              value={data.title || ''}
              onChange={e => setData({ ...data, title: e.target.value })}
              placeholder="Full Stack Engineer & Architect"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Subtitle</label>
            <input
              type="text"
              value={data.subtitle || ''}
              onChange={e => setData({ ...data, subtitle: e.target.value })}
              placeholder="Building resilient cloud systems"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Full Biography</label>
          <textarea
            rows="5"
            value={data.bio || ''}
            onChange={e => setData({ ...data, bio: e.target.value })}
            placeholder="Tell your story, expertise and passions..."
            className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
          ></textarea>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Location</label>
            <input
              type="text"
              value={data.location || ''}
              onChange={e => setData({ ...data, location: e.target.value })}
              placeholder="San Francisco / Bengaluru"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Public Email</label>
            <input
              type="email"
              value={data.email || ''}
              onChange={e => setData({ ...data, email: e.target.value })}
              placeholder="dev@example.com"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Resume / CV URL</label>
            <input
              type="text"
              value={data.resumeUrl || ''}
              onChange={e => setData({ ...data, resumeUrl: e.target.value })}
              placeholder="/uploads/resume.pdf or drive link"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">GitHub Profile</label>
            <input
              type="text"
              value={data.githubUrl || ''}
              onChange={e => setData({ ...data, githubUrl: e.target.value })}
              placeholder="https://github.com/..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">LinkedIn Profile</label>
            <input
              type="text"
              value={data.linkedinUrl || ''}
              onChange={e => setData({ ...data, linkedinUrl: e.target.value })}
              placeholder="https://linkedin.com/in/..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Twitter / X Profile</label>
            <input
              type="text"
              value={data.twitterUrl || ''}
              onChange={e => setData({ ...data, twitterUrl: e.target.value })}
              placeholder="https://x.com/..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile Changes'}
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Skills Inventory</h2>
          <p className="text-sm text-slate-400">Manage technical competencies and proficiency levels</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition"
        >
          + Add Skill
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading skills...</div>
      ) : skills.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl text-slate-500">
          No skills added yet. Click "+ Add Skill" to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map(s => (
            <div key={s.id} className="glass-card p-5 rounded-2xl flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {s.category}
                  </span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => openModal(s)} className="text-xs text-slate-400 hover:text-white">Edit</button>
                    <button onClick={() => handleDelete(s.id)} className="text-xs text-rose-400 hover:text-rose-300">Delete</button>
                  </div>
                </div>
                <h4 className="font-bold text-white text-base mt-1">{s.name}</h4>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Proficiency</span>
                  <span className="font-mono">{s.proficiency}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: `${s.proficiency}%` }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">{editingId ? 'Edit Skill' : 'Add New Skill'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Skill Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. React.js, PostgreSQL"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
                >
                  <option value="Frontend">Frontend</option>
                  <option value="Backend">Backend</option>
                  <option value="Database">Database</option>
                  <option value="DevOps & Cloud">DevOps & Cloud</option>
                  <option value="Tools & Architecture">Tools & Architecture</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Proficiency ({formData.proficiency}%)</label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={formData.proficiency}
                  onChange={e => setFormData({ ...formData, proficiency: parseInt(e.target.value, 10) })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Project Showcase</h2>
          <p className="text-sm text-slate-400">Curate portfolio work with live previews, tags, and links</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition"
        >
          + Add Project
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl text-slate-500">
          No projects created yet. Click "+ Add Project" to showcase your work.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(p => (
            <div key={p.id} className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between group border border-white/5 hover:border-indigo-500/40 transition">
              <div>
                {p.coverImage ? (
                  <img src={p.coverImage} alt={p.title} className="w-full h-44 object-cover" />
                ) : (
                  <div className="w-full h-36 bg-gradient-to-br from-indigo-900/40 to-slate-900 flex items-center justify-center text-3xl">
                    🚀
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-indigo-400">/{p.slug}</span>
                    {p.isFeatured && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Featured
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-white text-lg">{p.title}</h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-3">{p.description}</p>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(p.tags || []).map((t, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-white/5">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  {p.demoUrl && <a href={p.demoUrl} target="_blank" className="text-indigo-400 hover:underline">Demo ↗</a>}
                  {p.githubUrl && <a href={p.githubUrl} target="_blank" className="text-slate-400 hover:underline">GitHub ↗</a>}
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => openModal(p)} className="text-slate-300 hover:text-white font-medium">Edit</button>
                  <button onClick={() => handleDelete(p.id)} className="text-rose-400 hover:text-rose-300 font-medium">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 w-full max-w-xl my-8">
            <h3 className="text-lg font-bold text-white mb-4">{editingId ? 'Edit Project' : 'Create New Project'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Next-Gen Portfolio Engine"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Slug (auto-generated if empty)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="portfolio-engine"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Cover Image URL</label>
                  <input
                    type="text"
                    value={formData.coverImage}
                    onChange={e => setFormData({ ...formData, coverImage: e.target.value })}
                    placeholder="/uploads/... or https://..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Short Description</label>
                <textarea
                  rows="3"
                  required
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief summary of problem solved, architecture, and impact..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={e => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="React, Next.js, Node.js, Prisma"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Live Demo Link</label>
                  <input
                    type="url"
                    value={formData.demoUrl}
                    onChange={e => setFormData({ ...formData, demoUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">GitHub Repo Link</label>
                  <input
                    type="url"
                    value={formData.githubUrl}
                    onChange={e => setFormData({ ...formData, githubUrl: e.target.value })}
                    placeholder="https://github.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isFeatured" className="text-sm text-slate-300">Feature this project prominently on homepage</label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Articles & Blog Posts</h2>
          <p className="text-sm text-slate-400">Share technical insights and tutorials</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition"
        >
          ✍️ Write Article
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading articles...</div>
      ) : blogs.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl text-slate-500">
          No articles written yet. Click "Write Article" to publish your first post.
        </div>
      ) : (
        <div className="space-y-4">
          {blogs.map(b => (
            <div key={b.id} className="glass-panel p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/5 hover:border-indigo-500/40 transition">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                    b.isPublished ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {b.isPublished ? 'Published' : 'Draft'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">/{b.slug}</span>
                  <span className="text-xs text-slate-400">👁️ {b.views || 0} reads</span>
                </div>
                <h3 className="font-bold text-white text-lg">{b.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{b.excerpt}</p>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <button onClick={() => openModal(b)} className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200">
                  Edit
                </button>
                <button onClick={() => handleDelete(b.id)} className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-300">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 w-full max-w-2xl my-8">
            <h3 className="text-lg font-bold text-white mb-4">{editingId ? 'Edit Article' : 'Write New Article'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Architecting a Zero-Lockin Headless CMS"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Custom Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="architecting-headless-cms"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Cover Image URL</label>
                  <input
                    type="text"
                    value={formData.coverImage}
                    onChange={e => setFormData({ ...formData, coverImage: e.target.value })}
                    placeholder="/uploads/..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Short Excerpt / Teaser</label>
                <textarea
                  rows="2"
                  value={formData.excerpt}
                  onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Quick summary shown on previews..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Article Body (Markdown)</label>
                <textarea
                  rows="8"
                  required
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  placeholder="# Introduction\nWrite your thoughts, code snippets, and explanations here..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs text-white outline-none focus:border-indigo-500"
                ></textarea>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={e => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isPublished" className="text-sm text-slate-300">Publish immediately to public portfolio</label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Experience & Career Timeline</h2>
          <p className="text-sm text-slate-400">Work history, roles, responsibilities, and achievements</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition"
        >
          + Add Experience
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading experience records...</div>
      ) : experiences.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl text-slate-500">
          No experience records added yet. Click "+ Add Experience" to build your timeline.
        </div>
      ) : (
        <div className="space-y-4">
          {experiences.map(exp => (
            <div key={exp.id} className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row justify-between gap-4 border border-white/5">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-lg">{exp.role}</h3>
                  <span className="text-slate-400">@</span>
                  <span className="text-indigo-400 font-semibold">{exp.company}</span>
                  {exp.isCurrent && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate} {exp.location ? `• ${exp.location}` : ''}
                </p>
                <p className="text-sm text-slate-300 mt-2">{exp.description}</p>
                {exp.highlights && exp.highlights.length > 0 && (
                  <ul className="list-disc list-inside text-xs text-slate-400 mt-2 space-y-1">
                    {exp.highlights.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                )}
              </div>
              <div className="flex items-center gap-3 self-end sm:self-start">
                <button onClick={() => openModal(exp)} className="text-xs text-slate-300 hover:text-white font-semibold">Edit</button>
                <button onClick={() => handleDelete(exp.id)} className="text-xs text-rose-400 hover:text-rose-300 font-semibold">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 w-full max-w-lg my-8">
            <h3 className="text-lg font-bold text-white mb-4">{editingId ? 'Edit Experience' : 'Add Experience'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Role / Title</label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    placeholder="Senior Software Engineer"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Company</label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Google, Acme Corp"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Start Date</label>
                  <input
                    type="text"
                    required
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    placeholder="Jan 2023"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">End Date</label>
                  <input
                    type="text"
                    disabled={formData.isCurrent}
                    value={formData.isCurrent ? 'Present' : formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    placeholder="Present / Dec 2024"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isCurrent"
                  checked={formData.isCurrent}
                  onChange={e => setFormData({ ...formData, isCurrent: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isCurrent" className="text-sm text-slate-300">Currently working here</label>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Description</label>
                <textarea
                  rows="3"
                  required
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summary of responsibilities and technical ownership..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Bullet Highlights (one per line)</label>
                <textarea
                  rows="3"
                  value={formData.highlights}
                  onChange={e => setFormData({ ...formData, highlights: e.target.value })}
                  placeholder="Architected distributed database layer&#10;Mentored 4 junior engineers"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Client & Colleague Testimonials</h2>
          <p className="text-sm text-slate-400">Social proof, recommendations, and reviews</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition"
        >
          + Add Testimonial
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading testimonials...</div>
      ) : testimonials.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl text-slate-500">
          No testimonials yet. Click "+ Add Testimonial" to add praise from colleagues.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map(t => (
            <div key={t.id} className="glass-card p-6 rounded-2xl flex flex-col justify-between group border border-white/5">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-amber-400 text-sm">{'★'.repeat(t.rating || 5)}</div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openModal(t)} className="text-xs text-slate-400 hover:text-white">Edit</button>
                    <button onClick={() => handleDelete(t.id)} className="text-xs text-rose-400 hover:text-rose-300">Delete</button>
                  </div>
                </div>
                <p className="text-sm text-slate-300 italic mb-4">"{t.content}"</p>
              </div>
              <div className="pt-3 border-t border-white/5">
                <p className="font-bold text-white text-sm">{t.authorName}</p>
                <p className="text-xs text-slate-400">{t.authorRole} {t.company ? `• ${t.company}` : ''}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">{editingId ? 'Edit Testimonial' : 'Add Testimonial'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Author Name</label>
                <input
                  type="text"
                  required
                  value={formData.authorName}
                  onChange={e => setFormData({ ...formData, authorName: e.target.value })}
                  placeholder="Sarah Jenkins"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Role / Title</label>
                  <input
                    type="text"
                    required
                    value={formData.authorRole}
                    onChange={e => setFormData({ ...formData, authorRole: e.target.value })}
                    placeholder="VP of Engineering"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Stripe"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Endorsement Content</label>
                <textarea
                  rows="4"
                  required
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Describe your working relationship and key strengths..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Service Offerings</h2>
          <p className="text-sm text-slate-400">Freelance, consulting, and engineering services</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition"
        >
          + Add Service
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading services...</div>
      ) : services.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl text-slate-500">
          No services created yet. Click "+ Add Service" to define what you build.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(s => (
            <div key={s.id} className="glass-card p-6 rounded-2xl flex flex-col justify-between group border border-white/5">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{s.icon || '🛠️'}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openModal(s)} className="text-xs text-slate-400 hover:text-white">Edit</button>
                    <button onClick={() => handleDelete(s.id)} className="text-xs text-rose-400 hover:text-rose-300">Delete</button>
                  </div>
                </div>
                <h3 className="font-bold text-white text-lg">{s.title}</h3>
                <p className="text-xs text-slate-400 mt-2">{s.description}</p>
                {s.features && s.features.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {s.features.map((f, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">{editingId ? 'Edit Service' : 'Add Service'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Full Stack Engineering"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Description</label>
                <textarea
                  rows="3"
                  required
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Production-ready web applications built with modern tools..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Features (comma separated)</label>
                <input
                  type="text"
                  value={formData.features}
                  onChange={e => setFormData({ ...formData, features: e.target.value })}
                  placeholder="API Design, Performance Optimization, Cloud Deployments"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Contact Inquiries Inbox</h2>
        <p className="text-sm text-slate-400">Incoming inquiries and project requests from your portfolio</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading inbox...</div>
      ) : messages.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl text-slate-500">
          Your inbox is clear. Messages submitted through the contact form will show up here.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 glass-panel rounded-2xl divide-y divide-white/5 overflow-hidden">
            {messages.map(m => (
              <div
                key={m.id}
                onClick={() => {
                  setSelectedMessage(m);
                  if (!m.isRead) toggleRead(m);
                }}
                className={`p-4 cursor-pointer transition ${
                  selectedMessage?.id === m.id ? 'bg-indigo-600/20' : 'hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-bold ${m.isRead ? 'text-slate-300' : 'text-white'}`}>{m.name}</span>
                  {!m.isRead && <span className="w-2 h-2 rounded-full bg-rose-500"></span>}
                </div>
                <p className="text-xs text-indigo-400 truncate">{m.email}</p>
                <p className="text-xs text-slate-400 truncate mt-1">{m.subject || m.message}</p>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2 glass-panel p-6 sm:p-8 rounded-2xl border border-white/10">
            {selectedMessage ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedMessage.subject || 'Portfolio Inquiry'}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      From: <strong className="text-slate-200">{selectedMessage.name}</strong> ({selectedMessage.email})
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject || 'Your Portfolio Inquiry')}`}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
                    >
                      Reply via Email
                    </a>
                    <button
                      onClick={() => handleDelete(selectedMessage.id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                  {selectedMessage.message}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500 text-sm">
                Select an inquiry from the list to view its contents.
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Media Library</h2>
          <p className="text-sm text-slate-400">Upload and manage image assets for projects, avatars, and blogs</p>
        </div>
        <div>
          <label className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition cursor-pointer inline-flex items-center gap-2">
            <span>{uploading ? 'Uploading...' : '📁 Upload Image'}</span>
            <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="hidden" />
          </label>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading media library...</div>
      ) : mediaList.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl text-slate-500">
          No images uploaded yet. Click "Upload Image" to add visual assets.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {mediaList.map(m => (
            <div key={m.id} className="glass-card rounded-xl overflow-hidden group border border-white/5 relative flex flex-col justify-between">
              <div className="w-full h-32 bg-slate-900 flex items-center justify-center overflow-hidden">
                <img src={m.url} alt={m.originalName} className="w-full h-full object-cover group-hover:scale-105 transition" />
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold text-slate-200 truncate">{m.originalName}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{(m.size / 1024).toFixed(1)} KB</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                  <button onClick={() => copyUrl(m.url)} className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold">
                    Copy URL
                  </button>
                  <button onClick={() => handleDelete(m.id)} className="text-[11px] text-rose-400 hover:text-rose-300">
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

        <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <div className="truncate mr-2">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Admin'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
              {user?.role || 'ADMIN'}
            </span>
          </div>
          <button
            onClick={logout}
            className="w-full mt-2 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition"
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
        </div>
      </main>
    </div>
  );
}

// --- App Root ---
function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return user ? <AdminLayout /> : <LoginScreen />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
