# 背诵倒计时功能测试说明

## 修改内容

### 1. 数据结构更新 (src/store/useStore.ts)
- 在 `ReciteItem` 接口中添加了 `timerStartedAt` 和 `timerDuration` 字段
- 添加了三个新方法：
  - `getItemTimerRemaining(itemId)` - 获取倒计时剩余秒数
  - `startItemTimer(itemId, durationSeconds)` - 启动倒计时
  - `stopItemTimer(itemId)` - 停止倒计时

### 2. 组件更新 (src/components/ReciteTimer.tsx)
- 添加了 `itemId` prop 以识别项目
- 在计时器开始时调用 `startItemTimer(itemId, secs)`
- 在计时器停止或完成时调用 `stopItemTimer(itemId)`

### 3. 倒计时显示 (src/components/ReciteDrawer.tsx)
- 新增 `ReciteCountdown` 组件，用于显示实时倒计时
- 添加了 `formatCountdown` 和 `formatRemaining` 工具函数
- 在列表项中替换了静态的"复习时长"文字，改为显示动态倒计时
- 当项目没有正在进行的倒时时，仍显示静态的"复习时长"信息

## 功能流程

1. 用户在 ReciteDrawer 中点击某个红色苹果的"开始背诵"按钮
2. ReciteTimer 弹出，用户选择或自定义时长
3. 点击"开始背诵"后：
   - ReciteTimer 组件开始本地倒计时
   - 同时调用 `startItemTimer(itemId, durationSeconds)` 在 store 中记录
4. 在 ReciteDrawer 的列表中，该项目下方会显示：
   - "背诵倒计时: MM:SS" （蓝色文字，每秒更新）
5. 倒计时结束后：
   - ReciteTimer 显示完成界面
   - FeelingSelector 弹出让用户选择感受
   - `stopItemTimer(itemId)` 被调用清除倒计时
   - 列表中的倒计时显示消失
6. 如果用户中途停止：
   - 点击停止按钮
   - `stopItemTimer(itemId)` 被调用
   - 列表中的倒计时显示消失

## 测试步骤

1. 启动应用：`npm run dev`
2. 打开浏览器访问 http://localhost:3000
3. 点击底部"背诵"按钮进入背诵面板
4. 点击"添加背诵内容"，添加一个测试项目
5. 等待苹果变红（或修改今日感觉为"还需加强"让苹果快速变红）
6. 点击红色苹果的"开始背诵"按钮
7. 选择一个时长（如 15 分钟）
8. 点击"开始背诵"
9. 观察列表中的倒计时显示：
   - 应该显示 "背诵倒计时: 15:00"
   - 每秒递减
10. 倒计时结束后，应该看到感受选择界面
11. 返回列表，倒计时应该已消失

## 预期效果

- ✅ 倒计时实时更新，蓝色文字显示
- ✅ 格式为 MM:SS
- ✅ 倒计时结束后自动消失
- ✅ 中途停止也会清除倒计时
- ✅ 不影响其他功能（变红倒计时、苹果颜色等）
