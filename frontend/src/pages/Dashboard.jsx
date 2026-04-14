import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Progress, Alert } from 'antd';
import { UserOutlined, FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { customerAPI, batchAPI } from '../services/api';

function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalBatches: 0,
    recentBatches: [],
    incompleteBatches: []
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [customersRes, batchesRes] = await Promise.all([
        customerAPI.getAll(),
        batchAPI.getAll()
      ]);

      const allBatches = batchesRes.data || [];
      
      // 筛选文件不完整的批次
      const incompleteBatches = allBatches.filter(batch => batch.completionRate < 100);
      
      setStats({
        totalCustomers: customersRes.data?.length || 0,
        totalBatches: allBatches.length,
        recentBatches: allBatches.slice(0, 5),
        incompleteBatches: incompleteBatches.slice(0, 10)
      });
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCompletionColor = (rate) => {
    if (rate === 100) return '#52c41a';
    if (rate >= 60) return '#faad14';
    return '#f5222d';
  };

  const recentColumns = [
    {
      title: '出口发票号',
      dataIndex: 'batch_number',
      key: 'batch_number',
      render: (text, record) => (
        <a onClick={() => navigate(`/batches/${record.id}`)}>{text}</a>
      )
    },
    {
      title: '客户名称',
      dataIndex: 'customer_name',
      key: 'customer_name'
    },
    {
      title: '文件完整度',
      dataIndex: 'completionRate',
      key: 'completionRate',
      render: (rate) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Progress 
            percent={rate} 
            size="small" 
            strokeColor={getCompletionColor(rate)}
            style={{ width: 80 }}
          />
          <span style={{ color: getCompletionColor(rate), fontWeight: 'bold' }}>
            {rate}%
          </span>
        </div>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => new Date(text).toLocaleString('zh-CN')
    }
  ];

  const incompleteColumns = [
    {
      title: '出口发票号',
      dataIndex: 'batch_number',
      key: 'batch_number',
      render: (text, record) => (
        <a onClick={() => navigate(`/batches/${record.id}`)}>{text}</a>
      )
    },
    {
      title: '客户名称',
      dataIndex: 'customer_name',
      key: 'customer_name'
    },
    {
      title: '文件完整度',
      dataIndex: 'completionRate',
      key: 'completionRate',
      render: (rate) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Progress 
            percent={rate} 
            size="small" 
            strokeColor={getCompletionColor(rate)}
            style={{ width: 80 }}
          />
          <span style={{ color: getCompletionColor(rate), fontWeight: 'bold' }}>
            {rate}%
          </span>
        </div>
      )
    },
    {
      title: '缺失文件',
      dataIndex: 'missingCount',
      key: 'missingCount',
      render: (missingCount, record) => (
        <Tag color="error">
          缺少 {missingCount} 份文件
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => new Date(text).toLocaleString('zh-CN')
    }
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>仪表板</h1>
      
      <Row gutter={16}>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="总客户数"
              value={stats.totalCustomers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="总批次数"
              value={stats.totalBatches}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="完整批次"
              value={stats.recentBatches.filter(b => b.completionRate === 100).length}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="待补全批次"
              value={stats.incompleteBatches.length}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {stats.incompleteBatches.length > 0 && (
        <Card
          title={
            <span style={{ color: '#f5222d' }}>
              <ExclamationCircleOutlined style={{ marginRight: 8 }} />
              需要补全文件的批次
            </span>
          }
          style={{ marginTop: 24 }}
          loading={loading}
        >
          <Alert
            message="以下批次缺少必需的文件,请及时补全"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Table
            dataSource={stats.incompleteBatches}
            columns={incompleteColumns}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>
      )}

      <Card
        title="最近批次"
        style={{ marginTop: 24 }}
        loading={loading}
      >
        <Table
          dataSource={stats.recentBatches}
          columns={recentColumns}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );
}

export default Dashboard;
