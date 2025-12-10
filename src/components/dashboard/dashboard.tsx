import type { Host } from "@/lib/types";
import { HostCard } from "./host-card";

interface DashboardProps {
  hosts: Host[];
  onRemoveHost: (hostId: string) => void;
  onRemoveContainer: (hostId: string, containerId: string) => void;
}

export function Dashboard({ hosts, onRemoveHost, onRemoveContainer }: DashboardProps) {
  if (!hosts || hosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full rounded-lg border-2 border-dashed bg-card py-12 text-center text-muted-foreground mt-8">
        <h2 className="text-2xl font-semibold">Keine Hosts werden überwacht.</h2>
        <p className="mt-2">Klicke "Host hinzufügen" in der Navigation, um einen neuen Server zu überwachen.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
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
    </div>
  );
}

    