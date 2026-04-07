/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  NavLink, 
  Link,
  useLocation,
  useNavigate,
  Navigate
} from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Settings, 
  LayoutDashboard, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Smartphone,
  ChevronRight,
  ShoppingCart,
  Zap,
  FileText,
  Terminal,
  HelpCircle,
  Wrench,
  LogOut,
  Plus,
  Copy,
  ExternalLink,
  Code,
  CreditCard,
  Package,
  Users,
  ShieldCheck,
  Bell,
  BarChart3,
  TrendingUp,
  UserPlus,
  Trash2,
  X,
  Link2,
  QrCode,
  Loader2,
  ArrowRight
} from 'lucide-react';

// --- Types ---
interface MessageTemplate {
  id: string;
  name: string;
  greeting: string;
  discount_code: string;
  urgency_text: string;
}

interface CartData {
  customer_phone: string;
  items: string[];
  total: number;
  timestamp: string;
}

// --- Mock Data ---
const INITIAL_TEMPLATES: MessageTemplate[] = [
  {
    id: '1',
    name: 'Smart Recovery Template',
    greeting: "Hey [Name]! We noticed you left some items in your cart. Still interested?",
    discount_code: "SAVE10",
    urgency_text: "We've saved your cart for you, but it won't last forever!"
  }
];

import { 
  LoginPage, 
  RegisterPage, 
  ForgotPasswordPage 
} from './pages/auth/AuthPages';

// --- Components ---

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  
  const userNavItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/connections', icon: Link2, label: 'Connections' },
    { path: '/customization', icon: Settings, label: 'Customization' },
    { path: '/packages', icon: CreditCard, label: 'Packages' },
    { path: '/help', icon: HelpCircle, label: 'Help' },
  ];

  const adminNavItems = [
    { path: '/admin', icon: BarChart3, label: 'Admin Overview' },
    { path: '/admin/users', icon: Users, label: 'Manage Users' },
    { path: '/admin/packages', icon: CreditCard, label: 'Edit Packages' },
    { path: '/admin/notifications', icon: Bell, label: 'Broadcasts' },
  ];

  const currentNavItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-1">
          <div className={`p-1.5 rounded-lg ${isAdmin ? 'bg-indigo-500' : 'bg-[#25D366]'}`}>
            {isAdmin ? <ShieldCheck className="text-white w-5 h-5" /> : <MessageSquare className="text-white w-5 h-5" />}
          </div>
          <h1 className="text-xl font-bold tracking-tight">WhatCart {isAdmin && <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded ml-1">ADMIN</span>}</h1>
        </div>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
          {isAdmin ? 'Internal Management' : 'Cart Recovery via WhatsApp'}
        </p>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        {currentNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin' || item.path === '/'}
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                ? (isAdmin ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'bg-[#25D366] text-white shadow-lg shadow-emerald-900/20')
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon size={20} className="shrink-0" />
            <span className="font-medium text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-slate-800 space-y-2">
        <button 
          onClick={() => navigate(isAdmin ? '/' : '/admin')}
          className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all text-sm font-bold ${
            isAdmin 
            ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' 
            : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20'
          }`}
        >
          {isAdmin ? <LayoutDashboard size={18} /> : <ShieldCheck size={18} />}
          <span>{isAdmin ? 'User Dashboard' : 'Admin Panel'}</span>
        </button>
        <button 
          onClick={() => {
            localStorage.removeItem('user');
            window.location.href = '/login';
          }}
          className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
        >
          <LogOut size={20} />
          <span className="font-medium text-sm">Log Out</span>
        </button>
      </div>
    </aside>
  );
};

const PageWrapper = ({ children, title, subtitle }: { children: React.ReactNode, title?: string, subtitle?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
    className="p-8"
  >
    {(title || subtitle) && (
      <div className="mb-8">
        {title && <h2 className="text-2xl font-bold text-slate-900">{title}</h2>}
        {subtitle && <p className="text-slate-500">{subtitle}</p>}
      </div>
    )}
    {children}
  </motion.div>
);

// --- Pages ---

const ConnectionsPage = () => {
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [storeUrl, setStoreUrl] = useState('');
  const [storeToken, setStoreToken] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const userId = 1; // Mock user ID for now

  useEffect(() => {
    fetch(`/api/connections/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.shopify_url) {
          setShopifyConnected(true);
          setStoreUrl(data.shopify_url);
        }
        if (data.whatsapp_status === 'connected') {
          setWhatsappConnected(true);
        }
        setIsActive(data.is_active === 1);
      });
  }, []);

  const handleConnectShopify = async () => {
    if (!storeUrl || !storeToken) return;
    setConnecting(true);
    try {
      const res = await fetch('/api/connections/shopify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, shopifyUrl: storeUrl, shopifyToken: storeToken })
      });
      if (res.ok) {
        setShopifyConnected(true);
      }
    } catch (error) {
      console.error("Failed to connect Shopify:", error);
    } finally {
      setConnecting(false);
    }
  };

  const handleConnectWhatsapp = async () => {
    setConnecting(true);
    try {
      const res = await fetch('/api/connections/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: 'connected', phone: '+1234567890' })
      });
      if (res.ok) {
        setWhatsappConnected(true);
      }
    } catch (error) {
      console.error("Failed to connect WhatsApp:", error);
    } finally {
      setConnecting(false);
    }
  };

  const handleToggleSmartRecovery = async () => {
    const newStatus = !isActive;
    try {
      const res = await fetch('/api/connections/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isActive: newStatus })
      });
      if (res.ok) {
        setIsActive(newStatus);
      }
    } catch (error) {
      console.error("Failed to toggle Smart Recovery:", error);
    }
  };

  return (
    <PageWrapper title="Connections" subtitle="Connect your store and WhatsApp to start recovering carts automatically.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
        {/* Shopify Connection Card */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-emerald-50 p-4 rounded-2xl">
              <ShoppingCart className="text-[#25D366] w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Shopify Store</h3>
              <p className="text-sm text-slate-500">Connect your Shopify store to sync carts.</p>
            </div>
          </div>

          {!shopifyConnected ? (
            <div className="space-y-4 mt-auto">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Store URL</label>
                <input 
                  type="text" 
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                  placeholder="my-store.myshopify.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-[#25D366] outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">API Access Token</label>
                <input 
                  type="password" 
                  value={storeToken}
                  onChange={(e) => setStoreToken(e.target.value)}
                  placeholder="shpat_xxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-[#25D366] outline-none transition-all"
                />
              </div>
              <button 
                onClick={handleConnectShopify}
                disabled={connecting || !storeUrl || !storeToken}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {connecting ? <Loader2 className="animate-spin" size={20} /> : <>Connect Shopify <ArrowRight size={20} /></>}
              </button>
            </div>
          ) : (
            <div className="mt-auto">
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 mb-4">
                <div className="bg-emerald-500 p-1 rounded-full">
                  <CheckCircle2 className="text-white w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-900">Connected to {storeUrl}</p>
                  <p className="text-xs text-emerald-700">Webhooks & API synced automatically.</p>
                </div>
              </div>
              <button 
                onClick={() => setShopifyConnected(false)}
                className="text-sm text-slate-400 font-bold hover:text-red-500 transition-colors"
              >
                Disconnect Store
              </button>
            </div>
          )}
        </motion.div>

        {/* WhatsApp Connection Card */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-emerald-50 p-4 rounded-2xl">
              <MessageSquare className="text-[#25D366] w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">WhatsApp Account</h3>
              <p className="text-sm text-slate-500">Connect your WhatsApp to send messages.</p>
            </div>
          </div>

          {!whatsappConnected ? (
            <div className="space-y-6 mt-auto">
              <div className="flex justify-center p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <div className="w-32 h-32 bg-white flex items-center justify-center rounded-xl shadow-sm border border-slate-100">
                  <QrCode className="text-slate-300 w-20 h-20" />
                </div>
              </div>
              <p className="text-xs text-center text-slate-500 px-4">
                Scan the QR code with your WhatsApp app to link your account.
              </p>
              <button 
                onClick={handleConnectWhatsapp}
                disabled={connecting}
                className="w-full py-4 bg-[#25D366] text-white rounded-2xl font-bold hover:bg-[#1eb954] transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
              >
                {connecting ? <Loader2 className="animate-spin" size={20} /> : <>Scan & Connect <ArrowRight size={20} /></>}
              </button>
            </div>
          ) : (
            <div className="mt-auto">
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 mb-4">
                <div className="bg-emerald-500 p-1 rounded-full">
                  <CheckCircle2 className="text-white w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-900">WhatsApp Connected</p>
                  <p className="text-xs text-emerald-700">Ready to send recovery messages.</p>
                </div>
              </div>
              <button 
                onClick={() => setWhatsappConnected(false)}
                className="text-sm text-slate-400 font-bold hover:text-red-500 transition-colors"
              >
                Disconnect WhatsApp
              </button>
            </div>
          )}
        </motion.div>
      </div>

      <div className="mt-12 bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
        <div className="relative z-10">
          <h3 className="text-2xl font-bold mb-2">Smart Recovery is {isActive ? 'Active' : 'Paused'}</h3>
          <p className="text-slate-400 max-w-md">
            Once both connections are active, WhatCart automatically handles abandoned carts using our AI-optimized timing and templates.
          </p>
        </div>
        <div className="flex items-center gap-6 relative z-10">
          <button 
            onClick={handleToggleSmartRecovery}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              isActive 
              ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' 
              : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'
            }`}
          >
            {isActive ? 'Pause Recovery' : 'Enable Smart Recovery'}
          </button>
          <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <div className={`w-4 h-4 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] ${isActive ? 'animate-pulse' : 'opacity-50'}`}></div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -mr-32 -mt-32"></div>
      </div>
    </PageWrapper>
  );
};

const DashboardPage = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year'>('month');
  const [connectionStatus, setConnectionStatus] = useState({ shopify: false, whatsapp: false });
  const userId = 1;

  useEffect(() => {
    fetch(`/api/connections/${userId}`)
      .then(res => res.json())
      .then(data => {
        setConnectionStatus({
          shopify: !!data.shopify_url,
          whatsapp: data.whatsapp_status === 'connected'
        });
      });
  }, []);

  const handleTestSend = () => {
    setIsTesting(true);
    setTestStatus("Initializing recovery sequence...");
    setTimeout(() => {
      setTestStatus("Waiting for 30-minute recovery window...");
      setTimeout(() => {
        setTestStatus("Message sent successfully!");
        setIsTesting(false);
        setTimeout(() => setTestStatus(null), 3000);
      }, 2000);
    }, 1000);
  };

  const getRevenue = () => {
    switch(timeFilter) {
      case 'week': return '$2,840.00';
      case 'year': return '$148,200.00';
      default: return '$12,450.00';
    }
  };

  return (
    <PageWrapper>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-slate-500">Overview of your recovery performance</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            {(['week', 'month', 'year'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                  timeFilter === f 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <Link to="/connections" className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
            connectionStatus.shopify && connectionStatus.whatsapp
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
            : 'bg-amber-50 text-amber-700 border-amber-100'
          }`}>
            <Link2 size={14} /> 
            {connectionStatus.shopify && connectionStatus.whatsapp ? 'System Active' : 'Setup Required'}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Recovered Revenue', value: getRevenue(), trend: '+12%', color: 'text-emerald-600' },
          { label: 'Abandoned Checkouts', value: '482', trend: '+14%', color: 'text-slate-900' },
          { label: 'Messages Sent', value: '1,240', trend: '+22%', color: 'text-blue-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">{stat.label}</p>
            <div className="flex items-end justify-between">
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
              <span className="text-[10px] font-bold bg-slate-50 px-2 py-1 rounded text-slate-500 border border-slate-100">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold">Quick Recovery Test</h3>
              <p className="text-slate-500 text-sm">Simulate an abandoned cart event</p>
            </div>
            <div className="bg-amber-100 p-2 rounded-lg">
              <Zap className="text-amber-500 w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200 font-mono text-xs text-slate-600">
            <p className="mb-1 font-bold text-slate-400">// Incoming Cart Payload</p>
            <p>{"{"}</p>
            <p className="pl-4">"customer": "+1 555 0123",</p>
            <p className="pl-4">"items": ["Summer Dress", "Beach Bag"],</p>
            <p className="pl-4">"total": 125.00</p>
            <p>{"}"}</p>
          </div>

          <button
            onClick={handleTestSend}
            disabled={isTesting}
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              isTesting 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-[#25D366] text-white hover:bg-[#1eb954] shadow-lg shadow-emerald-100 active:scale-[0.98]'
            }`}
          >
            {isTesting ? <Clock className="animate-spin" /> : <Send size={20} />}
            {isTesting ? 'Simulating 30m Delay...' : 'Trigger Test Recovery'}
          </button>

          {testStatus && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 p-3 rounded-lg"
            >
              <CheckCircle2 size={16} />
              {testStatus}
            </motion.div>
          )}
        </div>

        <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-4">Recovery Automation</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Shopify Webhook Listener</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase">Active</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">WhatsApp API Gateway</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase">Active</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 opacity-50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                  <span className="text-sm font-medium">AI Optimization Engine</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Standby</span>
              </div>
            </div>
            <p className="mt-6 text-xs text-slate-400 leading-relaxed">
              WhatCart is currently monitoring your store. When a customer abandons their cart, we'll wait for the optimal window before sending a recovery message.
            </p>
          </div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -mb-16 -mr-16"></div>
        </div>
      </div>
    </PageWrapper>
  );
};

const CustomizationPage = () => {
  const [template, setTemplate] = useState<MessageTemplate>(INITIAL_TEMPLATES[0]);
  const [previewText, setPreviewText] = useState("");
  const [smartRecovery, setSmartRecovery] = useState(true);

  const generatePreview = () => {
    const placeholders: Record<string, string> = {
      "[Name]": "Francis",
      "[Product]": "Summer Dress",
      "[Link]": "https://whatcart.io/pay/xyz",
    };

    let msg = `${template.greeting}\n\n🛒 *Items:* [Product]\n💰 *Total:* $45.00\n\n🎟 *Coupon:* ${template.discount_code}\n\n${template.urgency_text}\n\n👉 *Checkout:* [Link]`;

    Object.entries(placeholders).forEach(([key, value]) => {
      msg = msg.split(key).join(value);
    });
    setPreviewText(msg);
  };

  useEffect(() => {
    generatePreview();
  }, [template]);

  return (
    <PageWrapper title="Customization" subtitle="Fine-tune your recovery messages for maximum conversion.">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          {/* Smart Recovery Toggle */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/20 p-2 rounded-xl">
                  <Zap className="text-emerald-400 w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">Smart Recovery</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">AI-Optimized Timing</p>
                </div>
              </div>
              <button 
                onClick={() => setSmartRecovery(!smartRecovery)}
                className={`w-12 h-6 rounded-full transition-all relative ${smartRecovery ? 'bg-emerald-500' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${smartRecovery ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              When enabled, WhatCart uses machine learning to determine the best time to send messages based on customer behavior.
            </p>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <MessageSquare className="text-emerald-500" size={20} />
              Message Content
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Greeting Message</label>
                <textarea 
                  value={template.greeting}
                  onChange={(e) => setTemplate({...template, greeting: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-[#25D366] outline-none text-sm min-h-[100px] transition-all"
                  placeholder="Hi [Name]! We noticed..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Discount Code</label>
                  <input 
                    type="text"
                    value={template.discount_code}
                    onChange={(e) => setTemplate({...template, discount_code: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-[#25D366] outline-none text-sm"
                    placeholder="SAVE10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Urgency</label>
                  <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-[#25D366] outline-none text-sm appearance-none">
                    <option>High Urgency</option>
                    <option>Friendly Reminder</option>
                    <option>Helpful Support</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold mb-4 uppercase tracking-widest">Preview Placeholders</p>
              <div className="flex flex-wrap gap-2">
                {['[Name]', '[Product]', '[Link]'].map(p => (
                  <span key={p} className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold border border-emerald-100">{p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="mb-6 text-center">
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Live WhatsApp Preview</p>
          </div>
          {/* iPhone Frame */}
          <div className="relative w-full max-w-[320px] aspect-[9/19.5] bg-black rounded-[3.5rem] border-[12px] border-slate-900 shadow-2xl overflow-hidden">
            {/* Dynamic Island */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-50"></div>

            {/* Screen Content */}
            <div className="h-full w-full bg-[#efeae2] flex flex-col">
              <div className="bg-[#075e54] pt-12 pb-4 px-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <MessageSquare className="text-[#25D366] w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <p className="text-white text-sm font-bold">WhatCart Official</p>
                    <CheckCircle2 className="text-blue-400 w-3 h-3" />
                  </div>
                  <p className="text-white/60 text-[10px]">online</p>
                </div>
              </div>

              <div className="flex-1 p-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
                {previewText && (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="bg-[#dcf8c6] p-3 rounded-2xl rounded-tl-none shadow-sm text-[11px] relative max-w-[85%] ml-2"
                  >
                    <div className="whitespace-pre-wrap leading-relaxed text-slate-800">{previewText}</div>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <p className="text-[8px] text-slate-400">12:45 PM</p>
                      <CheckCircle2 className="text-blue-500 w-2 h-2" />
                    </div>
                    <div className="absolute top-0 -left-2 w-3 h-3 bg-[#dcf8c6] clip-path-whatsapp-tail" />
                  </motion.div>
                )}
              </div>

              <div className="bg-[#f0f2f5] p-4 pb-8 flex items-center gap-2">
                <div className="flex-1 bg-white h-10 rounded-full px-4 flex items-center text-slate-400 text-[11px]">Type a message</div>
                <div className="w-10 h-10 bg-[#075e54] rounded-full flex items-center justify-center">
                  <Send className="text-white w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

const PackagesPage = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/packages')
      .then(res => res.json())
      .then(data => {
        setPlans(data.filter((p: any) => p.active));
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading packages...</div>;

  return (
    <PageWrapper>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Subscription Packages</h2>
        <p className="text-slate-500">Choose the perfect plan for your business needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, i) => (
          <div 
            key={i} 
            className={`bg-white rounded-3xl p-8 border transition-all duration-300 flex flex-col ${
              plan.popular 
              ? 'border-emerald-500 shadow-xl shadow-emerald-100 scale-105 z-10' 
              : 'border-slate-100 shadow-sm hover:shadow-md'
            }`}
          >
            {plan.popular === 1 && (
              <div className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full w-fit mb-4">
                Most Popular
              </div>
            )}
            <h3 className="text-xl font-bold text-slate-900 mb-1">{plan.name}</h3>
            <p className="text-sm text-slate-500 mb-6">{plan.description}</p>
            
            <div className="mb-8">
              <span className="text-4xl font-black text-slate-900">${plan.price}</span>
              <span className="text-slate-400 font-bold">/mo</span>
            </div>

            <div className="space-y-4 mb-8 flex-1">
              {plan.features.map((feature: string, j: number) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="bg-emerald-100 p-1 rounded-full">
                    <CheckCircle2 className="text-emerald-600 w-3 h-3" />
                  </div>
                  <span className="text-sm text-slate-600 font-medium">{feature}</span>
                </div>
              ))}
            </div>

            <button 
              className={`w-full py-4 rounded-2xl font-bold transition-all ${
                plan.name === 'Starter' // Mock current plan
                ? 'bg-slate-100 text-slate-400 cursor-default' 
                : plan.popular
                ? 'bg-[#25D366] text-white hover:bg-[#1eb954] shadow-lg shadow-emerald-100'
                : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {plan.name === 'Starter' ? 'Current Plan' : 'Upgrade'}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-slate-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h4 className="text-xl font-bold mb-2">Need a custom solution?</h4>
          <p className="text-slate-400 text-sm">We offer tailored packages for high-volume merchants and agencies.</p>
        </div>
        <button className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-bold hover:bg-slate-100 transition-all whitespace-nowrap">
          Talk to an Expert
        </button>
      </div>
    </PageWrapper>
  );
};

const AdminDashboardPage = () => {
  return (
    <PageWrapper>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Admin Overview</h2>
        <p className="text-slate-500">Global platform performance and revenue metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Revenue (MRR)', value: '$84,250', trend: '+18%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Users', value: '1,420', trend: '+120', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Conversion Rate', value: '14.2%', trend: '+0.8%', icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'New Signups', value: '42', trend: 'Today', icon: UserPlus, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} p-2 rounded-lg`}>
                <stat.icon className={`${stat.color} w-5 h-5`} />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.trend}</span>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold mb-6">Revenue Growth</h3>
          <div className="h-64 flex items-end gap-2">
            {[40, 55, 45, 70, 85, 65, 90, 100, 80, 110, 120, 140].map((h, i) => (
              <div key={i} className="flex-1 bg-indigo-100 rounded-t-lg relative group transition-all hover:bg-indigo-500">
                <div style={{ height: `${h}%` }} className="w-full bg-indigo-500 rounded-t-lg transition-all group-hover:bg-indigo-600" />
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  ${h * 100}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            <span>Jan</span>
            <span>Jun</span>
            <span>Dec</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold mb-6">User Distribution</h3>
          <div className="space-y-6">
            {[
              { label: 'Free Tier', count: 840, percent: 60, color: 'bg-slate-200' },
              { label: 'Starter Plan', count: 420, percent: 30, color: 'bg-emerald-400' },
              { label: 'Growth Plan', count: 140, percent: 8, color: 'bg-indigo-500' },
              { label: 'Enterprise', count: 20, percent: 2, color: 'bg-amber-500' },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-700">{item.label}</span>
                  <span className="text-slate-400">{item.count} users ({item.percent}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div style={{ width: `${item.percent}%` }} className={`h-full ${item.color}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

const AdminUsersPage = () => {
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com', plan: 'Growth', status: 'Active', revenue: '$79.00' },
    { id: 2, name: 'Sarah Smith', email: 'sarah@store.io', plan: 'Starter', status: 'Active', revenue: '$29.00' },
    { id: 3, name: 'Mike Johnson', email: 'mike@tech.com', plan: 'Free', status: 'Inactive', revenue: '$0.00' },
    { id: 4, name: 'Emma Wilson', email: 'emma@fashion.com', plan: 'Enterprise', status: 'Active', revenue: '$249.00' },
    { id: 5, name: 'Alex Brown', email: 'alex@gadgets.net', plan: 'Growth', status: 'Past Due', revenue: '$79.00' },
  ];

  return (
    <PageWrapper>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Manage Users</h2>
          <p className="text-slate-500">View and manage all platform customers</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Search users..." 
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold">Export CSV</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Plan</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Revenue</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-slate-800">{user.name}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                    user.plan === 'Enterprise' ? 'bg-amber-100 text-amber-700' :
                    user.plan === 'Growth' ? 'bg-indigo-100 text-indigo-700' :
                    user.plan === 'Starter' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {user.plan}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      user.status === 'Active' ? 'bg-emerald-500' :
                      user.status === 'Past Due' ? 'bg-red-500' : 'bg-slate-300'
                    }`} />
                    <span className="text-xs font-medium text-slate-600">{user.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-slate-700">{user.revenue}</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-indigo-600 hover:text-indigo-800 text-xs font-bold">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
};

const AdminPackagesPage = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = async () => {
    const res = await fetch('/api/packages');
    const data = await res.json();
    setPlans(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSave = async (plan: any) => {
    await fetch(`/api/packages/${plan.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan),
    });
    fetchPlans();
    alert('Plan saved!');
  };

  const handleAddPlan = async () => {
    const newPlan = {
      name: 'New Plan',
      price: 0,
      description: 'Description here',
      features: ['Feature 1'],
      popular: false
    };
    await fetch('/api/packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPlan),
    });
    fetchPlans();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    await fetch(`/api/packages/${id}`, { method: 'DELETE' });
    fetchPlans();
  };

  const updateFeature = (planId: number, featureIndex: number, newValue: string) => {
    setPlans(plans.map(p => {
      if (p.id === planId) {
        const newFeatures = [...p.features];
        newFeatures[featureIndex] = newValue;
        return { ...p, features: newFeatures };
      }
      return p;
    }));
  };

  const addFeature = (planId: number) => {
    setPlans(plans.map(p => {
      if (p.id === planId) {
        return { ...p, features: [...p.features, 'New Feature'] };
      }
      return p;
    }));
  };

  const removeFeature = (planId: number, featureIndex: number) => {
    setPlans(plans.map(p => {
      if (p.id === planId) {
        return { ...p, features: p.features.filter((_: any, i: number) => i !== featureIndex) };
      }
      return p;
    }));
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading admin packages...</div>;

  return (
    <PageWrapper>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Edit Packages</h2>
          <p className="text-slate-500">Configure subscription tiers and pricing</p>
        </div>
        <button 
          onClick={handleAddPlan}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
        >
          <Plus size={18} /> Add New Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div className="bg-slate-100 p-2 rounded-lg">
                <CreditCard className="text-slate-600 w-5 h-5" />
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleSave({ ...plan, active: plan.active ? 0 : 1 })}
                  className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${plan.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                >
                  {plan.active ? 'ACTIVE' : 'INACTIVE'}
                </button>
                <button 
                  onClick={() => handleDelete(plan.id)}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            <div className="space-y-4 flex-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Plan Name</label>
                <input 
                  type="text" 
                  value={plan.name}
                  onChange={(e) => setPlans(plans.map(p => p.id === plan.id ? {...p, name: e.target.value} : p))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Price ($)</label>
                  <input 
                    type="number" 
                    value={plan.price}
                    onChange={(e) => setPlans(plans.map(p => p.id === plan.id ? {...p, price: parseInt(e.target.value)} : p))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input 
                      type="checkbox" 
                      checked={plan.popular === 1}
                      onChange={(e) => setPlans(plans.map(p => p.id === plan.id ? {...p, popular: e.target.checked ? 1 : 0} : p))}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Popular</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Description</label>
                <textarea 
                  value={plan.description}
                  onChange={(e) => setPlans(plans.map(p => p.id === plan.id ? {...p, description: e.target.value} : p))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs min-h-[60px]"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Features</label>
                  <button 
                    onClick={() => addFeature(plan.id)}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    + Add Feature
                  </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {plan.features.map((feature: string, i: number) => (
                    <div key={i} className="flex gap-2">
                      <input 
                        type="text" 
                        value={feature}
                        onChange={(e) => updateFeature(plan.id, i, e.target.value)}
                        className="flex-1 p-1.5 bg-white border border-slate-200 rounded text-[11px]"
                      />
                      <button 
                        onClick={() => removeFeature(plan.id, i)}
                        className="text-slate-300 hover:text-red-500"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => handleSave(plan)}
              className="w-full mt-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
            >
              Save Changes
            </button>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
};

const AdminNotificationsPage = () => {
  const [target, setTarget] = useState<'all' | 'free' | 'paid'>('free');
  const [message, setMessage] = useState('');

  const sendBroadcast = () => {
    if (!message) return alert('Please enter a message');
    alert(`Broadcast sent to ${target} users!`);
    setMessage('');
  };

  return (
    <PageWrapper>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Broadcasts & Notifications</h2>
        <p className="text-slate-500">Send system updates or upgrade prompts to users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold mb-6 flex items-center gap-2">
            <Bell className="text-indigo-500" size={20} />
            New Broadcast
          </h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Target Audience</label>
              <div className="flex gap-4">
                {[
                  { id: 'all', label: 'All Users' },
                  { id: 'free', label: 'Free Tier Only' },
                  { id: 'paid', label: 'Paid Users' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTarget(t.id as any)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      target === t.id 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' 
                      : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Message Content</label>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Upgrade to Growth today and get 20% off for the first 3 months!"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm min-h-[150px]"
              />
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
              <AlertCircle className="text-amber-500 shrink-0" size={18} />
              <p className="text-[10px] text-amber-700 leading-relaxed">
                <span className="font-bold">Pro Tip:</span> Use broadcasts to notify users about month-end billing or to upsell free users when they reach their recovery limits.
              </p>
            </div>

            <button 
              onClick={sendBroadcast}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
            >
              <Send size={18} />
              Send Broadcast Now
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="font-bold text-slate-900">Recent Broadcasts</h3>
          {[
            { date: 'Oct 24, 2023', target: 'Free Users', msg: 'Flash Sale: 50% off Starter plan for 48 hours!', status: 'Sent' },
            { date: 'Oct 15, 2023', target: 'All Users', msg: 'New Feature: iPhone 17 Pro Max preview is now live!', status: 'Sent' },
            { date: 'Oct 01, 2023', target: 'Paid Users', msg: 'Monthly recovery reports are now available in your dashboard.', status: 'Sent' },
          ].map((b, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{b.date}</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">SENT</span>
              </div>
              <p className="text-[10px] font-bold text-indigo-600 mb-1">To: {b.target}</p>
              <p className="text-xs text-slate-600 line-clamp-2 italic">"{b.msg}"</p>
            </div>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
};

const HelpPage = () => {
  return (
    <PageWrapper>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Help Center</h2>
        <p className="text-slate-500">Everything you need to know about WhatCart</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { title: 'Getting Started', desc: 'Connect your store and set up your first recovery flow in 5 minutes.' },
          { title: 'WhatsApp Compliance', desc: 'Best practices for keeping your account safe and compliant.' },
          { title: 'Dynamic Placeholders', desc: 'Learn how to use [Name], [Product], and [Link] effectively.' },
          { title: 'Conversion Tracking', desc: 'How we attribute sales back to your WhatsApp messages.' },
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer group">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{item.title}</h3>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-600" />
            </div>
            <p className="text-sm text-slate-500">{item.desc}</p>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
};

const ToolboxSetupPage = () => {
  const bubbleCode = `// WhatCart - Bubble.io Toolbox Script
// 1. Add "Javascript to Bubble" element
// 2. Set suffix to "preview_ready"
// 3. Paste this code in your workflow:

const template = {
  greeting: "Hi Francis!",
  discount: "SAVE10",
  link: "https://shop.com/pay"
};

const formatted = \`\${template.greeting}\\n\\nUse code \${template.discount} at checkout: \${template.link}\`;

bubble_fn_preview_ready(formatted);`;

  return (
    <PageWrapper>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Toolbox Setup</h2>
        <p className="text-slate-500">Integrate WhatCart with Bubble.io using the Toolbox plugin</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Code className="text-blue-600 w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg">Bubble.io Integration Guide</h3>
        </div>

        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 shrink-0">1</div>
            <div>
              <p className="font-bold text-slate-800">Install Toolbox Plugin</p>
              <p className="text-sm text-slate-500">Search for "Toolbox" in the Bubble plugin store and install it (it's free).</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 shrink-0">2</div>
            <div>
              <p className="font-bold text-slate-800">Add "Javascript to Bubble" Element</p>
              <p className="text-sm text-slate-500">Place the element on your page. Set the 'Suffix' to <code className="bg-slate-100 px-1 rounded text-pink-600 font-bold">preview_ready</code>.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 shrink-0">3</div>
            <div className="flex-1">
              <p className="font-bold text-slate-800 mb-2">Run this Script</p>
              <div className="relative">
                <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto">
                  {bubbleCode}
                </pre>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(bubbleCode);
                    alert('Code copied to clipboard!');
                  }}
                  className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg transition-colors"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

// --- Main App ---

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = localStorage.getItem('user');
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* App Routes */}
          <Route path="/*" element={
            <ProtectedRoute>
              <div className="flex min-h-screen bg-slate-50">
                <Sidebar />
                <main className="flex-1 overflow-y-auto h-screen">
                  <AnimatePresence mode="wait">
                    <Routes>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/connections" element={<ConnectionsPage />} />
                      <Route path="/customization" element={<CustomizationPage />} />
                      <Route path="/packages" element={<PackagesPage />} />
                      <Route path="/help" element={<HelpPage />} />
                      
                      {/* Admin Routes */}
                      <Route path="/admin" element={<AdminDashboardPage />} />
                      <Route path="/admin/users" element={<AdminUsersPage />} />
                      <Route path="/admin/packages" element={<AdminPackagesPage />} />
                      <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
                    </Routes>
                  </AnimatePresence>
                </main>
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </AnimatePresence>
    </Router>
  );
}
