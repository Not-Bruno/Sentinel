"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

import { Header } from "@/components/layout/header";
import { Dashboard } from "@/components/dashboard/dashboard";
import type { Host } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { getHostContainers } from "@/ai/flows/get-host-containers-flow";
import { getSavedHosts, saveHosts } from "@/ai/flows/manage-hosts-flow";


export default function SentinelPage() {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const hostsRef = useRef<Host[]>([]);

  useEffect(() => {
    hostsRef.current = hosts;
  }, [hosts]);

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
    try {
        const refreshedHosts = await Promise.all(currentHosts.map(host => fetchHostData(host)));
        setHosts(refreshedHosts);
    } catch (error) {
        console.error("Error refreshing hosts:", error);
    }
  }, [fetchHostData]);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const initialHosts = await getSavedHosts();
        setHosts(initialHosts);
        await refreshAllHosts(initialHosts);
      } catch (error) {
        console.error("Failed to load initial host data:", error);
        toast({
          title: "Error Loading Hosts",
          description: "Could not load the saved host list.",
          variant: "destructive",
        });
      }
      setLoading(false);
    };
    loadInitialData();
  }, [refreshAllHosts, toast]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (hostsRef.current.length > 0) {
        refreshAllHosts(hostsRef.current);
      }
    }, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [refreshAllHosts]);
  
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
    
    setHosts(currentHosts => {
      const updatedHosts = [hostWithData, ...currentHosts];
      saveHosts(updatedHosts).catch(err => console.error("Failed to save hosts:", err));
      return updatedHosts;
    });

    setLoading(false);
  }, [fetchHostData]);
  
  const removeHost = useCallback((hostId: string) => {
    setHosts(currentHosts => {
      const updatedHosts = currentHosts.filter(h => h.id !== hostId);
      saveHosts(updatedHosts).catch(err => console.error("Failed to save hosts:", err));
      return updatedHosts;
    });
    toast({
        title: "Host Removed",
        description: `Stopped monitoring host.`,
        variant: "destructive",
    });
  }, [toast]);

  const removeContainer = useCallback((hostId: string, containerId: string) => {
    // This action is temporary and visual only, it doesn't persist.
    // The container will reappear on the next refresh cycle.
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
