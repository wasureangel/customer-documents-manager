import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器 - 添加认证 token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一错误处理
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // 处理 401 未授权错误
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('auth_token');
      // 只在非登录页面时跳转
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // 统一错误处理
    if (error.response) {
      console.error('API错误:', error.response.data);
      return Promise.reject(error.response.data);
    } else if (error.request) {
      console.error('网络错误:', error.request);
      return Promise.reject({ message: '网络连接失败' });
    } else {
      console.error('请求错误:', error.message);
      return Promise.reject({ message: error.message });
    }
  }
);

/**
 * 带认证的文件下载辅助函数
 * @param {string} url - 下载 URL
 * @param {string} filename - 下载的文件名（可选）
 */
async function downloadFile(url, filename) {
  const token = localStorage.getItem('auth_token');
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('下载失败');
    }

    // 获取文件名（从响应头或使用默认值）
    let downloadFilename = filename;
    const contentDisposition = response.headers.get('Content-Disposition');
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        downloadFilename = filenameMatch[1].replace(/['"]/g, '');
      }
    }

    // 创建 blob 并触发下载
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = downloadFilename || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('下载错误:', error);
    throw error;
  }
}

/**
 * 带认证的文件预览辅助函数
 * @param {string} url - 预览 URL
 * @returns {string} - Blob URL
 */
async function previewFile(url) {
  const token = localStorage.getItem('auth_token');
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('预览失败');
    }

    const blob = await response.blob();
    return window.URL.createObjectURL(blob);
  } catch (error) {
    console.error('预览错误:', error);
    throw error;
  }
}

// 客户管理API
export const customerAPI = {
  // 获取所有客户
  getAll: (params = {}) => api.get('/customers', { params }),

  // 根据ID获取客户
  getById: (id) => api.get(`/customers/${id}`),

  // 创建客户
  create: (data) => api.post('/customers', data),

  // 更新客户
  update: (id, data) => api.put(`/customers/${id}`, data),

  // 删除客户
  delete: (id) => api.delete(`/customers/${id}`)
};

// 出口批次API
export const batchAPI = {
  // 获取所有批次
  getAll: (searchTerm) => api.get('/batches', { params: { search: searchTerm } }),

  // 按客户分组获取批次
  getGroupedByCustomer: (searchTerm) => api.get('/batches/grouped', { params: { search: searchTerm } }),

  // 根据客户ID获取批次
  getByCustomerId: (customerId) => api.get(`/batches?customer_id=${customerId}`),

  // 根据ID获取批次
  getById: (id) => api.get(`/batches/${id}`),

  // 创建批次
  create: (data) => api.post('/batches', data),

  // 更新批次
  update: (id, data) => api.put(`/batches/${id}`, data),

  // 删除批次
  delete: (id) => api.delete(`/batches/${id}`)
};

// 客户文件类型配置API
export const customerDocTypeAPI = {
  // 获取客户的文件类型配置
  getByCustomerId: (customerId) => api.get(`/customers/${customerId}/document-types`),

  // 批量更新客户的文件类型配置
  updateByCustomerId: (customerId, configs) => api.put(`/customers/${customerId}/document-types`, { configs })
};

// 文件类型API
export const documentTypeAPI = {
  // 获取所有文件类型
  getAll: () => api.get('/document-types'),

  // 获取必需文件类型
  getRequired: () => api.get('/document-types/required'),

  // 根据ID获取文件类型
  getById: (id) => api.get(`/document-types/${id}`),

  // 创建文件类型
  create: (data) => api.post('/document-types', data),

  // 更新文件类型
  update: (id, data) => api.put(`/document-types/${id}`, data),

  // 删除文件类型
  delete: (id) => api.delete(`/document-types/${id}`)
};

// 文件API
export const documentAPI = {
  // 获取批次的文件列表
  getByBatchId: (batchId) => api.get(`/batches/${batchId}/documents`),

  // 上传文件
  upload: (batchId, formData) => {
    const token = localStorage.getItem('auth_token');
    return axios.post(`/api/batches/${batchId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // 下载文件（使用 fetch 支持 token）
  download: (id) => {
    return downloadFile(`/api/documents/${id}`);
  },

  // 预览文件（使用 fetch 支持 token）
  preview: async (id) => {
    return previewFile(`/api/documents/${id}/preview`);
  },

  // 批量下载（按分类）
  batchDownloadByCategory: (batchId, category) => {
    return downloadFile(`/api/batches/${batchId}/download/${encodeURIComponent(category)}`);
  },

  // 更新文件状态
  updateStatus: (id, status) => api.put(`/documents/${id}/status`, { status }),

  // 删除文件
  delete: (id) => api.delete(`/documents/${id}`)
};

// 产品API
export const productAPI = {
  // 获取批次的产品列表
  getByBatchId: (batchId) => api.get(`/batches/${batchId}/products`),

  // 添加产品
  create: (batchId, data) => api.post(`/batches/${batchId}/products`, data),

  // 更新产品
  update: (batchId, productId, data) => api.put(`/batches/${batchId}/products/${productId}`, data),

  // 删除产品
  delete: (batchId, productId) => api.delete(`/batches/${batchId}/products/${productId}`)
};

// 订单API
export const orderAPI = {
  // 获取所有订单
  getAll: (params = {}) => api.get('/orders', { params }),

  // 根据客户ID获取订单
  getByCustomerId: (customerId) => api.get(`/orders/customer/${customerId}`),

  // 根据ID获取订单
  getById: (id) => api.get(`/orders/${id}`),

  // 创建订单
  create: (data) => api.post('/orders', data),

  // 更新订单
  update: (id, data) => api.put(`/orders/${id}`, data),

  // 删除订单
  delete: (id) => api.delete(`/orders/${id}`),

  // 获取订单的产品列表
  getProducts: (orderId) => api.get(`/orders/${orderId}/products`),

  // 添加产品
  addProduct: (orderId, data) => api.post(`/orders/${orderId}/products`, data),

  // 更新产品
  updateProduct: (orderId, productId, data) => api.put(`/orders/${orderId}/products/${productId}`, data),

  // 删除产品
  deleteProduct: (orderId, productId) => api.delete(`/orders/${orderId}/products/${productId}`)
};

// 产品目录API
export const productCatalogAPI = {
  // 获取所有产品
  getAll: () => api.get('/products'),

  // 根据ID获取产品
  getById: (id) => api.get(`/products/${id}`),

  // 创建产品
  create: (data) => api.post('/products', data),

  // 更新产品
  update: (id, data) => api.put(`/products/${id}`, data),

  // 删除产品
  delete: (id) => api.delete(`/products/${id}`)
};

export default api;
