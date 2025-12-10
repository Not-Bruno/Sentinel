import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Host, HostStatus, Container } from "@/lib/types";
import { cn, formatUptime } from "@/lib/utils";
import { CheckCircle2, ServerCrash, Trash2, XCircle, Cpu, MemoryStick, HardDrive, PowerOff } from "lucide-react";
import { getContainerLogo } from "@/components/logos";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { ScrollArea } from "../ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface HostCardProps {
  host: Host;
  onRemoveHost: (hostId: string) => void;
}

const statusConfig: Record<HostStatus, { icon: React.ElementType, color: string, label: string }> = {
  online: { icon: CheckCircle2, color: 'text-success', label: 'Online' },
  offline: { icon: XCircle, color: 'text-destructive', label: 'Offline' },
};

const containerStatusConfig: Record<Container['status'], { icon: React.ElementType, color: string, label: string }> = {
  running: { icon: CheckCircle2, color: 'text-success', label: 'Running' },
  stopped: { icon: PowerOff, color: 'text-muted-foreground', label: 'Stopped' },
  error: { icon: XCircle, color: 'text-destructive', label: 'Error' },
};

const ResourceBar = ({ 
  icon: Icon, 
  label, 
  value, 
  color,
  used,
  total,
  unit = 'GB'
}: { 
  icon: React.ElementType, 
  label: string, 
  value?: number, 
  color: string,
  used?: number,
  total?: number,
  unit?: string,
}) => {
  const displayValue = value !== undefined ? `${value.toFixed(0)}%` : 'N/A';
  
  const absoluteValue = used !== undefined && total !== undefined
    ? `(${used.toFixed(1)} / ${total.toFixed(1)} ${unit})`
    : '';

  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <div className="flex-1">
        <div className="flex justify-between items-baseline text-xs mb-1">
          <span className="font-medium text-muted-foreground">{label}</span>
          <div className="font-mono">
            <span>{displayValue} </span>
            <span className="text-muted-foreground">{absoluteValue}</span>
          </div>
        </div>
        <Progress value={value} indicatorClassName={color} />
      </div>
    </div>
  );
};

const CompactContainerItem = ({ container }: { container: Container }) => {
  const Logo = getContainerLogo(container.image);
  const StatusIcon = containerStatusConfig[container.status]?.icon ?? ServerCrash;
  const statusColor = containerStatusConfig[container.status]?.color ?? 'text-muted-foreground';

  return (
    <div className="flex items-center gap-3 p-2 rounded-md transition-colors hover:bg-accent">
      <Logo className="w-5 h-5 flex-shrink-0 text-muted-foreground" />
      <div className="flex-1 overflow-hidden">
        <p className="text-sm font-medium truncate">{container.name}</p>
      </div>
      <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
        {container.status === 'running' && (
          <>
            <div className="flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              <span>{container.cpuUsage?.toFixed(1) ?? 'N/A'}%</span>
            </div>
            <div className="flex items-center gap-1">
              <MemoryStick className="w-3 h-3" />
              <span>{container.memoryUsage?.toFixed(1) ?? 'N/A'}%</span>
            </div>
          </>
        )}
      </div>
       <Tooltip>
        <TooltipTrigger>
           <StatusIcon className={cn("w-5 h-5 flex-shrink-0", statusColor)} />
        </TooltipTrigger>
        <TooltipContent>
          <p className="capitalize">{container.status}</p>
          <p className="text-xs text-muted-foreground">{container.uptime}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

export function HostCard({ host, onRemoveHost }: HostCardProps) {
  const { icon: Icon, color, label } = statusConfig[host.status];
  
  return (
    <TooltipProvider>
      <Card className={cn("flex flex-col rounded-lg border-2 bg-card transition-shadow hover:shadow-xl", {
        'border-destructive/40 bg-destructive/5': host.status === 'offline',
        'border-transparent': host.status !== 'offline',
      })}>
        <CardHeader className="relative flex-row items-start justify-between pb-4">
          <div className="flex items-start gap-4">
            <Icon className={cn("h-7 w-7 flex-shrink-0", color)} />
            <div>
              <CardTitle className="text-lg font-semibold font-headline">{host.name}</CardTitle>
              <CardDescription className="text-sm">{host.ipAddress !== '0.0.0.1' ? host.ipAddress : 'Local'} - {label}</CardDescription>
              <p className="text-xs text-muted-foreground mt-1">Überwacht seit: {formatUptime(host.createdAt)}</p>
            </div>
          </div>
          {host.ipAddress !== '0.0.0.1' && (
            <div className="absolute top-2 right-2">
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => onRemoveHost(host.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive"/>
                    <span className="sr-only">Remove host</span>
                </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
          {host.status === 'online' && (
            <div className="space-y-3 px-2">
              <ResourceBar icon={Cpu} label="CPU" value={host.cpuUsage} color="bg-cyan-500" />
              <ResourceBar 
                icon={MemoryStick} 
                label="RAM" 
                value={host.memoryUsage} 
                color="bg-amber-500"
                used={host.memoryUsedGb}
                total={host.memoryTotalGb}
              />
              <ResourceBar 
                icon={HardDrive} 
                label="Disk" 
                value={host.diskUsage} 
                color="bg-violet-500"
                used={host.diskUsedGb}
                total={host.diskTotalGb}
              />
            </div>
          )}

          {host.containers && host.containers.length > 0 ? (
            <div className="flex-1 flex flex-col min-h-0 mt-2">
              <p className="px-2 text-xs font-semibold text-muted-foreground mb-1">CONTAINER ({host.containers.length})</p>
              <ScrollArea className="flex-1 -mx-2">
                  <div className="space-y-1 px-2 py-1">
                    {host.containers.map((container) => (
                      <CompactContainerItem 
                        key={container.id} 
                        container={container} 
                      />
                    ))}
                  </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="flex-1 text-center flex flex-col items-center justify-center rounded-md border-2 border-dashed text-muted-foreground p-8 h-full mt-4">
              <ServerCrash className="w-10 h-10 mb-2"/>
              <p className="font-medium">Keine Container</p>
              <p className="text-xs">Auf diesem Host laufen keine Container.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
