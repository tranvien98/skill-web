import React, { useState } from "react";
import { Button, Form, Input, Modal } from "antd";
import { FilePlus2 } from "lucide-react";
import { toast } from "react-toastify";

import { SKILL } from "@constant";
import { createSkill } from "@services/Skills";
import { apiError } from "@src/setup/axios";
import { nameError } from "./utils";

/** Modal kiểu "Tạo kiến thức": tạo skill trống, backend sinh SKILL.md mẫu */
export default function CreateSkillModal({ open, onClose, onCreated }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const name = Form.useWatch("name", form) || "";

  const submit = async ({ name, description }) => {
    setLoading(true);
    try {
      const skill = await createSkill(name, description.trim());
      toast.success(`Đã tạo skill ${skill.name}`);
      form.resetFields();
      onCreated(skill);
    } catch (error) {
      const err = apiError(error);
      if (err.code === "name_taken") {
        form.setFields([{ name: "name", errors: ["Bạn đã có skill cùng tên"] }]);
      } else {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      destroyOnHidden
      width={560}
      title={<span className="flex items-center gap-2"><FilePlus2 className="w-5 h-5 text-primary"/>Tạo skill trống</span>}
      footer={[
        <Button key="cancel" onClick={onClose}>Hủy</Button>,
        <Button key="ok" type="primary" loading={loading} onClick={() => form.submit()}>Tạo skill</Button>,
      ]}
    >
      <Form form={form} layout="vertical" onFinish={submit} requiredMark className="mt-4">
        <Form.Item
          name="name"
          label="Tên skill (name)"
          extra={name && !nameError(name) ? <span>Thư mục: <code>{name}/SKILL.md</code></span> : "Theo chuẩn agentskills.io, ví dụ pdf-processing"}
          normalize={(value) => (value || "").toLowerCase()}
          rules={[{ validator: (_, value) => (nameError(value) ? Promise.reject(nameError(value)) : Promise.resolve()) }]}
        >
          <Input showCount maxLength={SKILL.NAME_MAX} placeholder="pdf-processing" className="font-mono"/>
        </Form.Item>
        <Form.Item
          name="description"
          label="Mô tả (description)"
          extra={<div className="pr-20">Skill làm gì và khi nào agent nên dùng. Agent đọc mô tả này để chọn skill.</div>}
          rules={[{ required: true, whitespace: true, message: "Nhập mô tả" }]}
        >
          <Input.TextArea showCount maxLength={SKILL.DESCRIPTION_MAX} autoSize={{ minRows: 3, maxRows: 8 }}
                          placeholder="Trích xuất văn bản và bảng từ PDF. Dùng khi người dùng nhắc tới file PDF."/>
        </Form.Item>
      </Form>
    </Modal>
  );
}
