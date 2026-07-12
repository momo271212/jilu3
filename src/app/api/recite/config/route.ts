import { NextResponse } from 'next/server'
import { isDeepSeekConfigured, isOCRAvailable } from '@/lib/deepseek'

export async function GET() {
  return NextResponse.json({
    configured: isDeepSeekConfigured(),
    ocrAvailable: isOCRAvailable(),
    provider: 'deepseek',
    ocrProvider: 'siliconflow',
    message: isDeepSeekConfigured()
      ? 'DeepSeek API 已配置'
      : '请在 .env 中设置 DEEPSEEK_API_KEY',
  })
}
