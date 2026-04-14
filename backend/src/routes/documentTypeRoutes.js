const express = require('express');
const router = express.Router();
const documentTypeController = require('../controllers/documentTypeController');

/**
 * 文件类型路由
 * 前缀: /api/document-types
 */

// 获取所有文件类型
router.get('/', documentTypeController.getAllDocumentTypes);

// 获取必需文件类型
router.get('/required', documentTypeController.getRequiredDocumentTypes);

// 根据ID获取文件类型
router.get('/:id', documentTypeController.getDocumentTypeById);

// 创建文件类型
router.post('/', documentTypeController.createDocumentType);

// 更新文件类型
router.put('/:id', documentTypeController.updateDocumentType);

// 删除文件类型
router.delete('/:id', documentTypeController.deleteDocumentType);

module.exports = router;
