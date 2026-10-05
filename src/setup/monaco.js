import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/editor/editor.worker?worker";
import JsonWorker from "monaco-editor/language/json/json.worker?worker";
import TypeScriptWorker from "monaco-editor/language/typescript/ts.worker?worker";
import HtmlWorker from "monaco-editor/language/html/html.worker?worker";
import CssWorker from "monaco-editor/language/css/css.worker?worker";

// Đăng ký đầy đủ các tính năng trước khi tạo editor, tránh thiếu service khi đổi ngôn ngữ.
// Editor và worker được phục vụ từ chính app, không chờ CDN bên ngoài.
self.MonacoEnvironment = {
  getWorker: (_moduleId, label) => {
    if (label === "json") return new JsonWorker();
    if (label === "typescript" || label === "javascript") return new TypeScriptWorker();
    if (label === "html" || label === "handlebars" || label === "razor") return new HtmlWorker();
    if (label === "css" || label === "scss" || label === "less") return new CssWorker();
    return new EditorWorker();
  },
};
loader.config({ monaco });
