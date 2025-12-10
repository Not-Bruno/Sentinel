'use client';
import './globals.css';
import React, { useCallback, useState } from 'react';
import { Providers } from '@/components/providers';
import { MainNav } from '@/components/layout/main-nav';
import { Header } from '@/components/layout/header';
import type { Host } from '@/lib/types';
import { getHostData } from '@/ai/flows/get-host-containers-flow';
import { saveHosts } from '@/ai/flows/manage-hosts-flow';
import { useToast } from '@/hooks/use-toast';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [hosts, setHosts] = useState<Host[]>([]);
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
        (entry) => now - entry.timestamp < 24 * 60 * 60 * 1000
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
        containers: host.containers || [],
        history: host.history || [],
      };
    }
  }, []);

  const addHost = useCallback(async (data: { name: string; ipAddress: string; sshPort: number }) => {
    const newHost: Host = {
      id: `host-${Date.now()}`,
      ...data,
      status: 'online',
      createdAt: Date.now(),
      containers: [],
      history: [],
    };
    
    setHosts(currentHosts => [newHost, ...currentHosts]);

    const hostWithData = await fetchHostData(newHost);
    
    setHosts(currentHosts => {
      const updatedHosts = currentHosts.map(h => h.id === newHost.id ? hostWithData : h);
      saveHosts(updatedHosts).catch(err => console.error("Failed to save hosts:", err));
      return updatedHosts;
    });

  }, [fetchHostData]);

  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      // @ts-ignore
      return React.cloneElement(child, { hosts, setHosts, addHost });
    }
    return child;
  });

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <title>Sentinel</title>
        <meta name="description" content="Real-time monitoring for your infrastructure." />
      </head>
      <body className="font-body antialiased">
        <Providers>
          <div className="flex flex-col min-h-screen bg-background">
            <Header addHost={addHost}>
              <MainNav />
            </Header>
            <main className="flex-1">{childrenWithProps}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
