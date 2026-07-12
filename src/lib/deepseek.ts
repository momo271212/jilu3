/**
 * AI API clients.
 *
 * - DeepSeek Platform (api.deepseek.com):  text generation → card creation
 * - SiliconFlow  (api.siliconflow.cn):    OCR / image text extraction → DeepSeek-OCR
 *
 * Both use OpenAI-compatible /v1/chat/completions endpoints.
 */

const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''
const SILICONFLOW_BASE_URL = process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn'
const SILICONFLOW_API_KEY = process.env.SILICONFLOW_API_KEY || ''

// ─── Types ───────────────────────────────────────────────

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | VisionContentPart[]
}

interface VisionContentPart {
  type: 'text' | 'image_url'
  text?: string
  image_url?: { url: string }
}

interface ChatCompletionResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: { role: string; content: string }
    finish_reason: string
  }>
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
}

// ─── Generic OpenAI-compatible request ───────────────────

async function openAIRequest(
  baseUrl: string,
  apiKey: string,
  body: Record<string, unknown>
): Promise<ChatCompletionResponse> {
  const url = `${baseUrl}/v1/chat/completions`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120000),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`API error ${response.status}: ${errorText.slice(0, 300)}`)
  }

  return response.json() as Promise<ChatCompletionResponse>
}

// ─── DeepSeek Platform (text generation) ─────────────────

export class DeepSeekClient {
  private baseUrl: string
  private apiKey: string

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey || DEEPSEEK_API_KEY
    this.baseUrl = baseUrl || DEEPSEEK_BASE_URL
  }

  get isConfigured(): boolean {
    return !!this.apiKey
  }

  /** Chat completion — text generation via deepseek-chat */
  async chat(
    messages: ChatMessage[],
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<ChatCompletionResponse> {
    return openAIRequest(this.baseUrl, this.apiKey, {
      model: 'deepseek-chat',
      messages,
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 4096,
      stream: false,
    })
  }
}

// ─── OCR via SiliconFlow (deepseek-ai/DeepSeek-OCR) ──────

/**
 * Extract text from an image/PDF using DeepSeek-OCR
 * hosted on SiliconFlow (api.siliconflow.cn).
 *
 * SiliconFlow provides an OpenAI-compatible chat API that supports
 * image_url content type — perfect for OCR workloads.
 *
 * @param imageBase64 - data:image/...;base64,...  (or raw base64)
 * @returns extracted text string
 */
export async function ocrExtractText(imageBase64: string): Promise<string> {
  if (!SILICONFLOW_API_KEY) {
    throw new Error('硅基流动 API 密钥未配置，请在 .env 中设置 SILICONFLOW_API_KEY')
  }

  const content: VisionContentPart[] = [
    {
      type: 'image_url',
      image_url: {
        url: imageBase64,
      },
    },
    {
      type: 'text',
      text: '请提取图片中的所有文字。',
    },
  ]

  // CRITICAL: The system prompt is required for DeepSeek-OCR to output text properly.
  // Without it, the model may output garbage, JSON artifacts, or nothing at all.
  const result = await openAIRequest(SILICONFLOW_BASE_URL, SILICONFLOW_API_KEY, {
    model: 'deepseek-ai/DeepSeek-OCR',
    messages: [
      {
        role: 'system',
        content: 'You are an OCR engine. Output ONLY the text from the image directly. No JSON, no markdown, no explanation. Output the text exactly as it appears.',
      },
      { role: 'user', content },
    ],
    temperature: 0.1,
    max_tokens: 4096,
    stream: false,
  })

  const text = result.choices?.[0]?.message?.content || ''

  if (!text) {
    throw new Error('OCR 模型返回空结果，请检查图片是否包含文字')
  }

  return text
}

/** Check if OCR (SiliconFlow) is available */
export function isOCRAvailable(): boolean {
  return !!SILICONFLOW_API_KEY
}

// ─── Helpers ─────────────────────────────────────────────

let clientInstance: DeepSeekClient | null = null

export function getDeepSeekClient(): DeepSeekClient {
  if (!clientInstance) {
    clientInstance = new DeepSeekClient()
  }
  return clientInstance
}

export function isDeepSeekConfigured(): boolean {
  return !!DEEPSEEK_API_KEY
}
