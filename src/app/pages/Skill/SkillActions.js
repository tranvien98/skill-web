import React from "react";
import { Modal } from "antd";
import { toast } from "react-toastify";
import { Download, PenLine, Trash2 } from "lucide-react";

import { LINK } from "@link";
import { deleteSkill, exportSkillUrl } from "@services/Skills";
import { apiError } from "@src/setup/axios";

export function downloadSkill(skill) {
  const a = document.createElement("a");
  a.href = exportSkillUrl(skill.id);
  a.download = `${skill.name}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function confirmDeleteSkill(skill, onDeleted) {
  Modal.confirm({
    title: `Xóa skill "${skill.name}"?`,
    content: "Agent đang dùng skill này sẽ không dùng được nữa. File được giữ thêm 7 ngày rồi mới bị dọn.",
    okText: "Xóa",
    okButtonProps: { danger: true },
    cancelText: "Hủy",
    onOk: async () => {
      try {
        await deleteSkill(skill.id);
        toast.success(`Đã xóa skill ${skill.name}`);
        onDeleted?.();
      } catch (error) {
        toast.error(apiError(error).message);
      }
    },
  });
}

/** Menu ⋮ của một skill (dùng ở card và bảng) */
export function skillMenuItems(skill, { navigate, onDeleted }) {
  return [
    { key: "open", icon: <PenLine className="w-4 h-4"/>, label: "Mở trình soạn thảo",
      onClick: () => navigate(LINK.SKILL_DETAIL.format(skill.id)) },
    { key: "export", icon: <Download className="w-4 h-4"/>, label: "Tải zip", onClick: () => downloadSkill(skill) },
    { type: "divider" },
    { key: "delete", icon: <Trash2 className="w-4 h-4"/>, label: "Xóa", danger: true,
      onClick: () => confirmDeleteSkill(skill, onDeleted) },
  ];
}
