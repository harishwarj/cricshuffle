import { useEffect } from "react";

export interface ToastMsg {
  id: number;
  text: string;
  type: "success" | "error" | "info";
}

export function Toasts({
  toasts,
  onDismiss,
}: {
  toasts: ToastMsg[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[92%] max-w-md no-print">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMsg;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const id = setTimeout(() => onDismiss(toast.id), 2800);
    return () => clearTimeout(id);
  }, [toast.id, onDismiss]);

  const color =
    toast.type === "success"
      ? "bg-green-600"
      : toast.type === "error"
      ? "bg-red-600"
      : "bg-slate-800";

  return (
    <div
      className={`animate-toast ${color} text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg`}
    >
      {toast.text}
    </div>
  );
}

let counter = 0;
export function useToastPush(
  push: (t: ToastMsg) => void
): (text: string, type?: ToastMsg["type"]) => void {
  return (text, type = "info") =>
    push({ id: ++counter, text, type });
}
