declare module '@google/genai' {
  export const ThinkingLevel: Record<string, unknown>
  export class GoogleGenAI {
    constructor(options: { apiKey?: string })
    models: {
      generateContentStream(input: {
        model: string
        config: { thinkingConfig: { thinkingLevel: unknown }; tools: Array<{ googleSearch: Record<string, never> }> }
        contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>
      }): AsyncIterable<{ text?: string }>
    }
  }
}
