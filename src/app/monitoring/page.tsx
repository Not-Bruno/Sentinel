'use client';

import { useState, useEffect, useMemo } from 'react';
import { getSavedHosts } from '@/ai/flows/manage-hosts-flow';
import type { Host } from '@/lib/types';
import { Header } from '@/components/layout/header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ResourceChart } from '@/components/monitoring/resource-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getContainerLogo } from '@/components/logos';

type TimeRange = '1h' | '12h' | '24h' | 'all';

const timeRangeOptions: { value: TimeRange; label: string; hours: number }[] = [
  { value: '1h', label: 'Letzte Stunde', hours: 1 },
  { value: '12h', label: 'Letzte 12 Stunden', hours: 12 },
  { value: '24h', label: 'Letzte 24 Stunden', hours: 24 },
  { value: 'all', label: 'Gesamt', hours: Infinity },
];

export default function MonitoringPage() {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [selectedHostId, setSelectedHostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [now, setNow] = useState(Date.now());

  // Effect to update "now" every 5 seconds to keep the time filter relative
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadHosts() {
      try {
        // We need to fetch fresh data to get the latest history
        const savedHosts = await getSavedHosts();
        setHosts(savedHosts);
        if (savedHosts.length > 0) {
          setSelectedHostId(savedHosts[0].id);
        }
      } catch (error) {
        console.error('Failed to load hosts for monitoring:', error);
      } finally {
        setLoading(false);
      }
    }
    loadHosts();
  }, []);

  const selectedHost = hosts.find((h) => h.id === selectedHostId);

  const filteredHistory = useMemo(() => {
    if (!selectedHost?.history) return [];
    
    const selectedHours = timeRangeOptions.find(t => t.value === timeRange)?.hours;
    if (selectedHours === Infinity) return selectedHost.history;

    const cutoff = now - (selectedHours || 24) * 60 * 60 * 1000;
    return selectedHost.history.filter(entry => entry.timestamp >= cutoff);
  }, [selectedHost, timeRange, now]);

  return (
    <div className="flex flex-col min-h-screen bg-secondary/40">
      <Header onAddHost={() => {}} />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight">
              Ressourcen-Monitoring
            </h1>
            {loading ? (
              <Skeleton className="h-10 w-full sm:w-[250px]" />
            ) : (
              <Select
                value={selectedHostId || ''}
                onValueChange={setSelectedHostId}
                disabled={hosts.length === 0}
              >
                <SelectTrigger className="w-full sm:w-[250px]">
                  <SelectValue placeholder="Host auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {hosts.map((host) => (
                    <SelectItem key={host.id} value={host.id}>
                      {host.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <div className='flex justify-end'>
            <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
              <TabsList>
                {timeRangeOptions.map(option => (
                  <TabsTrigger key={option.value} value={option.value}>{option.label}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {loading && <Skeleton className="h-[400px] w-full" />}
          
          {!loading && !selectedHost && (
             <div className="flex flex-col items-center justify-center h-full rounded-lg border-2 border-dashed bg-card py-12 text-center text-muted-foreground mt-8">
                <h2 className="text-2xl font-semibold">Kein Host ausgewählt</h2>
                <p className="mt-2">Füge zuerst einen Host hinzu oder wähle einen aus der Liste aus.</p>
            </div>
          )}

          {selectedHost && (
            <div className="space-y-8">
              {/* Host Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Host: {selectedHost.name}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ResourceChart
                    title="CPU-Auslastung (%)"
                    history={filteredHistory}
                    dataKey="cpuUsage"
                    unit="%"
                    chartId="host-cpu"
                  />
                  <ResourceChart
                    title="Arbeitsspeicher-Auslastung (%)"
                    history={filteredHistory}
                    dataKey="memoryUsage"
                    unit="%"
                    chartId="host-memory"
                  />
                </CardContent>
              </Card>

              {/* Container Metrics */}
              <div>
                <h2 className="text-xl font-bold mb-4">Container-Metriken</h2>
                <div className="space-y-6">
                  {selectedHost.containers.map(container => {
                    const Logo = getContainerLogo(container.image);
                    return (
                        <Card key={container.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Logo className="w-6 h-6" />
                                    <span>{container.name}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <ResourceChart
                                    title="Container CPU-Auslastung (%)"
                                    history={filteredHistory}
                                    dataKey="cpuUsage"
                                    unit="%"
                                    containerId={container.id}
                                    containerName={container.name}
                                    chartId={`container-${container.id}-cpu`}
                                />
                                <ResourceChart
                                    title="Container Arbeitsspeicher-Auslastung (%)"
                                    history={filteredHistory}
                                    dataKey="memoryUsage"
                                    unit="%"
                                    containerId={container.id}
                                    containerName={container.name}
                                    chartId={`container-${container.id}-mem`}
                                />
                            </CardContent>
                        </Card>
                    )
                  })}
                  {selectedHost.containers.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                          Auf diesem Host laufen keine Container.
                      </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
