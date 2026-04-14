const ExportBatch = require('../models/ExportBatch');
const Document = require('../models/Document');
const CustomerDocType = require('../models/CustomerDocType');

exports.getAllBatches = async (req, res) => {
  try {
    const { search } = req.query;
    const batches = await ExportBatch.getAll(search);

    const batchesWithCompletion = await Promise.all(batches.map(async batch => {
      const documents = await Document.getByBatchId(batch.id);
      const requiredDocTypes = await CustomerDocType.getRequiredByCustomerId(batch.customer_id);

      const uploadedRequiredTypes = new Set(
        documents
          .filter(d => requiredDocTypes.some(t => t.document_type_id === d.document_type_id))
          .map(d => d.document_type_id)
      );

      const completionRate = requiredDocTypes.length > 0
        ? Math.round((uploadedRequiredTypes.size / requiredDocTypes.length) * 100)
        : 100;

      return {
        ...batch,
        completionRate,
        uploadedCount: uploadedRequiredTypes.size,
        totalCount: requiredDocTypes.length,
        missingCount: requiredDocTypes.length - uploadedRequiredTypes.size
      };
    }));

    res.json({ success: true, data: batchesWithCompletion });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBatchesByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;
    const batches = await ExportBatch.getByCustomerId(customerId);
    res.json({ success: true, data: batches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBatchById = async (req, res) => {
  try {
    const { id } = req.params;
    const batch = await ExportBatch.getById(id);
    
    if (!batch) {
      return res.status(404).json({ success: false, message: '批次不存在' });
    }
    
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createBatch = async (req, res) => {
  try {
    const { customer_id, batch_number, bill_of_lading } = req.body;

    if (!customer_id) {
      return res.status(400).json({ success: false, message: '客户ID不能为空' });
    }

    const batch = await ExportBatch.create(customer_id, batch_number, bill_of_lading);
    res.status(201).json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { batch_number, bill_of_lading } = req.body;

    if (!batch_number) {
      return res.status(400).json({ success: false, message: '批次编号不能为空' });
    }

    const batch = await ExportBatch.getById(id);
    if (!batch) {
      return res.status(404).json({ success: false, message: '批次不存在' });
    }

    const updatedBatch = await ExportBatch.update(id, batch_number, bill_of_lading);
    res.json({ success: true, data: updatedBatch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBatchesGroupedByCustomer = async (req, res) => {
  try {
    const { search } = req.query;
    const batches = await ExportBatch.getAll(search);

    const batchesWithCompletion = await Promise.all(batches.map(async batch => {
      const documents = await Document.getByBatchId(batch.id);
      const requiredDocTypes = await CustomerDocType.getRequiredByCustomerId(batch.customer_id);

      const uploadedRequiredTypes = new Set(
        documents
          .filter(d => requiredDocTypes.some(t => t.document_type_id === d.document_type_id))
          .map(d => d.document_type_id)
      );

      const completionRate = requiredDocTypes.length > 0
        ? Math.round((uploadedRequiredTypes.size / requiredDocTypes.length) * 100)
        : 100;

      return {
        ...batch,
        completionRate,
        uploadedCount: uploadedRequiredTypes.size,
        totalCount: requiredDocTypes.length,
        missingCount: requiredDocTypes.length - uploadedRequiredTypes.size
      };
    }));

    const grouped = batchesWithCompletion.reduce((acc, batch) => {
      const customerId = batch.customer_id;
      const customerName = batch.customer_name || '未知客户';

      if (!acc[customerId]) {
        acc[customerId] = {
          customer_id: customerId,
          customer_name: customerName,
          batches: []
        };
      }

      acc[customerId].batches.push(batch);
      return acc;
    }, {});

    const result = Object.values(grouped);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;
    
    const batch = await ExportBatch.getById(id);
    if (!batch) {
      return res.status(404).json({ success: false, message: '批次不存在' });
    }
    
    await ExportBatch.delete(id);
    res.json({ success: true, message: '批次删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
