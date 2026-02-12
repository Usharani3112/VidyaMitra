
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ResumeAnalysis, LearningRoadmap, QuizQuestion, InterviewRound } from "./types";

export interface ResumeInput {
  text?: string;
  file?: {
    data: string;
    mimeType: string;
  };
}

// Helper to handle mandatory API key re-selection on specific errors
const handleApiError = async (error: any) => {
  if (error.message?.includes("Requested entity was not found")) {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
    }
  }
  throw error;
};

/**
 * Diagnostic function to check if the current API key is working.
 */
export const testAiConnectivity = async (): Promise<boolean> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "ping",
    });
    return !!response.text;
  } catch (error) {
    console.error("Connectivity test failed:", error);
    return false;
  }
};

export const analyzeResume = async (resume: ResumeInput, targetRole: string): Promise<ResumeAnalysis> => {
  // Initialize instance inside function to use up-to-date API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts: any[] = [];
  
  if (resume.text) {
    parts.push({ text: `Resume Text Content: ${resume.text}` });
  }
  
  if (resume.file) {
    parts.push({
      inlineData: {
        data: resume.file.data,
        mimeType: resume.file.mimeType
      }
    });
  }

  parts.push({ text: `TASK: Conduct a comprehensive ATS analysis of this resume for the specific role: "${targetRole}".` });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts },
      config: {
        seed: 42, // Ensure deterministic scoring for same inputs
        systemInstruction: `You are an elite Technical Recruiter and ATS Optimization Expert.
        
        CRITICAL INSTRUCTIONS:
        1. DETERMINISM: For the same content and role, you must return the same score.
        2. PROJECT-BASED SKILL EXTRACTION: If technologies (like Python, CNN, TensorFlow, OpenCV) are mentioned in projects, THEY ARE PRESENT.
        3. ATS SCORING: Provide a consistent score (0-100) based on keyword density, role relevance, and project impact.
        4. BE HONEST: If a skill is clearly in the resume, it must be in 'extractedSkills' and 'strengths'.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            atsScore: { type: Type.NUMBER },
            extractedSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["atsScore", "extractedSkills", "missingSkills", "strengths", "improvements"],
        }
      }
    });

    const jsonStr = response.text || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    return handleApiError(error);
  }
};

export const generateRoadmap = async (currentSkills: string[], targetRole: string): Promise<LearningRoadmap> => {
  // Initialize instance inside function to use up-to-date API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Skills: [${currentSkills.join(', ')}]\nTarget Role: ${targetRole}`,
      config: {
        seed: 42,
        systemInstruction: "Generate a detailed learning roadmap including duration and YouTube search queries for resources.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            duration: { type: Type.STRING },
            modules: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  resources: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["name", "description", "resources"]
              }
            }
          },
          required: ["title", "duration", "modules"]
        }
      }
    });

    const jsonStr = response.text || "{}";
    const result = JSON.parse(jsonStr);
    return { ...result, target_role: targetRole };
  } catch (error) {
    return handleApiError(error);
  }
};

export const generateQuiz = async (topic: string, level: string): Promise<QuizQuestion[]> => {
  // Initialize instance inside function to use up-to-date API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a 5-question multiple choice quiz about ${topic} at ${level} level.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.NUMBER, description: "Index of the correct option (0-3)" },
              explanation: { type: Type.STRING }
            },
            required: ["id", "question", "options", "correctAnswer", "explanation"]
          }
        }
      }
    });

    const jsonStr = response.text || "[]";
    return JSON.parse(jsonStr);
  } catch (error) {
    return handleApiError(error);
  }
};

export const getInterviewFeedback = async (question: string, answer: string, role: string, round: InterviewRound): Promise<{score: number, feedback: string, suggestion: string}> => {
  // Initialize instance inside function to use up-to-date API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Round: ${round}\nQuestion: ${question}\nUser Answer: ${answer}`,
      config: {
        systemInstruction: `Evaluate the user's answer for the job role: ${role} in a ${round} interview context.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING },
            suggestion: { type: Type.STRING }
          },
          required: ["score", "feedback", "suggestion"]
        }
      }
    });

    const jsonStr = response.text || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    return handleApiError(error);
  }
};

export const textToSpeech = async (text: string): Promise<string | undefined> => {
  // Initialize instance inside function to use up-to-date API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Speak this naturally as a professional interviewer: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    if (error.message?.includes("Requested entity was not found")) {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
      }
    }
    console.error("TTS failed:", error);
    return undefined;
  }
};
