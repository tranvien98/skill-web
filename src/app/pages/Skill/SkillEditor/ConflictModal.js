import React, { useState } from "react";
import { Button, Modal } from "antd";
import { DiffEditor } from "@monaco-editor/react";
import { GitCompare } from "lucide-react";

/**
 * 409 file_changed: file đã bị sửa ở nơi khác sau khi bạn mở.
 * Tải lại (bỏ thay đổi) · So sánh (DiffEditor) · Ghi đè (lưu với sha256 hiện tại).
 */
export default function ConflictModal({ conflict, language, onReload, onOverwrite, onClose, loadServerContent }) {
  const [diff, setDiff] = useState(null);
  const [loadingDiff, setLoadingDiff] = useState(false);

  if (!conflict) return null;

  const compare = async () => {
    setLoadingDiff(true);
    try {
      setDiff(await loadServerContent());
    } finally {
      setLoadingDiff(false);
    }
  };

  const close = () => {
    setDiff(null);
    onClose();
  };

  return (
    <Modal
      open
      onCancel={close}
      width={diff !== null ? 1100 : 520}
      title={<span className="flex items-center gap-2"><GitCompare className="w-5 h-5 text-amber-500"/>File đã bị thay đổi</span>}
      footer={[
        <Button key="reload" onClick={() => { setDiff(null); onReload(); }}>Tải lại bản mới (bỏ thay đổi của tôi)</Button>,
        diff === null && <Button key="compare" loading={loadingDiff} onClick={compare}>So sánh</Button>,
        <Button key="overwrite" type="primary" danger onClick={() => { setDiff(null); onOverwrite(); }}>Ghi đè bằng bản của tôi</Button>,
      ].filter(Boolean)}
    >
      <p>
        <code>{conflict.path}</code> đã được sửa ở tab hoặc thiết bị khác sau khi bạn mở.
        Chọn cách xử lý để không làm mất thay đổi của ai.
      </p>
      {diff !== null && (
        <>
          <div className="flex text-xs text-muted-foreground mb-1">
            <span className="flex-1">Bản đang lưu trên hệ thống</span>
            <span className="flex-1">Bản của bạn</span>
          </div>
          <div className="border border-solid border-border rounded-lg overflow-hidden">
            <DiffEditor
              height="60vh"
              language={language}
              original={diff}
              modified={conflict.localContent}
              originalModelPath={`conflict-server/${conflict.path}`}
              modifiedModelPath={`conflict-local/${conflict.path}`}
              // Tránh lỗi "TextModel got disposed before DiffEditorWidget model got reset" khi đóng modal
              keepCurrentOriginalModel
              keepCurrentModifiedModel
              options={{ readOnly: true, renderSideBySide: true, minimap: { enabled: false }, fontSize: 13 }}
            />
          </div>
        </>
      )}
    </Modal>
  );
}
