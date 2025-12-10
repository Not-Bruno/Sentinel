'use client';

import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "./theme-toggle";
import { AddHostDialog } from "../dashboard/add-host-dialog";
import { useHosts } from "@/hooks/use-hosts";
import { DatabaseStatusIndicator } from "./database-status-indicator";

interface HeaderProps {
  children: React.ReactNode;
}

export function Header({ children }: HeaderProps) {
  const { dbStatus } = useHosts();
  
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b shrink-0 bg-background sm:px-6 md:px-8">
      <Link href="/" className="flex items-center gap-3">
        <Logo className="w-7 h-7" />
        <span className="text-xl font-semibold tracking-tight font-headline">
          Sentinel
        </span>
      </Link>
      
      <div className='flex-1 flex justify-center'>
        {children}
      </div>

      <div className="flex items-center gap-2">
        <DatabaseStatusIndicator status={dbStatus} />
        <AddHostDialog />
        <ThemeToggle />
      </div>
    </header>
  );
}
