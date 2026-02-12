
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Play, Send, Loader2, BrainCircuit, CheckCircle, XCircle, ChevronRight, Lock } from 'lucide-react';
import { getInterviewFeedback, textToSpeech } from '../geminiService';
import { db } from '../supabaseService';
import { UserProfile, InterviewRound } from '../types';

const InterviewModule: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [isActive, setIsActive] = useState(false);
  const [activeRound, setActiveRound] = useState<InterviewRound>(InterviewRound.TECHNICAL);
  const [messages, setMessages] = useState<{role: 'ai' | 'user', text: string}[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [roundScore, setRoundScore] = useState(0);
  const [roundHistory, setRoundHistory] = useState<Record<string, {passed: boolean, score: number}>>({});

  const QUESTIONS_PER_ROUND = activeRound === InterviewRound.TECHNICAL ? 5 : 4;

  const playAiVoice = async (text: string) => {
    const base64Audio = await textToSpeech(text);
    if (!base64Audio) return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const dataInt16 = new Int16Array(bytes.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  };

  const startRound = (round: InterviewRound) => {
    setIsActive(true);
    setActiveRound(round);
    setTurnCount(0);
    setRoundScore(0);
    const greeting = round === InterviewRound.TECHNICAL 
      ? `Welcome to the Technical Round. I'll ask ${QUESTIONS_PER_ROUND} engineering questions.` 
      : round === InterviewRound.MANAGERIAL 
      ? `Moving to the Managerial Round. Let's discuss leadership and scenarios.` 
      : `Final Round: HR and Culture.`;
    setMessages([{ role: 'ai', text: greeting }]);
    playAiVoice(greeting);
  };

  const handleSend = async () => {
    if (!currentInput.trim()) return;
    const userText = currentInput;
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setCurrentInput("");
    setLoading(true);

    try {
      const lastAiMsg = messages[messages.length - 1].text;
      const result = await getInterviewFeedback(lastAiMsg, userText, user.targetRole, activeRound);
      
      const newTurnCount = turnCount + 1;
      const newScore = roundScore + result.score;
      setTurnCount(newTurnCount);
      setRoundScore(newScore);

      if (newTurnCount < QUESTIONS_PER_ROUND) {
        const nextQ = `${result.feedback} Next Question...`;
        setMessages(prev => [...prev, { role: 'ai', text: nextQ }]);
        playAiVoice(nextQ);
      } else {
        const avg = Math.round(newScore / QUESTIONS_PER_ROUND);
        const passed = avg >= 60;
        
        await db.saveInterviewResult(user.id || 'guest', {
          role: user.targetRole,
          round_type: activeRound,
          score: avg,
          feedback: `Round Complete. Status: ${passed ? 'PASSED' : 'FAILED'}`,
          passed,
          date: new Date().toISOString()
        });

        setRoundHistory(prev => ({ ...prev, [activeRound]: { passed, score: avg } }));
        setIsActive(false);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="grid grid-cols-3 gap-4">
        {[InterviewRound.TECHNICAL, InterviewRound.MANAGERIAL, InterviewRound.HR].map((r, i) => {
          const status = roundHistory[r];
          const isUnlocked = i === 0 || roundHistory[Object.values(InterviewRound)[i-1]]?.passed;
          return (
            <div key={r} className={`p-4 rounded-2xl border-2 transition-all ${status?.passed ? 'bg-emerald-50 border-emerald-200' : status?.passed === false ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{r}</span>
                {status?.passed ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : status?.passed === false ? <XCircle className="w-4 h-4 text-red-500" /> : isUnlocked ? <ChevronRight className="w-4 h-4 text-indigo-400" /> : <Lock className="w-3 h-3 text-slate-300" />}
              </div>
              <p className="text-sm font-bold text-slate-900">{status ? `${status.score}%` : isUnlocked ? 'Ready' : 'Locked'}</p>
            </div>
          );
        })}
      </div>

      {!isActive ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-lg">
          <BrainCircuit className="w-16 h-16 text-indigo-600 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-slate-900 mb-2">Interview Simulator</h2>
          <p className="text-slate-500 mb-10">Pass all 3 rounds to verify your {user.targetRole} candidacy.</p>
          
          <div className="flex flex-col gap-4 max-w-xs mx-auto">
            {!roundHistory[InterviewRound.TECHNICAL] && (
              <button onClick={() => startRound(InterviewRound.TECHNICAL)} className="bg-indigo-600 text-white py-4 rounded-2xl font-bold">Start Technical Round</button>
            )}
            {roundHistory[InterviewRound.TECHNICAL]?.passed && !roundHistory[InterviewRound.MANAGERIAL] && (
              <button onClick={() => startRound(InterviewRound.MANAGERIAL)} className="bg-indigo-600 text-white py-4 rounded-2xl font-bold">Start Managerial Round</button>
            )}
            {roundHistory[InterviewRound.MANAGERIAL]?.passed && !roundHistory[InterviewRound.HR] && (
              <button onClick={() => startRound(InterviewRound.HR)} className="bg-indigo-600 text-white py-4 rounded-2xl font-bold">Start HR Round</button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden h-[600px] flex flex-col">
          <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
             <div className="font-bold text-sm text-slate-700">{activeRound} - Q{turnCount + 1}/{QUESTIONS_PER_ROUND}</div>
             <div className="text-xs text-indigo-600 font-bold px-3 py-1 bg-white rounded-full">Target: 60% to Pass</div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                <div className={`p-4 rounded-2xl text-sm max-w-[80%] ${m.role === 'ai' ? 'bg-slate-100 text-slate-800 rounded-tl-none' : 'bg-indigo-600 text-white rounded-tr-none shadow-lg'}`}>{m.text}</div>
              </div>
            ))}
            {loading && <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-400" />}
          </div>
          <div className="p-6 border-t flex gap-3">
            <input type="text" value={currentInput} onChange={(e) => setCurrentInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Your answer..." className="flex-1 px-5 py-4 bg-slate-50 rounded-2xl outline-none border focus:ring-2 focus:ring-indigo-500" />
            <button onClick={handleSend} className="px-8 bg-indigo-600 text-white rounded-2xl font-bold"><Send className="w-5 h-5" /></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewModule;
