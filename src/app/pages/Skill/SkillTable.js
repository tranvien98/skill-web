import React from "react";
import { Switch, Table, Tooltip } from "antd";
import { Pen, Puzzle, Trash2, TriangleAlert } from "lucide-react";
import { cn, formatBytes, formatTime } from "@src/helper/utils";
import { confirmDeleteSkill } from "./SkillActions";

/** Bảng theo kiểu bảng trang Kiến thức */
export default function SkillTable({ skills, loading, onOpen, onToggleStatus, togglingId, onDeleted }) {
  const columns = [
    {
      title: "Skill",
      dataIndex: "name",
      render: (name, skill) => (
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onOpen(skill)}>
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br flex-none",
            skill.status === "active" ? "from-indigo-500 to-violet-600" : "from-slate-300 to-slate-400")}>
            <Puzzle className="w-5 h-5 text-white"/>
          </div>
          <div className="min-w-0">
            <div className="font-semibold font-mono">{name}</div>
            <div className="text-xs text-muted-foreground line-clamp-1 max-w-[420px]">{skill.description}</div>
          </div>
        </div>
      ),
    },
    { title: "File", dataIndex: "file_count", width: 80, align: "center" },
    { title: "Dung lượng", dataIndex: "total_size", width: 120, align: "center", render: formatBytes },
    {
      title: "Cảnh báo",
      dataIndex: "warning_count",
      width: 100,
      align: "center",
      render: (count) => count > 0
        ? <span className="inline-flex items-center gap-1 text-amber-600"><TriangleAlert className="w-3.5 h-3.5"/>{count}</span>
        : <span className="text-muted-foreground">—</span>,
    },
    { title: "Cập nhật", dataIndex: "updated_at", width: 150, align: "center", render: formatTime },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 100,
      align: "center",
      render: (status, skill) => (
        <Switch checked={status === "active"} loading={togglingId === skill.id} onChange={(v) => onToggleStatus(skill, v)}/>
      ),
    },
    {
      title: "Hành động",
      width: 110,
      align: "center",
      render: (_, skill) => (
        <div className="flex justify-center gap-2">
          <Tooltip title="Mở trình soạn thảo">
            <button onClick={() => onOpen(skill)}
                    className="w-8 h-8 border-none rounded-lg flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-600 cursor-pointer">
              <Pen className="w-4 h-4"/>
            </button>
          </Tooltip>
          <Tooltip title="Xóa">
            <button onClick={() => confirmDeleteSkill(skill, onDeleted)}
                    className="w-8 h-8 border-none rounded-lg flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer">
              <Trash2 className="w-4 h-4"/>
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-card rounded-xl border border-solid border-border overflow-hidden">
      <Table rowKey="id" columns={columns} dataSource={skills} loading={loading} pagination={false}/>
    </div>
  );
}
