/**
 * Sidebar copy từ owlla_frontend/src/app/layout/MenuUser (bỏ Redux), thêm mục "Skill" sau "Kiến thức".
 */
import React, { useState } from "react";
import { Dropdown, Layout, Tooltip } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Bell, BookOpen, Bot, Brain, ChevronLeft, ChevronRight, FileText, ListTodo, LogOut, Network, Puzzle, Workflow, Zap,
} from "lucide-react";

import { LINK } from "@link";
import { cn } from "@src/helper/utils";
import { useAuth } from "@app/auth/AuthContext";
import LOGO from "@src/asset/Logo/logo.png";
import "./menu-user.scss";

const { Sider } = Layout;

const MENU_ITEMS = [
  { key: "bots", title: "Agent", path: LINK.BOT, icon: <Bot className="w-5 h-5 text-blue-600"/> },
  { key: "mcp_server", title: "MCP", path: LINK.MCP, icon: <Network className="w-5 h-5 text-teal-600"/> },
  { key: "workflow", title: "QUY_TRINH", path: LINK.WORKFLOW, icon: <Workflow className="w-5 h-5 text-yellow-600"/> },
  { key: "trigger", title: "Triggers", path: LINK.TRIGGER, icon: <Zap className="w-5 h-5 text-orange-600"/> },
  { key: "knowledge", title: "KNOWLEDGE", path: LINK.KNOWLEDGE, icon: <BookOpen className="w-5 h-5 text-purple-600"/> },
  { key: "skill", title: "SKILL", path: LINK.SKILL, icon: <Puzzle className="w-5 h-5 text-indigo-600"/> },
  { key: "evaluations", title: "EVALUATIONS", path: LINK.EVALUATIONS, icon: <ListTodo className="w-5 h-5 text-pink-600"/> },
  { key: "model-management", title: "MODEL", path: LINK.MODEL_MANAGEMENT, icon: <Brain className="w-5 h-5 text-red-600"/> },
];

const ACTION_ITEMS = [
  { key: "docs", title: "TAI_LIEU", icon: <FileText className="w-5 h-5 text-slate-600"/> },
  { key: "lang", title: "NGON_NGU", icon: <span className="text-base leading-none">🇻🇳</span> },
  { key: "notify", title: "THONG_BAO", icon: <Bell className="w-5 h-5 text-cyan-600"/> },
];

function MenuRow({ item, active, expanded, onClick }) {
  const { t } = useTranslation();
  const row = (
    <div
      role="link"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick?.()}
      className={cn(
        "flex items-center cursor-pointer mb-1 w-full select-none font-medium !text-foreground text-sm rounded-xl hover:bg-gray-50",
        { "!text-primary !bg-primary-100": active, "px-2 py-1": expanded, "justify-center min-h-10": !expanded },
      )}
    >
      <div className="flex items-center whitespace-nowrap">
        <div className="w-8 h-8 flex items-center justify-center">{item.icon}</div>
        {expanded && <span className="ml-2">{t(item.title)}</span>}
      </div>
    </div>
  );
  return expanded ? row : <Tooltip title={t(item.title)} placement="right">{row}</Tooltip>;
}

export default function MenuUser({ width }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [expanded, setExpanded] = useState(true);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <Sider width={width} collapsed={!expanded} className="!bg-white !h-[100vh] !shadow-lg menu-user">
      <div className={cn("flex justify-between items-center w-full p-3 border-0 border-b border-solid border-border",
        { "justify-center": !expanded })}>
        {expanded && (
          <div className="flex gap-2 items-center">
            <img src={LOGO} width={40} height={40} alt="Owllee Agent"/>
            <span className="font-bold text-lg whitespace-nowrap select-none">Owllee Agent</span>
          </div>
        )}
        <button
          aria-label={expanded ? "Thu gọn thanh bên" : "Mở rộng thanh bên"}
          onClick={() => setExpanded((v) => !v)}
          className="cursor-pointer rounded-lg bg-transparent border-0 hover:bg-gray-100 flex items-center justify-center w-10 h-10"
        >
          {expanded ? <ChevronLeft className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
        </button>
      </div>

      <div className="!flex-1 overflow-y-auto overflow-x-hidden p-3">
        {MENU_ITEMS.map((item) => (
          <MenuRow key={item.key} item={item} expanded={expanded} active={isActive(item.path)} onClick={() => navigate(item.path)}/>
        ))}
      </div>

      <div className="flex flex-col gap-1 p-3 border-0 border-t border-solid border-border">
        {ACTION_ITEMS.map((item) => <MenuRow key={item.key} item={item} expanded={expanded}/>)}
        <Dropdown
          trigger={["click"]}
          placement="topRight"
          menu={{
            items: [{
              key: "logout",
              label: <span className="flex items-center gap-2"><LogOut className="w-4 h-4 text-red-500"/>{t("SIGN_OUT")}</span>,
              onClick: logout,
            }],
          }}
        >
          <div className={cn("flex p-2 items-center cursor-pointer hover:bg-gray-100 rounded-lg",
            expanded ? "justify-start" : "justify-center")}>
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary font-semibold flex items-center justify-center flex-none">
              {(user?.fullname || user?.username || "?").trim().charAt(0).toUpperCase()}
            </div>
            {expanded && (
              <div className="ml-2 min-w-0">
                <div className="text-sm font-medium truncate">{user?.full_name || user?.fullname || user?.username || "Người dùng"}</div>
                <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
              </div>
            )}
          </div>
        </Dropdown>
      </div>
    </Sider>
  );
}
