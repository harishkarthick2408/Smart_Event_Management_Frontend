import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Zap, ArrowRight, Cpu, Calendar, Users, BarChart2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { GoogleLogin } from '@react-oauth/google';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const updateField = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: '' }));
    setAuthError('');
  };

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role === 'admin' || user.role === 'organizer') navigate('/admin');
      else navigate('/');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    setLoading(true);
    try {
      const user = await googleLogin(credentialResponse.credential);
      if (user.role === 'admin' || user.role === 'organizer') navigate('/admin');
      else navigate('/');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (email, password) => {
    setForm({ email, password });
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'admin' || user.role === 'organizer') navigate('/admin');
      else navigate('/');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Decorative Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-[#0F3460] flex-col justify-between p-12 relative overflow-hidden">
        {/* Background shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-96 h-96 bg-[#E8441A]/20 rounded-full -top-20 -left-20 blur-3xl" />
          <div className="absolute w-64 h-64 bg-[#F5A623]/10 rounded-full bottom-20 right-20 blur-2xl" />
          {[...Array(6)].map((_, i) => (
            <div key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              style={{ top: `${15 + i * 14}%`, right: `${10 + (i % 3) * 8}%` }}
            />
          ))}
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8441A] flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="text-white font-bold text-xl">EventPro</span>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Manage Events<br /><span className="text-[#E8441A]">Like a Pro</span>
          </h1>
          <p className="text-gray-400 leading-relaxed mb-8">
            Create, promote, and analyse events all in one place. Trusted by 10,000+ organisers across India.
          </p>
          {/* Feature List */}
          <div className="space-y-4">
            {[
              { icon: Calendar, label: 'Create & manage unlimited events' },
              { icon: Users, label: 'Smart attendee management & check-in' },
              { icon: BarChart2, label: 'Real-time analytics & reports' },
              { icon: Cpu, label: 'AI-powered event recommendations' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-white/80">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[#E8441A]" />
                </div>
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[['500+', 'Events'], ['50K+', 'Attendees'], ['4.9★', 'Rating']].map(([num, label]) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-bold text-white">{num}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-[#E8441A] flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-[#1A1A2E]">EventPro</span>
          </div>

          <h2 className="text-3xl font-bold text-[#1A1A2E] mb-2">Welcome back</h2>
          <p className="text-gray-500 mb-8">Sign in to your account to continue</p>

          {/* Auth Error */}
          {authError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {authError}
            </div>
          )}

          

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email Address" type="email" placeholder="you@example.com"
              value={form.email} onChange={(e) => updateField('email', e.target.value)}
              error={errors.email} leftIcon={Mail} required />
            <Input label="Password" type="password" placeholder="Enter your password"
              value={form.password} onChange={(e) => updateField('password', e.target.value)}
              error={errors.password} leftIcon={Lock} required />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-[#E8441A] focus:ring-[#E8441A]" />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-[#E8441A] hover:underline font-medium">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" variant="primary" fullWidth loading={loading} rightIcon={ArrowRight}>
              Sign In
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-400">or continue with</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => setAuthError('Google sign-in failed. Please try again.')}
            text="continue_with"
            shape="rectangular"
            size="large"
            width="100%"
          />

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#E8441A] font-semibold hover:underline">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
