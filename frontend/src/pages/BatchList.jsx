import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm, Card, Progress, Space, Badge, Pagination } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, FolderOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { batchAPI, customerAPI } from '../services/api';

const { Option } = Select;
const { Search } = Input;
function BatchList() {
  const [groupedBatches, setGroupedBatches] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerPage, setCustomerPage] = useState(1);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const CUSTOMER_PAGE_SIZE = 5;
  const BATCH_PAGE_SIZE = 10;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (search = '') => {
    try {
      setLoading(true);
      const [batchesRes, customersRes] = await Promise.all([
        batchAPI.getGroupedByCustomer(search),
        customerAPI.getAll()
      ]);
      setGroupedBatches(batchesRes.data || []);
      setCustomers(customersRes.data || []);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCustomerPage(1);
    loadData(value);
  };

  const handleAdd = () => {
    setEditingBatch(null);
    form.resetFields();
    form.setFieldsValue({ batch_number: generateBatchNumber() });
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
        await batchAPI.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData(searchTerm);
    } catch (error) {
      message.error(error.message || '操作失败');
    }
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
        <Search
          placeholder="搜索出口发票号或客户名称"
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
        <>
          {groupedBatches
            .slice((customerPage - 1) * CUSTOMER_PAGE_SIZE, customerPage * CUSTOMER_PAGE_SIZE)
            .map((group) => (
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
                  pagination={{ pageSize: BATCH_PAGE_SIZE, size: 'small', showSizeChanger: false }}
                  size="middle"
                />
              </Card>
            ))
          }
          {groupedBatches.length > CUSTOMER_PAGE_SIZE && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <Pagination
                current={customerPage}
                pageSize={CUSTOMER_PAGE_SIZE}
                total={groupedBatches.length}
                onChange={(page) => setCustomerPage(page)}
                showSizeChanger={false}
              />
            </div>
          )}
        </>
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
        </Form>
      </Modal>
    </div>
  );
}

export default BatchList;
