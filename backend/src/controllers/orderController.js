const Order = require('../models/Order');
const OrderProduct = require('../models/OrderProduct');

exports.getAllOrders = async (req, res) => {
  try {
    const { search } = req.query;
    const orders = await Order.getAll(search);

    // 为每个订单加载产品和总金额
    const ordersWithDetails = await Promise.all(orders.map(async (order) => {
      const products = await OrderProduct.getByOrderId(order.id);
      const totalAmount = await OrderProduct.getTotalAmount(order.id);
      return {
        ...order,
        products,
        totalAmount
      };
    }));

    res.json({ success: true, data: ordersWithDetails });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrdersByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;
    const orders = await Order.getByCustomerId(customerId);

    // 为每个订单加载产品和总金额
    const ordersWithDetails = await Promise.all(orders.map(async (order) => {
      const products = await OrderProduct.getByOrderId(order.id);
      const totalAmount = await OrderProduct.getTotalAmount(order.id);
      return {
        ...order,
        products,
        totalAmount
      };
    }));

    res.json({ success: true, data: ordersWithDetails });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.getById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { customer_id, order_number } = req.body;

    if (!customer_id) {
      return res.status(400).json({ success: false, message: '客户ID不能为空' });
    }

    const order = await Order.create(customer_id, order_number);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { order_number } = req.body;

    if (!order_number) {
      return res.status(400).json({ success: false, message: '订单号不能为空' });
    }

    const order = await Order.getById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    const updatedOrder = await Order.update(id, order_number);
    res.json({ success: true, data: updatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.getById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    await Order.delete(id);
    res.json({ success: true, message: '订单删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
