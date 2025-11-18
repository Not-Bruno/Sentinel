"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

import { Header } from "@/components/layout/header";
import { Dashboard } from "@/components/dashboard/dashboard";
import type { Host, Container, HostStatus, ContainerStatus } from "@/lib/types";
import { INITIAL_HOSTS } from "@/lib/mock-data";
import { Skeleton } from "@/components/ui/skeleton";

export default function SentinelViewPage() {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate initial data loading
    setTimeout(() => {
      setHosts(INITIAL_HOSTS.map(h => ({ ...h, createdAt: h.createdAt || Date.now() })));
      setLoading(false);
    }, 1000);
  }, []);

  const simulateUpdates = useCallback(() => {
    setHosts(currentHosts => {
      return currentHosts.map(host => {
        // Randomly toggle host status
        const newHostStatus: HostStatus = Math.random() > 0.98 ? (host.status === 'online' ? 'offline' : 'online') : host.status;

        const newContainers = host.containers.map(container => {
          // Randomly change container status
          let newContainerStatus: ContainerStatus = container.status;
          const rand = Math.random();
          if (rand > 0.95) {
            const statuses: ContainerStatus[] = ['running', 'stopped', 'error'];
            newContainerStatus = statuses[Math.floor(Math.random() * statuses.length)];
          }
          return { ...container, status: newContainerStatus };
        });

        return { ...host, status: newHostStatus, containers: newContainers };
      });
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(simulateUpdates, 3000); // Update every 3 seconds
    return () => clearInterval(interval);
  }, [simulateUpdates]);
  
  const addHost = useCallback((data: { name: string; ipAddress: string }) => {
    const newHost: Host = {
      id: `host-${Date.now()}`,
      ...data,
      status: 'online',
      createdAt: Date.now(),
      containers: [],
    };
    setHosts(currentHosts => [newHost, ...currentHosts]);
  }, []);
  
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
        {loading ? <LoadingSkeleton /> : <Dashboard hosts={hosts} onRemoveHost={removeHost} onRemoveContainer={removeContainer} />}
      </main>
    </div>
  );
}
