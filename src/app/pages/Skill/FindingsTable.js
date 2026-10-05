import React from "react";
import { Table, Tag } from "antd";
import { SEVERITY } from "./utils";

/** Bảng findings của scanner: mức độ · vị trí · mô tả */
export default function FindingsTable({ findings = [], onClickRow, size = "small", maxHeight = 280 }) {
  const columns = [
    {
      title: "Mức độ",
      dataIndex: "severity",
      width: 110,
      render: (severity) => <Tag color={SEVERITY[severity]?.color} className="font-semibold">{severity}</Tag>,
    },
    {
      title: "Vị trí",
      dataIndex: "path",
      width: 220,
      render: (path, row) => (
        <span className="font-mono text-xs break-all">
          {path || "(cả gói)"}{row.line ? `:${row.line}` : ""}
        </span>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "message",
      render: (message, row) => (
        <div>
          <div>{message}</div>
          <div className="text-xs text-muted-foreground font-mono">{row.rule_id}</div>
        </div>
      ),
    },
  ];
  return (
    <Table
      size={size}
      rowKey="_key"
      columns={columns}
      dataSource={findings.map((f, index) => ({ ...f, _key: `${f.rule_id}-${f.path}-${f.line}-${index}` }))}
      pagination={false}
      scroll={{ y: maxHeight }}
      onRow={(row) => ({ onClick: () => onClickRow?.(row), className: onClickRow ? "cursor-pointer" : "" })}
    />
  );
}
