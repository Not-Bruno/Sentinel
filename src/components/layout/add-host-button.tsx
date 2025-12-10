
'use client';

import { AddHostDialog } from "@/components/dashboard/add-host-dialog";
import { getSavedHosts, saveHosts } from "@/ai/flows/manage-hosts-flow";
import { Host } from "@/lib/types";
import { getHostData } from "@/ai/flows/get-host-containers-flow";
import { useRouter } from "next/navigation";

export function AddHostButton() {
    const router = useRouter();

    const addHost = async (data: { name: string; ipAddress: string; sshPort: number }) => {
        const newHost: Host = {
            id: `host-${Date.now()}`,
            ...data,
            status: 'online', // Assume online initially
            createdAt: Date.now(),
            containers: [],
            history: [],
        };
        
        const currentHosts = await getSavedHosts();
        
        // This is a temporary fix to show loading, ideally state management should handle this
        const optimisticHosts = [newHost, ...currentHosts];
        // Not waiting for saveHosts to finish to make UI faster
        saveHosts(optimisticHosts);

        const hostWithData = await getHostData({ hostId: newHost.id, ipAddress: newHost.ipAddress, sshPort: newHost.sshPort });
        
        const finalHosts = currentHosts.map(h => h.id === newHost.id ? hostWithData : h);
        await saveHosts(finalHosts);
        router.refresh();
  };

  return <AddHostDialog onAddHost={addHost} />;
}
