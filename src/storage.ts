export function uid(): string {
  return (
    Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
  );
}

const ROLE_KEY = "bcs_role";

export const storage = {
  getRole: (): "alpha" | "superadmin" | null => {
    try {
      const r = localStorage.getItem(ROLE_KEY);
      return r === "alpha" || r === "superadmin" ? r : null;
    } catch {
      return null;
    }
  },
  setRole: (r: "alpha" | "superadmin" | null) => {
    try {
      if (r) localStorage.setItem(ROLE_KEY, r);
      else localStorage.removeItem(ROLE_KEY);
    } catch {
      /* ignore */
    }
  },
};
