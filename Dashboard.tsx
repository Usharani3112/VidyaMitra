
import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { TrendingUp, Target, Award, Clock, ArrowUpRight, Database, Sparkles, BookOpen, CheckCircle2, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { UserProfile, AppSection } from '../types';
import { db } from '../supabaseService';
import { testAiConnectivity } from '../geminiService';

interface DashboardProps {
  user: UserProfile;
  onNavigate: (section: AppSection) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate }) => {
  const [stats, setStats] = useState({
    quizzes: 0,
    quizzesPassed: 0,
    interviews: 0,
    interviewsPassed: 0,
    ats: 0,
    avgQuiz: 0,
    avgInterview: 0
  });
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');

  useEffect(() => {
    const fetchStats = async () => {
      const [quizzes, interviews, resume] = await Promise.all([
        db.getQuizHistory(user.id || 'guest'),
        db.getInterviewHistory(user.id || 'guest'),
        db.getLatestResume(user.id || 'guest')
      ]);
      
      const qPassed = quizzes.filter(q => (q.score / q.total) >= 0.5).length;
      const iPassed = interviews.filter(i => i.passed).length;
      const qAvg = quizzes.length ? Math.round(quizzes.reduce((acc, q) => acc + (q.score/q.total), 0) / quizzes.length * 100) : 0;
      const iAvg = interviews.length ? Math.round(interviews.reduce((acc, i) => acc + i.score, 0) / interviews.length) : 0;

      setStats({ 
        quizzes: quizzes.length, 
        quizzesPassed: qPassed,
        interviews: interviews.length,
        interviewsPassed: iPassed,
        ats: resume?.analysis?.atsScore || 0,
        avgQuiz: qAvg,
        avgInterview: iAvg
      });
    };
    fetchStats();
  }, [user.id]);

  const runConnectivityTest = async () => {
    setTestStatus('testing');
    const result = await testAiConnectivity();
    setTestStatus(result ? 'success' : 'failed');
    setTimeout(() => setTestStatus('idle'), 3000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="bg-indigo-600 rounded-3xl p-10 text-white flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black backdrop-blur-md tracking-widest uppercase">Real-Time Status</span>
            <button 
              onClick={runConnectivityTest}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black backdrop-blur-md tracking-widest uppercase transition-all ${
                testStatus === 'success' ? 'bg-emerald-500/30 text-emerald-100' : 
                testStatus === 'failed' ? 'bg-rose-500/30 text-rose-100' : 
                'bg-white/10 hover:bg-white/20'
              }`}
            >
              {testStatus === 'testing' ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : 
               testStatus === 'success' ? <Wifi className="w-2.5 h-2.5" /> : 
               testStatus === 'failed' ? <WifiOff className="w-2.5 h-2.5" /> : 
               <Wifi className="w-2.5 h-2.5 opacity-50" />}
              {testStatus === 'testing' ? 'Testing AI...' : 
               testStatus === 'success' ? 'API Working' : 
               testStatus === 'failed' ? 'API Blocked' : 
               'Test AI Link'}
            </button>
          </div>
          <h2 className="text-4xl font-black mb-3">Hello, {user.name.split(' ')[0]}!</h2>
          <p className="text-indigo-100 text-lg max-w-xl leading-relaxed">
            Your current Readiness Score for <strong>{user.targetRole || 'General Engineering'}</strong> is {Math.max(stats.ats, stats.avgInterview)}%.
          </p>
          <div className="flex gap-4 mt-8">
            <button onClick={() => onNavigate(AppSection.INTERVIEW)} className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold">Start Next Mock Round</button>
            <button onClick={() => onNavigate(AppSection.PROGRESS)} className="bg-indigo-500/30 text-white border border-white/20 px-6 py-3 rounded-xl font-bold backdrop-blur-sm">Full Audit</button>
          </div>
        </div>
        <div className="relative z-10 hidden lg:block text-center bg-white/10 p-8 rounded-3xl backdrop-blur-lg border border-white/10">
           <div className="text-5xl font-black mb-2">{stats.quizzesPassed + stats.interviewsPassed}</div>
           <div className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Total Rounds Passed</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Avg Quiz Score', value: `${stats.avgQuiz}%`, passed: `${stats.quizzesPassed} Passed`, icon: Award, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Avg Interview', value: `${stats.avgInterview}%`, passed: `${stats.interviewsPassed} Passed`, icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Total Quizzes', value: stats.quizzes, passed: 'Total Taken', icon: Target, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'ATS Score', value: stats.ats > 0 ? `${stats.ats}%` : '--', passed: 'Current Resume', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}><stat.icon className={`w-6 h-6 ${stat.color}`} /></div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest border-t pt-3">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {stat.passed}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-8">Skill Proficiency</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={user.skills.slice(0, 5).map(s => ({ name: s, val: 50 + Math.random() * 40 }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none'}} />
                <Bar dataKey="val" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-8">Round Progress</h3>
          <div className="flex-1 space-y-4">
            {stats.interviews === 0 ? (
               <div className="flex flex-col items-center justify-center flex-1 text-slate-400 text-sm italic">
                  <Sparkles className="w-10 h-10 mb-4 opacity-20" />
                  No interview rounds completed yet.
               </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <span className="text-sm font-bold text-slate-700">Interview Accuracy</span>
                  <span className="text-lg font-black text-indigo-600">{stats.avgInterview}%</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <span className="text-sm font-bold text-slate-700">Quiz Accuracy</span>
                  <span className="text-lg font-black text-blue-600">{stats.avgQuiz}%</span>
                </div>
              </div>
            )}
          </div>
          <button onClick={() => onNavigate(AppSection.ROADMAP)} className="w-full py-4 mt-6 border-2 border-indigo-100 rounded-2xl text-indigo-600 font-bold hover:bg-indigo-50 transition-colors">Update Training Plan</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
