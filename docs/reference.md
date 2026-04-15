# DSH 文件操作 API 接口文档

> **Base URL**: `http://<host>:5678/api`
> **认证方式**: JWT Bearer Token / X-API-Token / Query Token

---

## 目录

- [认证说明](#认证说明)
- [获取 Token](#获取-token)
- [文件上传](#1-文件上传)
- [文件列表](#2-文件列表)
- [获取上传者列表](#3-获取上传者列表)
- [文件元数据](#4-文件元数据)
- [文件下载/预览](#5-文件下载预览)
- [替换文件](#6-替换文件覆盖上传)
- [切换可见性](#7-切换文件可见性)
- [更新标签](#8-更新文件标签)
- [删除文件](#9-删除文件)
- [错误码参考](#错误码参考)

---

## 认证说明

本系统的 API 认证基于 JWT Token，支持以下三种方式传递：

| 方式 | 格式 | 说明 |
|------|------|------|
| **Authorization Header** (推荐) | `Authorization: Bearer <token>` | 标准 JWT 方式，前端 Web UI 使用 |
| **X-API-Token Header** | `X-API-Token: <token>` | 适合脚本/CI/自动化工具调用 |
| **Query Token** | `?token=<token>` | 适合浏览器直接访问/下载 |

### 认证级别

| 级别 | 说明 | 适用接口 |
|------|------|----------|
| **公开** | 无需 Token，受匿名开关控制 | 文件列表、下载、预览、上传者列表 |
| **可选认证** | 不传 Token 则以游客身份访问 | 上传（需开启匿名上传）、文件列表 |
| **必须认证** | 必须提供有效 Token | 替换、删除、标签、切换可见性 |

---

## 获取 Token

通过登录接口获取 JWT Token，Token 有效期由服务端配置决定。

### `POST /api/auth/login`

**Request Body** (JSON):

```json
{
  "username": "admin",
  "password": "your_password"
}
```

**Response** (200):

```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "nickname": "管理员",
    "role": "super_admin",
    "status": "active",
    "points": 100
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**cURL 示例**:

```bash
curl -X POST http://localhost:5678/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'
```

> **提示**: 登录后请保存返回的 `token` 字段，后续所有需要认证的接口都使用此 Token。

---

## 1. 文件上传

### `POST /api/files/upload`

上传新文件到 IPFS 存储。

**认证**: 可选（匿名上传需后台开启）

**Content-Type**: `multipart/form-data`

**Query Parameters**:

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `is_public` | string | `true` | 是否公开 (`true` / `false`) |
| `tags` | string | `""` | 标签，逗号分隔 (如 `js,dr2`) |

**Form Data**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `file` | File | ✅ | 要上传的文件 |

**Response** (200):

```json
{
  "id": 42,
  "cid": "QmXxXxXxXxXxXxXxXxXxXxXxXxXxXx",
  "filename": "example.js",
  "size": 1024,
  "user_id": 1,
  "is_public": 1,
  "tags": "js,dr2"
}
```

**cURL 示例**:

```bash
# 认证上传
curl -X POST "http://localhost:5678/api/files/upload?is_public=true&tags=js" \
  -H "Authorization: Bearer <token>" \
  -F "file=@./myfile.js"

# 匿名上传（需后台开启）
curl -X POST "http://localhost:5678/api/files/upload" \
  -F "file=@./myfile.js"
```

**错误响应**:

| 状态码 | 说明 |
|--------|------|
| 400 | 无文件 / 文件类型不允许 |
| 401 | 未登录且未开启匿名上传 |
| 413 | 文件过大 |
| 500 | 上传失败 |

---

## 2. 文件列表

### `GET /api/files/list`

分页获取文件列表，支持搜索、标签筛选和上传者筛选。

**认证**: 可选（未登录只能看到公开文件）

**Query Parameters**:

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | int | `1` | 页码 |
| `limit` | int | `10` | 每页数量 |
| `search` | string | `""` | 按文件名搜索 |
| `tag` | string | `""` | 标签筛选，逗号分隔 |
| `uploader` | string | `""` | 上传者 ID 筛选，逗号分隔 |

**Response** (200):

```json
{
  "files": [
    {
      "id": 1,
      "cid": "QmXxXx...",
      "filename": "example.js",
      "mimetype": "text/javascript",
      "size": 1024,
      "created_at": 1700000000,
      "user_id": 1,
      "is_public": 1,
      "tags": "js,dr2",
      "username": "admin",
      "nickname": "管理员"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

**cURL 示例**:

```bash
# 获取第一页
curl "http://localhost:5678/api/files/list?page=1&limit=20"

# 搜索 + 标签筛选（需认证查看自己的私密文件）
curl -H "Authorization: Bearer <token>" \
  "http://localhost:5678/api/files/list?search=test&tag=js&page=1"

# 按上传者筛选
curl "http://localhost:5678/api/files/list?uploader=1,2"
```

---

## 3. 获取上传者列表

### `GET /api/files/uploaders`

获取所有有公开文件的上传者信息，用于前端筛选下拉框。

**认证**: 无需

**Response** (200):

```json
[
  { "id": 1, "username": "admin", "nickname": "管理员" },
  { "id": 2, "username": "user1", "nickname": "用户一" }
]
```

---

## 4. 文件元数据

### `GET /api/files/:cid`

根据 CID 获取文件元数据信息。

**认证**: 可选（未登录只能查看公开文件）

**Query Parameters**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | int | 可选，指定文件记录 ID（同一 CID 可能有多个记录时使用） |

**Response** (200):

```json
{
  "id": 1,
  "cid": "QmXxXx...",
  "filename": "example.js",
  "mimetype": "text/javascript",
  "size": 1024,
  "created_at": 1700000000,
  "user_id": 1,
  "is_public": 1,
  "tags": "js"
}
```

**cURL 示例**:

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:5678/api/files/QmXxXx...?id=1"
```

---

## 5. 文件下载/预览

### `GET /api/files/download/:cid`

下载或预览文件内容。返回文件流。

**认证**: 可选（受匿名下载/预览开关控制）

**Query Parameters**:

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `preview` | string | `false` | `true` 时浏览器内联显示，`false` 时触发下载 |
| `id` | int | - | 可选，指定文件记录 ID |
| `token` | string | - | 可选，通过 URL 传递认证 Token |

**Response**: 文件二进制流

| Header | 说明 |
|--------|------|
| `Content-Type` | 文件 MIME 类型 |
| `Content-Disposition` | `inline` (预览) 或 `attachment` (下载) |

**cURL 示例**:

```bash
# 下载文件
curl -O -J "http://localhost:5678/api/files/download/QmXxXx...?token=<token>"

# 预览文件（浏览器直接访问）
# http://localhost:5678/api/files/download/QmXxXx...?preview=true&token=<token>
```

---

## 6. 替换文件（覆盖上传）

### `PUT /api/files/:id/replace`

用新文件替换已有文件的内容。文件元数据中的 ID、标签、可见性等保持不变，仅更新 CID、文件名、MIME 类型和大小。

**认证**: **必须** — 支持 Bearer Token 和 X-API-Token 两种方式

**Content-Type**: `multipart/form-data`

**URL Parameters**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | int | 要替换的文件记录 ID |

**Form Data**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `file` | File | ✅ | 新文件内容 |

**权限**: 文件所有者 或 超级管理员

**Response** (200):

```json
{
  "id": 42,
  "cid": "QmNewCidAfterReplace...",
  "filename": "updated_file.js",
  "size": 2048,
  "old_cid": "QmOldCidBefore...",
  "updated_at": 1700001000
}
```

**cURL 示例**:

```bash
# 使用 Bearer Token 替换
curl -X PUT "http://localhost:5678/api/files/42/replace" \
  -H "Authorization: Bearer <token>" \
  -F "file=@./updated_file.js"

# 使用 X-API-Token 替换（适合脚本自动化）
curl -X PUT "http://localhost:5678/api/files/42/replace" \
  -H "X-API-Token: <token>" \
  -F "file=@./updated_file.js"
```

**错误响应**:

| 状态码 | 说明 |
|--------|------|
| 400 | 无文件 / 文件类型不允许 |
| 401 | 未提供有效 Token |
| 403 | 非文件所有者且非超级管理员 |
| 404 | 文件记录不存在 |
| 413 | 文件过大 |
| 500 | 替换失败 |

> **自动化场景**: 配合登录接口获取 Token 后，可实现 CI/CD 自动发布脚本：先通过文件列表 API 获取目标文件 ID，再调用替换接口更新内容。

---

## 7. 切换文件可见性

### `POST /api/files/:id/toggle-visibility`

切换文件的公开/私密状态。

**认证**: **必须** (Bearer Token)

**URL Parameters**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | int | 文件记录 ID |

**权限**: 文件所有者 或 超级管理员

**Response** (200):

```json
{
  "id": 1,
  "cid": "QmXxXx...",
  "filename": "example.js",
  "is_public": 0
}
```

**cURL 示例**:

```bash
curl -X POST "http://localhost:5678/api/files/42/toggle-visibility" \
  -H "Authorization: Bearer <token>"
```

---

## 8. 更新文件标签

### `PUT /api/files/:id/tags`

更新文件的标签列表。标签必须是后台配置的允许标签之一。

**认证**: **必须** (Bearer Token)

**URL Parameters**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | int | 文件记录 ID |

**Request Body** (JSON):

```json
{
  "tags": ["js", "dr2"]
}
```

**权限**: 文件所有者 或 超级管理员

**Response** (200):

```json
{
  "id": 1,
  "cid": "QmXxXx...",
  "tags": "js,dr2"
}
```

**cURL 示例**:

```bash
curl -X PUT "http://localhost:5678/api/files/42/tags" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"tags":["js","dr2"]}'
```

---

## 9. 删除文件

### `DELETE /api/files/:id`

删除文件记录（仅删除数据库记录，IPFS 上的内容不受影响）。

**认证**: **必须** (Bearer Token)

**URL Parameters**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | int | 文件记录 ID |

**权限**: 文件所有者 或 超级管理员

**Response** (200):

```json
{
  "success": true
}
```

**cURL 示例**:

```bash
curl -X DELETE "http://localhost:5678/api/files/42" \
  -H "Authorization: Bearer <token>"
```

---

## 错误码参考

### HTTP 状态码

| 状态码 | 含义 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 / Token 无效 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如用户名已存在） |
| 413 | 文件过大 |
| 429 | 请求频率超限 |
| 500 | 服务器内部错误 |

### 通用错误响应格式

```json
{
  "error": "错误描述信息"
}
```

### 常见 error 值

| error | 说明 |
|-------|------|
| `Authentication required` | 需要提供有效的认证 Token |
| `Unauthorized` | 无权操作此资源 |
| `File not found` | 文件记录不存在 |
| `No file uploaded` | 请求中未包含文件 |
| `File type not allowed. Allowed: ...` | 文件类型不在白名单中 |
| `File too large` / 文件体积过大 | 文件超出大小限制 |
| `Anonymous upload is disabled` | 未开启匿名上传 |
| `Anonymous preview is disabled` | 未开启匿名预览 |
| `Anonymous download is disabled` | 未开启匿名下载 |
| `Tags must be an array` | 标签参数格式错误 |
| `Invalid tags: ...` | 包含不允许的标签 |

---

## 自动化接入流程

### 典型场景：CI/CD 自动发布文件

```bash
#!/bin/bash
HOST="http://localhost:5678"
USERNAME="admin"
PASSWORD="your_password"

# 1. 登录获取 Token
TOKEN=$(curl -s -X POST "$HOST/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}" \
  | jq -r '.token')

echo "Token obtained: ${TOKEN:0:20}..."

# 2. 上传新文件
RESULT=$(curl -s -X POST "$HOST/api/files/upload?is_public=true&tags=js,dr2" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./dist/bundle.js")

FILE_ID=$(echo $RESULT | jq -r '.id')
echo "Uploaded file ID: $FILE_ID"

# 3. 后续更新：替换已有文件
curl -X PUT "$HOST/api/files/$FILE_ID/replace" \
  -H "X-API-Token: $TOKEN" \
  -F "file=@./dist/bundle_new.js"

echo "File replaced successfully!"
```

### 典型场景：定时同步脚本

```bash
#!/bin/bash
HOST="http://your-server:5678"
TOKEN="your_jwt_token"

# 查找目标文件
FILE_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$HOST/api/files/list?search=config.json&limit=1" \
  | jq -r '.files[0].id')

if [ "$FILE_ID" != "null" ] && [ -n "$FILE_ID" ]; then
  # 文件存在，替换
  curl -X PUT "$HOST/api/files/$FILE_ID/replace" \
    -H "X-API-Token: $TOKEN" \
    -F "file=@./config.json"
  echo "Replaced file ID: $FILE_ID"
else
  # 文件不存在，新建上传
  curl -X POST "$HOST/api/files/upload?is_public=false" \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@./config.json"
  echo "Uploaded new file"
fi
```

---

## 接口总览表

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| `POST` | `/api/auth/login` | 无 | 登录获取 Token |
| `POST` | `/api/auth/register` | 无 | 注册新用户 |
| `POST` | `/api/files/upload` | 可选 | 上传文件 |
| `GET` | `/api/files/list` | 可选 | 文件列表 |
| `GET` | `/api/files/uploaders` | 无 | 上传者列表 |
| `GET` | `/api/files/download/:cid` | 可选 | 下载/预览文件 |
| `GET` | `/api/files/:cid` | 可选 | 文件元数据 |
| `PUT` | `/api/files/:id/replace` | **必须** | 替换文件内容 |
| `POST` | `/api/files/:id/toggle-visibility` | **必须** | 切换可见性 |
| `PUT` | `/api/files/:id/tags` | **必须** | 更新标签 |
| `DELETE` | `/api/files/:id` | **必须** | 删除文件 |
