import React, { useEffect, useState } from "react";
import { Descriptions, Empty, Spin, Tag } from "antd";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import { LINK } from "@link";
import { getTree } from "@services/Skills";
import { apiError } from "@src/setup/axios";
import FindingsTable from "../FindingsTable";
import { SEVERITY } from "../utils";

function Card({ title, children, extra }) {
  return (
    <div className="bg-card rounded-xl border border-solid border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">{title}</div>
        {extra}
      </div>
      {children}
    </div>
  );
}

export default function InfoTab({ skill }) {
  const [tree, setTree] = useState(null);

  useEffect(() => {
    getTree(skill.id).then(setTree).catch((error) => toast.error(apiError(error).message));
  }, [skill.id, skill.revision]);

  const fm = skill.frontmatter || {};
  const findings = (tree?.items || []).flatMap((item) => (item.warnings || []).map((w) => ({ ...w, path: item.path })));
  const counts = findings.reduce((acc, f) => ({ ...acc, [f.severity]: (acc[f.severity] || 0) + 1 }), {});
  const extraKeys = Object.keys(fm).filter((k) => !["name", "description", "license", "compatibility", "metadata", "allowed-tools"].includes(k));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <Card title="Frontmatter (SKILL.md)">
        <Descriptions column={1} size="small" bordered styles={{ label: { width: 150 } }}>
          <Descriptions.Item label="name"><span className="font-mono">{fm.name}</span></Descriptions.Item>
          <Descriptions.Item label="description"><span className="whitespace-pre-wrap">{fm.description}</span></Descriptions.Item>
          <Descriptions.Item label="license">{fm.license || "—"}</Descriptions.Item>
          <Descriptions.Item label="compatibility">{fm.compatibility || "—"}</Descriptions.Item>
          <Descriptions.Item label="allowed-tools"><span className="font-mono">{fm["allowed-tools"] || "—"}</span></Descriptions.Item>
          <Descriptions.Item label="metadata">
            {fm.metadata && Object.keys(fm.metadata).length
              ? Object.entries(fm.metadata).map(([k, v]) => <Tag key={k} className="font-mono">{k}: {v}</Tag>)
              : "—"}
          </Descriptions.Item>
          {extraKeys.map((k) => (
            <Descriptions.Item key={k} label={k}><span className="text-muted-foreground">{JSON.stringify(fm[k])} (ngoài chuẩn)</span></Descriptions.Item>
          ))}
        </Descriptions>
        <div className="text-xs text-muted-foreground mt-3">Sửa các trường này trực tiếp trong SKILL.md ở tab Trình soạn thảo.</div>
      </Card>

      <Card
        title="Kết quả quét gần nhất"
        extra={skill.last_upload_id && (
          <Link to={`${LINK.SKILL_UPLOADS}?upload_id=${skill.last_upload_id}`} className="text-sm">Xem lần upload gần nhất</Link>
        )}
      >
        {!tree ? <Spin/> : (
          <>
            <div className="flex gap-2 mb-3">
              {["CRITICAL", "HIGH", "MEDIUM", "INFO"].map((s) => (
                <Tag key={s} color={counts[s] ? SEVERITY[s].color : "default"}>{s}: {counts[s] || 0}</Tag>
              ))}
            </div>
            {findings.length
              ? <FindingsTable findings={findings} maxHeight={360}/>
              : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có cảnh báo"/>}
            <div className="text-xs text-muted-foreground mt-3">
              Mức CRITICAL / HIGH bị chặn ngay khi upload hoặc lưu, nên ở đây chỉ còn cảnh báo MEDIUM / INFO.
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
