const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

/**
 * 客户路由
 * 前缀: /api/customers
 */

// 获取所有客户
router.get('/', customerController.getAllCustomers);

// 根据ID获取客户
router.get('/:id', customerController.getCustomerById);

// 创建客户
router.post('/', customerController.createCustomer);

// 更新客户
router.put('/:id', customerController.updateCustomer);

// 删除客户
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;
