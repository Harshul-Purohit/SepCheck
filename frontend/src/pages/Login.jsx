import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Activity, Mail, Lock, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Login() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'patient';

  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Use URLSearchParams for OAuth2PasswordRequestForm
        const params = new URLSearchParams();
        params.append('username', email);
        params.append('password', password);

        const res = await api.post('/auth/login', params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        login(res.data);
        // Clear any previous role-specific flags if any
        if (res.data.role === 'patient') {
          navigate('/patient/dashboard');
        } else {
          navigate('/doctor/dashboard');
        }
      } else {
        const res = await api.post(
          '/auth/register',
          { email, password, role },
          { headers: { 'Content-Type': 'application/json' } }
        );

        login(res.data);
        // After registration, redirect immediately to their dashboard
        // Dashboard will detect if a profile is needed
        if (role === 'patient') {
          navigate('/patient/dashboard');
        } else {
          navigate('/doctor/dashboard');
        }
      }
    } catch (err) {
      console.log('Login/Signup Error:', err.response?.data);
      let errorMsg = 'An error occurred. Please try again.';

      if (err.response?.data) {
        const detail = err.response.data.detail;
        if (typeof detail === 'string') {
          errorMsg = detail;
        } else if (Array.isArray(detail)) {
          // Flatten FastAPI validation arrays into string
          errorMsg = detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join(' | ');
        } else if (err.response.data.message) {
          errorMsg = err.response.data.message;
        } else {
          errorMsg = JSON.stringify(err.response.data);
        }
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative overflow-hidden bg-slate-50">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-200/40 rounded-full blur-[100px] -z-10 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-200/30 rounded-full blur-[100px] -z-10 translate-y-1/2 -translate-x-1/2" />

      <div className="w-full max-w-md">
        <div className="glass-panel p-8 md:p-10 animate-float backdrop-blur-2xl bg-white/60">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-6 rotate-3">
              <Activity className="w-8 h-8 text-white -rotate-3" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-slate-500 mt-2">
              {isLogin ? 'Enter your details to access your dashboard.' : 'Start your secure medical journey today.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center justify-center text-center">
                {error}
              </div>
            )}

            {!isLogin && (
              <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                <button
                  type="button"
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${role === 'patient' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500'}`}
                  onClick={() => setRole('patient')}
                >
                  Patient
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${role === 'doctor' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500'}`}
                  onClick={() => setRole('doctor')}
                >
                  Doctor
                </button>
              </div>
            )}

            <div className="relative flex items-center">
              <Mail className="absolute left-4 text-slate-400 w-5 h-5 pointer-events-none" />
              <input
                type="email"
                required
                className="input-field pl-12 pr-4 h-12 text-center"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative flex items-center">
              <Lock className="absolute left-4 text-slate-400 w-5 h-5 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="input-field pl-12 pr-12 h-12 text-center"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-4 text-slate-400 hover:text-slate-600 transition"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="primary-btn w-full mt-2 relative py-3.5"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                isLogin ? 'Sign In' : 'Sign Up'
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-brand-600 font-semibold hover:text-brand-700 transition"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
