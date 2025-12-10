"use client";

import React, { createContext, useCallback, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from './use-toast';
import { getHostData } from '@/ai/flows/get-host-containers-flow';
import { getSavedHosts, saveHosts } from '@/ai/flows/manage-hosts-flow';
import type { Host } from '@/lib/types';

const MAX_HISTORY_AGE = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface HostContextType {
  hosts: Host[];
  loading: boolean;
  addHost: (data: { name: string; ipAddress: string; sshPort: number }) => Promise<void>;
  removeHost: (hostId: string) => void;
  refreshAllHosts: (currentHosts: Host[]) => Promise<void>;
}

const HostContext = createContext<HostContextType | undefined>(undefined);

export function HostProvider({ children }: { children: ReactNode }) {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchHostData = useCallback(async (host: Host): Promise<Host> => {
    try {
      const data = await getHostData({ hostId: host.id, ipAddress: host.ipAddress, sshPort: host.sshPort || 22 });
      
      const now = Date.now();

      const containerMetrics: any = {};
      data.containers.forEach(c => {
        if (c.id && c.cpuUsage !== undefined && c.memoryUsage !== undefined) {
          containerMetrics[c.id] = {
            cpuUsage: c.cpuUsage,
            memoryUsage: c.memoryUsage,
          };
        }
      });

      const newHistoryEntry = {
        timestamp: now,
        cpuUsage: data.cpuUsage ?? 0,
        memoryUsage: data.memoryUsage ?? 0,
        containers: containerMetrics,
      };

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
      toast({
        title: `Fehler bei Host ${host.name}`,
        description: `Die Daten für den Host konnten nicht abgerufen werden.`,
        variant: 'destructive',
      });
      return { 
        ...host, 
        status: 'offline', 
        containers: host.containers || [],
        history: host.history || [],
      };
    }
  }, [toast]);

  const addHost = useCallback(async (data: { name: string; ipAddress: string; sshPort: number }) => {
    const newHost: Host = {
      id: `host-${Date.now()}`,
      ...data,
      status: 'online', // Assume online initially
      createdAt: Date.now(),
      containers: [],
      history: [],
    };

    // Add host to UI immediately for responsiveness
    setHosts(prevHosts => [newHost, ...prevHosts]);

    try {
        const hostWithData = await fetchHostData(newHost);
        
        // Update the host with real data and save all hosts
        setHosts(prevHosts => {
            const updatedHosts = prevHosts.map(h => h.id === newHost.id ? hostWithData : h);
            
            saveHosts(updatedHosts).then(() => {
                 toast({
                    title: "Host hinzugefügt",
                    description: `Der Host "${newHost.name}" wird jetzt überwacht.`,
                });
            }).catch(err => {
                console.error("Failed to save hosts after adding:", err);
                toast({
                    title: "Fehler beim Speichern",
                    description: "Der neue Host konnte nicht persistent gespeichert werden.",
                    variant: "destructive"
                });
            });

            return updatedHosts;
        });

    } catch (error) {
         console.error("Error adding host:", error);
         toast({
            title: "Fehler beim Hinzufügen",
            description: `Der Host "${newHost.name}" konnte nicht hinzugefügt werden.`,
            variant: "destructive"
         });
         // If fetching data fails, remove the host from the UI
         setHosts(prevHosts => prevHosts.filter(h => h.id !== newHost.id));
    }
  }, [fetchHostData, toast]);

  const removeHost = useCallback((hostId: string) => {
    setHosts(currentHosts => {
        const updatedHosts = currentHosts.filter(h => h.id !== hostId);
        saveHosts(updatedHosts).catch(err => {
            console.error("Failed to save hosts after removal:", err);
            toast({
                title: "Fehler beim Speichern",
                description: "Die Änderung konnte nicht persistent gespeichert werden.",
                variant: "destructive"
            });
        });
        toast({
            title: "Host entfernt",
            description: "Der Host wird nicht mehr überwacht.",
        });
        return updatedHosts;
    });
  }, [toast]);

  const refreshAllHosts = useCallback(async (currentHosts: Host[]) => {
    if (!currentHosts || currentHosts.length === 0) return;
    try {
        const refreshedHosts = await Promise.all(currentHosts.map(host => fetchHostData(host)));
        setHosts(refreshedHosts);
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
        if (initialHosts && initialHosts.length > 0) {
          const results = await Promise.allSettled(initialHosts.map(host => fetchHostData(host)));
          
          const refreshedHosts = results.map((result, index) => {
            if (result.status === 'fulfilled') {
              return result.value;
            } else {
              console.error(`Failed to fetch initial data for host ${initialHosts[index].name}:`, result.reason);
              return { ...initialHosts[index], status: 'offline' } as Host;
            }
          });

          setHosts(refreshedHosts);
          await saveHosts(refreshedHosts);
        } else {
          // If no hosts are saved, the list is just empty.
          setHosts([]);
        }
      } catch (error) {
        console.error("Failed to load initial host data:", error);
        toast({
          title: "Fehler beim Laden der Hosts",
          description: "Die gespeicherte Host-Liste konnte nicht geladen werden.",
          variant: "destructive",
        });
        setHosts([]); // Ensure hosts is an array in case of error
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = { hosts, loading, addHost, removeHost, refreshAllHosts };

  return <HostContext.Provider value={value}>{children}</HostContext.Provider>;
}

export function useHosts() {
  const context = useContext(HostContext);
  if (context === undefined) {
    throw new Error('useHosts must be used within a HostProvider');
  }
  return context;
}
