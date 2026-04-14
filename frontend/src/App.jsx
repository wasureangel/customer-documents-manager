import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  CustomerServiceOutlined,
  FileTextOutlined,
  FolderOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import './index.css';

// 导入页面组件
import Dashboard from './pages/Dashboard';
import CustomerList from './pages/CustomerList';
import BatchList from './pages/BatchList';
import BatchDetail from './pages/BatchDetail';
import DocumentTypeList from './pages/DocumentTypeList';
import OrderList from './pages/OrderList';
import ProductList from './pages/ProductList';

const { Header, Content, Sider } = Layout;

// 侧边栏导航组件
function SideNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表板',
    },
    {
      key: '/customers',
      icon: <CustomerServiceOutlined />,
      label: '客户管理',
    },
    {
      key: '/products',
      icon: <AppstoreOutlined />,
      label: '产品管理',
    },
    {
      key: '/orders',
      icon: <ShoppingCartOutlined />,
      label: '订单管理',
    },
    {
      key: '/batches',
      icon: <FileTextOutlined />,
      label: '出口批次',
    },
    {
      key: '/document-types',
      icon: <FolderOutlined />,
      label: '文件类型',
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  return (
    <Sider width={200} style={{ background: '#001529' }}>
      <div style={{ 
        height: 64, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold'
      }}>
        出口文件管理
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
      />
    </Sider>
  );
}

function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <SideNav />
      
      <Layout>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)'
        }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>外贸出口文件管理系统</h2>
        </Header>
        
        <Content style={{ margin: '24px', minHeight: 280 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/orders" element={<OrderList />} />
            <Route path="/batches" element={<BatchList />} />
            <Route path="/batches/:id" element={<BatchDetail />} />
            <Route path="/document-types" element={<DocumentTypeList />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
