import { LogOut } from "lucide-react";

export function Header({
  onLogout,
  showLogout,
}: {
  onLogout?: () => void;
  showLogout?: boolean;
}) {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <header className="bg-gradient-to-r from-green-700 to-green-600 text-white shadow-md no-print">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <span>🏏</span> Box Cricket Team Shuffler
          </h1>
          <p className="text-xs sm:text-sm text-green-100">{today}</p>
        </div>
        {showLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 transition px-3 py-1.5 rounded-lg text-sm font-medium"
          >
            <LogOut size={16} /> Logout
          </button>
        )}
      </div>
    </header>
  );
}
