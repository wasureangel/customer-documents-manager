import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm, InputNumber, Space } from 'antd';
import { PlusOutlined, DeleteOutlined, SearchOutlined, MinusCircleOutlined, EditOutlined } from '@ant-design/icons';
import { orderAPI, customerAPI, productCatalogAPI } from '../services/api';

const { Option } = Select;

function OrderList() {
  const [groupedOrders, setGroupedOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [productCatalog, setProductCatalog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (search = '') => {
    try {
      setLoading(true);
      const [ordersRes, customersRes, productsRes] = await Promise.all([
        orderAPI.getAll({ search }),
        customerAPI.getAll(),
        productCatalogAPI.getAll()
      ]);
      setGroupedOrders(ordersRes.data || []);
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
    setEditingOrder(null);
    form.resetFields();
    form.setFieldsValue({ order_number: generateOrderNumber() });
    setProducts([]);
    setModalVisible(true);
  };

  const generateOrderNumber = () => {
    const today = new Date();
    const yy = String(today.getFullYear()).slice(-2);
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `ORD-${yy}${mm}${dd}A`;
  };

  const handleEdit = async (record) => {
    setEditingOrder(record);
    form.setFieldsValue({
      customer_id: record.customer_id,
      order_number: record.order_number
    });

    // 加载订单产品
    try {
      const productsRes = await orderAPI.getProducts(record.id);
      const productList = (productsRes.data?.products || productsRes.data || []).map(p => {
        // 如果有 product_id，直接使用
        // 如果没有，尝试从产品目录中匹配
        let matchedProductId = p.product_id;
        if (!matchedProductId && p.product_name) {
          const matched = productCatalog.find(pc =>
            pc.name === p.product_name && pc.model === p.model
          );
          if (matched) {
            matchedProductId = matched.id;
          }
        }

        return {
          key: p.id,
          product_id: matchedProductId,
          product_name: p.product_name,
          model: p.model,
          quantity: p.quantity,
          unit_price: p.unit_price,
          total_price: p.total_price
        };
      });
      setProducts(productList);
    } catch (error) {
      console.error('加载产品失败:', error);
      setProducts([]);
    }

    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await orderAPI.delete(id);
      message.success('删除成功');
      loadData(searchTerm);
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingOrder) {
        await orderAPI.update(editingOrder.id, values);
        message.success('更新成功');
      } else {
        const orderRes = await orderAPI.create(values);
        const orderId = orderRes.data?.id || orderRes.id;

        if (products.length > 0 && orderId) {
          const validProducts = products.filter(p => p.product_id);
          for (const product of validProducts) {
            await orderAPI.addProduct(orderId, {
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

  const orderColumns = [
    {
      title: '订单号',
      dataIndex: 'order_number',
      key: 'order_number',
      width: 150
    },
    {
      title: '客户名称',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 150
    },
    {
      title: '订单总金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 150,
      render: (amount) => `USD ${(amount || 0).toFixed(2)}`
    },
    {
      title: '产品数量',
      dataIndex: 'products',
      key: 'productCount',
      width: 100,
      render: (products) => products?.length || 0
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
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除此订单吗?"
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
        <h1 style={{ margin: 0 }}>订单管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          创建订单
        </Button>
      </div>

      <div style={{ marginBottom: 24 }}>
        <Input
          placeholder="搜索订单号或客户名称"
          prefix={<SearchOutlined />}
          allowClear
          size="large"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onPressEnter={(e) => handleSearch(e.target.value)}
          style={{ width: '100%', maxWidth: 400 }}
        />
      </div>

      <Table
        dataSource={groupedOrders}
        columns={orderColumns}
        rowKey="id"
        loading={loading}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`
        }}
      />

      <Modal
        title={editingOrder ? '编辑订单' : '创建订单'}
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
            label="订单号"
            name="order_number"
            rules={[{ required: true, message: '请输入订单号' }]}
            extra="留空则自动生成"
          >
            <Input placeholder="留空则自动生成" />
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
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0', textAlign: 'right' }}>
                  <span style={{ fontSize: 14, color: '#666' }}>订单总金额：</span>
                  <span style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff', marginLeft: 8 }}>
                    USD {products.reduce((sum, p) => sum + (p.total_price || 0), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default OrderList;
