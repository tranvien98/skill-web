import React, { useState } from "react";
import { Button, Form, Input } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { LINK } from "@link";
import { login, verifyCode2fa } from "@services/Auth";
import { apiError } from "@src/setup/axios";
import { useAuth } from "@app/auth/AuthContext";
import LOGO from "@src/asset/Logo/logo.png";

/** Đăng nhập tối giản: username/email + mật khẩu, thêm bước mã 2FA nếu tài khoản bật. */
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loadUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [twoFactorUserId, setTwoFactorUserId] = useState(null);

  const finish = async () => {
    if (await loadUser()) {
      navigate(location.state?.from || LINK.SKILL, { replace: true });
    } else {
      toast.error("Đăng nhập thành công nhưng không đọc được thông tin tài khoản");
    }
  };

  const onLogin = async ({ username, password }) => {
    setLoading(true);
    try {
      const result = await login(username.trim(), password);
      if (result?.two_factor) {
        setTwoFactorUserId(result.user_id);
      } else if (result?.success) {
        await finish();
      }
    } catch (error) {
      toast.error(apiError(error).message);
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async ({ otp }) => {
    setLoading(true);
    try {
      await verifyCode2fa(otp.trim(), twoFactorUserId);
      await finish();
    } catch (error) {
      toast.error(apiError(error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(168,76%,96%)] via-white to-[hsl(210,50%,98%)] p-4">
      <div className="w-full max-w-[420px] bg-white rounded-2xl border border-solid border-border shadow-xl p-8">
        <div className="flex flex-col items-center mb-6">
          <img src={LOGO} width={56} height={56} alt="Owllee Agent"/>
          <div className="text-2xl font-bold mt-3">Owllee Agent</div>
          <div className="text-muted-foreground text-sm mt-1">
            {twoFactorUserId ? "Nhập mã xác thực 2 lớp" : "Đăng nhập để quản lý Skill"}
          </div>
        </div>

        {twoFactorUserId ? (
          <Form layout="vertical" onFinish={onVerify} requiredMark={false}>
            <Form.Item name="otp" label="Mã xác thực" rules={[{ required: true, message: "Nhập mã xác thực" }]}>
              <Input size="large" className="rounded-xl" autoFocus inputMode="numeric" maxLength={8}/>
            </Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading} className="rounded-xl">Xác nhận</Button>
            <Button type="link" block className="mt-2" onClick={() => setTwoFactorUserId(null)}>Quay lại</Button>
          </Form>
        ) : (
          <Form layout="vertical" onFinish={onLogin} requiredMark={false}>
            <Form.Item name="username" label="Tên đăng nhập hoặc email" rules={[{ required: true, message: "Nhập tên đăng nhập" }]}>
              <Input size="large" className="rounded-xl" autoFocus autoComplete="username"/>
            </Form.Item>
            <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: "Nhập mật khẩu" }]}>
              <Input.Password size="large" className="rounded-xl" autoComplete="current-password"/>
            </Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading} className="rounded-xl">Đăng nhập</Button>
          </Form>
        )}
      </div>
    </div>
  );
}
