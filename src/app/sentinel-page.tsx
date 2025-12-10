"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

import type { Host } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { saveHosts } from "@/ai/flows/manage-hosts-flow";
import { Dashboard } from "@/components/dashboard/dashboard";


interface SentinelPageProps {
  hosts: Host[];
  loading: boolean;
  refreshAllHosts: (hosts: Host[]) => void;
  addHost: (data: { name: string; ipAddress: string; sshPort: number }) => void;
}


export default function SentinelPage({ hosts, loading, refreshAllHosts, addHost }: SentinelPageProps) {
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
  
  
  const removeHost = (hostId: string) => {
    // This function is not passed down anymore, but keeping it here for potential future use or as a reference.
    // The actual implementation is now in layout.tsx to be available for the dialog.
    // If you need direct manipulation here, the state management would need to be lifted or context used.
    toast({
        title: "Info",
        description: `Host removal is handled in the main layout.`,
    });
  };

  const removeContainer = (hostId: string, containerId: string) => {
    // This action is temporary and visual only, it doesn't persist.
    // The container will reappear on the next refresh cycle.
    // This logic needs a setHosts function to be passed down if it's to be used.
  };

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
      {loading && (!hosts || hosts.length === 0) ? <LoadingSkeleton /> : <Dashboard hosts={hosts} onRemoveHost={removeHost} onRemoveContainer={removeContainer} />}
    </>
  );
}

    