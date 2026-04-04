import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, User, Mail, Lock, ArrowRight, ShieldPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function StoreSignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup, error } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    setIsSubmitting(true);
    const result = await signup(formData.name, formData.email, formData.password);
    setIsSubmitting(false);
    if (result.success) {
      navigate('/shop/login');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg space-y-8 rounded-2xl border border-white/10 bg-[#0A0A0A]/80 p-8 shadow-2xl backdrop-blur-xl"
      >
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600/20 text-purple-500 shadow-[0_0_20px_rgba(147,51,234,0.2)]">
            <ShieldPlus size={28} />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">Join NovaBuy</h2>
          <p className="mt-2 text-sm text-gray-400">
            Create an account to track orders and save your wishlist
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <User size={18} />
              </div>
              <input
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-3 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all duration-200"
                placeholder="Full name"
              />
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <Mail size={18} />
              </div>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-3 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all duration-200"
                placeholder="Email address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <Lock size={18} />
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-3 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all duration-200"
                  placeholder="Password"
                />
              </div>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <Lock size={18} />
                </div>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-3 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all duration-200"
                  placeholder="Confirm password"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="terms"
              type="checkbox"
              required
              className="h-4 w-4 rounded border-white/10 bg-white/5 text-purple-600 focus:ring-purple-600/50"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-400">
              I agree to the <a href="#" className="text-purple-500 hover:text-purple-400 font-medium">Terms of Service</a> and <a href="#" className="text-purple-500 hover:text-purple-400 font-medium">Privacy Policy</a>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative flex w-full justify-center rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white transition-all hover:bg-purple-500 hover:shadow-[0_0_20px_rgba(147,51,234,0.4)] disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <span className="flex items-center gap-2">
                Create Account <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </span>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 pt-4">
          Already have an account?{' '}
          <Link to="/shop/login" className="font-semibold text-purple-500 hover:text-purple-400">
            Sign in here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
