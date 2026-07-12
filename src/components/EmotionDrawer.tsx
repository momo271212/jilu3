'use client'

import { useStore } from '@/store/useStore'
import { motion } from 'framer-motion'
import { CloudSun, Cloud, CloudSnow, Moon } from 'lucide-react'

interface EmotionOption {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  action: () => void
  color: string
  hoverColor: string
}

export default function EmotionDrawer() {
  const { activePanel, setActivePanel, setMode, startHibernation, isHibernating } = useStore()

  if (activePanel !== 'emotion') return null

  const options: EmotionOption[] = [
    {
      id: 'okay',
      icon: <CloudSun className="w-5 h-5" />,
      title: '还行，可以继续',
      description: '继续当前的任务就好，按自己的节奏来',
      action: () => { setMode('normal'); setActivePanel(null) },
      color: 'bg-moss/10 text-moss',
      hoverColor: 'hover:bg-moss/15',
    },
    {
      id: 'tired',
      icon: <Cloud className="w-5 h-5" />,
      title: '有点累，降速吧',
      description: '切换到低速模式，任务会自动变简单',
      action: () => { setMode('low-speed'); setActivePanel(null) },
      color: 'bg-sea-blue/20 text-sea-blue-deep',
      hoverColor: 'hover:bg-sea-blue/30',
    },
    {
      id: 'bad',
      icon: <Moon className="w-5 h-5" />,
      title: '今天状态极差',
      description: '底线任务：只读一遍单词的读音就好，不需要拼写',
      action: () => { setMode('buffer'); setActivePanel(null) },
      color: 'bg-lemon/40 text-earth-deep',
      hoverColor: 'hover:bg-lemon/50',
    },
    {
      id: 'hibernate',
      icon: <CloudSnow className="w-5 h-5" />,
      title: '让树冬眠一天',
      description: '冬天休息是为了春天发芽，今天去晒晒太阳吧',
      action: () => { startHibernation() },
      color: 'bg-cream/50 text-cream-deep',
      hoverColor: 'hover:bg-cream/60',
    },
  ]

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="fixed inset-0 z-50 flex flex-col justify-end"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"
        onClick={() => setActivePanel(null)}
      />

      {/* Panel */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative bg-warm-white/95 backdrop-blur-xl rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.08)] flex flex-col"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-earth/25" />
        </div>

        {/* Header */}
        <div className="px-6 pb-2">
          <h2 className="text-lg font-semibold text-foreground tracking-tight">今天感觉怎么样？</h2>
        </div>

        {/* Comfort text */}
        <div className="px-6 pb-5">
          <p className="text-sm text-soft-text leading-relaxed">
            你不需要每天都很好。
            <br />
            允许自己是一个普通人。
          </p>
        </div>

        {/* Options */}
        <div className="px-6 pb-8 space-y-3">
          {options.map((opt, i) => (
            <motion.button
              key={opt.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              onClick={opt.action}
              className={`w-full text-left p-4 rounded-2xl ${opt.color} ${opt.hoverColor} transition-all duration-400 active:scale-[0.98]`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{opt.icon}</div>
                <div>
                  <h3 className="text-sm font-medium">{opt.title}</h3>
                  <p className="text-xs mt-1 opacity-70 leading-relaxed">{opt.description}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}