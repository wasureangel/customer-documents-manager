import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加token等认证信息
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
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
    return axios.post(`/api/batches/${batchId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // 下载文件
  download: (id) => {
    window.open(`/api/documents/${id}`, '_blank');
  },

  // 批量下载（按分类）
  batchDownloadByCategory: (batchId, category) => {
    window.open(`/api/batches/${batchId}/download/${encodeURIComponent(category)}`, '_blank');
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
