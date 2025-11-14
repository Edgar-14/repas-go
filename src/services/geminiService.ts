import { GoogleGenerativeAI, GenerateContentResponse, SchemaType } from "@google/generative-ai";
import MapService from './MapService';

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

export interface GeminiResponse {
    text: string;
    groundingChunks: any[];
    mapAction?: {
        type: 'STYLE' | 'CAMERA' | 'ROUTE' | 'SEARCH';
        payload: any;
    };
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
        
        const tools: any[] = (MapService as any).toolsDefinition?.functionDeclarations
          ? [...(MapService as any).toolsDefinition.functionDeclarations]
          : [];

        if (useMaps) {
             // En el futuro, podrías añadir herramientas específicas de mapas aquí si las separas
        }

        const model = ai.getGenerativeModel({ 
            model: modelName,
            tools: [{ functionDeclarations: tools as any }] 
        });

        const chat = model.startChat({
            history: history,
        });

        const result = await chat.sendMessage(prompt);
        const response = result.response;
        
        const functionCalls = response.functionCalls();
        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            const args = call.args as any;

            if (call.name === 'change_map_style') {
                try {
                    const validStyle = (MapService as any).validateStyle
                      ? (MapService as any).validateStyle(args.jsonStyle)
                      : args.jsonStyle;
                    return {
                        text: "He generado un nuevo estilo para tu mapa. Aplicando cambios...",
                        groundingChunks: [],
                        mapAction: { type: 'STYLE', payload: validStyle }
                    };
                } catch (error: any) {
                    return { text: `Error generando el estilo: ${error.message}`, groundingChunks: [] };
                }
            }

            if (call.name === 'view_location_google_maps') {
                return {
                    text: `Moviendo mapa a: ${args.query}`,
                    groundingChunks: [],
                    mapAction: { 
                        type: 'CAMERA', 
                        payload: { query: args.query } 
                    }
                };
            }

            if (call.name === 'directions_on_google_maps') {
                return {
                    text: `Calculando ruta de ${args.origin} a ${args.destination}`,
                    groundingChunks: [],
                    mapAction: { 
                        type: 'ROUTE', 
                        payload: { origin: args.origin, destination: args.destination } 
                    }
                };
            }
            
            if (call.name === 'search_google_maps') {
                return {
                    text: `Buscando: ${args.search}`,
                    groundingChunks: [],
                    mapAction: {
                        type: 'SEARCH',
                        payload: { query: args.search }
                    }
                };
            }
        }

        return {
            text: response.text(),
            groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
        };

    } catch (error) {
        let errorMessage = "An unknown error occurred while contacting the AI.";
        if (error instanceof Error) {
            errorMessage = `Error: ${error.message}`;
        }
        return { text: errorMessage, groundingChunks: [] };
    }
};
