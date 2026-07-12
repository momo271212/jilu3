'use client'

import { useStore, type GeneratedCardSet, type ReciteCard } from '@/store/useStore'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2, X, ChevronLeft, ChevronRight, Check, RotateCcw, FileUp, BookOpen, Calendar, Play, Save, Eye, EyeOff, Download } from 'lucide-react'
import { useState, useCallback, useRef } from 'react'
import ReciteCardStudy from './ReciteCardStudy'

const SUBJECTS = [
  '政治', '英语一', '英语二',
  '数学一', '数学二', '数学三',
  '311教育学', '408计算机', '其他专业课',
]

const STAGES = ['基础阶段', '强化阶段', '冲刺背诵阶段']

interface GenerateResponse {
  success: boolean
  objectiveCards: Array<{ stem: string; answer: string }>
  subjectiveCards: Array<{ stem: string; answer: string; scoringLogic: string }>
  ebbinghausPlan: Array<{ day: number; label: string; task: string }>
  errorRules: string[]
  error?: string
  configMissing?: boolean
  rawText?: string
}

export default function ReciteAIGenerator() {
  const { cardSets, aiGenerating, setAiGenerating, addCardSet, clearCardSet } = useStore()

  // Input state
  const [originalText, setOriginalText] = useState('')
  const [subject, setSubject] = useState('政治')
  const [customSubject, setCustomSubject] = useState('')
  const [stage, setStage] = useState('强化阶段')
  const [dailyMinutes, setDailyMinutes] = useState(90)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileBase64, setFileBase64] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [configMissing, setConfigMissing] = useState(false)

  // Results state
  const [result, setResult] = useState<GenerateResponse | null>(null)
  const [activeTab, setActiveTab] = useState<'cards' | 'schedule' | 'study'>('cards')
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set())
  const [showStudy, setShowStudy] = useState(false)
  const [currentCardSetId, setCurrentCardSetId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check config on mount
  const checkConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/recite/config')
      const data = await res.json()
      setConfigMissing(!data.configured)
    } catch {
      setConfigMissing(true)
    }
  }, [])

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('文件大小不能超过10MB')
      return
    }

    // Check file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      setError('仅支持 PNG、JPG、PDF 文件')
      return
    }

    setSelectedFile(file)
    setError(null)

    // Convert to base64
    const reader = new FileReader()
    reader.onload = () => {
      setFileBase64(reader.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null)
    setFileBase64(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Generate cards
  const handleGenerate = useCallback(async () => {
    if (!originalText.trim() && !fileBase64) {
      setError('请粘贴原文或上传文件')
      return
    }

    setError(null)
    setAiGenerating(true)
    setResult(null)

    try {
      const response = await fetch('/api/recite/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalText: originalText.trim(),
          subject: subject === '其他专业课' ? customSubject : subject,
          stage,
          dailyMinutes,
          imageBase64: fileBase64,
        }),
      })

      const data: GenerateResponse = await response.json()

      if (!response.ok) {
        if (data.configMissing) {
          setConfigMissing(true)
          setError('AI 接口未配置。请在项目根目录创建 .z-ai-config 文件，包含 baseUrl 和 apiKey。')
        } else {
          setError(data.error || '生成失败，请重试')
        }
        setAiGenerating(false)
        return
      }

      if (data.success) {
        setResult(data)

        // Create card set in store
        const setId = `cs_${Date.now()}`
        const cardSet: GeneratedCardSet = {
          id: setId,
          originalText: originalText.trim(),
          subject: subject === '其他专业课' ? customSubject : subject,
          stage,
          createdAt: Date.now(),
          objectiveCards: data.objectiveCards.map((c, i) => ({
            id: `${setId}_obj_${i}`,
            type: 'objective',
            stem: c.stem,
            answer: c.answer,
          })),
          subjectiveCards: data.subjectiveCards.map((c, i) => ({
            id: `${setId}_sub_${i}`,
            type: 'subjective',
            stem: c.stem,
            answer: c.answer,
            scoringLogic: c.scoringLogic,
          })),
          ebbinghausPlan: data.ebbinghausPlan,
          errorRules: data.errorRules,
          errorCardIds: [],
        }

        addCardSet(cardSet)
        setCurrentCardSetId(setId)
      }
    } catch (err: any) {
      setError(err.message || '网络错误，请检查连接后重试')
    } finally {
      setAiGenerating(false)
    }
  }, [originalText, subject, customSubject, stage, dailyMinutes, fileBase64, setAiGenerating, addCardSet])

  // Toggle card flip
  const toggleCardFlip = useCallback((cardId: string) => {
    setFlippedCards((prev) => {
      const next = new Set(prev)
      if (next.has(cardId)) next.delete(cardId)
      else next.add(cardId)
      return next
    })
  }, [])

  // Download cards as Markdown
  const handleDownload = useCallback(() => {
    if (!result) return

    const subjectName = subject === '其他专业课' ? customSubject : subject
    const now = new Date()
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    let md = `# 考研背诵卡片\n\n`
    md += `> 科目：${subjectName} | 阶段：${stage} | 生成日期：${dateStr}\n\n`

    if (result.objectiveCards.length > 0) {
      md += `## 客观题卡 (${result.objectiveCards.length}张)\n\n`
      result.objectiveCards.forEach((c, i) => {
        md += `### ${i + 1}.\n`
        md += `- **题干**：${c.stem}\n`
        md += `- **答案**：${c.answer}\n\n`
      })
    }

    if (result.subjectiveCards.length > 0) {
      md += `## 主观题卡 (${result.subjectiveCards.length}张)\n\n`
      result.subjectiveCards.forEach((c, i) => {
        md += `### ${i + 1}.\n`
        md += `- **题干**：${c.stem}\n`
        md += `- **答案**：${c.answer}\n`
        if (c.scoringLogic) md += `- **踩分逻辑**：${c.scoringLogic}\n`
        md += '\n'
      })
    }

    if (result.ebbinghausPlan.length > 0) {
      md += `## 艾宾浩斯复习日程\n\n`
      result.ebbinghausPlan.forEach((e) => {
        md += `- **第${e.day}天（${e.label}）**：${e.task}\n`
      })
      md += '\n'
    }

    if (result.errorRules.length > 0) {
      md += `## 错题处理规则\n\n`
      result.errorRules.forEach((r) => {
        md += `- ${r}\n`
      })
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `背诵卡片_${subjectName}_${dateStr}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [result, subject, customSubject, stage])

  // Reset all
  const handleReset = useCallback(() => {
    setResult(null)
    setOriginalText('')
    setFileBase64(null)
    setSelectedFile(null)
    setActiveTab('cards')
    setFlippedCards(new Set())
    setShowStudy(false)
    setCurrentCardSetId(null)
    setError(null)
  }, [])

  const allCards: ReciteCard[] = result
    ? [
        ...result.objectiveCards.map((c, i) => ({
          id: `obj_${i}`, type: 'objective' as const, stem: c.stem, answer: c.answer,
        })),
        ...result.subjectiveCards.map((c, i) => ({
          id: `sub_${i}`, type: 'subjective' as const, stem: c.stem, answer: c.answer, scoringLogic: c.scoringLogic,
        })),
      ]
    : []

  const isFormValid = originalText.trim().length > 0 || fileBase64
  const effectiveSubject = subject === '其他专业课' ? customSubject : subject

  return (
    <div className="flex-1 overflow-y-auto px-6 pb-6">
      {/* Config missing warning */}
      {configMissing && !result && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="soft-card p-4 mb-4 border border-cream-deep/30 bg-cream/10"
        >
          <p className="text-xs font-medium text-cream-deep mb-2">DeepSeek API 未配置</p>
          <p className="text-[10px] text-soft-text mb-3">
            在项目根目录的 <code className="bg-muted/50 px-1 rounded">.env</code> 文件中添加：
          </p>
          <pre className="text-[10px] bg-muted/30 rounded-lg p-3 text-soft-text overflow-x-auto whitespace-pre-wrap">
{`DEEPSEEK_API_KEY=你的DeepSeek密钥
DEEPSEEK_BASE_URL=https://api.deepseek.com`}
</pre>
          <p className="text-[10px] text-soft-text/60 mt-2">
            密钥可在 <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer" className="text-sea-blue-deep underline">platform.deepseek.com</a> 获取
          </p>
          <button
            onClick={() => { checkConfig(); setError(null) }}
            className="mt-3 text-xs text-moss font-medium hover:underline"
          >
            已配置？点击检查
          </button>
        </motion.div>
      )}

      {/* Input Form */}
      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Subject selector */}
            <div className="mb-4">
              <label className="text-xs font-medium text-foreground mb-2 block">考研科目</label>
              <div className="flex flex-wrap gap-1.5">
                {SUBJECTS.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setSubject(sub)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200 ${
                      subject === sub
                        ? 'bg-moss/20 text-moss ring-1 ring-moss/30'
                        : 'bg-muted/30 text-soft-text hover:bg-muted/50'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
              {subject === '其他专业课' && (
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="输入专业课名称，如：431金融学"
                  className="mt-2 w-full px-3 py-2 text-xs bg-white/70 rounded-xl border border-border/50 focus:border-moss focus:ring-1 focus:ring-moss/30 outline-none placeholder:text-soft-text/50"
                />
              )}
            </div>

            {/* Stage selector */}
            <div className="mb-4">
              <label className="text-xs font-medium text-foreground mb-2 block">备考阶段</label>
              <div className="flex gap-2">
                {STAGES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStage(s)}
                    className={`flex-1 py-2 rounded-xl text-[11px] font-medium transition-all duration-200 ${
                      stage === s
                        ? 'bg-sea-blue/20 text-sea-blue-deep ring-1 ring-sea-blue/30'
                        : 'bg-muted/30 text-soft-text hover:bg-muted/50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Daily study time */}
            <div className="mb-4">
              <label className="text-xs font-medium text-foreground mb-2 block">今日可背诵时长（分钟）</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={dailyMinutes}
                  onChange={(e) => setDailyMinutes(Math.max(1, Math.min(480, parseInt(e.target.value) || 1)))}
                  min={1}
                  max={480}
                  className="w-24 px-3 py-2 text-sm text-center bg-white/70 rounded-xl border border-border/50 focus:border-moss focus:ring-1 focus:ring-moss/30 outline-none"
                />
                <span className="text-xs text-soft-text">分钟</span>
                <div className="flex gap-1 ml-2">
                  {[25, 45, 90, 120].map((t) => (
                    <button
                      key={t}
                      onClick={() => setDailyMinutes(t)}
                      className={`px-2 py-1 rounded-lg text-[10px] transition-all ${
                        dailyMinutes === t
                          ? 'bg-moss/15 text-moss'
                          : 'bg-muted/30 text-soft-text hover:bg-muted/50'
                      }`}
                    >
                      {t}分钟
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Text input */}
            <div className="mb-3">
              <label className="text-xs font-medium text-foreground mb-2 block">
                粘贴背诵原文（专业课讲义/政治知识点/英语长难句/作文素材）
              </label>
              <textarea
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
                placeholder="在此粘贴需要背诵的原文内容...&#10;&#10;例如：&#10;马克思主义是由马克思和恩格斯创立的，是关于自然、社会和思维发展一般规律的学说...&#10;The fundamental reason for the French Revolution was the conflict between the rising bourgeoisie..."
                rows={8}
                className="w-full px-4 py-3 text-sm bg-white/70 rounded-2xl border border-border/50 focus:border-moss focus:ring-1 focus:ring-moss/30 outline-none placeholder:text-soft-text/40 resize-none transition-all duration-300"
              />
            </div>

            {/* File upload */}
            <div className="mb-4">
              <label className="text-xs font-medium text-foreground mb-2 block">
                上传PDF/图片（自动 OCR 提取文字 → 硅基流动 DeepSeek-OCR）
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!selectedFile ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-border/50 text-soft-text hover:text-foreground hover:border-moss/40 transition-all duration-300 flex items-center justify-center gap-2 text-xs"
                >
                  <FileUp className="w-4 h-4" />
                  点击上传 PDF 或图片（最大10MB）
                </button>
              ) : (
                <div className="flex items-center justify-between bg-moss/5 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileUp className="w-4 h-4 text-moss flex-shrink-0" />
                    <span className="text-xs text-foreground truncate">{selectedFile.name}</span>
                    <span className="text-[10px] text-soft-text flex-shrink-0">
                      ({(selectedFile.size / 1024).toFixed(1)}KB)
                    </span>
                  </div>
                  <button onClick={handleRemoveFile} className="text-soft-text hover:text-cream-deep ml-2 flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-[11px] text-cream-deep mb-3 bg-cream/10 rounded-lg px-3 py-2"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={!isFormValid || aiGenerating}
              className="w-full py-3.5 rounded-2xl text-sm font-medium bg-moss/15 text-moss hover:bg-moss/25 transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {aiGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI 正在生成背诵卡片...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  生成背诵卡
                </>
              )}
            </button>

            {/* Loading animation */}
            <AnimatePresence>
              {aiGenerating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 text-center"
                >
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-moss animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-moss animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-moss animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <p className="text-[10px] text-soft-text/60">
                    正在分析内容并生成背诵卡片，请稍候...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : showStudy && currentCardSetId ? (
          /* Self-test mode */
          <motion.div key="study" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ReciteCardStudy
              cardSetId={currentCardSetId}
              onBack={() => setShowStudy(false)}
            />
          </motion.div>
        ) : (
          /* Results view */
          <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {/* Result tabs */}
            <div className="flex items-center gap-1 bg-muted/30 rounded-xl p-1 mb-4">
              <button
                onClick={() => setActiveTab('cards')}
                className={`flex-1 py-2 rounded-lg text-[11px] font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  activeTab === 'cards' ? 'bg-white shadow-sm text-foreground' : 'text-soft-text hover:text-foreground'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                背诵卡片 ({allCards.length})
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`flex-1 py-2 rounded-lg text-[11px] font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  activeTab === 'schedule' ? 'bg-white shadow-sm text-foreground' : 'text-soft-text hover:text-foreground'
                }`}
              >
                <Calendar className="w-3 h-3" />
                复习日程
              </button>
              <button
                onClick={() => setShowStudy(true)}
                className="flex-1 py-2 rounded-lg text-[11px] font-medium bg-moss/15 text-moss transition-all duration-200 flex items-center justify-center gap-1.5 hover:bg-moss/25"
              >
                <Play className="w-3 h-3" />
                自测模式
              </button>
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {activeTab === 'cards' && (
                <motion.div
                  key="cards"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Objective cards */}
                  {result.objectiveCards.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <span className="w-1 h-3 bg-moss rounded-full" />
                        客观题卡 ({result.objectiveCards.length}张)
                      </h4>
                      <div className="space-y-2">
                        {result.objectiveCards.map((card, i) => {
                          const cardId = `obj_${i}`
                          const isFlipped = flippedCards.has(cardId)
                          return (
                            <CardFlipItem
                              key={cardId}
                              card={{ type: 'objective', stem: card.stem, answer: card.answer }}
                              isFlipped={isFlipped}
                              onFlip={() => toggleCardFlip(cardId)}
                              index={i}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Subjective cards */}
                  {result.subjectiveCards.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <span className="w-1 h-3 bg-sea-blue-deep rounded-full" />
                        主观题卡 ({result.subjectiveCards.length}张)
                      </h4>
                      <div className="space-y-2">
                        {result.subjectiveCards.map((card, i) => {
                          const cardId = `sub_${i}`
                          const isFlipped = flippedCards.has(cardId)
                          return (
                            <CardFlipItem
                              key={cardId}
                              card={{ type: 'subjective', stem: card.stem, answer: card.answer, scoringLogic: card.scoringLogic }}
                              isFlipped={isFlipped}
                              onFlip={() => toggleCardFlip(cardId)}
                              index={i}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Save / Download buttons */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border/30">
                    <button
                      onClick={() => currentCardSetId && useStore.getState().saveAllCardsAsReciteItems(currentCardSetId)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-medium bg-moss/15 text-moss hover:bg-moss/25 transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-[0.98]"
                    >
                      <Save className="w-3.5 h-3.5" />
                      保存到树上
                    </button>
                    <button
                      onClick={handleDownload}
                      className="py-2.5 px-3 rounded-xl text-xs font-medium bg-sea-blue/15 text-sea-blue-deep hover:bg-sea-blue/25 transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-[0.98]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      下载
                    </button>
                    <button
                      onClick={handleReset}
                      className="py-2.5 px-3 rounded-xl text-xs text-soft-text bg-muted/40 hover:bg-muted/60 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      重生成
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'schedule' && (
                <motion.div
                  key="schedule"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Ebbinghaus schedule */}
                  <div className="relative pl-6 border-l-2 border-moss/20">
                    {result.ebbinghausPlan.map((entry, i) => (
                      <div key={i} className="mb-4 relative">
                        {/* Timeline dot */}
                        <div className={`absolute -left-[calc(0.75rem+1px)] top-0.5 w-3 h-3 rounded-full border-2 ${
                          entry.day === 0
                            ? 'bg-moss border-moss'
                            : entry.day <= 2
                              ? 'bg-white border-moss'
                              : entry.day <= 7
                                ? 'bg-white border-sea-blue-deep'
                                : 'bg-white border-earth'
                        }`} />

                        <div className="soft-card p-3.5">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-foreground">
                              第{entry.day}天
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                              entry.day === 0
                                ? 'bg-moss/15 text-moss'
                                : entry.day <= 2
                                  ? 'bg-moss/10 text-moss'
                                  : entry.day <= 7
                                    ? 'bg-sea-blue/15 text-sea-blue-deep'
                                    : 'bg-earth/15 text-earth-deep'
                            }`}>
                              {entry.label}
                            </span>
                          </div>
                          <p className="text-xs text-soft-text leading-relaxed">{entry.task}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Error rules */}
                  {result.errorRules.length > 0 && (
                    <div className="mt-4 soft-card p-4 bg-cream/5 border border-cream/20">
                      <h4 className="text-xs font-semibold text-cream-deep mb-2">错题处理规则</h4>
                      <ul className="space-y-1.5">
                        {result.errorRules.map((rule, i) => (
                          <li key={i} className="text-[11px] text-soft-text flex items-start gap-1.5">
                            <span className="text-cream-deep mt-0.5">•</span>
                            {rule}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Card flip component
function CardFlipItem({
  card, isFlipped, onFlip, index,
}: {
  card: { type: string; stem: string; answer: string; scoringLogic?: string }
  isFlipped: boolean
  onFlip: () => void
  index: number
}) {
  return (
    <div
      className="soft-card p-4 cursor-pointer active:scale-[0.99] transition-all duration-200"
      onClick={onFlip}
      style={{ perspective: '1000px' }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-soft-text/60">
          第{index + 1}张 · {card.type === 'objective' ? '客观题' : '主观题'}
        </span>
        <button onClick={(e) => { e.stopPropagation(); onFlip() }} className="text-soft-text/40 hover:text-foreground transition-colors">
          {isFlipped ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {isFlipped ? (
          <motion.div
            key="back"
            initial={{ opacity: 0, rotateX: 90 }}
            animate={{ opacity: 1, rotateX: 0 }}
            exit={{ opacity: 0, rotateX: -90 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-xs font-medium text-moss mb-1">标准答案：</p>
            <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{card.answer}</p>
            {card.scoringLogic && (
              <div className="mt-2 pt-2 border-t border-border/30">
                <p className="text-[10px] font-medium text-sea-blue-deep mb-0.5">踩分逻辑：</p>
                <p className="text-[10px] text-soft-text">{card.scoringLogic}</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="front"
            initial={{ opacity: 0, rotateX: -90 }}
            animate={{ opacity: 1, rotateX: 0 }}
            exit={{ opacity: 0, rotateX: 90 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-xs font-medium text-foreground mb-1">题干：</p>
            <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
              {card.stem.split('____').map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span className="inline-block mx-0.5 px-2 py-0.5 bg-moss/10 text-moss rounded text-[11px] font-medium border border-dashed border-moss/30">
                      ______
                    </span>
                  )}
                </span>
              ))}
            </p>
            <p className="text-[10px] text-soft-text/50 mt-2">点击翻转查看答案</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
