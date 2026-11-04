"use client";

import { useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
}

export default function Toast({ message, type = "success", onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // Auto close after 4 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-20 left-1/2 z-[100] -translate-x-1/2 animate-fade-up sm:bottom-6">
      <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl ${
        type === "success" 
          ? "border-wb-primary/30 bg-wb-surface text-white" 
          : "border-wb-danger/30 bg-wb-surface text-white"
      }`}>
        {type === "success" ? (
          <CheckCircle2 className="h-5 w-5 text-wb-primary" />
        ) : (
          <AlertCircle className="h-5 w-5 text-wb-danger" />
        )}
        <p className="text-sm font-medium">{message}</p>
        <button onClick={onClose} className="ml-2 text-wb-muted hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
