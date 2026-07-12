'use client'

import { useStore } from '@/store/useStore'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Square, RotateCcw, Clock, Check, Sparkles, Pencil } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'

const DURATION_OPTIONS = [
  { label: '15分钟', value: 15 },
  { label: '25分钟', value: 25 },
  { label: '45分钟', value: 45 },
]

type Phase = 'setup' | 'running' | 'paused' | 'done'

function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h${m}m` : `${h}h`
}

const CLARITY_LABELS = ['很模糊', '有点模糊', '还行', '比较清晰', '非常清晰']

export default function FocusDrawer() {
  const {
    activePanel, setActivePanel,
    focusRecords, addFocusRecord,
  } = useStore()

  const [phase, setPhase] = useState<Phase>('setup')
  const [taskName, setTaskName] = useState('')
  const [duration, setDuration] = useState(25)
  const [clarity, setClarity] = useState(3)
  const [remaining, setRemaining] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [customMinutes, setCustomMinutes] = useState('')
  const [customSeconds, setCustomSeconds] = useState('')
  const [totalDurationSeconds, setTotalDurationSeconds] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  // Custom time validation
  const customTotalSeconds = (parseInt(customMinutes) || 0) * 60 + (parseInt(customSeconds) || 0)
  const isValidCustom = customTotalSeconds >= 60 && customTotalSeconds <= 5999

  // All callbacks (before early return)
  const handleSelectPreset = useCallback((val: number) => {
    setDuration(val)
    setShowCustom(false)
    setCustomMinutes('')
    setCustomSeconds('')
  }, [])

  const handleOpenCustom = useCallback(() => {
    setShowCustom(true)
  }, [])

  const handleClose = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setPhase('setup')
    setTaskName('')
    setRemaining(0)
    setTotalDurationSeconds(0)
    setShowCustom(false)
    setCustomMinutes('')
    setCustomSeconds('')
    setClarity(3)
    setSubmitted(false)
    setActivePanel(null)
  }, [setActivePanel])

  const handleStart = useCallback(() => {
    const secs = showCustom ? (parseInt(customMinutes) || 0) * 60 + (parseInt(customSeconds) || 0) : duration * 60
    if (secs <= 0) return
    setRemaining(secs)
    setTotalDurationSeconds(secs)
    setPhase('running')
  }, [duration, showCustom, customMinutes, customSeconds])

  const handlePause = useCallback(() => setPhase('paused'), [])
  const handleResume = useCallback(() => setPhase('running'), [])

  const handleStop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setPhase('setup')
    setTaskName('')
    setRemaining(0)
    setTotalDurationSeconds(0)
  }, [])

  const handleFinishSubmit = useCallback(() => {
    const name = taskName.trim() || '专注学习'
    const recordMinutes = totalDurationSeconds > 0 ? Math.ceil(totalDurationSeconds / 60) : duration
    addFocusRecord(name, clarity, recordMinutes)
    setSubmitted(true)
    setTimeout(() => {
      setPhase('setup')
      setTaskName('')
      setRemaining(0)
      setTotalDurationSeconds(0)
      setClarity(3)
      setSubmitted(false)
      setShowCustom(false)
      setCustomMinutes('')
      setCustomSeconds('')
    }, 1800)
  }, [taskName, clarity, duration, totalDurationSeconds, addFocusRecord])

  // Timer countdown
  useEffect(() => {
    if (phase === 'running') {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) return 0
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [phase])

  // Auto-transition to done when remaining hits 0
  useEffect(() => {
    if (phase === 'running' && remaining === 0 && (duration > 0 || totalDurationSeconds > 0)) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setPhase('done')
    }
  }, [phase, remaining, duration, totalDurationSeconds])

  // Progress ring
  const totalSeconds = totalDurationSeconds || duration * 60
  const progress = totalSeconds > 0 ? (totalSeconds - remaining) / totalSeconds : 0
  const circumference = 2 * Math.PI * 52

  if (activePanel !== 'focus') return null

  const todayMinutes = focusRecords.reduce((sum, r) => sum + r.durationMinutes, 0)
  const displayTaskName = taskName.trim() || '专注学习'

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
        onClick={() => { if (phase === 'setup') handleClose() }}
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
            onClick={handleClose}
            className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center text-soft-text hover:text-foreground transition-colors text-sm"
            aria-label="关闭"
          >
            &times;
          </button>
          <div className="w-10 h-1 rounded-full bg-earth/25" />
          <div className="w-7" />
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-8">
          <AnimatePresence mode="wait">
            {/* ===== SETUP ===== */}
            {phase === 'setup' && (
              <motion.div key="setup" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-foreground tracking-tight">记录专注</h2>
                  <p className="text-xs text-soft-text mt-1">独立记录，不影响背诵进度</p>
                </div>

                {/* Task name input */}
                <div className="mb-5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Pencil className="w-3 h-3 text-soft-text" />
                    <p className="text-xs text-soft-text">在做什么？</p>
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    placeholder="如：高数极限习题、英语阅读..."
                    className="w-full px-3.5 py-2.5 text-sm bg-white/70 rounded-xl border border-border/50 focus:border-sea-blue focus:ring-1 focus:ring-sea-blue/30 outline-none placeholder:text-soft-text/50 transition-all duration-300"
                  />
                </div>

                {/* Duration selection */}
                <div className="mb-5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Clock className="w-3 h-3 text-soft-text" />
                    <p className="text-xs text-soft-text">专注多久？</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {DURATION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleSelectPreset(opt.value)}
                        className={`py-3 rounded-xl text-sm font-medium transition-all duration-300 active:scale-95 ${
                          !showCustom && duration === opt.value
                            ? 'bg-sea-blue/20 text-sea-blue-deep ring-1 ring-sea-blue/30 shadow-sm'
                            : 'bg-muted/40 text-soft-text hover:text-foreground'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom time */}
                  <AnimatePresence mode="wait">
                    {!showCustom ? (
                      <motion.button
                        key="custom-btn"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleOpenCustom}
                        className="w-full mt-2 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 active:scale-95 flex items-center justify-center gap-1.5 bg-muted/30 text-soft-text hover:text-foreground"
                      >
                        <Pencil className="w-3 h-3" />
                        自定义时间
                      </motion.button>
                    ) : (
                      <motion.div
                        key="custom-form"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 overflow-hidden"
                      >
                        <div className="soft-card p-3">
                          <div className="flex items-center gap-1.5 mb-2.5">
                            <Clock className="w-3 h-3 text-cream-deep" />
                            <p className="text-xs text-cream-deep font-medium">自定义时长</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 relative">
                              <input
                                type="number"
                                min="0"
                                max="99"
                                value={customMinutes}
                                onChange={(e) => setCustomMinutes(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                                placeholder="00"
                                className="w-full text-center text-lg font-light tabular-nums bg-white/70 rounded-xl border border-border/50 focus:border-cream focus:ring-1 focus:ring-cream/30 outline-none placeholder:text-soft-text/40 py-2 transition-all duration-300"
                                autoFocus
                              />
                              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-soft-text/60">分钟</span>
                            </div>
                            <span className="text-lg text-soft-text/40 font-light mb-4">:</span>
                            <div className="flex-1 relative">
                              <input
                                type="number"
                                min="0"
                                max="59"
                                value={customSeconds}
                                onChange={(e) => setCustomSeconds(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                                placeholder="00"
                                className="w-full text-center text-lg font-light tabular-nums bg-white/70 rounded-xl border border-border/50 focus:border-cream focus:ring-1 focus:ring-cream/30 outline-none placeholder:text-soft-text/40 py-2 transition-all duration-300"
                              />
                              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-soft-text/60">秒</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-soft-text/50 mt-5 text-center">
                            {customTotalSeconds >= 60
                              ? `共 ${formatDuration(Math.ceil(customTotalSeconds / 60))}`
                              : '至少 1 分钟'}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Start button */}
                <button
                  onClick={handleStart}
                  disabled={showCustom ? !isValidCustom : false}
                  className="w-full py-3 rounded-2xl text-sm font-medium bg-moss/15 text-moss hover:bg-moss/25 transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4" />
                  开始专注
                </button>

                {/* Recent focus records */}
                {focusRecords.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-soft-text">专注记录</p>
                      <p className="text-[10px] text-moss bg-moss/10 px-2 py-0.5 rounded-full">
                        今天累计 {formatDuration(todayMinutes)}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      {focusRecords.slice(0, 4).map((r) => (
                        <div key={r.id} className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-white/50">
                          <span className="text-xs text-foreground truncate">{r.taskDescription}</span>
                          <span className="text-[10px] text-soft-text ml-2 flex-shrink-0">{formatDuration(r.durationMinutes)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ===== RUNNING / PAUSED ===== */}
            {(phase === 'running' || phase === 'paused') && (
              <motion.div key="timer" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }} className="flex flex-col items-center py-4">
                <p className="text-sm text-foreground font-medium mb-0.5 text-center">{displayTaskName}</p>
                <p className="text-[10px] text-soft-text mb-6">{phase === 'running' ? '正在专注中...' : '已暂停'}</p>

                <div className="relative w-36 h-36 mb-6">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="4" />
                    <motion.circle
                      cx="60" cy="60" r="52"
                      fill="none"
                      stroke="currentColor"
                      className="text-sea-blue"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      animate={{ strokeDashoffset: circumference * (1 - progress) }}
                      transition={{ duration: 0.5, ease: 'linear' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-light tabular-nums tracking-wider text-foreground">
                      {formatCountdown(remaining)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {phase === 'running' ? (
                    <button onClick={handlePause} className="w-12 h-12 rounded-full bg-cream/40 text-cream-deep flex items-center justify-center hover:bg-cream/60 transition-colors active:scale-95">
                      <Pause className="w-5 h-5" />
                    </button>
                  ) : (
                    <button onClick={handleResume} className="w-12 h-12 rounded-full bg-sea-blue/30 text-sea-blue-deep flex items-center justify-center hover:bg-sea-blue/50 transition-colors active:scale-95">
                      <Play className="w-5 h-5 ml-0.5" />
                    </button>
                  )}
                  <button onClick={handleStop} className="w-10 h-10 rounded-full bg-muted/40 text-soft-text flex items-center justify-center hover:bg-muted/60 transition-colors active:scale-95">
                    <Square className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ===== DONE ===== */}
            {phase === 'done' && (
              <motion.div key="done" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
                {submitted ? (
                  <div className="py-8 text-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }} className="w-14 h-14 rounded-full bg-moss/15 flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="w-6 h-6 text-moss" />
                    </motion.div>
                    <p className="text-base font-medium text-foreground">记录完成</p>
                    <p className="text-xs text-soft-text mt-1">辛苦了</p>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-5">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }} className="w-14 h-14 rounded-full bg-moss/15 flex items-center justify-center mx-auto mb-3">
                        <Check className="w-6 h-6 text-moss" />
                      </motion.div>
                      <p className="text-sm font-medium text-foreground">专注完成</p>
                      <p className="text-xs text-soft-text mt-1">{displayTaskName} · {formatDuration(totalDurationSeconds > 0 ? Math.ceil(totalDurationSeconds / 60) : duration)}</p>
                    </div>
                    <div className="mb-5">
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-xs text-soft-text">模糊</p>
                        <motion.span key={clarity} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-sm font-medium text-foreground">
                          {CLARITY_LABELS[clarity - 1]}
                        </motion.span>
                        <p className="text-xs text-soft-text">清晰</p>
                      </div>
                      <div className="relative py-3">
                        <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted rounded-full -translate-y-1/2" />
                        <motion.div className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-sea-blue to-moss rounded-full -translate-y-1/2" animate={{ width: `${((clarity - 1) / 4) * 100}%` }} transition={{ duration: 0.3 }} />
                        <div className="relative flex justify-between">
                          {[1, 2, 3, 4, 5].map((v) => (
                            <button key={v} onClick={() => setClarity(v)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 ${v <= clarity ? 'bg-white text-moss shadow-md ring-2 ring-moss/20' : 'bg-warm-white text-soft-text ring-1 ring-border'}`}>
                              <span className="text-xs font-medium">{v}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button onClick={handleFinishSubmit} className="w-full py-3 rounded-2xl text-sm font-medium bg-moss/15 text-moss hover:bg-moss/25 transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98]">
                      <Sparkles className="w-4 h-4" />
                      记录这一刻
                    </button>
                    <button onClick={handleStop} className="w-full mt-2 py-2.5 rounded-2xl text-xs text-soft-text hover:text-foreground transition-colors flex items-center justify-center gap-1.5">
                      <RotateCcw className="w-3 h-3" />
                      再来一轮
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}