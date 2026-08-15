// A auditoria IA usa apenas modelos da família Gemini, com Google Search activo.
export const GEMINI_DEFAULT_MODEL = 'gemini-3.1-flash-lite'

export const GEMINI_MODEL_OPTIONS = [
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash-Lite' },
  { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite' },
  { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash' },
  { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash' },
  { id: 'gemini-3.7-flash', label: 'Gemini 3.7 Flash' },
  { id: 'gemini-flash-lite-latest', label: 'Gemini Flash-Lite Latest' },
  { id: 'models/gemini-flash-latest', label: 'Gemini Flash Latest' },
] as const

const GEMINI_MODEL_PATTERN = /^(models\/)?gemini-[a-z0-9][a-z0-9.-]*(?:-latest|-preview)?$/i

export type GeminiModelId = (typeof GEMINI_MODEL_OPTIONS)[number]['id']
export type GeminiChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export type GeminiCompletionOptions = {
  model?: string
  thinkingLevel?: 'minimal' | 'low' | 'medium' | 'high'
}

type GoogleGenAIModule = {
  GoogleGenAI: new (options: { apiKey?: string }) => {
    models: {
      generateContentStream(input: {
        model: string
        config: { thinkingConfig: { thinkingLevel: unknown }; tools: Array<{ googleSearch: Record<string, never> }> }
        contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>
      }): AsyncIterable<{ text?: string }>
    }
  }
  ThinkingLevel?: Record<string, unknown>
}

export function assertAllowedGeminiModel(model: string): void {
  if (!GEMINI_MODEL_PATTERN.test(model)) {
    throw new Error(`Modelo Gemini inválido: "${model}". Escolha um modelo da família Gemini.`)
  }
}

function toGeminiContents(messages: GeminiChatMessage[]) {
  return messages.map((message) => ({
    role: message.role === 'assistant' ? ('model' as const) : ('user' as const),
    parts: [{ text: message.role === 'system' ? `System instructions:\n${message.content}` : message.content }],
  }))
}

function resolveThinkingLevel(thinkingLevel: GeminiCompletionOptions['thinkingLevel'], enumValues?: Record<string, unknown>) {
  const key = (thinkingLevel ?? 'minimal').toUpperCase()
  return enumValues?.[key] ?? (thinkingLevel ?? 'minimal')
}

export async function runGeminiCompletion(messages: GeminiChatMessage[], options: GeminiCompletionOptions = {}): Promise<string> {
  const model = options.model ?? GEMINI_DEFAULT_MODEL
  assertAllowedGeminiModel(model)

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY não está definida no ambiente.')

  const { GoogleGenAI, ThinkingLevel } = (await Function('specifier', 'return import(specifier)')('@google/genai')) as GoogleGenAIModule
  const ai = new GoogleGenAI({ apiKey })
  const stream = await ai.models.generateContentStream({
    model,
    config: {
      thinkingConfig: { thinkingLevel: resolveThinkingLevel(options.thinkingLevel, ThinkingLevel) },
      tools: [{ googleSearch: {} }],
    },
    contents: toGeminiContents(messages),
  })

  let text = ''
  for await (const chunk of stream) {
    if (chunk.text) text += chunk.text
  }
  return text
}
