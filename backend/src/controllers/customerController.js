const Customer = require('../models/Customer');
const CustomerDocType = require('../models/CustomerDocType');

exports.getAllCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    const customers = await Customer.getAll(search);
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.getById(id);
    
    if (!customer) {
      return res.status(404).json({ success: false, message: '客户不存在' });
    }
    
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: '客户名称不能为空' });
    }

    const customer = await Customer.create(name);

    // 为新客户初始化文件类型配置
    await CustomerDocType.initializeForCustomer(customer.id);

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: '客户名称不能为空' });
    }
    
    const customer = await Customer.getById(id);
    if (!customer) {
      return res.status(404).json({ success: false, message: '客户不存在' });
    }
    
    const updatedCustomer = await Customer.update(id, name);
    res.json({ success: true, data: updatedCustomer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    
    const customer = await Customer.getById(id);
    if (!customer) {
      return res.status(404).json({ success: false, message: '客户不存在' });
    }
    
    await Customer.delete(id);
    res.json({ success: true, message: '客户删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
