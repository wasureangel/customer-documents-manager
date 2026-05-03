const Document = require('../models/Document');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const Batch = require('../models/ExportBatch');
const contentDisposition = require('content-disposition');

exports.getBatchDocuments = async (req, res) => {
  try {
    const { batchId } = req.params;
    const documents = await Document.getByBatchId(batchId);
    const stats = await Document.getBatchStats(batchId);
    
    res.json({ success: true, data: documents, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { documentTypeId } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ success: false, message: '未上传文件' });
    }
    
    if (!documentTypeId) {
      return res.status(400).json({ success: false, message: '文件类型不能为空' });
    }
    
    // multer 以 latin1 解码文件名,需要重新转为 utf8
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    
    const document = await Document.create(
      batchId,
      documentTypeId,
      file.path,
      originalName,
      file.size
    );
    
    res.status(201).json({ success: true, data: document });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.getById(id);

    if (!document) {
      return res.status(404).json({ success: false, message: '文件不存在' });
    }

    if (!fs.existsSync(document.file_path)) {
      return res.status(404).json({ success: false, message: '文件已被删除' });
    }

    res.download(document.file_path, document.file_name);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.previewDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.getById(id);

    if (!document) {
      return res.status(404).json({ success: false, message: '文件不存在' });
    }

    if (!fs.existsSync(document.file_path)) {
      return res.status(404).json({ success: false, message: '文件已被删除' });
    }

    // 设置内联显示，允许浏览器预览
    res.setHeader('Content-Disposition', 'inline');
    res.sendFile(document.file_path);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateDocumentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: '无效的状态值' });
    }
    
    const document = await Document.getById(id);
    if (!document) {
      return res.status(404).json({ success: false, message: '文件不存在' });
    }
    
    const updatedDocument = await Document.updateStatus(id, status);
    res.json({ success: true, data: updatedDocument });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.getById(id);

    if (!document) {
      return res.status(404).json({ success: false, message: '文件不存在' });
    }

    if (fs.existsSync(document.file_path)) {
      fs.unlinkSync(document.file_path);
    }

    await Document.delete(id);

    res.json({ success: true, message: '文件删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.batchDownloadByCategory = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { category } = req.params;

    // 获取批次信息以获取发票号
    const batch = await Batch.getById(batchId);
    if (!batch) {
      return res.status(404).json({ success: false, message: '批次不存在' });
    }

    // 提取发票号中的数字部分
    const invoiceNumber = (batch.batch_number || '').replace(/[^0-9]/g, '');

    // 获取该批次的所有文件
    const allDocuments = await Document.getByBatchId(batchId);

    // 根据分类过滤文件
    const documents = allDocuments.filter(doc => doc.category === category);

    if (documents.length === 0) {
      return res.status(404).json({ success: false, message: '没有找到该分类的文件' });
    }

    // 检查所有文件是否存在
    for (const doc of documents) {
      if (!fs.existsSync(doc.file_path)) {
        return res.status(404).json({ success: false, message: `文件 ${doc.file_name} 不存在` });
      }
    }

    // 设置响应头（用 content-disposition 库生成标准编码）
    const zipFileName = `${invoiceNumber}${category}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', contentDisposition(zipFileName));

    // 创建ZIP流，指定 UTF-8 文件名编码
    const archive = archiver('zip', {
      zlib: { level: 9 },
      nameEncoding: 'utf8'
    });

    // 处理错误
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      res.status(500).json({ success: false, message: '创建ZIP文件失败' });
    });

    // 将ZIP流输出到响应
    archive.pipe(res);

    // 添加文件到ZIP
    for (const doc of documents) {
      const fileExt = path.extname(doc.file_name);
      const fileName = `${doc.document_type_name}_${doc.file_name}`;
      archive.file(doc.file_path, { name: fileName });
    }

    // 完成ZIP
    await archive.finalize();
  } catch (error) {
    console.error('Batch download error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
