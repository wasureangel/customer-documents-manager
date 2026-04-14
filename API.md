# API 接口文档

## 基础信息
- 基础URL: `http://localhost:3001/api`
- 数据格式: JSON
- 字符编码: UTF-8

## 通用响应格式
```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

## 错误响应格式
```json
{
  "success": false,
  "message": "错误信息"
}
```

---

## 客户管理接口

### 获取所有客户
```
GET /customers
```

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "ABC公司",
      "created_at": "2024-01-01 10:00:00",
      "updated_at": "2024-01-01 10:00:00"
    }
  ]
}
```

### 根据ID获取客户
```
GET /customers/:id
```

**参数:**
- `id`: 客户ID

### 创建客户
```
POST /customers
```

**请求体:**
```json
{
  "name": "客户名称"
}
```

### 更新客户
```
PUT /customers/:id
```

**请求体:**
```json
{
  "name": "新的客户名称"
}
```

### 删除客户
```
DELETE /customers/:id
```

---

## 出口批次管理接口

### 获取所有批次
```
GET /batches
```

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "customer_id": 1,
      "batch_number": "BATCH-2024-001",
      "customer_name": "ABC公司",
      "created_at": "2024-01-01 10:00:00",
      "updated_at": "2024-01-01 10:00:00"
    }
  ]
}
```

### 根据ID获取批次
```
GET /batches/:id
```

### 创建批次
```
POST /batches
```

**请求体:**
```json
{
  "customer_id": 1,
  "batch_number": "BATCH-2024-002"
}
```

### 更新批次
```
PUT /batches/:id
```

**请求体:**
```json
{
  "batch_number": "BATCH-2024-003"
}
```

### 删除批次
```
DELETE /batches/:id
```

---

## 文件类型管理接口

### 获取所有文件类型
```
GET /document-types
```

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "商业发票",
      "description": "商业发票",
      "is_required": 1
    }
  ]
}
```

### 获取必需文件类型
```
GET /document-types/required
```

### 根据ID获取文件类型
```
GET /document-types/:id
```

### 创建文件类型
```
POST /document-types
```

**请求体:**
```json
{
  "name": "文件类型名称",
  "description": "文件描述",
  "is_required": true
}
```

### 更新文件类型
```
PUT /document-types/:id
```

**请求体:**
```json
{
  "name": "新的文件类型名称",
  "description": "新的文件描述",
  "is_required": false
}
```

### 删除文件类型
```
DELETE /document-types/:id
```

---

## 文件管理接口

### 获取批次的文件列表
```
GET /batches/:batchId/documents
```

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "batch_id": 1,
      "document_type_id": 1,
      "file_path": "/uploads/batches/1/document-123.pdf",
      "file_name": "invoice.pdf",
      "file_size": 102400,
      "uploaded_at": "2024-01-01 10:00:00",
      "status": "pending",
      "document_type_name": "商业发票"
    }
  ],
  "stats": {
    "total": 5,
    "approved": 3,
    "pending": 2,
    "rejected": 0
  }
}
```

### 上传文件
```
POST /batches/:batchId/documents
Content-Type: multipart/form-data
```

**请求参数:**
- `file`: 文件（必填）
- `documentTypeId`: 文件类型ID（必填）

**支持的文件类型:**
- PDF: `.pdf`
- Word: `.doc`, `.docx`
- Excel: `.xls`, `.xlsx`
- 图片: `.jpg`, `.jpeg`, `.png`

**文件大小限制:** 10MB

### 下载文件
```
GET /documents/:id
```

### 更新文件状态
```
PUT /documents/:id/status
```

**请求体:**
```json
{
  "status": "approved"
}
```

**状态值:**
- `pending`: 待审核
- `approved`: 已通过
- `rejected`: 已拒绝

### 删除文件
```
DELETE /documents/:id
```

---

## 健康检查接口

### 健康检查
```
GET /health
```

**响应示例:**
```json
{
  "status": "ok",
  "message": "服务器运行正常"
}
```

---

## 文件访问

### 访问上传的文件
```
GET /uploads/{file_path}
```

文件存储在 `backend/uploads/` 目录下，可通过静态文件服务访问。

---

## 错误码说明

| HTTP状态码 | 说明 |
|-----------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 注意事项

1. 所有时间戳格式为: `YYYY-MM-DD HH:mm:ss`
2. 文件上传需要使用 `multipart/form-data` 格式
3. 删除客户或批次会级联删除相关数据
4. 文件类型如果有文件关联，删除时会受限
