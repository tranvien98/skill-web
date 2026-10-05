import React from "react";
import { Progress } from "antd";
import { HardDrive, Puzzle, UploadCloud } from "lucide-react";
import { formatBytes } from "@src/helper/utils";

function Item({ icon, label, value, percent }) {
  return (
    <div className="flex items-center gap-3 min-w-[200px] flex-1">
      <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-none">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          <span className="text-foreground font-medium">{value}</span>
        </div>
        <Progress percent={percent} showInfo={false} size="small" strokeColor={percent > 90 ? "#dc2626" : "#16a286"}/>
      </div>
    </div>
  );
}

export default function QuotaBar({ quota }) {
  if (!quota) return null;
  const pct = (a, b) => (b ? Math.min(100, Math.round((a / b) * 100)) : 0);
  return (
    <div className="bg-card rounded-xl border border-solid border-border px-5 py-3 flex flex-wrap gap-x-8 gap-y-2">
      <Item
        icon={<HardDrive className="w-4 h-4 text-primary"/>}
        label="Dung lượng"
        value={`${formatBytes(quota.used_bytes)} / ${formatBytes(quota.max_bytes)}`}
        percent={pct(quota.used_bytes, quota.max_bytes)}
      />
      <Item
        icon={<Puzzle className="w-4 h-4 text-primary"/>}
        label="Số skill"
        value={`${quota.skill_count} / ${quota.max_skills}`}
        percent={pct(quota.skill_count, quota.max_skills)}
      />
      <Item
        icon={<UploadCloud className="w-4 h-4 text-primary"/>}
        label="Upload đang xử lý"
        value={`${quota.active_uploads} / ${quota.max_active_uploads}`}
        percent={pct(quota.active_uploads, quota.max_active_uploads)}
      />
    </div>
  );
}
