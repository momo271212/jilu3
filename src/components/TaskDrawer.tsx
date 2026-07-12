'use client'

import { useStore, type AppMode } from '@/store/useStore'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Gauge, Shield, Check, ChevronDown, Plus, X } from 'lucide-react'
import { useState } from 'react'

const SUBJECT_COLORS: Record<string, string> = {
  '高数': 'bg-sea-blue/40 text-sea-blue-deep',
  '英语': 'bg-lemon/50 text-earth-deep',
  '政治': 'bg-cream/60 text-cream-deep',
  '专业课': 'bg-moss/15 text-moss',
  '其他': 'bg-muted text-soft-text',
}

const SUBJECTS = ['高数', '英语', '政治', '专业课', '其他']

const MODE_LABELS: Record<AppMode, string> = {
  normal: '正常模式',
  'low-speed': '低速模式',
  buffer: '底线模式',
}

const MODE_ICONS: Record<AppMode, React.ReactNode> = {
  normal: <BookOpen className="w-3.5 h-3.5" />,
  'low-speed': <Gauge className="w-3.5 h-3.5" />,
  buffer: <Shield className="w-3.5 h-3.5" />,
}

export default function TaskDrawer() {
  const { tasks, currentMode, setMode, completeTask, addTask, activePanel, setActivePanel } = useStore()
  const [showCompleted, setShowCompleted] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newSubject, setNewSubject] = useState('高数')
  const [newTitle, setNewTitle] = useState('')

  if (activePanel !== 'task') return null

  const pendingTasks = tasks.filter((t) => !t.completed)
  const completedTasks = tasks.filter((t) => t.completed)

  const handleAdd = () => {
    if (!newTitle.trim()) return
    addTask({
      subject: newSubject,
      title: newTitle.trim(),
      normalDesc: `搞定${newTitle.trim()}（约1-2小时，视状态而定）`,
      lowSpeedDesc: `只看${newTitle.trim()}的目录和例题标题`,
      bufferDesc: `翻开书看一眼"${newTitle.trim()}"几个字，然后合上`,
    })
    setShowAddForm(false)
    setNewTitle('')
  }

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
        className="relative bg-warm-white/95 backdrop-blur-xl rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.08)] flex flex-col max-h-[80vh]"
      >
        {/* Drag handle + close */}
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
        <div className="px-6 pb-4">
          <h2 className="text-lg font-semibold text-foreground tracking-tight">今日学习</h2>
          <p className="text-xs text-soft-text mt-1">按你现在的状态来，不用勉强</p>
        </div>

        {/* Mode Switcher */}
        <div className="px-6 mb-4">
          <div className="flex gap-2 p-1 rounded-2xl bg-muted/50">
            {(Object.keys(MODE_LABELS) as AppMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setMode(mode)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-400 ${
                  currentMode === mode
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-soft-text hover:text-foreground'
                }`}
              >
                {MODE_ICONS[mode]}
                {MODE_LABELS[mode]}
              </button>
            ))}
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3">
          {/* Pending tasks */}
          {pendingTasks.map((task) => {
            const desc =
              currentMode === 'buffer'
                ? task.bufferDesc
                : currentMode === 'low-speed'
                  ? task.lowSpeedDesc
                  : task.normalDesc

            const subjectColor = SUBJECT_COLORS[task.subject] || 'bg-muted text-soft-text'

            return (
              <motion.div
                key={task.id}
                layout
                className="soft-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${subjectColor}`}>
                        {task.subject}
                      </span>
                      {currentMode !== 'normal' && (
                        <span className="text-[10px] text-lemon-deep bg-lemon/30 px-2 py-0.5 rounded-full">
                          {MODE_LABELS[currentMode]}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-foreground mb-1">{task.title}</h3>
                    <p className="text-xs text-soft-text leading-relaxed">{desc}</p>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => completeTask(task.id)}
                    className="flex items-center gap-1.5 text-xs font-medium text-moss bg-moss/10 px-4 py-2 rounded-full hover:bg-moss/20 transition-all duration-300 active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {currentMode === 'buffer' ? '做到了' : '完成了，苹果变红'}
                  </button>
                </div>
              </motion.div>
            )
          })}

          {/* Add task button */}
          <AnimatePresence>
            {!showAddForm && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAddForm(true)}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-border/50 text-soft-text hover:text-foreground hover:border-cream/60 transition-all duration-300 flex items-center justify-center gap-2 text-xs"
              >
                <Plus className="w-4 h-4" />
                添加新任务
              </motion.button>
            )}
          </AnimatePresence>

          {/* Add task form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="soft-card p-4 overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-foreground">添加新任务</p>
                  <button onClick={() => setShowAddForm(false)} className="text-soft-text hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {/* Subject selector */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {SUBJECTS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setNewSubject(s)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all duration-300 ${
                        newSubject === s
                          ? 'bg-sea-blue/30 text-sea-blue-deep ring-1 ring-sea-blue/30'
                          : 'bg-muted/50 text-soft-text'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {/* Title input */}
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  placeholder="任务名称，如：第三章习题"
                  className="w-full px-3 py-2 text-sm bg-white/70 rounded-xl border border-border/50 focus:border-sea-blue focus:ring-1 focus:ring-sea-blue/30 outline-none placeholder:text-soft-text/50 transition-all duration-300 mb-3"
                />
                <button
                  onClick={handleAdd}
                  disabled={!newTitle.trim()}
                  className="w-full py-2 rounded-xl text-xs font-medium bg-moss/15 text-moss hover:bg-moss/25 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  添加到树上
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Completed tasks */}
          {completedTasks.length > 0 && (
            <div className="pt-2">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="text-xs text-soft-text hover:text-foreground transition-colors flex items-center gap-1"
              >
                <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${showCompleted ? '' : '-rotate-90'}`} />
                已完成 ({completedTasks.length})
              </button>
              <AnimatePresence>
                {showCompleted && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-2 mt-2 overflow-hidden"
                  >
                    {completedTasks.map((task) => (
                      <div key={task.id} className="p-3 rounded-xl bg-moss/5 border border-moss/10">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-moss/20 flex items-center justify-center">
                            <Check className="w-3 h-3 text-moss" />
                          </div>
                          <span className="text-xs text-moss font-medium">{task.subject} · {task.title}</span>
                        </div>
                        <p className="text-[10px] text-soft-text mt-1 ml-7">苹果已经变红了</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Empty state */}
          {pendingTasks.length === 0 && !showAddForm && (
            <div className="text-center py-6">
              <p className="text-sm text-soft-text">今天的任务都完成啦</p>
              <p className="text-xs text-soft-text mt-1">树上的苹果都变红了</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}