# vue3-chunked-upload

基于 Vue 3 的分片上传组件，支持断点续传、并发上传、失败重试等功能。

**组件特点**：
- 完全通用，不依赖任何 UI 组件库
- 支持通过 `notice` 事件自定义提示方式
- 可集成 Arco Design、Element Plus 等主流 UI 库
- 支持拖拽上传和按钮上传两种模式
- 支持自定义上传区域插槽
- 支持文件数量限制和类型限制

## 功能特性

- **分片上传**：大文件自动分片上传，默认分片大小为 10MB
- **断点续传**：支持暂停/继续上传，刷新页面后可继续上传
- **并发控制**：支持配置最大并发数，默认 3 个并发
- **失败重试**：单个分片上传失败自动重试，默认重试 3 次
- **拖拽上传**：支持拖拽和点击选择文件
- **按钮上传**：可通过配置切换为纯按钮上传模式
- **表单集成**：支持 v-model 双向绑定，可直接集成到表单中
- **文件类型限制**：支持通过 `accept` 配置限制可上传的文件类型
- **文件数量限制**：支持通过 `limit` 配置限制最大上传数量
- **自定义请求头**：支持通过 `headers` 配置自定义请求头
- **上传前校验**：支持通过 `onBeforeUpload` 回调进行上传前校验
- **文件类型识别**：自动识别视频、音频文件并显示对应图标
- **通用提示**：通过事件回调处理提示，不依赖特定 UI 库
- **禁用功能**：支持 `disabled` 属性禁用上传功能

## 安装

```bash
npm install vue3-chunked-upload
# 或
yarn add vue3-chunked-upload
# 或
pnpm add vue3-chunked-upload
```

## 快速开始

### 步骤 1：引入组件

在 Vue 组件中引入 `Vue3ChunkedUpload` 组件：

```vue
<script setup lang="ts">
import { Vue3ChunkedUpload } from 'vue3-chunked-upload'
import type { NoticeType } from 'vue3-chunked-upload'
</script>
```

### 步骤 2：在模板中使用

使用 `v-model` 绑定已上传文件列表：

```vue
<template>
  <Vue3ChunkedUpload v-model="uploadedFiles" @notice="handleNotice" />
</template>
```

### 步骤 3：配置后端接口

在 `options` 中配置你的后端上传接口：

```vue
<template>
  <Vue3ChunkedUpload
    v-model="uploadedFiles"
    :options="uploadOptions"
    @notice="handleNotice"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Vue3ChunkedUpload, type ChunkUploadOptions } from 'vue3-chunked-upload'

const uploadedFiles = ref([])

// 配置上传接口（必填）
const uploadOptions: ChunkUploadOptions = {
  uploadUrl: '/api/chunkUpload/chunk',   // 分片上传接口
  mergeUrl: '/api/chunkUpload/complete', // 文件合并接口
  chunkSize: 10 * 1024 * 1024,           // 分片大小，默认 10MB
  maxConcurrent: 3,                       // 最大并发数
  autoStart: true,                        // 选择文件后自动开始上传
}
</script>
```

### 步骤 4：处理提示消息

实现 `handleNotice` 回调，使用你喜欢的 UI 库显示提示：

```vue
<script setup lang="ts">
// Arco Design
import { Message } from '@arco-design/web-vue'

const handleNotice = (type: NoticeType, message: string) => {
  const typeMap = {
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'info'
  }
  Message[typeMap[type]](message)
}
</script>
```

## 使用方式

### 基础用法

```vue
<template>
  <Vue3ChunkedUpload v-model="uploadedFiles" @notice="handleNotice" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Vue3ChunkedUpload } from 'vue3-chunked-upload'
import type { NoticeType, UploadFile } from 'vue3-chunked-upload'

const uploadedFiles = ref<UploadFile[]>([])

// 处理提示消息（根据使用的 UI 库选择提示方式）
const handleNotice = (type: NoticeType, message: string) => {
  // Arco Design
  Message[type === 'error' ? 'error' : type === 'warning' ? 'warning' : type === 'info' ? 'info' : 'success'](message)

  // 或 Element Plus
  // ElMessage[type](message)

  // 或原生提示
  // alert(message)
}
</script>
```

### 自定义配置

```vue
<template>
  <Vue3ChunkedUpload
    v-model="uploadedFiles"
    :options="uploadOptions"
    @success="handleSuccess"
    @error="handleError"
    @progress="handleProgress"
    @notice="handleNotice"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Vue3ChunkedUpload } from 'vue3-chunked-upload'
import type { ChunkUploadOptions, UploadTask, NoticeType } from 'vue3-chunked-upload'

const uploadedFiles = ref<UploadFile[]>([])

const uploadOptions: ChunkUploadOptions = {
  chunkSize: 5 * 1024 * 1024,        // 分片大小 5MB
  maxConcurrent: 3,                    // 最大并发数 3
  uploadUrl: '/api/chunkUpload/chunk',
  mergeUrl: '/api/chunkUpload/complete',
  maxFileSize: 500 * 1024 * 1024,    // 最大文件 500MB
  autoStart: true,                    // 自动开始上传
  retryTimes: 3,                      // 重试次数
  retryDelay: 1000,                   // 重试延迟
  headers: {                          // 自定义请求头
    'Authorization': 'Bearer token',
  },
}

const handleSuccess = (task: UploadTask) => {
  console.log('文件上传成功:', task.file.name, task.path)
}

const handleError = (task: UploadTask, error: Error) => {
  console.error('文件上传失败:', task.file.name, error.message)
}

const handleProgress = (task: UploadTask) => {
  console.log('上传进度:', task.progress + '%', '速度:', task.speed + 'KB/s')
}

const handleNotice = (type: NoticeType, message: string) => {
  console.log(`[${type}] ${message}`)
}
</script>
```

### 在表单中使用

在表单中使用时，`v-model` 绑定的数据会自动更新为已上传完成的文件的列表：

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">文件上传</label>
      <Vue3ChunkedUpload
        v-model="formData.files"
        :options="uploadOptions"
        @notice="handleNotice"
        @success="handleSuccess"
        @error="handleError"
      />
    </div>
    <!-- 预览已上传的文件 -->
    <div v-if="formData.files.length > 0" class="mb-4">
      <h4 class="text-sm font-medium text-gray-700">已上传文件：</h4>
      <ul class="list-disc list-inside text-sm text-gray-600">
        <li v-for="file in formData.files" :key="file.id">
          {{ file.name }} ({{ formatSize(file.size) }})
        </li>
      </ul>
    </div>
    <button
      type="submit"
      :disabled="formData.files.length === 0"
      class="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
    >
      提交
    </button>
  </form>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { Vue3ChunkedUpload, formatFileSize, type UploadFile, type NoticeType, type UploadTask } from 'vue3-chunked-upload'

const formData = reactive({
  files: [] as UploadFile[],
})

const uploadOptions = {
  uploadUrl: '/api/chunkUpload/chunk',
  mergeUrl: '/api/chunkUpload/complete',
}

// 格式化文件大小
const formatSize = (size: number) => formatFileSize(size)

// 处理提示消息
const handleNotice = (type: NoticeType, message: string) => {
  console.log(`[${type}] ${message}`)
}

// 处理上传成功
const handleSuccess = (task: UploadTask) => {
  console.log('文件上传成功:', task.file.name)
}

// 处理上传失败
const handleError = (task: UploadTask, error: Error) => {
  console.error('文件上传失败:', task.file.name, error.message)
}

// 提交表单
const handleSubmit = () => {
  console.log('提交的文件:', formData.files)
  // 在这里调用你的 API 提交表单数据
}
</script>
```

### 拖拽上传模式（默认）

默认启用拖拽上传，用户可以将文件拖拽到上传区域或点击选择文件：

```vue
<Vue3ChunkedUpload v-model="files" />
```

### 按钮上传模式

设置 `draggable: false` 切换为纯按钮上传模式：

```vue
<template>
  <Vue3ChunkedUpload
    v-model="files"
    :options="{ draggable: false }"
    @notice="handleNotice"
  />
</template>
```

### 限制文件类型

使用 `accept` 配置限制可上传的文件类型：

```vue
<template>
  <!-- 只接受图片 -->
  <Vue3ChunkedUpload
    v-model="imageFiles"
    :options="{ accept: 'image/*' }"
    @notice="handleNotice"
  />

  <!-- 只接受 PDF 和 Word 文档 -->
  <Vue3ChunkedUpload
    v-model="docFiles"
    :options="{ accept: '.pdf,.doc,.docx' }"
    @notice="handleNotice"
  />

  <!-- 只接受视频 -->
  <Vue3ChunkedUpload
    v-model="videoFiles"
    :options="{ accept: 'video/*' }"
    @notice="handleNotice"
  />

  <!-- 接受多种类型 -->
  <Vue3ChunkedUpload
    v-model="mixedFiles"
    :options="{ accept: 'image/*,video/*,.pdf,.doc,.docx' }"
    @notice="handleNotice"
  />
</template>
```

### 限制文件数量

使用 `limit` 配置限制最大上传数量：

```vue
<template>
  <!-- 限制最多上传 5 个文件 -->
  <Vue3ChunkedUpload
    v-model="files"
    :options="{ limit: 5 }"
    @notice="handleNotice"
  />

  <!-- 限制只能上传 1 个文件 -->
  <Vue3ChunkedUpload
    v-model="singleFile"
    :options="{ limit: 1 }"
    @notice="handleNotice"
  />

  <!-- 不限制文件数量（默认） -->
  <Vue3ChunkedUpload v-model="files" />
</template>
```

### 上传前校验

使用 `onBeforeUpload` 回调进行上传前校验，返回 `true` 允许上传，`false` 拒绝：

```vue
<template>
  <Vue3ChunkedUpload
    v-model="files"
    :options="uploadOptions"
    @notice="handleNotice"
  />
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Vue3ChunkedUpload } from 'vue3-chunked-upload'
import type { ChunkUploadOptions, NoticeType } from 'vue3-chunked-upload'

const files = ref([])

const uploadOptions = reactive<ChunkUploadOptions>({
  uploadUrl: '/api/chunkUpload/chunk',
  mergeUrl: '/api/chunkUpload/complete',

  // 同步校验：检查文件名
  onBeforeUpload: (files: File[]) => {
    const hasInvalidName = files.some(f => f.name.includes('test'))
    if (hasInvalidName) {
      return false // 拒绝上传
    }
    return true // 允许上传
  },
})

// 异步校验：检查文件是否已存在于服务器
const uploadOptionsAsync = reactive<ChunkUploadOptions>({
  uploadUrl: '/api/chunkUpload/chunk',
  mergeUrl: '/api/chunkUpload/complete',

  onBeforeUpload: async (files: File[]) => {
    try {
      const response = await fetch('/api/checkFilesExist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileNames: files.map(f => f.name) }),
      })
      const result = await response.json()

      if (result.hasConflict) {
        return false // 文件已存在，拒绝上传
      }
      return true // 允许上传
    } catch (error) {
      console.error('校验失败:', error)
      return false
    }
  },
})
</script>
```

### 自定义上传区域

使用 `#trigger` 插槽自定义上传区域：

```vue
<template>
  <Vue3ChunkedUpload v-model="files" @notice="handleNotice">
    <template #trigger>
      <div class="custom-upload-area">
        <a-button type="primary">
          <upload-outlined /> 点击上传文件
        </a-button>
        <p class="text-gray-500 mt-2">支持 PDF、Word、图片等文件</p>
      </div>
    </template>
  </Vue3ChunkedUpload>
</template>
```

### 禁用上传功能

设置 `disabled` 属性禁用上传功能：

```vue
<template>
  <!-- 禁用上传功能 -->
  <Vue3ChunkedUpload v-model="files" disabled @notice="handleNotice" />

  <!-- 动态控制禁用状态 -->
  <Vue3ChunkedUpload
    v-model="files"
    :disabled="isUploading"
    @notice="handleNotice"
  />
</template>
```

### 监听所有上传完成

使用 `@all-complete` 事件监听所有文件上传完成：

```vue
<template>
  <Vue3ChunkedUpload
    v-model="files"
    @all-complete="handleAllComplete"
    @notice="handleNotice"
  />
</template>

<script setup lang="ts">
import { Vue3ChunkedUpload } from 'vue3-chunked-upload'
import type { UploadTask } from 'vue3-chunked-upload'

const handleAllComplete = (completedTasks: UploadTask[]) => {
  console.log('所有文件上传完成！')
  console.log('已完成的任务:', completedTasks)
  console.log('上传成功的文件路径:', completedTasks.map(t => t.path))

  // 可以在这里执行提交表单等操作
}
</script>
```

### 监听任务添加和删除

使用 `@task-add` 和 `@task-remove` 事件监听任务变化：

```vue
<template>
  <Vue3ChunkedUpload
    v-model="files"
    @task-add="handleTaskAdd"
    @task-remove="handleTaskRemove"
    @notice="handleNotice"
  />
</template>

<script setup lang="ts">
import { Vue3ChunkedUpload } from 'vue3-chunked-upload'
import type { UploadTask } from 'vue3-chunked-upload'

const handleTaskAdd = (task: UploadTask) => {
  console.log('添加任务:', task.file.name, `大小: ${(task.file.size / 1024 / 1024).toFixed(2)}MB`)
}

const handleTaskRemove = (task: UploadTask) => {
  console.log('删除任务:', task.file.name)
}
</script>
```

### 初始文件回显

通过 `v-model` 传入已上传的文件列表，组件会自动回显：

```vue
<template>
  <Vue3ChunkedUpload v-model="uploadedFiles" @notice="handleNotice" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Vue3ChunkedUpload } from 'vue3-chunked-upload'
import type { UploadFile } from 'vue3-chunked-upload'

// 从服务器加载已上传的文件列表
const uploadedFiles = ref<UploadFile[]>([
  {
    id: 'file1',
    name: 'document.pdf',
    size: 1024000,
    path: '/uploads/2024/document.pdf',
    status: 'completed',
  },
  {
    id: 'file2',
    name: 'video.mp4',
    size: 52428800,
    path: '/uploads/2024/video.mp4',
    status: 'completed',
  },
])
</script>
```

### 手动控制上传任务

使用组件暴露的方法手动控制上传任务：

```vue
<template>
  <div>
    <Vue3ChunkedUpload ref="uploaderRef" v-model="uploadedFiles" :options="uploadOptions" />

    <!-- 自定义控制按钮 -->
    <div class="mt-4 flex gap-2">
      <button @click="startAll" class="px-3 py-1 bg-green-500 text-white rounded">
        全部开始
      </button>
      <button @click="pauseAll" class="px-3 py-1 bg-yellow-500 text-white rounded">
        全部暂停
      </button>
      <button @click="clearAll" class="px-3 py-1 bg-red-500 text-white rounded">
        清空列表
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Vue3ChunkedUpload, type UploadFile, type ChunkUploadOptions } from 'vue3-chunked-upload'

const uploaderRef = ref()
const uploadedFiles = ref<UploadFile[]>([])

const uploadOptions: ChunkUploadOptions = {
  uploadUrl: '/api/chunkUpload/chunk',
  mergeUrl: '/api/chunkUpload/complete',
  autoStart: false, // 关闭自动开始
}

// 开始所有上传
const startAll = () => {
  uploaderRef.value?.tasks?.forEach(task => {
    if (task.status === 'pending') {
      // 调用内部方法开始上传
    }
  })
}

// 暂停所有上传
const pauseAll = () => {
  uploaderRef.value?.pauseAll?.()
}

// 清空列表
const clearAll = () => {
  uploaderRef.value?.clearAllTasks?.()
}
</script>
```

### 与 Element Plus 集成

```vue
<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>文件上传</span>
      </div>
    </template>
    <Vue3ChunkedUpload
      v-model="uploadedFiles"
      :options="uploadOptions"
      @notice="handleNotice"
    />
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Vue3ChunkedUpload, type UploadFile, type NoticeType, type ChunkUploadOptions } from 'vue3-chunked-upload'

const uploadedFiles = ref<UploadFile[]>([])

const uploadOptions: ChunkUploadOptions = {
  uploadUrl: '/api/chunkUpload/chunk',
  mergeUrl: '/api/chunkUpload/complete',
}

// Element Plus 提示
const handleNotice = (type: NoticeType, message: string) => {
  ElMessage({
    message,
    type: type === 'error' ? 'error' : type === 'warning' ? 'warning' : type === 'info' ? 'info' : 'success',
  })
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
```

## Props

| 属性         | 类型                 | 默认值 | 说明                                  |
| ------------ | -------------------- | ------ | ------------------------------------- |
| `modelValue` | `UploadFile[]`       | `[]`   | 已上传文件列表，支持 v-model 双向绑定 |
| `options`    | `ChunkUploadOptions` | `{}`   | 上传配置选项                          |
| `disabled`   | `boolean`            | `false` | 是否禁用上传功能                      |

## Options 配置

| 属性            | 类型                                                               | 默认值                      | 说明                                              |
| --------------- | ------------------------------------------------------------------ | --------------------------- | ------------------------------------------------- |
| `chunkSize`     | `number`                                                           | `10 * 1024 * 1024`          | 分片大小（字节），默认 10MB                       |
| `maxConcurrent` | `number`                                                           | `3`                         | 最大并发上传数                                    |
| `uploadUrl`     | `string`                                                           | `/api/chunkUpload/chunk`    | 分片上传接口地址                                  |
| `mergeUrl`      | `string`                                                           | `/api/chunkUpload/complete` | 文件合并接口地址                                  |
| `maxFileSize`   | `number`                                                           | `10 * 1024 * 1024 * 1024`   | 最大文件大小（字节），默认 10GB                    |
| `autoStart`     | `boolean`                                                          | `true`                      | 是否自动开始上传                                  |
| `retryTimes`    | `number`                                                           | `3`                         | 分片失败重试次数                                  |
| `retryDelay`    | `number`                                                           | `1000`                      | 重试延迟（毫秒）                                  |
| `draggable`     | `boolean`                                                          | `true`                      | 是否支持拖拽上传，设为 `false` 则使用按钮上传      |
| `accept`        | `string`                                                           | `''`                        | 接受的文件类型，如 `image/*`、`.pdf,.doc,.docx`    |
| `limit`         | `number`                                                           | `0`                         | 最大文件数量，`0` 表示不限制                      |
| `headers`       | `Record<string, string>`                                           | `{}`                        | 自定义请求头，用于携带 Token 等认证信息           |
| `onBeforeUpload`| `(files: File[]) => boolean \| Promise<boolean>`                   | `() => true`                | 上传前校验回调，返回 `true` 允许上传，`false` 拒绝 |
| `onProgress`    | `(task: UploadTask) => void`                                       | `() => {}`                  | 进度更新回调                                      |
| `onSuccess`     | `(task: UploadTask) => void`                                       | `() => {}`                  | 单个文件上传成功回调                              |
| `onError`       | `(task: UploadTask, error: Error) => void`                         | `() => {}`                  | 单个文件上传失败回调                              |
| `onTaskAdd`     | `(task: UploadTask) => void`                                       | `() => {}`                  | 添加任务回调                                      |
| `onTaskRemove`  | `(task: UploadTask) => void`                                       | `() => {}`                  | 删除任务回调                                      |
| `onNotice`      | `(type: NoticeType, message: string) => void`                     | `() => {}`                  | 提示消息回调                                      |
| `onAllComplete` | `(completedTasks: UploadTask[]) => void`                           | `() => {}`                  | 所有文件上传完成回调                              |

## Events

| 事件                | 参数                                         | 说明                          |
| ------------------- | -------------------------------------------- | ----------------------------- |
| `update:modelValue` | `UploadFile[]`                               | 文件列表变化时触发            |
| `success`           | `task: UploadTask`                            | 单个文件上传成功时触发        |
| `error`             | `task: UploadTask, error: Error`              | 单个文件上传失败时触发        |
| `progress`          | `task: UploadTask`                            | 上传进度更新时触发            |
| `taskAdd`           | `task: UploadTask`                            | 添加任务时触发                |
| `taskRemove`        | `task: UploadTask`                            | 删除任务时触发                |
| `notice`            | `(type: NoticeType, message: string)`         | 提示消息事件，需父组件处理    |
| `allComplete`       | `completedTasks: UploadTask[]`                | 所有文件上传完成时触发        |

## Slots

| 插槽名  | 说明         | 用法示例                                       |
| ------- | ------------ | ---------------------------------------------- |
| `trigger` | 自定义上传区域 | `<template #trigger>自定义上传区域</template>` |

## NoticeType 类型

```typescript
type NoticeType = 'success' | 'error' | 'warning' | 'info'
```

## 工具函数

### formatFileSize

格式化文件大小为可读字符串。

```typescript
import { formatFileSize } from 'vue3-chunked-upload'

console.log(formatFileSize(1024)) // "1.00 KB"
console.log(formatFileSize(1048576)) // "1.00 MB"
```

**参数**:
- `bytes: number` - 文件大小（字节）

**返回值**: `string` - 格式化后的文件大小字符串

## 类型定义

### UploadFile

组件使用的文件类型，用于 v-model 双向绑定：

```typescript
interface UploadFile {
  id: string           // 文件唯一标识
  name: string         // 文件名
  size: number         // 文件大小（字节）
  path?: string        // 上传成功后服务器返回的文件路径
  status: string       // 上传状态，通常为 'completed'
}
```

### UploadTask

上传任务对象，包含详细的进度和状态信息：

```typescript
interface UploadTask {
  id: string                    // 任务唯一标识
  file: File                    // 文件对象
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'error'
                                // 任务状态
  progress: number              // 上传进度（0-100）
  chunkSize: number             // 分片大小
  totalChunks: number           // 总分片数
  uploadedChunks: Set<number>   // 已上传的分片索引集合
  path?: string                 // 上传成功后服务器返回的文件路径
  speed?: number                // 上传速度（KB/s）
  errorMessage?: string         // 错误信息
}
```

### ChunkUploadRequest

分片上传请求参数类型：

```typescript
interface ChunkUploadRequest {
  fileId: string      // 文件唯一标识
  fileName: string    // 文件名
  chunkIndex: number   // 当前分片索引
  totalChunks: number // 总分片数
  chunk: Blob         // 当前分片数据
}
```

### ChunkUploadResponse

分片上传响应格式：

```typescript
interface ChunkUploadResponse {
  success: boolean
  message?: string
  data?: {
    fileId: string
    chunkIndex: number
    totalChunks: number
  }
}
```

### MergeUploadRequest

合并文件请求参数类型：

```typescript
interface MergeUploadRequest {
  fileId: string      // 文件唯一标识
  fileName: string    // 文件名
  totalChunks: number // 总分片数
  fileSize: number    // 文件大小
}
```

### MergeUploadResponse

合并文件响应格式：

```typescript
interface MergeUploadResponse {
  success: boolean
  message?: string
  data?: {
    path: string     // 上传成功后服务器返回的文件路径
    fileName: string
    fileSize: number
  }
}
```

### ExistingFile

已存在文件类型，用于初始化已上传的文件列表：

```typescript
interface ExistingFile {
  id: string           // 文件唯一标识
  name: string         // 文件名
  size: number         // 文件大小（字节）
  path?: string        // 文件路径
  status: string       // 状态，通常为 'completed'
}
```

## 暴露的方法

通过 ref 可以调用以下方法：

```vue
<template>
  <Vue3ChunkedUpload ref="uploaderRef" v-model="uploadedFiles" />
  <button @click="handleAddFile">手动添加文件</button>
  <button @click="handlePauseAll">暂停所有</button>
  <button @click="handleResumeAll">继续所有</button>
  <button @click="handleRetryAll">重试失败</button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Vue3ChunkedUpload } from 'vue3-chunked-upload'

const uploaderRef = ref()

// 添加文件
const handleAddFile = () => {
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.multiple = true
  fileInput.onchange = () => {
    if (fileInput.files) {
      uploaderRef.value?.addFiles(fileInput.files)
    }
  }
  fileInput.click()
}

// 暂停指定上传
const handlePauseUpload = (taskId: string) => {
  uploaderRef.value?.pauseUpload(taskId)
}

// 恢复指定上传
const handleResumeUpload = (taskId: string) => {
  uploaderRef.value?.resumeUpload(taskId)
}

// 删除指定任务
const handleRemoveTask = (taskId: string) => {
  uploaderRef.value?.removeTask(taskId)
}

// 重试指定任务
const handleRetryTask = (taskId: string) => {
  uploaderRef.value?.retryTask(taskId)
}

// 暂停所有上传
const handlePauseAll = () => {
  uploaderRef.value?.tasks.forEach((task: any) => {
    if (task.status === 'uploading') {
      uploaderRef.value?.pauseUpload(task.id)
    }
  })
}

// 继续所有上传
const handleResumeAll = () => {
  uploaderRef.value?.tasks.forEach((task: any) => {
    if (task.status === 'paused' || task.status === 'pending') {
      uploaderRef.value?.resumeUpload(task.id)
    }
  })
}

// 重试所有失败的任务
const handleRetryAll = () => {
  uploaderRef.value?.tasks.forEach((task: any) => {
    if (task.status === 'error') {
      uploaderRef.value?.retryTask(task.id)
    }
  })
}
</script>
```

| 方法             | 参数                | 说明                     |
| ---------------- | ------------------- | ------------------------ |
| `addFiles`       | `FileList \| File[]` | 添加文件到上传队列        |
| `pauseUpload`    | `taskId: string`    | 暂停指定上传任务          |
| `resumeUpload`   | `taskId: string`    | 恢复指定上传任务          |
| `removeTask`     | `taskId: string`     | 删除指定上传任务          |
| `retryTask`      | `taskId: string`     | 重试指定失败任务          |
| `getUploadedChunks` | `taskId: string`   | 获取已上传的分片列表      |

## 后端接口要求

### 分片上传接口

**URL**: `POST /api/chunkUpload/chunk`

**请求头**:
```
Content-Type: multipart/form-data
Authorization: Bearer <token>  // 可选，通过 headers 配置
X-Custom-Header: <value>       // 可选，通过 headers 配置
```

**请求体** (FormData):

| 字段          | 类型     | 说明         |
| ------------- | -------- | ------------ |
| `fileId`      | `string` | 文件唯一标识 |
| `fileName`    | `string` | 文件名       |
| `chunkIndex`  | `string` | 分片索引     |
| `totalChunks` | `string` | 总分片数     |
| `chunk`       | `File`   | 分片文件     |

**响应**:

```json
{
  "success": true,
  "message": "上传成功"
}
```

### 合并文件接口

**URL**: `POST /api/chunkUpload/complete`

**请求头**:
```
Content-Type: application/json
Authorization: Bearer <token>  // 可选，通过 headers 配置
```

**请求体** (JSON):

```json
{
  "fileId": "string",
  "fileName": "string",
  "totalChunks": 10,
  "fileSize": 10485760
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "path": "/uploads/2024/07/file-name.mp4"
  },
  "message": "合并成功"
}
```


## Node.js 后端示例

以下是使用 Express + Multer 实现的完整 Node.js 后端代码：

```javascript
// server.js
const express = require('express')
const multer = require('multer')
const fs = require('fs')
const path = require('path')

const app = express()

// 配置存储
const TEMP_DIR = path.join(__dirname, 'temp')
const UPLOAD_DIR = path.join(__dirname, 'uploads')

// 确保目录存在
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

// 配置 multer
const storage = multer.memoryStorage()
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 限制单个分片 50MB
  },
})

// ============= 核心功能：分片上传 =============

/**
 * 1. 上传分片接口
 */
app.post('/chunkUpload/chunk', upload.single('chunk'), (req, res) => {
  try {
    const { fileId, chunkIndex, totalChunks, fileName } = req.body

    // 验证必要参数
    if (!fileId || chunkIndex === undefined || !totalChunks || !req.file) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数',
      })
    }

    // 创建文件专属临时目录
    const fileTempDir = path.join(TEMP_DIR, fileId)
    if (!fs.existsSync(fileTempDir)) {
      fs.mkdirSync(fileTempDir, { recursive: true })
    }

    // 保存分片文件（使用 chunkIndex 命名，保证顺序）
    const chunkPath = path.join(fileTempDir, `chunk_${chunkIndex}`)
    fs.writeFileSync(chunkPath, req.file.buffer)

    // 可选：保存分片元数据
    const metadataPath = path.join(fileTempDir, 'metadata.json')
    let metadata = {}
    if (fs.existsSync(metadataPath)) {
      metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
    }

    metadata[chunkIndex] = {
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
      chunkIndex: parseInt(chunkIndex),
    }

    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))

    console.log(`分片 ${chunkIndex}/${totalChunks} 上传成功，文件ID: ${fileId}`)

    res.json({
      success: true,
      message: `分片 ${chunkIndex} 上传成功`,
      data: {
        fileId,
        chunkIndex: parseInt(chunkIndex),
        totalChunks: parseInt(totalChunks),
      },
    })
  } catch (error) {
    console.error('上传分片失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '上传分片失败',
    })
  }
})

/**
 * 2. 合并文件接口（核心逻辑）
 */
app.post('/chunkUpload/complete', (req, res) => {
  try {
    const { fileId, fileName, totalChunks, fileSize } = req.body

    if (!fileId || !fileName || !totalChunks) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数',
      })
    }

    const fileTempDir = path.join(TEMP_DIR, fileId)

    // 检查临时目录是否存在
    if (!fs.existsSync(fileTempDir)) {
      return res.status(404).json({
        success: false,
        message: '文件分片不存在',
      })
    }

    // 按索引顺序合并
    const outputPath = path.join(UPLOAD_DIR, fileName)
    const writeStream = fs.createWriteStream(outputPath)

    // 按顺序读取并写入每个分片
    for (let i = 0; i < parseInt(totalChunks); i++) {
      const chunkPath = path.join(fileTempDir, `chunk_${i}`)

      // 检查分片是否存在
      if (!fs.existsSync(chunkPath)) {
        writeStream.close()
        fs.unlinkSync(outputPath)

        return res.status(400).json({
          success: false,
          message: `分片 ${i} 缺失，请重新上传`,
        })
      }

      // 读取分片数据并写入
      const chunkData = fs.readFileSync(chunkPath)
      writeStream.write(chunkData)

      // 删除分片文件（节省空间）
      fs.unlinkSync(chunkPath)
    }

    // 删除元数据文件
    const metadataPath = path.join(fileTempDir, 'metadata.json')
    if (fs.existsSync(metadataPath)) {
      fs.unlinkSync(metadataPath)
    }

    // 等待流写入完成后再继续
    writeStream.on('finish', () => {
      // 删除临时目录
      fs.rmdirSync(fileTempDir)

      // 验证文件大小
      const stats = fs.statSync(outputPath)
      if (fileSize && stats.size !== parseInt(fileSize)) {
        fs.unlinkSync(outputPath)
        return res.status(400).json({
          success: false,
          message: `文件大小不匹配，期望 ${fileSize}，实际 ${stats.size}`,
        })
      }

      console.log(`文件合并成功: ${fileName}, 大小: ${stats.size} bytes`)

      res.json({
        success: true,
        message: '文件合并成功',
        data: {
          fileName,
          fileSize: stats.size,
          path: `/uploads/${fileName}`,  // 返回相对路径，供前端使用
        },
      })
    })

    writeStream.end()
  } catch (error) {
    console.error('合并文件失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '合并文件失败',
    })
  }
})


```

## 常见问题

### 1. 上传接口需要认证 token 怎么办？

你可以在 `options` 中添加自定义请求头：

```typescript
const uploadOptions: ChunkUploadOptions = {
  uploadUrl: '/api/chunkUpload/chunk',
  mergeUrl: '/api/chunkUpload/complete',
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
}
```

### 2. 如何限制上传文件的类型？

可以使用 `accept` 配置限制：

```vue
<!-- 只接受图片 -->
<Vue3ChunkedUpload :options="{ accept: 'image/*' }" />

<!-- 只接受 PDF 和 Word -->
<Vue3ChunkedUpload :options="{ accept: '.pdf,.doc,.docx' }" />
```

### 3. 如何显示上传速度？

`UploadTask` 中包含 `speed` 属性，单位为 KB/s：

```typescript
const handleProgress = (task: UploadTask) => {
  if (task.speed) {
    console.log(`上传速度: ${task.speed} KB/s`)
  }
}
```

### 4. 上传中断后如何恢复？

组件会自动保存已上传的分片信息，通过 `resumeUpload` 方法可以继续上传：

```typescript
// 继续上传
resumeUpload(taskId: string)

// 继续所有暂停的任务
resumeAll()
```

### 5. 如何处理大文件（超过 2GB）？

确保以下几点：

1. 服务器配置允许大文件上传
2. 分片大小适中（建议 5-10MB）
3. 服务器端正确处理大文件的合并和存储

```typescript
const uploadOptions: ChunkUploadOptions = {
  chunkSize: 5 * 1024 * 1024, // 5MB 分片
  maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB 最大文件
}
```

### 6. 多个文件同时上传的顺序如何控制？

默认情况下，多个文件会并发上传（由 `maxConcurrent` 控制）。如果需要串行上传：

```typescript
const uploadOptions: ChunkUploadOptions = {
  maxConcurrent: 1, // 一次只上传一个文件
}
```

## 最佳实践

### 1. 合理设置分片大小

- **小文件**（< 50MB）：使用默认 10MB 分片即可
- **大文件**（50MB - 1GB）：建议 5MB 分片，平衡并发效率和失败重试成本
- **超大文件**（> 1GB）：建议 2-5MB 分片，减少单次失败的影响范围

### 2. 错误处理

务必实现错误回调，以便及时发现问题：

```typescript
const uploadOptions: ChunkUploadOptions = {
  // ...其他配置
  onError: (task, error) => {
    // 上报到监控系统
    reportError({
      fileName: task.file.name,
      error: error.message,
      chunkIndex: task.currentChunk,
    })
  },
}
```

### 3. 用户体验优化

1. **禁用按钮**：上传过程中禁用提交按钮，防止用户重复点击
2. **进度提示**：展示总体进度和单个文件进度
3. **取消确认**：提供确认对话框，防止误操作取消上传
4. **自动清理**：定期清理未完成的上传任务，避免占用临时存储

### 4. 安全建议

1. **文件类型验证**：后端必须验证文件类型，不能仅依赖前端
2. **文件名处理**：使用唯一 ID 存储，避免文件名冲突和安全问题
3. **大小限制**：后端同时限制单文件和总上传大小
4. **临时文件清理**：定期清理临时目录，防止磁盘空间耗尽


## 更新日志

### v1.0.0 (2026-07)
- 初始版本发布
- 支持分片上传、断点续传、并发控制
- 支持拖拽上传和按钮上传
- 支持自定义上传区域插槽
- 支持文件类型和数量限制
- 支持上传前校验
- 支持自定义请求头
- 支持禁用功能
- 支持所有文件上传完成事件

## License

MIT
