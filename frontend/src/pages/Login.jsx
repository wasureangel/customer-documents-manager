import { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';

/**
 * 登录页面
 * 单密码认证系统
 */
function Login({ onLogin }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: values.password })
      });

      const data = await response.json();

      if (data.success) {
        message.success('登录成功');
        // 存储 token
        sessionStorage.setItem('auth_token', data.token);
        // 调用父组件的登录回调
        if (onLogin) {
          onLogin(data.token);
        } else {
          // 如果没有回调，直接跳转到 dashboard
          window.location.href = '/dashboard';
        }
      } else {
        message.error(data.message || '登录失败');
      }
    } catch (error) {
      console.error('登录错误:', error);
      message.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card
        title="外贸出口文件管理系统"
        style={{
          width: 400,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
        headStyle={{
          textAlign: 'center',
          fontSize: 20,
          fontWeight: 'bold',
          color: '#001529'
        }}
      >
        <Form
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入系统密码"
              size="large"
              onPressEnter={() => {
                // 按 Enter 键自动提交
              }}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              登录
            </Button>
          </Form.Item>

          <div style={{
            textAlign: 'center',
            color: '#999',
            fontSize: 12,
            marginTop: 16
          }}>
            请输入管理员密码访问系统
          </div>
        </Form>
      </Card>
    </div>
  );
}

export default Login;
