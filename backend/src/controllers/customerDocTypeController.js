const CustomerDocType = require('../models/CustomerDocType');
const DocumentType = require('../models/DocumentType');
const Customer = require('../models/Customer');

/**
 * 获取客户的所有文件类型配置
 */
exports.getCustomerDocumentTypes = async (req, res) => {
  try {
    const { customerId } = req.params;

    // 验证客户是否存在
    const customer = await Customer.getById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: '客户不存在' });
    }

    const configs = await CustomerDocType.getByCustomerId(customerId);
    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 批量更新客户的文件类型配置
 */
exports.updateCustomerDocumentTypes = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { configs } = req.body;

    // 验证客户是否存在
    const customer = await Customer.getById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: '客户不存在' });
    }

    // 验证请求数据
    if (!Array.isArray(configs)) {
      return res.status(400).json({ success: false, message: 'configs 必须是数组' });
    }

    // 验证每个配置项
    for (const config of configs) {
      if (typeof config.document_type_id !== 'number') {
        return res.status(400).json({ success: false, message: 'document_type_id 必须是数字' });
      }
      if (typeof config.is_required !== 'boolean') {
        return res.status(400).json({ success: false, message: 'is_required 必须是布尔值' });
      }
    }

    const results = await CustomerDocType.batchUpdate(customerId, configs);

    // 获取更新后的完整配置列表
    const updatedConfigs = await CustomerDocType.getByCustomerId(customerId);

    res.json({ success: true, data: updatedConfigs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 获取所有文件类型（用于配置界面下拉选择）
 */
exports.getAllDocumentTypes = async (req, res) => {
  try {
    const documentTypes = await DocumentType.getAll();
    res.json({ success: true, data: documentTypes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
