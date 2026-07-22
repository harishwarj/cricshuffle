import { useState } from "react";
import { Shield, Swords } from "lucide-react";

type Mode = "alpha" | "superadmin";

const CREDS: Record<Mode, { u: string; p: string }> = {
  alpha: { u: "AlphaWarriors", p: "AlphaWarriors@2026" },
  superadmin: { u: "superadmin", p: "Qwerty123456" },
};

export function Login({
  onLogin,
}: {
  onLogin: (role: Mode) => void;
}) {
  const [mode, setMode] = useState<Mode>("alpha");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const c = CREDS[mode];
    if (username.trim() === c.u && password === c.p) {
      onLogin(mode);
    } else {
      setError("Invalid username or password");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-700 via-green-600 to-green-800 p-4">
      <div className="text-center mb-6 text-white">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-2">
          <span>🏏</span> Box Cricket Team Shuffler
        </h1>
        <p className="text-green-100 text-sm mt-1">
          Balanced teams, fair play, every tournament.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-pop">
        <div className="grid grid-cols-2 gap-2 mb-5 bg-green-50 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode("alpha");
              setError("");
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition ${
              mode === "alpha"
                ? "bg-green-600 text-white shadow"
                : "text-green-700"
            }`}
          >
            <Swords size={16} /> Alpha Warriors
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("superadmin");
              setError("");
            }}
            className={`relative flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg text-sm font-semibold transition ${
              mode === "superadmin"
                ? "bg-orange-500 text-white shadow"
                : "text-orange-600"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Shield size={16} /> Player
            </span>
            <span
              className={`text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded-full leading-none ${
                mode === "superadmin"
                  ? "bg-white/25 text-white"
                  : "bg-orange-100 text-orange-500"
              }`}
            >
              Coming Soon
            </span>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Username"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="••••••"
            />
          </div>
          {error && (
            <p className="text-red-600 text-xs font-medium">{error}</p>
          )}
          <button
            type="submit"
            className={`w-full py-2.5 rounded-lg font-semibold text-white transition ${
              mode === "alpha"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
