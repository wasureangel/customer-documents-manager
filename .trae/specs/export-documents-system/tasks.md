# Tasks

- [x] Task 1: 创建项目基础架构和数据库设计
  - [x] SubTask 1.1: 初始化 Web 项目框架(前端 React + 后端 Node.js)
  - [x] SubTask 1.2: 设计数据库模型(客户、出口批次、文件类型、文件记录)
  - [x] SubTask 1.3: 配置文件存储系统(本地存储或云存储)

- [x] Task 2: 实现客户管理功能
  - [x] SubTask 2.1: 创建客户 CRUD API
  - [x] SubTask 2.2: 实现客户列表页面
  - [x] SubTask 2.3: 实现客户创建和编辑表单
  - [x] SubTask 2.4: 实现客户删除功能(带确认)

- [x] Task 3: 实现出口批次管理功能
  - [x] SubTask 3.1: 创建出口批次 CRUD API
  - [x] SubTask 3.2: 实现批次列表页面(按客户分组)
  - [x] SubTask 3.3: 实现批次创建表单(关联客户)
  - [x] SubTask 3.4: 实现批次详情页面

- [x] Task 4: 实现文件类型管理
  - [x] SubTask 4.1: 定义文件类型数据模型
  - [x] SubTask 4.2: 预置常用外贸文件类型
  - [x] SubTask 4.3: 实现文件类型管理 API

- [x] Task 5: 实现文件上传功能
  - [x] SubTask 5.1: 创建文件上传 API(支持单个和批量)
  - [x] SubTask 5.2: 实现文件上传前端组件(拖拽上传)
  - [x] SubTask 5.3: 实现文件类型选择和分类
  - [x] SubTask 5.4: 添加文件上传进度显示

- [x] Task 6: 实现缺失文件提醒功能
  - [x] SubTask 6.1: 创建缺失文件检查逻辑
  - [x] SubTask 6.2: 在批次详情页面显示缺失文件列表
  - [x] SubTask 6.3: 在首页显示各批次的文件完整度
  - [x] SubTask 6.4: 添加缺失文件的高亮显示和统计

- [x] Task 7: 实现文件状态跟踪
  - [x] SubTask 7.1: 创建文件状态管理逻辑
  - [x] SubTask 7.2: 实现状态更新(已上传/待补全)
  - [x] SubTask 7.3: 添加状态可视化(颜色标记)

- [x] Task 8: 实现文件预览和下载
  - [x] SubTask 8.1: 创建文件预览 API
  - [x] SubTask 8.2: 实现文件预览组件(支持 PDF、图片等)
  - [x] SubTask 8.3: 创建文件下载 API
  - [x] SubTask 8.4: 添加下载按钮和文件信息展示

- [x] Task 9: 实现首页和导航
  - [x] SubTask 9.1: 创建首页概览页面
  - [x] SubTask 9.2: 实现系统导航菜单
  - [x] SubTask 9.3: 添加搜索功能(搜索客户和批次)

- [x] Task 10: 系统测试和优化
  - [x] SubTask 10.1: 测试所有功能流程
  - [x] SubTask 10.2: 优化用户体验和界面
  - [x] SubTask 10.3: 添加数据验证和错误处理
  - [x] SubTask 10.4: 性能优化和安全检查

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1, Task 2]
- [Task 4] depends on [Task 1]
- [Task 5] depends on [Task 1, Task 3, Task 4]
- [Task 6] depends on [Task 3, Task 4, Task 5]
- [Task 7] depends on [Task 4, Task 5]
- [Task 8] depends on [Task 5]
- [Task 9] depends on [Task 2, Task 3]
- [Task 10] depends on [Task 5, Task 6, Task 7, Task 8, Task 9]
