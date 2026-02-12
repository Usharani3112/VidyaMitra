
import React, { useState } from 'react';
import { Trophy, ArrowRight, RefreshCw, Loader2, CheckCircle, XCircle, Info } from 'lucide-react';
import { generateQuiz } from '../geminiService';
import { db } from '../supabaseService';
import { UserProfile, QuizQuestion } from '../types';

const QuizModule: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [topic, setTopic] = useState(user.skills[0] || "General Programming");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const startQuiz = async () => {
    setLoading(true);
    setFinished(false);
    setShowResults(false);
    setUserAnswers({});
    setCurrentIndex(0);
    try {
      const result = await generateQuiz(topic, difficulty);
      setQuestions(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) score++;
    });

    setFinished(true);
    setShowResults(true);

    await db.saveQuizResult(user.id || 'guest', {
      topic,
      score,
      total: questions.length,
      difficulty,
      date: new Date().toISOString()
    });
  };

  if (showResults) {
    let score = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) score++;
    });
    const percentage = (score / questions.length) * 100;

    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-in zoom-in duration-300 pb-20">
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-lg">
          <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-12 h-12 text-amber-500" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Quiz Results</h2>
          <div className="text-5xl font-black text-indigo-600 mb-4">{score}/{questions.length}</div>
          <p className="text-slate-500 mb-8 font-medium">Performance: {percentage}% Accuracy</p>
          <button onClick={startQuiz} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 flex items-center gap-2 mx-auto">
            <RefreshCw className="w-5 h-5" /> Retake Another Quiz
          </button>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-900">Review Answers</h3>
          {questions.map((q, idx) => (
            <div key={idx} className={`bg-white p-6 rounded-3xl border-2 ${userAnswers[idx] === q.correctAnswer ? 'border-emerald-100' : 'border-red-100'}`}>
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-md font-bold text-slate-800 pr-8">{idx + 1}. {q.question}</h4>
                {userAnswers[idx] === q.correctAnswer ? <CheckCircle className="text-emerald-500 shrink-0" /> : <XCircle className="text-red-500 shrink-0" />}
              </div>
              <div className="space-y-2 mb-4">
                {q.options.map((opt, optIdx) => (
                  <div key={optIdx} className={`p-3 rounded-xl text-sm ${
                    optIdx === q.correctAnswer ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200' :
                    optIdx === userAnswers[idx] ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-slate-50 text-slate-400'
                  }`}>
                    {opt}
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl text-xs text-slate-600 flex gap-2">
                <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                <p>{q.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (questions.length > 0) {
    const q = questions[currentIndex];
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Question {currentIndex + 1} of {questions.length}</span>
          <div className="flex gap-1">
            {questions.map((_, i) => (
              <div key={i} className={`h-1.5 w-6 rounded-full transition-colors ${i === currentIndex ? 'bg-indigo-500' : userAnswers[i] !== undefined ? 'bg-indigo-200' : 'bg-slate-100'}`}></div>
            ))}
          </div>
        </div>

        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-8 leading-relaxed">{q.question}</h3>
          <div className="space-y-3">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setUserAnswers({ ...userAnswers, [currentIndex]: i })}
                className={`w-full text-left px-6 py-5 rounded-2xl border-2 transition-all font-medium flex items-center justify-between group ${
                  userAnswers[currentIndex] === i 
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                  : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(c => c - 1)}
            className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 disabled:opacity-30"
          >
            Previous
          </button>
          {currentIndex === questions.length - 1 ? (
            <button 
              onClick={handleFinish}
              disabled={Object.keys(userAnswers).length < questions.length}
              className="flex-[2] bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              Submit & View Correct Answers
            </button>
          ) : (
            <button 
              onClick={() => setCurrentIndex(c => c + 1)}
              className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700"
            >
              Next Question
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto bg-white p-10 rounded-3xl border border-slate-200 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Blind Assessment Mode</h2>
      <p className="text-sm text-slate-500 mb-8">Answers and explanations will only be revealed after you submit the entire quiz. Your score will be locked in the history.</p>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Topic</label>
          <select 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
          >
            {user.skills.map(s => <option key={s} value={s}>{s}</option>)}
            <option value="System Design">System Design</option>
            <option value="Problem Solving">Problem Solving</option>
          </select>
        </div>
        <button onClick={startQuiz} disabled={loading} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black hover:bg-indigo-700">
          {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Begin Assessment'}
        </button>
      </div>
    </div>
  );
};

export default QuizModule;
