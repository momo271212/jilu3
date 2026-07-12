'use client'

import { useStore, FEELING_LABELS, FEELING_DURATIONS, type ReciteItem } from '@/store/useStore'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, BookOpen, Edit2, Check, X, Clock, Sparkles, List, Download, Layers } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import ReciteTimer from './ReciteTimer'
import FeelingSelector from './FeelingSelector'
import ReciteAIGenerator from './ReciteAIGenerator'
import ReciteCardStudy from './ReciteCardStudy'

function formatRemaining(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  if (m > 0) return `${m}分${s}秒`
  return `${s}秒`
}

function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function CountdownBar({ itemId, itemName }: { itemId: string; itemName: string }) {
  const { getItemCountdown } = useStore()
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    const update = () => {
      const ms = getItemCountdown(itemId)
      setRemaining(ms)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [itemId, getItemCountdown])

  if (remaining === null) return null
  if (remaining <= 0) return null

  return (
    <div className="mt-2">
      <div className="flex items-center gap-1.5 text-[10px] text-soft-text">
        <Clock className="w-3 h-3" />
        <span>{formatRemaining(remaining)}后变红</span>
      </div>
    </div>
  )
}

function ReciteCountdown({ itemId }: { itemId: string }) {
  const { getItemTimerRemaining } = useStore()
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    const update = () => {
      const secs = getItemTimerRemaining(itemId)
      setRemaining(secs)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [itemId, getItemTimerRemaining])

  if (remaining === null) return null
  if (remaining <= 0) return null

  return (
    <div className="mt-2">
      <div className="flex items-center gap-1.5 text-[10px] text-sea-blue">
        <Clock className="w-3 h-3" />
        <span>背诵倒计时: {formatCountdown(remaining)}</span>
      </div>
    </div>
  )
}

function MiniApple({ color, size = 16 }: { color: 'green' | 'yellow' | 'red'; size?: number }) {
  const isYellow = color === 'yellow'
  const isRed = color === 'red'
  const colors = isYellow
    ? { fill: '#FFD700', stroke: '#E6B800', vein: '#CC9900' }
    : isRed
      ? { fill: '#FF6B6B', stroke: '#E05555', vein: '#CC4444' }
      : { fill: '#7CB968', stroke: '#5E9448', vein: '#4E8040' }

  return (
    <svg viewBox="0 0 20 26" width={size} height={size * 1.3} className="flex-shrink-0">
      {/* Apple body */}
      <ellipse
        cx="10" cy="13" rx="8" ry="10"
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth="0.8"
        opacity="0.9"
      />
      {/* Apple indent at top */}
      <path
        d="M 5 5 Q 10 3 15 5"
        fill="none"
        stroke={colors.stroke}
        strokeWidth="0.6"
        opacity="0.5"
      />
      {/* Stem */}
      <line x1="10" y1="3" x2="10" y2="1" stroke={colors.vein} strokeWidth="0.8" opacity="0.6" />
      {/* Small leaf on apple */}
      <ellipse
        cx="13"
        cy="2"
        rx="3"
        ry="1.5"
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth="0.5"
        opacity="0.7"
        transform={`rotate(30 13 2)`}
      />
    </svg>
  )
}

export default function ReciteDrawer() {
  const {
    reciteItems, leaves, todayFeeling,
    addReciteItem, deleteReciteItem, setFeeling,
    getItemCountdown,
    activePanel, setActivePanel,
    cardSets,
  } = useStore()

  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [recitingId, setRecitingId] = useState<string | null>(null)
  const [completedDuration, setCompletedDuration] = useState<number | null>(null) // New state to store completed duration
  const [showFeelingPanel, setShowFeelingPanel] = useState(false)
  const [activeTab, setActiveTab] = useState<'list' | 'ai'>('list')
  const [studyingCardSetId, setStudyingCardSetId] = useState<string | null>(null)

  // All hooks MUST be before any early return (React rules of hooks)
  const itemCount = reciteItems.length

  const handleAdd = useCallback(() => {
    if (!newName.trim() || itemCount >= 25) return
    addReciteItem(newName.trim())
    setNewName('')
    setShowAddForm(false)
  }, [newName, itemCount, addReciteItem])

  const handleConfirmDelete = useCallback(() => {
    if (deleteId) {
      deleteReciteItem(deleteId)
      setDeleteId(null)
    }
  }, [deleteId, deleteReciteItem])

  const handleStartRecite = useCallback((itemId: string) => {
    setRecitingId(itemId)
  }, [])

  const handleTimerComplete = useCallback((durationMinutes: number) => {
    // Timer completed - now show feeling selector
    setCompletedDuration(durationMinutes)
    setShowFeelingPanel(true)
  }, [])

  const handleCloseTimer = useCallback(() => {
    setRecitingId(null)
    setCompletedDuration(null)
    setShowFeelingPanel(false)
  }, [])

  const handleFeelingSelected = useCallback(() => {
    // This is called when FeelingSelector finishes
    setRecitingId(null)
    setCompletedDuration(null)
    setShowFeelingPanel(false)
  }, [])

  const getLeafColor = useCallback((itemId: string): 'green' | 'yellow' | 'red' => {
    const leaf = leaves.find((l) => l.reciteItemId === itemId)
    return leaf?.color ?? 'green'
  }, [leaves])

  // 必须在条件返回之前定义
  const greenCount = leaves.filter((l) => l.color === 'green').length
  const yellowCount = leaves.filter((l) => l.color === 'yellow').length
  const redCount = leaves.filter((l) => l.color === 'red').length

  if (activePanel !== 'recite') return null

  const deleteItem = deleteId ? reciteItems.find((r) => r.id === deleteId) : null
  const recitingItem = recitingId ? reciteItems.find((r) => r.id === recitingId) : null

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="fixed inset-0 z-50 flex flex-col justify-end"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"
        onClick={() => {
          setActivePanel(null)
          setRecitingId(null)
        }}
      />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative bg-warm-white/95 backdrop-blur-xl rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.08)] flex flex-col max-h-[85vh]"
      >
        {/* Handle + close */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <button
            onClick={() => {
              setActivePanel(null)
              setRecitingId(null)
            }}
            className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center text-soft-text hover:text-foreground transition-colors text-sm"
            aria-label="关闭"
          >
            &times;
          </button>
          <div className="w-10 h-1 rounded-full bg-earth/25" />
          <div className="w-7" />
        </div>

        {/* Header */}
        <div className="px-6 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground tracking-tight">背诵</h2>
              <p className="text-xs text-soft-text mt-0.5">
                {activeTab === 'list' ? `${redCount}红 ${greenCount}绿 · 最多25条` : 'AI智能生成背诵卡片'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Daily feeling selector - only in list tab */}
              {activeTab === 'list' && (
                <button
                  onClick={() => setShowFeelingPanel(!showFeelingPanel)}
                  className="flex items-center gap-1.5 text-[10px] bg-muted/40 px-2.5 py-1 rounded-full hover:bg-muted/60 transition-colors"
                >
                  <span>节奏:</span>
                  {todayFeeling ? (
                    <span className="font-medium text-foreground">
                      {FEELING_LABELS[todayFeeling]}
                    </span>
                  ) : (
                    <span className="text-soft-text">未设置</span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-0.5 bg-muted/30 rounded-xl p-1 mt-3">
            <button
              onClick={() => setActiveTab('list')}
              className={`flex-1 py-2 rounded-lg text-[11px] font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${
                activeTab === 'list' ? 'bg-white shadow-sm text-foreground' : 'text-soft-text hover:text-foreground'
              }`}
            >
              <List className="w-3 h-3" />
              我的背诵
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-2 rounded-lg text-[11px] font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${
                activeTab === 'ai' ? 'bg-white shadow-sm text-foreground' : 'text-soft-text hover:text-foreground'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              AI生成
            </button>
          </div>
        </div>

        {activeTab === 'list' ? (
          <>
            {/* Daily feeling panel */}
            <AnimatePresence>
          {showFeelingPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-6 pb-3 overflow-hidden"
            >
              <div className="soft-card p-3">
                <p className="text-xs font-medium text-foreground mb-2">今天的感觉</p>
                <p className="text-[10px] text-soft-text mb-2.5">
                  选择今天的感觉来设置复习节奏
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(['good', 'neutral', 'bad'] as const).map((feeling) => (
                    <button
                      key={feeling}
                      onClick={() => {
                        setFeeling(feeling)
                        setShowFeelingPanel(false)
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all duration-300 active:scale-95 ${
                        todayFeeling === feeling
                          ? 'bg-moss/15 text-moss border-moss/30'
                          : 'bg-muted/30 text-soft-text hover:bg-muted/50 border-border/30'
                      }`}
                    >
                      <p className="text-sm font-medium">{FEELING_LABELS[feeling]}</p>
                      <p className="text-[10px] opacity-70 mt-0.5">
                        {feeling === 'good' ? '24h' : feeling === 'neutral' ? '12h' : '6h'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2.5 relative">
          {reciteItems.map((item) => {
            const color = getLeafColor(item.id)
            const isRed = color === 'red'

            return (
              <motion.div
                key={item.id}
                layout
                className="soft-card p-3.5"
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">
                    <MiniApple color={color} size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-foreground truncate">{item.name}</h3>
                      <div className="flex items-center gap-1">
                        {item.cardSetId && (
                          <span className="text-[10px] bg-moss/10 text-moss px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Layers className="w-2.5 h-2.5" />
                            卡集
                          </span>
                        )}
                        <button
                          onClick={() => setDeleteId(item.id)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-soft-text/40 hover:text-cream-deep hover:bg-cream/30 transition-colors flex-shrink-0"
                          aria-label="删除"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Countdown timer for green items */}
                    {!isRed && item.lastMemorizedAt && (
                      <CountdownBar itemId={item.id} itemName={item.name} />
                    )}

                    {/* Custom duration display/edit or timer countdown */}
                    {item.timerStartedAt && item.timerDuration ? (
                      <ReciteCountdown itemId={item.id} />
                    ) : (
                      <p className="text-[10px] text-soft-text mt-0.5">
                        {todayFeeling ? `复习间隔: ${FEELING_LABELS[todayFeeling]} (${Math.floor(FEELING_DURATIONS[todayFeeling] / 1000 / 60)}分钟)` : '复习间隔: 未设置 (不影响)'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Recite button for red items / card study for AI sets */}
                {(isRed || item.lastMemorizedAt === null) && (
                  <div className="mt-2.5 flex justify-end">
                    {item.cardSetId ? (
                      <button
                        onClick={() => setStudyingCardSetId(item.cardSetId!)}
                        className="flex items-center gap-1.5 text-xs font-medium text-sea-blue-deep bg-sea-blue/15 px-4 py-2 rounded-full hover:bg-sea-blue/25 transition-all duration-300 active:scale-95"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        开始自测
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartRecite(item.id)}
                        className="flex items-center gap-1.5 text-xs font-medium text-moss bg-moss/10 px-4 py-2 rounded-full hover:bg-moss/20 transition-all duration-300 active:scale-95"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        开始背诵
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            )
          })}

          {/* Add button / form */}
          <AnimatePresence mode="wait">
            {!showAddForm ? (
              <motion.button
                key="add-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAddForm(true)}
                disabled={itemCount >= 25}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-border/50 text-soft-text hover:text-foreground hover:border-cream/60 transition-all duration-300 flex items-center justify-center gap-2 text-xs disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                {itemCount >= 25 ? '已达上限（25条）' : '添加背诵内容'}
              </motion.button>
            ) : (
              <motion.div
                key="add-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="soft-card p-4 overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-foreground">添加背诵内容</p>
                  <button onClick={() => { setShowAddForm(false); setNewName(''); }} className="text-soft-text hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  placeholder="如：英语Unit5单词、古诗三首..."
                  className="w-full px-3 py-2 text-sm bg-white/70 rounded-xl border border-border/50 focus:border-sea-blue focus:ring-1 focus:ring-sea-blue/30 outline-none placeholder:text-soft-text/50 transition-all duration-300 mb-3"
                  autoFocus
                />

                <button
                  onClick={handleAdd}
                  disabled={!newName.trim() || itemCount >= 25}
                  className="w-full py-2 rounded-xl text-xs font-medium bg-moss/15 text-moss hover:bg-moss/25 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  添加到树上
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {reciteItems.length === 0 && !showAddForm && (
            <div className="text-center py-8">
              <MiniApple color="green" size={32} />
              <p className="text-sm text-soft-text mt-3">还没有背诵内容</p>
              <p className="text-xs text-soft-text/60 mt-1">添加要背诵的知识点吧</p>
            </div>
          )}
        </div>

          </>
        ) : (
          <ReciteAIGenerator />
        )}
      </motion.div>

      {/* Recite Timer overlay */}
      <AnimatePresence>
        {recitingItem && !showFeelingPanel && (
          <ReciteTimer
            key={recitingItem.id}
            itemId={recitingItem.id}
            itemName={recitingItem.name}
            onClose={handleCloseTimer}
            onComplete={handleTimerComplete}
          />
        )}
      </AnimatePresence>

      {/* Feeling Selector overlay - shows after timer completes */}
      <AnimatePresence>
        {showFeelingPanel && recitingItem && completedDuration !== null && (
          <FeelingSelector
            key={`feeling-${recitingItem.id}`}
            itemId={recitingItem.id}
            itemName={recitingItem.name}
            completedDuration={completedDuration}
            onClose={handleFeelingSelected}
          />
        )}
      </AnimatePresence>

      {/* Confirm delete dialog */}
      <AnimatePresence>
        {deleteItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-end justify-center px-8 pb-24"
            onClick={() => setDeleteId(null)}
          >
            <motion.div
              initial={{ y: 20, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="soft-card p-5 w-full max-w-sm shadow-lg"
            >
              <p className="text-sm font-medium text-foreground text-center mb-1">
                确定删除「{deleteItem.name}」？
              </p>
              <p className="text-xs text-soft-text text-center mb-4">树上对应的苹果也会消失</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs text-soft-text bg-muted/40 hover:bg-muted/60 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 rounded-xl text-xs font-medium text-cream-deep bg-cream/50 hover:bg-cream/70 transition-colors flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  删除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Study overlay */}
      <AnimatePresence>
        {studyingCardSetId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-end justify-center"
            onClick={() => setStudyingCardSetId(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-warm-white/98 backdrop-blur-xl rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.12)] w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-5 pt-3 pb-2 sticky top-0 bg-warm-white/95 z-10">
                <button
                  onClick={() => setStudyingCardSetId(null)}
                  className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center text-soft-text hover:text-foreground transition-colors text-sm"
                >
                  ×
                </button>
                <div className="w-10 h-1 rounded-full bg-earth/25" />
                <div className="w-7" />
              </div>
              <div className="px-6 pb-8">
                <ReciteCardStudy
                  cardSetId={studyingCardSetId}
                  onBack={() => setStudyingCardSetId(null)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
