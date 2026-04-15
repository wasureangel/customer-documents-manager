import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TOKEN_KEY = 'auth_token';

/**
 * 认证 Hook
 * 管理用户登录状态和 token
 */
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // 初始化时检查 localStorage 中的 token
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    setIsAuthenticated(!!token);
    setIsLoading(false);
  }, []);

  /**
   * 登录
   * @param {string} password - 密码
   * @returns {Promise<boolean>} - 是否登录成功
   */
  const login = async (password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem(TOKEN_KEY, data.token);
        setIsAuthenticated(true);
        return true;
      }

      return false;
    } catch (error) {
      console.error('登录错误:', error);
      return false;
    }
  };

  /**
   * 退出登录
   */
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setIsAuthenticated(false);
    navigate('/login');
  };

  /**
   * 获取 token
   */
  const getToken = () => {
    return localStorage.getItem(TOKEN_KEY);
  };

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
    getToken
  };
}
