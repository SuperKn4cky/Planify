"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle } from "lucide-react";

type ConfirmDialogProps = {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: "default" | "danger";
    icon?: React.ReactNode;
};

export function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = "Confirmer",
    cancelLabel = "Annuler",
    tone = "default",
    icon,
}: ConfirmDialogProps) {
    const confirmRef = useRef<HTMLButtonElement | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        if (open) {
            document.addEventListener("keydown", onKey);
            requestAnimationFrame(() => confirmRef.current?.focus());
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    if (!open) return null;

    const confirmClasses =
        tone === "danger"
            ? "bg-[#DC2626] hover:bg-[#B91C1C] text-white"
            : "bg-[#2563EB] hover:bg-[#1D4ED8] text-white";

    const iconNode =
        icon ??
        (tone === "danger" ? (
            <AlertTriangle className="h-5 w-5 text-[#d9393a]" />
        ) : null);

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
        >
            <div
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                ref={panelRef}
                className="relative w-full max-w-md rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-xl text-[#0F172A]"
            >
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-3 top-3 rounded-md p-1 text-[#0F172A] hover:bg-[#ECEFED]"
                    aria-label="Fermer"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="flex items-start gap-3">
                    {iconNode}
                    <div>
                        <h2
                            id="confirm-dialog-title"
                            className="text-lg font-semibold text-[#0F172A]"
                        >
                            {title}
                        </h2>
                        {description ? (
                            <p className="mt-1 text-sm text-[#6B7280]">
                                {description}
                            </p>
                        ) : null}
                    </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-10 rounded-lg border border-[#E5E7EB] px-4 text-[15px] text-[#0F172A] hover:bg-[#ECEFED]"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        ref={confirmRef}
                        onClick={onConfirm}
                        className={`h-10 rounded-lg px-4 text-[15px] font-medium ${confirmClasses}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
