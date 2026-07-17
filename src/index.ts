/**
 * Vue Chunk Uploader
 * 基于 Vue 3 的分片上传组件
 */

import "./style.css";

export type {
  ChunkUploadOptions,
  UploadTask,
  UploadState,
  UploadFile,
  ExistingFile,
  NoticeType,
  ChunkUploadRequest,
  ChunkUploadResponse,
  MergeUploadRequest,
  MergeUploadResponse,
} from "./types";

export { default as Vue3ChunkedUpload } from "./ChunkUpload.vue";

export { useChunkUpload } from "./useChunkUpload";

export { formatFileSize } from "./useChunkUpload";
