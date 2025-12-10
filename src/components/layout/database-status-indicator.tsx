"use client";
import type { DatabaseStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Database, Wifi, WifiOff } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


interface DatabaseStatusIndicatorProps {
  status: DatabaseStatus;
}

const statusConfig: Record<DatabaseStatus, { label: string; color: string; icon: React.ElementType }> = {
    connected: { label: 'Verbunden', color: 'bg-green-500', icon: Database },
    disconnected: { label: 'Getrennt', color: 'bg-yellow-500', icon: WifiOff },
    error: { label: 'Fehler', color: 'bg-red-500', icon: WifiOff }
}

export function DatabaseStatusIndicator({ status }: DatabaseStatusIndicatorProps) {
    const { label, color, icon: Icon } = statusConfig[status];

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full animate-pulse", color)} />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Datenbank: {label}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
