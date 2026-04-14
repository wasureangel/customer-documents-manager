# 外贸出口文件管理系统

该项目可以以客户和批次为单位管理外贸出口文件（区分清关资料与报关资料），实现提醒与归档、快速打包下载的功能。
注：该项目不包含用户管理，在使用时请注意信息安全。

## 技术栈
- **前端**: React
- **后端**: Node.js + Express
- **数据库**: SQLite
- **文件存储**: 本地文件系统

## 项目结构
```
crm/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── config/         # 配置文件
│   │   ├── controllers/    # 控制器
│   │   ├── models/         # 数据库模型
│   │   ├── routes/         # API 路由
│   │   ├── services/       # 业务逻辑层
│   │   ├── middleware/     # 中间件
│   │   └── database/       # 数据库初始化
│   ├── uploads/            # 文件上传目录
│   └── package.json
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── components/     # 组件
│   │   ├── pages/          # 页面
│   │   ├── services/       # API 服务
│   │   ├── hooks/          # 自定义 hooks
│   │   └── utils/          # 工具函数
│   └── package.json
└── README.md
```

## 数据库模型

### Customer (客户表)
- id: 主键
- name: 客户名称
- created_at: 创建时间
- updated_at: 更新时间

### ExportBatch (出口批次表)
- id: 主键
- customer_id: 外键，关联客户
- batch_number: 批次编号
- created_at: 创建时间
- updated_at: 更新时间

### DocumentType (文件类型表)
- id: 主键
- name: 类型名称
- description: 描述
- is_required: 是否必需

### Document (文件记录表)
- id: 主键
- batch_id: 外键，关联批次
- document_type_id: 外键，关联文件类型
- file_path: 文件路径
- file_name: 文件名
- file_size: 文件大小
- uploaded_at: 上传时间
- status: 状态

## API 接口

### 客户管理
- GET /api/customers - 获取客户列表
- POST /api/customers - 创建客户
- GET /api/customers/:id - 获取客户详情
- PUT /api/customers/:id - 更新客户
- DELETE /api/customers/:id - 删除客户

### 出口批次管理
- GET /api/batches - 获取批次列表
- POST /api/batches - 创建批次
- GET /api/batches/:id - 获取批次详情
- PUT /api/batches/:id - 更新批次
- DELETE /api/batches/:id - 删除批次
- GET /api/customers/:customerId/batches - 获取客户的批次列表

### 文件类型管理
- GET /api/document-types - 获取文件类型列表
- POST /api/document-types - 创建文件类型
- GET /api/document-types/:id - 获取文件类型详情
- PUT /api/document-types/:id - 更新文件类型
- DELETE /api/document-types/:id - 删除文件类型

### 文件管理
- POST /api/batches/:batchId/documents - 上传文件
- GET /api/batches/:batchId/documents - 获取批次的文件列表
- GET /api/documents/:id - 下载文件
- DELETE /api/documents/:id - 删除文件
- PUT /api/documents/:id/status - 更新文件状态

## 文件存储目录结构
```
backend/uploads/
├── customers/              # 客户相关文件
├── batches/                # 批次文件
│   └── {batch_id}/        # 按批次ID分类
│       └── documents/     # 文档文件
└── temp/                  # 临时文件
```
