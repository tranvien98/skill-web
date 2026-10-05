import React, { useEffect, useRef, useState } from "react";
import { Alert, Button } from "antd";
import { LoaderCircle } from "lucide-react";

const SLOW_AFTER_S = 120;

export function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  return m ? `${m} phút ${s % 60} giây` : `${s} giây`;
}

/**
 * Upload đang pending / scanning: hiện thời gian đã chờ (server tính elapsed_seconds, client đếm tiếp
 * giữa hai lần poll), gợi ý khi chờ lâu và cho hủy khi còn pending.
 */
export default function WaitingPanel({ upload, busy, onCancel }) {
  const polledAt = useRef(Date.now());
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    polledAt.current = Date.now();
  }, [upload]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const elapsed = (upload.elapsed_seconds || 0) + (now - polledAt.current) / 1000;
  const pending = upload.status === "pending";
  const slow = elapsed >= SLOW_AFTER_S;

  return (
    <div className="flex flex-col gap-3 py-2">
      <div className="flex flex-col items-center text-sm text-muted-foreground">
        <LoaderCircle className="w-6 h-6 text-primary animate-spin mb-2"/>
        <div className="text-foreground">
          {pending ? "Đang chờ worker nhận việc…" : "Đang giải nén và quét an ninh trong sandbox…"}
        </div>
        <div className="text-xs mt-1">Đã chờ {formatDuration(elapsed)} · có thể đóng cửa sổ này, sẽ có thông báo khi xong</div>
      </div>

      {slow && (
        <Alert
          type="warning"
          showIcon
          message={pending ? "Hệ thống quét đang bận" : "Quét lâu hơn bình thường"}
          description={pending
            ? "Upload đang xếp hàng chờ sandbox. Nếu chờ quá 30 phút, upload sẽ tự hủy và trả lại lượt upload để bạn thử lại sau."
            : "Gói lớn hoặc sandbox đang chậm. Nếu một lần quét quá 2 phút, hệ thống tự thử lại (tối đa 3 lần)."}
        />
      )}

      {pending && upload.cancellable !== false && (
        <div className="flex justify-center">
          <Button onClick={onCancel} loading={busy}>Hủy upload</Button>
        </div>
      )}
    </div>
  );
}
