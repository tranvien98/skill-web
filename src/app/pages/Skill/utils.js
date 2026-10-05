import React from "react";
import { FileCode, FileImage, FileJson, FileText, FileType, Folder, FolderOpen, Lock } from "lucide-react";
import { SKILL } from "@constant";
import { extOf } from "@src/helper/utils";

export const SEVERITY = {
  CRITICAL: { label: "CRITICAL", color: "red", marker: 8 },
  HIGH: { label: "HIGH", color: "volcano", marker: 8 },
  MEDIUM: { label: "MEDIUM", color: "gold", marker: 4 },
  INFO: { label: "INFO", color: "default", marker: 2 },
};

export const UPLOAD_STATUS = {
  pending: { label: "Chờ quét", color: "default" },
  scanning: { label: "Đang quét", color: "processing" },
  applying: { label: "Đang ghi đè", color: "processing" },
  passed: { label: "Thành công", color: "success" },
  rejected: { label: "Bị từ chối", color: "error" },
  duplicate: { label: "Chờ ghi đè", color: "warning" },
  failed: { label: "Lỗi hệ thống", color: "error" },
  cancelled: { label: "Đã hủy", color: "default" },
  expired: { label: "Hết hạn", color: "default" },
};

export function isEditablePath(path) {
  return SKILL.EDITABLE_EXTS.includes(extOf(path));
}

/** Kiểm tra name theo agentskills.io (giống helpers/skill_md.py của backend) */
export function nameError(name) {
  if (!name) return "Nhập tên skill";
  if (name.length > SKILL.NAME_MAX) return `Tối đa ${SKILL.NAME_MAX} ký tự`;
  if (!SKILL.NAME_PATTERN.test(name)) {
    return "Chỉ gồm chữ thường a-z, số và dấu '-'; không bắt đầu/kết thúc bằng '-', không có '--'";
  }
  return null;
}

const ICON_CLASS = "w-4 h-4 flex-none";

export function FileIcon({ path, type, open, category }) {
  if (type === "dir") {
    return open ? <FolderOpen className={`${ICON_CLASS} text-amber-500`}/> : <Folder className={`${ICON_CLASS} text-amber-500`}/>;
  }
  const ext = extOf(path);
  if (ext === ".py") return <FileCode className={`${ICON_CLASS} text-sky-600`}/>;
  if (ext === ".js") return <FileCode className={`${ICON_CLASS} text-yellow-500`}/>;
  if (ext === ".ts") return <FileCode className={`${ICON_CLASS} text-blue-600`}/>;
  if (ext === ".json") return <FileJson className={`${ICON_CLASS} text-orange-500`}/>;
  if (category === "binary" && ext === ".pdf") return <FileType className={`${ICON_CLASS} text-red-500`}/>;
  if (category === "binary") return <FileImage className={`${ICON_CLASS} text-violet-500`}/>;
  if (ext === ".md") return <FileText className={`${ICON_CLASS} text-indigo-500`}/>;
  return <FileText className={`${ICON_CLASS} text-slate-500`}/>;
}

export function ReadonlyBadge() {
  return <Lock className="w-3 h-3 text-slate-400 flex-none"/>;
}

export const GRADIENT_ICON = "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br flex-none";
