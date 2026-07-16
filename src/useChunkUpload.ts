// composables/useChunkUpload.ts
import { ref, computed, onUnmounted, nextTick, type Ref } from 'vue'

// ==================== 类型定义 ====================

export type {
  NoticeType,
  ChunkUploadOptions,
  UploadTask,
  UploadState,
  UploadFile,
  ExistingFile,
} from './types'

import type {
  ChunkUploadOptions,
  UploadTask,
  ExistingFile,
  ChunkUploadRequest,
  ChunkUploadResponse,
  MergeUploadRequest,
  MergeUploadResponse,
} from './types'

// ==================== 工具函数 ====================

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function generateFileId(file: File): string {
  return `${file.name}_${file.size}_${file.lastModified}`
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ==================== 创建任务 ====================

function createUploadTask(file: File, options: ChunkUploadOptions): UploadTask {
  const chunkSize = options.chunkSize || 10 * 1024 * 1024
  const totalChunks = Math.ceil(file.size / chunkSize)

  return {
    id: generateId(),
    file,
    status: 'pending',
    progress: 0,
    chunkSize,
    totalChunks,
    uploadedChunks: new Set(),
    currentChunk: 0,
    fileId: generateFileId(file),
    xhrList: [],
    retryCount: 0,
    chunkStatus: new Map(),
  }
}

// ==================== 主 Hook ====================

export function useChunkUpload(options: ChunkUploadOptions = {}) {
  // 默认配置
  const defaultOptions: Required<ChunkUploadOptions> = {
    chunkSize: 10 * 1024 * 1024,
    maxConcurrent: 3,
    uploadUrl: '/api/chunkUpload/chunk',
    mergeUrl: '/api/chunkUpload/complete',
    maxFileSize: 10 * 1024 * 1024 * 1024,
    autoStart: true,
    retryTimes: 3,
    retryDelay: 1000,
    draggable: true,
    headers: {},
    accept: '',
    limit: 0,
    onBeforeUpload: () => true,
    onProgress: () => {},
    onSuccess: () => {},
    onError: () => {},
    onTaskAdd: () => {},
    onTaskRemove: () => {},
    onNotice: () => {},
    onAllComplete: () => {},
  }

  const config = { ...defaultOptions, ...options }

  // ==================== 状态管理 ====================

  const tasks = ref<UploadTask[]>([]) as Ref<UploadTask[]>
  const isUploading = ref(false)
  const taskMap = new Map<string, UploadTask>()

  // 用于强制更新的计数器
  const updateCounter = ref(0)

  // ==================== 计算属性 ====================

  const totalCount = computed(() => tasks.value.length)

  const completedCount = computed(() => tasks.value.filter((t) => t.status === 'completed').length)

  const totalProgress = computed(() => {
    if (tasks.value.length === 0) return 0
    const total = tasks.value.reduce((sum, task) => sum + task.progress, 0)
    return Math.round(total / tasks.value.length)
  })

  const totalSize = computed(() => tasks.value.reduce((sum, task) => sum + task.file.size, 0))

  const uploadedSize = computed(() => {
    let size = 0
    tasks.value.forEach((task) => {
      size += task.uploadedChunks.size * task.chunkSize
    })
    return Math.min(size, totalSize.value)
  })

  // ==================== 内部更新方法 ====================

  // 强制更新视图
  const forceUpdate = () => {
    updateCounter.value++
    // 创建新数组触发响应式
    tasks.value = [...tasks.value]
  }

  // 更新任务（触发响应式）
  const updateTask = (taskId: string, updater: (task: UploadTask) => void) => {
    const task = taskMap.get(taskId)
    if (!task) return

    updater(task)
    tasks.value = [...tasks.value]
  }

  // 获取任务
  const getTask = (taskId: string): UploadTask | undefined => {
    return taskMap.get(taskId)
  }

  // 检查是否所有任务都完成了
  const checkAllComplete = () => {
    if (tasks.value.length === 0) return

    const allCompleted = tasks.value.every((task) => task.status === 'completed')
    if (allCompleted) {
      const completedTasks = tasks.value.filter((task) => task.status === 'completed')
      config.onAllComplete(completedTasks)
    }
  }

  // ==================== 核心上传逻辑 ====================

  // 上传单个分片
  const uploadChunk = (task: UploadTask, chunkIndex: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const start = chunkIndex * task.chunkSize
      const end = Math.min(start + task.chunkSize, task.file.size)
      const chunk = task.file.slice(start, end)

      // 构建分片上传请求数据
      const chunkData: ChunkUploadRequest = {
        fileId: task.fileId,
        fileName: task.file.name,
        chunkIndex,
        totalChunks: task.totalChunks,
        chunk,
      }

      const formData = new FormData()
      formData.append('fileId', chunkData.fileId)
      formData.append('fileName', chunkData.fileName)
      formData.append('chunkIndex', String(chunkData.chunkIndex))
      formData.append('totalChunks', String(chunkData.totalChunks))
      formData.append('chunk', chunkData.chunk)

      const xhr = new XMLHttpRequest()
      task.xhrList.push(xhr)

      xhr.open('POST', config.uploadUrl, true)
      xhr.timeout = 60000 // 60秒超时

      // 设置自定义请求头
      if (config.headers) {
        Object.entries(config.headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value)
        })
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const response: ChunkUploadResponse = JSON.parse(xhr.responseText)
            if (response.success) {
              // 标记分片为已完成
              task.uploadedChunks.add(chunkIndex)
              task.chunkStatus.set(chunkIndex, 'completed')
              resolve()
            } else {
              reject(new Error(response.message || `上传分片 ${chunkIndex} 失败`))
            }
          } catch {
            // 如果响应不是JSON格式，但状态码是200，认为成功
            task.uploadedChunks.add(chunkIndex)
            task.chunkStatus.set(chunkIndex, 'completed')
            resolve()
          }
        } else {
          reject(new Error(`上传分片 ${chunkIndex} 失败: ${xhr.status}`))
        }
      }

      xhr.onerror = () => {
        reject(new Error(`上传分片 ${chunkIndex} 网络错误`))
      }

      xhr.ontimeout = () => {
        reject(new Error(`上传分片 ${chunkIndex} 超时`))
      }

      // 分片上传进度
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && task.status === 'uploading') {
          // 可以更新单个分片的进度
          task.chunkStatus.set(chunkIndex, 'uploading')
        }
      }

      xhr.send(formData)
    })
  }

  // 上传所有分片（支持并发和重试）
  const uploadChunks = async (task: UploadTask): Promise<void> => {
    const totalChunks = task.totalChunks

    // 获取需要上传的分片索引
    const getChunksToUpload = (): number[] => {
      const chunks: number[] = []
      for (let i = 0; i < totalChunks; i++) {
        if (!task.uploadedChunks.has(i)) {
          chunks.push(i)
        }
      }
      return chunks
    }

    let chunksToUpload = getChunksToUpload()

    if (chunksToUpload.length === 0) {
      await completeUpload(task)
      return
    }

    // 使用队列管理并发
    const queue = [...chunksToUpload]
    let isCompleted = false

    // 创建带重试的上传函数
    const uploadWithRetry = async (chunkIndex: number): Promise<void> => {
      let lastError: Error | null = null

      for (let attempt = 0; attempt < config.retryTimes; attempt++) {
        try {
          // 检查任务是否被暂停或取消
          if (task.status === 'paused' || task.status === 'completed') {
            return
          }

          await uploadChunk(task, chunkIndex)

          // 上传成功，更新进度
          const uploaded = task.uploadedChunks.size
          task.progress = Math.round((uploaded / totalChunks) * 100)

          // 计算速度
          if (task.startTime) {
            const elapsed = (Date.now() - task.startTime) / 1000
            if (elapsed > 0) {
              const uploadedBytes = uploaded * task.chunkSize
              task.speed = Math.round(uploadedBytes / elapsed / 1024)
            }
          }

          // 触发进度回调
          config.onProgress(task)

          // 强制更新视图
          updateTask(task.id, () => {})

          // 检查是否全部完成
          if (task.uploadedChunks.size === totalChunks) {
            if (!isCompleted) {
              isCompleted = true
              await completeUpload(task)
            }
            return
          }

          // 继续处理队列中的下一个分片
          await processNext()
          return
        } catch (error) {
          lastError = error as Error
          task.retryCount++

          if (attempt < config.retryTimes - 1) {
            // 等待后重试
            await sleep(config.retryDelay * (attempt + 1))
          }
        }
      }

      // 所有重试都失败
      throw lastError || new Error(`上传分片 ${chunkIndex} 失败`)
    }

    // 处理队列中的下一个分片
    const processNext = async (): Promise<void> => {
      if (queue.length === 0 || task.status === 'paused' || task.status === 'completed') {
        return
      }

      const chunkIndex = queue.shift()!
      await uploadWithRetry(chunkIndex)
    }

    // 启动并发上传
    const concurrency = Math.min(config.maxConcurrent, queue.length)
    const workers: Promise<void>[] = []

    for (let i = 0; i < concurrency; i++) {
      workers.push(processNext())
    }

    await Promise.all(workers)
  }

  // 完成上传（合并文件）
  const completeUpload = async (task: UploadTask): Promise<void> => {
    try {
      // 合并默认请求头和自定义请求头
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...config.headers,
      }

      // 构建合并文件请求数据
      const mergeData: MergeUploadRequest = {
        fileId: task.fileId,
        fileName: task.file.name,
        totalChunks: task.totalChunks,
        fileSize: task.file.size,
      }

      const response = await fetch(config.mergeUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(mergeData),
      })

      const result: MergeUploadResponse = await response.json()

      if (response.ok && result.success) {
        task.status = 'completed'
        task.progress = 100
        task.endTime = Date.now()
        if (result.data && result.data.path) {
          task.path = result.data.path
        }
        config.onSuccess(task)
        config.onNotice('success', `文件 "${task.file.name}" 上传成功`)

        // 强制更新
        updateTask(task.id, () => {})

        // 检查是否所有任务都完成了
        checkAllComplete()
      } else {
        throw new Error(result.message || '合并文件失败')
      }
    } catch (error) {
      task.status = 'error'
      task.errorMessage = error instanceof Error ? error.message : '合并文件失败'
      config.onError(task, error as Error)
      throw error
    }
  }

  // ==================== 公共方法 ====================

  // 开始上传
  const startUpload = async (taskId: string): Promise<void> => {
    const task = getTask(taskId)
    if (!task) {
      throw new Error(`任务 ${taskId} 不存在`)
    }

    if (task.status === 'completed') {
      config.onNotice('info', '文件已上传完成')
      return
    }

    if (task.status === 'uploading') {
      return
    }

    // 重置重试计数
    task.retryCount = 0
    task.status = 'uploading'
    task.startTime = Date.now()
    isUploading.value = true

    try {
      await uploadChunks(task)
    } catch (error) {
      console.error('Upload error:', error)
      task.status = 'error'
      task.errorMessage = error instanceof Error ? error.message : '上传失败'
      config.onError(task, error as Error)
      config.onNotice('error', `上传失败: ${task.errorMessage}`)

      // 强制更新
      updateTask(task.id, () => {})
    } finally {
      isUploading.value = false
    }
  }

  // 添加文件
  const addFiles = (fileList: FileList | File[]): string[] => {
    const addedIds: string[] = []
    const files = Array.from(fileList)

    for (const file of files) {
      if (file.size > config.maxFileSize) {
        config.onNotice(
          'error',
          `文件 "${file.name}" 超过 ${formatFileSize(config.maxFileSize)} 限制`,
        )
        continue
      }

      const exists = tasks.value.some(
        (task) =>
          task.file.name === file.name &&
          task.file.size === file.size &&
          task.file.lastModified === file.lastModified,
      )

      if (exists) {
        config.onNotice('warning', `文件 "${file.name}" 已存在`)
        continue
      }

      const task = createUploadTask(file, config)
      tasks.value.push(task)
      taskMap.set(task.id, task)
      addedIds.push(task.id)

      config.onTaskAdd(task)

      if (config.autoStart) {
        nextTick(() => {
          startUpload(task.id)
        })
      }
    }

    forceUpdate()
    return addedIds
  }

  const addExistingFiles = (existingFiles: ExistingFile[]): void => {
    for (const file of existingFiles) {
      const exists = tasks.value.some((t) => t.id === file.id || t.file?.name === file.name)
      if (exists) continue

      const chunkSize = config.chunkSize || 10 * 1024 * 1024
      const totalChunks = Math.ceil(file.size / chunkSize)

      const blob = new Blob([], { type: '' })
      Object.defineProperty(blob, 'size', { value: file.size })
      const taskFile = blob as unknown as File
      Object.defineProperty(taskFile, 'name', { value: file.name })

      const task: UploadTask = {
        id: file.id,
        file: taskFile,
        status: 'completed',
        progress: 100,
        chunkSize,
        totalChunks,
        uploadedChunks: new Set(Array.from({ length: totalChunks }, (_, i) => i)),
        currentChunk: totalChunks - 1,
        fileId: `${file.name}_${file.size}`,
        xhrList: [],
        retryCount: 0,
        chunkStatus: new Map(),
        path: file.path,
      }

      tasks.value.push(task)
      taskMap.set(task.id, task)
    }

    forceUpdate()
  }

  // 暂停上传
  const pauseUpload = (taskId: string): void => {
    const task = getTask(taskId)
    if (!task || task.status !== 'uploading') return

    task.status = 'paused'
    // 取消所有正在进行的请求
    task.xhrList.forEach((xhr) => xhr.abort())
    task.xhrList = []

    // 更新状态
    updateTask(taskId, () => {})

    // 检查是否所有任务都暂停了
    const hasUploading = tasks.value.some((t) => t.status === 'uploading')
    if (!hasUploading) {
      isUploading.value = false
    }
  }

  // 恢复上传
  const resumeUpload = (taskId: string): void => {
    const task = getTask(taskId)
    if (!task || (task.status !== 'paused' && task.status !== 'pending')) return

    startUpload(taskId)
  }

  // 删除任务
  const removeTask = (taskId: string): boolean => {
    const task = getTask(taskId)
    if (task) {
      // 取消正在进行的请求
      task.xhrList.forEach((xhr) => xhr.abort())
      taskMap.delete(taskId)
      tasks.value = tasks.value.filter((t) => t.id !== taskId)
      config.onTaskRemove(task)

      // 强制更新
      forceUpdate()
      return true
    }
    return false
  }

  // 清空所有任务
  const clearAllTasks = (): void => {
    tasks.value.forEach((task) => {
      task.xhrList.forEach((xhr) => xhr.abort())
    })
    tasks.value = []
    taskMap.clear()
    isUploading.value = false
    forceUpdate()
  }

  // 重试失败的任务
  const retryTask = (taskId: string): void => {
    const task = getTask(taskId)
    if (!task) return

    if (task.status === 'error' || task.status === 'pending') {
      // 重置失败的分片
      task.retryCount = 0
      task.errorMessage = undefined
      task.status = 'pending'

      // 清除失败的分片标记
      task.chunkStatus.forEach((status, index) => {
        if (status === 'error') {
          task.chunkStatus.delete(index)
          task.uploadedChunks.delete(index)
        }
      })

      updateTask(taskId, () => {})
      startUpload(taskId)
    }
  }

  // 暂停所有上传
  const pauseAll = (): void => {
    tasks.value.forEach((task) => {
      if (task.status === 'uploading') {
        pauseUpload(task.id)
      }
    })
  }

  // 恢复所有上传
  const resumeAll = (): void => {
    tasks.value.forEach((task) => {
      if (task.status === 'paused') {
        resumeUpload(task.id)
      }
    })
  }

  // ==================== 统计信息 ====================

  const getTaskStats = () => {
    const stats = {
      pending: 0,
      uploading: 0,
      paused: 0,
      completed: 0,
      error: 0,
      total: tasks.value.length,
    }

    tasks.value.forEach((task) => {
      stats[task.status] = (stats[task.status] || 0) + 1
    })

    return stats
  }

  // 获取已上传的分片列表（用于断点续传）
  const getUploadedChunks = (taskId: string): number[] => {
    const task = getTask(taskId)
    if (!task) return []
    return Array.from(task.uploadedChunks).sort((a, b) => a - b)
  }

  // ==================== 生命周期 ====================

  onUnmounted(() => {
    // 清理所有请求
    tasks.value.forEach((task) => {
      task.xhrList.forEach((xhr) => xhr.abort())
    })
    tasks.value = []
    taskMap.clear()
    isUploading.value = false
  })

  // ==================== 导出 ====================

  return {
    config,
    // 状态
    tasks: tasks as Ref<UploadTask[]>,
    isUploading: isUploading as Ref<boolean>,
    totalCount,
    completedCount,
    totalProgress,
    totalSize,
    uploadedSize,
    updateCounter,

    // 配置
    maxFileSize: config.maxFileSize,

    // 核心方法
    addFiles,
    addExistingFiles,
    startUpload,
    pauseUpload,
    resumeUpload,
    removeTask,
    clearAllTasks,
    retryTask,
    pauseAll,
    resumeAll,
    getTask,
    getTaskStats,
    getUploadedChunks,
    forceUpdate,

    // 工具函数
    formatFileSize,
  }
}
