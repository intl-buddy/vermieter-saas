"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Toast-Container (Sonner), an das tefter-Theme angepasst. Wird einmal im
 * Root-Layout eingebunden; Toasts werden über `toast()` aus „sonner" ausgelöst.
 */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-foreground group-[.toaster]:border-neutral-200 group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-neutral-100 group-[.toast]:text-neutral-700",
          error:
            "group-[.toaster]:!bg-danger-50 group-[.toaster]:!text-danger-700 group-[.toaster]:!border-danger-200",
          success:
            "group-[.toaster]:!bg-success-50 group-[.toaster]:!text-success-700",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
