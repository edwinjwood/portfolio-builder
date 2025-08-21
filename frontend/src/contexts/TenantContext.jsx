import React, { createContext, useContext, useState, useEffect } from "react";

// TenantContext provides tenant and user role info throughout the app
export const TenantContext = createContext({
  tenant: null,
  user: null,
  setTenant: () => {},
  setUser: () => {},
});

export const useTenant = () => useContext(TenantContext);

const TENANT_KEY = 'pb:tenant';
const USER_KEY = 'pb:tenantUser';

export const TenantProvider = ({ children }) => {
  const [tenant, setTenantState] = useState(null);
  const [user, setUserState] = useState(null);

  // Restore from localStorage on mount
  useEffect(() => {
    const t = localStorage.getItem(TENANT_KEY);
    const u = localStorage.getItem(USER_KEY);
    if (t) setTenantState(JSON.parse(t));
    if (u) setUserState(JSON.parse(u));
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (tenant) localStorage.setItem(TENANT_KEY, JSON.stringify(tenant));
    else localStorage.removeItem(TENANT_KEY);
  }, [tenant]);
  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [user]);

  // Setters
  const setTenant = (t) => {
    setTenantState(t);
    if (!t) localStorage.removeItem(TENANT_KEY);
  };
  const setUser = (u) => {
    setUserState(u);
    if (!u) localStorage.removeItem(USER_KEY);
  };

  return (
    <TenantContext.Provider value={{ tenant, setTenant, user, setUser }}>
      {children}
    </TenantContext.Provider>
  );
};
