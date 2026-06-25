"use client";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import type { UserRole } from "@/types";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  role: UserRole;
}

export function MobileNav({ open, onClose, role }: MobileNavProps) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="left" className="w-64 p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="h-full">
          <Sidebar role={role} onClose={onClose} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
