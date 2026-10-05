import React, { useEffect, useRef, useState } from "react";
import { Alert, Button, Checkbox, Modal, Progress, Result, Steps } from "antd";
import { useDropzone } from "react-dropzone";
import { toast } from "react-toastify";
import { FileArchive, FolderTree, UploadCloud } from "lucide-react";

import { SKILL, UPLOAD_RUNNING } from "@constant";
import { cancelUpload, getUpload, overwriteUpload, uploadSkillZip } from "@services/Skills";
import { apiError } from "@src/setup/axios";
import { formatBytes } from "@src/helper/utils";
import FindingsTable from "../FindingsTable";
import DuplicateCompare from "./DuplicateCompare";
import WaitingPanel from "./WaitingPanel";

const STEP_OF = { uploading: 0, pending: 1, scanning: 2 };

function StructureHint() {
  return (
    <pre className="text-xs bg-gray-50 rounded-lg p-3 m-0 text-muted-foreground leading-5">
{`my-skill/            ← tên thư mục = name
├── SKILL.md         ← bắt buộc, có frontmatter name + description
├── scripts/         ← tùy chọn
├── references/
└── assets/`}
    </pre>
  );
}

/** Upload zip -> theo dõi trạng thái quét (poll 2s) -> kết quả. */
export default function UploadSkillModal({ open, onClose, onOpenSkill }) {
  const [file, setFile] = useState(null);
  const [overwrite, setOverwrite] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [phase, setPhase] = useState("select");          // select | uploading | tracking
  const [progress, setProgress] = useState(0);
  const [upload, setUpload] = useState(null);
  const [busy, setBusy] = useState(false);
  const [conflictNotice, setConflictNotice] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (open) {
      setFile(null);
      setFileError(null);
      setOverwrite(false);
      setPhase("select");
      setProgress(0);
      setUpload(null);
      setConflictNotice(null);
    }
    return () => clearTimeout(pollRef.current);
  }, [open]);

  // Poll trạng thái tới khi không còn pending / scanning / applying
  useEffect(() => {
    if (phase !== "tracking" || !upload || !UPLOAD_RUNNING.includes(upload.status)) return undefined;
    pollRef.current = setTimeout(async () => {
      try {
        setUpload(await getUpload(upload.upload_id));
      } catch (error) {
        toast.error(apiError(error).message);
      }
    }, SKILL.POLL_INTERVAL_MS);
    return () => clearTimeout(pollRef.current);
  }, [phase, upload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    maxSize: SKILL.MAX_ZIP_SIZE,
    // react-dropzone v11 (cùng bản owlla_frontend) nhận accept dạng chuỗi
    accept: ".zip,application/zip,application/x-zip-compressed",
    onDropAccepted: ([accepted]) => { setFile(accepted); setFileError(null); },
    onDropRejected: ([rejection]) => {
      setFile(null);
      const code = rejection?.errors?.[0]?.code;
      setFileError(code === "file-too-large" ? "File lớn hơn 50 MB" : "Chỉ nhận file .zip");
    },
  });

  const start = async () => {
    setPhase("uploading");
    setProgress(0);
    try {
      const res = await uploadSkillZip(file, overwrite, setProgress);
      setUpload({ upload_id: res.upload_id, status: res.status, file_name: file.name, findings: [] });
      setPhase("tracking");
    } catch (error) {
      const err = apiError(error);
      setPhase("select");
      setFileError(err.status === 413 ? "File lớn hơn 50 MB" : err.message);
    }
  };

  const doOverwrite = async () => {
    setBusy(true);
    setConflictNotice(null);
    try {
      await overwriteUpload(upload.upload_id, upload.target_revision);
      setUpload(await getUpload(upload.upload_id));
    } catch (error) {
      const err = apiError(error);
      const fresh = await getUpload(upload.upload_id).catch(() => null);
      if (fresh) setUpload(fresh);
      if (err.code === "revision_changed") {
        setConflictNotice(`Skill vừa được sửa (revision ${fresh?.target_revision ?? "mới"}). Xem lại rồi bấm "Ghi đè skill" lần nữa để xác nhận.`);
      } else if (err.status === 410) {
        setConflictNotice("Upload đã hết hạn chờ ghi đè, hãy upload lại.");
      } else {
        setConflictNotice(err.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const doCancel = async () => {
    setBusy(true);
    try {
      await cancelUpload(upload.upload_id);
      setUpload(await getUpload(upload.upload_id));
    } catch (error) {
      // Worker có thể vừa nhận việc: không hủy được nữa, tải lại trạng thái để theo dõi tiếp
      toast.error(apiError(error).message);
      const fresh = await getUpload(upload.upload_id).catch(() => null);
      if (fresh) setUpload(fresh);
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    if (phase === "tracking" && UPLOAD_RUNNING.includes(upload?.status)) {
      toast.info("Upload vẫn được xử lý tiếp, xem kết quả ở Lịch sử upload");
    }
    onClose();
  };

  const status = phase === "uploading" ? "uploading" : upload?.status;
  const running = phase === "uploading" || UPLOAD_RUNNING.includes(status);
  // Hủy / hết hạn khi chưa quét (chưa có started_at) thì dừng ở bước "Chờ quét"
  const stoppedEarly = ["cancelled", "expired", "failed"].includes(status) && !upload?.started_at;
  const stepIndex = stoppedEarly ? 1 : (STEP_OF[status] ?? 3);
  const stepStatus = ["rejected", "failed", "cancelled", "expired"].includes(status) ? "error" : running ? "process" : "finish";

  return (
    <Modal
      open={open}
      onCancel={close}
      width={760}
      footer={null}
      destroyOnHidden
      maskClosable={!running}
      title={<span className="flex items-center gap-2"><UploadCloud className="w-5 h-5 text-primary"/>Upload skill</span>}
    >
      {phase === "select" ? (
        <div className="flex flex-col gap-4 mt-4">
          <div
            {...getRootProps()}
            className={`rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary-50" : "border-border hover:border-primary-300 bg-gray-50/50"}`}
          >
            <input {...getInputProps()}/>
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileArchive className="w-10 h-10 text-primary"/>
                <div className="text-left">
                  <div className="font-medium">{file.name}</div>
                  <div className="text-xs text-muted-foreground">{formatBytes(file.size)} · bấm để chọn file khác</div>
                </div>
              </div>
            ) : (
              <>
                <UploadCloud className="w-10 h-10 text-primary mx-auto"/>
                <div className="font-medium mt-2">Kéo thả file .zip vào đây hoặc bấm để chọn</div>
                <div className="text-xs text-muted-foreground mt-1">Tối đa 50 MB · được giải nén và quét an ninh trong sandbox</div>
              </>
            )}
          </div>
          {fileError && <Alert type="error" showIcon message={fileError}/>}
          <div className="flex gap-4 items-start">
            <div className="flex-1">
              <div className="flex items-center gap-1 text-sm font-medium mb-2"><FolderTree className="w-4 h-4"/>Cấu trúc gói</div>
              <StructureHint/>
            </div>
            <div className="flex-1 text-sm text-muted-foreground leading-6">
              <div>• Chỉ sửa được trên hệ thống: <code>.txt .md .js .py .ts</code></div>
              <div>• Ảnh, pdf, json, yaml… được giữ để xem</div>
              <div>• File thực thi, zip lồng, symlink sẽ bị từ chối</div>
              <Checkbox className="mt-3" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)}>
                Ghi đè luôn nếu đã có skill cùng tên
              </Checkbox>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button onClick={close}>Hủy</Button>
            <Button type="primary" disabled={!file} onClick={start}>Upload</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5 mt-4">
          <Steps
            size="small"
            current={stepIndex}
            status={stepStatus}
            items={[{ title: "Tải lên" }, { title: "Chờ quét" }, { title: "Quét trong sandbox" }, { title: "Kết quả" }]}
          />

          {phase === "uploading" && <Progress percent={progress} status="active"/>}
          {running && phase !== "uploading" && (
            <WaitingPanel upload={upload} busy={busy} onCancel={doCancel}/>
          )}

          {status === "passed" && (
            <Result
              className="!p-0"
              status="success"
              title={<>Skill <span className="font-mono">{upload.skill_name}</span> đã sẵn sàng</>}
              subTitle={upload.warning_count ? `${upload.warning_count} cảnh báo (không chặn), xem bên dưới` : "Không có cảnh báo"}
              extra={[
                <Button key="close" onClick={close}>Đóng</Button>,
                <Button key="open" type="primary" onClick={() => onOpenSkill(upload.skill_id)}>Mở skill</Button>,
              ]}
            >
              {upload.findings?.length > 0 && <FindingsTable findings={upload.findings}/>}
            </Result>
          )}

          {status === "rejected" && (
            <Result
              className="!p-0"
              status="error"
              title="Gói skill bị từ chối"
              subTitle="Sửa các lỗi mức CRITICAL / HIGH rồi upload lại"
              extra={<Button type="primary" onClick={() => setPhase("select")}>Chọn file khác</Button>}
            >
              <FindingsTable findings={upload.findings}/>
            </Result>
          )}

          {status === "failed" && (
            <Result
              className="!p-0"
              status="warning"
              title="Không quét được gói skill"
              subTitle={upload.error || "Lỗi hệ thống khi quét, hãy thử lại"}
              extra={<Button type="primary" onClick={() => setPhase("select")}>Thử lại</Button>}
            />
          )}

          {status === "duplicate" && (
            <DuplicateCompare upload={upload} busy={busy} conflictNotice={conflictNotice}
                              onOverwrite={doOverwrite} onCancel={doCancel}/>
          )}

          {["cancelled", "expired"].includes(status) && (
            <Result className="!p-0" status="info"
                    title={status === "cancelled" ? "Đã hủy upload" : "Upload đã hết hạn chờ ghi đè"}
                    extra={<Button onClick={close}>Đóng</Button>}/>
          )}
        </div>
      )}
    </Modal>
  );
}
