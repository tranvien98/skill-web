import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe, logout as logoutApi } from "@services/Auth";
import { AUTH_EXPIRED_EVENT } from "@src/setup/axios";
import { LINK } from "@link";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      setUser(await getMe());
      return true;
    } catch {
      setUser(null);
      return false;
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      navigate(LINK.LOGIN, { replace: true });
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, [navigate]);

  const logout = useCallback(async () => {
    await logoutApi();
    setUser(null);
    navigate(LINK.LOGIN, { replace: true });
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, checking, loadUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
