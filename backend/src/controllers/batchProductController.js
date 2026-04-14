const BatchProduct = require('../models/BatchProduct');
const ExportBatch = require('../models/ExportBatch');

/**
 * 获取批次的所有产品
 */
exports.getBatchProducts = async (req, res) => {
  try {
    const { batchId } = req.params;

    // 验证批次是否存在
    const batch = await ExportBatch.getById(batchId);
    if (!batch) {
      return res.status(404).json({ success: false, message: '批次不存在' });
    }

    const products = await BatchProduct.getByBatchId(batchId);
    const totalAmount = await BatchProduct.getTotalAmount(batchId);

    res.json({ success: true, data: { products, totalAmount } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 为批次添加产品
 */
exports.addProduct = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { product_id, quantity, unit_price } = req.body;

    // 验证批次是否存在
    const batch = await ExportBatch.getById(batchId);
    if (!batch) {
      return res.status(404).json({ success: false, message: '批次不存在' });
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

    const product = await BatchProduct.create(batchId, { product_id, quantity: parseFloat(quantity), unit_price: parseFloat(unit_price) });
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
    const { batchId, productId } = req.params;
    const { quantity, unit_price } = req.body;

    // 验证产品是否存在且属于该批次
    const product = await BatchProduct.getById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }

    if (product.batch_id !== parseInt(batchId)) {
      return res.status(400).json({ success: false, message: '产品不属于该批次' });
    }

    // 验证必填字段
    if (quantity !== undefined && (quantity < 0 || isNaN(quantity))) {
      return res.status(400).json({ success: false, message: '数量必须为非负数' });
    }

    if (unit_price !== undefined && (unit_price < 0 || isNaN(unit_price))) {
      return res.status(400).json({ success: false, message: '单价必须为非负数' });
    }

    // 只更新数量和单价，产品名和型号保持不变
    const updatedProduct = await BatchProduct.update(productId, {
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
    const { batchId, productId } = req.params;

    // 验证产品是否存在且属于该批次
    const product = await BatchProduct.getById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }

    if (product.batch_id !== parseInt(batchId)) {
      return res.status(400).json({ success: false, message: '产品不属于该批次' });
    }

    await BatchProduct.delete(productId);
    res.json({ success: true, message: '产品删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
