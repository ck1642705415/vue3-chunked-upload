// ==================== 提示类型 ====================

export type NoticeType = 'success' | 'error' | 'warning' | 'info'

// ==================== 上传选项配置 ====================

export interface ChunkUploadOptions {
  chunkSize?: number // 分片大小，默认 10MB
  maxConcurrent?: number // 最大并发数，默认 3
  uploadUrl?: string // 分片上传接口
  mergeUrl?: string // 合并文件接口
  maxFileSize?: number // 最大文件大小，默认 10GB
  autoStart?: boolean // 是否自动开始上传，默认 true
  retryTimes?: number // 分片重试次数，默认 3
  retryDelay?: number // 重试延迟（毫秒），默认 1000
  draggable?: boolean // 是否支持拖拽上传，默认 true
  accept?: string // 接受的文件类型，如 '.pdf,.doc,.docx' 或 'image/*'
  limit?: number // 最大文件数量，默认为 0 表示不限制
  headers?: Record<string, string> // 自定义请求头
  onBeforeUpload?: (files: File[]) => boolean | Promise<boolean> // 上传前校验，返回 true 允许上传，false 拒绝
  onProgress?: (task: UploadTask) => void // 进度回调
  onSuccess?: (task: UploadTask) => void // 成功回调
  onError?: (task: UploadTask, error: Error) => void // 错误回调
  onTaskAdd?: (task: UploadTask) => void // 添加任务回调
  onTaskRemove?: (task: UploadTask) => void // 删除任务回调
  onNotice?: (type: NoticeType, message: string) => void // 提示回调
  onAllComplete?: (completedTasks: UploadTask[]) => void // 全部上传完成回调
}

// ==================== 上传任务 ====================

export interface UploadTask {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'error'
  progress: number
  chunkSize: number
  totalChunks: number
  uploadedChunks: Set<number>
  currentChunk: number
  fileId: string
  xhrList: XMLHttpRequest[]
  startTime?: number
  endTime?: number
  speed?: number // 上传速度 KB/s
  errorMessage?: string
  retryCount: number // 当前重试次数
  chunkStatus: Map<number, 'pending' | 'uploading' | 'completed' | 'error'> // 每个分片的状态
  path?: string // 上传成功后服务器返回的文件路径
}

// ==================== 上传状态 ====================

export interface UploadState {
  tasks: UploadTask[]
  totalCount: number
  completedCount: number
  totalProgress: number
  isUploading: boolean
  totalSize: number
  uploadedSize: number
}

// ==================== 组件使用的文件类型 ====================

export interface UploadFile {
  id: string
  name: string
  size: number
  path?: string // 服务器返回的文件路径
  status: string
}

// ==================== 已存在文件类型 ====================

export interface ExistingFile {
  id: string
  name: string
  size: number
  path?: string
}

// ==================== 分片上传请求类型 ====================

export interface ChunkUploadRequest {
  fileId: string // 文件唯一标识
  fileName: string // 文件名
  chunkIndex: number // 当前分片索引
  totalChunks: number // 总分片数
  chunk: Blob // 当前分片数据
}

// ==================== 分片上传响应类型 ====================

export interface ChunkUploadResponse {
  success: boolean
  message?: string
  data?: {
    path?: string // 上传成功后的文件路径
    [key: string]: any
  }
}

// ==================== 合并文件请求类型 ====================

export interface MergeUploadRequest {
  fileId: string
  fileName: string
  totalChunks: number
  fileSize: number
}

// ==================== 合并文件响应类型 ====================

export interface MergeUploadResponse {
  success: boolean
  message?: string
  data?: {
    path?: string // 上传成功后的文件路径
    [key: string]: any
  }
}
