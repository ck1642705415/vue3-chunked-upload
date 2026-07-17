// ==================== 提示类型 ====================

/**
 * 提示消息类型
 */
export type NoticeType = 'success' | 'error' | 'warning' | 'info'

// ==================== 上传选项配置 ====================

/**
 * 分片上传配置选项
 */
export interface ChunkUploadOptions {
  /** 分片大小，默认 10MB (10485760) */
  chunkSize?: number
  /** 最大并发上传数，默认 3 */
  maxConcurrent?: number
  /** 分片上传接口地址 */
  uploadUrl?: string
  /** 文件合并接口地址 */
  mergeUrl?: string
  /** 最大文件大小，默认 10GB (10737418240) */
  maxFileSize?: number
  /** 是否自动开始上传，默认 true */
  autoStart?: boolean
  /** 分片失败重试次数，默认 3 */
  retryTimes?: number
  /** 重试延迟时间（毫秒），默认 1000 */
  retryDelay?: number
  /** 是否支持拖拽上传，默认 true */
  draggable?: boolean
  /** 接受的文件类型，如 '.pdf,.doc,.docx' 或 'image/*' */
  accept?: string
  /** 最大文件数量，默认为 0 表示不限制 */
  limit?: number
  /** 自定义请求头 */
  headers?: Record<string, string>
  /** 上传前校验，返回 true 允许上传，false 拒绝 */
  onBeforeUpload?: (files: File[]) => boolean | Promise<boolean>
  /** 上传进度回调 */
  onProgress?: (task: UploadTask) => void
  /** 上传成功回调 */
  onSuccess?: (task: UploadTask) => void
  /** 上传错误回调 */
  onError?: (task: UploadTask, error: Error) => void
  /** 添加任务回调 */
  onTaskAdd?: (task: UploadTask) => void
  /** 删除任务回调 */
  onTaskRemove?: (task: UploadTask) => void
  /** 提示消息回调 */
  onNotice?: (type: NoticeType, message: string) => void
  /** 全部上传完成回调 */
  onAllComplete?: (completedTasks: UploadTask[]) => void
}

// ==================== 上传任务 ====================

/**
 * 上传任务对象
 */
export interface UploadTask {
  /** 任务唯一标识 */
  id: string
  /** 原始文件对象 */
  file: File
  /** 任务状态：等待中、上传中、已暂停、已完成、失败 */
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'error'
  /** 上传进度（0-100） */
  progress: number
  /** 分片大小（字节） */
  chunkSize: number
  /** 总分片数 */
  totalChunks: number
  /** 已上传的分片索引集合 */
  uploadedChunks: Set<number>
  /** 当前正在上传的分片索引 */
  currentChunk: number
  /** 文件唯一标识（由文件名、大小、最后修改时间生成） */
  fileId: string
  /** 正在进行的请求列表，用于暂停时取消请求 */
  xhrList: XMLHttpRequest[]
  /** 上传开始时间戳 */
  startTime?: number
  /** 上传结束时间戳 */
  endTime?: number
  /** 当前上传速度（KB/s） */
  speed?: number
  /** 错误信息 */
  errorMessage?: string
  /** 当前重试次数 */
  retryCount: number
  /** 每个分片的上传状态 */
  chunkStatus: Map<number, 'pending' | 'uploading' | 'completed' | 'error'>
  /** 上传成功后服务器返回的文件路径 */
  path?: string
}

// ==================== 上传状态 ====================

/**
 * 上传器整体状态
 */
export interface UploadState {
  /** 所有上传任务列表 */
  tasks: UploadTask[]
  /** 总任务数 */
  totalCount: number
  /** 已完成任务数 */
  completedCount: number
  /** 整体上传进度（0-100） */
  totalProgress: number
  /** 是否正在上传 */
  isUploading: boolean
  /** 所有文件总大小（字节） */
  totalSize: number
  /** 已上传大小（字节） */
  uploadedSize: number
}

// ==================== 组件使用的文件类型 ====================

/**
 * 组件使用的文件类型（用于 v-model 绑定）
 */
export interface UploadFile {
  /** 文件唯一标识 */
  id: string
  /** 文件名 */
  name: string
  /** 文件大小（字节） */
  size: number
  /** 服务器返回的文件路径 */
  path?: string
  /** 文件状态 */
  status: string
}

// ==================== 已存在文件类型 ====================

/**
 * 已存在文件类型（用于初始化已上传文件列表）
 */
export interface ExistingFile {
  /** 文件唯一标识 */
  id: string
  /** 文件名 */
  name: string
  /** 文件大小（字节） */
  size: number
  /** 服务器上的文件路径 */
  path?: string
}

// ==================== 分片上传请求类型 ====================

/**
 * 分片上传请求参数
 */
export interface ChunkUploadRequest {
  /** 文件唯一标识 */
  fileId: string
  /** 文件名 */
  fileName: string
  /** 当前分片索引（从 0 开始） */
  chunkIndex: number
  /** 总分片数 */
  totalChunks: number
  /** 当前分片数据 */
  chunk: Blob
}

// ==================== 分片上传响应类型 ====================

/**
 * 分片上传响应结果
 */
export interface ChunkUploadResponse {
  /** 是否成功 */
  success: boolean
  /** 提示消息 */
  message?: string
  /** 响应数据 */
  data?: {
    /** 文件路径（部分场景下分片上传也会返回路径） */
    path?: string
    /** 其他自定义字段 */
    [key: string]: any
  }
}

// ==================== 合并文件请求类型 ====================

/**
 * 合并文件请求参数
 */
export interface MergeUploadRequest {
  /** 文件唯一标识 */
  fileId: string
  /** 文件名 */
  fileName: string
  /** 总分片数 */
  totalChunks: number
  /** 文件总大小（字节） */
  fileSize: number
}

// ==================== 合并文件响应类型 ====================

/**
 * 合并文件响应结果
 */
export interface MergeUploadResponse {
  /** 是否成功 */
  success: boolean
  /** 提示消息 */
  message?: string
  /** 响应数据 */
  data?: {
    /** 上传成功后的文件路径 */
    path?: string
    /** 其他自定义字段 */
    [key: string]: any
  }
}
