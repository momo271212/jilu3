'use client'

import { useStore } from '@/store/useStore'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send } from 'lucide-react'
import { useState, useRef, useCallback } from 'react'

export default function DistractionBubble() {
  const { distractions, addDistraction, activePanel } = useStore()
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [justSubmitted, setJustSubmitted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isVisible = !activePanel

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  const handleSubmit = useCallback(() => {
    if (!input.trim()) return
    addDistraction(input.trim())
    setInput('')
    setJustSubmitted(true)
    setTimeout(() => setJustSubmitted(false), 2000)
  }, [input, addDistraction])

  // Auto-focus input when opening
  const openBubble = useCallback(() => {
    setIsOpen(true)
    // Delay focus to next frame so the input is mounted
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }, [])

  if (!isVisible) return null

  return (
    <>
      {/* Floating Bubble Button */}
      <motion.div
        className="fixed right-4 bottom-24 z-40"
        animate={{ scale: isOpen ? 0 : 1, opacity: isOpen ? 0 : 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.button
          onClick={openBubble}
          whileTap={{ scale: 0.9 }}
          className="w-12 h-12 rounded-full bg-sea-blue/60 backdrop-blur-sm shadow-lg flex items-center justify-center text-white hover:bg-sea-blue/70 transition-colors duration-300 animate-bubble-wobble"
          aria-label="杂念收集箱"
        >
          <MessageCircle className="w-5 h-5" />
        </motion.button>
        {distractions.length > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cream-deep text-white text-[8px] flex items-center justify-center font-medium">
            {distractions.length}
          </div>
        )}
      </motion.div>

      {/* Expanded Input Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed right-4 bottom-24 z-40 w-72"
          >
            <div className="soft-card p-4 shadow-lg">
              {/* Close button */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-soft-text font-medium">脑子有点乱？</p>
                <button
                  onClick={handleClose}
                  className="w-6 h-6 rounded-full bg-muted/60 flex items-center justify-center text-soft-text hover:text-foreground transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {justSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-3"
                >
                  <div className="w-10 h-10 rounded-full bg-moss/15 flex items-center justify-center mx-auto mb-2">
                    <MessageCircle className="w-5 h-5 text-moss" />
                  </div>
                  <p className="text-sm text-moss font-medium">已替你记下</p>
                  <p className="text-xs text-soft-text mt-1">考完再想</p>
                </motion.div>
              ) : (
                <>
                  <div className="flex gap-2 mb-3">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                      placeholder="衣服没洗、晚饭吃什么..."
                      className="flex-1 px-3 py-2 text-sm bg-white/70 rounded-xl border border-border/50 focus:border-sea-blue focus:ring-1 focus:ring-sea-blue/30 outline-none placeholder:text-soft-text/60 transition-all duration-300"
                    />
                    <button
                      onClick={handleSubmit}
                      disabled={!input.trim()}
                      className="w-9 h-9 rounded-xl bg-sea-blue/30 text-sea-blue-deep flex items-center justify-center hover:bg-sea-blue/50 transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Recent distractions */}
                  {distractions.length > 0 && (
                    <div className="max-h-24 overflow-y-auto">
                      {distractions.slice(0, 3).map((d) => (
                        <div key={d.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/50 transition-colors">
                          <p className="text-xs text-soft-text truncate flex-1 mr-2">{d.content}</p>
                          <span className="text-[10px] text-soft-text/60">{d.time}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}