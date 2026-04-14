const Product = require('../models/Product');

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.getAll();
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.getById(id);

    if (!product) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, model } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: '产品名称不能为空' });
    }

    if (!model) {
      return res.status(400).json({ success: false, message: '产品型号不能为空' });
    }

    const product = await Product.create(name, model);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    // 处理唯一约束错误
    if (error.message && error.message.includes('UNIQUE')) {
      return res.status(400).json({ success: false, message: '该产品名和型号组合已存在' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, model } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: '产品名称不能为空' });
    }

    if (!model) {
      return res.status(400).json({ success: false, message: '产品型号不能为空' });
    }

    const product = await Product.getById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }

    const updatedProduct = await Product.update(id, name, model);
    res.json({ success: true, data: updatedProduct });
  } catch (error) {
    // 处理唯一约束错误
    if (error.message && error.message.includes('UNIQUE')) {
      return res.status(400).json({ success: false, message: '该产品名和型号组合已存在' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.getById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }

    // 检查是否被订单引用
    const isReferenced = await Product.isReferenced(id);
    if (isReferenced) {
      return res.status(400).json({ success: false, message: '该产品已被订单引用，无法删除' });
    }

    await Product.delete(id);
    res.json({ success: true, message: '产品删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
