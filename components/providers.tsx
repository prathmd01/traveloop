"use client";

import * as React from "react";
import { AuthProvider } from "@/hooks/use-auth";
import { ToastProvider, Toaster } from "@/hooks/use-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </ToastProvider>
  );
}
