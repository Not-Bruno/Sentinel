import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Host, HostStatus } from "@/lib/types";
import { cn, formatUptime } from "@/lib/utils";
import { CheckCircle2, ServerCrash, Trash2, XCircle, Cpu, MemoryStick, HardDrive } from "lucide-react";
import { ContainerCard } from "./container-card";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";

interface HostCardProps {
  host: Host;
  onRemoveHost: (hostId: string) => void;
  onRemoveContainer: (hostId: string, containerId: string) => void;
}

const statusConfig: Record<HostStatus, { icon: React.ElementType, color: string, label: string }> = {
  online: { icon: CheckCircle2, color: 'text-success', label: 'Online' },
  offline: { icon: XCircle, color: 'text-destructive', label: 'Offline' },
};

const ResourceBar = ({ icon: Icon, label, value, color }: { icon: React.ElementType, label: string, value?: number, color: string }) => {
  const displayValue = value !== undefined ? `${value.toFixed(0)}%` : 'N/A';
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="font-medium text-muted-foreground">{label}</span>
          <span className="font-mono">{displayValue}</span>
        </div>
        <Progress value={value} indicatorClassName={color} />
      </div>
    </div>
  );
};

export function HostCard({ host, onRemoveHost, onRemoveContainer }: HostCardProps) {
  const { icon: Icon, color, label } = statusConfig[host.status];
  
  return (
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
          <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-8 w-8 rounded-full" onClick={() => onRemoveHost(host.id)}>
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive"/>
            <span className="sr-only">Remove host</span>
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        {host.status === 'online' && (
          <div className="space-y-3 px-2">
            <ResourceBar icon={Cpu} label="CPU" value={host.cpuUsage} color="bg-cyan-500" />
            <ResourceBar icon={MemoryStick} label="RAM" value={host.memoryUsage} color="bg-amber-500" />
            <ResourceBar icon={HardDrive} label="Disk" value={host.diskUsage} color="bg-violet-500" />
          </div>
        )}

        {host.containers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {host.containers.map((container) => (
              <ContainerCard 
                key={container.id} 
                container={container} 
                onRemove={(containerId) => onRemoveContainer(host.id, containerId)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center flex flex-col items-center justify-center rounded-md border-2 border-dashed text-muted-foreground p-8 h-full">
            <ServerCrash className="w-10 h-10 mb-2"/>
            <p className="font-medium">Keine Container</p>
            <p className="text-xs">Auf diesem Host laufen keine Container.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
