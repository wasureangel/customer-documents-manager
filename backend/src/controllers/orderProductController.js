const OrderProduct = require('../models/OrderProduct');
const Order = require('../models/Order');

/**
 * 获取订单的所有产品
 */
exports.getOrderProducts = async (req, res) => {
  try {
    const { orderId } = req.params;

    // 验证订单是否存在
    const order = await Order.getById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    const products = await OrderProduct.getByOrderId(orderId);
    const totalAmount = await OrderProduct.getTotalAmount(orderId);

    res.json({ success: true, data: { products, totalAmount } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 为订单添加产品
 */
exports.addProduct = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { product_id, quantity, unit_price } = req.body;

    // 验证订单是否存在
    const order = await Order.getById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    // 验证必填字段
    if (!product_id) {
      return res.status(400).json({ success: false, message: '请选择产品' });
    }

    if (quantity === undefined || quantity === null || quantity === '') {
      return res.status(400).json({ success: false, message: '数量不能为空' });
    }

    if (quantity < 0 || isNaN(quantity)) {
      return res.status(400).json({ success: false, message: '数量必须为非负数' });
    }

    if (unit_price === undefined || unit_price === null || unit_price === '') {
      return res.status(400).json({ success: false, message: '单价不能为空' });
    }

    if (unit_price < 0 || isNaN(unit_price)) {
      return res.status(400).json({ success: false, message: '单价必须为非负数' });
    }

    const product = await OrderProduct.create(orderId, { product_id, quantity: parseFloat(quantity), unit_price: parseFloat(unit_price) });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 更新产品
 */
exports.updateProduct = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const { quantity, unit_price } = req.body;

    // 验证产品是否存在且属于该订单
    const product = await OrderProduct.getById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }

    if (product.order_id !== parseInt(orderId)) {
      return res.status(400).json({ success: false, message: '产品不属于该订单' });
    }

    // 验证必填字段
    if (quantity !== undefined && (quantity < 0 || isNaN(quantity))) {
      return res.status(400).json({ success: false, message: '数量必须为非负数' });
    }

    if (unit_price !== undefined && (unit_price < 0 || isNaN(unit_price))) {
      return res.status(400).json({ success: false, message: '单价必须为非负数' });
    }

    // 只更新数量和单价，产品名和型号保持不变
    const updatedProduct = await OrderProduct.update(productId, {
      product_name: product.product_name,
      model: product.model,
      quantity: quantity !== undefined ? quantity : product.quantity,
      unit_price: unit_price !== undefined ? unit_price : product.unit_price
    });
    res.json({ success: true, data: updatedProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 删除产品
 */
exports.deleteProduct = async (req, res) => {
  try {
    const { orderId, productId } = req.params;

    // 验证产品是否存在且属于该订单
    const product = await OrderProduct.getById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }

    if (product.order_id !== parseInt(orderId)) {
      return res.status(400).json({ success: false, message: '产品不属于该订单' });
    }

    await OrderProduct.delete(productId);
    res.json({ success: true, message: '产品删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
