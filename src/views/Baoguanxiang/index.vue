<template>
  <div class="file-browser-container">
    <!-- 1. 新增的页面标题 -->
    <h1 class="page-title">单证保管箱数据 demo</h1>

    <!-- 头部：导航和当前路径 -->
    <div class="browser-header">
      <button @click="goBack" :disabled="isAtRoot" class="nav-button">&larr; 返回</button>
      <div class="current-path">{{ currentPath }}</div>
    </div>

    <!-- 加载中 -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>正在加载文件...</p>
    </div>

    <!-- 错误信息 -->
    <div v-else-if="error" class="error-state">
      <h3>发生错误</h3>
      <p>{{ error }}</p>
      <button @click="fetchFiles(currentPath)">重试</button>
    </div>

    <!-- 3. 文件列表容器 (现在可滚动) -->
    <div v-else-if="files.length > 0" class="file-list-container">
      <table class="file-table">
        <thead>
          <tr>
            <th class="col-icon"></th>
            <th class="col-name">名称</th>
            <th class="col-size">大小</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="file in files" :key="file.absolutePath" class="file-item">
            <td class="col-icon">
              <span class="icon">{{ file.directory ? '📁' : '📄' }}</span>
            </td>
            <!-- 目录名可点击 -->
            <td class="col-name">
              <a v-if="file.directory" @click.prevent="handleFileClick(file)" href="#" class="file-link">
                {{ file.name }}
              </a>
              <span v-else>{{ file.name }}</span>
            </td>
            <td class="col-size">
              {{ file.directory ? '--' : formatFileSize(file.size) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 空目录 -->
    <div v-else class="empty-state">
      <p>此目录为空。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

// --- 配置 ---

// 2. 浏览器的根路径。已修改为 /ocptest
const BROWSER_ROOT = '/ocptest'
// 从 Vite 环境变量中获取 Go 服务器的基础 URL
// 如果环境变量未设置，则使用一个备用地址
const API_BASE_URL = import.meta.env.VITE_OCP_SERVER_URL || 'http://localhost:59998'

// --- 类型定义 (匹配你的 Go 服务) ---

interface FileInfo {
  directory: boolean
  absolutePath: string
  name: string
  path: string
  size: number
}

interface RestResult {
  flag: string
  code: number
  data: FileInfo[]
  message: string
}

// --- 组件状态 ---

const currentPath = ref(BROWSER_ROOT)
const files = ref<FileInfo[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

// --- 计算属性 ---

const isAtRoot = computed(() => currentPath.value === BROWSER_ROOT)

// --- API 函数 ---

/**
 * 从 Go 服务器获取指定路径的文件列表。
 */
async function fetchFiles(path: string) {
  isLoading.value = true
  error.value = null
  files.value = [] // 清空旧文件

  try {
    const response = await fetch(`${API_BASE_URL}/files?path=${encodeURIComponent(path)}`)

    if (!response.ok) {
      throw new Error(`服务器响应状态: ${response.status}`)
    }

    const result: RestResult = await response.json()

    if (result.flag !== 'T') {
      throw new Error(result.message || '获取文件列表失败')
    }

    // 排序：文件夹优先，然后是文件，都按字母顺序
    result.data.sort((a, b) => {
      if (a.directory !== b.directory) {
        return a.directory ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })

    files.value = result.data
    currentPath.value = path
  } catch (err: any) {
    console.error('获取文件时出错:', err)
    error.value = err.message || '发生未知错误。'
  } finally {
    isLoading.value = false
  }
}

// --- 事件处理器 ---

/**
 * 当用户点击文件或目录时调用。
 */
function handleFileClick(file: FileInfo) {
  if (file.directory) {
    // 导航到该目录
    fetchFiles(file.absolutePath)
  }
  // 如果不是目录，则不执行任何操作（移除了下载）
}

/**
 * 导航到上一级目录。
 */
function goBack() {
  if (isAtRoot.value) {
    return // 安全检查，按钮应被禁用
  }

  // 找到最后一个 '/' 并截取字符串
  const parentPath = currentPath.value.substring(0, currentPath.value.lastIndexOf('/'))

  // 如果父路径为空（例如，从 "/test"），或短于根路径，则返回根路径。
  if (!parentPath || parentPath.length < BROWSER_ROOT.length) {
    fetchFiles(BROWSER_ROOT)
  } else {
    fetchFiles(parentPath)
  }
}

// [移除] downloadFile 函数已被移除

// --- 生命周期 ---

onMounted(() => {
  // 组件挂载时加载初始目录
  fetchFiles(currentPath.value)
})

// --- 工具函数 ---

/**
 * 将字节大小格式化为易读的字符串。
 */
function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}
</script>

<style lang="less" scoped>
/* 使用 less 进行样式设置 */

.file-browser-container {
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  max-width: 900px;
  margin: 20px auto;

  /* [修改]
     为了让内部滚动条正常工作，
     我们限制一下容器的最大高度，并使用 flex 布局
  */
  display: flex;
  flex-direction: column;
  max-height: 85vh; /* 限制最大高度为视口的 85% */
}

/* 1. 新增的标题样式 */
.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-top: 0;
  margin-bottom: 20px;
  text-align: center;
  flex-shrink: 0; /* 防止标题在 flex 布局中被压缩 */
}

.browser-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0; /* 防止导航栏在 flex 布局中被压缩 */
}

.nav-button {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid #ccc;
  background-color: #fff;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f0f0f0;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.current-path {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  background-color: #eef;
  padding: 8px 12px;
  border-radius: 6px;
  font-family: 'Courier New', Courier, monospace;
}

/* 加载、错误和空状态 */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #666;
  font-size: 16px;
  flex-grow: 1; /* 填充剩余空间 */
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-state h3 {
  color: #e74c3c;
}

/* 3. 文件表格样式 (修改) */
.file-list-container {
  overflow-y: auto; /* 关键：添加Y轴滚动条 */
  overflow-x: hidden;
  border: 1px solid #e0e0e0;
  border-radius: 8px;

  /* 关键：让这个容器填充剩余空间 */
  flex-grow: 1;
  min-height: 0; /* 允许 flex item 收缩 */
}

.file-table {
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
    white-space: nowrap;
  }

  th {
    background-color: #f4f6f8;
    font-size: 12px;
    font-weight: 600;
    color: #555;
    text-transform: uppercase;

    /* 3. 关键：使表头在滚动时保持可见 */
    position: sticky;
    top: 0;
    z-index: 1;
  }

  tr:last-child {
    td {
      border-bottom: none;
    }
  }

  .file-item {
    transition: background-color 0.15s ease;

    &:hover {
      background-color: #f0f5ff;
    }
  }

  .col-icon {
    width: 40px;
  }
  .col-name {
    width: 70%;
  }
  .col-size {
    width: 150px;
  }

  .icon {
    font-size: 20px;
  }

  .file-link {
    color: #0056b3;
    text-decoration: none;
    font-weight: 500;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
