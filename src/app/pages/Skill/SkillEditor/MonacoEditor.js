import React, { useEffect, useState } from "react";
import { Button, Spin } from "antd";
import Editor from "@monaco-editor/react";

export default function MonacoEditor({ onStatusChange, onMount, ...props }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(false);
    setSlow(false);
    onStatusChange("loading");
    const timer = setTimeout(() => { if (!cancelled) setSlow(true); }, 12000);
    import("@src/setup/monaco").then(() => {
      if (!cancelled) setReady(true);
    }).catch(() => {
      if (!cancelled) { setError(true); onStatusChange("error"); }
    }).finally(() => clearTimeout(timer));
    return () => { cancelled = true; clearTimeout(timer); };
  }, [attempt, onStatusChange]);

  const loading = <div role="status" className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
    <Spin/><span>Đang tải trình soạn thảo…</span>
    {slow && <span>Việc tải đang lâu hơn bình thường. Vui lòng kiểm tra kết nối.</span>}
  </div>;

  if (error) return <div role="alert" className="h-full flex flex-col items-center justify-center gap-3 text-sm">
    <span>Không tải được trình soạn thảo.</span>
    <Button onClick={() => setAttempt((value) => value + 1)}>Thử lại trình soạn thảo</Button>
  </div>;
  if (!ready) return <div className="h-full flex items-center justify-center">{loading}</div>;
  return <Editor {...props} loading={loading} onMount={(editor, monaco) => {
    onStatusChange("ready");
    onMount(editor, monaco);
  }}/>;
}
