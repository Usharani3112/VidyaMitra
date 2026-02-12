
import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles, FileSearch, FileCheck } from 'lucide-react';
import { analyzeResume } from '../geminiService';
import { db } from '../supabaseService';
import { ResumeAnalysis, UserProfile } from '../types';

const ResumeModule: React.FC<{ user: UserProfile, setUser: (u: Partial<UserProfile>) => void }> = ({ user, setUser }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [targetRole, setTargetRole] = useState(user.targetRole || "");
  const [resumeText, setResumeText] = useState(user.resumeText || "");
  const [uploadedFile, setUploadedFile] = useState<{data: string, name: string, type: string} | null>(null);
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');

  const getHash = async (text: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf" || file.type === "text/plain") {
      try {
        const base64 = await fileToBase64(file);
        setUploadedFile({
          data: base64,
          name: file.name,
          type: file.type
        });
        if (file.type === "text/plain") {
          const reader = new FileReader();
          reader.onload = (event) => setResumeText(event.target?.result as string);
          reader.readAsText(file);
        }
      } catch (err) {
        alert("Error reading file. Please try again.");
      }
    } else {
      alert("Please upload a PDF or TXT file.");
    }
  };

  const handleAnalyze = async () => {
    if (!targetRole.trim()) {
      alert("Please specify the target job role first.");
      return;
    }
    
    const hasInput = inputMode === 'paste' ? resumeText.trim() : uploadedFile;
    if (!hasInput) {
      alert("Please provide your resume via upload or paste.");
      return;
    }

    setLoading(true);
    try {
      // Deterministic Cache Check
      const contentForHash = inputMode === 'paste' ? resumeText : uploadedFile!.data;
      const hash = await getHash(contentForHash + targetRole);
      
      const cached = await db.getResumeByHash(user.id || 'guest', hash, targetRole);
      if (cached) {
        setAnalysis(cached.analysis);
        setLoading(false);
        return;
      }

      const input = inputMode === 'paste' 
        ? { text: resumeText } 
        : { file: { data: uploadedFile!.data, mimeType: uploadedFile!.type } };

      const result = await analyzeResume(input, targetRole);
      setAnalysis(result);
      
      if (user.id) {
        await db.saveResume(user.id, inputMode === 'paste' ? resumeText : `PDF Upload: ${uploadedFile?.name}`, result, hash);
      }
      
      setUser({ targetRole, resumeText: inputMode === 'paste' ? resumeText : "", skills: result.extractedSkills });
    } catch (error) {
      console.error(error);
      alert("Analysis failed. Please check your API key or document format.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl font-black text-slate-900 mb-1">Deterministic AI Resume Intel</h3>
            <p className="text-slate-500 font-medium">Consistent scoring based on project-based skill extraction.</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setInputMode('upload')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${inputMode === 'upload' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              PDF Upload
            </button>
            <button 
              onClick={() => setInputMode('paste')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${inputMode === 'paste' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Paste Text
            </button>
          </div>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Current Application Goal</label>
            <input 
              type="text" 
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold bg-slate-50 shadow-inner"
              placeholder="e.g. AI/ML Engineer"
            />
          </div>

          {inputMode === 'paste' ? (
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Resume Content</label>
              <textarea 
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                className="w-full h-64 px-5 py-4 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium bg-slate-50 shadow-inner resize-none text-sm leading-relaxed"
                placeholder="Paste the text directly from your resume..."
              />
            </div>
          ) : (
            <div className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all bg-slate-50 group border-slate-200 hover:border-indigo-400`}>
              <input 
                type="file" 
                id="resume-upload" 
                className="hidden" 
                onChange={handleFileUpload}
                accept=".pdf,.txt"
              />
              <label htmlFor="resume-upload" className="cursor-pointer">
                {uploadedFile ? (
                  <div className="flex flex-col items-center animate-in zoom-in">
                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                      <FileCheck className="w-8 h-8 text-emerald-600" />
                    </div>
                    <p className="text-slate-900 font-bold mb-1">{uploadedFile.name}</p>
                    <p className="text-slate-500 text-xs">Ready for Deterministic Scan</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4 group-hover:text-indigo-500 transition-colors" />
                    <p className="text-slate-900 font-bold mb-1">Upload Resume</p>
                    <p className="text-slate-500 text-xs">Consistent scoring for identical documents.</p>
                  </>
                )}
              </label>
            </div>
          )}

          <button 
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSearch className="w-5 h-5" />}
            {loading ? 'Performing Seed-Locked Analysis...' : 'Deep Scan Resume'}
          </button>
        </div>
      </div>

      {analysis && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="md:col-span-1 bg-white p-10 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="relative w-40 h-40 flex items-center justify-center mb-6">
              <svg className="w-full h-full -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="#f8fafc" strokeWidth="16" fill="none" />
                <circle 
                  cx="80" cy="80" r="70" stroke={analysis.atsScore > 75 ? "#10b981" : "#6366f1"} strokeWidth="16" fill="none" 
                  strokeDasharray={`${(analysis.atsScore / 100) * 440} 440`} 
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-black text-slate-900">{analysis.atsScore}%</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">ATS Match</span>
              </div>
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-1">Scan Complete</h4>
            <p className="text-sm text-slate-500 font-medium">Verified for: {targetRole}</p>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h4 className="flex items-center gap-2 text-md font-black text-slate-900 mb-6 uppercase tracking-widest text-xs">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Multimodal Insights
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-700 uppercase mb-4 tracking-widest">Identified Strengths</p>
                  <ul className="space-y-3">
                    {analysis.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-emerald-900 flex items-start gap-2 font-medium">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100">
                  <p className="text-[10px] font-black text-amber-700 uppercase mb-4 tracking-widest">Growth Opportunities</p>
                  <ul className="space-y-3">
                    {analysis.missingSkills.length > 0 ? analysis.missingSkills.map((m, i) => (
                      <li key={i} className="text-sm text-amber-900 flex items-start gap-2 font-medium">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" /> {m}
                      </li>
                    )) : (
                      <li className="text-sm text-emerald-800 font-bold">Excellent skill coverage detected.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeModule;
