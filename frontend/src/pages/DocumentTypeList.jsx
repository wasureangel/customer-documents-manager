import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { documentTypeAPI } from '../services/api';

const { Option } = Select;

function DocumentTypeList() {
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadDocumentTypes();
  }, []);

  const loadDocumentTypes = async () => {
    try {
      setLoading(true);
      const response = await documentTypeAPI.getAll();
      setDocumentTypes(response.data || []);
    } catch (error) {
      message.error('加载文件类型列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingType(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingType(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      category: record.category || '报关资料',
      is_required: record.is_required
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await documentTypeAPI.delete(id);
      message.success('删除成功');
      loadDocumentTypes();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        name: values.name,
        description: values.description,
        category: values.category || '报关资料',
        is_required: values.is_required || false
      };

      if (editingType) {
        await documentTypeAPI.update(editingType.id, data);
        message.success('更新成功');
      } else {
        await documentTypeAPI.create(data);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadDocumentTypes();
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
      title: '类型名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category) => (
        <span style={{
          padding: '2px 8px',
          borderRadius: 4,
          backgroundColor: category === '清关资料' ? '#e6f7ff' : '#f6ffed',
          color: category === '清关资料' ? '#1890ff' : '#52c41a'
        }}>
          {category || '报关资料'}
        </span>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <span>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除此文件类型吗?"
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
        <h1>文件类型管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加文件类型
        </Button>
      </div>

      <Table
        dataSource={documentTypes}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`
        }}
      />

      <Modal
        title={editingType ? '编辑文件类型' : '添加文件类型'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="类型名称"
            name="name"
            rules={[{ required: true, message: '请输入类型名称' }]}
          >
            <Input placeholder="请输入类型名称" />
          </Form.Item>
          <Form.Item
            label="分类"
            name="category"
            initialValue="报关资料"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="请选择分类">
              <Option value="报关资料">报关资料</Option>
              <Option value="清关资料">清关资料</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="是否必需"
            name="is_required"
            valuePropName="checked"
            initialValue={false}
          >
            <Select placeholder="是否必需">
              <Option value={false}>否</Option>
              <Option value={true}>是</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="描述"
            name="description"
          >
            <Input.TextArea
              placeholder="请输入描述"
              rows={4}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default DocumentTypeList;
