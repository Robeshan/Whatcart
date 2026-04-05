import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Mail, 
  Lock, 
  Phone, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ChevronLeft
} from 'lucide-react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AuthLayout = ({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle: string }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div className="max-w-md w-full">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center bg-[#25D366] p-3 rounded-2xl shadow-lg shadow-emerald-200 mb-4">
          <MessageSquare className="text-white w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h1>
        <p className="text-slate-500 mt-2">{subtitle}</p>
      </div>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100"
      >
        {children}
      </motion.div>
    </div>
  </div>
);

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Log in to manage your recoveries">
      <form onSubmit={handleLogin} className="space-y-5">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium border border-red-100">
            <AlertCircle size={18} />
            {error}
          </div>
        )}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#25D366] transition-colors" size={20} />
            <input 
              type="email" 
              autoComplete="email"
              required
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-[#25D366] outline-none transition-all text-slate-800 disabled:opacity-50"
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center ml-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
            <Link to="/forgot-password" name="forgot-password-link" className="text-xs font-bold text-[#25D366] hover:text-emerald-700">Forgot?</Link>
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#25D366] transition-colors" size={20} />
            <input 
              type="password" 
              autoComplete="current-password"
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-[#25D366] outline-none transition-all text-slate-800 disabled:opacity-50"
            />
          </div>
        </div>
        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full py-4 bg-[#25D366] text-white rounded-2xl font-bold hover:bg-[#1eb954] transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Log In <ArrowRight size={20} /></>}
        </button>
        <p className="text-center text-sm text-slate-500">
          Don't have an account? <Link to="/register" name="register-link" className="text-[#25D366] font-bold hover:underline">Sign up free</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export const RegisterPage = () => {
  const [step, setStep] = useState(1); // 1: Info, 2: Verification
  const [formData, setFormData] = useState({ email: '', password: '', phone: '' });
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const { register, verify, isLoading } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await register(formData.email, formData.password, formData.phone);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await verify(formData.email, code);
      setSuccessMessage('✓ Email verified! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    }
  };

  return (
    <AuthLayout 
      title={step === 1 ? "Create Account" : "Verify Email"} 
      subtitle={step === 1 ? "Start recovering carts in minutes" : `We sent a 6-digit code to ${formData.email}`}
    >
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.form 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleRegister} 
            className="space-y-5"
          >
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium border border-red-100">
                <AlertCircle size={18} />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#25D366] transition-colors" size={20} />
                <input 
                  type="email" 
                  autoComplete="email"
                  required
                  disabled={isLoading}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="name@company.com"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-[#25D366] outline-none transition-all text-slate-800 disabled:opacity-50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Phone Number</label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#25D366] transition-colors" size={20} />
                <input 
                  type="tel" 
                  required
                  disabled={isLoading}
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-[#25D366] outline-none transition-all text-slate-800 disabled:opacity-50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#25D366] transition-colors" size={20} />
                <input 
                  type="password" 
                  autoComplete="new-password"
                  required
                  disabled={isLoading}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Create a strong password"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-[#25D366] outline-none transition-all text-slate-800 disabled:opacity-50"
                />
              </div>
              <p className="text-[10px] text-slate-400">Minimum 8 characters with numbers and letters</p>
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-4 bg-[#25D366] text-white rounded-2xl font-bold hover:bg-[#1eb954] transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Create Account <ArrowRight size={20} /></>}
            </button>
            <p className="text-center text-sm text-slate-500">
              Already have an account? <Link to="/login" name="login-link" className="text-[#25D366] font-bold hover:underline">Log in</Link>
            </p>
          </motion.form>
        ) : (
          <motion.form 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleVerify} 
            className="space-y-6"
          >
            {successMessage && (
              <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium border border-emerald-100">
                <CheckCircle2 size={18} />
                {successMessage}
              </div>
            )}
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium border border-red-100">
                <AlertCircle size={18} />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Verification Code</label>
              <input 
                type="text" 
                maxLength={6}
                required
                disabled={isLoading}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center text-3xl font-black tracking-[0.5em] py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-[#25D366] outline-none transition-all text-slate-800 disabled:opacity-50"
              />
              <p className="text-[10px] text-slate-400 text-center">Enter the 6-digit code sent to your email</p>
            </div>
            <button 
              type="submit" 
              disabled={isLoading || code.length !== 6}
              className="w-full py-4 bg-[#25D366] text-white rounded-2xl font-bold hover:bg-[#1eb954] transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Verify Account <CheckCircle2 size={20} /></>}
            </button>
            <button 
              type="button"
              disabled={isLoading}
              onClick={() => setStep(1)}
              className="w-full flex items-center justify-center gap-2 text-slate-400 font-bold hover:text-slate-600 transition-colors disabled:opacity-50"
            >
              <ChevronLeft size={18} /> Back to registration
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
};

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { forgotPassword } = useAuth();

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      await forgotPassword(email);
      setMessage('✓ Password reset link sent to your email. Check your inbox!');
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Failed to process password reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset Password" subtitle="We'll send you a link to get back in">
      <form onSubmit={handleForgot} className="space-y-5">
        {message && (
          <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium border border-emerald-100">
            <CheckCircle2 size={18} />
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium border border-red-100">
            <AlertCircle size={18} />
            {error}
          </div>
        )}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#25D366] transition-colors" size={20} />
            <input 
              type="email" 
              required
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-[#25D366] outline-none transition-all text-slate-800 disabled:opacity-50"
            />
          </div>
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-4 bg-[#25D366] text-white rounded-2xl font-bold hover:bg-[#1eb954] transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <>Send Reset Link <ArrowRight size={20} /></>}
        </button>
        <div className="text-center">
          <Link to="/login" name="back-to-login-link" className="text-slate-400 font-bold hover:text-slate-600 transition-colors flex items-center justify-center gap-2">
            <ChevronLeft size={18} /> Back to login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};
