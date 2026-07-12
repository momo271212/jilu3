'use client'

import { useStore, FEELING_LABELS, FEELING_DURATIONS, type FeelingType } from '@/store/useStore'
import { motion, AnimatePresence } from 'framer-motion'
import { Apple, Zap, Wind } from 'lucide-react'

export default function PaceDrawer() {
  const { todayFeeling, setFeeling, activePanel, setActivePanel } = useStore()

  if (activePanel !== 'pace') return null

  const SPEED_OPTIONS: { id: FeelingType; icon: React.ReactNode; animDuration: number; desc: string }[] = [
    { id: 'good', icon: <Wind className="w-4 h-4" />, animDuration: 4, desc: '苹果24小时后可再次复习' },
    { id: 'neutral', icon: <Apple className="w-4 h-4" />, animDuration: 2.5, desc: '苹果12小时后可再次复习' },
    { id: 'bad', icon: <Zap className="w-4 h-4" />, animDuration: 1.5, desc: '苹果6小时后可再次复习' },
  ]

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
        onClick={() => setActivePanel(null)}
      />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative bg-warm-white/95 backdrop-blur-xl rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.08)] flex flex-col"
      >
        {/* Handle */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <button
            onClick={() => setActivePanel(null)}
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
          <h2 className="text-lg font-semibold text-foreground tracking-tight">今天感觉怎么样？</h2>
          <p className="text-xs text-soft-text mt-1">选择学习节奏，影响苹果变绿的速度</p>
        </div>

        {/* Comfort text */}
        <div className="px-6 pb-5">
          <p className="text-sm text-soft-text leading-relaxed">
            你不需要每天都很好。<br />允许自己是一个普通人。
          </p>
        </div>

        {/* Options */}
        <div className="px-6 pb-8 space-y-3">
          {SPEED_OPTIONS.map((opt, i) => {
            const isActive = todayFeeling === opt.id
            return (
              <motion.button
                key={opt.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                onClick={() => setFeeling(opt.id)}
                className={`w-full text-left p-4 rounded-2xl transition-all duration-400 active:scale-[0.98] ${
                  isActive
                    ? 'bg-sea-blue/20 text-sea-blue-deep ring-1 ring-sea-blue/30'
                    : 'bg-muted/30 text-foreground hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-soft-text">{opt.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">{FEELING_LABELS[opt.id]}</h3>
                      <span className="text-[10px] opacity-60">{Math.floor(FEELING_DURATIONS[opt.id] / 1000 / 60)}分钟</span>
                    </div>
                    <p className="text-xs mt-0.5 opacity-60 leading-relaxed">{opt.desc}</p>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}