const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// 导入路由
const customerRoutes = require('./routes/customerRoutes');
const batchRoutes = require('./routes/batchRoutes');
const documentTypeRoutes = require('./routes/documentTypeRoutes');
const documentRoutes = require('./routes/documentRoutes');
const customerDocTypeRoutes = require('./routes/customerDocTypeRoutes');
const orderRoutes = require('./routes/orderRoutes');
const productRoutes = require('./routes/productRoutes');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（用于访问上传的文件）
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API路由
app.use('/api/customers', customerRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/document-types', documentTypeRoutes);
app.use('/api', documentRoutes);
app.use('/api', customerDocTypeRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '服务器运行正常' });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

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
  
  res.status(500).json({ success: false, message: err.message || '服务器内部错误' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log('========================================');
  console.log('  外贸出口文件管理系统后端服务');
  console.log('========================================');
  console.log(`  服务器运行在端口: ${PORT}`);
  console.log(`  环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log('========================================');
  console.log('');
  console.log('API端点:');
  console.log(`  - GET  http://localhost:${PORT}/health`);
  console.log(`  - GET  http://localhost:${PORT}/api/customers`);
  console.log(`  - GET  http://localhost:${PORT}/api/batches`);
  console.log(`  - GET  http://localhost:${PORT}/api/document-types`);
  console.log('');
});

module.exports = app;
