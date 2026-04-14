const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batchController');
const batchProductController = require('../controllers/batchProductController');

/**
 * 出口批次路由
 * 前缀: /api/batches
 */

// 按客户分组获取批次(必须在 /:id 之前)
router.get('/grouped', batchController.getBatchesGroupedByCustomer);

// 获取所有批次
router.get('/', batchController.getAllBatches);

// 根据ID获取批次
router.get('/:id', batchController.getBatchById);

// 创建批次
router.post('/', batchController.createBatch);

// 更新批次
router.put('/:id', batchController.updateBatch);

// 删除批次
router.delete('/:id', batchController.deleteBatch);

// 批次产品路由
router.get('/:batchId/products', batchProductController.getBatchProducts);
router.post('/:batchId/products', batchProductController.addProduct);
router.put('/:batchId/products/:productId', batchProductController.updateProduct);
router.delete('/:batchId/products/:productId', batchProductController.deleteProduct);

module.exports = router;
