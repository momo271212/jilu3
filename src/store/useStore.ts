import { create } from 'zustand'

// ---------- Types ----------

export const FEELING_DURATIONS = {
  good: 24 * 60 * 60 * 1000,      // 24 hours
  neutral: 12 * 60 * 60 * 1000,   // 12 hours
  bad: 6 * 60 * 60 * 1000,        // 6 hours
} as const

export type FeelingType = 'good' | 'neutral' | 'bad'

export const FEELING_LABELS = {
  good: '掌握很好',
  neutral: '基本掌握',
  bad: '还需加强',
} as const

export interface Leaf {
  id: string
  reciteItemId: string
  x: number
  y: number
  size: number
  rotation: number
  color: 'green' | 'yellow' | 'red'
  knowledgePoint: string
  hint: string
}

export interface ReciteItem {
  id: string
  leafId: string
  name: string
  lastMemorizedAt: number | null
  createdAt: number
  todayRecited: boolean  // Kept for backward compatibility
  timerStartedAt: number | null  // Timestamp when the recite timer was started
  timerDuration: number | null  // Duration in seconds for the current timer
  lastFeeling: FeelingType | null  // Last feeling for this item (determines its color speed)
  lastFeelingAt: number | null  // When the feeling was set
  cardSetId?: string  // Link to GeneratedCardSet (AI-generated cards)
}

export interface FocusRecord {
  id: string
  taskDescription: string
  clarity: number
  durationMinutes: number
  hour: number
  minute: number
}

export interface ReciteRecord {
  id: string
  reciteItemId: string
  itemName: string
  date: string  // YYYY-MM-DD format
  timestamp: number
}

export interface DailyReciteStat {
  date: string
  count: number
  items: string[]
}

export interface MonthlySummary {
  month: string  // YYYY-MM format
  totalRecites: number
  totalFocusMinutes: number
  totalFocusRecords: number
  dailyStats: DailyReciteStat[]
  reciteItemsCount: number
}

export type PanelType = 'recite' | 'pace' | 'focus' | 'summary' | null

export interface Distraction {
  id: string
  content: string
  time: string
}

// AI-generated recite card types
export interface ReciteCard {
  id: string
  type: 'objective' | 'subjective'
  stem: string        // 题干 (with blanks marked as ____)
  answer: string      // 标准答案
  scoringLogic?: string // 踩分逻辑 (subjective only)
  userAnswer?: string
  isCorrect?: boolean
}

export interface EbbinghausTask {
  day: number
  label: string
  task: string
}

export interface GeneratedCardSet {
  id: string
  originalText: string
  subject: string
  stage: string
  createdAt: number
  objectiveCards: ReciteCard[]
  subjectiveCards: ReciteCard[]
  ebbinghausPlan: EbbinghausTask[]
  errorRules: string[]
  errorCardIds: string[] // track wrong answers in self-test
}

// ---------- Apple Slots (8 positions on the tree, more spread out) ----------

export const APPLE_SLOTS = [
  // Top area - more spread
  { x: 200, y: 175, size: 12, rotation: 0 },
  { x: 150, y: 200, size: 11, rotation: -15 },
  { x: 250, y: 200, size: 11, rotation: 15 },

  // Upper middle - wider spread
  { x: 120, y: 230, size: 10, rotation: -20 },
  { x: 280, y: 230, size: 10, rotation: 20 },

  // Middle
  { x: 180, y: 240, size: 11, rotation: -10 },
  { x: 220, y: 240, size: 11, rotation: 10 },

  // Bottom - spread to edges
  { x: 145, y: 260, size: 10, rotation: -18 },
  { x: 255, y: 260, size: 10, rotation: 18 },
]

// ---------- Helpers ----------

let slotIndex = 0
function nextSlot() {
  const slot = APPLE_SLOTS[slotIndex % APPLE_SLOTS.length]
  slotIndex++
  return slot
}

// ---------- Store ----------

interface AppState {
  // Leaves
  leaves: Leaf[]
  newLeafIds: Set<string>
  bounceLeafIds: Set<string>

  // Recite
  reciteItems: ReciteItem[]
  reciteRecords: ReciteRecord[]
  todayFeeling: FeelingType | null  // Global feeling for today (determines color speed)
  addReciteItem: (name: string) => void
  deleteReciteItem: (id: string) => void
  completeRecite: (id: string, durationMinutes: number, feeling?: FeelingType | null) => void
  setFeeling: (feeling: FeelingType) => void  // Sets global feeling for today
  getItemCountdown: (itemId: string) => number | null
  getItemTimerRemaining: (itemId: string) => number | null
  startItemTimer: (itemId: string, durationSeconds: number) => void
  stopItemTimer: (itemId: string) => void

  // Focus (independent)
  focusRecords: FocusRecord[]
  addFocusRecord: (taskDescription: string, clarity: number, durationMinutes: number) => void

  // Distractions
  distractions: Distraction[]
  addDistraction: (content: string) => void

  // UI
  activePanel: PanelType
  setActivePanel: (panel: PanelType) => void
  selectedLeafId: string | null
  setSelectedLeafId: (id: string | null) => void

  // Decay timer
  refreshLeafColors: () => void
  removeBounceLeaf: (id: string) => void

  // Monthly summary
  getMonthlySummary: (year: number, month: number) => MonthlySummary

  // AI Card Generation
  cardSets: GeneratedCardSet[]
  aiGenerating: boolean
  setAiGenerating: (v: boolean) => void
  addCardSet: (cardSet: GeneratedCardSet) => void
  saveCardAsReciteItem: (cardSetId: string, cardId: string) => void
  saveAllCardsAsReciteItems: (cardSetId: string) => void
  markCardAnswer: (cardSetId: string, cardId: string, userAnswer: string, isCorrect: boolean) => void
  clearCardSet: (cardSetId: string) => void
}

let idCounter = 0
let focusCounter = 0
let distractionCounter = 0
let reciteRecordCounter = 0

export const useStore = create<AppState>((set, get) => ({
  // --- Leaves ---
  leaves: [],
  newLeafIds: new Set(),
  bounceLeafIds: new Set(),

  // --- Recite ---
  reciteItems: [],
  reciteRecords: [],
  todayFeeling: null,  // Global feeling for today

  addReciteItem: (name) => {
    const state = get()
    if (state.reciteItems.length >= 25) return

    idCounter++
    const itemId = `r_${Date.now()}_${idCounter}`
    const slot = nextSlot()
    const leafId = `l_${itemId}`

    const newLeaf: Leaf = {
      id: leafId,
      reciteItemId: itemId,
      x: slot.x,
      y: slot.y,
      size: slot.size,
      rotation: slot.rotation,
      color: 'green',
      knowledgePoint: name,
      hint: `背诵"${name}"后苹果变红`,
    }

    const newItem: ReciteItem = {
      id: itemId,
      leafId,
      name,
      lastMemorizedAt: null,
      createdAt: Date.now(),
      todayRecited: false,
      timerStartedAt: null,
      timerDuration: null,
      lastFeeling: null,
      lastFeelingAt: null,
    }

    set((s) => ({
      reciteItems: [...s.reciteItems, newItem],
      leaves: [...s.leaves, newLeaf],
      newLeafIds: new Set([...s.newLeafIds, leafId]),
    }))

    setTimeout(() => {
      set((s) => {
        const next = new Set(s.newLeafIds)
        next.delete(leafId)
        return { newLeafIds: next }
      })
    }, 1200)
  },

  deleteReciteItem: (id) => {
    const state = get()
    const item = state.reciteItems.find((r) => r.id === id)
    if (!item) return

    set((s) => ({
      reciteItems: s.reciteItems.filter((r) => r.id !== id),
      leaves: s.leaves.filter((l) => l.reciteItemId !== id),
      selectedLeafId: s.selectedLeafId === item.leafId ? null : s.selectedLeafId,
    }))
  },

  setFeeling: (feeling) => {
    // Set global feeling for today - this determines how fast apples turn red
    set({ todayFeeling: feeling })
  },

  // Get countdown for an item (when it will turn red)
  getItemCountdown: (itemId) => {
    const state = get()
    const item = state.reciteItems.find((r) => r.id === itemId)
    if (!item || !item.lastMemorizedAt) return null

    const now = Date.now()
    const feeling = item.lastFeeling || state.todayFeeling
    if (!feeling) return null // If no feeling is determined, can't calculate countdown

    const feelingDuration = FEELING_DURATIONS[feeling]
    const elapsed = now - item.lastMemorizedAt
    const remaining = Math.max(0, feelingDuration - elapsed)

    return remaining
  },

  // Get remaining timer countdown for an item (during recitation)
  getItemTimerRemaining: (itemId) => {
    const state = get()
    const item = state.reciteItems.find((r) => r.id === itemId)
    if (!item || !item.timerStartedAt || !item.timerDuration) return null

    const now = Date.now()
    const elapsed = Math.floor((now - item.timerStartedAt) / 1000)
    const remaining = Math.max(0, item.timerDuration - elapsed)

    return remaining
  },

  // Start the timer for an item
  startItemTimer: (itemId, durationSeconds) => {
    set((s) => ({
      reciteItems: s.reciteItems.map((r) =>
        r.id === itemId ? { ...r, timerStartedAt: Date.now(), timerDuration: durationSeconds } : r
      ),
    }))
  },

  // Stop/clear the timer for an item
  stopItemTimer: (itemId) => {
    set((s) => ({
      reciteItems: s.reciteItems.map((r) =>
        r.id === itemId ? { ...r, timerStartedAt: null, timerDuration: null } : r
      ),
    }))
  },

  completeRecite: (id, durationMinutes, feeling) => {
    const state = get()
    const item = state.reciteItems.find((r) => r.id === id)
    if (!item) return
    const now = Date.now()
    const today = new Date().toISOString().split('T')[0]

    reciteRecordCounter++

    set((s) => ({
      reciteItems: s.reciteItems.map((r) =>
        r.id === id ? {
          ...r,
          lastMemorizedAt: now,
          todayRecited: true,
          lastFeeling: feeling || null,  // Record this item's feeling
          lastFeelingAt: now
        } : r
      ),
      selectedLeafId: s.selectedLeafId === item.leafId ? null : s.selectedLeafId,
      reciteRecords: [
        ...s.reciteRecords,
        {
          id: `rr_${Date.now()}_${reciteRecordCounter}`,
          reciteItemId: item.id,
          itemName: item.name,
          date: today,
          timestamp: now,
        },
      ],
    }))
  },

  // --- Focus ---
  focusRecords: [],
  addFocusRecord: (taskDescription, clarity, durationMinutes) => {
    focusCounter++
    const now = new Date()
    set((s) => ({
      focusRecords: [
        {
          id: `f_${Date.now()}_${focusCounter}`,
          taskDescription,
          clarity,
          durationMinutes,
          hour: now.getHours(),
          minute: now.getMinutes(),
        },
        ...s.focusRecords,
      ],
    }))
  },

  // --- AI Card Generation ---
  cardSets: [],
  aiGenerating: false,

  setAiGenerating: (v) => set({ aiGenerating: v }),

  addCardSet: (cardSet) => {
    set((s) => ({
      cardSets: [cardSet, ...s.cardSets],
    }))
  },

  saveCardAsReciteItem: (cardSetId, cardId) => {
    // Single card → single recite item (kept for individual card saves)
    const state = get()
    const cardSet = state.cardSets.find((cs) => cs.id === cardSetId)
    if (!cardSet) return

    const allCards = [...cardSet.objectiveCards, ...cardSet.subjectiveCards]
    const card = allCards.find((c) => c.id === cardId)
    if (!card || state.reciteItems.length >= 25) return

    const itemName = `[${cardSet.subject}] ${card.stem.replace(/____/g, '___').slice(0, 40)}`
    idCounter++
    const itemId = `r_${Date.now()}_${idCounter}`
    const slot = nextSlot()
    const leafId = `l_${itemId}`

    const newLeaf: Leaf = {
      id: leafId,
      reciteItemId: itemId,
      x: slot.x,
      y: slot.y,
      size: slot.size,
      rotation: slot.rotation,
      color: 'green',
      knowledgePoint: card.stem,
      hint: card.answer,
    }

    const newItem: ReciteItem = {
      id: itemId,
      leafId,
      name: itemName,
      lastMemorizedAt: null,
      createdAt: Date.now(),
      todayRecited: false,
      timerStartedAt: null,
      timerDuration: null,
      lastFeeling: null,
      lastFeelingAt: null,
      cardSetId,
    }

    set((s) => ({
      reciteItems: [...s.reciteItems, newItem],
      leaves: [...s.leaves, newLeaf],
      newLeafIds: new Set([...s.newLeafIds, leafId]),
    }))

    setTimeout(() => {
      set((s) => {
        const next = new Set(s.newLeafIds)
        next.delete(leafId)
        return { newLeafIds: next }
      })
    }, 1200)
  },

  saveAllCardsAsReciteItems: (cardSetId) => {
    const state = get()
    const cardSet = state.cardSets.find((cs) => cs.id === cardSetId)
    if (!cardSet || state.reciteItems.length >= 25) return

    const totalCards = cardSet.objectiveCards.length + cardSet.subjectiveCards.length
    const itemName = `[${cardSet.subject}] AI背诵卡 (${totalCards}张)`

    idCounter++
    const itemId = `r_${Date.now()}_${idCounter}`
    const slot = nextSlot()
    const leafId = `l_${itemId}`

    const newLeaf: Leaf = {
      id: leafId,
      reciteItemId: itemId,
      x: slot.x,
      y: slot.y,
      size: slot.size,
      rotation: slot.rotation,
      color: 'green',
      knowledgePoint: `AI生成 · ${cardSet.subject} · ${totalCards}张卡片`,
      hint: `共${totalCards}张背诵卡片，点击开始背诵进入自测模式`,
    }

    const newItem: ReciteItem = {
      id: itemId,
      leafId,
      name: itemName,
      lastMemorizedAt: null,
      createdAt: Date.now(),
      todayRecited: false,
      timerStartedAt: null,
      timerDuration: null,
      lastFeeling: null,
      lastFeelingAt: null,
      cardSetId,
    }

    set((s) => ({
      reciteItems: [...s.reciteItems, newItem],
      leaves: [...s.leaves, newLeaf],
      newLeafIds: new Set([...s.newLeafIds, leafId]),
    }))

    setTimeout(() => {
      set((s) => {
        const next = new Set(s.newLeafIds)
        next.delete(leafId)
        return { newLeafIds: next }
      })
    }, 1200)
  },

  markCardAnswer: (cardSetId, cardId, userAnswer, isCorrect) => {
    set((s) => ({
      cardSets: s.cardSets.map((cs) => {
        if (cs.id !== cardSetId) return cs
        const updateCard = (cards: ReciteCard[]) =>
          cards.map((c) =>
            c.id === cardId ? { ...c, userAnswer, isCorrect } : c
          )
        const newErrorIds = isCorrect
          ? cs.errorCardIds.filter((id) => id !== cardId)
          : cs.errorCardIds.includes(cardId)
            ? cs.errorCardIds
            : [...cs.errorCardIds, cardId]
        return {
          ...cs,
          objectiveCards: updateCard(cs.objectiveCards),
          subjectiveCards: updateCard(cs.subjectiveCards),
          errorCardIds: newErrorIds,
        }
      }),
    }))
  },

  clearCardSet: (cardSetId) => {
    set((s) => ({
      cardSets: s.cardSets.filter((cs) => cs.id !== cardSetId),
    }))
  },

  // --- Distractions ---
  distractions: [] as Distraction[],
  addDistraction: (content) => {
    distractionCounter++
    const now = new Date()
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    set((s) => ({
      distractions: [
        { id: `d_${Date.now()}_${distractionCounter}`, content, time },
        ...s.distractions,
      ],
    }))
  },

  // --- UI ---
  activePanel: null,
  setActivePanel: (panel) => set({ activePanel: panel }),
  selectedLeafId: null,
  setSelectedLeafId: (id) => set({ selectedLeafId: id }),

  // --- Decay timer (called every second from page) ---
  refreshLeafColors: () => {
    const state = get()
    const now = Date.now()

    let changed = false
    const updatedLeaves = state.leaves.map((leaf) => {
      const item = state.reciteItems.find((r) => r.id === leaf.reciteItemId)
      if (!item || !item.lastMemorizedAt) {
        // Never reviewed → Green
        if (leaf.color !== 'green') { changed = true; return { ...leaf, color: 'green' as const } }
        return leaf
      }

      // Use item's own feeling if available, otherwise use global todayFeeling
      const feeling = item.lastFeeling || state.todayFeeling
      if (!feeling) {
        // No feeling set → keep green (waiting for user to set feeling)
        if (leaf.color !== 'green') { changed = true; return { ...leaf, color: 'green' as const } }
        return leaf
      }

      // Use feeling duration to calculate when to turn red
      const feelingDuration = FEELING_DURATIONS[feeling]
      const elapsed = now - item.lastMemorizedAt

      if (elapsed >= feelingDuration) {
        // Feeling duration elapsed → Red (ready for next review)
        if (leaf.color !== 'red') { changed = true; return { ...leaf, color: 'red' as const } }
        return leaf
      } else {
        // Still within feeling duration → Green
        if (leaf.color !== 'green') { changed = true; return { ...leaf, color: 'green' as const } }
        return leaf
      }
    })

    if (changed) set({ leaves: updatedLeaves })
  },

  removeBounceLeaf: (id) => {
    set((s) => {
      const next = new Set(s.bounceLeafIds)
      next.delete(id)
      return { bounceLeafIds: next }
    })
  },

  // --- Monthly summary ---
  getMonthlySummary: (year, month) => {
    const state = get()
    const monthStr = `${year}-${month.toString().padStart(2, '0')}`

    // Filter recite records for the month
    const monthReciteRecords = state.reciteRecords.filter((r) => {
      return r.date.startsWith(monthStr)
    })

    // Filter focus records for the month
    const monthFocusRecords = state.focusRecords.filter((r) => {
      const recordDate = new Date(r.hour, r.minute)
      return recordDate.getFullYear() === year && recordDate.getMonth() === month - 1
    })

    // Group recite records by date
    const dailyStatsMap = new Map<string, { count: number; items: Set<string> }>()
    monthReciteRecords.forEach((record) => {
      if (!dailyStatsMap.has(record.date)) {
        dailyStatsMap.set(record.date, { count: 0, items: new Set() })
      }
      const stat = dailyStatsMap.get(record.date)!
      stat.count++
      stat.items.add(record.itemName)
    })

    const dailyStats: DailyReciteStat[] = Array.from(dailyStatsMap.entries())
      .map(([date, stat]) => ({
        date,
        count: stat.count,
        items: Array.from(stat.items),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const totalRecites = monthReciteRecords.length
    const totalFocusMinutes = monthFocusRecords.reduce((sum, r) => sum + r.durationMinutes, 0)
    const totalFocusRecords = monthFocusRecords.length
    const reciteItemsCount = new Set(monthReciteRecords.map((r) => r.reciteItemId)).size

    return {
      month: monthStr,
      totalRecites,
      totalFocusMinutes,
      totalFocusRecords,
      dailyStats,
      reciteItemsCount,
    }
  },
}))
