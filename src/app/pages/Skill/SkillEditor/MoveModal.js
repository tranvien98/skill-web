import React, { useEffect, useState } from "react";
import { Alert, Input, Modal } from "antd";
import { PenLine } from "lucide-react";
import { SKILL } from "@constant";
import { extOf } from "@src/helper/utils";
import { isEditablePath } from "../utils";

/** Đổi tên / di chuyển: nhập đường dẫn mới đầy đủ trong skill */
export default function MoveModal({ entry, onSubmit, onClose }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setValue(entry?.path || "");
  }, [entry]);

  if (!entry) return null;

  const to = value.trim().replace(/^\/+|\/+$/g, "");
  let error = null;
  if (!to || to === entry.path) error = " ";
  else if (to === SKILL.SKILL_MD) error = "Không được dùng tên SKILL.md";
  else if (entry.type === "dir" && to.startsWith(entry.path + "/")) error = "Không thể chuyển thư mục vào bên trong chính nó";
  else if (entry.type === "file" && isEditablePath(entry.path) && !isEditablePath(to)) {
    error = `File sửa được chỉ được đổi sang đuôi ${SKILL.EDITABLE_EXTS.join(" ")}`;
  } else if (entry.type === "file" && !isEditablePath(entry.path) && extOf(to) !== extOf(entry.path)) {
    error = "Không được đổi đuôi của file chỉ xem";
  }

  const submit = async () => {
    setLoading(true);
    try {
      await onSubmit(to);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open
      onCancel={onClose}
      onOk={submit}
      okText="Lưu"
      cancelText="Hủy"
      okButtonProps={{ disabled: Boolean(error), loading }}
      title={<span className="flex items-center gap-2"><PenLine className="w-5 h-5 text-primary"/>
        Đổi tên / di chuyển {entry.type === "dir" ? "thư mục" : "file"}</span>}
    >
      <div className="text-xs text-muted-foreground mb-1">Đường dẫn mới (tính từ gốc skill)</div>
      <Input value={value} onChange={(e) => setValue(e.target.value)} onPressEnter={() => !error && submit()}
             className="font-mono" autoFocus/>
      {error && error.trim() && <Alert className="mt-3" type="error" showIcon message={error}/>}
      {entry.type === "dir" && (
        <Alert className="mt-3" type="info" showIcon
               message="Mọi file bên trong được di chuyển theo. Nếu có người vừa thêm file vào thư mục này, thao tác sẽ bị từ chối để không di chuyển nhầm."/>
      )}
    </Modal>
  );
}
