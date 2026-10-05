import React from "react";
import { Layout } from "antd";
import { Outlet, useLocation } from "react-router-dom";
import MenuUser from "./MenuUser";
import ErrorBoundary from "@component/ErrorBoundary";
import { SIDER_WIDTH } from "@constant";

const { Content } = Layout;

// Rút gọn từ owlla_frontend/src/app/layout/index.js (chỉ chế độ user)
export default function MasterLayout() {
  const location = useLocation();
  return (
    <Layout className="h-screen">
      <MenuUser width={SIDER_WIDTH}/>
      <Content className="overflow-auto">
        <div className="w-full h-full !bg-background">
          <ErrorBoundary key={location.pathname}><Outlet/></ErrorBoundary>
        </div>
      </Content>
    </Layout>
  );
}
