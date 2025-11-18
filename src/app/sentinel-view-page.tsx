"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

import { Header } from "@/components/layout/header";
import { Dashboard } from "@/components/dashboard/dashboard";
import type { Host, Container } from "@/lib/types";
import { INITIAL_HOSTS } from "@/lib/mock-data";
import { Skeleton } from "@/components/ui/skeleton";
import { getHostContainers } from "@/ai/flows/get-host-containers-flow";


export default function SentinelViewPage() {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchHostData = useCallback(async (host: Host): Promise<Host> => {
    try {
      const containerData = await getHostContainers({ hostId: host.id, ipAddress: host.ipAddress, sshPort: host.sshPort || 22 });
      return { ...host, status: 'online', containers: containerData };
    } catch (error) {
      console.error(`Failed to fetch data for host ${host.name}:`, error);
      return { ...host, status: 'offline', containers: [] };
    }
  }, []);

  const refreshAllHosts = useCallback(async (currentHosts: Host[]) => {
    const refreshedHosts = await Promise.all(currentHosts.map(host => fetchHostData(host)));
    setHosts(refreshedHosts);
  }, [fetchHostData]);

  useEffect(() => {
    const loadInitialData = async () => {
      const initialHosts = INITIAL_HOSTS.map(h => ({ ...h, createdAt: h.createdAt || Date.now() }));
      setHosts(initialHosts);
      setLoading(false);
      await refreshAllHosts(initialHosts);
    };
    loadInitialData();
  }, [refreshAllHosts]);

  useEffect(() => {
    const interval = setInterval(() => refreshAllHosts(hosts), 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [hosts, refreshAllHosts]);
  
  const addHost = useCallback(async (data: { name: string; ipAddress: string; sshPort: number }) => {
    const newHost: Host = {
      id: `host-${Date.now()}`,
      ...data,
      status: 'online', // Assume online initially
      createdAt: Date.now(),
      containers: [],
    };
    
    setLoading(true);
    const hostWithData = await fetchHostData(newHost);
    setHosts(currentHosts => [hostWithData, ...currentHosts]);
    setLoading(false);
  }, [fetchHostData]);
  
  const removeHost = useCallback((hostId: string) => {
    setHosts(currentHosts => currentHosts.filter(h => h.id !== hostId));
    toast({
        title: "Host Removed",
        description: `Stopped monitoring host.`,
        variant: "destructive",
    });
  }, [toast]);

  const removeContainer = useCallback((hostId: string, containerId: string) => {
    setHosts(currentHosts => currentHosts.map(h => {
      if (h.id === hostId) {
        return {
          ...h,
          containers: h.containers.filter(c => c.id !== containerId),
        };
      }
      return h;
    }));
  }, []);

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex flex-col space-y-3">
          <Skeleton className="h-[125px] w-full rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-secondary/40">
      <Header onAddHost={addHost} />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        {loading && hosts.length === 0 ? <LoadingSkeleton /> : <Dashboard hosts={hosts} onRemoveHost={removeHost} onRemoveContainer={removeContainer} />}
      </main>
    </div>
  );
}
