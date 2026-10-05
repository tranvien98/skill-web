export const API = {
  LOGIN: "/api/login",
  VERIFY_2FA: "/api/verify-code-2fa",
  REFRESH: "/api/refresh",
  LOGOUT: "/api/logout",
  ME: "/api/users/me",

  SKILLS: "/api/skills",
  SKILL_ID: "/api/skills/{0}",
  SKILL_EXPORT: "/api/skills/{0}/export",
  SKILL_TREE: "/api/skills/{0}/tree",
  SKILL_FILE_CONTENT: "/api/skills/{0}/files/content",
  SKILL_FILE_RAW: "/api/skills/{0}/files/raw",
  SKILL_FILES: "/api/skills/{0}/files",
  SKILL_FILE_MOVE: "/api/skills/{0}/files/move",

  SKILL_UPLOAD: "/api/skills/upload",
  SKILL_UPLOADS: "/api/skills/uploads",
  SKILL_UPLOAD_ID: "/api/skills/uploads/{0}",
  SKILL_UPLOAD_OVERWRITE: "/api/skills/uploads/{0}/overwrite",
  SKILL_UPLOAD_CANCEL: "/api/skills/uploads/{0}/cancel",
};
