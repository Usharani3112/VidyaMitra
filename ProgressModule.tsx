
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { Trophy, Mic2, BrainCircuit, Calendar, ChevronRight } from 'lucide-react';
import { UserProfile, QuizResult, InterviewResult } from '../types';
import { db } from '../supabaseService';

const ProgressModule: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [quizzes, setQuizzes] = useState<QuizResult[]>([]);
  const [interviews, setInterviews] = useState<InterviewResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [qData, iData] = await Promise.all([
          db.getQuizHistory(user.id || 'guest'),
          db.getInterviewHistory(user.id || 'guest')
        ]);
        setQuizzes(qData);
        setInterviews(iData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  const avgQuiz = quizzes.length > 0 ? Math.round(quizzes.reduce((acc, q) => acc + (q.score / q.total), 0) / quizzes.length * 100) : 0;
  const avgInterview = interviews.length > 0 ? Math.round(interviews.reduce((acc, i) => acc + i.score, 0) / interviews.length) : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent animate-spin rounded-full mb-4"></div>
        <p className="text-slate-500 font-medium">Loading your achievements...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-slate-900 mb-2">Your Learning Progress</h2>
        <p className="text-slate-500">Track your growth and achievements across all activities</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500">Quiz Performance</p>
              <h4 className="text-2xl font-black text-slate-900">{avgQuiz}%</h4>
            </div>
          </div>
          <p className="text-xs text-slate-400">Average score across {quizzes.length} quizzes</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500">Quizzes Taken</p>
              <h4 className="text-2xl font-black text-slate-900">{quizzes.length}</h4>
            </div>
          </div>
          <p className="text-xs text-slate-400">Total attempts recorded</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
              <Mic2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500">Interview Score</p>
              <h4 className="text-2xl font-black text-slate-900">{avgInterview}%</h4>
            </div>
          </div>
          <p className="text-xs text-slate-400">Readiness for {user.targetRole}</p>
        </div>
      </div>

      {/* History Tables */}
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-slate-900">Quiz History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Topic</th>
                  <th className="px-6 py-4">Difficulty</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quizzes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-500">{new Date(q.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{q.topic}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        q.difficulty === 'Advanced' ? 'bg-rose-50 text-rose-600' :
                        q.difficulty === 'Intermediate' ? 'bg-amber-50 text-amber-600' :
                        'bg-emerald-50 text-emerald-600'
                      }`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-indigo-600">{Math.round(q.score/q.total*100)}%</td>
                    <td className="px-6 py-4">
                      <button className="text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors">Review</button>
                    </td>
                  </tr>
                ))}
                {quizzes.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No quizzes completed yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-2">
            <Mic2 className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-slate-900">Interview Practice History</h3>
          </div>
          <div className="p-6 space-y-4">
            {interviews.map((i) => (
              <div key={i.id} className="p-4 rounded-xl border border-slate-100 hover:border-indigo-100 transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-slate-900">{i.role}</h4>
                    <p className="text-[10px] text-slate-400">{new Date(i.date).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-rose-600">{i.score}%</p>
                    <p className="text-[10px] text-slate-400">Performance</p>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full transition-all duration-1000" style={{ width: `${i.score}%` }}></div>
                </div>
              </div>
            ))}
            {interviews.length === 0 && (
              <div className="py-12 text-center text-slate-400">Start a mock interview to see your progress here.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressModule;
