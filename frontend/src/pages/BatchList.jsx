import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm, Card, Progress, Input as SearchInput, Space, Collapse, Badge, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, FolderOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { batchAPI, customerAPI, productAPI, productCatalogAPI } from '../services/api';

const { Option } = Select;
const { Panel } = Collapse;

function BatchList() {
  const [groupedBatches, setGroupedBatches] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [productCatalog, setProductCatalog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);  // 产品列表
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (search = '') => {
    try {
      setLoading(true);
      const [batchesRes, customersRes, productsRes] = await Promise.all([
        batchAPI.getGroupedByCustomer(search),
        customerAPI.getAll(),
        productCatalogAPI.getAll()
      ]);
      setGroupedBatches(batchesRes.data || []);
      setCustomers(customersRes.data || []);
      setProductCatalog(productsRes.data || []);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    loadData(value);
  };

  const handleAdd = () => {
    setEditingBatch(null);
    form.resetFields();
    form.setFieldsValue({ batch_number: generateBatchNumber() });
    setProducts([]);  // 重置产品列表
    setModalVisible(true);
  };

  const generateBatchNumber = () => {
    const today = new Date();
    const yy = String(today.getFullYear()).slice(-2);
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yy}${mm}${dd}A`;
  };

  const handleEdit = (record) => {
    setEditingBatch(record);
    form.setFieldsValue({
      customer_id: record.customer_id,
      batch_number: record.batch_number,
      bill_of_lading: record.bill_of_lading
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await batchAPI.delete(id);
      message.success('删除成功');
      loadData(searchTerm);
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingBatch) {
        await batchAPI.update(editingBatch.id, values);
        message.success('更新成功');
      } else {
        // 创建批次
        const batchRes = await batchAPI.create(values);
        const batchId = batchRes.data?.id || batchRes.id;

        // 添加产品
        if (products.length > 0 && batchId) {
          const validProducts = products.filter(p => p.product_id);
          for (const product of validProducts) {
            await productAPI.create(batchId, {
              product_id: product.product_id,
              quantity: product.quantity || 0,
              unit_price: product.unit_price || 0
            });
          }
        }
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData(searchTerm);
    } catch (error) {
      message.error(error.message || '操作失败');
    }
  };

  // 产品管理函数
  const handleAddProduct = () => {
    const newProduct = {
      key: Date.now(),
      product_id: null,
      product_name: '',
      model: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0
    };
    setProducts([...products, newProduct]);
  };

  const handleRemoveProduct = (key) => {
    setProducts(products.filter(p => p.key !== key));
  };

  const handleProductChange = (key, field, value) => {
    const updatedProducts = products.map(p => {
      if (p.key === key) {
        const updated = { ...p, [field]: value };

        // 当选择产品时，自动填充产品名和型号
        if (field === 'product_id' && value) {
          const selectedProduct = productCatalog.find(pc => pc.id === value);
          if (selectedProduct) {
            updated.product_name = selectedProduct.name;
            updated.model = selectedProduct.model;
          }
        }

        // 计算总价
        if (field === 'quantity' || field === 'unit_price') {
          updated.total_price = (updated.quantity || 0) * (updated.unit_price || 0);
          updated.total_price = Number(updated.total_price.toFixed(2));
        }
        return updated;
      }
      return p;
    });
    setProducts(updatedProducts);
  };

  const getCompletionColor = (rate) => {
    if (rate === 100) return '#52c41a';
    if (rate >= 60) return '#faad14';
    return '#f5222d';
  };

  const batchColumns = [
    {
      title: '出口发票号',
      dataIndex: 'batch_number',
      key: 'batch_number',
      width: 150
    },
    {
      title: '提单号',
      dataIndex: 'bill_of_lading',
      key: 'bill_of_lading',
      width: 150,
      render: (text) => text || '-'
    },
    {
      title: '文件完整度',
      key: 'completion',
      width: 200,
      render: (_, record) => (
        <Progress
          percent={record.completionRate || 0}
          strokeColor={getCompletionColor(record.completionRate || 0)}
          size="small"
        />
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (text) => new Date(text).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/batches/${record.id}`)}
          >
            详情
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除此批次吗?"
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

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>出口批次管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          创建批次
        </Button>
      </div>

      <div style={{ marginBottom: 24 }}>
        <SearchInput
          placeholder="搜索出口发票号或客户名称"
          prefix={<SearchOutlined />}
          allowClear
          size="large"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onSearch={handleSearch}
          style={{ width: '100%', maxWidth: 400 }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>加载中...</div>
      ) : groupedBatches.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: '#999' }}>
          暂无批次数据
        </div>
      ) : (
        groupedBatches.map((group) => (
          <Card
            key={group.customer_id}
            style={{ marginBottom: 16 }}
            title={
              <Space>
                <FolderOutlined style={{ color: '#1890ff' }} />
                <span>{group.customer_name}</span>
                <Badge count={group.batches.length} style={{ backgroundColor: '#52c41a' }} />
              </Space>
            }
          >
            <Table
              dataSource={group.batches}
              columns={batchColumns}
              rowKey="id"
              pagination={false}
              size="middle"
            />
          </Card>
        ))
      )}

      <Modal
        title={editingBatch ? '编辑批次' : '创建批次'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="客户"
            name="customer_id"
            rules={[{ required: true, message: '请选择客户' }]}
          >
            <Select placeholder="请选择客户" showSearch optionFilterProp="children">
              {customers.map(customer => (
                <Option key={customer.id} value={customer.id}>
                  {customer.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="出口发票号"
            name="batch_number"
            rules={[{ required: true, message: '请输入出口发票号' }]}
            extra="留空则自动生成"
          >
            <Input placeholder="留空则自动生成" />
          </Form.Item>

          <Form.Item
            label="提单号"
            name="bill_of_lading"
          >
            <Input placeholder="请输入提单号" />
          </Form.Item>

          <Form.Item label="产品清单">
            <div style={{ marginBottom: 8 }}>
              <Button type="dashed" onClick={handleAddProduct} icon={<PlusOutlined />} size="small">
                添加产品
              </Button>
            </div>
            {products.length === 0 ? (
              <div style={{ color: '#999', textAlign: 'center', padding: '20px 0' }}>
                暂无产品
              </div>
            ) : (
              <div style={{ border: '1px solid #d9d9d9', borderRadius: 4, padding: '8px' }}>
                {products.length > 0 && (
                  <div style={{ display: 'flex', marginBottom: 8, fontSize: 12, color: '#666', paddingLeft: 11 }}>
                    <span style={{ width: '42%', paddingRight: 4 }}>产品</span>
                    <span style={{ width: '15%', paddingRight: 4 }}>数量</span>
                    <span style={{ width: '15%', paddingRight: 4 }}>单价(USD)</span>
                    <span style={{ width: '15%', paddingRight: 4 }}>总价(USD)</span>
                    <span style={{ width: '13%', paddingRight: 4 }}></span>
                  </div>
                )}
                {products.map((product, index) => (
                  <div key={product.key} style={{ display: 'flex', marginBottom: index < products.length - 1 ? 8 : 0 }}>
                    <div style={{ width: '42%', paddingRight: 4 }}>
                      <Select
                        placeholder="选择产品"
                        value={product.product_id}
                        onChange={(value) => handleProductChange(product.key, 'product_id', value)}
                        showSearch
                        optionFilterProp="children"
                        style={{ width: '100%' }}
                      >
                        {productCatalog.map(pc => (
                          <Option key={pc.id} value={pc.id}>
                            {pc.product_code} - {pc.name} - {pc.model}
                          </Option>
                        ))}
                      </Select>
                    </div>
                    <div style={{ width: '15%', paddingRight: 4 }}>
                      <InputNumber
                        placeholder="数量"
                        value={product.quantity}
                        onChange={(value) => handleProductChange(product.key, 'quantity', value)}
                        min={0}
                        precision={0}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div style={{ width: '15%', paddingRight: 4 }}>
                      <InputNumber
                        placeholder="单价"
                        value={product.unit_price}
                        onChange={(value) => handleProductChange(product.key, 'unit_price', value)}
                        min={0}
                        precision={2}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div style={{ width: '15%', paddingRight: 4, display: 'flex', alignItems: 'center', color: '#666' }}>
                      USD {product.total_price.toFixed(2)}
                    </div>
                    <div style={{ width: '13%', paddingRight: 4 }}>
                      <Button
                        type="text"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => handleRemoveProduct(product.key)}
                        size="small"
                        style={{ width: '100%' }}
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                ))}
                {products.length > 0 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0', textAlign: 'right' }}>
                  <span style={{ fontSize: 14, color: '#666' }}>批次总金额：</span>
                  <span style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff', marginLeft: 8 }}>
                    USD {products.reduce((sum, p) => sum + (p.total_price || 0), 0).toFixed(2)}
                  </span>
                </div>
                )}
              </div>
            )}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default BatchList;
