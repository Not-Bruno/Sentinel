"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

import type { Host, HostMetric } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { getHostData } from "@/ai/flows/get-host-containers-flow";
import { getSavedHosts, saveHosts } from "@/ai/flows/manage-hosts-flow";
import { Dashboard } from "@/components/dashboard/dashboard";

const MAX_HISTORY_AGE = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

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
      const data = await getHostData({ hostId: host.id, ipAddress: host.ipAddress, sshPort: host.sshPort || 22 });
      
      const now = Date.now();

      const containerMetrics: HostMetric['containers'] = {};
      data.containers.forEach(c => {
        if (c.id && c.cpuUsage !== undefined && c.memoryUsage !== undefined) {
          containerMetrics[c.id] = {
            cpuUsage: c.cpuUsage,
            memoryUsage: c.memoryUsage,
          };
        }
      });

      const newHistoryEntry: HostMetric = {
        timestamp: now,
        cpuUsage: data.cpuUsage ?? 0,
        memoryUsage: data.memoryUsage ?? 0,
        containers: containerMetrics,
      };

      // Filter out old history entries and add the new one
      const recentHistory = (host.history || []).filter(
        (entry) => now - entry.timestamp < MAX_HISTORY_AGE
      );
      const updatedHistory = [...recentHistory, newHistoryEntry];


      return { 
        ...host, 
        status: 'online', 
        containers: data.containers,
        cpuUsage: data.cpuUsage,
        memoryUsage: data.memoryUsage,
        memoryUsedGb: data.memoryUsedGb,
        memoryTotalGb: data.memoryTotalGb,
        diskUsage: data.diskUsage,
        diskUsedGb: data.diskUsedGb,
        diskTotalGb: data.diskTotalGb,
        history: updatedHistory,
      };
    } catch (error) {
      console.error(`Failed to fetch data for host ${host.name}:`, error);
      return { 
        ...host, 
        status: 'offline', 
        containers: host.containers || [], // Keep old container data on error
        history: host.history || [], // Keep old history on error
      };
    }
  }, []);
  
  const refreshAllHosts = useCallback(async (currentHosts: Host[]) => {
    if (currentHosts.length === 0) return;
    try {
        const refreshedHosts = await Promise.all(currentHosts.map(host => fetchHostData(host)));
        setHosts(refreshedHosts);
        // Persist hosts with updated history
        await saveHosts(refreshedHosts);
    } catch (error) {
        console.error("Error refreshing hosts:", error);
    }
  }, [fetchHostData]);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const initialHosts = await getSavedHosts();
        setHosts(initialHosts); // Set hosts immediately to avoid flickering
        if (initialHosts.length > 0) {
          await refreshAllHosts(initialHosts);
        }
      } catch (error) {
        console.error("Failed to load initial host data:", error);
        toast({
          title: "Error Loading Hosts",
          description: "Could not load the saved host list.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      history: [],
    };
    
    // Show loading state for the new host
    setHosts(currentHosts => [newHost, ...currentHosts]);

    const hostWithData = await fetchHostData(newHost);
    
    setHosts(currentHosts => {
      const updatedHosts = currentHosts.map(h => h.id === newHost.id ? hostWithData : h);
      saveHosts(updatedHosts).catch(err => console.error("Failed to save hosts:", err));
      return updatedHosts;
    });

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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex flex-col space-y-3">
          <Skeleton className="h-[250px] w-full rounded-xl" />
        </div>
      ))}
    </div>
  )

  return (
    <>
      {loading && hosts.length === 0 ? <LoadingSkeleton /> : <Dashboard hosts={hosts} onRemoveHost={removeHost} onRemoveContainer={removeContainer} addHost={addHost} />}
    </>
  );
}
