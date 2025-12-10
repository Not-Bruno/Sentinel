import Link from "next/link";
import { LineChart, ShieldCheck } from "lucide-react";
import { AddHostDialog } from "@/components/dashboard/add-host-dialog";
import { Logo } from "@/components/logo";
import { Button } from "../ui/button";
import { ThemeToggle } from "./theme-toggle";

interface HeaderProps {
  onAddHost: (host: { name: string; ipAddress: string; sshPort: number; }) => void;
}

export function Header({ onAddHost }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b shrink-0 bg-background sm:px-6 md:px-8">
      <div className="flex items-center gap-3">
        <Logo className="w-7 h-7" />
        <Link href="/" className="text-xl font-semibold tracking-tight font-headline">
          Sentinel
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/monitoring">
            <LineChart className="h-4 w-4" />
            <span className="sr-only">Monitoring</span>
          </Link>
        </Button>
         <Button variant="outline" size="icon" asChild>
          <Link href="/security">
            <ShieldCheck className="h-4 w-4" />
            <span className="sr-only">Security</span>
          </Link>
        </Button>
        <AddHostDialog onAddHost={onAddHost} />
        <ThemeToggle />
      </div>
    </header>
  );
}
