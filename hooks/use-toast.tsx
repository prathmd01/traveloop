"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const TOAST_LIMIT = 5;

export type ToastVariant = "default" | "destructive";

export type ToastData = {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
};

type Action =
  | { type: "ADD"; toast: ToastData }
  | { type: "DISMISS"; id: string };

function genId() {
  return Math.random().toString(36).slice(2);
}

const ToastStateContext = React.createContext<{
  toasts: ToastData[];
  toast: (t: Omit<ToastData, "id">) => void;
  dismiss: (id: string) => void;
} | null>(null);

function reducer(state: ToastData[], action: Action) {
  switch (action.type) {
    case "ADD":
      return [action.toast, ...state].slice(0, TOAST_LIMIT);
    case "DISMISS":
      return state.filter((t) => t.id !== action.id);
    default:
      return state;
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, dispatch] = React.useReducer(reducer, []);

  const dismiss = React.useCallback((id: string) => dispatch({ type: "DISMISS", id }), []);

  const toast = React.useCallback(
    (t: Omit<ToastData, "id">) => {
      const id = genId();
      dispatch({ type: "ADD", toast: { ...t, id } });
      window.setTimeout(() => dispatch({ type: "DISMISS", id }), 4500);
    },
    [dispatch],
  );

  const value = React.useMemo(
    () => ({ toasts, toast, dismiss }),
    [toasts, toast, dismiss],
  );

  return <ToastStateContext.Provider value={value}>{children}</ToastStateContext.Provider>;
}

export function useToast() {
  const ctx = React.useContext(ToastStateContext);
  if (!ctx) {
    return { toast: () => {}, dismiss: () => {} };
  }
  return { toast: ctx.toast, dismiss: ctx.dismiss };
}

export function Toaster() {
  const ctx = React.useContext(ToastStateContext);
  if (!ctx) return null;
  const { toasts, dismiss } = ctx;
  return (
    <div className="pointer-events-none fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:bottom-auto sm:right-0 sm:top-0 sm:flex-col md:max-w-[420px]">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <motion.div
            layout
            key={t.id}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className={cn(
              "pointer-events-auto relative overflow-hidden rounded-2xl border bg-background/95 px-4 py-3 shadow-xl backdrop-blur",
              t.variant === "destructive" &&
                "border-destructive/30 bg-destructive text-destructive-foreground",
            )}
          >
            <button
              type="button"
              className="absolute right-2 top-2 rounded-full p-1 opacity-70 hover:opacity-100"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
            {t.title ? <div className="pr-6 font-semibold">{t.title}</div> : null}
            {t.description ? (
              <div className="mt-1 text-sm opacity-90">{t.description}</div>
            ) : null}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
