---
name: "drpy-node-house-dev"
description: "本项目(DS源仓库)的专属全栈架构与开发规范指南。请在修改、新增任何前端页面(Vue3)或后端接口(Bun+Fastify)时触发本技能，确保架构一致性。"
---

# DS 源仓库开发核心规范 (DS Source Warehouse)

## 技能概述
本技能定义了项目 `drpy-node-house` (DS 源仓库) 的全局技术选型、架构约束与开发范式。
本项目是一个轻量、高性能的去中心化存储后台与前端展示平台。

**触发场景**：
- 为本项目开发新功能（添加页面、组件或 API 接口）
- 修复本项目的前后端 Bug
- 调整路由、权限鉴权逻辑或打包部署逻辑
- 优化 UI（涉及 Vue3、TailwindCSS 或 Ant Design Vue）

## 核心技术栈

### 后端 (Backend)
- **Runtime**: Bun
- **Web 框架**: Fastify
- **数据库**: SQLite (`bun:sqlite` 驱动，**严禁引入** `better-sqlite3`)
- **ORM**: Drizzle ORM
- **实时通信**: `@fastify/websocket`
- **静态托管**: `@fastify/static` (托管 `public/` 及 SPA 前端应用)

### 前端 (Frontend - Index & Admin)
- **框架**: Vue 3 (Composition API + `<script setup>`)
- **构建工具**: Vite
- **状态管理**: Pinia
- **请求层**: Axios / 原生 Fetch
- **样式库**: Tailwind CSS (主导响应式布局、间距、颜色)
- **UI 组件库**: Ant Design Vue (主导弹窗 Modal、消息 Message、复杂表单和数据表格)
- **多语言**: 自定义简单实现 (zh/en 对象切换，不依赖 vue-i18n)

---

## 必须遵守的架构原则

### 1. 前后端同源与静态部署
- 后端服务作为单一入口启动，所有请求（静态资源、API、WebSocket）统一收口于 Fastify。
- 前端项目（前台及后台管理）的 Vite 构建产物必须输出到后端的 `public/` 目录下（如后台输出至 `public/admin`）。
- **禁止**为了前后端分离而配置额外的 Nginx、独立域名或独立网关，保持轻量级部署能力。

### 2. 状态保持与视图切换
- 针对前台的 SPA 架构（未引入 vue-router 时），使用 `v-show` 结合应用级 `ref` 记录 DOM `scrollTop`，在视图切换时精确静默恢复滚动位置。
- **避免**使用 `v-if` 导致 DOM 销毁和滚动条重置。
- 分页组件点击翻页后，必须主动触发滚动条重置回顶部。

### 3. 统一且轻量的鉴权模型 (单 Token)
- 后台与前台使用统一的轻量鉴权机制。
- 后台 Token (`admin_token`) 存储于 `localStorage` 与 Pinia 中。
- 所有的 API 请求需统一拦截注入 Bearer Token，并在请求失败 (如 `invalid_token`) 时自动执行登出并清理状态。

### 4. 危险操作的生命周期控制
- 对于重启服务、服务停机等影响服务全局生命周期的行为，**严禁**在具体的 API 路由中直接调用 `process.exit()` 或原生进程操作。
- 必须在 `src/app.js` 统一维护生命周期（`lifecycle / pending` 状态），通过暴露统一方法供路由调用，确保请求处理完毕后优雅关闭，并依赖宿主环境 (如 PM2) 自动拉起。
- 危险动作必须有明确的开关控制（如 `ADMIN_RESTART_ENABLED`）。

### 5. 交互与 UI 统一规范
- **弹窗与提示**：全面废弃原生 `alert()` 和 `confirm()`。一律使用 Ant Design Vue 的 `message.success/error/info` 和封装好的异步 `asyncConfirm(Modal.confirm)`，且必须支持多语言（i18n）映射（包含按钮文本）。
- **工具栏与布局**：统一使用 Tailwind CSS 类名控制高度与边距（如统一高度 `h-8`，使用 `flex-wrap` 适应移动端）。移动端布局和 PC 端布局通过 `window.innerWidth` 配合 CSS 响应式类处理不同的滚动和展示策略。

## 目录结构约定

```text
e:\gitwork\drpy-node-house\
├── src/                # 后端源码
│   ├── app.js          # 服务入口、静态资源代理、应用生命周期与核心路由
│   ├── config.js       # 全局配置读取
│   ├── db.js           # 数据库连接
│   ├── schema.js       # Drizzle Schema 定义
│   └── routes/         # 业务路由拆分 (admin.js, auth.js, files.js 等)
├── public/             # 静态资源输出与页面宿主
│   ├── index.html      # 前台主页面
│   ├── admin.html      # 后台主页面
│   └── admin/          # Admin UI Vite 构建产物
├── frontend/           # 前端源码工程
│   ├── src/
│   │   ├── main/       # 前台主站 (Index) Vue 源码
│   │   ├── admin/      # 后台管理 (Admin) Vue 源码
│   │   ├── shared/     # 公共组件、多语言 i18n.js
│   │   ├── stores/     # Pinia 状态管理
│   │   └── api/        # 网络请求封装
│   ├── vite.config.js
│   └── package.json
└── README.md           # 项目文档
```