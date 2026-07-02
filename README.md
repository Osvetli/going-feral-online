# 🔮 赛博发疯功德置换器

一个"情绪发泄 + 物理交互 + 抽卡收集 + 云端存档 + 分享系统"的轻量游戏化 Web App。

## 核心理念

把你的怨气转化为功德，收集赛博法器，在崩溃的世界里活出仪式感。

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 | React + TypeScript + Vite + TailwindCSS |
| 状态管理 | Zustand |
| 物理引擎 | Matter.js |
| 手绘系统 | Canvas API |
| 后端 | Node.js + Express |
| 数据库 | SQLite + Prisma ORM |
| API | REST |

## 项目结构

```
crazy-project/
├── client/                 # 前端 React App
│   └── src/
│       ├── pages/          # 6 个页面组件
│       ├── components/     # 7 个通用组件
│       ├── store/          # Zustand 状态管理
│       ├── utils/          # API 封装 + 抽卡逻辑
│       └── types/          # TypeScript 类型定义
├── server/                 # 后端 Express API
│   ├── prisma/             # Schema + 种子数据
│   └── src/
│       ├── routes/         # 5 组 API 路由
│       └── utils/          # 抽卡逻辑
└── README.md
```

## 快速启动

### 1. 后端

```bash
cd server
npm install
npm run db:migrate    # 初始化 SQLite 数据库
npm run db:seed       # 写入 8 张卡牌种子数据
npm run dev           # 启动在 http://localhost:3001
```

### 2. 前端

```bash
cd client
npm install
npm run dev           # 启动在 http://localhost:5173
```

前端已配置 proxy，`/api` 请求自动转发到 `localhost:3001`。

## API 端点

| Method | Path | 说明 |
|--------|------|------|
| POST | `/api/auth/register` | 注册/登录 |
| GET | `/api/auth/me` | 获取当前用户 |
| POST | `/api/runs` | 保存发疯记录 |
| GET | `/api/runs?userId=` | 查询历史记录 |
| POST | `/api/gacha/draw` | 抽卡 |
| GET | `/api/collection/:userId` | 获取图鉴 |
| GET | `/api/collection/:userId/stats` | 收集统计 |
| POST | `/api/share` | 生成分享链接 |
| GET | `/api/share/:id` | 查看分享 |

## 游戏流程

```
首页 → 选择身份（打工人 / 学术崩溃者）
  → 输入页 → 文字发疯 / 手绘发疯
  → 物理爆发（Matter.js 高压锅炼化怨灵）
  → 板砖消灭小怨灵
  → 抽卡（SSR/SR/R/N 概率抽卡）
  → 图鉴收集
  → 分享
```

## 卡池

### 👨‍💻 怨气打工人
| 稀有度 | 卡牌 | 概率 |
|--------|------|------|
| SSR | 因果律反弹御守 🛡️ | 3% |
| SR | 大厂黑话过滤器 🔍 | 12% |
| R | 疯狂星期四V我50 🍗 | 25% |
| N | 摆烂便利贴 📝 | 60% |

### 🎓 学术崩溃者
| 稀有度 | 卡牌 | 概率 |
|--------|------|------|
| SSR | 导师已读乱回结界 🔮 | 3% |
| SR | DDL逆转时钟 ⏰ | 12% |
| R | 降重符 📜 | 25% |
| N | 学术垃圾袋 🗑️ | 60% |

## 数据库管理

```bash
cd server
npm run db:studio    # 打开 Prisma Studio 可视化管理
```

## License

MIT — 随便玩，记得保持发疯 ✨
