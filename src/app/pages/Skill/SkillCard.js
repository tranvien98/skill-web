import React from "react";
import { Dropdown, Switch, Tooltip } from "antd";
import { CircleCheck, Clock, EllipsisVertical, Files, HardDrive, Puzzle, ShieldCheck, TriangleAlert } from "lucide-react";
import { cn, formatBytes, formatTime } from "@src/helper/utils";
import { GRADIENT_ICON } from "./utils";

/** Card theo kiểu card Agent ở trang /bots */
export default function SkillCard({ skill, menuItems, onOpen, onToggleStatus, toggling }) {
  const active = skill.status === "active";
  return (
    <div
      onClick={onOpen}
      className={cn(
        "group relative bg-card rounded-xl border border-solid border-border p-5 cursor-pointer h-full flex flex-col",
        "transition-all duration-300 ease-out hover:shadow-lg hover:border-primary-300",
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[15px] truncate font-mono">{skill.name}</span>
            {active && <CircleCheck className="w-4 h-4 text-primary flex-none"/>}
          </div>
          <div className="text-[13px] text-muted-foreground mt-1 line-clamp-2 min-h-[38px]">{skill.description}</div>
        </div>
        <div className={cn(GRADIENT_ICON, active ? "from-indigo-500 to-violet-600" : "from-slate-300 to-slate-400")}>
          <Puzzle className="w-6 h-6 text-white"/>
        </div>
      </div>

      <div className="border-0 border-t border-solid border-border pt-3 mt-auto">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Files className="w-3.5 h-3.5"/>{skill.file_count} file</span>
          <span className="flex items-center gap-1"><HardDrive className="w-3.5 h-3.5"/>{formatBytes(skill.total_size)}</span>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-primary"/>{formatTime(skill.updated_at)}</span>
        </div>
        <div className="flex items-center justify-between mt-3">
          {skill.warning_count > 0 ? (
            <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">
              <TriangleAlert className="w-3.5 h-3.5"/>{skill.warning_count} cảnh báo
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <ShieldCheck className="w-3.5 h-3.5"/>Không có cảnh báo
            </span>
          )}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Tooltip title={active ? "Đang bật" : "Đã tắt"}>
              <Switch size="small" checked={active} loading={toggling} onChange={onToggleStatus}/>
            </Tooltip>
            <Dropdown trigger={["click"]} menu={{ items: menuItems }} placement="bottomRight">
              <button className="w-8 h-8 rounded-lg border-0 bg-transparent hover:bg-gray-100 flex items-center justify-center cursor-pointer">
                <EllipsisVertical className="w-4 h-4"/>
              </button>
            </Dropdown>
          </div>
        </div>
      </div>
    </div>
  );
}
