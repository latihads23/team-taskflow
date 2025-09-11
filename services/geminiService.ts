
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { Priority, User, Status } from '../types';

// Initialize AI instance only if GEMINI_API_KEY is available.
const ai = import.meta.env.VITE_GEMINI_API_KEY ? new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY }) : null;

if (!ai) {
  console.warn("VITE_GEMINI_API_KEY environment variable not set. Smart features will not work.");
}

let chat: Chat | null = null;

const initializeChat = () => {
  if (!ai) return null;
  return ai.chats.create({
    model: 'gemini-1.5-flash',
    config: {
      systemInstruction: `You are a productivity and work management expert assistant for Team TaskFlow app. 

Your specialties:
🎯 Task prioritization and time management strategies
📈 Productivity methods (Pomodoro, GTD, Eat That Frog, Timeboxing)
⚡ Workflow optimization and efficiency tips
🧠 Focus and concentration techniques
📊 Project planning and organization advice
💡 Work-life balance and stress management
🎪 Team collaboration and communication strategies

Always provide:
- Actionable, practical advice
- Concise responses (2-3 sentences max unless asked for details)
- Relevant productivity frameworks when applicable
- Encouraging, professional tone
- Focus on WORK and PRODUCTIVITY topics only

Avoid: Personal life advice unrelated to work, off-topic conversations, overly long responses.`,
    },
  });
};

export const parseTaskFromString = async (prompt: string, users: User[]) => {
  if (!ai) {
    throw new Error("AI service is not configured. Please provide an API key.");
  }
  
  const userNames = users.map(u => u.name);
  const priorityValues = Object.values(Priority);
  
  const schema = {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "A concise title for the task, ideally under 10 words.",
      },
      description: {
        type: Type.STRING,
        description: "A detailed description of the task.",
      },
      dueDate: {
        type: Type.STRING,
        description: `The due date for the task in YYYY-MM-DD format. Today is ${new Date().toISOString().split('T')[0]}.`,
      },
      priority: {
        type: Type.STRING,
        enum: priorityValues,
        description: "The priority of the task.",
      },
      assigneeName: {
        type: Type.STRING,
        enum: userNames,
        description: "The name of the person assigned to the task.",
      },
    },
    required: ["title", "dueDate", "priority", "assigneeName"],
  };

  try {
    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `Parse the following user request to create a task. Available users are: ${userNames.join(', ')}. Available priorities are: ${priorityValues.join(', ')}. Extract the details and format them according to the provided schema. User request: "${prompt}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const jsonString = result.text.trim();
    const parsedData = JSON.parse(jsonString);

    const assignedUser = users.find(u => u.name.toLowerCase() === parsedData.assigneeName?.toLowerCase());
    
    if (!assignedUser) {
      console.error("AI returned a user that doesn't exist:", parsedData.assigneeName);
      return null;
    }

    return {
      title: parsedData.title || "Untitled Task",
      description: parsedData.description || "",
      dueDate: parsedData.dueDate,
      priority: parsedData.priority || Priority.Medium,
      assigneeId: assignedUser.id,
      status: Status.ToDo,
    };

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to parse task using AI. Please try again.");
  }
};

export const chatWithAI = async (message: string): Promise<string> => {
    if (!ai) {
      throw new Error("AI service is not configured. Please provide an API key.");
    }

    if (!chat) {
        chat = initializeChat();
        if (!chat) throw new Error("Could not initialize AI chat.");
    }
    
    try {
        const result = await chat.sendMessage({ message });
        return result.text;
    } catch (error) {
        console.error("Error communicating with AI Chat:", error);
        // FIX: Rephrased comment to be more descriptive of the retry logic.
        // The chat session might be broken, so we'll reset it and retry once to handle transient errors.
        try {
            console.log("Resetting chat session and retrying...");
            chat = initializeChat();
            if (!chat) throw new Error("Could not re-initialize AI chat.");
            const result = await chat.sendMessage({ message });
            return result.text;
        } catch (retryError) {
            console.error("Error on retry communicating with AI Chat:", retryError);
            throw new Error("Failed to communicate with AI after retry.");
        }
    }
};

export const resetChat = () => {
    chat = null;
    console.log("AI Chat session has been reset.");
};