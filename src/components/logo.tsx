import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return <ShieldCheck className={cn("w-8 h-8 text-primary", className)} />;
}
