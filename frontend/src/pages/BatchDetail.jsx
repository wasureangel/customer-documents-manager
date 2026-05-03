import { useEffect, useLayoutEffect, useState, useRef } from 'react';
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
  Tag
} from 'antd';
import {
  ArrowLeftOutlined,
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  FileTextOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { batchAPI, documentAPI, documentTypeAPI, customerDocTypeAPI } from '../services/api';
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
  const wordBlobRef = useRef(null);

  // Word 文档渲染：当 blob 和容器都就绪时调用 renderAsync
  useLayoutEffect(() => {
    if (previewFile?.type === 'word' && wordBlobRef.current && wordContainerRef.current) {
      renderAsync(wordBlobRef.current, wordContainerRef.current, null, {
        className: 'docx-preview',
        inWrapper: true
      }).catch(() => {
        message.error('预览 Word 文档失败');
      });
    }
  }, [previewFile?.type]);

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

  const handleOpenUploadModal = (category) => {
    setUploadCategory(category);
    setSelectedDocType(null);
    setUploadModalVisible(true);
  };

  const handlePreview = async (record) => {
    const fileExt = record.file_name.split('.').pop().toLowerCase();
    const previewUrl = `/api/documents/${record.id}/preview`;
    const token = sessionStorage.getItem('auth_token');

    // 图片：fetch 带 token，转 blob URL 显示
    if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExt)) {
      setPreviewLoading(true);
      setPreviewFile({
        name: record.file_name,
        type: 'image'
      });
      setPreviewModalVisible(true);

      try {
        const response = await fetch(`/api/documents/${record.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('预览图片失败');
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setPreviewFile(prev => ({ ...prev, url: blobUrl }));
      } catch (error) {
        message.error('预览图片失败');
        setPreviewModalVisible(false);
      } finally {
        setPreviewLoading(false);
      }
      return;
    }

    // PDF：fetch 带 token，转 blob URL 用 iframe 显示
    if (fileExt === 'pdf') {
      setPreviewLoading(true);
      setPreviewFile({
        name: record.file_name,
        type: 'pdf'
      });
      setPreviewModalVisible(true);

      try {
        const response = await fetch(previewUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('预览 PDF 失败');
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setPreviewFile(prev => ({ ...prev, url: blobUrl }));
      } catch (error) {
        message.error('预览 PDF 失败');
        setPreviewModalVisible(false);
      } finally {
        setPreviewLoading(false);
      }
      return;
    }

    // Word (.docx)：使用 docx-preview 渲染
    if (['docx'].includes(fileExt)) {
      setPreviewLoading(true);

      try {
        const response = await fetch(previewUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('预览 Word 文档失败');
        const blob = await response.blob();

        // 存储 blob 并显示容器，useLayoutEffect 会处理渲染
        wordBlobRef.current = blob;
        setPreviewFile({
          name: record.file_name,
          type: 'word'
        });
        setPreviewLoading(false);
        setPreviewModalVisible(true);
      } catch (error) {
        message.error('预览 Word 文档失败');
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
        const response = await fetch(previewUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('预览 Excel 文档失败');
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const html = XLSX.utils.sheet_to_html(worksheet);
        setExcelData(html);
      } catch (error) {
        message.error('预览 Excel 文档失败');
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
          if (previewFile?.url && previewFile.url.startsWith('blob:')) {
            URL.revokeObjectURL(previewFile.url);
          }
          wordBlobRef.current = null;
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
    </div>
  );
}

export default BatchDetail;
