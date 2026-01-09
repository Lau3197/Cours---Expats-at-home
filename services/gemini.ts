
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Moving GoogleGenAI instantiation inside functions as per guidelines for reliable API key retrieval.
// Also updated model for generateCourseOutline to gemini-3-pro-preview as it's a complex text task.

export async function generateCourseOutline(topic: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Generate a detailed course outline for the topic: ${topic}. 
    Return a JSON structure with sections and lessons. Each lesson should have a title and a brief content overview.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          sections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                lessons: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      title: { type: Type.STRING },
                      content: { type: Type.STRING },
                      duration: { type: Type.STRING },
                      type: { type: Type.STRING }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}');
}

export async function getTutorHelp(lessonContent: string, userQuestion: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `You are an AI Tutor in TutorLMS. Based on this lesson content: "${lessonContent}", answer the student's question: "${userQuestion}"`,
  });

  return response.text || "Désolé, I couldn't process your request at the moment.";
}
