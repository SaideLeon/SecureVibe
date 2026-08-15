// Preferência fixa do utilizador: NUNCA usar modelos da família "llama*" na Groq.
// O modelo por omissão deve ser sempre "openai/gpt-oss-120b".
export const GROQ_DEFAULT_MODEL = 'openai/gpt-oss-120b'
const BANNED_MODEL_PATTERN = /llama/i
const GROQ_CHAT_COMPLETIONS_URL = 'https://api.groq.com/openai/v1/chat/completions'

export function assertAllowedGroqModel(model: string): void {
  if (BANNED_MODEL_PATTERN.test(model)) {
    throw new Error(
      `Modelo Groq recusado: "${model}". Modelos da família Llama estão bloqueados por preferência do utilizador. Use "${GROQ_DEFAULT_MODEL}".`
    )
  }
}

export type GroqChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export type GroqCompletionOptions = {
  model?: string
  temperature?: number
  maxCompletionTokens?: number
  reasoningEffort?: 'low' | 'medium' | 'high'
}

type GroqCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>
  error?: { message?: string }
}

export async function runGroqCompletion(messages: GroqChatMessage[], options: GroqCompletionOptions = {}): Promise<string> {
  const model = options.model ?? GROQ_DEFAULT_MODEL
  assertAllowedGroqModel(model)

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY não está definida no ambiente.')

  const response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.2,
      max_completion_tokens: options.maxCompletionTokens ?? 8000,
      top_p: 1,
      reasoning_effort: options.reasoningEffort ?? 'medium',
      stream: false,
    }),
  })

  const data = (await response.json().catch(() => ({}))) as GroqCompletionResponse
  if (!response.ok) {
    throw new Error(data.error?.message ?? `Falha ao chamar a Groq (HTTP ${response.status}).`)
  }

  return data.choices?.[0]?.message?.content ?? ''
}
