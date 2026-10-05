// Khớp app/modules/skill_agent/constants.py của backend
export const SKILL = {
  MAX_ZIP_SIZE: 50 * 1024 ** 2,
  MAX_EDITABLE_SIZE: 1024 ** 2,
  EDITABLE_EXTS: [".txt", ".md", ".js", ".py", ".ts"],
  NAME_PATTERN: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  NAME_MAX: 64,
  DESCRIPTION_MAX: 1024,
  SKILL_MD: "SKILL.md",
  POLL_INTERVAL_MS: 2000,
};

export const UPLOAD_RUNNING = ["pending", "scanning", "applying"];

export const SIDER_WIDTH = 256;
