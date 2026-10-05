import React, { useCallback, useEffect, useState } from "react";
import { Button, Modal, Spin, Switch, Tooltip } from "antd";
import { useBlocker, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, Code2, Download, Info, Puzzle } from "lucide-react";

import { LINK } from "@link";
import { getSkill, updateSkillStatus } from "@services/Skills";
import { apiError } from "@src/setup/axios";
import { cn, formatTime } from "@src/helper/utils";
import { downloadSkill } from "../SkillActions";
import SkillEditor from "../SkillEditor";
import InfoTab from "./InfoTab";
import "./detail.scss";

const TABS = [
  { key: "editor", label: "Trình soạn thảo", icon: Code2 },
  { key: "info", label: "Thông tin", icon: Info },
];

/** Chi tiết skill: bố cục theo trang chi tiết Kiến thức */
export default function DetailSkill() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "info" ? "info" : "editor";
  const [skill, setSkill] = useState(null);
  const [toggling, setToggling] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    dirty && currentLocation.pathname !== nextLocation.pathname);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setSkill(await getSkill(id));
    } catch (error) {
      const err = apiError(error);
      setLoadError(err.message);
      toast.error(err.status === 404 ? "Không tìm thấy skill" : err.message);
      if (err.status === 404) navigate(LINK.SKILL, { replace: true });
    }
  }, [id, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleStatus = async (checked) => {
    setToggling(true);
    try {
      setSkill(await updateSkillStatus(id, checked ? "active" : "disabled"));
    } catch (error) {
      toast.error(apiError(error).message);
    } finally {
      setToggling(false);
    }
  };

  if (!skill) return (
    <div className="h-full flex flex-col gap-3 items-center justify-center" role={loadError ? "alert" : "status"}>
      {loadError ? <><span>{loadError}</span><Button onClick={load}>Thử lại</Button></>
        : <><Spin size="large"/><span>Đang tải skill…</span></>}
    </div>
  );
  const active = skill.status === "active";

  return (
    <div className="skill-detail p-6 flex flex-col gap-4 h-full min-h-[640px]">
      <div className="skill-detail-header">
        <div className="skill-detail-identity">
        <button aria-label="Quay lại danh sách Skill" onClick={() => navigate(LINK.SKILL)}
                className="cursor-pointer rounded-lg bg-transparent border-0 hover:bg-gray-100 flex items-center justify-center w-10 h-10">
          <ArrowLeft className="w-5 h-5"/>
        </button>
        <div className={cn("w-11 h-11 flex-none rounded-xl flex items-center justify-center bg-gradient-to-br",
          active ? "from-indigo-500 to-violet-600" : "from-slate-300 to-slate-400")}>
          <Puzzle className="w-6 h-6 text-white"/>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-foreground font-mono m-0 break-all">{skill.name}</h1>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
            <span>Cập nhật lúc: {formatTime(skill.updated_at)}</span><span>Revision {skill.revision}</span>
          </div>
        </div>
        </div>
        <div className="skill-detail-actions">
        <Tooltip title={active ? "Agent được dùng skill này" : "Skill đang tắt"}>
          <span className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
            <Switch aria-label="Bật skill" checked={active} loading={toggling} onChange={toggleStatus}/>{active ? "Đang bật" : "Đã tắt"}
          </span>
        </Tooltip>
        <Button size="large" className="rounded-xl" icon={<Download className="w-4 h-4"/>} onClick={() => downloadSkill(skill)}>Tải zip</Button>
        </div>
      </div>
      {skill.description && <p className="m-0 text-sm text-muted-foreground break-words">{skill.description}</p>}


      <div role="tablist" aria-label="Chi tiết skill" className="flex bg-gray-100 rounded-xl p-1 self-start">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            id={`skill-tab-${key}`} role="tab" aria-selected={tab === key}
            aria-controls={`skill-panel-${key}`} tabIndex={tab === key ? 0 : -1}
            onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const next = event.key === "Home" ? "editor" : event.key === "End" ? "info" : key === "editor" ? "info" : "editor";
              setSearchParams({ tab: next }, { replace: true });
              document.getElementById(`skill-tab-${next}`)?.focus();
            }}
            onClick={() => setSearchParams({ tab: key }, { replace: true })}
            className={cn("flex items-center gap-2 px-4 h-9 rounded-lg border-0 cursor-pointer text-sm font-medium",
              tab === key ? "bg-white text-primary shadow-sm" : "bg-transparent text-muted-foreground hover:text-foreground")}
          >
            <Icon className="w-4 h-4"/>{label}
          </button>
        ))}
      </div>

      <div id="skill-panel-editor" role="tabpanel" aria-labelledby="skill-tab-editor" hidden={tab !== "editor"}
           className={cn("flex-1 min-h-[420px]", tab !== "editor" && "hidden")}>
        {/* Ghi đè bằng upload (upload trùng tên + ghi đè) thay toàn bộ file -> dựng lại editor */}
        <SkillEditor key={skill.last_upload_id || "initial"} skill={skill} onSkillChanged={load}
                     onDirtyChange={setDirty}/>
      </div>
      {tab === "info" && <div id="skill-panel-info" role="tabpanel" aria-labelledby="skill-tab-info"><InfoTab skill={skill}/></div>}

      <Modal open={blocker.state === "blocked"} title="Có file chưa lưu"
             okText="Vẫn rời đi" cancelText="Ở lại" okButtonProps={{ danger: true }}
             onOk={() => blocker.proceed?.()} onCancel={() => blocker.reset?.()}>
        Rời đi sẽ mất các thay đổi chưa lưu. Bạn có muốn tiếp tục?
      </Modal>
    </div>
  );
}
