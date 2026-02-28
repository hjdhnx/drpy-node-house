# Decentralized File Storage (DS)

基于 IPFS 和 Fastify 构建的去中心化文件存储系统。提供现代化的 Web 界面，支持文件上传、管理、预览和分享，致力于打造安全、私密且易用的去中心化存储体验。

## ✨ 主要特性

*   **去中心化存储**：核心基于 [Helia](https://github.com/ipfs/helia) (IPFS)，文件内容去中心化寻址，永不丢失。
*   **现代化 UI**：使用 Vue 3 + Tailwind CSS 构建，拥有精美的玻璃拟态风格界面，适配 PC 和移动端。
*   **多用户支持**：
    *   支持用户注册/登录 (JWT 认证)。
    *   **私密/公开权限控制**：可将文件设为仅自己可见或公开分享。
    *   匿名用户也可上传公开文件。
*   **强大的文件管理**：
    *   **拖拽上传**：支持文件及**文件夹**拖拽上传（自动递归解析）。
    *   **批量上传**：支持多文件同时上传，实时显示上传进度。
    *   **列表管理**：支持分页、按时间排序、文件名模糊搜索。
    *   **在线预览**：支持图片、代码、文本等多种格式在线直接预览。
    *   **一键分享**：快速复制 CID 或下载链接。
*   **高性能后端**：
    *   基于 [Bun](https://bun.sh) 运行时和 [Fastify](https://fastify.dev) 框架。
    *   使用 SQLite 存储元数据，轻量高效。

## 🛠️ 技术栈

*   **Runtime**: [Bun](https://bun.sh)
*   **Backend**: Fastify, @fastify/jwt, @fastify/multipart
*   **Storage**: Helia (IPFS), SQLite (metadata)
*   **Frontend**: Vue 3 (ESM), Tailwind CSS, Native HTML5 Drag & Drop API

## 🚀 快速开始

### 前提条件

*   请确保已安装 [Bun](https://bun.sh)。

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

2.  访问：打开浏览器访问 `http://localhost:3000`

## 📂 项目结构

```
.
├── public/             # 前端静态资源
│   ├── index.html      # 主页面
│   └── js/
│       ├── app.js      # Vue 应用逻辑
│       └── i18n.js     # 国际化语言包
├── src/                # 后端源码
│   ├── app.js          # 应用入口
│   ├── config.js       # 配置文件
│   ├── db.js           # 数据库连接
│   ├── ipfs.js         # Helia IPFS 节点初始化
│   ├── routes/         # API 路由
│   └── services/       # 业务逻辑
├── data/               # 数据存储 (SQLite & IPFS repo)
└── package.json
```

## 📝 API 接口

*   `POST /api/auth/register` - 用户注册
*   `POST /api/auth/login` - 用户登录
*   `GET /api/files/list` - 获取文件列表 (支持分页 `page`, `limit` 和搜索 `search`)
*   `POST /api/files/upload` - 上传文件
*   `GET /api/files/download/:cid` - 下载/预览文件
*   `DELETE /api/files/:cid` - 删除文件
*   `POST /api/files/:cid/toggle-visibility` - 切换文件公开/私密状态

## 📄 License

ISC
