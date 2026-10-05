import React, { useCallback, useEffect, useState } from "react";
import { Button, Dropdown, Empty, Input, Pagination, Select, Spin } from "antd";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FilePlus2, History, LayoutGrid, List, Plus, Search, UploadCloud } from "lucide-react";

import { LINK } from "@link";
import { getSkills, updateSkillStatus } from "@services/Skills";
import { apiError } from "@src/setup/axios";
import { cn } from "@src/helper/utils";
import SkillCard from "./SkillCard";
import SkillTable from "./SkillTable";
import QuotaBar from "./QuotaBar";
import CreateSkillModal from "./CreateSkillModal";
import UploadSkillModal from "./UploadSkillModal";
import { skillMenuItems } from "./SkillActions";

const PAGE_SIZE = 12;

/** Danh sách skill: bố cục theo trang Agent (/bots) và Kiến thức (/knowledge) */
export default function SkillList() {
  const navigate = useNavigate();
  const [view, setView] = useState(() => localStorage.getItem("skill-view") || "grid");
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ skills: [], count: 0, quota: null });
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getSkills({ page, limit: PAGE_SIZE, name: search, status }));
    } catch (error) {
      toast.error(apiError(error).message);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(keyword.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  const changeView = (value) => {
    setView(value);
    localStorage.setItem("skill-view", value);
  };

  const toggleStatus = async (skill, checked) => {
    setTogglingId(skill.id);
    try {
      const updated = await updateSkillStatus(skill.id, checked ? "active" : "disabled");
      setData((prev) => ({ ...prev, skills: prev.skills.map((s) => (s.id === skill.id ? { ...s, status: updated.status } : s)) }));
    } catch (error) {
      toast.error(apiError(error).message);
    } finally {
      setTogglingId(null);
    }
  };

  const openSkill = (skill) => navigate(LINK.SKILL_DETAIL.format(skill.id));
  const menuFor = (skill) => skillMenuItems(skill, { navigate, onDeleted: load });

  const addMenu = {
    items: [
      { key: "upload", icon: <UploadCloud className="w-4 h-4"/>, label: "Upload file zip", onClick: () => setUploadOpen(true) },
      { key: "blank", icon: <FilePlus2 className="w-4 h-4"/>, label: "Tạo skill trống", onClick: () => setOpenCreate(true) },
    ],
  };

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-2xl font-bold">Skill</div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm kiếm"
            allowClear
            suffix={<Search className="w-4 h-4 text-primary"/>}
            className="h-[40px] w-[280px] rounded-xl"
          />
          <Select
            value={status}
            onChange={(value) => { setPage(1); setStatus(value); }}
            className="h-[40px] w-[140px]"
            options={[{ value: "", label: "Mặc định" }, { value: "active", label: "Đang bật" }, { value: "disabled", label: "Đã tắt" }]}
          />
          <Button size="large" className="rounded-xl" icon={<History className="w-4 h-4"/>} onClick={() => navigate(LINK.SKILL_UPLOADS)}>
            Lịch sử upload
          </Button>
          <Dropdown menu={addMenu} trigger={["click"]} placement="bottomRight">
            <Button type="primary" size="large" className="rounded-xl" icon={<Plus className="w-4 h-4"/>}>Thêm mới</Button>
          </Dropdown>
          <div className="flex bg-card border border-solid border-border rounded-xl p-1">
            {[["grid", LayoutGrid], ["list", List]].map(([value, Icon]) => (
              <button
                key={value}
                onClick={() => changeView(value)}
                className={cn("w-8 h-8 rounded-lg border-0 flex items-center justify-center cursor-pointer",
                  view === value ? "bg-primary-100 text-primary" : "bg-transparent text-muted-foreground hover:bg-gray-50")}
              >
                <Icon className="w-4 h-4"/>
              </button>
            ))}
          </div>
        </div>
      </div>

      <QuotaBar quota={data.quota}/>

      {!loading && data.count === 0 ? (
        <div className="bg-card rounded-xl border border-solid border-border py-16">
          <Empty description={search || status ? "Không có skill phù hợp" : "Chưa có skill nào"}>
            {!search && !status && (
              <div className="flex gap-2 justify-center">
                <Button type="primary" className="rounded-xl" icon={<UploadCloud className="w-4 h-4"/>} onClick={() => setUploadOpen(true)}>
                  Upload file zip
                </Button>
                <Button className="rounded-xl" icon={<FilePlus2 className="w-4 h-4"/>} onClick={() => setOpenCreate(true)}>Tạo skill trống</Button>
              </div>
            )}
          </Empty>
        </div>
      ) : view === "grid" ? (
        <Spin spinning={loading}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 min-h-[120px]">
            {data.skills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                menuItems={menuFor(skill)}
                onOpen={() => openSkill(skill)}
                toggling={togglingId === skill.id}
                onToggleStatus={(checked) => toggleStatus(skill, checked)}
              />
            ))}
          </div>
        </Spin>
      ) : (
        <SkillTable skills={data.skills} loading={loading} onOpen={openSkill} onToggleStatus={toggleStatus}
                    togglingId={togglingId} onDeleted={load}/>
      )}

      {data.count > PAGE_SIZE && (
        <div className="flex justify-center">
          <Pagination current={page} pageSize={PAGE_SIZE} total={data.count} onChange={setPage} showSizeChanger={false}/>
        </div>
      )}

      <CreateSkillModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreated={(skill) => { setOpenCreate(false); navigate(LINK.SKILL_DETAIL.format(skill.id)); }}
      />
      <UploadSkillModal
        open={uploadOpen}
        onClose={() => { setUploadOpen(false); load(); }}
        onOpenSkill={(skillId) => { setUploadOpen(false); navigate(LINK.SKILL_DETAIL.format(skillId)); }}
      />
    </div>
  );
}
