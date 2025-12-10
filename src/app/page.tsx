"use client";

import { useEffect, useRef } from "react";
import type { Host } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Dashboard } from "@/components/dashboard/dashboard";
import { useHosts } from "@/hooks/use-hosts";

export default function Home() {
  const { hosts, loading, refreshAllHosts, removeHost } = useHosts();
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

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3 p-4 sm:p-6 md:p-8">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex flex-col space-y-3">
          <Skeleton className="h-[250px] w-full rounded-xl" />
        </div>
      ))}
    </div>
  );

  if (loading && (!hosts || hosts.length === 0)) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
       <Dashboard hosts={hosts} onRemoveHost={removeHost} />
    </div>
  );
}
