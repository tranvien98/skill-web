import React from "react";
import { ChevronDown, ChevronUp, CircleX, Info, TriangleAlert } from "lucide-react";
import { cn } from "@src/helper/utils";

const ICON = {
  CRITICAL: <CircleX className="w-3.5 h-3.5 text-red-600 flex-none"/>,
  HIGH: <CircleX className="w-3.5 h-3.5 text-orange-600 flex-none"/>,
  MEDIUM: <TriangleAlert className="w-3.5 h-3.5 text-amber-500 flex-none"/>,
  INFO: <Info className="w-3.5 h-3.5 text-sky-500 flex-none"/>,
};

export function countProblems(problems) {
  const errors = problems.filter((p) => p.severity === "CRITICAL" || p.severity === "HIGH").length;
  const warnings = problems.filter((p) => p.severity === "MEDIUM").length;
  return { errors, warnings, infos: problems.length - errors - warnings };
}

export function ProblemsHeader({ problems, open, onToggle }) {
  const { errors, warnings, infos } = countProblems(problems);
  return (
    <button id="skill-problems-toggle" type="button" onClick={onToggle} aria-expanded={open} aria-controls={open ? "skill-problems" : undefined}
         aria-label={`Vấn đề: ${errors} lỗi, ${warnings} cảnh báo, ${infos} thông tin`}
         className="flex items-center gap-3 h-8 shrink-0 w-full text-left px-3 cursor-pointer select-none border-0 border-b border-solid border-border bg-[#fafbfc]">
      <span className="text-[11px] font-semibold tracking-wider text-muted-foreground">VẤN ĐỀ</span>
      <span className="flex items-center gap-1 text-xs"><CircleX className="w-3.5 h-3.5 text-red-600"/>{errors}</span>
      <span className="flex items-center gap-1 text-xs"><TriangleAlert className="w-3.5 h-3.5 text-amber-500"/>{warnings}</span>
      {infos > 0 && <span className="flex items-center gap-1 text-xs"><Info className="w-3.5 h-3.5 text-sky-500"/>{infos}</span>}
      <span className="ml-auto text-muted-foreground">{open ? <ChevronDown className="w-4 h-4"/> : <ChevronUp className="w-4 h-4"/>}</span>
    </button>
  );
}

export default function ProblemsPanel({ problems, onSelect }) {
  if (!problems.length) {
    return <div className="text-xs text-muted-foreground px-4 py-3">Không có vấn đề nào. Mỗi lần lưu, file được quét lại bằng bộ luật an ninh.</div>;
  }
  return (
    <div className="overflow-auto h-full">
      {problems.map((p, index) => (
        <button type="button"
          key={`${p.path}-${p.rule_id}-${p.line}-${index}`}
          onClick={() => onSelect(p)}
          title={`${p.message} · ${p.rule_id} · ${p.path}${p.line ? `:${p.line}` : ""}`}
          className={cn("flex items-center gap-2 w-full text-left border-0 bg-transparent px-4 min-h-7 py-1 text-xs cursor-pointer hover:bg-gray-100",
            p.blocking && "bg-red-50/60")}
        >
          {ICON[p.severity] || ICON.INFO}
          <span className="truncate">{p.message}</span>
          <span className="text-muted-foreground font-mono flex-none">{p.rule_id}</span>
          <span className="ml-auto text-muted-foreground font-mono truncate max-w-[45%]">{p.path}{p.line ? `:${p.line}` : ""}</span>
          {p.blocking && <span className="text-[10px] font-semibold text-red-600 flex-none">CHƯA LƯU</span>}
        </button>
      ))}
    </div>
  );
}
