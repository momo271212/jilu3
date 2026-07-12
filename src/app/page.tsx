'use client'

import { useStore } from '@/store/useStore'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Heart, Brain, Apple, Calendar } from 'lucide-react'
import GrowthTree from '@/components/GrowthTree'
import ReciteDrawer from '@/components/ReciteDrawer'
import PaceDrawer from '@/components/PaceDrawer'
import FocusDrawer from '@/components/FocusDrawer'
import SummaryDrawer from '@/components/SummaryDrawer'
import DistractionBubble from '@/components/DistractionBubble'
import { useEffect, useState } from 'react'

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 6) return '夜深了，早点休息吧'
  if (h < 9) return '早上好，今天慢慢来就好'
  if (h < 12) return '上午好，按照自己的节奏走'
  if (h < 14) return '中午好，吃完饭歇一会儿'
  if (h < 17) return '下午好，累了就歇一会'
  if (h < 19) return '傍晚好，今天辛苦了'
  return '晚上好，今天做得够多了'
}

function getLeafCountText(greenCount: number): string {
  const total = greenCount
  if (total === 0) return '还没有苹果，添加第一条背诵吧'
  if (total <= 5) return '小树苗正在努力生长'
  if (total <= 12) return '枝头已经长出了几个苹果'
  if (total <= 20) return '越来越茂盛了'
  return '已经是一棵大树了'
}

export default function Home() {
  const {
    leaves,
    activePanel,
    setActivePanel,
    refreshLeafColors,
  } = useStore()

  const [greeting, setGreeting] = useState('')
  const [mounted, setMounted] = useState(false)

  // Client-side greeting
  useEffect(() => {
    setGreeting(getGreeting())
    setMounted(true)
  }, [])

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (activePanel) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [activePanel])

  // Decay timer: refresh leaf colors every second
  useEffect(() => {
    const interval = setInterval(() => {
      refreshLeafColors()
    }, 1000)
    return () => clearInterval(interval)
  }, [refreshLeafColors])

  const greenCount = leaves.filter((l) => l.color === 'green').length

  return (
    <div className="min-h-screen flex flex-col transition-all duration-1000 app-bg">
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-4 pt-6 pb-32 relative">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-sm text-center mb-2"
        >
          <h1 className="text-lg font-semibold text-foreground/80 tracking-wide flex items-center justify-center gap-2">
            <Apple className="w-4 h-4 text-moss" />
            慢慢长
          </h1>
        </motion.header>

        {/* Greeting */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: mounted ? 1 : 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-sm text-soft-text mb-1 text-center"
          suppressHydrationWarning
        >
          {greeting || '\u00A0'}
        </motion.p>



        {/* Leaf count hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: mounted ? 1 : 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-[10px] text-soft-text/60 mb-4 text-center"
        >
          {getLeafCountText(greenCount)}
          {greenCount > 0 && (
            <span className="ml-1 text-lemon-deep/70">
              {greenCount}个绿苹果等复习
            </span>
          )}
        </motion.p>

        {/* Tree */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full flex justify-center flex-1 items-start"
        >
          <div className="w-full max-w-xs sm:max-w-sm">
            <GrowthTree />
          </div>
        </motion.div>

        {/* Hint below tree */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: mounted ? 1 : 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-[10px] text-soft-text/40 text-center mt-1"
        >
          {greenCount > 0
            ? '绿苹果需要复习，红苹果已完成'
            : '所有苹果都是红色的，继续保持'
          }
        </motion.p>
      </main>

      {/* Bottom Nav */}
      <motion.nav
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed bottom-0 inset-x-0 z-30"
      >
        <div className="bg-gradient-to-t from-warm-white via-warm-white/95 to-transparent pt-8 pb-6 px-6">
          <div className="max-w-sm mx-auto flex gap-3">
            <ActionButton
              icon={<BookOpen className="w-4 h-4" />}
              label="背诵"
              color="bg-moss/12 text-moss hover:bg-moss/20"
              onClick={() => setActivePanel('recite')}
            />
            <ActionButton
              icon={<Heart className="w-4 h-4" />}
              label="今天感觉"
              color="bg-cream/40 text-cream-deep hover:bg-cream/60"
              onClick={() => setActivePanel('pace')}
            />
            <ActionButton
              icon={<Brain className="w-4 h-4" />}
              label="专注"
              color="bg-sea-blue/20 text-sea-blue-deep hover:bg-sea-blue/35"
              onClick={() => setActivePanel('focus')}
            />
            <ActionButton
              icon={<Calendar className="w-4 h-4" />}
              label="月总结"
              color="bg-lemon/30 text-earth-deep hover:bg-lemon/50"
              onClick={() => setActivePanel('summary')}
            />
          </div>
        </div>
      </motion.nav>

      {/* Panels */}
      <AnimatePresence>
        {activePanel === 'recite' && <ReciteDrawer />}
        {activePanel === 'pace' && <PaceDrawer />}
        {activePanel === 'focus' && <FocusDrawer />}
        {activePanel === 'summary' && <SummaryDrawer />}
      </AnimatePresence>

      {/* Distraction Bubble */}
      <DistractionBubble />
    </div>
  )
}

function ActionButton({
  icon, label, color, onClick,
}: {
  icon: React.ReactNode
  label: string
  color: string
  onClick: () => void
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className={`flex-1 gentle-btn flex flex-col items-center gap-1.5 ${color}`}
    >
      <div className="w-10 h-10 rounded-2xl bg-white/60 flex items-center justify-center">
        {icon}
      </div>
      <span className="text-[11px] font-medium">{label}</span>
    </motion.button>
  )
}