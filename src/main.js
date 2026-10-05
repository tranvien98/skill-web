import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import { ToastContainer } from "react-toastify";
import dayjs from "dayjs";
import "dayjs/locale/vi";

import "@src/common/prototype";
import i18n from "@src/translations/i18n";
import { setupAxios } from "@src/setup/axios";
import { AuthProvider } from "@app/auth/AuthContext";
import AppRoutes from "@app/routing/AppRoutes";

import "@app/styles/tailwind.css";
import "@app/styles/main.scss";
import "react-toastify/dist/ReactToastify.css";

dayjs.locale("vi");
setupAxios();

// Data router để useBlocker chặn cả điều hướng nội bộ và Back/Forward.
const router = createBrowserRouter([{
  path: "*",
  element: (
    <AuthProvider>
      <ToastContainer pauseOnFocusLoss={false} icon={false} position="top-right" autoClose={3000}/>
      <AppRoutes/>
    </AuthProvider>
  ),
}]);

createRoot(document.getElementById("root")).render(
  <ConfigProvider
    locale={viVN}
    theme={{
      token: {
        colorPrimary: "#16a286",
        colorInfo: "#16a286",
      },
    }}
  >
    <I18nextProvider i18n={i18n}>
      <RouterProvider router={router}/>
    </I18nextProvider>
  </ConfigProvider>,
);
