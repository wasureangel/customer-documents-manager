const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const upload = require('../middleware/upload');

/**
 * 文档路由
 * 前缀: /api
 */

// 获取批次的文件列表
router.get('/batches/:batchId/documents', documentController.getBatchDocuments);

// 上传文件
router.post('/batches/:batchId/documents', upload.single('file'), documentController.uploadDocument);

// 批量下载（按分类）
router.get('/batches/:batchId/download/:category', documentController.batchDownloadByCategory);

// 预览文件（必须在 /:id 之前，避免路由冲突）
router.get('/documents/:id/preview', documentController.previewDocument);

// 下载文件
router.get('/documents/:id', documentController.downloadDocument);

// 更新文件状态
router.put('/documents/:id/status', documentController.updateDocumentStatus);

// 删除文件
router.delete('/documents/:id', documentController.deleteDocument);

module.exports = router;
