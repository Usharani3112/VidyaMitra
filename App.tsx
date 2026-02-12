
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Map, 
  Trophy, 
  Mic2, 
  Briefcase, 
  Bell, 
  Settings,
  LogOut,
  ChevronRight,
  TrendingUp,
  Target,
  BrainCircuit,
  LineChart,
  Loader2,
  Key,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { AppSection, UserProfile } from './types';
import Dashboard from './components/Dashboard';
import ResumeModule from './components/ResumeModule';
import RoadmapModule from './components/RoadmapModule';
import QuizModule from './components/QuizModule';
import InterviewModule from './components/InterviewModule';
import JobModule from './components/JobModule';
import ProgressModule from './components/ProgressModule';
import Auth from './components/Auth';
import { db } from './supabaseService';

declare global {
  // Define AIStudio interface to match environmental declarations
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    // Fixed: Removed 'readonly' modifier to match existing declarations and avoid modifier mismatch error
    aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.DASHBOARD);
  const [hasPersonalKey, setHasPersonalKey] = useState(false);
  const [user, setUser] = useState<UserProfile>({
    id: "",
    name: "",
    email: "",
    targetRole: "",
    skills: [],
    resumeText: "",
    isLoggedIn: false 
  });

  const navigation = [
    { id: AppSection.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppSection.RESUME, label: 'Resume AI', icon: FileText },
    { id: AppSection.ROADMAP, label: 'Training Plan', icon: Map },
    { id: AppSection.QUIZ, label: 'Skill Quiz', icon: BrainCircuit },
    { id: AppSection.INTERVIEW, label: 'Mock Interview', icon: Mic2 },
    { id: AppSection.PROGRESS, label: 'Progress', icon: LineChart },
    { id: AppSection.JOBS, label: 'Job Board', icon: Briefcase },
  ];

  useEffect(() => {
    checkApiKey();
    const savedUserId = localStorage.getItem('vm_userId');
    if (savedUserId) {
      db.getProfile(savedUserId).then(profile => {
        if (profile) {
          db.getLatestResume(savedUserId).then(resume => {
            setUser({ 
              ...profile, 
              isLoggedIn: true, 
              resumeText: resume?.content || "" 
            });
            setIsInitializing(false);
          });
        } else {
          setIsInitializing(false);
        }
      }).catch(() => setIsInitializing(false));
    } else {
      setIsInitializing(false);
    }
  }, []);

  const checkApiKey = async () => {
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setHasPersonalKey(hasKey);
    }
  };

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Assume success as per instructions to avoid race condition
      setHasPersonalKey(true);
    }
  };

  const handleLogin = async (loginData: Partial<UserProfile>) => {
    const freshUser: UserProfile = {
      id: loginData.id || "",
      name: loginData.name || "",
      email: loginData.email || "",
      targetRole: loginData.targetRole || "",
      skills: loginData.skills || [],
      resumeText: loginData.resumeText || "",
      isLoggedIn: true
    };
    
    setUser(freshUser);
    const saved = await db.saveProfile(freshUser);
    localStorage.setItem('vm_userId', saved.id);
    
    const resume = await db.getLatestResume(saved.id);
    if (resume) {
      setUser(prev => ({ ...prev, id: saved.id, resumeText: resume.content }));
    }
    
    setActiveSection(AppSection.DASHBOARD);
  };

  const handleLogout = () => {
    localStorage.removeItem('vm_userId');
    setUser({
      id: "",
      name: "",
      email: "",
      targetRole: "",
      skills: [],
      resumeText: "",
      isLoggedIn: false
    });
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    if (user.id) {
      await db.saveProfile(updatedUser);
    }
  };

  const navigateTo = (section: AppSection) => {
    setActiveSection(section);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <BrainCircuit className="w-12 h-12 text-indigo-600 animate-pulse mb-4" />
        <p className="text-slate-500 font-bold">Resuming your session...</p>
      </div>
    );
  }

  if (!user.isLoggedIn) {
    return <Auth onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeSection) {
      case AppSection.DASHBOARD: return <Dashboard user={user} onNavigate={navigateTo} />;
      case AppSection.RESUME: return <ResumeModule user={user} setUser={updateProfile} />;
      case AppSection.ROADMAP: return <RoadmapModule user={user} />;
      case AppSection.QUIZ: return <QuizModule user={user} />;
      case AppSection.INTERVIEW: return <InterviewModule user={user} />;
      case AppSection.PROGRESS: return <ProgressModule user={user} />;
      case AppSection.JOBS: return <JobModule user={user} onGenerateRoadmap={(role) => {
        updateProfile({ targetRole: role });
        setActiveSection(AppSection.ROADMAP);
      }} />;
      default: return <Dashboard user={user} onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6 flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 mb-8 shrink-0">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-100">
              <BrainCircuit className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">VidyaMitra</h1>
          </div>
          
          <nav className="space-y-1 overflow-y-auto flex-1 pr-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                    activeSection === item.id
                      ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${activeSection === item.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* API Key Management Section */}
          <div className="mt-4 pt-4 border-t border-slate-100 shrink-0">
            <div className={`p-4 rounded-xl border ${hasPersonalKey ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'} transition-all`}>
              <div className="flex items-center gap-2 mb-2">
                {hasPersonalKey ? (
                  <BrainCircuit className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                )}
                <span className={`text-[10px] font-black uppercase tracking-widest ${hasPersonalKey ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {hasPersonalKey ? 'Personal Key Active' : 'Shared Key (Limited)'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mb-3 leading-tight font-medium">
                {hasPersonalKey 
                  ? 'You are using your own API key with private quotas.' 
                  : 'Daily quota exhausted? Connect your own paid API key to continue.'}
              </p>
              <button 
                onClick={handleSelectKey}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
                  hasPersonalKey 
                  ? 'bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                <Key className="w-3 h-3" />
                {hasPersonalKey ? 'Switch API Key' : 'Use Personal Key'}
              </button>
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center gap-1 text-[9px] text-slate-400 font-bold hover:text-indigo-600 transition-colors"
              >
                Billing Documentation <ExternalLink className="w-2 h-2" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-auto p-6 border-t border-slate-100 shrink-0">
          <div className="flex items-center gap-3 mb-6 bg-slate-50 p-3 rounded-2xl">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-100">
              {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{user.name || 'User'}</p>
              <p className="text-[10px] text-slate-500 truncate font-medium uppercase tracking-tighter">Verified Professional</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-500 hover:text-red-600 transition-colors font-bold"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              {navigation.find(n => n.id === activeSection)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-slate-400 hover:text-indigo-600 transition-colors relative p-1.5 rounded-lg hover:bg-slate-50">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="text-slate-400 hover:text-indigo-600 transition-colors p-1.5 rounded-lg hover:bg-slate-50">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
