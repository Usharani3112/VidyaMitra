
import React, { useState, useEffect } from 'react';
import { Clock, BookOpen, Loader2, Sparkles, Youtube, ArrowRight, CheckCircle, History, LayoutGrid } from 'lucide-react';
import { generateRoadmap } from '../geminiService';
import { db } from '../supabaseService';
import { UserProfile, LearningRoadmap } from '../types';

const RoadmapModule: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<LearningRoadmap | null>(null);
  const [history, setHistory] = useState<LearningRoadmap[]>([]);
  const [targetRole, setTargetRole] = useState(user.targetRole || "");

  useEffect(() => {
    refreshHistory();
  }, [user.id]);

  const refreshHistory = async () => {
    const data = await db.getLearningPlanHistory(user.id || 'guest');
    setHistory(data);
    if (data.length > 0 && !roadmap) setRoadmap(data[0]);
  };

  const fetchRoadmap = async () => {
    if (!targetRole.trim()) return;
    setLoading(true);
    try {
      const result = await generateRoadmap(user.skills, targetRole);
      await db.saveLearningPlan(user.id || 'guest', result);
      setRoadmap(result);
      refreshHistory();
    } catch (error) {
      alert("AI was unable to generate your roadmap.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-600" /> Generate New Career Strategy
        </h2>
        <div className="flex gap-4">
          <input 
            type="text" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}
            className="flex-1 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold"
            placeholder="e.g. Lead Fullstack Architect"
          />
          <button onClick={fetchRoadmap} disabled={loading} className="px-8 bg-indigo-600 text-white rounded-2xl font-bold flex items-center gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
            {loading ? 'Curating...' : 'Generate'}
          </button>
        </div>
      </div>

      {roadmap && (
        <div className="space-y-6">
          <div className="bg-indigo-600 p-8 rounded-3xl text-white">
            <h2 className="text-3xl font-black">{roadmap.title}</h2>
            <div className="flex gap-6 mt-4">
              <span className="flex items-center gap-2 text-sm font-bold"><Clock className="w-4 h-4" /> {roadmap.duration}</span>
              <span className="flex items-center gap-2 text-sm font-bold"><BookOpen className="w-4 h-4" /> {roadmap.modules.length} Milestones</span>
            </div>
          </div>
          <div className="space-y-4">
            {roadmap.modules.map((m, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 flex gap-6">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-black shrink-0">{idx+1}</div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 mb-2">{m.name}</h4>
                  <p className="text-sm text-slate-500 mb-4">{m.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {m.resources.map((r, i) => (
                      <a key={i} target="_blank" href={`https://youtube.com/results?search_query=${encodeURIComponent(r)}`} className="px-3 py-1.5 bg-slate-50 rounded-lg text-xs font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 flex items-center gap-2">
                        <Youtube className="w-3.5 h-3.5" /> {r}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="pt-12 border-t border-slate-200">
          <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-500" /> Career Roadmap History
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {history.map((h) => (
              <button 
                key={h.id} 
                onClick={() => setRoadmap(h)}
                className={`text-left p-6 rounded-3xl border-2 transition-all group ${roadmap?.id === h.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 bg-white hover:border-slate-300'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">{h.duration} Plan</span>
                  <CheckCircle className={`w-4 h-4 ${roadmap?.id === h.id ? 'text-indigo-500' : 'text-slate-200'}`} />
                </div>
                <h4 className="font-bold text-slate-900 group-hover:text-indigo-600">{h.title}</h4>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoadmapModule;
