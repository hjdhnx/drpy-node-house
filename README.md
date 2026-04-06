# Decentralized File Storage (DS)

![Version](https://img.shields.io/badge/version-1.0.2-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)

基于 IPFS (Helia) 和 Fastify 构建的现代化去中心化文件存储系统。提供精美的 Web 界面，支持多用户管理、权限控制、标签系统以及强大的后台管理功能。

致力于打造安全、私密且易用的去中心化存储体验。

## ✨ 主要特性

*   **去中心化核心**：基于 [Helia](https://github.com/ipfs/helia) (IPFS)，文件内容去中心化寻址，永不丢失。
*   **现代化 UI**：全面升级为基于 Vue 3 (Composition API) SFC 单文件组件架构，使用 Vite 进行构建。结合 Tailwind CSS 与 Ant Design Vue，提供精美的响应式管理界面与前台展示体验，完美适配 PC 和移动端。
*   **统一的同源架构**：前端项目(前台与后台)经 Vite 编译后自动输出至后端的 `public/` 目录，由 Fastify 统一作为单一服务入口提供访问与 API 支持。
*   **用户功能**：
    *   **个人中心**：用户可维护昵称、QQ、邮箱、手机号等信息。
    *   **下载偏好**：支持选择直链下载或第三方协议（如海阔视界、影图、皮卡丘等），点击下载自动调用对应协议。
    *   **文件管理**：上传、预览（支持多种格式）、删除、设置可见性（公开/私密）、标签管理。
*   **管理功能**：
    *   **用户管理**：查看用户列表，封禁/解封用户，提升用户为管理员，删除用户（仅限超级管理员）。
    *   **系统设置**：配置注册策略（开放/关闭/邀请/审核）、允许的文件后缀、最大文件大小、允许的标签等。
    *   **协议头配置**：支持自定义下载协议模板（如海阔视界、影图等），可根据文件类型自动生成对应协议链接。
    *   **全站打包下载**：支持管理员一键下载全站公开资源，生成 ZIP 包。
        *   **智能目录映射**：
            *   `.json`, `.txt`, `.m3u` → `json/`
            *   `.js` → `spider/js/` (含 `dr2` 标签的文件存入 `spider/js_dr2/`)
            *   `.php` → `spider/php/`
            *   `.py` → `spider/py/`
        *   **高级过滤**：支持排除特殊文件（如 `_` 开头的文件）。
        *   **冲突处理**：自动处理同名文件冲突（追加 `_1`, `_2` 后缀）。
    *   **邀请码管理**：生成和管理注册邀请码。
*   **高性能后端**：
    *   基于 [Bun](https://bun.sh) 运行时和 [Fastify](https://fastify.dev) 框架。
    *   使用 SQLite 存储元数据，轻量高效。

## 🛠️ 技术栈

*   **Runtime**: [Bun](https://bun.sh)
*   **Backend**: Fastify, @fastify/jwt, @fastify/multipart, SQLite (bun:sqlite)
*   **Storage**: Helia (IPFS), Blockstore/Datastore FS
*   **Database**: SQLite (bun:sqlite) + Drizzle ORM
*   **Frontend**: Vue 3 (Composition API + SFC), Vite, Pinia, Tailwind CSS, Ant Design Vue

## 🗄️ 数据库管理

本项目使用 [Drizzle ORM](https://orm.drizzle.team/) 进行数据库操作和迁移管理。

### 常用命令

*   **生成迁移文件** (根据 `src/schema.js` 的变更生成 SQL):
    ```bash
    bun run db:generate
    ```

*   **执行数据库迁移** (使用 `bun:sqlite` 应用生成的 SQL):
    ```bash
    bun run db:migrate
    ```

## 🗓️ 规划中的功能 (Roadmap)

### v1.1 - 用户交互增强 (Next Release)
- [ ] **实时聊天系统**：基于 WebSocket 实现站内用户实时通讯。
    - [ ] 全局公共聊天室
    - [ ] 用户私信功能
    - [ ] 在线用户列表
- [ ] **用户个人主页**：展示用户公开分享的文件和基本信息。
- [ ] **文件评论与点赞**：支持对公开文件进行评论互动。
- [ ] **消息通知中心**：系统通知、审核结果、互动消息的实时推送。

### v1.2 - 存储增强
- [ ] **IPFS 集群支持**：支持连接外部 IPFS 节点或 Pinning 服务。
- [ ] **大文件分片上传**：优化大文件上传体验，支持断点续传。
- [ ] **WebDAV 支持**：支持通过 WebDAV 协议挂载存储。

## 🚀 快速开始 (本地开发)

### 前提条件

请确保已安装 [Bun](https://bun.sh)。

### 安装

1.  克隆仓库：
    ```bash
    git clone <repository-url>
    cd decentralized-file-storage
    ```

2.  安装依赖：
    ```bash
    bun install
    ```

### 运行

1.  启动开发服务器：
    ```bash
    bun run dev
    ```
    或者生产模式：
    ```bash
    bun start
    ```

2.  访问：打开浏览器访问 `http://localhost:5678` (默认端口已改为 5678)

## 📐 开发规范与专属 Skill

本项目已配置专属的 Trae/AI 开发技能 (Skill)：`drpy-node-house-dev`。
在进行二次开发或向 AI 提问时，AI 会自动加载 `.trae/skills/drpy-node-house-dev/SKILL.md` 中的架构规范。

**核心开发原则简述**：
1. **单一服务入口**：前后端同源，前端 Vite 编译产出到 `public/`，由 Fastify 统一路由，不引入 Nginx 增加部署复杂度。
2. **状态保持**：前台 SPA 视图切换严格使用 `v-show` + `scrollTop` 恢复，禁止使用 `v-if` 导致 DOM 销毁。
3. **UI 规范**：废弃原生 `alert/confirm`，全面使用 Ant Design Vue 的 `message` 与封装的 `asyncConfirm`。
4. **数据库驱动**：严格使用 `bun:sqlite`，禁止引入 `better-sqlite3`。

## 🐧 Linux 环境部署指南

本指南将帮助你在 Linux 服务器（如 Ubuntu/Debian/CentOS）上部署该服务，并使用 PM2 进行进程守护。

### 1. 安装 Bun

如果服务器尚未安装 Bun，请运行以下命令进行安装：

```bash
curl -fsSL https://bun.sh/install | bash
```

安装完成后，请根据提示将 `bun` 添加到环境变量（通常需要 source 一下 `~/.bashrc` 或重启终端）。

### 2. 安装 PM2

使用 `bun` 或 `npm` 全局安装 PM2：

```bash
bun add -g pm2
# 或者
npm install -g pm2
```

### 3. 获取代码并安装依赖

```bash
git clone <repository-url>
cd decentralized-file-storage
bun install
```

### 4. 使用 PM2 启动服务

项目已内置适配 Bun 的 PM2 启动脚本。在项目根目录下运行：

```bash
bun run pm2:start
```

此命令会使用 `bun` 作为解释器启动服务，进程名为 `drpy-node-house`。

**常用管理命令：**

*   **查看状态**：`bun run pm2:logs` 或 `pm2 status`
*   **停止服务**：`bun run pm2:stop`
*   **重启服务**：`bun run pm2:restart`
*   **删除服务**：`bun run pm2:delete`
*   **查看日志**：`pm2 logs drpy-node-house`

### 5. 配置端口与主机

默认配置下，服务监听 `[::]:5678` (支持 IPv6/IPv4)。
如需修改，请编辑 `src/config.js` 文件，或设置环境变量：

```bash
PORT=8080 bun run pm2:start
```

## 👑 角色与权限管理

系统包含三种角色：
1.  **User (普通用户)**：上传、管理自己的文件。
2.  **Admin (管理员)**：进入后台管理，管理用户状态（封禁/解封），配置系统设置，管理邀请码，全站打包下载。
3.  **Super Admin (超级管理员)**：拥有 Admin 的所有权限，额外支持**查看所有用户的文件**、**删除用户**。

### 如何设置超级管理员

项目提供了一个管理脚本，用于手动提升用户角色。

1.  首先注册一个普通用户（例如用户名：`admin`）。
2.  在服务器终端运行以下命令：

```bash
# 查看用户列表
bun scripts/manage_roles.js list

# 将用户设置为超级管理员
bun scripts/manage_roles.js set <username> super_admin
# 例如：bun scripts/manage_roles.js set admin super_admin
```

设置完成后，重新登录该账号即可获得超级管理员权限。

## 📂 项目结构

```text
.
├── src/                # 后端源码 (Bun + Fastify)
│   ├── app.js          # 后端服务入口、生命周期与核心路由
│   ├── config.js       # 配置模块
│   ├── db.js           # 数据库连接
│   ├── schema.js       # Drizzle Schema
│   └── routes/         # 拆分的路由文件 (auth, admin, files 等)
├── frontend/           # 前端源码工程 (Vue 3 + Vite)
│   ├── src/
│   │   ├── main/       # 前台主站 (Index)
│   │   ├── admin/      # 后台管理 (Admin)
│   │   ├── shared/     # 公共组件、工具、i18n
│   │   └── api/        # 网络请求封装
│   ├── vite.config.js  # Vite 多入口配置
│   └── package.json
├── public/             # 前端构建产物与页面宿主
│   ├── index.html      # 前台主页面入口
│   ├── admin.html      # 后台主页面入口
│   └── admin/          # Vite 编译输出目录
└── package.json
```

## 📝 API 接口概览

*   **Auth**: `/api/auth/register`, `/api/auth/login`
*   **Files**:
    *   `GET /api/files/list` - 获取文件列表 (支持分页、搜索、标签筛选)
    *   `POST /api/files/upload` - 上传文件
    *   `GET /api/files/download/:cid` - 下载/预览
    *   `DELETE /api/files/:cid` - 删除文件
    *   `POST /api/files/:cid/toggle-visibility` - 切换可见性
    *   `PUT /api/files/:cid/tags` - 更新标签
*   **Admin**:
    *   `GET /api/admin/users` - 用户列表
    *   `PUT /api/admin/users/:id` - 更新用户状态/角色
    *   `DELETE /api/admin/users/:id` - 删除用户 (Super Admin)
    *   `GET/PUT /api/admin/settings` - 系统设置
    *   `GET /api/admin/download-package` - 全站打包下载
    *   `GET/POST/DELETE /api/admin/invites` - 邀请码管理

## 📄 License

ISC
