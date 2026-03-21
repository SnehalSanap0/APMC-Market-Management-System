import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Mail, LockKeyhole, ArrowRight, Loader2 } from 'lucide-react';
import logo from '../../assets/logo.png';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize(); // Check initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        // On success, session change automatically detected by App.jsx
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        setMessage('Registration successful! Please check your email for verification.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-center">
        <div className="mb-8">
          <img src={logo} alt="Company Logo" className="w-24 h-24 object-contain mx-auto drop-shadow-md rounded-2xl mb-4" />
          <h1 className="text-xl font-bold text-slate-800 devanagari">
            श्री जय सप्तश्रृंगी व्हेजिटेबल कं.
          </h1>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-sm border border-slate-200">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-icons-round text-3xl">desktop_windows</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Desktop Recommended</h2>
          <p className="text-sm text-slate-500 mb-4">
            This dashboard contains dense data tables and precise financial tools that are engineered specifically for desktop or laptop computers.
          </p>
          <p className="text-xs font-semibold text-red-600 bg-red-50 py-2 px-3 rounded-lg border border-red-100">
            Please log in from a device with a larger screen (width ≥ 1024px) to continue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      {/* Brand Header */}
      <div className="mb-10 flex flex-row items-center justify-center gap-4 p-4 max-w-lg w-full">
        <img src={logo} alt="Company Logo" className="w-24 h-24 sm:w-32 sm:h-32 object-contain drop-shadow-md shrink-0 rounded-2xl" />
        <div className="flex flex-col text-left">
          <h1 className="text-2xl font-black leading-tight text-slate-900 tracking-tight devanagari">
            श्री जय सप्तश्रृंगी व्हेजिटेबल कं.<br />
            <span className="text-xl opacity-80">(Shri Jay Saptashrungi Vegetable Co.)</span>
          </h1>
        </div>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
        <h2 className="text-xl font-bold text-slate-800 mb-6 devanagari">
          {isLogin ? 'तुमच्या खात्यात प्रवेश करा (Sign in)' : 'नवीन खाते तयार करा (Create Account)'}
        </h2>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-100 text-green-700 text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">ईमेल (Email Address)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors outline-none"
                placeholder=""
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">पासवर्ड (Password)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <LockKeyhole size={18} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors outline-none"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-light text-white py-2.5 px-4 rounded-lg font-medium transition-all focus:ring-4 focus:ring-primary/20 disabled:opacity-70 disabled:cursor-not-allowed mt-2 shadow-md shadow-primary/10"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                {isLogin ? 'प्रवेश करा (Sign In)' : 'नोंदणी करा (Sign Up)'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500">
            {isLogin ? "खाते नाही? (Don't have an account?) " : "आधीच खाते आहे? (Already have an account?) "}
            <br />
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setMessage(null);
              }}
              className="text-primary hover:text-primary-light mt-1.5 font-semibold transition-colors cursor-pointer"
            >
              {isLogin ? ' नोंदणी करा (Sign up)' : ' प्रवेश करा (Sign in)'}
            </button>
          </p>
        </div>
      </div>
      {/* Footer Support Info */}
      <div className="mt-12 text-center text-sm text-slate-400">
        <p>&copy; {new Date().getFullYear()} श्री जय सप्तश्रृंगी व्हेजिटेबल कं. (Shri Jay Saptashrungi Vegetable Co.) All rights reserved.</p>
      </div>
    </div>
  );
}
