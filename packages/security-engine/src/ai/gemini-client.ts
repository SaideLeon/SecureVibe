// Preferência fixa do utilizador: a auditoria IA deve usar Gemini com Google Search.
// O modelo por omissão deve ser sempre "models/gemini-3.7-flash".
export const GEMINI_DEFAULT_MODEL = 'models/gemini-3.7-flash'
const GEMINI_GENERATE_CONTENT_URL = 'https://generativelanguage.googleapis.com/v1beta'

export type GeminiChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export type GeminiCompletionOptions = {
  model?: string
  maxOutputTokens?: number
  topP?: number
  thinkingLevel?: 'low' | 'medium' | 'high'
}

type GeminiPart = { text?: string }
type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: GeminiPart[] } }>
  error?: { message?: string }
}

function toGeminiContents(messages: GeminiChatMessage[]) {
  return messages.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.role === 'system' ? `System instructions:\n${message.content}` : message.content }],
  }))
}

export async function runGeminiCompletion(messages: GeminiChatMessage[], options: GeminiCompletionOptions = {}): Promise<string> {
  const model = options.model ?? GEMINI_DEFAULT_MODEL
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY não está definida no ambiente.')

  const response = await fetch(`${GEMINI_GENERATE_CONTENT_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: toGeminiContents(messages),
      tools: [{ google_search: {} }],
      generationConfig: {
        maxOutputTokens: options.maxOutputTokens ?? 65536,
        topP: options.topP ?? 0.95,
        thinkingConfig: { thinkingLevel: options.thinkingLevel ?? 'medium' },
      },
    }),
  })

  const data = (await response.json().catch(() => ({}))) as GeminiResponse
  if (!response.ok) {
    throw new Error(data.error?.message ?? `Falha ao chamar a Gemini API (HTTP ${response.status}).`)
  }

  return data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? ''
}
