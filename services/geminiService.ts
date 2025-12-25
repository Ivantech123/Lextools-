
import { GoogleGenAI, Type } from "@google/genai";
import { AITaskResponse, AIScheduleResponse } from "../types";

const apiKey = process.env.API_KEY;

// Initialize Gemini client
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const MODEL_NAME = "gemini-2.5-flash";

export const GeminiService = {
  /**
   * Analyzes raw input text to determine if it's a task or event and extracts details.
   */
  analyzeInput: async (input: string): Promise<{ type: 'task' | 'event', title: string, time?: string, date?: string, category?: string, priority?: 'high'|'medium'|'low', location?: string, description?: string } | null> => {
      if (!ai) return null;

      try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Analyze this input: "${input}". 
            Context: Legal/Professional app. 
            Instructions:
            1. Determine if it is a Task (ToDo) or a Calendar Event (Meeting, Court, Deadline). 
            2. Extract time (HH:MM) and date (YYYY-MM-DD) if explicitly stated or relative (today, tomorrow). Assume current year is 2026.
            3. If it looks like a shopping list or generic task, make it a task.
            4. If it has specific time, make it event. 
            5. Return JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, enum: ["task", "event"] },
                        title: { type: Type.STRING },
                        time: { type: Type.STRING, description: "HH:MM format if present, else null" },
                        date: { type: Type.STRING, description: "YYYY-MM-DD format if present" },
                        category: { type: Type.STRING, description: "Category like Court, Office, Personal" },
                        priority: { type: Type.STRING, enum: ["high", "medium", "low"] },
                        location: { type: Type.STRING },
                        description: { type: Type.STRING }
                    }
                }
            }
        });
        const text = response.text;
        if (!text) return null;
        return JSON.parse(text);
      } catch (error) {
        console.error("Gemini Analyze Input Error", error);
        return null;
      }
  },

  /**
   * Refines text in Note Editor
   */
  refineText: async (text: string, instruction: 'fix' | 'summarize' | 'expand'): Promise<string> => {
      if (!ai || !text) return text;
      
      let prompt = "";
      switch(instruction) {
          case 'fix': prompt = "Ты профессиональный редактор. Исправь грамматические, пунктуационные и стилистические ошибки в следующем тексте. Сделай тон более деловым и юридически грамотным. ВЕРНИ ТОЛЬКО ИСПРАВЛЕННЫЙ ТЕКСТ, без комментариев."; break;
          case 'summarize': prompt = "Сделай краткую выжимку (summary) этого текста. Используй маркированный список (буллиты). ВЕРНИ ТОЛЬКО ТЕКСТ ВЫЖИМКИ."; break;
          case 'expand': prompt = "Раскрой мысль в этом тексте подробнее. Добавь профессиональных деталей, аргументов и юридического контекста, если уместно. Сделай текст более объемным и убедительным. ВЕРНИ ТОЛЬКО РАСШИРЕННЫЙ ТЕКСТ."; break;
      }

      try {
          const response = await ai.models.generateContent({
              model: MODEL_NAME,
              contents: `${prompt}\n\nТекст для обработки:\n"${text}"`
          });
          return response.text?.trim() || text;
      } catch (e) {
          console.error("Gemini Refine Error:", e);
          return text;
      }
  },

  /**
   * Extracts raw text from an image (OCR).
   */
  extractTextFromImage: async (base64Image: string): Promise<string> => {
    if (!ai) return "";

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", // Good for vision
            contents: {
                parts: [
                    { inlineData: { mimeType: "image/jpeg", data: base64Image } },
                    { text: "Transcribe the text from this image exactly. If it's a document, preserve the structure roughly. Return ONLY the text." }
                ]
            }
        });
        return response.text?.trim() || "";
    } catch (error) {
        console.error("Gemini OCR Error:", error);
        return "";
    }
  },

  /**
   * OCR / Image Analysis: Extracts text and intent from an image.
   */
  analyzeImage: async (base64Image: string): Promise<{ type: 'task' | 'event', title: string, time?: string, category?: string, priority?: 'high'|'medium'|'low', confidence?: number } | null> => {
    if (!ai) return null;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { inlineData: { mimeType: "image/jpeg", data: base64Image } },
                    { text: "Проанализируй это изображение. Если это юридический документ, иск или повестка, извлеки дату, время и суть. Если просто список - извлеки задачи. Оцени уверенность в распознавании текста (0-100). Верни JSON." }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, enum: ["task", "event"] },
                        title: { type: Type.STRING, description: "Краткое название" },
                        time: { type: Type.STRING, description: "HH:MM если есть время" },
                        category: { type: Type.STRING },
                        priority: { type: Type.STRING, enum: ["high", "medium", "low"] },
                        confidence: { type: Type.NUMBER, description: "Оценка уверенности в распознавании (0-100)" }
                    }
                }
            }
        });

        const text = response.text;
        if (!text) return null;
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini Vision Error:", error);
        return null;
    }
  },

  /**
   * Generates a daily schedule based on a list of tasks and user prompt.
   */
  generateSchedule: async (tasks: string[], context: string): Promise<AIScheduleResponse | null> => {
    if (!ai) return null;

    const taskList = tasks.join(", ");
    const prompt = `Создай оптимальное расписание на день для юриста. Входящие задачи: [${taskList}]. Контекст: ${context}. Добавь перерывы. Верни JSON.`;

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              schedule: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    time: { type: Type.STRING, description: "Время в формате HH:MM" },
                    activity: { type: Type.STRING, description: "Название активности" },
                    type: { type: Type.STRING, enum: ['work', 'personal', 'health', 'other'] }
                  }
                }
              }
            }
          }
        }
      });

      const text = response.text;
      if (!text) return null;
      return JSON.parse(text) as AIScheduleResponse;
    } catch (error) {
      console.error("Gemini Generate Schedule Error:", error);
      return null;
    }
  },

  /**
   * General chat assistance with App Context Awareness
   */
  chatWithContext: async (message: string, history: { role: string; parts: { text: string }[] }[], appContext: any): Promise<string> => {
    if (!ai) return "Пожалуйста, настройте API ключ.";

    const systemPrompt = `Ты интеллектуальный ассистент LexTools (юридическая OS).
    
    ТЕКУЩИЙ КОНТЕКСТ ПОЛЬЗОВАТЕЛЯ:
    Задачи: ${JSON.stringify(appContext.tasks)}
    События календаря: ${JSON.stringify(appContext.events)}
    Текущее время: ${new Date().toLocaleString('ru-RU')}
    
    Отвечай кратко, профессионально, используй этот контекст. Если пользователь спрашивает "что у меня сегодня", смотри в список событий и задач.`;

    try {
      const chat = ai.chats.create({
        model: MODEL_NAME,
        history: history.map(h => ({
          role: h.role,
          parts: h.parts,
        })),
        config: {
            systemInstruction: systemPrompt
        }
      });

      const result = await chat.sendMessage({ message });
      return result.text || "Извините, я не смог сформировать ответ.";
    } catch (error) {
      console.error("Gemini Chat Error:", error);
      return "Произошла ошибка при связи с ИИ.";
    }
  }
};
