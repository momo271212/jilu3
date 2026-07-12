# 苹果颜色变化逻辑说明

## 📋 修改内容

### 1. **数据结构更新**

每个背诵项目现在独立记录自己的感觉：

```typescript
interface ReciteItem {
  // ... 其他字段
  lastFeeling: FeelingType | null  // 该项目的最后一次感觉
  lastFeelingAt: number | null      // 感觉记录时间
}
```

### 2. **颜色变化逻辑**

**之前（全局模式）：**
- 设置一次"今天感觉" → 所有苹果用同一个速度变红
- 例如：今天感觉"还需加强"，所有苹果6小时后变红

**现在（独立模式）：**
- 每次背诵完成后选择感觉 → **该苹果记录自己的感觉**
- 每个苹果根据自己的 `lastFeeling` 独立计算变红时间
- 例如：
  - 苹果A 感觉"掌握很好" → 24小时后变红
  - 苹果B 感觉"还需加强" → 6小时后变红
  - 苹果C 还没背诵过 → 保持绿色

### 3. **流程说明**

```
1. 添加背诵项目 → 苹果是绿色的
2. 点击"开始背诵" → 选择时长 → 开始倒计时
3. 倒计时完成 → 弹出"感受选择器"
4. 选择感觉：
   - 😊 掌握很好 → 该苹果24小时后变红
   - 😐 基本掌握 → 该苹果12小时后变红
   - 😔 还需加强 → 该苹果6小时后变红
5. 该苹果开始计时，时间到了自动变红
6. 其他苹果不受影响，各自计时
```

### 4. **实现细节**

#### `refreshLeafColors()` 方法

```typescript
// 使用项目自己的感觉，如果没有则使用全局今天感觉
const feeling = item.lastFeeling || state.todayFeeling

if (!feeling) {
  // 没有设置感觉 → 保持绿色
  return leaf
}

const feelingDuration = FEELING_DURATIONS[feeling]
const elapsed = now - item.lastMemorizedAt

if (elapsed >= feelingDuration) {
  // 时间到了 → 变红
  return { ...leaf, color: 'red' }
} else {
  // 还在时间内 → 绿色
  return leaf
}
```

#### `completeRecite()` 方法

```typescript
completeRecite: (id, durationMinutes, feeling) => {
  // 更新项目的 lastFeeling 和 lastMemorizedAt
  r.id === id ? {
    ...r,
    lastMemorizedAt: now,
    lastFeeling: feeling,      // ← 记录这个苹果的感觉
    lastFeelingAt: now
  } : r
}
```

#### `FeelingSelector` 组件

```typescript
const handleSelect = (feeling: FeelingType) => {
  setFeeling(feeling)                    // 设置全局感觉（向后兼容）
  completeRecite(itemId, 0, feeling)     // ← 为该苹果记录感觉
}
```

### 5. **示例场景**

**场景：3个苹果，不同的感觉**

| 苹果 | 上次背诵时间 | 选择的感觉 | 变红时间 | 当前状态 |
|------|------------|----------|---------|---------|
| 🍏 英语单词 | 2小时前 | 掌握很好 😊 | 24小时后 | 🟢 绿色 |
| 🍏 古诗文 | 8小时前 | 基本掌握 😐 | 12小时后 | 🟢 绿色 |
| 🍏 历史年表 | 7小时前 | 还需加强 😔 | 6小时后 | 🔴 红色 |

**结果：**
- 英语单词还要等22小时才变红
- 古诗文还要等4小时变红
- 历史年表已经可以复习（变红色）

### 6. **向后兼容**

- ✅ 保持 `todayFeeling` 全局状态
- ✅ 如果没有项目级的感觉，回退到全局感觉
- ✅ `setFeeling()` 仍然可用
- ✅ 不影响现有数据

### 7. **优势**

1. **更灵活**：不同项目可以有不同复习节奏
2. **更准确**：根据实际掌握情况调整，而不是一刀切
3. **更个性化**：容易的项目可以延长复习间隔，难的项目缩短
4. **更科学**：符合艾宾浩斯遗忘曲线的个性化复习理念

---

**总结：** 现在每个苹果都有自己的"感觉记忆"，独立计算变红时间，实现了真正的个性化复习节奏！
