import axios from "axios";
import { API } from "@api";

export async function login(username, password) {
  const { data } = await axios.post(API.LOGIN, { username, password });
  return data;   // {success, two_factor, user_id}
}

export async function verifyCode2fa(otp, userId) {
  const { data } = await axios.post(API.VERIFY_2FA, { otp, user_id: userId });
  return data;
}

export async function logout() {
  try {
    await axios.post(API.LOGOUT);
  } catch {
    // cookie hết hạn thì coi như đã đăng xuất
  }
}

export async function getMe() {
  const { data } = await axios.get(API.ME);
  return data;
}
