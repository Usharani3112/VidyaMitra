
import React, { useState } from 'react';
import { BrainCircuit, Mail, Lock, User, ArrowRight, Github, Chrome, Loader2, AlertCircle } from 'lucide-react';
import { UserProfile } from '../types';
import { db } from '../supabaseService';

interface AuthProps {
  onLogin: (user: Partial<UserProfile>) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'password123', // Dummy for now as we use profile table for demo
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // ACTUAL LOGIN LOOKUP
        const profile = await db.getProfileByEmail(formData.email);
        if (profile) {
          onLogin(profile);
        } else {
          setError("Account not found. Please sign up first.");
        }
      } else {
        // SIGN UP
        const newUser = {
          name: formData.name,
          email: formData.email,
          targetRole: "", // No longer requested during signup
          skills: [],
          isLoggedIn: true
        };
        onLogin(newUser);
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-inter">
      <div className="max-w-5xl w-full bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100 overflow-hidden flex flex-col md:flex-row min-h-[650px]">
        {/* Left Side: Branding */}
        <div className="md:w-1/2 bg-indigo-600 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-12">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                <BrainCircuit className="text-white w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">VidyaMitra</h1>
            </div>
            <h2 className="text-4xl font-black leading-tight mb-6">
              Your Persistent <br />
              <span className="text-indigo-200">Career Memory</span>
            </h2>
            <p className="text-indigo-100 text-lg max-w-sm leading-relaxed font-medium">
              We remember your roadmap, your scores, and your resume so you can pick up exactly where you left off.
            </p>
          </div>

          <div className="relative z-10 mt-12 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-full bg-indigo-400 flex items-center justify-center font-bold text-xs">AI</div>
               <p className="text-sm font-bold">Cloud-Enabled Profile</p>
            </div>
            <p className="text-xs text-indigo-50 leading-relaxed">
              Login once, access everywhere. Your mock interview feedback and quiz history are saved automatically.
            </p>
          </div>

          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-indigo-500 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-indigo-400 rounded-full opacity-20 blur-3xl"></div>
        </div>

        {/* Right Side: Form */}
        <div className="md:w-1/2 p-12 flex flex-col justify-center bg-white">
          <div className="max-w-sm mx-auto w-full">
            <div className="mb-10 text-center md:text-left">
              <h3 className="text-3xl font-black text-slate-900 mb-2">
                {isLogin ? 'Welcome Back' : 'Create Profile'}
              </h3>
              <p className="text-slate-500 font-medium">
                {isLogin ? 'Access your saved career progress.' : 'Initialize your cloud-synced career agent.'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center gap-3 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300 font-medium"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    type="password"
                    required
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-70 active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Sign In' : 'Create Profile')}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            </form>

            <div className="mt-8">
              <div className="relative flex items-center justify-center mb-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <span className="relative bg-white px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Enterprise Access</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-2 py-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors font-bold text-slate-600 text-sm">
                  <Chrome className="w-4 h-4 text-rose-500" /> Google
                </button>
                <button className="flex items-center justify-center gap-2 py-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors font-bold text-slate-600 text-sm">
                  <Github className="w-4 h-4 text-slate-900" /> Github
                </button>
              </div>
            </div>

            <p className="mt-10 text-center text-sm text-slate-500 font-medium">
              {isLogin ? "Need a cloud profile?" : "Already have an account?"}{' '}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="font-black text-indigo-600 hover:text-indigo-700 underline underline-offset-4 decoration-2"
              >
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
