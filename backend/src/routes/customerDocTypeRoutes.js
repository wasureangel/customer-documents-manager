const express = require('express');
const router = express.Router();
const customerDocTypeController = require('../controllers/customerDocTypeController');

/**
 * 客户文件类型配置路由
 * 前缀: /api/customers/:customerId/document-types
 */

// 获取客户的所有文件类型配置
router.get('/customers/:customerId/document-types', customerDocTypeController.getCustomerDocumentTypes);

// 批量更新客户的文件类型配置
router.put('/customers/:customerId/document-types', customerDocTypeController.updateCustomerDocumentTypes);

module.exports = router;
