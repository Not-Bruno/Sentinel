import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Container, ContainerStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CheckCircle2, HelpCircle, PowerOff, Trash2, XCircle } from "lucide-react";
import { getContainerLogo } from "@/components/logos";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ContainerCardProps {
  container: Container;
  onRemove: (containerId: string) => void;
}

const statusConfig: Record<ContainerStatus, { icon: React.ElementType, color: string, label: string }> = {
  running: { icon: CheckCircle2, color: 'text-success', label: 'Running' },
  stopped: { icon: PowerOff, color: 'text-muted-foreground', label: 'Stopped' },
  error: { icon: XCircle, color: 'text-destructive', label: 'Error' },
};

export function ContainerCard({ container, onRemove }: ContainerCardProps) {
  const { icon: Icon, color, label } = statusConfig[container.status] || { icon: HelpCircle, color: 'text-muted-foreground', label: 'Unknown' };
  const Logo = getContainerLogo(container.image);

  return (
    <TooltipProvider delayDuration={200}>
      <Card className={cn("group relative transition-all bg-card/50", {
        'border-success/50 hover:border-success': container.status === 'running',
        'border-destructive/50 hover:border-destructive': container.status === 'error',
        'hover:shadow-md': true
      })}>
        <CardHeader className="flex flex-row items-center justify-between p-3 space-y-0">
          <div className="flex items-center gap-3 overflow-hidden">
              <Logo className="w-6 h-6 flex-shrink-0" />
              <CardTitle className="text-sm font-medium truncate">{container.name}</CardTitle>
          </div>
          <Tooltip>
            <TooltipTrigger>
              <Icon className={cn("h-5 w-5", color)} />
            </TooltipTrigger>
            <TooltipContent>
              <p>{label}</p>
            </TooltipContent>
          </Tooltip>
        </CardHeader>
        <CardContent className="p-3 pt-0 text-xs text-muted-foreground">
          <p className="truncate">Status: {container.uptime}</p>
          <p className="truncate">Image: {container.image}</p>
        </CardContent>
         <Button size="icon" variant="ghost" className="absolute top-0.5 right-0.5 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onRemove(container.id)}>
              <Trash2 className="h-4 w-4 text-destructive"/>
              <span className="sr-only">Remove container</span>
          </Button>
      </Card>
    </TooltipProvider>
  );
}
