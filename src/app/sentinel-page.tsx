"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

import type { Host } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { saveHosts } from "@/ai/flows/manage-hosts-flow";
import { Dashboard } from "@/components/dashboard/dashboard";


interface SentinelPageProps {
  hosts: Host[];
  setHosts: (hosts: Host[]) => void;
  addHost: (data: { name: string; ipAddress: string; sshPort: number }) => void;
  loading: boolean;
  refreshAllHosts: (hosts: Host[]) => void;
}


export default function SentinelPage({ hosts, setHosts, addHost, loading, refreshAllHosts }: SentinelPageProps) {
  const { toast } = useToast();
  const hostsRef = useRef<Host[]>();

  useEffect(() => {
    hostsRef.current = hosts;
  }, [hosts]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (hostsRef.current && hostsRef.current.length > 0) {
        refreshAllHosts(hostsRef.current);
      }
    }, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [refreshAllHosts]);
  
  
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
  }, [toast, setHosts]);

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
  }, [setHosts]);

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
      {loading && (!hosts || hosts.length === 0) ? <LoadingSkeleton /> : <Dashboard hosts={hosts} onRemoveHost={removeHost} onRemoveContainer={removeContainer} addHost={addHost} />}
    </>
  );
}
