import React from "react";
import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";
import { LINK } from "@link";

export default function Placeholder() {
  const navigate = useNavigate();
  return (
    <div className="h-full flex items-center justify-center">
      <Result
        status="info"
        title="Không thuộc phạm vi prototype"
        subTitle="Prototype này chỉ dựng chức năng Skill. Các trang khác có trong owlla_frontend."
        extra={<Button type="primary" className="rounded-xl" onClick={() => navigate(LINK.SKILL)}>Mở Skill</Button>}
      />
    </div>
  );
}
