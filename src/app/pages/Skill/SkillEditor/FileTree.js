import React, { useMemo, useRef, useState } from "react";
import { Dropdown, Input, Tooltip } from "antd";
import {
  ChevronDown, ChevronRight, ChevronsDownUp, Download, Ellipsis, FilePlus, FolderPlus, PenLine, RefreshCw, Trash2,
} from "lucide-react";
import { cn } from "@src/helper/utils";
import { SKILL } from "@constant";
import { FileIcon, ReadonlyBadge } from "../utils";

/** Dựng cây từ danh sách phẳng {path, type}: thư mục trước, rồi theo tên */
function buildTree(items) {
  const root = { path: "", type: "dir", children: [] };
  const byPath = { "": root };
  [...items].sort((a, b) => a.path.split("/").length - b.path.split("/").length).forEach((item) => {
    const parentPath = item.path.includes("/") ? item.path.slice(0, item.path.lastIndexOf("/")) : "";
    const node = { ...item, children: [] };
    byPath[item.path] = node;
    (byPath[parentPath] || root).children.push(node);
  });
  const sort = (node) => {
    node.children.sort((a, b) => (a.type === b.type ? a.path.localeCompare(b.path) : a.type === "dir" ? -1 : 1));
    node.children.forEach(sort);
  };
  sort(root);
  return root;
}

function CreateRow({ depth, type, onSubmit, onCancel }) {
  const [value, setValue] = useState("");
  return (
    <div className="flex items-center gap-1.5 h-7 pr-2" style={{ paddingLeft: 8 + depth * 14 + 16 }}>
      <FileIcon path={value || (type === "dir" ? "" : "a.md")} type={type}/>
      <Input
        size="small"
        autoFocus
        value={value}
        placeholder={type === "dir" ? "tên thư mục" : `vd: notes.md (${SKILL.EDITABLE_EXTS.join(" ")})`}
        onChange={(e) => setValue(e.target.value)}
        onPressEnter={() => value.trim() && onSubmit(value.trim())}
        onKeyDown={(e) => e.key === "Escape" && onCancel()}
        onBlur={() => !value.trim() && onCancel()}
        className="font-mono text-xs"
      />
    </div>
  );
}

export default function FileTree({
  items, expanded, onToggle, onCollapseAll, activePath, dirtyPaths, selectedDir, onSelectDir,
  onOpen, onAction, creating, onCreateSubmit, onCreateCancel, onRefresh,
}) {
  const tree = useMemo(() => buildTree(items), [items]);
  const treeRef = useRef(null);
  const [focusedPath, setFocusedPath] = useState(null);
  const visibleNodes = useMemo(() => {
    const nodes = [];
    const visit = (node) => {
      nodes.push(node);
      if (expanded.has(node.path)) node.children.forEach(visit);
    };
    tree.children.forEach(visit);
    return nodes;
  }, [tree, expanded]);
  const focusPath = visibleNodes.some((node) => node.path === focusedPath) ? focusedPath
    : visibleNodes.some((node) => node.path === activePath) ? activePath : visibleNodes[0]?.path;
  const focusNode = (path) => {
    if (!path) return;
    setFocusedPath(path);
    [...(treeRef.current?.querySelectorAll('[role="treeitem"]') || [])]
      .find((element) => element.dataset.path === path)?.focus();
  };
  const onTreeKey = (event, node) => {
    if (event.target !== event.currentTarget) return;
    const index = visibleNodes.findIndex((entry) => entry.path === node.path);
    const isDir = node.type === "dir";
    if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End", "Enter", " "].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "ArrowDown") focusNode(visibleNodes[Math.min(index + 1, visibleNodes.length - 1)]?.path);
    else if (event.key === "ArrowUp") focusNode(visibleNodes[Math.max(index - 1, 0)]?.path);
    else if (event.key === "Home") focusNode(visibleNodes[0]?.path);
    else if (event.key === "End") focusNode(visibleNodes[visibleNodes.length - 1]?.path);
    else if (event.key === "ArrowRight" && isDir) {
      if (!expanded.has(node.path)) onToggle(node.path);
      else focusNode(node.children[0]?.path);
    } else if (event.key === "ArrowLeft") {
      if (isDir && expanded.has(node.path)) onToggle(node.path);
      else focusNode(node.path.includes("/") ? node.path.slice(0, node.path.lastIndexOf("/")) : null);
    } else if (event.key === "Enter" || event.key === " ") {
      if (isDir) { onToggle(node.path); onSelectDir(node.path); }
      else onOpen(node.path);
    }
  };

  const menuFor = (node) => {
    const isSkillMd = node.path === SKILL.SKILL_MD;
    if (node.type === "dir") {
      return [
        { key: "new-file", icon: <FilePlus className="w-4 h-4"/>, label: "File mới" },
        { key: "new-dir", icon: <FolderPlus className="w-4 h-4"/>, label: "Thư mục mới" },
        { key: "move", icon: <PenLine className="w-4 h-4"/>, label: "Đổi tên / Di chuyển" },
        { type: "divider" },
        { key: "delete", icon: <Trash2 className="w-4 h-4"/>, label: "Xóa thư mục", danger: true },
      ];
    }
    return [
      { key: "download", icon: <Download className="w-4 h-4"/>, label: "Tải về" },
      { key: "move", icon: <PenLine className="w-4 h-4"/>, label: "Đổi tên / Di chuyển", disabled: isSkillMd },
      { type: "divider" },
      { key: "delete", icon: <Trash2 className="w-4 h-4"/>, label: "Xóa", danger: true, disabled: isSkillMd },
    ];
  };

  const renderNode = (node, depth) => {
    const isDir = node.type === "dir";
    const open = expanded.has(node.path);
    const active = node.path === activePath;
    const dirty = dirtyPaths.has(node.path);
    const name = node.path.split("/").pop();
    const menu = { items: menuFor(node), onClick: ({ key, domEvent }) => { domEvent.stopPropagation(); onAction(key, node); } };

    return (
      <React.Fragment key={node.path}>
        <Dropdown trigger={["contextMenu"]} menu={menu}>
          <div
            role="treeitem" aria-level={depth + 1} aria-label={name}
            aria-expanded={isDir ? open : undefined} aria-selected={active}
            data-path={node.path} tabIndex={node.path === focusPath ? 0 : -1}
            onFocus={() => setFocusedPath(node.path)} onKeyDown={(event) => onTreeKey(event, node)}
            onClick={() => (isDir ? (onToggle(node.path), onSelectDir(node.path)) : onOpen(node.path))}
            className={cn(
              "skill-tree-row group flex items-center gap-1.5 h-7 pr-1 cursor-pointer select-none text-[13px]",
              active ? "bg-primary-100 text-primary" : "hover:bg-gray-100",
              isDir && selectedDir === node.path && !active && "bg-gray-50",
            )}
            style={{ paddingLeft: 8 + depth * 14 }}
            title={node.path}
          >
            <span className="w-4 flex-none flex justify-center text-muted-foreground">
              {isDir && (open ? <ChevronDown className="w-3.5 h-3.5"/> : <ChevronRight className="w-3.5 h-3.5"/>)}
            </span>
            <FileIcon path={node.path} type={node.type} open={open} category={node.category}/>
            <span className={cn("truncate flex-1", node.category === "binary" && "text-muted-foreground")}>{name}</span>
            {dirty && <span className="w-2 h-2 rounded-full bg-foreground/60 flex-none"/>}
            {node.warning_count > 0 && (
              <Tooltip title={`${node.warning_count} cảnh báo`}>
                <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 rounded px-1 flex-none">{node.warning_count}</span>
              </Tooltip>
            )}
            {!isDir && node.category !== "editable" && <ReadonlyBadge/>}
            <Dropdown trigger={["click"]} menu={menu}>
              <button aria-label={`Thao tác với ${name}`} tabIndex={node.path === focusPath ? 0 : -1} onClick={(e) => e.stopPropagation()}
                      className="w-5 h-5 rounded border-0 bg-transparent hover:bg-gray-200 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 flex-none">
                <Ellipsis className="w-3.5 h-3.5"/>
              </button>
            </Dropdown>
          </div>
        </Dropdown>
        {isDir && open && (
          <>
            {creating && creating.parent === node.path && (
              <CreateRow depth={depth + 1} type={creating.type} onSubmit={onCreateSubmit} onCancel={onCreateCancel}/>
            )}
            {node.children.map((child) => renderNode(child, depth + 1))}
          </>
        )}
      </React.Fragment>
    );
  };

  const toolbarButton = (title, Icon, onClick) => (
    <Tooltip title={title}>
      <button aria-label={title} onClick={onClick}
              className="w-6 h-6 rounded border-0 bg-transparent hover:bg-gray-200 flex items-center justify-center cursor-pointer text-muted-foreground">
        <Icon className="w-3.5 h-3.5"/>
      </button>
    </Tooltip>
  );

  return (
    <div className="h-full flex flex-col bg-[#fafbfc]">
      <div className="flex items-center justify-between h-9 px-3 border-0 border-b border-solid border-border">
        <span className="text-[11px] font-semibold tracking-wider text-muted-foreground">TỆP</span>
        <div className="flex gap-0.5">
          {toolbarButton("File mới", FilePlus, () => onAction("new-file", { path: selectedDir, type: "dir" }))}
          {toolbarButton("Thư mục mới", FolderPlus, () => onAction("new-dir", { path: selectedDir, type: "dir" }))}
          {toolbarButton("Tải lại", RefreshCw, onRefresh)}
          {toolbarButton("Thu gọn", ChevronsDownUp, onCollapseAll)}
        </div>
      </div>
      <div ref={treeRef} role="tree" aria-label="Tệp của skill" className="flex-1 overflow-auto py-1" onClick={(e) => e.target === e.currentTarget && onSelectDir("")}>
        {creating && creating.parent === "" && (
          <CreateRow depth={0} type={creating.type} onSubmit={onCreateSubmit} onCancel={onCreateCancel}/>
        )}
        {tree.children.map((child) => renderNode(child, 0))}
      </div>
    </div>
  );
}
