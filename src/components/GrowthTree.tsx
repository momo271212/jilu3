'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useStore, type Leaf } from '@/store/useStore'

// Apple colors
const APPLE_COLORS = {
  green: {
    fill: '#7CB968',
    stroke: '#5E9448',
    vein: '#4E8040',
    glow: '#7CB968',
  },
  yellow: {
    fill: '#FFD700',
    stroke: '#E6B800',
    vein: '#CC9900',
    glow: '#FFE55C',
  },
  red: {
    fill: '#FF6B6B',
    stroke: '#E05555',
    vein: '#CC4444',
    glow: '#FF8585',
  },
}

// Single Apple component
function Apple({
  leaf,
  isNew,
  isBouncing,
  onBounceEnd,
}: {
  leaf: Leaf
  isNew: boolean
  isBouncing: boolean
  onBounceEnd: () => void
}) {
  const isYellow = leaf.color === 'yellow'
  const isRed = leaf.color === 'red'
  const colors = isYellow ? APPLE_COLORS.yellow : isRed ? APPLE_COLORS.red : APPLE_COLORS.green

  return (
    <motion.g
      initial={isNew ? { scale: 0, opacity: 0, x: leaf.x, y: leaf.y } : { scale: 1, opacity: 1, x: leaf.x, y: leaf.y }}
      animate={{
        scale: isBouncing ? [1, 1.35, 0.9, 1.12, 1] : 1,
        opacity: 1,
        x: leaf.x,
        y: (isYellow || isRed) ? [leaf.y, leaf.y - 2.5, leaf.y] : leaf.y,
      }}
      transition={{
        scale: isNew
          ? { type: 'spring', stiffness: 180, damping: 12 }
          : isBouncing
            ? { duration: 0.6, ease: 'easeInOut' }
            : { duration: 0.3 },
        opacity: { duration: 0.6 },
        x: { duration: 0 },
        y: (isYellow || isRed)
          ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 0 },
      }}
      style={{
        rotate: leaf.rotation,
      }}
      onAnimationComplete={() => {
        if (isBouncing) onBounceEnd()
      }}
    >
      {/* Glow for yellow and red apples */}
      <AnimatePresence>
        {(isYellow || isRed) && (
          <motion.ellipse
            rx={leaf.size + 6}
            ry={leaf.size * 1.3 + 6}
            fill={colors.glow}
            opacity={0}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
        )}
      </AnimatePresence>

      {/* Apple body */}
      <ellipse
        cx={0}
        cy={0}
        rx={leaf.size}
        ry={leaf.size * 1.2}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth="0.8"
        opacity="0.92"
      />

      {/* Apple indent at top */}
      <path
        d={`M ${-leaf.size * 0.3} ${-leaf.size * 0.9} Q 0 ${-leaf.size * 1.15} ${leaf.size * 0.3} ${-leaf.size * 0.9}`}
        fill="none"
        stroke={colors.stroke}
        strokeWidth="0.6"
        opacity="0.5"
      />

      {/* Stem */}
      <line
        x1={0}
        y1={-leaf.size * 0.9}
        x2={0}
        y2={-leaf.size * 1.2}
        stroke={colors.vein}
        strokeWidth="0.8"
        opacity="0.6"
      />

      {/* Leaf on apple */}
      <ellipse
        cx={leaf.size * 0.4}
        cy={-leaf.size * 1.1}
        rx={leaf.size * 0.35}
        ry={leaf.size * 0.2}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth="0.5"
        opacity="0.7"
        transform={`rotate(30 ${leaf.size * 0.4} ${-leaf.size * 1.1})`}
      />
    </motion.g>
  )
}

// Main Tree
export default function GrowthTree() {
  const { leaves, newLeafIds, bounceLeafIds, removeBounceLeaf } = useStore()

  return (
    <div className="relative w-full max-w-sm mx-auto select-none">
      <motion.svg
        viewBox="0 0 400 480"
        className="w-full h-auto drop-shadow-sm"
        style={{
          transformOrigin: '50% 95%',
          animation: 'gentle-sway 6s ease-in-out infinite',
        }}
      >
        {/* Tree structure - no pointer events */}
        <g style={{ pointerEvents: 'none' }}>
          <ellipse cx="200" cy="472" rx="120" ry="12" fill="#C4A882" opacity="0.15" />
          <path d="M80 470 Q85 455 90 470" stroke="#9BC48B" strokeWidth="1.5" fill="none" opacity="0.5" />
          <path d="M310 468 Q315 452 320 468" stroke="#9BC48B" strokeWidth="1.5" fill="none" opacity="0.5" />
          <path d="M160 472 Q163 460 166 472" stroke="#9BC48B" strokeWidth="1" fill="none" opacity="0.4" />
          <path d="M240 471 Q243 458 246 471" stroke="#9BC48B" strokeWidth="1" fill="none" opacity="0.4" />

          <path d="M178 470 C178 435 174 400 170 375 C166 350 162 325 158 305 L158 290 C170 283 185 278 200 276 C215 278 230 283 242 290 L242 305 C238 325 234 350 230 375 C226 400 222 435 222 470 Z" fill="#C4A882" />
          <path d="M188 465 C188 435 186 410 184 390" stroke="#B89B74" strokeWidth="1.2" fill="none" opacity="0.4" />
          <path d="M212 465 C212 435 214 410 216 390" stroke="#B89B74" strokeWidth="1.2" fill="none" opacity="0.4" />
          <path d="M200 460 C200 440 199 420 198 400" stroke="#B89B74" strokeWidth="0.8" fill="none" opacity="0.3" />

          <path d="M172 365 C148 338 118 308 92 278" stroke="#B89B74" strokeWidth="11" strokeLinecap="round" fill="none" />
          <path d="M228 365 C252 338 282 308 308 278" stroke="#B89B74" strokeWidth="11" strokeLinecap="round" fill="none" />
          <path d="M200 345 C200 315 199 285 197 255" stroke="#B89B74" strokeWidth="8" strokeLinecap="round" fill="none" />
          <path d="M140 310 C128 295 115 285 105 275" stroke="#B89B74" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M260 310 C272 295 285 285 295 275" stroke="#B89B74" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M198 280 C190 268 180 258 172 250" stroke="#B89B74" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M198 280 C206 268 216 258 224 250" stroke="#B89B74" strokeWidth="4" strokeLinecap="round" fill="none" />
        </g>

        {/* Canopy - back */}
        <g style={{ pointerEvents: 'none' }}>
          <circle cx="92" cy="255" r="52" fill="#5E8A4A" opacity="0.35" />
          <circle cx="308" cy="255" r="52" fill="#5E8A4A" opacity="0.35" />
          <circle cx="200" cy="198" r="58" fill="#5E8A4A" opacity="0.3" />
          <circle cx="132" cy="228" r="48" fill="#6B9E5A" opacity="0.45" />
          <circle cx="200" cy="210" r="52" fill="#6B9E5A" opacity="0.45" />
          <circle cx="268" cy="228" r="48" fill="#6B9E5A" opacity="0.45" />
          <circle cx="162" cy="255" r="40" fill="#7FB870" opacity="0.4" />
          <circle cx="238" cy="255" r="40" fill="#7FB870" opacity="0.4" />
          <circle cx="200" cy="238" r="36" fill="#8FC880" opacity="0.35" />
        </g>

        {/* Apples */}
        {leaves.map((leaf) => (
          <Apple
            key={leaf.id}
            leaf={leaf}
            isNew={newLeafIds.has(leaf.id)}
            isBouncing={bounceLeafIds.has(leaf.id)}
            onBounceEnd={() => removeBounceLeaf(leaf.id)}
          />
        ))}
      </motion.svg>
    </div>
  )
}
