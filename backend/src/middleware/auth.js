const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// JWT 密钥（使用环境变量或默认值）
const JWT_SECRET = process.env.JWT_SECRET || 'crm-secret-key-change-in-production';

/**
 * 认证中间件
 * 验证请求中的 Bearer token
 */
function authMiddleware(req, res, next) {
  // 白名单：登录接口和健康检查接口不需要认证
  const whiteList = [
    '/api/auth/login',
    '/api/auth/verify',
    '/health'
  ];

  // 检查是否在白名单中
  const isWhiteListed = whiteList.some(path => req.path === path && req.method !== 'OPTIONS');

  // 静态资源不需要认证（assets, vite.svg 等）
  const isStaticAsset = req.path.startsWith('/assets/') ||
    req.path.startsWith('/vite.svg') ||
    req.path === '/favicon.ico' ||
    req.path === '/' ||
    req.path.startsWith('/?');

  if (isWhiteListed || isStaticAsset) {
    return next();
  }

  // 获取 token
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未授权访问，请先登录'
    });
  }

  // 验证 token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token 无效或已过期'
    });
  }
}

/**
 * 生成 JWT token
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

/**
 * 验证密码
 */
async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * 哈希密码
 */
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

module.exports = {
  authMiddleware,
  generateToken,
  verifyPassword,
  hashPassword
};
