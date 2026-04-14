import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Button,
  Table,
  Upload,
  message,
  Modal,
  Popconfirm,
  Select,
  Progress,
  Space,
  Alert,
  Image,
  Tag,
  Form,
  InputNumber
} from 'antd';
import {
  ArrowLeftOutlined,
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  FileTextOutlined,
  EyeOutlined,
  PlusOutlined,
  EditOutlined
} from '@ant-design/icons';
import { batchAPI, documentAPI, documentTypeAPI, customerDocTypeAPI, productAPI, productCatalogAPI, orderAPI } from '../services/api';
import { renderAsync } from 'docx-preview';
import * as XLSX from 'xlsx';

const { Option } = Select;

function BatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [customerDocTypes, setCustomerDocTypes] = useState([]);
  const [requiredDocTypes, setRequiredDocTypes] = useState([]);
  const [productCatalog, setProductCatalog] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadFileList, setUploadFileList] = useState([]);
  const [uploadCategory, setUploadCategory] = useState('报关资料');
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [excelData, setExcelData] = useState(null);
  const wordContainerRef = useRef(null);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm] = Form.useForm();
  const [importOrderModalVisible, setImportOrderModalVisible] = useState(false);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadBatchData();
  }, [id]);

  const loadBatchData = async () => {
    try {
      setLoading(true);
      const response = await batchAPI.getById(id);
      setBatch(response.data);

      if (response.data.documents) {
        setDocuments(response.data.documents || []);
      }

      if (response.data.requiredDocTypes) {
        setRequiredDocTypes(response.data.requiredDocTypes || []);
      }

      // 加载该客户的文件类型配置
      if (response.data.customer_id) {
        const docTypesRes = await documentTypeAPI.getAll();
        const customerDocRes = await customerDocTypeAPI.getByCustomerId(response.data.customer_id);

        // 将配置转换为 Map
        const configMap = new Map(
          (customerDocRes.data || []).map(c => [c.document_type_id, c.is_required === 1])
        );

        // 为所有文件类型添加客户配置
        const customerDocTypes = (docTypesRes.data || []).map(dt => ({
          ...dt,
          is_required: configMap.get(dt.id) || false
        }));

        setCustomerDocTypes(customerDocTypes);
      }

      // 加载产品目录
      const productsRes = await productCatalogAPI.getAll();
      setProductCatalog(productsRes.data || []);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file) => {
    if (!selectedDocType) {
      message.error('请先选择文件类型');
      return Upload.LIST_IGNORE;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentTypeId', selectedDocType);

    try {
      setUploading(true);
      await documentAPI.upload(id, formData);
      message.success('上传成功');
      setUploadFileList([]);
      setUploadModalVisible(false);
      setSelectedDocType(null);
      loadBatchData();
      return Upload.LIST_IGNORE;
    } catch (error) {
      message.error('上传失败');
      return Upload.LIST_IGNORE;
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (docId) => {
    documentAPI.download(docId);
  };

  const handleDelete = async (docId) => {
    try {
      await documentAPI.delete(docId);
      message.success('删除成功');
      loadBatchData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 产品管理函数
  const handleAddProduct = () => {
    setEditingProduct(null);
    productForm.resetFields();
    setProductModalVisible(true);
  };

  const handleEditProduct = (record) => {
    setEditingProduct(record);
    // 如果有 product_id，直接使用；否则尝试从产品目录匹配
    const productId = record.product_id || (record.product_name && productCatalog.find(pc => pc.name === record.product_name && pc.model === record.model)?.id);

    productForm.setFieldsValue({
      product_id: productId || null,
      quantity: record.quantity,
      unit_price: record.unit_price
    });
    setProductModalVisible(true);
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await productAPI.delete(id, productId);
      message.success('删除成功');
      loadBatchData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleProductSubmit = async () => {
    try {
      const values = await productForm.validateFields();

      if (editingProduct) {
        // 编辑时只更新数量和单价
        await productAPI.update(id, editingProduct.id, {
          quantity: values.quantity,
          unit_price: values.unit_price
        });
        message.success('更新成功');
      } else {
        // 新增时需要 product_id
        await productAPI.create(id, {
          product_id: values.product_id,
          quantity: values.quantity,
          unit_price: values.unit_price
        });
        message.success('添加成功');
      }
      setProductModalVisible(false);
      loadBatchData();
    } catch (error) {
      message.error(error.message || '操作失败');
    }
  };

  const handleOpenImportOrderModal = async () => {
    try {
      setImportOrderModalVisible(true);
      const response = await orderAPI.getByCustomerId(batch.customer_id);
      setCustomerOrders(response.data || []);
      setSelectedOrderId(null);
    } catch (error) {
      message.error('加载订单列表失败');
    }
  };

  const handleImportFromOrder = async () => {
    if (!selectedOrderId) {
      message.error('请选择订单');
      return;
    }

    try {
      setImporting(true);
      const orderResponse = await orderAPI.getById(selectedOrderId);
      const order = orderResponse.data;

      if (!order.products || order.products.length === 0) {
        message.warning('该订单没有产品');
        return;
      }

      // 批量导入产品
      for (const product of order.products) {
        await productAPI.create(id, {
          product_id: product.product_id,
          quantity: product.quantity,
          unit_price: product.unit_price
        });
      }

      message.success(`成功导入 ${order.products.length} 个产品`);
      setImportOrderModalVisible(false);
      setSelectedOrderId(null);
      loadBatchData();
    } catch (error) {
      message.error(error.message || '导入失败');
    } finally {
      setImporting(false);
    }
  };

  const handleOpenUploadModal = (category) => {
    setUploadCategory(category);
    setSelectedDocType(null);
    setUploadModalVisible(true);
  };

  const handlePreview = async (record) => {
    const fileExt = record.file_name.split('.').pop().toLowerCase();
    const previewUrl = `/api/documents/${record.id}/preview`;
    const downloadUrl = `/api/documents/${record.id}`;

    // 图片：使用 Ant Design Image 组件
    if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExt)) {
      setPreviewFile({
        url: downloadUrl,
        name: record.file_name,
        type: 'image'
      });
      setPreviewModalVisible(true);
      return;
    }

    // PDF：使用 iframe 在 Modal 中显示
    if (fileExt === 'pdf') {
      setPreviewFile({
        url: previewUrl,
        name: record.file_name,
        type: 'pdf'
      });
      setPreviewModalVisible(true);
      return;
    }

    // Word (.docx)：使用 docx-preview 渲染
    if (['docx'].includes(fileExt)) {
      setPreviewLoading(true);
      setPreviewFile({
        name: record.file_name,
        type: 'word'
      });
      setPreviewModalVisible(true);

      try {
        const response = await fetch(previewUrl);
        const blob = await response.blob();
        await renderAsync(blob, wordContainerRef.current, {
          className: 'docx-preview',
          inWrapper: true
        });
      } catch (error) {
        message.error('预览 Word 文档失败');
      } finally {
        setPreviewLoading(false);
      }
      return;
    }

    // Excel (.xlsx, .xls)：使用 xlsx 库解析
    if (['xlsx', 'xls'].includes(fileExt)) {
      setPreviewLoading(true);
      setPreviewFile({
        name: record.file_name,
        type: 'excel'
      });
      setPreviewModalVisible(true);

      try {
        const response = await fetch(previewUrl);
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const html = XLSX.utils.sheet_to_html(worksheet);
        setExcelData(html);
      } catch (error) {
        message.error('预览 Excel 文件失败');
      } finally {
        setPreviewLoading(false);
      }
      return;
    }

    // 其他类型不支持预览
    message.info('该文件类型不支持在线预览，请下载查看');
  };

  const getCompletionColor = (rate) => {
    if (rate === 100) return '#52c41a';
    if (rate >= 60) return '#faad14';
    return '#f5222d';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const columns = [
    {
      title: '文件名',
      dataIndex: 'file_name',
      key: 'file_name',
      width: 250,
      render: (text, record) => (
        <a onClick={() => handlePreview(record)}>{text}</a>
      )
    },
    {
      title: '文件类型',
      dataIndex: 'document_type_name',
      key: 'document_type_name'
    },
    {
      title: '文件大小',
      dataIndex: 'file_size',
      key: 'file_size',
      render: (size) => formatFileSize(size)
    },
    {
      title: '上传时间',
      dataIndex: 'uploaded_at',
      key: 'uploaded_at',
      render: (text) => new Date(text).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handlePreview(record)}
          >
            预览
          </Button>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record.id)}
          >
            下载
          </Button>
          <Popconfirm
            title="确定要删除此文件吗?"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const productColumns = [
    {
      title: '产品名称',
      dataIndex: 'product_name',
      key: 'product_name'
    },
    {
      title: '型号',
      dataIndex: 'model',
      key: 'model'
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity'
    },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (price) => `USD ${Number(price).toFixed(2)}`
    },
    {
      title: '总价',
      dataIndex: 'total_price',
      key: 'total_price',
      render: (price) => `USD ${Number(price).toFixed(2)}`
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditProduct(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除此产品吗?"
            onConfirm={() => handleDeleteProduct(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  if (!batch && loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>加载中...</div>;
  }

  if (!batch && !loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <p style={{ color: '#999' }}>批次不存在或加载失败</p>
        <Button onClick={() => navigate('/batches')}>返回批次列表</Button>
      </div>
    );
  }

  const completionRate = batch.completionRate || 0;

  return (
    <div>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/batches')}
        style={{ marginBottom: 16 }}
      >
        返回批次列表
      </Button>

      <Card title="批次基本信息" style={{ marginBottom: 24 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="出口发票号">{batch.batch_number}</Descriptions.Item>
          <Descriptions.Item label="提单号">{batch.bill_of_lading || '-'}</Descriptions.Item>
          <Descriptions.Item label="客户名称">{batch.customer_name}</Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(batch.created_at).toLocaleString('zh-CN')}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {new Date(batch.updated_at).toLocaleString('zh-CN')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        title="产品清单"
        extra={
          <Space>
            <Button icon={<FileTextOutlined />} onClick={handleOpenImportOrderModal}>
              从订单导入
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddProduct}>
              添加产品
            </Button>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Table
          dataSource={batch.products || []}
          columns={productColumns}
          rowKey="id"
          pagination={false}
          size="middle"
        />
        <div style={{ textAlign: 'right', marginTop: 16, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
          <span style={{ fontSize: 14, color: '#666' }}>
            批次总金额：<span style={{ fontSize: 16, fontWeight: 'bold', color: '#1890ff' }}>
              USD {(batch.totalAmount || 0).toFixed(2)}
            </span>
          </span>
        </div>
      </Card>

      <Card title="文件完整度" style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 16, fontWeight: 500 }}>
              <FileTextOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              必需文件完整度
            </span>
            <span style={{ fontSize: 24, fontWeight: 'bold', color: getCompletionColor(completionRate) }}>
              {completionRate}%
            </span>
          </div>
          <Progress
            percent={completionRate}
            strokeColor={getCompletionColor(completionRate)}
            strokeWidth={12}
          />
          
          {batch.requiredDocTypes && batch.requiredDocTypes.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Alert
                message="必需文件清单"
                description={
                  <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
                    {batch.requiredDocTypes.map(docType => {
                      const isUploaded = documents.some(doc => doc.document_type_id === docType.id);
                      return (
                        <li key={docType.id} style={{ marginBottom: 4 }}>
                          <span style={{ color: isUploaded ? '#52c41a' : '#f5222d' }}>
                            {isUploaded ? '✓' : '✗'}
                          </span>
                          {' '}
                          {docType.name}
                        </li>
                      );
                    })}
                  </ul>
                }
                type={completionRate === 100 ? 'success' : 'warning'}
                showIcon
              />
            </div>
          )}
        </Space>
      </Card>

      <Card
        title="报关资料"
        extra={
          <Space>
            <Button icon={<DownloadOutlined />} onClick={() => documentAPI.batchDownloadByCategory(id, '报关资料')}>
              一键下载
            </Button>
            <Button type="primary" icon={<UploadOutlined />} onClick={() => handleOpenUploadModal('报关资料')}>
              上传文件
            </Button>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Table
          dataSource={documents.filter(doc => doc.category === '报关资料')}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`
          }}
        />
      </Card>

      <Card
        title="清关资料"
        extra={
          <Space>
            <Button icon={<DownloadOutlined />} onClick={() => documentAPI.batchDownloadByCategory(id, '清关资料')}>
              一键下载
            </Button>
            <Button type="primary" icon={<UploadOutlined />} onClick={() => handleOpenUploadModal('清关资料')}>
              上传文件
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={documents.filter(doc => doc.category === '清关资料')}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`
          }}
        />
      </Card>

      <Modal
        title={`上传文件 - ${uploadCategory}`}
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          setSelectedDocType(null);
          setUploadFileList([]);
          setUploadCategory('报关资料');
        }}
        footer={null}
      >
        <div style={{ marginBottom: 16 }}>
          <Select
            style={{ width: '100%' }}
            placeholder="请选择文件类型"
            value={selectedDocType}
            onChange={setSelectedDocType}
          >
            {customerDocTypes.filter(type => type.category === uploadCategory).map(type => (
              <Option key={type.id} value={type.id}>
                {type.name} {type.is_required && <Tag color="red">必需</Tag>}
              </Option>
            ))}
          </Select>
        </div>
        <Upload.Dragger
          customRequest={({ file }) => handleUpload(file)}
          fileList={uploadFileList}
          onChange={({ fileList }) => setUploadFileList(fileList)}
          multiple={false}
          disabled={!selectedDocType || uploading}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">
            支持单个文件上传,文件大小不超过10MB
          </p>
        </Upload.Dragger>
      </Modal>

      <Modal
        title={`文件预览 - ${previewFile?.name || ''}`}
        open={previewModalVisible}
        onCancel={() => {
          setPreviewModalVisible(false);
          setPreviewFile(null);
          setExcelData(null);
          if (wordContainerRef.current) {
            wordContainerRef.current.innerHTML = '';
          }
        }}
        footer={null}
        width="90vw"
        style={{ top: 20, height: 'calc(100vh - 100px)' }}
        styles={{ body: { height: 'calc(100vh - 160px)', overflow: 'auto', padding: 0 } }}
      >
        {previewLoading && (
          <div style={{ textAlign: 'center', padding: '50px' }}>加载中...</div>
        )}

        {previewFile && !previewLoading && (
          <>
            {previewFile.type === 'image' && (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Image
                  src={previewFile.url}
                  alt={previewFile.name}
                  style={{ maxWidth: '100%' }}
                />
              </div>
            )}

            {previewFile.type === 'pdf' && (
              <iframe
                src={previewFile.url}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
                title="PDF预览"
              />
            )}

            {previewFile.type === 'word' && (
              <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
                <div ref={wordContainerRef} className="docx-preview-container" />
              </div>
            )}

            {previewFile.type === 'excel' && excelData && (
              <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
                <div
                  dangerouslySetInnerHTML={{ __html: excelData }}
                  style={{ fontSize: 12 }}
                />
                <style>{`
                  table { border-collapse: collapse; width: 100%; }
                  td, th { border: 1px solid #ddd; padding: 8px; text-align: left; }
                  th { background-color: #f5f5f5; font-weight: bold; }
                  tr:nth-child(even) { background-color: #f9f9f9; }
                `}</style>
              </div>
            )}
          </>
        )}
      </Modal>

      <Modal
        title={editingProduct ? '编辑产品' : '添加产品'}
        open={productModalVisible}
        onOk={handleProductSubmit}
        onCancel={() => setProductModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={productForm} layout="vertical">
          <Form.Item
            label="产品"
            name="product_id"
            rules={[{ required: true, message: '请选择产品' }]}
          >
            <Select
              placeholder="请选择产品"
              showSearch
              optionFilterProp="children"
              disabled={!!editingProduct}
            >
              {productCatalog.map(pc => (
                <Option key={pc.id} value={pc.id}>
                  {pc.product_code} - {pc.name} - {pc.model}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="数量"
            name="quantity"
            rules={[{ required: true, message: '请输入数量' }]}
          >
            <InputNumber min={0} precision={0} style={{ width: '100%' }} placeholder="请输入数量" />
          </Form.Item>
          <Form.Item
            label="单价 (USD)"
            name="unit_price"
            rules={[{ required: true, message: '请输入单价' }]}
          >
            <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="请输入单价" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="从订单导入产品"
        open={importOrderModalVisible}
        onOk={handleImportFromOrder}
        onCancel={() => {
          setImportOrderModalVisible(false);
          setSelectedOrderId(null);
        }}
        okText="导入"
        cancelText="取消"
        confirmLoading={importing}
      >
        <div style={{ marginBottom: 16 }}>
          <Select
            style={{ width: '100%' }}
            placeholder="请选择订单"
            value={selectedOrderId}
            onChange={setSelectedOrderId}
            showSearch
            optionFilterProp="children"
          >
            {customerOrders.map(order => (
              <Option key={order.id} value={order.id}>
                {order.order_number} - 总金额: USD {(order.totalAmount || 0).toFixed(2)} - {order.products?.length || 0} 个产品
              </Option>
            ))}
          </Select>
        </div>
        {selectedOrderId && (
          <div>
            <p style={{ marginBottom: 8, fontWeight: 500 }}>将导入以下产品：</p>
            {customerOrders.find(o => o.id === selectedOrderId)?.products?.map((product, index) => (
              <div key={index} style={{ padding: '8px 12px', backgroundColor: index % 2 === 0 ? '#fafafa' : 'white', borderRadius: 4 }}>
                {product.product_name} - {product.model} - 数量: {product.quantity} - 单价: USD {product.unit_price}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default BatchDetail;
