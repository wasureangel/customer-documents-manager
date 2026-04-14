const DocumentType = require('../models/DocumentType');
const CustomerDocType = require('../models/CustomerDocType');

exports.getAllDocumentTypes = async (req, res) => {
  try {
    const documentTypes = await DocumentType.getAll();
    res.json({ success: true, data: documentTypes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRequiredDocumentTypes = async (req, res) => {
  try {
    const documentTypes = await DocumentType.getRequired();
    res.json({ success: true, data: documentTypes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDocumentTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const documentType = await DocumentType.getById(id);
    
    if (!documentType) {
      return res.status(404).json({ success: false, message: '文件类型不存在' });
    }
    
    res.json({ success: true, data: documentType });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createDocumentType = async (req, res) => {
  try {
    const { name, description, is_required, category } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: '文件类型名称不能为空' });
    }

    const existing = await DocumentType.getByName(name);
    if (existing) {
      return res.status(400).json({ success: false, message: '文件类型已存在' });
    }

    const documentType = await DocumentType.create(name, description, is_required, category || '报关资料');

    // 为所有现有客户添加该文件类型
    await CustomerDocType.addDocumentTypeToAllCustomers(documentType.id, is_required);

    res.status(201).json({ success: true, data: documentType });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateDocumentType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_required, category } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: '文件类型名称不能为空' });
    }

    const documentType = await DocumentType.getById(id);
    if (!documentType) {
      return res.status(404).json({ success: false, message: '文件类型不存在' });
    }

    const existing = await DocumentType.getByName(name);
    if (existing && existing.id !== parseInt(id)) {
      return res.status(400).json({ success: false, message: '文件类型名称已存在' });
    }

    const updatedDocumentType = await DocumentType.update(id, name, description, is_required, category || '报关资料');
    res.json({ success: true, data: updatedDocumentType });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteDocumentType = async (req, res) => {
  try {
    const { id } = req.params;
    
    const documentType = await DocumentType.getById(id);
    if (!documentType) {
      return res.status(404).json({ success: false, message: '文件类型不存在' });
    }
    
    await DocumentType.delete(id);
    res.json({ success: true, message: '文件类型删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
