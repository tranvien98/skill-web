import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Spin } from "antd";

import { LINK } from "@link";
import { useAuth } from "@app/auth/AuthContext";
import Layout from "@app/layout";
import Login from "@app/pages/Login";
import Placeholder from "@app/pages/Placeholder";
import SkillList from "@app/pages/Skill";
import UploadHistory from "@app/pages/Skill/UploadHistory";
import DetailSkill from "@app/pages/Skill/DetailSkill";

function RequireAuth({ children }) {
  const { user, checking } = useAuth();
  const location = useLocation();
  if (checking) {
    return <div className="h-screen flex items-center justify-center"><Spin size="large"/></div>;
  }
  if (!user) {
    return <Navigate to={LINK.LOGIN} replace state={{ from: location.pathname + location.search }}/>;
  }
  return children;
}

// Các mục menu ngoài Skill chỉ là trang giữ chỗ trong prototype
const PLACEHOLDERS = [LINK.BOT, LINK.MCP, LINK.WORKFLOW, LINK.TRIGGER, LINK.KNOWLEDGE, LINK.EVALUATIONS, LINK.MODEL_MANAGEMENT];

export default function AppRoutes() {
  return (
    <Routes>
      <Route path={LINK.LOGIN} element={<Login/>}/>
      <Route element={<RequireAuth><Layout/></RequireAuth>}>
        <Route path={LINK.SKILL} element={<SkillList/>}/>
        <Route path={LINK.SKILL_UPLOADS} element={<UploadHistory/>}/>
        <Route path={LINK.SKILL_DETAIL.format(":id")} element={<DetailSkill/>}/>
        {PLACEHOLDERS.map((path) => <Route key={path} path={path} element={<Placeholder/>}/>)}
        <Route path="*" element={<Navigate to={LINK.SKILL} replace/>}/>
      </Route>
    </Routes>
  );
}
