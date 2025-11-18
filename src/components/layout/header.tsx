import { AddHostDialog } from "@/components/dashboard/add-host-dialog";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "./theme-toggle";

interface HeaderProps {
  onAddHost: (host: { name: string; ipAddress: string; sshPort: number; }) => void;
}

export function Header({ onAddHost }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b shrink-0 bg-background sm:px-6 md:px-8">
      <div className="flex items-center gap-3">
        <Logo className="w-7 h-7" />
        <h1 className="text-xl font-semibold tracking-tight font-headline">
          Sentinel
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <AddHostDialog onAddHost={onAddHost} />
        <ThemeToggle />
      </div>
    </header>
  );
}
