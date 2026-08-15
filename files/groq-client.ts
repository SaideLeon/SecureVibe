import Groq from 'groq-sdk'

// Preferência fixa do utilizador: NUNCA usar modelos da família "llama*" na Groq.
// O modelo por omissão deve ser sempre "openai/gpt-oss-120b".
export const GROQ_DEFAULT_MODEL = 'openai/gpt-oss-120b'
const BANNED_MODEL_PATTERN = /llama/i

export function assertAllowedGroqModel(model: string): void {
  if (BANNED_MODEL_PATTERN.test(model)) {
    throw new Error(
      `Modelo Groq recusado: "${model}". Modelos da família Llama estão bloqueados por preferência do utilizador. Use "${GROQ_DEFAULT_MODEL}".`
    )
  }
}

let cachedClient: Groq | null = null

export function getGroqClient(): Groq {
  if (!cachedClient) {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) throw new Error('GROQ_API_KEY não está definida no ambiente.')
    cachedClient = new Groq({ apiKey })
  }
  return cachedClient
}

export type GroqChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export type GroqCompletionOptions = {
  model?: string
  temperature?: number
  maxCompletionTokens?: number
  reasoningEffort?: 'low' | 'medium' | 'high'
}

export async function runGroqCompletion(messages: GroqChatMessage[], options: GroqCompletionOptions = {}): Promise<string> {
  const model = options.model ?? GROQ_DEFAULT_MODEL
  assertAllowedGroqModel(model)

  const client = getGroqClient()
  const completion = await client.chat.completions.create({
    model,
    messages,
    temperature: options.temperature ?? 0.2,
    max_completion_tokens: options.maxCompletionTokens ?? 8000,
    top_p: 1,
    reasoning_effort: options.reasoningEffort ?? 'medium',
    stream: false,
  })

  return completion.choices[0]?.message?.content ?? ''
}
