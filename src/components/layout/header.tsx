import Link from "next/link";
import { AddHostDialog } from "@/components/dashboard/add-host-dialog";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "./theme-toggle";
import { getSavedHosts, saveHosts } from "@/ai/flows/manage-hosts-flow";
import { Host } from "@/lib/types";
import { AddHostButton } from "./add-host-button";

interface HeaderProps {
  children: React.ReactNode;
}

export function Header({ children }: HeaderProps) {
  
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b shrink-0 bg-background sm:px-6 md:px-8">
      <div className="flex items-center gap-3">
        <Logo className="w-7 h-7" />
        <Link href="/" className="text-xl font-semibold tracking-tight font-headline">
          Sentinel
        </Link>
      </div>
      
      {children}

      <div className="flex items-center gap-2">
        <AddHostButton />
        <ThemeToggle />
      </div>
    </header>
  );
}
