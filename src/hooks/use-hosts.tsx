"use client";

import React, { createContext, useCallback, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from './use-toast';
import { getHostData } from '@/ai/flows/get-host-containers-flow';
import { getSavedHosts, saveHost, updateHost, deleteHost, checkDbConnection } from '@/ai/flows/manage-hosts-flow';
import type { Host, DatabaseStatus } from '@/lib/types';

// Importiert die zentrale Registry, um sicherzustellen, dass die Flows in Next.js bekannt sind.
import '@/ai/genkit-registry';


const MAX_HISTORY_ENTRIES = 100; // Limit the number of history entries per host

interface HostContextType {
  hosts: Host[];
  loading: boolean;
  dbStatus: DatabaseStatus;
  addHost: (data: { name: string; ipAddress: string; sshPort: number }) => Promise<void>;
  removeHost: (hostId: string) => Promise<void>;
  refreshAllHosts: (currentHosts: Host[]) => Promise<void>;
}

const HostContext = createContext<HostContextType | undefined>(undefined);

export function HostProvider({ children }: { children: ReactNode }) {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>('disconnected');
  const { toast } = useToast();

  const checkDatabaseStatus = useCallback(async () => {
    try {
      const status = await checkDbConnection();
      setDbStatus(status);
    } catch (error) {
      setDbStatus('error');
    }
  }, []);

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
      
      const updatedHistory = [...(host.history || []), newHistoryEntry].slice(-MAX_HISTORY_ENTRIES);

      const updatedHost: Host = { 
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

      await updateHost(updatedHost);
      return updatedHost;

    } catch (error) {
      console.error(`Failed to fetch data for host ${host.name}:`, error);
      toast({
        title: `Fehler bei Host ${host.name}`,
        description: `Die Daten für den Host konnten nicht abgerufen werden.`,
        variant: 'destructive',
      });
      const offlineHost = { 
        ...host, 
        status: 'offline', 
      };
      await updateHost(offlineHost);
      return offlineHost;
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

    try {
      await saveHost(newHost);
      setHosts(prevHosts => [newHost, ...prevHosts]);
      toast({
          title: "Host hinzugefügt",
          description: `Der Host "${newHost.name}" wird jetzt überwacht.`,
      });
      
      // Fetch initial data async
      fetchHostData(newHost).then(fetchedHost => {
        setHosts(prev => prev.map(h => h.id === newHost.id ? fetchedHost : h));
      });

    } catch (error) {
         console.error("Error adding host:", error);
         toast({
            title: "Fehler beim Hinzufügen",
            description: `Der Host "${newHost.name}" konnte nicht hinzugefügt werden.`,
            variant: "destructive"
         });
    }
  }, [fetchHostData, toast]);

  const removeHost = useCallback(async (hostId: string) => {
    try {
      await deleteHost(hostId);
      setHosts(currentHosts => currentHosts.filter(h => h.id !== hostId));
      toast({
          title: "Host entfernt",
          description: "Der Host wird nicht mehr überwacht.",
      });
    } catch (error) {
      console.error("Failed to remove host:", error);
      toast({
          title: "Fehler beim Entfernen",
          description: "Der Host konnte nicht entfernt werden.",
          variant: "destructive"
      });
    }
  }, [toast]);

  const refreshAllHosts = useCallback(async (currentHosts: Host[]) => {
    if (!currentHosts || currentHosts.length === 0) return;
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
      await checkDatabaseStatus();
      try {
        const initialHosts = await getSavedHosts();
        setHosts(initialHosts);
      } catch (error) {
        console.error("Failed to load initial host data:", error);
        toast({
          title: "Fehler beim Laden der Hosts",
          description: "Die gespeicherte Host-Liste konnte nicht geladen werden.",
          variant: "destructive",
        });
        setHosts([]);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = { hosts, loading, addHost, removeHost, refreshAllHosts, dbStatus };

  return <HostContext.Provider value={value}>{children}</HostContext.Provider>;
}

export function useHosts() {
  const context = useContext(HostContext);
  if (context === undefined) {
    throw new Error('useHosts must be used within a HostProvider');
  }
  return context;
}
