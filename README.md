# 🐟 程序员摸鱼计时器 | Procrastination Timer

> **摸鱼不是偷懒，是给大脑充电** ⚡

一个有趣且实用的 Web 应用，帮助程序员以幽默的方式追踪和可视化自己的"摸鱼"时间。完全本地存储，无需登录，开箱即用。

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Size](https://img.shields.io/badge/size-<50KB-lightgrey)

---

## ✨ 功能特性

### 🎯 核心功能
- **6 种摸鱼模式**：刷手机、发呆、喝水、聊天、逛 GitHub、其他
- **精准计时**：开始/暂停/停止完整控制流程
- **今日统计**：实时显示各模式累计时长和占比
- **历史记录**：按日期分组的所有计时记录
- **本地存储**：使用 localStorage，数据完全隐私
- **响应式设计**：完美适配桌面端和移动端

### 🏆 成就系统
内置 **12 种趣味成就**，包括：
- 🌱 初出茅庐：完成第一次计时
- ⏰ 时间管理大师：累计摸鱼超过 10 小时
- 🔥 连续作战：连续 3 天都有记录
- 💪 坚持不懈：连续 7 天都有记录
- 🏆 摸鱼达人：累计超过 50 小时
- 🎯 专注选手：单次超过 1 小时
- 📱 手机控：刷手机模式累计 5 小时
- ☕ 咖啡成瘾：喝水模式 50 次
- 🗣️ 社交达人：聊天模式 3 小时
- 🐙 GitHub 潜水员：逛 GitHub 2 小时
- 🧘 发呆艺术家：发呆模式 5 小时
- 👑 摸鱼之王：解锁所有成就

### 📊 数据统计
- **周/月/年/全部** 多时间范围筛选
- **每日趋势图**：Canvas 绘制的柱状图
- **类型分布图**：直观的饼图展示
- **汇总卡片**：总时长、总次数、平均时长、活跃天数

### 🎨 用户体验
- **深色/浅色主题**：一键切换，护眼模式
- **随机语录**：每次摸鱼显示有趣的程序员语录
- **庆祝动画**：成就解锁时的 confetti 特效
- **Toast 提示**：友好的操作反馈
- **键盘快捷键**：空格开始/暂停，Esc 停止
- **数据导出**：支持 JSON 格式备份

---

## 🚀 快速开始

### 方式一：直接使用（推荐）
访问部署后的 GitHub Pages 链接即可使用，无需安装任何依赖。

### 方式二：本地运行
```bash
# 克隆项目
git clone https://github.com/ZHY-CHIHUO/procrastination-timer.git
cd procrastination-timer

# 直接在浏览器打开 src/index.html
# 或使用任意 HTTP 服务器
python3 -m http.server 8080
# 访问 http://localhost:8080/src/
```

---

## 📁 项目结构

```
procrastination-timer/
├── docs/                    # 文档目录
│   └── PRD-v1.0.0.docx     # 产品需求文档
├── src/                     # 源代码目录
│   ├── index.html          # 主页面（HTML + CSS）
│   └── app.js              # 应用逻辑（JavaScript）
├── tests/                   # 测试目录
│   └── test-app.js         # 单元测试文件
├── assets/                  # 资源目录（预留）
├── README.md               # 项目说明文档
└── LICENSE                 # MIT License
```

---

## 💻 技术栈

| 层次 | 技术 | 说明 |
|------|------|------|
| 前端框架 | 原生 HTML/CSS/JS | 零依赖，加载速度快 |
| UI 风格 | CSS Variables | 完全可控，支持主题切换 |
| 数据存储 | localStorage API | 无需后端，隐私安全 |
| 图表绘制 | Canvas 2D API | 无第三方依赖，性能好 |
| 构建工具 | 无 | 纯静态，直接部署 |

**核心优势**：
- 📦 **零依赖**：不需要 npm、webpack、React/Vue 等
- 🚀 **超轻量**：总文件大小 < 50KB
- 🔒 **隐私优先**：所有数据存储在本地浏览器
- 🎨 **现代化设计**：CSS 变量、渐变、动画、响应式布局
- 📱 **跨平台**：支持所有现代浏览器和移动设备

---

## 🧪 运行测试

```bash
node tests/test-app.js
# 预期: 74/74 测试通过 (100%)
```

---

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

---

**🐟 Happy Fishing! 记得摸完鱼要回来写代码哦~**

*最后更新时间：2026-08-22*
