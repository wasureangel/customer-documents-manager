const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

/**
 * 产品管理路由
 * 前缀: /api/products
 */

// 获取所有产品
router.get('/', productController.getAllProducts);

// 根据ID获取产品
router.get('/:id', productController.getProductById);

// 创建产品
router.post('/', productController.createProduct);

// 更新产品
router.put('/:id', productController.updateProduct);

// 删除产品
router.delete('/:id', productController.deleteProduct);

module.exports = router;
