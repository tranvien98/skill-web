import React, { useEffect, useState } from "react";
import { Alert, Button } from "antd";
import { ArrowRight } from "lucide-react";
import { getSkill } from "@services/Skills";
import { formatBytes, formatTime } from "@src/helper/utils";

function Column({ title, rows, highlight }) {
  return (
    <div className={`flex-1 rounded-xl border border-solid p-4 ${highlight ? "border-primary-300 bg-primary-50" : "border-border bg-white"}`}>
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{title}</div>
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between text-sm py-0.5">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">{value}</span>
        </div>
      ))}
    </div>
  );
}

/** status = duplicate: so sánh skill hiện có với gói mới, hỏi ghi đè */
export default function DuplicateCompare({ upload, conflictNotice, busy, onOverwrite, onCancel }) {
  const [target, setTarget] = useState(null);

  useEffect(() => {
    if (upload.target_skill_id) {
      getSkill(upload.target_skill_id).then(setTarget).catch(() => setTarget(null));
    }
  }, [upload.target_skill_id, upload.target_revision]);

  return (
    <div className="flex flex-col gap-4">
      <Alert
        type="warning"
        showIcon
        message={<>Bạn đã có skill <b className="font-mono">{upload.skill_name}</b></>}
        description={`Gói mới đã quét xong và đang chờ bạn quyết định. Ghi đè sẽ thay toàn bộ file của skill hiện có; giữ nguyên ID nên agent đang dùng skill không bị mất liên kết. Hết hạn lúc ${formatTime(upload.expires_at)}.`}
      />
      {conflictNotice && <Alert type="error" showIcon message={conflictNotice}/>}

      <div className="flex items-stretch gap-3">
        <Column
          title="Đang có"
          rows={[
            ["Revision", upload.target_revision],
            ["Sửa lần cuối", formatTime(upload.target_updated_at)],
            ["Số file", target ? target.file_count : "…"],
            ["Dung lượng", target ? formatBytes(target.total_size) : "…"],
          ]}
        />
        <div className="flex items-center"><ArrowRight className="w-5 h-5 text-muted-foreground"/></div>
        <Column
          title="Gói mới"
          highlight
          rows={[
            ["Revision", `${upload.target_revision + 1} (sau khi ghi đè)`],
            ["Upload lúc", formatTime(upload.created_at)],
            ["Số file", upload.new_file_count],
            ["Dung lượng", formatBytes(upload.new_total_size)],
          ]}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button onClick={onCancel} disabled={busy}>Hủy upload</Button>
        <Button type="primary" danger loading={busy} onClick={onOverwrite}>Ghi đè skill</Button>
      </div>
    </div>
  );
}
