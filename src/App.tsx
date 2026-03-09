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
  useLocation,
  useNavigate
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
  Loader2
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
    name: 'The Gentle Nudge',
    greeting: "Hey [Name]! We noticed you left some items in your cart. Still interested?",
    discount_code: "WELCOME5",
    urgency_text: "We've saved your cart for you, but it won't last forever!"
  },
  {
    id: '2',
    name: 'The Discount Offer',
    greeting: "Hi [Name]! We want to help you complete your order. Here is a little something:",
    discount_code: "SAVE10NOW",
    urgency_text: "This code expires in 2 hours. Don't miss out!"
  },
  {
    id: '3',
    name: 'The FOMO Alert',
    greeting: "Quick update [Name]! The items in your cart are selling fast.",
    discount_code: "FASTSHIP",
    urgency_text: "Complete your checkout now to ensure priority shipping!"
  }
];

import { 
  LoginPage, 
  RegisterPage, 
  ForgotPasswordPage 
} from './pages/auth/AuthPages';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute, AdminRoute } from './contexts/ProtectedRoute';

// --- Components ---

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const isAdmin = location.pathname.startsWith('/admin');
  
  const userNavItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/customization', icon: Settings, label: 'Customization' },
    { path: '/templates', icon: FileText, label: 'Templates' },
    { path: '/webhook-lab', icon: Terminal, label: 'Webhook Lab' },
    { path: '/shopify', icon: ShoppingCart, label: 'Shopify Integration' },
    { path: '/packages', icon: CreditCard, label: 'Packages' },
    { path: '/help', icon: HelpCircle, label: 'Help' },
    { path: '/toolbox-setup', icon: Wrench, label: 'Toolbox Setup' },
  ];

  const adminNavItems = [
    { path: '/admin', icon: BarChart3, label: 'Admin Overview' },
    { path: '/admin/users', icon: Users, label: 'Manage Users' },
    { path: '/admin/packages', icon: CreditCard, label: 'Edit Packages' },
    { path: '/admin/notifications', icon: Bell, label: 'Broadcasts' },
  ];

  const currentNavItems = isAdmin ? adminNavItems : userNavItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated || !user) return null;

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-1.5 rounded-lg ${isAdmin ? 'bg-indigo-500' : 'bg-[#25D366]'}`}>
            {isAdmin ? <ShieldCheck className="text-white w-5 h-5" /> : <MessageSquare className="text-white w-5 h-5" />}
          </div>
          <h1 className="text-xl font-bold tracking-tight">WhatCart {isAdmin && <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded ml-1">ADMIN</span>}</h1>
        </div>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
          {isAdmin ? 'Internal Management' : 'Cart Recovery via WhatsApp'}
        </p>
        
        {/* User Info */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-xs font-bold text-slate-300">{user.name || user.email}</p>
          <p className="text-[10px] text-slate-500 mt-1">{user.plan.toUpperCase()} Plan</p>
          <div className="mt-2 flex gap-2 text-[10px]">
            <span className={`px-2 py-1 rounded ${user.is_admin ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-700 text-slate-300'}`}>
              {user.is_admin ? '👤 Admin' : '👥 User'}
            </span>
            <span className={`px-2 py-1 rounded ${user.subscription_status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
              {user.subscription_status === 'active' ? '✓ Active' : '⚠ ' + user.subscription_status}
            </span>
          </div>
        </div>
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
        {user.is_admin && (
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
        )}
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all text-sm font-medium"
        >
          <LogOut size={20} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
    className="p-8"
  >
    {children}
  </motion.div>
);

// --- Pages ---

const DashboardPage = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year'>('month');

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

  const getTrend = () => {
    switch(timeFilter) {
      case 'week': return '+8%';
      case 'year': return '+45%';
      default: return '+12%';
    }
  };

  return (
    <PageWrapper>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-slate-500">Overview of your recovery performance</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm self-start">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Recovered Revenue', value: getRevenue(), trend: getTrend(), color: 'text-emerald-600' },
          { label: 'Abandoned Checkouts', value: '482', trend: '+14%', color: 'text-slate-900' },
          { label: 'Messages Sent', value: '1,240', trend: '+22%', color: 'text-blue-600' },
          { label: 'Messages Open', value: '942', trend: '76%', color: 'text-indigo-600' },
          { label: 'Active Recoveries', value: '156', trend: '+5%', color: 'text-blue-600' },
          { label: 'Conversion Rate', value: '24.8%', trend: '+2.4%', color: 'text-emerald-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-emerald-100 transition-colors">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">{stat.label}</p>
            <div className="flex items-end justify-between">
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
              <span className="text-[10px] font-bold bg-slate-50 px-2 py-1 rounded text-slate-500 border border-slate-100">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

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
    </PageWrapper>
  );
};

const CustomizationPage = () => {
  const [template, setTemplate] = useState<MessageTemplate>(INITIAL_TEMPLATES[0]);
  const [previewText, setPreviewText] = useState("");

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
    <PageWrapper>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Customization</h2>
        <p className="text-slate-500">Fine-tune your recovery messages for maximum conversion</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <MessageSquare className="text-emerald-500" size={20} />
              Message Builder
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Greeting</label>
                <textarea 
                  value={template.greeting}
                  onChange={(e) => setTemplate({...template, greeting: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm min-h-[100px] transition-all"
                  placeholder="Hi [Name]! We noticed..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Discount Code</label>
                <div className="relative">
                  <input 
                    type="text"
                    value={template.discount_code}
                    onChange={(e) => setTemplate({...template, discount_code: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm pl-10"
                    placeholder="e.g. SAVE10"
                  />
                  <Zap className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" size={16} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Urgency Text</label>
                <textarea 
                  value={template.urgency_text}
                  onChange={(e) => setTemplate({...template, urgency_text: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm min-h-[100px] transition-all"
                  placeholder="Hurry! Your cart expires soon..."
                />
              </div>
            </div>
            <div className="pt-2">
              <p className="text-[10px] text-slate-400 font-medium mb-3">Available Placeholders: <code className="text-emerald-600">[Name]</code>, <code className="text-emerald-600">[Product]</code>, <code className="text-emerald-600">[Link]</code></p>
              <button 
                onClick={generatePreview}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
              >
                <Smartphone size={18} />
                Update Preview
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-start">
          <div className="mb-4 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">iPhone 17 Pro Max Preview</p>
          </div>
          {/* iPhone 17 Pro Max Frame */}
          <div className="relative w-full max-w-[320px] aspect-[9/19.5] bg-black rounded-[3rem] border-[10px] border-slate-900 shadow-[0_0_0_2px_rgba(255,255,255,0.1),0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Dynamic Island */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-50 flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-500/20 rounded-full absolute right-4" />
            </div>

            {/* Screen Content */}
            <div className="h-full w-full bg-[#efeae2] flex flex-col">
              {/* WhatsApp Header */}
              <div className="bg-[#075e54] pt-12 pb-3 px-4 flex items-center gap-3 shadow-md">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden border border-white/20">
                  <div className="bg-[#25D366] p-1.5 rounded-lg">
                    <MessageSquare className="text-white w-5 h-5" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <p className="text-white text-sm font-bold">WhatCart Official</p>
                    <div className="bg-blue-400 rounded-full p-0.5">
                      <CheckCircle2 className="text-white w-2 h-2" />
                    </div>
                  </div>
                  <p className="text-white/70 text-[10px]">online</p>
                </div>
                <div className="flex gap-3 text-white/80">
                  <Smartphone size={16} />
                  <Settings size={16} />
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
                <div className="flex justify-center">
                  <span className="bg-white/80 backdrop-blur-sm text-[9px] text-slate-500 px-2 py-0.5 rounded-md shadow-sm uppercase font-bold tracking-wider">Today</span>
                </div>
                
                {previewText && (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="bg-[#dcf8c6] p-3 rounded-2xl rounded-tl-none shadow-sm text-[11px] relative max-w-[85%] border-b border-black/5"
                  >
                    <div className="whitespace-pre-wrap leading-relaxed text-slate-800">
                      {previewText}
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <p className="text-[8px] text-slate-400">12:45 PM</p>
                      <CheckCircle2 className="text-blue-500 w-2 h-2" />
                    </div>
                    {/* Bubble Tail */}
                    <div className="absolute top-0 -left-2 w-3 h-3 bg-[#dcf8c6] clip-path-whatsapp-tail" />
                  </motion.div>
                )}
              </div>

              {/* Input Area */}
              <div className="bg-[#f0f2f5] p-3 pb-8 flex items-center gap-2">
                <Plus className="text-slate-500" size={20} />
                <div className="flex-1 bg-white h-9 rounded-full px-4 flex items-center text-slate-400 text-[11px]">
                  Type a message
                </div>
                <Smartphone className="text-slate-500" size={20} />
                <div className="w-9 h-9 bg-[#075e54] rounded-full flex items-center justify-center">
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

const TemplatesPage = () => {
  return (
    <PageWrapper>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Templates</h2>
          <p className="text-slate-500">High-converting message blueprints</p>
        </div>
        <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
          <Plus size={18} /> Create New
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {INITIAL_TEMPLATES.map((t) => (
          <div key={t.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-emerald-200 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-slate-800">{t.name}</h3>
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold">ACTIVE</span>
            </div>
            <p className="text-xs text-slate-500 line-clamp-3 mb-6 italic">"{t.greeting}"</p>
            <div className="flex gap-2">
              <button className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors">
                Edit
              </button>
              <button className="flex-1 py-2 bg-[#25D366] text-white rounded-lg text-xs font-bold hover:bg-[#1eb954] transition-colors">
                Use This
              </button>
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
};

const WebhookLabPage = () => {
  const [logs, setLogs] = useState<CartData[]>([]);

  const simulateWebhook = () => {
    const newLog: CartData = {
      customer_phone: `+1 555 ${Math.floor(1000 + Math.random() * 9000)}`,
      items: ["Premium Plan", "Add-on Pack"],
      total: Math.floor(50 + Math.random() * 200),
      timestamp: new Date().toLocaleTimeString()
    };
    setLogs([newLog, ...logs].slice(0, 5));
  };

  return (
    <PageWrapper>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Webhook Lab</h2>
        <p className="text-slate-500">Test your integration endpoints</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Live Webhook Feed</h3>
              <button 
                onClick={simulateWebhook}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Plus size={14} /> Simulate Event
              </button>
            </div>
            <div className="space-y-3">
              {logs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                  No events received yet.
                </div>
              ) : (
                logs.map((log, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <ShoppingCart className="text-blue-600 w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{log.customer_phone}</p>
                        <p className="text-[10px] text-slate-500">{log.items.join(', ')} • ${log.total}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{log.timestamp}</span>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 text-white h-fit">
          <div className="flex items-center gap-2 mb-4">
            <Terminal size={18} className="text-emerald-400" />
            <h3 className="font-bold text-sm">Endpoint Config</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Webhook URL</p>
              <div className="bg-slate-800 p-2 rounded flex items-center justify-between group">
                <code className="text-[10px] text-emerald-400 truncate">https://api.whatcart.io/v1/webhook</code>
                <Copy size={12} className="text-slate-500 cursor-pointer hover:text-white" />
              </div>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Secret Key</p>
              <div className="bg-slate-800 p-2 rounded flex items-center justify-between">
                <code className="text-[10px] text-slate-400">••••••••••••••••</code>
                <Copy size={12} className="text-slate-500 cursor-pointer hover:text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

const ShopifyIntegrationPage = () => {
  return (
    <PageWrapper>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Shopify Integration</h2>
        <p className="text-slate-500">Connect your Shopify store to start recovering carts automatically</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <ShoppingCart className="text-emerald-500" size={24} />
              Setup Instructions
            </h3>
            
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold shrink-0">1</div>
                <div>
                  <p className="font-bold text-slate-900 mb-1">Create a Custom App in Shopify</p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Go to your Shopify Admin {'>'} Settings {'>'} App and sales channels {'>'} Develop apps. 
                    Click "Create an app" and name it <span className="font-bold text-slate-900">WhatCart Recovery</span>.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold shrink-0">2</div>
                <div>
                  <p className="font-bold text-slate-900 mb-1">Configure Admin API Scopes</p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Under "Configuration", select "Admin API integration". You must enable the following scopes:
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {['read_orders', 'read_checkouts', 'read_customers', 'write_checkouts'].map(scope => (
                      <span key={scope} className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-[10px] font-mono font-bold border border-slate-200">{scope}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold shrink-0">3</div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900 mb-1">Configure Webhooks</p>
                  <p className="text-sm text-slate-500 leading-relaxed mb-3">
                    In Shopify Admin {'>'} Settings {'>'} Notifications, scroll to the bottom to "Webhooks". 
                    Create a new webhook for <span className="font-bold text-slate-900">Checkout creation</span> and <span className="font-bold text-slate-900">Checkout update</span>.
                  </p>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Your Webhook URL</p>
                    <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                      <code className="text-xs text-emerald-600 font-bold truncate">https://api.whatcart.io/v1/shopify/webhook/12345</code>
                      <button className="text-slate-400 hover:text-slate-900 transition-colors">
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold mb-4">Store Credentials</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Shopify Store URL</label>
                <input 
                  type="text" 
                  placeholder="your-store.myshopify.com"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Admin API Access Token</label>
                <input 
                  type="password" 
                  placeholder="shpat_xxxxxxxxxxxxxxxx"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                />
              </div>
              <button className="w-full py-3 bg-[#25D366] text-white rounded-xl font-bold hover:bg-[#1eb954] transition-all shadow-lg shadow-emerald-100">
                Connect Store
              </button>
            </div>
          </div>

          <div className="bg-emerald-900 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="text-emerald-400" size={20} />
              <h4 className="font-bold text-sm">Why Shopify?</h4>
            </div>
            <p className="text-xs text-emerald-100 leading-relaxed">
              Connecting Shopify allows WhatCart to automatically detect abandoned checkouts, fetch customer phone numbers, and calculate recovery ROI in real-time.
            </p>
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
  const [overview, setOverview] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const headerObj = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const [overviewRes, perfRes] = await Promise.all([
        fetch('/api/admin/stats/overview', { headers: headerObj }),
        fetch('/api/admin/stats/performance', { headers: headerObj }),
      ]);

      if (!overviewRes.ok || !perfRes.ok) {
        throw new Error('Failed to fetch admin stats');
      }

      const overviewData = await overviewRes.json();
      const perfData = await perfRes.json();

      setOverview(overviewData);
      setPerformance(perfData);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError('Failed to load admin statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
        </div>
      </PageWrapper>
    );
  }

  const stats = [
    { 
      label: 'Total Revenue (MRR)', 
      value: overview?.revenue_mrr ? `$${parseInt(overview.revenue_mrr).toLocaleString()}` : '$0', 
      trend: '+18%', 
      icon: TrendingUp, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50' 
    },
    { 
      label: 'Total Users', 
      value: overview?.total_users?.toLocaleString() || '0', 
      trend: `+${overview?.new_users_today || 0}`, 
      icon: Users, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50' 
    },
    { 
      label: 'Active Users', 
      value: overview?.active_users?.toLocaleString() || '0', 
      trend: '30d', 
      icon: BarChart3, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50' 
    },
    { 
      label: 'Messages Sent', 
      value: performance?.total_messages?.toLocaleString() || '0', 
      trend: performance?.delivery_rate || '0%', 
      icon: UserPlus, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50' 
    },
  ];

  const planDistribution = overview?.users_by_plan || [];

  return (
    <PageWrapper>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Admin Overview</h2>
        <p className="text-slate-500">Global platform performance and revenue metrics</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium border border-red-100">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
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
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold">Shopify Performance</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">This Month</span>
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-slate-700">Abandoned Carts Detected</span>
                <span className="text-slate-400">{performance?.abandoned_carts || 0}</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-amber-500 rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-slate-700">Successfully Recovered</span>
                <span className="text-slate-400">{performance?.recovered_carts || 0}</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-emerald-500 rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-slate-700">Conversion Rate</span>
                <span className="text-emerald-600 font-bold">{performance?.conversion_rate || '0%'}</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-emerald-600 rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-slate-700">Connected Stores</span>
                <span className="text-slate-400">{performance?.shopify_integrations || 0}</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="h-full w-1/2 bg-blue-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold mb-6">Subscription Distribution</h3>
          <div className="space-y-6">
            {planDistribution.length > 0 ? (
              planDistribution.map((item: any, i: number) => {
                const total = planDistribution.reduce((sum: number, p: any) => sum + p.count, 0);
                const percent = total > 0 ? (item.count / total * 100).toFixed(0) : '0';
                const colorMap: any = {
                  'Starter': 'bg-emerald-400',
                  'Growth': 'bg-indigo-500',
                  'Enterprise': 'bg-amber-500',
                };
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-slate-700">{item.name || 'Free'}</span>
                      <span className="text-slate-400">{item.count} users ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div style={{ width: `${percent}%` }} className={`h-full ${colorMap[item.name] || 'bg-slate-200'}`} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-500 text-sm">No data available</p>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

const AdminUsersPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { token } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const headerObj = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(`/api/admin/users?page=${page}`, { headers: headerObj });
      
      if (!res.ok) throw new Error('Failed to fetch users');

      const data = await res.json();
      setUsers(data.users);
      setTotalPages(data.pages);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (users.length === 0) return;
    
    const headers = ['Email', 'Name', 'Plan', 'Messages Sent', 'Revenue'];
    const rows = users.map(u => [
      u.email,
      u.name || 'N/A',
      u.plan || 'Free',
      u.messages_sent || 0,
      u.price ? `$${u.price}` : '$0.00'
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(search.toLowerCase()))
  );

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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <button 
            onClick={handleExportCSV}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium border border-red-100">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin w-6 h-6 text-indigo-600" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-slate-500">
            <p>No users found</p>
          </div>
        ) : (
          <>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4">Messages</th>
                  <th className="px-6 py-4">Revenue</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-800">{user.name || user.email.split('@')[0]}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                        user.plan === 'Enterprise' ? 'bg-amber-100 text-amber-700' :
                        user.plan === 'Growth' ? 'bg-indigo-100 text-indigo-700' :
                        user.plan === 'Starter' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {user.plan || 'Free'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{user.messages_sent || 0}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">${user.price?.toFixed(2) || '0.00'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-medium text-slate-600">Active</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-indigo-600 hover:text-indigo-800 text-xs font-bold">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-600">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold disabled:opacity-50 hover:bg-slate-200 transition-colors"
                >
                  ← Previous
                </button>
                <button 
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold disabled:opacity-50 hover:bg-slate-200 transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
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
  const [target, setTarget] = useState<'all' | 'free' | 'paid'>('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'warning' | 'success'>('info');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const { token } = useAuth();

  const sendBroadcast = async () => {
    if (!title || !message) {
      alert('Please enter a title and message');
      return;
    }

    setLoading(true);
    try {
      const headerObj = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
      const res = await fetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: headerObj,
        body: JSON.stringify({ title, message, type }),
      });

      if (!res.ok) throw new Error('Failed to send broadcast');

      setSuccessMsg('✓ Broadcast sent successfully!');
      setTitle('');
      setMessage('');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Failed to send broadcast');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">System Notifications</h2>
        <p className="text-slate-500">Send announcements and updates to users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold mb-6 flex items-center gap-2">
            <Bell className="text-indigo-500" size={20} />
            Broadcast Message
          </h3>
          
          <div className="space-y-6">
            {successMsg && (
              <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium border border-emerald-100">
                <CheckCircle2 size={18} />
                {successMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Notification Type</label>
              <div className="flex gap-3">
                {[
                  { id: 'info', label: 'ℹ Info', color: 'blue' },
                  { id: 'success', label: '✓ Success', color: 'emerald' },
                  { id: 'warning', label: '⚠ Warning', color: 'amber' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setType(t.id as any)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      type === t.id 
                      ? `bg-${t.color}-600 text-white border-${t.color}-600 shadow-lg shadow-${t.color}-100` 
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Important Update"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Message</label>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share an update with your users..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm min-h-[120px]"
              />
              <p className="text-[10px] text-slate-400 mt-2">{message.length} characters</p>
            </div>

            <div className="space-y-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <p className="text-[10px] font-bold text-indigo-700 uppercase">Quick Templates</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'Feature Announcement',
                  'Maintenance Window',
                  'Upgrade Prompt',
                  'Account Alert'
                ].map((template) => (
                  <button
                    key={template}
                    onClick={() => {
                      if (!title) setTitle(template);
                      setMessage(`Check your dashboard for important updates about ${template.toLowerCase()}.`);
                    }}
                    className="text-[10px] font-bold text-indigo-600 bg-white px-3 py-1 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={sendBroadcast}
              disabled={loading || !title || !message}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              Send to All Users
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
          <h4 className="font-bold mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-slate-600" />
            Broadcast Stats
          </h4>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-slate-500 font-bold mb-2">Total Sent</p>
              <p className="text-2xl font-black text-slate-900">3</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold mb-2">Read Rate</p>
              <p className="text-2xl font-black text-indigo-600">68%</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold mb-2">Active Users</p>
              <p className="text-2xl font-black text-emerald-600">1,420</p>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold">Last sent: 3 days ago</p>
            </div>
          </div>
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

export default function App() {
  return (
    <AuthProvider>
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
                        <Route path="/customization" element={<CustomizationPage />} />
                        <Route path="/templates" element={<TemplatesPage />} />
                        <Route path="/webhook-lab" element={<WebhookLabPage />} />
                        <Route path="/shopify" element={<ShopifyIntegrationPage />} />
                        <Route path="/packages" element={<PackagesPage />} />
                        <Route path="/help" element={<HelpPage />} />
                        <Route path="/toolbox-setup" element={<ToolboxSetupPage />} />
                        
                        {/* Admin Routes */}
                        <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
                        <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
                        <Route path="/admin/packages" element={<AdminRoute><AdminPackagesPage /></AdminRoute>} />
                        <Route path="/admin/notifications" element={<AdminRoute><AdminNotificationsPage /></AdminRoute>} />
                      </Routes>
                    </AnimatePresence>
                  </main>
                </div>
              </ProtectedRoute>
            } />
          </Routes>
        </AnimatePresence>
      </Router>
    </AuthProvider>
  );
}
