import { useEffect, useState } from "react";
import { Header } from "./Header";
import { db } from "../db";
import { Power } from "lucide-react";

export function SuperAdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    db.getSpecialAssignment()
      .then((s) => setEnabled(s.enabled))
      .catch((e) => setError(e.message));
  }, []);

  async function toggle() {
    if (enabled === null || saving) return;
    setSaving(true);
    const next = !enabled;
    try {
      await db.setSpecialEnabled(next);
      setEnabled(next);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header onLogout={onLogout} showLogout />
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-2xl shadow-md p-8 sm:p-12 mt-6">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-orange-100 text-orange-500 mb-4">
              <Power size={26} />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">
              Special Team Assignment
            </h2>
            <p className="text-sm text-slate-500 mb-6 max-w-sm">
              When enabled, the next shuffle from Alpha Warriors will place the
              forced players into {`Harishwar's`} team.
            </p>

            {error && (
              <p className="text-red-600 text-xs mb-4">{error}</p>
            )}

            {enabled === null ? (
              <div className="h-9 w-16 rounded-full bg-slate-200 animate-pulse" />
            ) : (
              <button
                onClick={toggle}
                disabled={saving}
                className={`relative inline-flex h-9 w-16 items-center rounded-full transition disabled:opacity-60 ${
                  enabled ? "bg-orange-500" : "bg-slate-300"
                }`}
                aria-pressed={enabled}
              >
                <span
                  className={`inline-block h-7 w-7 transform rounded-full bg-white shadow transition ${
                    enabled ? "translate-x-8" : "translate-x-1"
                  }`}
                />
              </button>
            )}

            <p className="text-xs font-semibold mt-3 text-slate-600">
              {enabled === null
                ? "Loading…"
                : enabled
                ? "Special assignment is ON"
                : "Special assignment is OFF"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
