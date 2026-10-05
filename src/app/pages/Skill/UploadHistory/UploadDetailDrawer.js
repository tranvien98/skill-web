import React, { useEffect, useState } from "react";
import { Alert, Descriptions, Drawer, Spin, Tag } from "antd";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import { LINK } from "@link";
import { UPLOAD_RUNNING } from "@constant";
import { getUpload } from "@services/Skills";
import { apiError } from "@src/setup/axios";
import { formatBytes, formatTime } from "@src/helper/utils";
import FindingsTable from "../FindingsTable";
import { UPLOAD_STATUS } from "../utils";

export default function UploadDetailDrawer({ uploadId, onClose }) {
  const [upload, setUpload] = useState(null);

  useEffect(() => {
    if (!uploadId) return undefined;
    let timer;
    let alive = true;
    const load = async () => {
      try {
        const data = await getUpload(uploadId);
        if (!alive) return;
        setUpload(data);
        if (UPLOAD_RUNNING.includes(data.status)) timer = setTimeout(load, 2000);
      } catch (error) {
        toast.error(apiError(error).message);
      }
    };
    setUpload(null);
    load();
    return () => { alive = false; clearTimeout(timer); };
  }, [uploadId]);

  const meta = upload && UPLOAD_STATUS[upload.status];
  return (
    <Drawer open={Boolean(uploadId)} onClose={onClose} width={680} title="Chi tiết upload" destroyOnHidden>
      {!upload ? <Spin/> : (
        <div className="flex flex-col gap-4">
          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="File" span={2}><span className="font-mono">{upload.file_name}</span></Descriptions.Item>
            <Descriptions.Item label="Trạng thái"><Tag color={meta?.color}>{meta?.label || upload.status}</Tag></Descriptions.Item>
            <Descriptions.Item label="Dung lượng">{formatBytes(upload.size)}</Descriptions.Item>
            <Descriptions.Item label="Skill">
              {upload.skill_id
                ? <Link to={LINK.SKILL_DETAIL.format(upload.skill_id)} className="font-mono">{upload.skill_name}</Link>
                : <span className="font-mono">{upload.skill_name || "—"}</span>}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi đè">{upload.overwrite ? "Có" : "Không"}</Descriptions.Item>
            <Descriptions.Item label="Upload lúc">{formatTime(upload.created_at)}</Descriptions.Item>
            <Descriptions.Item label="Xong lúc">{formatTime(upload.finished_at)}</Descriptions.Item>
            <Descriptions.Item label="Số lần quét">{upload.attempts}</Descriptions.Item>
            {upload.status === "duplicate" && (
              <Descriptions.Item label="Hết hạn">{formatTime(upload.expires_at)}</Descriptions.Item>
            )}
          </Descriptions>
          {upload.error && <Alert type="warning" showIcon message="Lỗi hệ thống" description={upload.error}/>}
          {upload.status === "duplicate" && (
            <Alert type="info" showIcon message={`Trùng skill ${upload.skill_name} (revision ${upload.target_revision}). Dùng nút "Ghi đè" hoặc "Hủy" ở bảng.`}/>
          )}
          <div>
            <div className="font-medium mb-2">Kết quả quét ({upload.findings?.length || 0})</div>
            {upload.findings?.length
              ? <FindingsTable findings={upload.findings} maxHeight={480}/>
              : <div className="text-muted-foreground text-sm">Không có vấn đề nào</div>}
          </div>
        </div>
      )}
    </Drawer>
  );
}
