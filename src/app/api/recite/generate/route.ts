import { NextRequest, NextResponse } from 'next/server'
import { DeepSeekClient, ocrExtractText } from '@/lib/deepseek'

const SYSTEM_PROMPT = `你是一位专业的考研备考辅导专家，擅长根据原始学习材料生成高质量的填空背诵卡片和艾宾浩斯复习计划。

你需要严格遵循以下规则：

## 规则
1. **填空卡片生成**：
   - 只提取考研核心踩分点、定义、公式、专有名词、答题模板关键词进行挖空
   - 单张卡片挖空1-3处，符合考研自测默写习惯
   - 卡片分为两类：【客观题卡】（选择、填空考点）、【主观题卡】（简答、论述答题框架踩分点）
   - 每张卡片格式统一：题干（用"____"表示挖空）+ 标准答案
   - 主观题额外标注"踩分逻辑："

2. **艾宾浩斯复习规划**：
   - 以今日为第0天，固定复习节点：第1、2、4、7、15、30天
   - 根据用户今日背诵时长，限制每日新卡片总量，避免记忆过载
   - 区分不同天数复习强度：前期精细默写自测，后期快速复盘错题
   - 冲刺阶段额外增加"押题复盘"标注
   - 单独生成错题处理规则：标记错误卡片缩短复习间隔，高频错题3天内重复复盘

3. **输出格式**（严格遵守，不要任何多余解释）：

# 一、考研背诵卡片
## 客观题卡
1. 题干：xxx
   标准答案：xxx
2. 题干：xxx
   标准答案：xxx

## 主观题卡
1. 题干：xxx
   标准答案：xxx
   踩分逻辑：xxx
2. 题干：xxx
   标准答案：xxx
   踩分逻辑：xxx

# 二、艾宾浩斯考研复习日程
第0天（今日新学）：新背诵X张，完整默写1轮，标记记忆模糊卡片
第1天：全部卡片遮盖自测，筛选错题
第2天：优先复盘昨日错题，快速过全部卡片
第4天：仅默写易遗忘核心填空，主观题写框架提纲
第7天：分层精简复盘，冲刺阶段补充押题关联考点
第15天：分层精简复盘，冲刺阶段补充押题关联考点
第30天：分层精简复盘，冲刺阶段补充押题关联考点

# 三、错题处理规则
- 标记错误的卡片缩短复习间隔为原间隔的50%
- 同一张卡片连续2次错误：3天内增加额外复盘
- 高频错题（3次及以上）：纳入每日5分钟快速自测清单`

function buildUserPrompt(
  originalText: string,
  subject: string,
  stage: string,
  dailyMinutes: number
): string {
  return `【待背诵考研原文】：${originalText}
【考研科目】：${subject}
【备考阶段】：${stage}
【今日可背诵时长】：${dailyMinutes}分钟

任务要求：按照上述规则，生成考研专用填空背诵卡片和艾宾浩斯复习规划。严格遵守输出格式。`
}

// Parse AI response text into structured data
function parseAIResponse(text: string): {
  objectiveCards: Array<{ stem: string; answer: string }>
  subjectiveCards: Array<{ stem: string; answer: string; scoringLogic: string }>
  ebbinghausPlan: Array<{ day: number; label: string; task: string }>
  errorRules: string[]
} {
  const objectiveCards: Array<{ stem: string; answer: string }> = []
  const subjectiveCards: Array<{ stem: string; answer: string; scoringLogic: string }> = []
  const ebbinghausPlan: Array<{ day: number; label: string; task: string }> = []
  const errorRules: string[] = []

  // Split into major sections
  const sections = text.split(/^# /gm)
  for (const section of sections) {
    const trimmed = section.trim()

    if (trimmed.startsWith('一、考研背诵卡片') || trimmed.startsWith('一、')) {
      const objectiveMatch = trimmed.match(/##\s*客观题卡\s*\n([\s\S]*?)(?=##\s*主观题卡|$)/)
      const subjectiveMatch = trimmed.match(/##\s*主观题卡\s*\n([\s\S]*?)(?=#|$)/)

      if (objectiveMatch) {
        parseCards(objectiveMatch[1], 'objective', objectiveCards, subjectiveCards)
      }
      if (subjectiveMatch) {
        parseCards(subjectiveMatch[1], 'subjective', objectiveCards, subjectiveCards)
      }
    }

    if (trimmed.startsWith('二、艾宾浩斯') || trimmed.startsWith('二、')) {
      // Match both formats:
      // "第0天（今日新学）：xxx" and "第1天：xxx"
      const dayPattern = /第(\d+)天(?:[（(]([^)）]*)[)）])?[：:]\s*(.+)/g
      let match
      while ((match = dayPattern.exec(trimmed)) !== null) {
        ebbinghausPlan.push({
          day: parseInt(match[1]),
          label: (match[2] || `第${match[1]}天`).trim(),
          task: match[3].trim(),
        })
      }
    }

    if (trimmed.startsWith('三、错题处理规则') || trimmed.startsWith('三、')) {
      const ruleLines = trimmed.split('\n').filter(line => line.trim().startsWith('-'))
      for (const line of ruleLines) {
        errorRules.push(line.replace(/^-\s*/, '').trim())
      }
    }
  }

  return { objectiveCards, subjectiveCards, ebbinghausPlan, errorRules }
}

function parseCards(
  text: string,
  type: 'objective' | 'subjective',
  objectiveCards: Array<{ stem: string; answer: string }>,
  subjectiveCards: Array<{ stem: string; answer: string; scoringLogic: string }>
) {
  const entries = text.split(/\n(?=\d+\.\s*题干)/)
  for (const entry of entries) {
    const stemMatch = entry.match(/题干[：:]\s*(.+)/)
    const answerMatch = entry.match(/标准答案[：:]\s*(.+)/)
    const logicMatch = entry.match(/踩分逻辑[：:]\s*(.+)/)

    if (stemMatch && answerMatch) {
      if (type === 'objective') {
        objectiveCards.push({
          stem: stemMatch[1].trim(),
          answer: answerMatch[1].trim(),
        })
      } else {
        subjectiveCards.push({
          stem: stemMatch[1].trim(),
          answer: answerMatch[1].trim(),
          scoringLogic: logicMatch ? logicMatch[1].trim() : '',
        })
      }
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const deepseek = new DeepSeekClient()

    if (!deepseek.isConfigured) {
      return NextResponse.json(
        { error: 'DeepSeek API 密钥未配置，请在 .env 中设置 DEEPSEEK_API_KEY', configMissing: true },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { originalText, subject, stage, dailyMinutes, imageBase64 } = body

    if (!originalText && !imageBase64) {
      return NextResponse.json(
        { error: '请提供原文或上传文件' },
        { status: 400 }
      )
    }

    let textToProcess = originalText || ''

    // If image/PDF provided, use DeepSeek-OCR via Hugging Face to extract text
    if (imageBase64) {
      try {
        const extractedText = await ocrExtractText(imageBase64)

        if (extractedText) {
          textToProcess = extractedText + (originalText ? '\n' + originalText : '')
        } else {
          console.warn('DeepSeek-OCR returned empty result')
        }
      } catch (ocrError: any) {
        console.error('SiliconFlow OCR error:', ocrError.message)

        // If user ONLY uploaded an image (no text), surface the error
        if (!originalText) {
          return NextResponse.json(
            { error: `图片文字提取失败：${ocrError.message}` },
            { status: 500 }
          )
        }
        // Otherwise continue with just the original text (image is supplementary)
      }
    }

    if (!textToProcess.trim()) {
      return NextResponse.json(
        { error: '未能提取到文本内容，请手动粘贴原文' },
        { status: 400 }
      )
    }

    // Generate cards using DeepSeek chat
    const userPrompt = buildUserPrompt(
      textToProcess,
      subject || '未指定',
      stage || '基础阶段',
      dailyMinutes || 60
    )

    const result = await deepseek.chat(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.3, maxTokens: 4096 }
    )

    const aiText = result.choices?.[0]?.message?.content || ''

    if (!aiText) {
      return NextResponse.json(
        { error: 'AI 未返回内容，请重试' },
        { status: 500 }
      )
    }

    // Parse the structured response
    const parsed = parseAIResponse(aiText)

    return NextResponse.json({
      success: true,
      ...parsed,
      rawText: aiText,
    })
  } catch (error: any) {
    console.error('Recite generation error:', error)

    if (error.message?.includes('API error 401')) {
      return NextResponse.json(
        { error: 'DeepSeek API 密钥无效，请检查 .env 中的 DEEPSEEK_API_KEY', configMissing: true },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: error.message || '生成失败，请重试' },
      { status: 500 }
    )
  }
}
