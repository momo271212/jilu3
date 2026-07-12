'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Smile, Meh, Frown, Check } from 'lucide-react'
import { useState, useCallback, useEffect } from 'react'
import { useStore, type FeelingType, FEELING_DURATIONS } from '@/store/useStore'

interface FeelingSelectorProps {
  itemId: string
  itemName: string
  completedDuration: number
  onClose: () => void
}

const FEELING_OPTIONS: { value: FeelingType; label: string; emoji: string; color: string; description: string }[] = [
  {
    value: 'good',
    label: '掌握很好',
    emoji: '😊',
    color: 'bg-moss/15 text-moss hover:bg-moss/25 border-moss/30',
    description: `苹果${Math.floor(FEELING_DURATIONS.good / 1000 / 60)}分钟后变红`,
  },
  {
    value: 'neutral',
    label: '基本掌握',
    emoji: '😐',
    color: 'bg-sea-blue/15 text-sea-blue-deep hover:bg-sea-blue/25 border-sea-blue/30',
    description: `苹果${Math.floor(FEELING_DURATIONS.neutral / 1000 / 60)}分钟后变红`,
  },
  {
    value: 'bad',
    label: '还需加强',
    emoji: '😔',
    color: 'bg-cream/30 text-cream-deep hover:bg-cream/50 border-cream/50',
    description: `苹果${Math.floor(FEELING_DURATIONS.bad / 1000 / 60)}分钟后变红`,
  },
]

export default function FeelingSelector({ itemId, itemName, completedDuration, onClose }: FeelingSelectorProps) {
  const { setFeeling, completeRecite } = useStore()
  const [selected, setSelected] = useState<FeelingType | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSelect = useCallback((feeling: FeelingType) => {
    setSelected(feeling)
    setFeeling(feeling)  // Set global feeling for today
    // Complete the recite with the feeling for this specific item
    completeRecite(itemId, completedDuration, feeling)
    setShowSuccess(true)

    // Auto-close after showing success
    setTimeout(() => {
      onClose()
    }, 1500)
  }, [setFeeling, completeRecite, itemId, completedDuration, onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex items-center justify-center px-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
        className="soft-card p-6 w-full max-w-sm"
      >
        <AnimatePresence mode="wait">
          {!showSuccess ? (
            <motion.div
              key="selector"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-5">
                <p className="text-sm font-medium text-foreground mb-1">背诵完成！</p>
                <p className="text-xs text-soft-text">{itemName}</p>
              </div>

              <p className="text-xs text-soft-text text-center mb-4">
                感觉一下这次背诵的效果
              </p>

              <div className="space-y-2">
                {FEELING_OPTIONS.map((option) => (
                  <motion.button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`w-full p-3.5 rounded-xl border transition-all duration-300 active:scale-[0.98] ${
                      selected === option.value
                        ? option.color
                        : 'bg-muted/30 text-soft-text hover:bg-muted/50 border-border/30'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{option.emoji}</span>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{option.label}</p>
                        <p className="text-[10px] opacity-70">{option.description}</p>
                      </div>
                      {selected === option.value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        >
                          <Check className="w-4 h-4" />
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>

              <button
                onClick={onClose}
                className="w-full mt-3 py-2 rounded-xl text-xs text-soft-text hover:text-foreground transition-colors"
              >
                稍后再说
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              className="py-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
                className="w-14 h-14 rounded-full bg-moss/15 flex items-center justify-center mx-auto mb-3"
              >
                <Check className="w-6 h-6 text-moss" />
              </motion.div>
              <p className="text-base font-medium text-foreground">已记录</p>
              <p className="text-xs text-soft-text mt-1">
                {selected && FEELING_OPTIONS.find(o => o.value === selected)?.emoji}{' '}
                {selected && FEELING_OPTIONS.find(o => o.value === selected)?.label}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
