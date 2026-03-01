# Decentralized File Storage (DS)

基于 IPFS (Helia) 和 Fastify 构建的现代化去中心化文件存储系统。提供精美的 Web 界面，支持多用户管理、权限控制、标签系统以及强大的后台管理功能。

致力于打造安全、私密且易用的去中心化存储体验。

## ✨ 主要特性

*   **去中心化核心**：基于 [Helia](https://github.com/ipfs/helia) (IPFS)，文件内容去中心化寻址，永不丢失。
*   **现代化 UI**：使用 Vue 3 (ESM) + Tailwind CSS 构建，拥有精美的玻璃拟态风格界面，适配 PC 和移动端。
*   **多用户体系**：
    *   支持用户注册/登录 (JWT 认证)。
    *   **角色管理**：支持普通用户、管理员 (Admin) 和超级管理员 (Super Admin)。
    *   **权限控制**：
        *   **私密/公开**：用户可将文件设为仅自己可见或公开分享。
        *   **超级管理员权限**：可查看系统内所有文件（包括私密文件），并拥有删除任意用户和文件的最高权限。
*   **强大的文件管理**：
    *   **拖拽上传**：支持文件及文件夹拖拽上传（自动递归解析）。
    *   **标签系统**：支持为文件添加标签，并可通过标签筛选文件。管理员可配置允许的标签列表。
    *   **在线预览**：支持图片、代码、文本、视频等多种格式在线直接预览。
    *   **一键分享**：快速复制 CID 或下载链接。
*   **后台管理面板**：
    *   **用户管理**：查看用户列表，封禁/解封用户，提升用户为管理员，删除用户（仅限超级管理员）。
    *   **系统设置**：配置注册策略（开放/关闭/邀请/审核）、允许的文件后缀、最大文件大小、允许的标签等。
    *   **全站打包下载**：支持管理员一键下载全站公开资源，支持自定义目录映射、文件过滤（排除特殊文件）及自动重名处理。
    *   **邀请码管理**：生成和管理注册邀请码。
*   **高性能后端**：
    *   基于 [Bun](https://bun.sh) 运行时和 [Fastify](https://fastify.dev) 框架。
    *   使用 SQLite 存储元数据，轻量高效。

## 🛠️ 技术栈

*   **Runtime**: [Bun](https://bun.sh)
*   **Backend**: Fastify, @fastify/jwt, @fastify/multipart, SQLite (bun:sqlite)
*   **Storage**: Helia (IPFS), Blockstore/Datastore FS
*   **Frontend**: Vue 3 (ESM via Import Map), Tailwind CSS (CDN), Native HTML5 Drag & Drop API

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

```
.
├── public/             # 前端静态资源 (Vue, Tailwind)
│   ├── index.html      # 用户主页
│   ├── admin.html      # 后台管理页
│   └── js/             # 前端逻辑
├── src/                # 后端源码
│   ├── app.js          # 应用入口
│   ├── config.js       # 配置文件 (包含 DEFAULT_SETTINGS)
│   ├── db.js           # SQLite 数据库初始化
│   ├── ipfs.js         # Helia IPFS 节点封装
│   ├── routes/         # API 路由 (Auth, Files, Admin)
│   └── services/       # 业务逻辑层
├── scripts/            # 管理脚本
│   └── manage_roles.js # 角色管理工具
├── data/               # 数据存储 (SQLite & IPFS repo)
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
