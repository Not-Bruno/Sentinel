'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getSavedHosts } from '@/ai/flows/manage-hosts-flow';
import type { Container, Host, HostMetric } from '@/lib/types';
import { Header } from '@/components/layout/header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CombinedResourceChart } from '@/components/monitoring/combined-resource-chart';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { getContainerLogo } from '@/components/logos';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type TimeRange = '1h' | '12h' | '24h' | 'all';
type MetricType = 'cpuUsage' | 'memoryUsage';

const timeRangeOptions: { value: TimeRange; label: string; hours: number }[] = [
  { value: '1h', label: 'Letzte Stunde', hours: 1 },
  { value: '12h', label: 'Letzte 12 Stunden', hours: 12 },
  { value: '24h', label: 'Letzte 24 Stunden', hours: 24 },
  { value: 'all', label: 'Gesamt', hours: Infinity },
];

interface ChartEntity {
  id: string;
  name: string;
  type: 'host' | 'container';
}

export default function MonitoringPage() {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [selectedHostId, setSelectedHostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('1h');
  const [metricType, setMetricType] = useState<MetricType>('cpuUsage');
  const [visibleEntities, setVisibleEntities] = useState<Set<string>>(new Set(['host']));
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadHosts() {
      try {
        const savedHosts = await getSavedHosts();
        setHosts(savedHosts);
        if (savedHosts.length > 0 && !selectedHostId) {
          setSelectedHostId(savedHosts[0].id);
        }
      } catch (error) {
        console.error('Failed to load hosts for monitoring:', error);
      } finally {
        setLoading(false);
      }
    }
    loadHosts();
  }, [selectedHostId]);

  const selectedHost = hosts.find((h) => h.id === selectedHostId);

  // Reset visible entities when host changes
  useEffect(() => {
    if (selectedHost) {
      const initialVisible = new Set<string>(['host']);
      // Automatically show the first container if it exists
      if (selectedHost.containers.length > 0) {
        initialVisible.add(selectedHost.containers[0].id);
      }
      setVisibleEntities(initialVisible);
    }
  }, [selectedHost]);


  const filteredHistory = useMemo(() => {
    if (!selectedHost?.history) return [];
    
    const selectedHours = timeRangeOptions.find(t => t.value === timeRange)?.hours;
    if (selectedHours === Infinity) return selectedHost.history;

    const cutoff = now - (selectedHours || 24) * 60 * 60 * 1000;
    return selectedHost.history.filter(entry => entry.timestamp >= cutoff);
  }, [selectedHost, timeRange, now]);

  const allEntities = useMemo<ChartEntity[]>(() => {
    if (!selectedHost) return [];
    const hostEntity: ChartEntity = { id: 'host', name: selectedHost.name, type: 'host' };
    const containerEntities: ChartEntity[] = selectedHost.containers.map(c => ({ id: c.id, name: c.name, type: 'container' }));
    return [hostEntity, ...containerEntities];
  }, [selectedHost]);
  
  const handleEntityVisibilityChange = (entityId: string, checked: boolean) => {
    setVisibleEntities(prev => {
        const newSet = new Set(prev);
        if (checked) {
            newSet.add(entityId);
        } else {
            newSet.delete(entityId);
        }
        return newSet;
    });
  };

  const getAverage = (entityId: string): number => {
    if (!filteredHistory || filteredHistory.length === 0) return 0;
    
    let total = 0;
    let count = 0;

    for (const entry of filteredHistory) {
      let value: number | undefined;
      if (entityId === 'host') {
        value = entry[metricType];
      } else {
        value = entry.containers?.[entityId]?.[metricType];
      }

      if (value !== undefined && value !== null) {
        total += value;
        count++;
      }
    }
    return count > 0 ? total / count : 0;
  }

  const getCurrentValue = (entityId: string): number => {
    if (!filteredHistory || filteredHistory.length === 0) return 0;
    
    const lastEntry = filteredHistory[filteredHistory.length - 1];
    let value: number | undefined;
    if (entityId === 'host') {
        value = lastEntry?.[metricType];
    } else {
        value = lastEntry?.containers?.[entityId]?.[metricType];
    }
    return value ?? 0;
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-secondary/40">
      <Header onAddHost={() => {}} />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight">
              Performance-Analyse
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
          
          <div className='flex flex-col sm:flex-row justify-between items-center gap-4'>
            <Tabs value={metricType} onValueChange={(value) => setMetricType(value as MetricType)}>
                <TabsList>
                    <TabsTrigger value="cpuUsage">CPU-Auslastung</TabsTrigger>
                    <TabsTrigger value="memoryUsage">RAM-Auslastung</TabsTrigger>
                </TabsList>
            </Tabs>
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
            <Card>
                <CardHeader>
                    <CardTitle>Analyse für: {selectedHost.name}</CardTitle>
                    <CardDescription>
                        Vergleiche die {metricType === 'cpuUsage' ? 'CPU-' : 'Arbeitsspeicher-'}Auslastung des Hosts und seiner Container.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CombinedResourceChart
                        history={filteredHistory}
                        entities={allEntities.filter(e => visibleEntities.has(e.id))}
                        dataKey={metricType}
                        unit="%"
                    />
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-3">Datenquellen auswählen</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                           {allEntities.map((entity, index) => {
                             const Logo = entity.type === 'host' ? undefined : getContainerLogo(selectedHost.containers.find(c => c.id === entity.id)?.image || '');
                             return (
                               <Label
                                 key={entity.id}
                                 className="flex items-center gap-2 p-2 rounded-md border bg-background/50 hover:bg-accent transition-colors cursor-pointer"
                               >
                                 <Checkbox
                                   id={entity.id}
                                   checked={visibleEntities.has(entity.id)}
                                   onCheckedChange={(checked) => handleEntityVisibilityChange(entity.id, !!checked)}
                                 />
                                  {Logo && <Logo className="w-4 h-4" />}
                                 <span className='truncate text-sm'>{entity.name}</span>
                               </Label>
                             )
                           })}
                        </div>
                    </div>
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-3">Statistiken für den Zeitraum</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Dienst</TableHead>
                              <TableHead className='text-right'>Aktuell</TableHead>
                              <TableHead className='text-right'>Ø-Auslastung</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {allEntities.map(entity => {
                                const Logo = entity.type === 'host' ? undefined : getContainerLogo(selectedHost.containers.find(c => c.id === entity.id)?.image || '');
                                return(
                                <TableRow key={entity.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                    {Logo && <Logo className="w-4 h-4" />}
                                    {entity.name}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">{getCurrentValue(entity.id).toFixed(1)}%</TableCell>
                                    <TableCell className="text-right font-mono">{getAverage(entity.id).toFixed(1)}%</TableCell>
                                </TableRow>
                            )})}
                          </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
