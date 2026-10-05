/**
 * Gọi API module skill_agent (owlla_backend). Hàm trả `data` hoặc ném lỗi axios;
 * dùng `apiError(err)` để lấy {status, code, message, data}.
 */
import axios from "axios";
import { API } from "@api";

// ------------------------------------------------------------------ skill

export async function getSkills({ page = 1, limit = 12, name, status } = {}) {
  const params = { pagination: true, page, limit };
  if (name) params.name = name;
  if (status) params.status = status;
  const { data } = await axios.get(API.SKILLS, { params });
  return data;   // {skills, count, quota}
}

export async function getSkill(id) {
  const { data } = await axios.get(API.SKILL_ID.format(id));
  return data;
}

export async function createSkill(name, description) {
  const { data } = await axios.post(API.SKILLS, { name, description });
  return data;
}

export async function updateSkillStatus(id, status) {
  const { data } = await axios.patch(API.SKILL_ID.format(id), { status });
  return data;
}

export async function deleteSkill(id) {
  const { data } = await axios.delete(API.SKILL_ID.format(id));
  return data;
}

export function exportSkillUrl(id) {
  return API.SKILL_EXPORT.format(id);
}

// ------------------------------------------------------------------- file

export async function getTree(id) {
  const { data } = await axios.get(API.SKILL_TREE.format(id));
  return data;   // {revision, items}
}

export async function getFileContent(id, path) {
  const { data } = await axios.get(API.SKILL_FILE_CONTENT.format(id), { params: { path } });
  return data;
}

/** URL dùng thẳng cho <img>/<iframe>/<a>: backend redirect sang presigned URL */
export function fileRawUrl(id, path, download = false) {
  const query = new URLSearchParams({ path, ...(download ? { download: "true" } : {}) });
  return `${API.SKILL_FILE_RAW.format(id)}?${query}`;
}

export async function saveFile(id, path, content, expectedSha256) {
  const { data } = await axios.put(API.SKILL_FILE_CONTENT.format(id), { content, expected_sha256: expectedSha256 },
    { params: { path } });
  return data;   // {path, sha256, size, revision, warnings}
}

export async function createFile(id, { path, type = "file", content = "" }) {
  const { data } = await axios.post(API.SKILL_FILES.format(id), { path, type, content });
  return data;
}

export async function moveFile(id, { from, to, expectedSha256, expectedRevision }) {
  const body = { from, to };
  if (expectedSha256) body.expected_sha256 = expectedSha256;
  if (expectedRevision != null) body.expected_revision = expectedRevision;
  const { data } = await axios.post(API.SKILL_FILE_MOVE.format(id), body);
  return data;
}

export async function deletePath(id, path, { expectedSha256, expectedRevision }) {
  const params = { path };
  if (expectedSha256) params.expected_sha256 = expectedSha256;
  if (expectedRevision != null) params.expected_revision = expectedRevision;
  const { data } = await axios.delete(API.SKILL_FILES.format(id), { params });
  return data;
}

// ----------------------------------------------------------------- upload

export async function uploadSkillZip(file, overwrite, onProgress) {
  const form = new FormData();
  form.append("file", file);
  form.append("overwrite", overwrite ? "true" : "false");
  const { data } = await axios.post(API.SKILL_UPLOAD, form, {
    onUploadProgress: (event) => onProgress?.(event.total ? Math.round((event.loaded / event.total) * 100) : 0),
  });
  return data;   // {upload_id, status}
}

export async function getUpload(uploadId) {
  const { data } = await axios.get(API.SKILL_UPLOAD_ID.format(uploadId));
  return data;
}

export async function getUploads({ page = 1, limit = 10, status } = {}) {
  const params = { page, limit };
  if (status) params.status = status;
  const { data } = await axios.get(API.SKILL_UPLOADS, { params });
  return data;   // {uploads, count}
}

export async function overwriteUpload(uploadId, expectedRevision) {
  const { data } = await axios.post(API.SKILL_UPLOAD_OVERWRITE.format(uploadId), { expected_revision: expectedRevision });
  return data;
}

export async function cancelUpload(uploadId) {
  const { data } = await axios.post(API.SKILL_UPLOAD_CANCEL.format(uploadId));
  return data;
}
