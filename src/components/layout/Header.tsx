"use client";

import { Bell, Menu, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/95 backdrop-blur px-4">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden shrink-0"
        onClick={onMenuToggle}
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1" />

      <button
        type="button"
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500">
          <ShieldCheck className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="hidden sm:flex flex-col items-start">
          <span className="text-sm font-medium leading-tight">Administrateur</span>
          <span className="text-[10px] text-muted-foreground">Smart Campus</span>
        </div>
      </div>
    </header>
  );
}
