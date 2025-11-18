import type { Host } from "@/lib/types";
import { HostCard } from "./host-card";

interface DashboardProps {
  hosts: Host[];
  onRemoveHost: (hostId: string) => void;
  onRemoveContainer: (hostId: string, containerId: string) => void;
}

export function Dashboard({ hosts, onRemoveHost, onRemoveContainer }: DashboardProps) {
  if (hosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full rounded-lg border-2 border-dashed bg-card py-12 text-center text-muted-foreground">
        <h2 className="text-2xl font-semibold">No hosts are being monitored.</h2>
        <p className="mt-2">Click "Add Host" to start monitoring a new server.</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3">
      {hosts.map(host => (
        <HostCard 
          key={host.id} 
          host={host} 
          onRemoveHost={onRemoveHost}
          onRemoveContainer={onRemoveContainer} 
        />
      ))}
    </div>
  );
}
