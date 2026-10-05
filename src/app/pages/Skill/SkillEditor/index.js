/**
 * Trình soạn thảo kiểu VSCode: cây file · tab · Monaco · panel Vấn đề · thanh trạng thái.
 * Mỗi lần lưu gửi kèm expected_sha256; thao tác thư mục gửi expected_revision (xem docs backend mục 4.4).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Empty, Modal, Spin, Tooltip } from "antd";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { toast } from "react-toastify";
import { ChevronRight, Download, Lock, Maximize2, Minimize2, Save, X } from "lucide-react";

import { SKILL } from "@constant";
import {
  createFile, deletePath, fileRawUrl, getFileContent, getTree, moveFile, saveFile,
} from "@services/Skills";
import { apiError } from "@src/setup/axios";
import { basename, cn, dirname, extOf } from "@src/helper/utils";
import { FileIcon, isEditablePath } from "../utils";
import FileTree from "./FileTree";
import ProblemsPanel, { ProblemsHeader } from "./ProblemsPanel";
import ConflictModal from "./ConflictModal";
import MoveModal from "./MoveModal";
import MonacoEditor from "./MonacoEditor";
import "./editor.scss";

const MARKER_SEVERITY = { CRITICAL: 8, HIGH: 8, MEDIUM: 4, INFO: 2 };
const isUnder = (path, dir) => path === dir || path.startsWith(dir + "/");

export default function SkillEditor({ skill, onSkillChanged, onDirtyChange }) {
  const [tree, setTree] = useState(null);                 // {revision, items}
  const [files, setFiles] = useState({});                 // path -> trạng thái file đã mở
  const [tabs, setTabs] = useState([]);
  const [active, setActive] = useState(null);
  const [expanded, setExpanded] = useState(new Set());
  const [selectedDir, setSelectedDir] = useState("");
  const [creating, setCreating] = useState(null);         // {parent, type}
  const [moving, setMoving] = useState(null);
  const [conflict, setConflict] = useState(null);
  const [closingTab, setClosingTab] = useState(null);
  const [problemsOpen, setProblemsOpen] = useState(true);
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const [fullscreen, setFullscreen] = useState(false);
  const [treeError, setTreeError] = useState(null);
  const [editorStatus, setEditorStatus] = useState("loading");
  const [panelSize, setPanelSize] = useState(null);
  const panelsRef = useRef(null);
  const syncEditorRef = useRef(() => {});
  const fileTabsRef = useRef(null);
  const focusProblemsRef = useRef(false);
  const toggleProblems = () => {
    focusProblemsRef.current = true;
    setProblemsOpen((open) => !open);
  };
  useEffect(() => {
    if (focusProblemsRef.current) {
      document.getElementById("skill-problems-toggle")?.focus();
      focusProblemsRef.current = false;
    }
  }, [problemsOpen]);

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const pendingReveal = useRef(null);
  const saveRef = useRef(() => {});
  const toggleFullscreenRef = useRef(() => {});
  toggleFullscreenRef.current = () => setFullscreen((v) => !v);

  useEffect(() => {
    if (!tree || !panelsRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      // Tab Thông tin ẩn editor; giữ kích thước cuối cùng khi bị ẩn.
      if (width && height) setPanelSize({ width, height });
    });
    observer.observe(panelsRef.current);
    return () => observer.disconnect();
  }, [Boolean(tree)]);

  // Toàn màn hình: Ctrl/⌘ + Shift + F để bật/tắt, Esc để thoát (khi không gõ trong Monaco).
  // Khóa cuộn trang phía sau trong lúc phủ toàn màn hình.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setFullscreen((v) => !v);
      } else if (e.key === "Escape" && fullscreen && !e.target.closest?.(".monaco-editor, .ant-modal, .ant-dropdown")) {
        setFullscreen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = fullscreen ? "hidden" : "";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [fullscreen]);

  const itemsByPath = useMemo(() => Object.fromEntries((tree?.items || []).map((i) => [i.path, i])), [tree]);
  const dirtyPaths = useMemo(
    () => new Set(Object.entries(files).filter(([, f]) => f.content !== undefined && f.content !== f.serverContent).map(([p]) => p)),
    [files],
  );

  useEffect(() => {
    onDirtyChange?.(dirtyPaths.size > 0);
  }, [dirtyPaths, onDirtyChange]);

  useEffect(() => {
    if (!dirtyPaths.size) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirtyPaths]);

  // ------------------------------------------------------------- dữ liệu

  const loadTree = useCallback(async () => {
    setTreeError(null);
    try {
      const data = await getTree(skill.id);
      setTree(data);
      return data;
    } catch (error) {
      setTreeError(apiError(error).message);
      toast.error(apiError(error).message);
      return null;
    }
  }, [skill.id]);

  const initializeTree = async () => {
    const data = await loadTree();
    if (!data) return;
    setExpanded(new Set(data.items.filter((i) => i.type === "dir" && !i.path.includes("/")).map((i) => i.path)));
    if (data.items.some((i) => i.path === SKILL.SKILL_MD)) openFile(SKILL.SKILL_MD);
  };
  useEffect(() => {
    initializeTree();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skill.id]);

  const patchFile = (path, patch) => setFiles((prev) => ({ ...prev, [path]: { ...prev[path], ...patch } }));

  const openFile = async (path) => {
    setTabs((prev) => (prev.includes(path) ? prev : [...prev, path]));
    setActive(path);
    setSelectedDir(dirname(path));
    // Mở các thư mục cha để thấy file đang mở trên cây
    setExpanded((prev) => {
      const next = new Set(prev);
      path.split("/").slice(0, -1).forEach((_, i, parts) => next.add(parts.slice(0, i + 1).join("/")));
      return next;
    });
    if (files[path]?.content !== undefined || files[path]?.loading) return;
    const item = itemsByPath[path];
    if (item?.category === "binary") {
      patchFile(path, { category: "binary" });
      return;
    }
    patchFile(path, { loading: true, error: null });
    try {
      const data = await getFileContent(skill.id, path);
      patchFile(path, {
        loading: false, content: data.content, serverContent: data.content, sha: data.sha256,
        category: data.category, language: data.language, warnings: data.warnings, blocking: [],
      });
    } catch (error) {
      patchFile(path, { loading: false, error: apiError(error).message });
    }
  };

  const reloadFile = async (path) => {
    const data = await getFileContent(skill.id, path);
    patchFile(path, { content: data.content, serverContent: data.content, sha: data.sha256, warnings: data.warnings, blocking: [] });
    return data;
  };

  // -------------------------------------------------------------- lưu file

  const save = async (path, { expectedSha } = {}) => {
    const file = files[path];
    if (!file || file.category !== "editable" || file.saving) return;
    // File đang mở: lấy nội dung thẳng từ Monaco để không lỡ ký tự gõ ngay trước Ctrl+S
    const model = editorRef.current?.getModel();
    const sent = model && model.uri.toString(true) === modelPath(path) ? model.getValue() : file.content;
    if (sent !== file.content) patchFile(path, { content: sent });
    patchFile(path, { saving: true });
    try {
      const res = await saveFile(skill.id, path, sent, expectedSha || file.sha);
      setFiles((prev) => ({
        ...prev,
        [path]: { ...prev[path], saving: false, serverContent: sent, sha: res.sha256, warnings: res.warnings, blocking: [] },
      }));
      setTree((prev) => prev && ({
        revision: res.revision,
        items: prev.items.map((i) => (i.path === path
          ? { ...i, sha256: res.sha256, size: res.size, warnings: res.warnings, warning_count: res.warnings.length } : i)),
      }));
      toast.success(`Đã lưu ${basename(path)} · revision ${res.revision}`);
      onSkillChanged?.();
    } catch (error) {
      patchFile(path, { saving: false });
      const err = apiError(error);
      if (err.code === "scan_blocked" || err.code === "invalid_frontmatter") {
        // Chỉ giữ lỗi chặn lưu; cảnh báo MEDIUM của bản chưa lưu sẽ có lại khi lưu thành công
        const blocking = (err.data.findings || []).filter((f) => f.severity === "CRITICAL" || f.severity === "HIGH");
        patchFile(path, { blocking: blocking.map((f) => ({ ...f, path })) });
        setProblemsOpen(true);
        toast.error(err.code === "scan_blocked" ? "Không lưu: nội dung vi phạm luật an ninh" : "Không lưu: frontmatter SKILL.md không hợp lệ");
      } else if (err.code === "file_changed") {
        setConflict({ path, currentSha: err.data.current_sha256, localContent: sent });
      } else if (err.code === "name_taken") {
        const line = sent.split("\n").findIndex((l) => l.startsWith("name:")) + 1 || 1;
        patchFile(path, { blocking: [{ path, line, severity: "HIGH", rule_id: "name-taken", message: err.message }] });
        setProblemsOpen(true);
        toast.error(err.message);
      } else if (err.status === 503) {
        toast.warning(err.message);
      } else {
        toast.error(err.message);
      }
    }
  };
  saveRef.current = () => active && save(active);

  // --------------------------------------------------------- tab / reveal

  const closeTab = (path, force = false) => {
    if (!force && dirtyPaths.has(path)) {
      setClosingTab(path);
      return;
    }
    setTabs((prev) => {
      const next = prev.filter((p) => p !== path);
      if (active === path) setActive(next[next.length - 1] || null);
      return next;
    });
    setFiles((prev) => {
      const { [path]: _removed, ...rest } = prev;
      return rest;
    });
    monacoRef.current?.editor.getModel(monacoRef.current.Uri.parse(modelPath(path)))?.dispose();
  };

  const modelPath = (path) => `file:///skill-${skill.id}/${path}`;

  const reveal = (path, line) => {
    pendingReveal.current = { path, line: line || 1 };
    openFile(path);
    applyReveal();
  };

  const applyReveal = () => {
    const target = pendingReveal.current;
    const editor = editorRef.current;
    if (!target || !editor || target.path !== active) return;
    const model = editor.getModel();
    if (!model || model.uri.toString(true) !== modelPath(target.path)) return;
    const line = Math.min(target.line, model.getLineCount());
    editor.revealLineInCenter(line);
    editor.setPosition({ lineNumber: line, column: 1 });
    editor.focus();
    pendingReveal.current = null;
  };

  // ------------------------------------------------------- markers Monaco

  const activeFile = active ? files[active] : null;
  const syncEditor = () => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco || !activeFile) return;
    const model = editor.getModel();
    if (!model || model.isDisposed() || model.uri.toString(true) !== modelPath(active)) return;
    const position = editor.getPosition();
    if (position) setCursor((previous) => previous.line === position.lineNumber && previous.col === position.column
      ? previous : { line: position.lineNumber, col: position.column });
    const findings = [...(activeFile.warnings || []), ...(activeFile.blocking || [])];
    monaco.editor.setModelMarkers(model, "skill-scan", findings.map((f) => {
      const line = Math.min(Math.max(f.line || 1, 1), model.getLineCount());
      return {
        severity: MARKER_SEVERITY[f.severity] || 2,
        message: `${f.message} (${f.rule_id})`,
        startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: model.getLineMaxColumn(line),
      };
    }));
    applyReveal();
  };
  syncEditorRef.current = syncEditor;
  useEffect(() => {
    if (editorStatus === "ready") syncEditor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, activeFile?.warnings, activeFile?.blocking, activeFile?.content === undefined, editorStatus]);

  // -------------------------------------------------- tạo / di chuyển / xóa

  const startCreate = (type, parent) => {
    setCreating({ type, parent: parent || "" });
    if (parent) setExpanded((prev) => new Set(prev).add(parent));
  };

  const submitCreate = async (name) => {
    const { type, parent } = creating;
    const path = (parent ? `${parent}/${name}` : name).replace(/\/+/g, "/");
    if (type === "file" && !isEditablePath(path)) {
      toast.error(`Chỉ tạo được file ${SKILL.EDITABLE_EXTS.join(" ")}`);
      return;
    }
    try {
      const content = extOf(path) === ".md" ? `# ${basename(path).replace(/\.md$/, "")}\n` : "";
      await createFile(skill.id, { path, type, content });
      setCreating(null);
      await loadTree();
      onSkillChanged?.();
      if (type === "file") openFile(path);
      else setExpanded((prev) => new Set(prev).add(path));
    } catch (error) {
      const err = apiError(error);
      toast.error(err.code === "path_exists" ? `'${path}' đã tồn tại` : err.message);
    }
  };

  const ensureClean = (entry) => {
    const dirty = [...dirtyPaths].filter((p) => isUnder(p, entry.path));
    if (dirty.length) {
      toast.warning(`Hãy lưu hoặc đóng ${dirty.map(basename).join(", ")} trước`);
      return false;
    }
    return true;
  };

  const closeAffected = (dir) => tabs.filter((p) => isUnder(p, dir)).forEach((p) => closeTab(p, true));

  const submitMove = async (to) => {
    const entry = moving;
    try {
      await moveFile(skill.id, entry.type === "dir"
        ? { from: entry.path, to, expectedRevision: tree.revision }
        : { from: entry.path, to, expectedSha256: entry.sha256 });
      const wasOpen = tabs.includes(entry.path);
      closeAffected(entry.path);
      setMoving(null);
      await loadTree();
      onSkillChanged?.();
      if (entry.type === "file" && wasOpen) openFile(to);
      toast.success("Đã di chuyển");
    } catch (error) {
      const err = apiError(error);
      if (err.code === "revision_changed" || err.code === "file_changed") {
        toast.error("Skill vừa được sửa ở nơi khác, đã tải lại cây file. Hãy thử lại.");
        setMoving(null);
        await loadTree();
      } else {
        toast.error(err.code === "path_exists" ? `'${to}' đã tồn tại` : err.message);
      }
    }
  };

  const confirmDelete = (entry) => {
    const count = tree.items.filter((i) => i.type === "file" && i.path.startsWith(entry.path + "/")).length;
    Modal.confirm({
      title: entry.type === "dir" ? `Xóa thư mục "${entry.path}"?` : `Xóa "${entry.path}"?`,
      content: entry.type === "dir"
        ? `${count} file bên trong cũng bị xóa. Nếu có người vừa thêm file vào thư mục, thao tác sẽ bị từ chối.`
        : "Không thể hoàn tác.",
      okText: "Xóa",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deletePath(skill.id, entry.path, entry.type === "dir"
            ? { expectedRevision: tree.revision } : { expectedSha256: entry.sha256 });
          closeAffected(entry.path);
          await loadTree();
          onSkillChanged?.();
        } catch (error) {
          const err = apiError(error);
          if (err.code === "revision_changed" || err.code === "file_changed") {
            toast.error("Skill vừa được sửa ở nơi khác, đã tải lại cây file. Kiểm tra rồi xóa lại.");
            await loadTree();
          } else {
            toast.error(err.message);
          }
        }
      },
    });
  };

  const onTreeAction = (key, entry) => {
    const item = itemsByPath[entry.path] || entry;
    if (key === "new-file") startCreate("file", item.path);
    else if (key === "new-dir") startCreate("dir", item.path);
    else if (key === "download") window.open(fileRawUrl(skill.id, item.path, true), "_blank");
    else if (key === "move" && ensureClean(item)) setMoving(item);
    else if (key === "delete" && ensureClean(item)) confirmDelete(item);
  };

  // ------------------------------------------------------------- problems

  const problems = useMemo(() => {
    const list = [];
    (tree?.items || []).forEach((item) => {
      const opened = files[item.path];
      (opened?.warnings ?? item.warnings ?? []).forEach((w) => list.push({ ...w, path: item.path }));
      (opened?.blocking || []).forEach((b) => list.push({ ...b, path: item.path, blocking: true }));
    });
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, INFO: 3 };
    return list.sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9));
  }, [tree, files]);

  // --------------------------------------------------------------- render

  const renderBody = () => {
    if (!active) {
      return (
        <div className="h-full flex items-center justify-center">
          <Empty description={<span>Chọn file ở cây bên trái<br/><span className="text-xs">Ctrl/⌘ + S để lưu</span></span>}/>
        </div>
      );
    }
    const file = files[active] || {};
    if (file.loading) return <div role="status" className="h-full flex flex-col gap-3 items-center justify-center"><Spin/><span className="text-sm">Đang tải nội dung…</span></div>;
    if (file.error) return <div role="alert" className="p-6 flex flex-col items-start gap-3">
      <span className="text-red-600">Không tải được {basename(active)}: {file.error}</span>
      <Button onClick={() => openFile(active)}>Thử lại</Button>
    </div>;
    if (file.category === "binary") {
      const url = fileRawUrl(skill.id, active);
      return (
        <div className="h-full flex flex-col">
          <div className="flex justify-end p-2">
            <Button size="small" icon={<Download className="w-3.5 h-3.5"/>} href={fileRawUrl(skill.id, active, true)}>Tải về</Button>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-auto p-4 bg-[repeating-conic-gradient(#f3f4f6_0_25%,#fff_0_50%)] bg-[length:16px_16px]">
            {extOf(active) === ".pdf"
              ? <iframe title={active} src={url} className="w-full h-full border-0 bg-white"/>
              : <img src={url} alt={active} className="max-w-full max-h-full object-contain shadow"/>}
          </div>
        </div>
      );
    }
    const readOnly = file.category !== "editable";
    return (
      <div className="h-full flex flex-col">
        {readOnly && (
          <div className="flex items-center gap-2 px-3 h-7 text-xs bg-slate-50 text-muted-foreground border-0 border-b border-solid border-border">
            <Lock className="w-3.5 h-3.5"/>Chỉ xem · chỉ sửa được file {SKILL.EDITABLE_EXTS.join(" ")}
          </div>
        )}
        <div className="flex-1 min-h-0">
          <MonacoEditor
            onStatusChange={setEditorStatus}
            path={modelPath(active)}
            language={file.language || "plaintext"}
            value={file.content}
            onChange={(value) => patchFile(active, { content: value ?? "" })}
            onMount={(editor, monaco) => {
              editorRef.current = editor;
              monacoRef.current = monaco;
              editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => saveRef.current());
              editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => toggleFullscreenRef.current());
              editor.onDidChangeCursorPosition((e) => setCursor({ line: e.position.lineNumber, col: e.position.column }));
              editor.onDidChangeModel(() => syncEditorRef.current());
              editor.onDidDispose(() => { if (editorRef.current === editor) editorRef.current = null; });
              syncEditorRef.current();
            }}
            options={{
              readOnly,
              ariaLabel: `Nội dung ${active}`,
              fontSize: 13,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: file.language === "markdown" ? "on" : "off",
              tabSize: file.language === "python" ? 4 : 2,
              renderWhitespace: "selection",
            }}
          />
        </div>
      </div>
    );
  };

  if (!tree) return <div role={treeError ? "alert" : "status"} className="h-full flex flex-col gap-3 items-center justify-center">
    {treeError ? <><span>{treeError}</span><Button onClick={initializeTree}>Thử lại cây file</Button></>
      : <><Spin/><span className="text-sm">Đang tải cây file…</span></>}
  </div>;
  const activeItem = active ? itemsByPath[active] : null;
  const textLoading = activeFile && !activeFile.error && (activeFile.loading || (activeFile.category !== "binary" && editorStatus === "loading"));
  const textError = activeFile?.error || (activeFile?.category !== "binary" && editorStatus === "error");
  const treeWidth = panelSize ? Math.min(40, 240 / panelSize.width * 100) : 28;
  const problemHeight = panelSize ? Math.min(30, 112 / panelSize.height * 100) : 18;

  return (
    <div className={cn("skill-editor flex flex-col bg-white overflow-hidden",
      fullscreen ? "fixed inset-0 z-[999]" : "h-full rounded-xl border border-solid border-border")}>
      <div ref={panelsRef} className="flex-1 min-h-0">
        {panelSize && <PanelGroup direction="horizontal" autoSaveId="skill-editor-h-v2">
          <Panel defaultSize={treeWidth} minSize={Math.min(40, 210 / panelSize.width * 100)} maxSize={45}>
            <FileTree
              items={tree.items}
              expanded={expanded}
              onToggle={(path) => setExpanded((prev) => {
                const next = new Set(prev);
                next.has(path) ? next.delete(path) : next.add(path);
                return next;
              })}
              onCollapseAll={() => setExpanded(new Set())}
              activePath={active}
              dirtyPaths={dirtyPaths}
              selectedDir={selectedDir}
              onSelectDir={setSelectedDir}
              onOpen={openFile}
              onAction={onTreeAction}
              creating={creating}
              onCreateSubmit={submitCreate}
              onCreateCancel={() => setCreating(null)}
              onRefresh={loadTree}
            />
          </Panel>
          <PanelResizeHandle className="skill-resize-h" aria-label="Điều chỉnh chiều rộng cây file"/>
          <Panel minSize={40}>
            <PanelGroup direction="vertical" autoSaveId="skill-editor-v-v2">
              <Panel minSize={30}>
                <div className="h-full flex flex-col">
                  <div className="flex items-stretch h-9 border-0 border-b border-solid border-border bg-[#fafbfc]">
                    <div ref={fileTabsRef} role="tablist" aria-label="Các file đang mở" className="flex-1 flex overflow-x-auto skill-tabs">
                      {tabs.map((path) => {
                        const isActive = path === active;
                        const dirty = dirtyPaths.has(path);
                        return (
                          <div
                            key={path}
                            role="tab" aria-selected={isActive} aria-controls="skill-file-content"
                            aria-label={`${basename(path)}${dirty ? ", chưa lưu" : ""}`} tabIndex={isActive ? 0 : -1}
                            onKeyDown={(event) => {
                              if (event.target !== event.currentTarget) return;
                              const keys = ["ArrowLeft", "ArrowRight", "Home", "End", "Enter", " ", "Delete"];
                              if (!keys.includes(event.key)) return;
                              event.preventDefault();
                              if (event.key === "Delete") { closeTab(path); return; }
                              if (event.key === "Enter" || event.key === " ") { setActive(path); return; }
                              const index = tabs.indexOf(path);
                              const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1
                                : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
                              setActive(tabs[next]);
                              fileTabsRef.current?.querySelectorAll('[role="tab"]')[next]?.focus();
                            }}
                            onClick={() => setActive(path)}
                            onMouseDown={(e) => e.button === 1 && closeTab(path)}
                            title={path}
                            className={cn("group flex items-center gap-1.5 pl-3 pr-1 text-[13px] cursor-pointer border-0 border-r border-solid border-border whitespace-nowrap",
                              isActive ? "bg-white text-foreground shadow-[inset_0_2px_0_hsl(var(--primary))]" : "text-muted-foreground hover:bg-gray-100")}
                          >
                            <FileIcon path={path} type="file" category={itemsByPath[path]?.category}/>
                            <span>{basename(path)}</span>
                            <button
                              aria-label={`Đóng ${basename(path)}`} tabIndex={isActive ? 0 : -1}
                              onClick={(e) => { e.stopPropagation(); closeTab(path); }}
                              className="w-5 h-5 rounded border-0 bg-transparent hover:bg-gray-200 flex items-center justify-center cursor-pointer"
                            >
                              {dirty
                                ? <span className="w-2 h-2 rounded-full bg-foreground/70 group-hover:hidden"/>
                                : null}
                              <X className={cn("w-3.5 h-3.5", dirty && "hidden group-hover:block")}/>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-1 px-2">
                      {activeFile?.category === "editable" && (
                        <Tooltip title="Ctrl/⌘ + S">
                          <Button size="small" type="primary" icon={<Save className="w-3.5 h-3.5"/>}
                                  disabled={!dirtyPaths.has(active)} loading={activeFile.saving} onClick={() => save(active)}>
                            Lưu
                          </Button>
                        </Tooltip>
                      )}
                      <Tooltip title={fullscreen ? "Thoát toàn màn hình (Esc)" : "Toàn màn hình (Ctrl/⌘ + Shift + F)"}>
                        <Button size="small" type="text" onClick={() => setFullscreen((v) => !v)}
                                aria-label={fullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
                                icon={fullscreen ? <Minimize2 className="w-3.5 h-3.5"/> : <Maximize2 className="w-3.5 h-3.5"/>}/>
                      </Tooltip>
                    </div>
                  </div>
                  {active && (
                    <div className="flex items-center gap-1 h-6 px-3 text-xs text-muted-foreground">
                      {active.split("/").map((part, index, parts) => (
                        <React.Fragment key={index}>
                          {index > 0 && <ChevronRight className="w-3 h-3"/>}
                          <span className={index === parts.length - 1 ? "text-foreground" : ""}>{part}</span>
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                  <div id="skill-file-content" role="tabpanel" aria-label={active || "Nội dung file"} aria-busy={Boolean(textLoading)} className="flex-1 min-h-0">{renderBody()}</div>
                </div>
              </Panel>
              {problemsOpen ? (
                <>
                  <PanelResizeHandle className="skill-resize-v" aria-label="Điều chỉnh chiều cao bảng vấn đề"/>
                  <Panel defaultSize={problemHeight} minSize={Math.min(15, 64 / panelSize.height * 100)} maxSize={60}>
                    <div className="h-full flex flex-col">
                      <ProblemsHeader problems={problems} open onToggle={toggleProblems}/>
                      <div id="skill-problems" className="flex-1 min-h-0">
                        <ProblemsPanel problems={problems} onSelect={(p) => p.path && reveal(p.path, p.line)}/>
                      </div>
                    </div>
                  </Panel>
                </>
              ) : (
                <ProblemsHeader problems={problems} open={false} onToggle={toggleProblems}/>
              )}
            </PanelGroup>
          </Panel>
        </PanelGroup>}
      </div>

      <div className="flex items-center gap-4 h-6 px-3 text-[11px] text-white bg-primary">
        <span className="font-mono">{skill.name}</span>
        <span>revision {tree.revision}</span>
        <span role="status">{dirtyPaths.size ? `● ${dirtyPaths.size} file chưa lưu` : textError ? "Không tải được nội dung"
          : textLoading ? "Đang tải nội dung…" : activeFile?.saving ? "Đang lưu…" : "✓ Đã lưu"}</span>
        <span className="ml-auto">{activeItem && activeFile?.content !== undefined ? `Dòng ${cursor.line}, Cột ${cursor.col}` : ""}</span>
        {activeFile?.language && <span>{activeFile.language}</span>}
        {activeFile?.content !== undefined && <span>UTF-8</span>}
        {activeFile?.category && !textLoading && !textError && activeFile.category !== "editable" && <span className="flex items-center gap-1"><Lock className="w-3 h-3"/>Chỉ xem</span>}
      </div>

      <MoveModal entry={moving} onSubmit={submitMove} onClose={() => setMoving(null)}/>
      <ConflictModal
        conflict={conflict}
        language={conflict ? files[conflict.path]?.language : undefined}
        loadServerContent={async () => (await getFileContent(skill.id, conflict.path)).content}
        onReload={async () => { await reloadFile(conflict.path); setConflict(null); }}
        onOverwrite={() => { const { path, currentSha } = conflict; setConflict(null); save(path, { expectedSha: currentSha }); }}
        onClose={() => setConflict(null)}
      />
      <Modal
        open={Boolean(closingTab)}
        title={`Lưu thay đổi của ${closingTab ? basename(closingTab) : ""}?`}
        onCancel={() => setClosingTab(null)}
        footer={[
          <Button key="cancel" onClick={() => setClosingTab(null)}>Hủy</Button>,
          <Button key="discard" danger onClick={() => { closeTab(closingTab, true); setClosingTab(null); }}>Không lưu</Button>,
          <Button key="save" type="primary" onClick={async () => { const p = closingTab; setClosingTab(null); await save(p); }}>Lưu</Button>,
        ]}
      >
        Thay đổi chưa lưu sẽ mất nếu đóng.
      </Modal>
    </div>
  );
}
