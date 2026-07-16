<template>
  <div class="chunk-uploader" :class="{ 'opacity-50 pointer-events-none': props.disabled }">
    <!-- 自定义上传区域插槽 -->
    <div v-if="$slots.trigger">
      <div @click="!props.disabled && handleUpload()">
        <slot name="trigger" />
      </div>
      <p class="text-xs text-gray-400 mt-2">最大文件大小 {{ formatFileSize(maxFileSize) }}</p>
      <input ref="fileInput" type="file" multiple class="hidden" @change="handleFileChange" />
    </div>

    <!-- 拖拽上传区域（draggable 为 true 或未设置时显示） -->
    <div
      v-else-if="config.draggable"
      class="upload-zone border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all duration-300"
      :class="{
        'border-blue-500 bg-blue-50': isDragging && !props.disabled,
        'border-gray-300 hover:border-blue-400 hover:bg-gray-50': !isDragging && !props.disabled,
        'border-gray-200 bg-gray-50 cursor-not-allowed': props.disabled,
      }"
      @click="!props.disabled && handleUpload()"
      @dragover.prevent="!props.disabled && (isDragging = true)"
      @dragleave.prevent="!props.disabled && (isDragging = false)"
      @drop.prevent="handleDrop"
    >
      <div class="flex flex-col items-center gap-3">
        <div class="w-14 h-14 flex items-center justify-center">
          <svg class="w-14 h-14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
              fill="#DBEAFE"
              stroke="#3B82F6"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
              stroke="#3B82F6"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-700">
            将文件拖放到此处或
            <span class="text-blue-600 cursor-pointer hover:underline">选择文件</span>
          </p>
          <p class="text-xs text-gray-400 mt-1">最大文件大小 {{ formatFileSize(maxFileSize) }}。</p>
        </div>
      </div>
      <input
        ref="fileInput"
        type="file"
        multiple
        :accept="config.accept"
        class="hidden"
        @change="handleFileChange"
      />
    </div>

    <!-- 按钮上传区域（draggable 为 false 时显示） -->
    <div v-else class="upload-button">
      <button
        type="button"
        class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        :disabled="props.disabled"
        @click="handleUpload"
      >
        选择文件
      </button>
      <p class="text-xs text-gray-400 mt-2">最大文件大小 {{ formatFileSize(maxFileSize) }}</p>
      <input
        ref="fileInput"
        type="file"
        multiple
        :accept="config.accept"
        class="hidden"
        @change="handleFileChange"
      />
    </div>

    <!-- 已上传文件列表 -->
    <div v-if="tasks.length > 0" class="mt-3">
      <!-- <h2 class="text-sm font-medium text-gray-700 mb-3">已上传文件</h2> -->
      <div class="space-y-2">
        <TransitionGroup name="task">
          <div
            v-for="task in tasks"
            :key="task.id"
            class="file-item bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3 hover:border-gray-300 transition-colors"
          >
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center"
              :class="getFileIconBg(task.file.name)"
            >
              <svg
                v-if="isVideo(task.file.name)"
                class="w-5 h-5 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <svg
                v-else-if="isAudio(task.file.name)"
                class="w-5 h-5 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
              <svg
                v-else
                class="w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>

            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-800 truncate">{{ task.file.name }}</p>
              <div class="flex items-center gap-3 mt-0.5">
                <span class="text-xs text-gray-500">{{ formatFileSize(task.file.size) }}</span>
                <span v-if="task.status === 'uploading'" class="text-xs text-blue-600">
                  {{ task.progress }}% · {{ getRemainingTime(task) }}
                </span>
                <span v-if="task.status === 'completed'" class="text-xs text-green-600">
                  已完成
                </span>
                <span v-if="task.status === 'paused'" class="text-xs text-yellow-600">
                  已暂停
                </span>
                <span v-if="task.status === 'error'" class="text-xs text-red-600"> 失败 </span>
              </div>
              <div v-if="task.status !== 'completed'" class="mt-2">
                <div class="progress-bar-container h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    class="progress-bar h-full rounded-full transition-all duration-300 ease-out"
                    :class="{
                      'bg-blue-500': task.status === 'uploading' || task.status === 'pending',
                      'bg-yellow-500': task.status === 'paused',
                      'bg-red-500': task.status === 'error',
                    }"
                    :style="{ width: `${task.progress}%` }"
                  >
                    <div v-if="task.status === 'uploading'" class="progress-bar-shimmer"></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <template v-if="task.status === 'uploading'">
                <button
                  @click="pauseUpload(task.id)"
                  class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              </template>
              <template v-if="task.status === 'paused' || task.status === 'pending'">
                <button
                  @click="resumeUpload(task.id)"
                  class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              </template>
              <template v-if="task.status === 'error'">
                <button
                  @click="retryTask(task.id)"
                  class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              </template>
              <button
                @click="removeTask(task.id)"
                class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useChunkUpload } from './useChunkUpload'
import type { UploadTask, ChunkUploadOptions, NoticeType, UploadFile } from './types'

const props = withDefaults(
  defineProps<{
    modelValue?: UploadFile[]
    options?: ChunkUploadOptions
    disabled?: boolean
  }>(),
  {
    modelValue: () => [],
    disabled: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: UploadFile[]): void
  (e: 'success', task: UploadTask): void
  (e: 'error', task: UploadTask, error: Error): void
  (e: 'progress', task: UploadTask): void
  (e: 'notice', type: NoticeType, message: string): void
  (e: 'allComplete', completedTasks: UploadTask[]): void
  (e: 'taskAdd', task: UploadTask): void
  (e: 'taskRemove', task: UploadTask): void
}>()

const fileInput = ref<HTMLInputElement>()
const isDragging = ref(false)

// 处理提示消息，抛出到父组件
const handleNotice = (type: NoticeType, message: string) => {
  emit('notice', type, message)
}

// 处理成功回调
const handleSuccess = (task: UploadTask) => {
  emit('success', task)
}

// 处理错误回调
const handleError = (task: UploadTask, error: Error) => {
  emit('error', task, error)
}

// 处理进度回调
const handleProgress = (task: UploadTask) => {
  emit('progress', task)
}

// 处理全部完成回调
const handleAllComplete = (completedTasks: UploadTask[]) => {
  emit('allComplete', completedTasks)
}

// 处理添加任务回调
const handleTaskAdd = (task: UploadTask) => {
  emit('taskAdd', task)
}

// 处理删除任务回调
const handleTaskRemove = (task: UploadTask) => {
  emit('taskRemove', task)
}

// 合并用户传入的 options 和内部的回调
const mergedOptions: ChunkUploadOptions = {
  ...props.options,
  onNotice: handleNotice,
  onSuccess: handleSuccess,
  onError: handleError,
  onProgress: handleProgress,
  onAllComplete: handleAllComplete,
  onTaskAdd: handleTaskAdd,
  onTaskRemove: handleTaskRemove,
}

const {
  config,
  tasks,
  maxFileSize,
  addFiles,
  addExistingFiles,
  pauseUpload,
  resumeUpload,
  removeTask,
  retryTask,
  formatFileSize,
} = useChunkUpload(mergedOptions)

onMounted(() => {
  if (props.modelValue && props.modelValue.length > 0) {
    addExistingFiles(props.modelValue)
  }
})

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && newValue.length > 0) {
      const existingIds = tasks.value.map((t) => t.id)
      const newFiles = newValue.filter((f) => !existingIds.includes(f.id))
      if (newFiles.length > 0) {
        addExistingFiles(newFiles)
      }
    }
  },
  { immediate: true, deep: true },
)

const getRemainingTime = (task: UploadTask): string => {
  if (!task.speed || task.speed === 0) return ''
  const remainingBytes = task.file.size - task.uploadedChunks.size * task.chunkSize
  const remainingSeconds = Math.ceil(remainingBytes / (task.speed * 1024))
  if (remainingSeconds < 60) {
    return `剩余 ${remainingSeconds} 秒`
  }
  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  return `剩余 ${minutes} 分 ${seconds} 秒`
}

const isVideo = (fileName: string): boolean => {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv']
  return videoExtensions.some((ext) => fileName.toLowerCase().endsWith(ext))
}

const isAudio = (fileName: string): boolean => {
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a']
  return audioExtensions.some((ext) => fileName.toLowerCase().endsWith(ext))
}

const getFileIconBg = (fileName: string): string => {
  if (isVideo(fileName)) return 'bg-indigo-50'
  if (isAudio(fileName)) return 'bg-indigo-50'
  return 'bg-gray-100'
}

const updateModelValue = () => {
  const completedFiles: UploadFile[] = tasks.value
    .filter((t) => t.status === 'completed')
    .map((t) => ({
      id: t.id,
      name: t.file.name,
      size: t.file.size,
      path: t.path,
      status: t.status,
    }))
  emit('update:modelValue', completedFiles)
}

watch(
  () => tasks.value,
  () => {
    updateModelValue()
  },
  { deep: true },
)

const handleUpload = () => {
  if (props.disabled) return
  fileInput.value?.click()
}

const handleFileChange = async (event: Event) => {
  if (props.disabled) return
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    const filesCount = input.files.length
    // 检查文件数量限制
    if (config.limit && tasks.value.length + filesCount > config.limit) {
      const remaining = config.limit - tasks.value.length
      emit(
        'notice',
        'warning',
        `最多只能上传 ${config.limit} 个文件，当前最多还能添加 ${remaining} 个`,
      )
      input.value = ''
      return
    }

    // 上传前校验
    const fileArray = Array.from(input.files)
    if (config.onBeforeUpload) {
      const canUpload = await config.onBeforeUpload(fileArray)
      if (!canUpload) {
        input.value = ''
        return
      }
    }

    addFiles(input.files)
  }
  input.value = ''
}

const handleDrop = async (event: DragEvent) => {
  if (props.disabled) return
  isDragging.value = false
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    const filesCount = files.length
    // 检查文件数量限制
    if (config.limit && tasks.value.length + filesCount > config.limit) {
      const remaining = config.limit - tasks.value.length
      emit(
        'notice',
        'warning',
        `最多只能上传 ${config.limit} 个文件，当前最多还能添加 ${remaining} 个`,
      )
      return
    }

    // 上传前校验
    const fileArray = Array.from(files)
    if (config.onBeforeUpload) {
      const canUpload = await config.onBeforeUpload(fileArray)
      if (!canUpload) {
        return
      }
    }

    const addedIds = addFiles(files)
    if (addedIds.length > 0) {
      emit('notice', 'success', `已添加 ${addedIds.length} 个文件`)
    }
  }
}

defineExpose({
  tasks,
  addFiles,
  pauseUpload,
  resumeUpload,
  removeTask,
  retryTask,
})
</script>

<style scoped>
.task-enter-active,
.task-leave-active {
  transition: all 0.3s ease;
}

.task-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.task-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.task-move {
  transition: transform 0.3s ease;
}

.progress-bar {
  position: relative;
}

.progress-bar-shimmer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 100%
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>
