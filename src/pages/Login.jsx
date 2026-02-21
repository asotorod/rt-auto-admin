import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Loader2, AlertCircle } from 'lucide-react';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-darker flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-gold mb-4">
            <span className="text-brand-dark font-bold text-xl">RT</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-white">Admin Login</h1>
          <p className="text-brand-muted text-sm mt-1">RT Auto Center Management</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-danger/10 border border-danger/20 text-danger text-sm px-4 py-3 rounded-lg">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-brand-muted uppercase tracking-wider mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-brand-card border border-brand-border rounded-lg px-4 py-3 text-white text-sm placeholder:text-brand-muted/40 focus:border-brand-gold/50 transition-colors"
              placeholder="you@rtautocenter.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-muted uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-brand-card border border-brand-border rounded-lg px-4 py-3 text-white text-sm placeholder:text-brand-muted/40 focus:border-brand-gold/50 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-gold text-brand-dark font-bold text-sm py-3 rounded-lg hover:bg-brand-gold-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-brand-muted/40 text-xs mt-8">
          RT Auto Platform &copy; 2026
        </p>
      </div>
    </div>
  );
}
