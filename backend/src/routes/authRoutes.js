const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { authMiddleware, verifyPassword, generateToken, hashPassword } = require('../middleware/auth');

const router = express.Router();

/**
 * 登录接口限流
 * 15分钟内最多10次尝试
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 10,
  message: {
    success: false,
    message: '登录尝试次数过多，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login',
  loginLimiter,
  [
    body('password')
      .notEmpty()
      .withMessage('请输入密码')
  ],
  async (req, res) => {
    // 验证请求体
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { password } = req.body;

    // 从环境变量获取密码（如果还没有哈希，则直接比较明文）
    const storedPassword = process.env.AUTH_PASSWORD || 'admin123';

    try {
      let isValid = false;

      // 检查存储的密码是否已经是哈希值
      if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$')) {
        // 已经是哈希值，使用 bcrypt 比较
        isValid = await verifyPassword(password, storedPassword);
      } else {
        // 还是明文密码，直接比较
        isValid = password === storedPassword;
      }

      if (isValid) {
        // 生成 token
        const token = generateToken({ role: 'user' });

        res.json({
          success: true,
          message: '登录成功',
          token
        });
      } else {
        res.status(401).json({
          success: false,
          message: '密码错误'
        });
      }
    } catch (error) {
      console.error('登录错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器错误'
      });
    }
  }
);

/**
 * POST /api/auth/verify
 * 验证 token 是否有效
 */
router.post('/verify', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Token 有效'
  });
});

/**
 * POST /api/auth/change-password
 * 修改密码（需要认证）
 */
router.post('/change-password',
  authMiddleware,
  [
    body('oldPassword').notEmpty().withMessage('请输入原密码'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('新密码至少6位')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { oldPassword, newPassword } = req.body;
    const storedPassword = process.env.AUTH_PASSWORD || 'admin123';

    try {
      let isValid = false;

      if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$')) {
        isValid = await verifyPassword(oldPassword, storedPassword);
      } else {
        isValid = oldPassword === storedPassword;
      }

      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: '原密码错误'
        });
      }

      // 哈希新密码
      const hashedPassword = await hashPassword(newPassword);

      // 返回哈希后的密码，用户需要手动更新 .env 文件
      res.json({
        success: true,
        message: '密码已更新',
        hashedPassword,
        note: '请将新的哈希值复制到 .env 文件的 AUTH_PASSWORD 中'
      });
    } catch (error) {
      console.error('修改密码错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器错误'
      });
    }
  }
);

module.exports = router;
