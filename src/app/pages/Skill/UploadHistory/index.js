import React, { useCallback, useEffect, useState } from "react";
import { Button, Modal, Segmented, Table, Tag, Tooltip } from "antd";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, Eye, LoaderCircle, TriangleAlert } from "lucide-react";

import { LINK } from "@link";
import { UPLOAD_RUNNING } from "@constant";
import { cancelUpload, getUploads, overwriteUpload } from "@services/Skills";
import { apiError } from "@src/setup/axios";
import { formatBytes, formatTime } from "@src/helper/utils";
import { UPLOAD_STATUS } from "../utils";
import UploadDetailDrawer from "./UploadDetailDrawer";
import { formatDuration } from "../UploadSkillModal/WaitingPanel";

const FILTERS = [
  { value: "", label: "Tất cả" },
  { value: "scanning", label: "Đang quét" },
  { value: "passed", label: "Thành công" },
  { value: "rejected", label: "Bị từ chối" },
  { value: "duplicate", label: "Chờ ghi đè" },
  { value: "failed", label: "Lỗi" },
];
const PAGE_SIZE = 10;

export default function UploadHistory() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ uploads: [], count: 0 });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const detailId = searchParams.get("upload_id");

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setData(await getUploads({ page, limit: PAGE_SIZE, status }));
    } catch (error) {
      toast.error(apiError(error).message);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  // Còn upload đang xử lý thì tự làm mới
  useEffect(() => {
    if (!data.uploads.some((u) => UPLOAD_RUNNING.includes(u.status))) return undefined;
    const timer = setTimeout(() => load(true), 3000);
    return () => clearTimeout(timer);
  }, [data, load]);

  const openDetail = (id) => setSearchParams(id ? { upload_id: id } : {});

  const overwrite = (upload) => Modal.confirm({
    title: `Ghi đè skill ${upload.skill_name}?`,
    content: `Toàn bộ file của skill (revision ${upload.target_revision}) sẽ được thay bằng gói ${upload.file_name}.`,
    okText: "Ghi đè",
    okButtonProps: { danger: true },
    cancelText: "Hủy",
    onOk: async () => {
      setBusyId(upload.upload_id);
      try {
        await overwriteUpload(upload.upload_id, upload.target_revision);
        toast.success(`Đã ghi đè skill ${upload.skill_name}`);
      } catch (error) {
        const err = apiError(error);
        toast.error(err.code === "revision_changed"
          ? "Skill vừa được sửa sau khi bạn xem. Đã tải lại, hãy kiểm tra rồi ghi đè lại."
          : err.message);
      } finally {
        setBusyId(null);
        load(true);
      }
    },
  });

  const cancel = async (upload) => {
    setBusyId(upload.upload_id);
    try {
      await cancelUpload(upload.upload_id);
    } catch (error) {
      toast.error(apiError(error).message);
    } finally {
      setBusyId(null);
      load(true);
    }
  };

  const columns = [
    {
      title: "File",
      dataIndex: "file_name",
      render: (name, u) => (
        <div>
          <div className="font-medium font-mono">{name}</div>
          <div className="text-xs text-muted-foreground">{formatBytes(u.size)}{u.overwrite ? " · ghi đè nếu trùng" : ""}</div>
        </div>
      ),
    },
    {
      title: "Skill",
      dataIndex: "skill_name",
      render: (name, u) => (u.skill_id
        ? <Link to={LINK.SKILL_DETAIL.format(u.skill_id)} className="font-mono">{name}</Link>
        : <span className="font-mono text-muted-foreground">{name || "—"}</span>),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 150,
      render: (s, u) => (
        <div>
          <Tag color={UPLOAD_STATUS[s]?.color} icon={UPLOAD_RUNNING.includes(s) ? <LoaderCircle className="w-3 h-3 animate-spin inline mr-1"/> : null}>
            {UPLOAD_STATUS[s]?.label || s}
          </Tag>
          {UPLOAD_RUNNING.includes(s) && u.elapsed_seconds != null && (
            <div className={`text-xs mt-1 ${u.elapsed_seconds >= 120 ? "text-amber-600" : "text-muted-foreground"}`}>
              đã chờ {formatDuration(u.elapsed_seconds)}
            </div>
          )}
          {s === "failed" && u.error && <div className="text-xs mt-1 text-muted-foreground line-clamp-2 max-w-[220px]">{u.error}</div>}
        </div>
      ),
    },
    {
      title: "Cảnh báo",
      dataIndex: "warning_count",
      width: 100,
      align: "center",
      render: (count) => (count
        ? <span className="inline-flex items-center gap-1 text-amber-600"><TriangleAlert className="w-3.5 h-3.5"/>{count}</span>
        : <span className="text-muted-foreground">—</span>),
    },
    { title: "Thời gian", dataIndex: "created_at", width: 150, render: formatTime },
    {
      title: "Hành động",
      width: 210,
      render: (_, u) => (
        <div className="flex gap-2">
          <Tooltip title="Xem chi tiết">
            <button onClick={() => openDetail(u.upload_id)}
                    className="w-8 h-8 border-none rounded-lg flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-600 cursor-pointer">
              <Eye className="w-4 h-4"/>
            </button>
          </Tooltip>
          {u.status === "duplicate" && (
            <Button size="small" danger loading={busyId === u.upload_id} onClick={() => overwrite(u)}>Ghi đè</Button>
          )}
          {u.cancellable && (
            <Button size="small" disabled={busyId === u.upload_id} onClick={() => cancel(u)}>Hủy</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(LINK.SKILL)}
                className="cursor-pointer rounded-lg bg-transparent border-0 hover:bg-gray-100 flex items-center justify-center w-10 h-10">
          <ArrowLeft className="w-5 h-5"/>
        </button>
        <div className="text-2xl font-bold">Lịch sử upload</div>
      </div>

      <Segmented options={FILTERS} value={status} onChange={(v) => { setPage(1); setStatus(v); }} className="self-start"/>

      <div className="bg-card rounded-xl border border-solid border-border overflow-hidden">
        <Table
          rowKey="upload_id"
          columns={columns}
          dataSource={data.uploads}
          loading={loading}
          pagination={{ current: page, pageSize: PAGE_SIZE, total: data.count, onChange: setPage, showSizeChanger: false }}
        />
      </div>

      <UploadDetailDrawer uploadId={detailId} onClose={() => openDetail(null)}/>
    </div>
  );
}
