
import { createClient } from '@supabase/supabase-js';
import { UserProfile, ResumeAnalysis, LearningRoadmap, QuizResult, InterviewResult } from './types';

const SUPABASE_URL = 'https://ddzxsbljzicdngplsbfv.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkenhzYmxqemljZG5ncGxzYmZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3ODg2NzMsImV4cCI6MjA4NjM2NDY3M30.0yjMJlR0a8WMtmjq5V4yZx-j-4HVpH1aYZD2BhqI0HY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const db = {
  // User Profile
  async saveProfile(profile: UserProfile) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ 
        id: profile.id || profile.email,
        name: profile.name, 
        email: profile.email, 
        target_role: profile.targetRole, 
        skills: profile.skills 
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getProfile(userId: string) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) return null;
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      targetRole: data.target_role,
      skills: data.skills,
      isLoggedIn: true
    };
  },

  async getProfileByEmail(email: string) {
    const { data, error } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      targetRole: data.target_role,
      skills: data.skills,
      isLoggedIn: true
    };
  },

  // Resumes - Added Hashing support
  async saveResume(userId: string, resumeText: string, analysis: ResumeAnalysis, hash: string) {
    await supabase.from('resumes').insert({
      user_id: userId,
      content: resumeText,
      analysis: analysis,
      hash: hash,
      created_at: new Date().toISOString()
    });
  },

  async getResumeByHash(userId: string, hash: string, targetRole: string) {
    const { data } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .eq('hash', hash)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  },

  async getLatestResume(userId: string) {
    const { data } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  },

  // Learning Plans - History Support
  async saveLearningPlan(userId: string, roadmap: LearningRoadmap) {
    await supabase.from('learning_plans').insert({
      user_id: userId,
      plan_data: roadmap,
      target_role: roadmap.target_role,
      updated_at: new Date().toISOString()
    });
  },

  async getLearningPlan(userId: string) {
    const { data } = await supabase
      .from('learning_plans')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data?.plan_data;
  },

  async getLearningPlanHistory(userId: string): Promise<LearningRoadmap[]> {
    const { data } = await supabase
      .from('learning_plans')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    return (data || []).map(d => ({ ...d.plan_data, id: d.id, created_at: d.updated_at }));
  },

  // Quizzes
  async saveQuizResult(userId: string, result: Omit<QuizResult, 'id'>) {
    await supabase.from('quizzes').insert({
      user_id: userId,
      topic: result.topic,
      score: result.score,
      total: result.total,
      difficulty: result.difficulty,
      created_at: result.date
    });
  },

  async getQuizHistory(userId: string): Promise<QuizResult[]> {
    const { data } = await supabase.from('quizzes').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return (data || []).map(d => ({
      id: d.id,
      topic: d.topic,
      score: d.score,
      total: d.total,
      difficulty: d.difficulty,
      date: d.created_at
    }));
  },

  // Interviews - Enhanced Round Tracking
  async saveInterviewResult(userId: string, result: Omit<InterviewResult, 'id'>) {
    await supabase.from('interviews').insert({
      user_id: userId,
      role: result.role,
      round_type: result.round_type,
      score: result.score,
      feedback: result.feedback,
      passed: result.passed,
      created_at: result.date
    });
  },

  async getInterviewHistory(userId: string): Promise<InterviewResult[]> {
    const { data } = await supabase.from('interviews').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return (data || []).map(d => ({
      id: d.id,
      role: d.role,
      round_type: d.round_type,
      score: d.score,
      feedback: d.feedback,
      passed: d.passed,
      date: d.created_at
    }));
  }
};
