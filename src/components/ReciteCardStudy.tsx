'use client'

import { useStore, type ReciteCard, type GeneratedCardSet } from '@/store/useStore'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Check, X, RotateCcw, Eye, EyeOff, Trophy, AlertCircle } from 'lucide-react'
import { useState, useCallback, useMemo } from 'react'

interface ReciteCardStudyProps {
  cardSetId: string
  onBack: () => void
}

export default function ReciteCardStudy({ cardSetId, onBack }: ReciteCardStudyProps) {
  const { cardSets, markCardAnswer } = useStore()
  const cardSet = cardSets.find((cs) => cs.id === cardSetId)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [showAnswer, setShowAnswer] = useState(false)
  const [studyComplete, setStudyComplete] = useState(false)
  const [answers, setAnswers] = useState<Record<string, { userAnswer: string; isCorrect: boolean }>>({})

  const allCards: ReciteCard[] = useMemo(() => {
    if (!cardSet) return []
    return [...cardSet.objectiveCards, ...cardSet.subjectiveCards]
  }, [cardSet])

  const currentCard = allCards[currentIndex]
  const answeredCount = Object.keys(answers).length
  const correctCount = Object.values(answers).filter((a) => a.isCorrect).length
  const progress = allCards.length > 0 ? (answeredCount / allCards.length) * 100 : 0

  // Get card's answer state
  const cardAnswerState = currentCard ? answers[currentCard.id] : null
  const isCardAnswered = !!cardAnswerState

  // Check answer
  const handleCheck = useCallback(() => {
    if (!currentCard || !cardSet) return
    setShowAnswer(true)

    // Simple comparison: check if user answer contains key terms from the standard answer
    const userLower = userAnswer.trim().toLowerCase()
    const expectedLower = currentCard.answer.trim().toLowerCase()

    // Extract key phrases from expected answer (split by common separators)
    const keyPhrases = expectedLower
      .split(/[，,、；;。.\s]+/)
      .filter((p) => p.length > 1)

    // Consider correct if user answer matches at least 40% of key phrases
    const matchedPhrases = keyPhrases.filter((phrase) => userLower.includes(phrase))
    const matchRatio = keyPhrases.length > 0 ? matchedPhrases.length / keyPhrases.length : 0
    const isCorrect = matchRatio >= 0.4 || userLower.includes(expectedLower.slice(0, Math.max(10, expectedLower.length * 0.3)))

    setAnswers((prev) => ({
      ...prev,
      [currentCard.id]: { userAnswer: userAnswer.trim(), isCorrect },
    }))

    markCardAnswer(cardSetId, currentCard.id, userAnswer.trim(), isCorrect)
  }, [currentCard, cardSet, userAnswer, cardSetId, markCardAnswer])

  // Next card
  const handleNext = useCallback(() => {
    if (currentIndex < allCards.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setUserAnswer('')
      setShowAnswer(false)
    } else {
      setStudyComplete(true)
    }
  }, [currentIndex, allCards.length])

  // Previous card
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
      setUserAnswer('')
      setShowAnswer(false)
    }
  }, [currentIndex])

  // Reset study
  const handleReset = useCallback(() => {
    setCurrentIndex(0)
    setUserAnswer('')
    setShowAnswer(false)
    setStudyComplete(false)
    setAnswers({})
  }, [])

  if (!cardSet) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-soft-text">卡片数据不存在</p>
        <button onClick={onBack} className="mt-3 text-xs text-moss font-medium">返回</button>
      </div>
    )
  }

  if (studyComplete) {
    const total = allCards.length
    const wrongCount = total - correctCount
    const score = total > 0 ? Math.round((correctCount / total) * 100) : 0

    const wrongCards = allCards.filter((c) => {
      const a = answers[c.id]
      return a && !a.isCorrect
    })

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-4"
      >
        {/* Score display */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12 }}
          className="w-20 h-20 rounded-full bg-moss/10 flex items-center justify-center mx-auto mb-4"
        >
          <Trophy className="w-8 h-8 text-moss" />
        </motion.div>

        <h3 className="text-lg font-semibold text-foreground mb-1">自测完成！</h3>
        <p className="text-sm text-soft-text mb-4">
          共 {total} 张卡片 · 正确 {correctCount} · 错误 {wrongCount}
        </p>

        {/* Score bar */}
        <div className="w-full h-2 bg-muted/40 rounded-full overflow-hidden mb-6">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full rounded-full ${score >= 70 ? 'bg-moss' : score >= 40 ? 'bg-lemon-deep' : 'bg-cream-deep'}`}
          />
        </div>
        <p className="text-[10px] text-soft-text/60 mb-6">正确率 {score}%</p>

        {/* Wrong cards review */}
        {wrongCards.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center justify-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-cream-deep" />
              需要加强的卡片 ({wrongCards.length}张)
            </h4>
            <div className="space-y-2">
              {wrongCards.map((card) => (
                <div key={card.id} className="soft-card p-3 text-left">
                  <p className="text-xs text-foreground mb-1 line-clamp-2">{card.stem}</p>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-soft-text/60 flex-shrink-0 mt-0.5">你的答案：</span>
                    <p className="text-[10px] text-cream-deep line-clamp-2">{answers[card.id]?.userAnswer || '未作答'}</p>
                  </div>
                  <div className="flex items-start gap-2 mt-1">
                    <span className="text-[10px] text-moss/60 flex-shrink-0 mt-0.5">标准答案：</span>
                    <p className="text-[10px] text-moss line-clamp-3">{card.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex-1 py-2.5 rounded-xl text-xs font-medium bg-moss/15 text-moss hover:bg-moss/25 transition-all flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重新自测
          </button>
          <button
            onClick={onBack}
            className="flex-1 py-2.5 rounded-xl text-xs text-soft-text bg-muted/40 hover:bg-muted/60 transition-colors flex items-center justify-center gap-1.5"
          >
            返回卡片
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <div>
      {/* Progress header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-soft-text hover:text-foreground transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 mx-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-soft-text">
              {currentIndex + 1} / {allCards.length}
            </span>
            <span className="text-[10px] text-soft-text">
              正确 {correctCount} · 错误 {answeredCount - correctCount}
            </span>
          </div>
          <div className="w-full h-1.5 bg-muted/40 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-moss rounded-full"
            />
          </div>
        </div>
        <div className="w-5" />
      </div>

      {/* Card type badge */}
      {currentCard && (
        <div className="mb-3">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
            currentCard.type === 'objective'
              ? 'bg-moss/10 text-moss'
              : 'bg-sea-blue/10 text-sea-blue-deep'
          }`}>
            {currentCard.type === 'objective' ? '客观题' : '主观题'}
          </span>
        </div>
      )}

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentCard?.id || 'empty'}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.25 }}
          className="soft-card p-5 mb-4"
        >
          <p className="text-xs font-medium text-foreground mb-4 leading-relaxed">
            {currentCard?.stem.split('____').map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span className="inline-block mx-1 px-2 py-0.5 bg-cream/20 text-cream-deep rounded text-[11px] font-medium border border-dashed border-cream/40">
                      ？？
                    </span>
                )}
              </span>
            ))}
          </p>

          {currentCard?.scoringLogic && (
            <p className="text-[10px] text-sea-blue-deep bg-sea-blue/5 rounded-lg px-3 py-2">
              提示：{currentCard.scoringLogic}
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Answer input */}
      {!isCardAnswered ? (
        <div className="mb-4">
          <textarea
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="在此输入你的答案..."
            rows={3}
            className="w-full px-4 py-3 text-sm bg-white/70 rounded-2xl border border-border/50 focus:border-moss focus:ring-1 focus:ring-moss/30 outline-none placeholder:text-soft-text/40 resize-none transition-all duration-300"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) handleCheck()
            }}
          />

          <button
            onClick={handleCheck}
            disabled={!userAnswer.trim()}
            className="w-full mt-3 py-2.5 rounded-xl text-xs font-medium bg-moss/15 text-moss hover:bg-moss/25 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Eye className="w-3.5 h-3.5" />
            检查答案
          </button>
          <p className="text-[10px] text-soft-text/40 text-center mt-1.5">Ctrl + Enter 快捷提交</p>
        </div>
      ) : (
        /* Answer result */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          {/* Standard answer */}
          <div className={`soft-card p-4 mb-3 border ${
            cardAnswerState.isCorrect
              ? 'border-moss/30 bg-moss/5'
              : 'border-cream/30 bg-cream/5'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[11px] font-semibold ${
                cardAnswerState.isCorrect ? 'text-moss' : 'text-cream-deep'
              }`}>
                {cardAnswerState.isCorrect ? '✓ 回答正确' : '✗ 需要复习'}
              </span>
            </div>
            <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
              {currentCard?.answer}
            </p>
            {currentCard?.scoringLogic && (
              <div className="mt-2 pt-2 border-t border-border/30">
                <p className="text-[10px] font-medium text-sea-blue-deep mb-0.5">踩分逻辑：</p>
                <p className="text-[10px] text-soft-text">{currentCard.scoringLogic}</p>
              </div>
            )}
          </div>

          {/* User's answer comparison */}
          <div className="soft-card p-3 bg-muted/20">
            <p className="text-[10px] text-soft-text/60 mb-1">你的答案：</p>
            <p className="text-xs text-soft-text">{cardAnswerState.userAnswer || '未作答'}</p>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center text-soft-text hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="flex-1 py-2.5 rounded-xl text-xs font-medium bg-moss/15 text-moss hover:bg-moss/25 transition-all flex items-center justify-center gap-1.5"
            >
              {currentIndex < allCards.length - 1 ? (
                <>
                  下一张
                  <ChevronRight className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <Trophy className="w-3.5 h-3.5" />
                  完成自测
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
