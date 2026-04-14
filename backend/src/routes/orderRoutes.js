const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const orderProductController = require('../controllers/orderProductController');

/**
 * 订单路由
 * 前缀: /api/orders
 */

// 获取所有订单
router.get('/', orderController.getAllOrders);

// 根据客户ID获取订单
router.get('/customer/:customerId', orderController.getOrdersByCustomerId);

// 根据ID获取订单
router.get('/:id', orderController.getOrderById);

// 创建订单
router.post('/', orderController.createOrder);

// 更新订单
router.put('/:id', orderController.updateOrder);

// 删除订单
router.delete('/:id', orderController.deleteOrder);

// 订单产品路由
router.get('/:orderId/products', orderProductController.getOrderProducts);
router.post('/:orderId/products', orderProductController.addProduct);
router.put('/:orderId/products/:productId', orderProductController.updateProduct);
router.delete('/:orderId/products/:productId', orderProductController.deleteProduct);

module.exports = router;
