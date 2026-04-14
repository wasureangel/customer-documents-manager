import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm, Card, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, FileTextOutlined } from '@ant-design/icons';
import { customerAPI, customerDocTypeAPI, documentTypeAPI } from '../services/api';

function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  const [docConfigModalVisible, setDocConfigModalVisible] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [docConfigs, setDocConfigs] = useState([]);
  const [docConfigLoading, setDocConfigLoading] = useState(false);
  const [allDocumentTypes, setAllDocumentTypes] = useState([]);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadCustomers();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchText]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const params = searchText ? { search: searchText } : {};
      const response = await customerAPI.getAll(params);
      setCustomers(response.data || []);
    } catch (error) {
      message.error('加载客户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingCustomer(record);
    form.setFieldsValue({ name: record.name });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await customerAPI.delete(id);
      message.success('删除成功');
      loadCustomers();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleOpenDocConfig = async (customer) => {
    setCurrentCustomer(customer);
    setDocConfigModalVisible(true);
    setDocConfigLoading(true);

    try {
      const [docTypesRes, configsRes] = await Promise.all([
        documentTypeAPI.getAll(),
        customerDocTypeAPI.getByCustomerId(customer.id)
      ]);
      setAllDocumentTypes(docTypesRes.data || []);

      // 将配置转换为 Map 以便快速查找
      const configMap = new Map(
        (configsRes.data || []).map(c => [c.document_type_id, c.is_required === 1])
      );

      // 为所有文件类型生成配置项
      const configs = (docTypesRes.data || []).map(dt => ({
        document_type_id: dt.id,
        document_type_name: dt.name,
        is_required: configMap.get(dt.id) || false
      }));

      setDocConfigs(configs);
    } catch (error) {
      message.error('加载文件配置失败');
    } finally {
      setDocConfigLoading(false);
    }
  };

  const handleSaveDocConfig = async () => {
    try {
      const configs = docConfigs.map(c => ({
        document_type_id: c.document_type_id,
        is_required: c.is_required
      }));

      await customerDocTypeAPI.updateByCustomerId(currentCustomer.id, configs);
      message.success('保存成功');
      setDocConfigModalVisible(false);
      setCurrentCustomer(null);
      setDocConfigs([]);
    } catch (error) {
      message.error('保存失败');
    }
  };

  const handleDocConfigToggle = (documentTypeId) => {
    setDocConfigs(prev =>
      prev.map(c =>
        c.document_type_id === documentTypeId
          ? { ...c, is_required: !c.is_required }
          : c
      )
    );
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingCustomer) {
        await customerAPI.update(editingCustomer.id, values);
        message.success('更新成功');
      } else {
        await customerAPI.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadCustomers();
    } catch (error) {
      message.error(error.message || '操作失败');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '客户名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '出口批次数量',
      dataIndex: 'batch_count',
      key: 'batch_count',
      width: 120,
      render: (count) => (
        <span style={{ color: count > 0 ? '#1890ff' : '#999' }}>
          {count || 0}
        </span>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => new Date(text).toLocaleString('zh-CN')
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (text) => new Date(text).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      width: 230,
      render: (_, record) => (
        <span>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            icon={<FileTextOutlined />}
            onClick={() => handleOpenDocConfig(record)}
          >
            文件要求
          </Button>
          <Popconfirm
            title="确定要删除此客户吗?"
            description="删除客户后，相关的出口批次也会被删除"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </span>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>客户管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加客户
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Input
          placeholder="搜索客户名称"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{ maxWidth: 300 }}
        />
      </Card>

      <Table
        dataSource={customers}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`
        }}
      />

      <Modal
        title={editingCustomer ? '编辑客户' : '添加客户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="客户名称"
            name="name"
            rules={[
              { required: true, message: '请输入客户名称' },
              { min: 2, message: '客户名称至少2个字符' },
              { max: 100, message: '客户名称不能超过100个字符' }
            ]}
          >
            <Input placeholder="请输入客户名称" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`${currentCustomer?.name || ''} - 文件要求配置`}
        open={docConfigModalVisible}
        onOk={handleSaveDocConfig}
        onCancel={() => {
          setDocConfigModalVisible(false);
          setCurrentCustomer(null);
          setDocConfigs([]);
        }}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        {docConfigLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>加载中...</div>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {docConfigs.map(config => (
              <div
                key={config.document_type_id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                <span>{config.document_type_name}</span>
                <Switch
                  checked={config.is_required}
                  onChange={() => handleDocConfigToggle(config.document_type_id)}
                  checkedChildren="必需"
                  unCheckedChildren="可选"
                />
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default CustomerList;
