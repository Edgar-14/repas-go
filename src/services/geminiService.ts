import { GoogleGenerativeAI, GenerateContentResponse, SchemaType } from "@google/generative-ai";

let ai: GoogleGenerativeAI | null = null;

// Función para inicializar el servicio con una clave de API
export const initializeGeminiService = (apiKey: string) => {
    if (!apiKey) {
        console.error("No API key provided for Gemini service.");
        ai = null;
        return;
    }
    try {
        ai = new GoogleGenerativeAI(apiKey);
    } catch (error) {
        console.error("Failed to initialize GoogleGenerativeAI:", error);
        ai = null;
    }
};

// Intenta inicializar desde variables de entorno al cargar, como fallback
const apiKeyFromEnv = process.env.API_KEY || (global as any)?.GEMINI_API_KEY;
if (apiKeyFromEnv) {
    initializeGeminiService(apiKeyFromEnv);
}

interface GeminiResponse {
    text: string;
    groundingChunks: any[];
}

export const getGeminiChatResponse = async (
    prompt: string,
    history: { role: 'user' | 'model', parts: { text: string }[] }[],
    useThinkingMode: boolean,
    useMaps: boolean,
    location?: { latitude: number; longitude: number; }
): Promise<GeminiResponse> => {
    if (!ai) {
        return { text: "El servicio de IA no está inicializado. Por favor, configura una API Key.", groundingChunks: [] };
    }
    try {
        const modelName = useThinkingMode ? 'gemini-1.5-pro' : 'gemini-1.5-flash';

        const config: any = {};
        const tools: any[] = [];
        let toolConfig: any = {};

        if (useThinkingMode) {
            config.thinkingConfig = { thinkingBudget: 32768 };
        }
        
        if (useMaps) {
            tools.push({ googleMaps: {} });
            toolConfig.retrievalConfig = {
                latLng: location || {
                    latitude: 19.4326,
                    longitude: -99.1332
                }
            };
        }

        const model = ai.getGenerativeModel({ model: modelName });
        const response = await model.generateContent({
            contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
            ...(Object.keys(config).length > 0 && { generationConfig: config }),
            ...(tools.length > 0 && { tools }),
            ...(Object.keys(toolConfig).length > 0 && { toolConfig }),
        });

        return {
            text: response.response.text(),
            groundingChunks: response.response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
        };
    } catch (error) {
        console.error("Error getting response from Gemini:", error);
        let errorMessage = "An unknown error occurred while contacting the AI.";
        if (error instanceof Error) {
            errorMessage = `Error: ${error.message}`;
        }
        return { text: errorMessage, groundingChunks: [] };
    }
};

export const getGeminiQuickReplies = async (
    lastMessage: string,
    recipient: 'driver' | 'customer'
): Promise<string[]> => {
    if (!ai) {
        console.warn("Gemini service not initialized. Returning fallback quick replies.");
        return recipient === 'driver' 
            ? ["¡Entendido!", "Voy en camino.", "Gracias."]
            : ["¿Dónde vienes?", "Gracias", "Te espero afuera"];
    }
    try {
        const prompt = recipient === 'driver' 
            ? `Un cliente de delivery te envió este mensaje: "${lastMessage}". Eres el repartidor. Genera 3 respuestas cortas, profesionales y amigables. No más de 5 palabras por respuesta.`
            : `Un repartidor o restaurante de delivery te envió este mensaje: "${lastMessage}". Eres el cliente. Genera 3 respuestas cortas y amigables. No más de 5 palabras por respuesta.`;

        const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const response = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.STRING
                    },
                    description: "Una lista de 3 respuestas cortas de no más de 5 palabras cada una."
                }
            }
        });

        const jsonText = response.response.text().trim();
        const replies = JSON.parse(jsonText);
        return Array.isArray(replies) ? replies.slice(0, 3) : [];
    } catch (error) {
        console.error("Error getting quick replies from Gemini:", error);
        return recipient === 'driver' 
            ? ["¡Entendido!", "Voy en camino.", "Gracias."]
            : ["¿Dónde vienes?", "Gracias", "Te espero afuera"];
    }
};