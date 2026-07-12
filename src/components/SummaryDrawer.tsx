'use client'

import { useStore, type MonthlySummary } from '@/store/useStore'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, BookOpen, Brain, Calendar, TrendingUp, X } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}小时${m}分钟` : `${h}小时`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  const weekDay = weekDays[date.getDay()]
  return `${month}月${day}日 周${weekDay}`
}

export default function SummaryDrawer() {
  const { getMonthlySummary, activePanel, setActivePanel } = useStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [summary, setSummary] = useState<MonthlySummary | null>(null)

  // Update summary when month changes or panel opens
  useEffect(() => {
    if (activePanel === 'summary') {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      const monthlySummary = getMonthlySummary(year, month)
      setSummary(monthlySummary)
    }
  }, [activePanel, currentDate, getMonthlySummary])

  const goToPreviousMonth = useCallback(() => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() - 1)
      return newDate
    })
  }, [])

  const goToNextMonth = useCallback(() => {
    const today = new Date()
    const nextMonth = new Date(currentDate)
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    // Don't allow going past current month
    if (nextMonth <= today) {
      setCurrentDate(nextMonth)
    }
  }, [currentDate])

  const goToToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  if (activePanel !== 'summary') return null

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1
  const isCurrentMonth = year === new Date().getFullYear() && month === new Date().getMonth() + 1

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
        className="relative bg-warm-white/95 backdrop-blur-xl rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.08)] flex flex-col max-h-[85vh]"
      >
        {/* Handle + close */}
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

        {/* Header with month selector */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={goToPreviousMonth}
              className="w-8 h-8 rounded-full bg-muted/40 flex items-center justify-center text-soft-text hover:text-foreground transition-colors"
              aria-label="上个月"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground tracking-tight">
                {year}年{month}月
              </h2>
              {!isCurrentMonth && (
                <button
                  onClick={goToToday}
                  className="text-[10px] text-sea-blue hover:text-sea-blue-deep transition-colors mt-0.5"
                >
                  回到本月
                </button>
              )}
            </div>

            <button
              onClick={goToNextMonth}
              disabled={isCurrentMonth}
              className="w-8 h-8 rounded-full bg-muted/40 flex items-center justify-center text-soft-text hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="下个月"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {summary && summary.totalRecites === 0 && summary.totalFocusRecords === 0 ? (
            // Empty state
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <Calendar className="w-12 h-12 text-muted/40 mx-auto mb-3" />
              <p className="text-sm text-soft-text mb-1">这个月还没有记录</p>
              <p className="text-xs text-soft-text/60">开始背诵或专注吧</p>
            </motion.div>
          ) : (
            <div className="space-y-5">
              {/* Stats overview */}
              {summary && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="grid grid-cols-2 gap-3"
                >
                  <div className="soft-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-moss/15 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-moss" />
                      </div>
                      <span className="text-[10px] text-soft-text">背诵次数</span>
                    </div>
                    <p className="text-2xl font-semibold text-foreground">{summary.totalRecites}</p>
                    <p className="text-[10px] text-soft-text/60 mt-1">{summary.reciteItemsCount} 个知识点</p>
                  </div>

                  <div className="soft-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-sea-blue/15 flex items-center justify-center">
                        <Brain className="w-4 h-4 text-sea-blue" />
                      </div>
                      <span className="text-[10px] text-soft-text">专注时长</span>
                    </div>
                    <p className="text-2xl font-semibold text-foreground">{formatDuration(summary.totalFocusMinutes)}</p>
                    <p className="text-[10px] text-soft-text/60 mt-1">{summary.totalFocusRecords} 次专注</p>
                  </div>
                </motion.div>
              )}

              {/* Daily recite stats */}
              {summary && summary.dailyStats.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-soft-text" />
                    <p className="text-xs font-medium text-foreground">每日背诵</p>
                  </div>
                  <div className="space-y-2">
                    {summary.dailyStats.map((day, index) => (
                      <motion.div
                        key={day.date}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="soft-card p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground mb-1.5">
                              {formatDate(day.date)}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {day.items.map((item, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] px-2 py-0.5 rounded-full bg-moss/10 text-moss"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-semibold text-moss">{day.count}</p>
                            <p className="text-[10px] text-soft-text/60">次</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Focus records summary */}
              {summary && summary.totalFocusRecords > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center py-4"
                >
                  <p className="text-[10px] text-soft-text">
                    专注记录暂不支持按月份查看
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
