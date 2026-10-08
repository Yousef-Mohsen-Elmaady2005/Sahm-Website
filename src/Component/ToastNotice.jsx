import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";

export default function ToastNotice() {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);
  const timers = useRef(new Map());

  useEffect(() => {
    const activeTimers = timers.current;
    const onToast = (event) => {
      const id = ++nextId.current;
      setToasts((current) => [...current, { ...event.detail, id, visible: false }]);
      window.requestAnimationFrame(() => {
        setToasts((current) => current.map((toast) => toast.id === id ? { ...toast, visible: true } : toast));
      });
      const fadeTimer = window.setTimeout(() => {
        setToasts((current) => current.map((toast) => toast.id === id ? { ...toast, visible: false } : toast));
      }, 2800);
      const removeTimer = window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
        activeTimers.delete(id);
      }, 3400);
      activeTimers.set(id, [fadeTimer, removeTimer]);
    };
    window.addEventListener("sahm-toast", onToast);
    return () => {
      window.removeEventListener("sahm-toast", onToast);
      activeTimers.forEach((toastTimers) => toastTimers.forEach(window.clearTimeout));
      activeTimers.clear();
    };
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[10000] flex max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] flex-col gap-2 overflow-y-auto sm:right-6 sm:w-auto sm:min-w-[340px]">
      {toasts.map((toast) => {
        const isError = toast.type === "error";
        return (
          <div
            key={toast.id}
            role={isError ? "alert" : "status"}
            className={`flex min-h-14 max-w-full items-center gap-3 rounded-md px-5 py-3 text-sm font-medium text-white shadow-lg transition-all duration-500 ease-out sm:text-base ${isError ? "bg-red-600" : "bg-[#69ae72]"} ${toast.visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"}`}
          >
            <FontAwesomeIcon icon={isError ? faXmark : faCheck} className="shrink-0 text-2xl" aria-hidden="true" />
            <span>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}
