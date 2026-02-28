# 去中心化文件存储系统开发计划 (Decentralized File Storage System)

## 1. 项目概述
本项目旨在构建一个基于 Node.js (ESM) 的去中心化文件存储系统。后端使用 Fastify 框架提供 API 服务，核心存储层采用 IPFS 协议的 JS 实现库 Helia。前端提供适配 PC 和移动端的 Web 界面，实现类似网盘的文件上传、下载和管理功能。

## 2. 技术栈 (Tech Stack)

### Backend (后端)
- **Runtime**: Bun (Compatible with Node.js ESM)
- **Framework**: Fastify (高性能 Web 框架)
- **Storage Core**: Helia (IPFS implementation in JS)
  - `@helia/unixfs`: 处理文件系统层
  - `blockstore-fs` / `datastore-fs`: 本地持久化存储 (确保重启后数据还在)
- **Database (Metadata)**: Bun SQLite (Built-in `bun:sqlite` module, high performance)
- **Upload Handling**: `@fastify/multipart`
- **Utilities**: `multiformats` (CID 处理)

### Frontend (前端)
- **Framework**: Vanilla JS + TailwindCSS (CDN) for simplicity & speed, or Vue 3 via CDN.
  - *决策*: 使用原生 ESM 模块加载 Vue 3 (浏览器端) + TailwindCSS，保持项目结构简单，无需复杂的构建步骤。
- **UI Components**: 响应式布局，适配 Mobile/PC。

### DevOps & Tooling
- **Package Manager**: Bun
- **Process Manager**: Bun (Built-in watch mode)

## 3. 目录结构 (Directory Structure)

```
/
├── src/
│   ├── app.js          # Fastify 应用入口
│   ├── config.js       # 配置文件 (端口, 存储路径等)
│   ├── db.js           # SQLite 数据库初始化与操作
│   ├── ipfs.js         # Helia 节点初始化与封装
│   ├── routes/         # API 路由
│   │   ├── files.js    # 文件增删改查
│   │   └── system.js   # 系统状态
│   └── services/       # 业务逻辑层
├── public/             # 静态资源 (Frontend)
│   ├── index.html
│   ├── css/
│   └── js/
├── storage/            # IPFS 本地存储目录 (Blockstore/Datastore)
├── data/               # SQLite 数据库文件
├── package.json
└── README.md
```

## 4. 功能模块拆解 (Features)

### Phase 1: 基础架构搭建
- [ ] 初始化 Node.js 项目 (ESM)
- [ ] 安装依赖 (Fastify, Helia, SQLite)
- [ ] 搭建 Fastify Server 骨架
- [ ] 初始化 Helia 节点 (FS-backed)

### Phase 2: 核心业务逻辑
- [ ] **文件上传 (Upload)**:
  - 接收 multipart/form-data
  - 写入 Helia (IPFS add)
  - 获取 CID
  - 存入 SQLite (CID -> Filename, Size, Type)
- [ ] **文件列表 (List)**:
  - 查询 SQLite 获取所有文件元数据
- [ ] **文件下载 (Download)**:
  - 根据 CID 从 Helia 读取流
  - 设置 Content-Type 和 Content-Disposition
  - Stream response to client

### Phase 3: 前端界面开发
- [ ] **UI 框架**: 集成 TailwindCSS + Vue 3 (ESM import)
- [ ] **文件列表页**: 展示文件图标、名称、大小、CID
- [ ] **上传组件**: 拖拽上传 / 点击上传，显示进度
- [ ] **预览/下载**: 点击文件进行操作
- [ ] **响应式适配**: 手机端适配 (Card 视图 vs Table 视图)

## 5. 开发步骤 (Development Steps)
1. 环境初始化 & 依赖安装
2. 数据库设计 (Schema) & IPFS 初始化代码
3. 后端 API 开发 (Upload/List/Download)
4. 前端页面开发 & 联调
5. 最终测试与优化
