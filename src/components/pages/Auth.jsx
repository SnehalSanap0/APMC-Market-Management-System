import { useState } from 'react';
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      {/* Brand Header */}
      <div className="mb-10 flex flex-row items-center justify-center gap-4 p-4 max-w-lg w-full">
        <img src={logo} alt="Company Logo" className="w-24 h-24 sm:w-32 sm:h-32 object-contain drop-shadow-md shrink-0 rounded-2xl" />
        <div className="flex flex-col text-left">
          <h1 className="text-3xl font-black leading-tight text-slate-900 tracking-tight">
            Shri Jay Saptashrungi Vegetable Co.
          </h1>
        </div>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
        <h2 className="text-xl font-bold text-slate-800 mb-6">
          {isLogin ? 'Sign in to your account' : 'Create a new account'}
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
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
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
                placeholder="admin@apmc.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
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
                {isLogin ? 'Sign In' : 'Sign Up'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setMessage(null);
              }}
              className="text-primary hover:text-primary-light font-semibold transition-colors cursor-pointer"
            >
              {isLogin ? ' Sign up' : ' Sign in'}
            </button>
          </p>
        </div>
      </div>
      {/* Footer Support Info */}
      <div className="mt-12 text-center text-sm text-slate-400">
        <p>&copy; {new Date().getFullYear()} Shri Jay Saptashrungi Vegetable Co. All rights reserved.</p>
      </div>
    </div>
  );
}
