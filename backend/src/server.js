const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

// 导入中间件
const { authMiddleware } = require('./middleware/auth');

// 导入路由
const customerRoutes = require('./routes/customerRoutes');
const batchRoutes = require('./routes/batchRoutes');
const documentTypeRoutes = require('./routes/documentTypeRoutes');
const documentRoutes = require('./routes/documentRoutes');
const customerDocTypeRoutes = require('./routes/customerDocTypeRoutes');
const authRoutes = require('./routes/authRoutes');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3001;
const isDev = process.env.NODE_ENV === 'development';

// 前端静态文件路径
const frontendPath = path.join(__dirname, '../../frontend/dist');
const frontendExists = require('fs').existsSync(frontendPath);

// 安全头中间件
app.use(helmet({
  contentSecurityPolicy: false, // 关闭 CSP，因为使用了 Vite 的 HMR
  crossOriginEmbedderPolicy: false // 允许跨域加载资源
}));

// 开发环境下启用 CORS
if (isDev) {
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  }));
}

// 解析中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查端点（无需认证）
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '服务器运行正常' });
});

// 托管前端静态文件（无需认证）- 始终托管（如果存在）
if (frontendExists) {
  app.use(express.static(frontendPath));
  console.log('前端静态文件已托管');
} else {
  console.log('警告：前端构建文件不存在，请先运行 cd frontend && npm run build');
}

// 认证路由（登录接口，无需认证）
app.use('/api/auth', authRoutes);

// 认证中间件 - 保护所有后续路由
app.use(authMiddleware);

// 静态文件服务（用于访问上传的文件，需要认证）
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API路由
app.use('/api/customers', customerRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/document-types', documentTypeRoutes);
app.use('/api', documentRoutes);
app.use('/api', customerDocTypeRoutes);

// SPA fallback - 对于非 API 路由，返回 index.html
if (frontendExists) {
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    } else {
      res.status(404).json({ success: false, message: '接口不存在' });
    }
  });
} else {
  // 前端文件不存在时的 404 处理
  app.use((req, res) => {
    res.status(404).json({ success: false, message: '前端文件不存在，请先构建前端' });
  });
}

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);

  // Multer错误处理
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: '文件大小超过限制' });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ success: false, message: '意外的文件字段' });
  }

  // 认证错误
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ success: false, message: '未授权访问' });
  }

  res.status(500).json({ success: false, message: err.message || '服务器内部错误' });
});

// 启动服务器
async function startServer() {
  const migrateAddBillOfLading = require('./migrations/add_bill_of_lading');
  const migrateAddDocumentTypeCategory = require('./migrations/add_document_type_category');
  const migrateAddUniqueCustomersName = require('./migrations/add_unique_customers_name');
  const migrateAddUniqueBatchNumber = require('./migrations/add_unique_export_batches_batch_number');

  console.log('开始执行数据库迁移...');
  try {
    await migrateAddBillOfLading();
    await migrateAddDocumentTypeCategory();
    await migrateAddUniqueCustomersName();
    await migrateAddUniqueBatchNumber();
    console.log('数据库迁移完成');
  } catch (err) {
    console.error('迁移失败:', err.message);
    throw err;
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log('========================================');
    console.log('  外贸出口文件管理系统后端服务');
    console.log('========================================');
    console.log(`  服务器运行在端口: ${PORT}`);
    console.log(`  环境: ${isDev ? 'development' : 'production'}`);
    console.log(`  访问地址: http://localhost:${PORT}`);
    console.log(`  时间: ${new Date().toLocaleString('zh-CN')}`);
    console.log('========================================');
    console.log('');
    console.log('API端点:');
    console.log(`  - GET  http://localhost:${PORT}/health`);
    console.log(`  - POST http://localhost:${PORT}/api/auth/login`);
    console.log(`  - GET  http://localhost:${PORT}/api/customers`);
    console.log(`  - GET  http://localhost:${PORT}/api/batches`);
    console.log(`  - GET  http://localhost:${PORT}/api/document-types`);
    console.log('');
  });
}

startServer().catch(err => {
  console.error('服务器启动失败:', err);
  process.exit(1);
});

module.exports = app;
