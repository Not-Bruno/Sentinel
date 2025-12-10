'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Host, HostMetric } from '@/lib/types';
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
import { Activity, CircleCheck, HardDrive, AlertTriangle, Cpu, MemoryStick } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useHosts } from '@/hooks/use-hosts';

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

const StatCard = ({ title, value, icon: Icon, unit, description, trend, isLoading }: { title: string, value: string, icon: React.ElementType, unit?: string, description: string, trend?: string, isLoading?: boolean }) => {
    if (isLoading) {
        return (
             <Card>
                <CardHeader className="pb-2">
                    <Skeleton className='h-4 w-2/3' />
                </CardHeader>
                <CardContent>
                    <Skeleton className='h-8 w-1/2 mb-1' />
                    <Skeleton className='h-3 w-full' />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {value}{unit}
                </div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
};


export default function MonitoringPage() {
  const { hosts, loading: hostsLoading } = useHosts();
  const [selectedHostId, setSelectedHostId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('1h');
  const [metricType, setMetricType] = useState<MetricType>('cpuUsage');
  const [visibleEntities, setVisibleEntities] = useState<Set<string>>(new Set(['host']));
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!hostsLoading && hosts && hosts.length > 0 && !selectedHostId) {
      setSelectedHostId(hosts[0].id);
    }
  }, [hosts, hostsLoading, selectedHostId]);

  const selectedHost = useMemo(() => {
    if (!selectedHostId || !hosts || hosts.length === 0) return undefined;
    return hosts.find((h) => h.id === selectedHostId);
  }, [hosts, selectedHostId]);

  // Reset visible entities when host changes
  useEffect(() => {
    if (selectedHost) {
      const initialVisible = new Set<string>(['host']);
      // Automatically show the first container if it exists
      if (selectedHost.containers && selectedHost.containers.length > 0) {
        initialVisible.add(selectedHost.containers[0].id);
      }
      setVisibleEntities(initialVisible);
    }
  }, [selectedHost]);


  const filteredHistory = useMemo(() => {
    if (!selectedHost?.history) return [];
    
    const selectedHours = timeRangeOptions.find(t => t.value === timeRange)?.hours;
    const history = selectedHours === Infinity
      ? selectedHost.history
      : selectedHost.history.filter(entry => now - entry.timestamp < (selectedHours || 24) * 60 * 60 * 1000);
    
    // Simple aggregation for large datasets
    if (history.length > 100) {
      const aggregated: HostMetric[] = [];
      const chunkSize = Math.ceil(history.length / 100);
      for (let i = 0; i < history.length; i += chunkSize) {
        const chunk = history.slice(i, i + chunkSize);
        const avgEntry = chunk.reduce((acc, entry, _, arr) => {
          acc.timestamp = entry.timestamp;
          acc.cpuUsage += entry.cpuUsage / arr.length;
          acc.memoryUsage += entry.memoryUsage / arr.length;
          // Note: Container metrics aggregation is simplified here
          acc.containers = entry.containers; 
          return acc;
        }, { timestamp: 0, cpuUsage: 0, memoryUsage: 0, containers: {} });
        aggregated.push(avgEntry);
      }
      return aggregated;
    }

    return history;
  }, [selectedHost, timeRange, now]);

  const allEntities = useMemo<ChartEntity[]>(() => {
    if (!selectedHost) return [];
    const hostEntity: ChartEntity = { id: 'host', name: selectedHost.name, type: 'host' };
    const containerEntities: ChartEntity[] = (selectedHost.containers || []).map(c => ({ id: c.id, name: c.name, type: 'container' }));
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

    const getAverage = (metric: MetricType, entityId: string): number => {
      if (!filteredHistory || filteredHistory.length === 0) return 0;
      
      let total = 0;
      let count = 0;

      for (const entry of filteredHistory) {
        let value: number | undefined;
        if (entityId === 'host') {
          value = entry[metric];
        } else if (entry.containers && entry.containers[entityId]) {
          value = entry.containers[entityId][metric];
        }

        if (value !== undefined && value !== null) {
          total += value;
          count++;
        }
      }
      return count > 0 ? parseFloat((total / count).toFixed(1)) : 0;
    }

  const getCurrentValue = (metric: MetricType, entityId: string): number => {
    if (!filteredHistory || filteredHistory.length === 0) return 0;
    
    const lastEntry = filteredHistory[filteredHistory.length - 1];
    if (!lastEntry) return 0;

    let value: number | undefined;
    if (entityId === 'host') {
        value = lastEntry[metric];
    } else if (lastEntry.containers && lastEntry.containers[entityId]) {
        value = lastEntry.containers[entityId][metric];
    }
    return value ? parseFloat(value.toFixed(1)) : 0;
  }

  const runningContainers = useMemo(() => {
    return selectedHost?.containers?.filter(c => c.status === 'running').length ?? 0;
  }, [selectedHost]);

  const averageUtilization = useMemo(() => {
    if(!filteredHistory || filteredHistory.length === 0) return 0;
    const hostCpu = getAverage('cpuUsage', 'host');
    const hostMem = getAverage('memoryUsage', 'host');
    if (isNaN(hostCpu) || isNaN(hostMem)) return 0;
    return parseFloat(((hostCpu + hostMem) / 2).toFixed(1));
  }, [filteredHistory]);
  
  return (
    <div className="flex flex-col flex-1 p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold tracking-tight">
            Container-Analytik
            </h1>
            <p className='text-muted-foreground text-sm'>Umfassende Multi-Container-Performance-Vergleiche</p>
        </div>
        {hostsLoading ? (
          <Skeleton className="h-10 w-full sm:w-[250px]" />
        ) : (
          <Select
            value={selectedHostId || ''}
            onValueChange={setSelectedHostId}
            disabled={!hosts || hosts.length === 0}
          >
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Host auswählen..." />
            </SelectTrigger>
            <SelectContent>
              {hosts && hosts.map((host) => (
                <SelectItem key={host.id} value={host.id}>
                  {host.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard isLoading={hostsLoading} title="Laufende Container" value={runningContainers.toString()} icon={Activity} description={`${selectedHost?.containers?.length ?? 0} Container insgesamt`} />
        <StatCard isLoading={hostsLoading} title="Ressourceneffizienz" value={averageUtilization.toFixed(1)} unit='%' icon={Cpu} description="Durchschnittliche Auslastung" />
        <StatCard isLoading={hostsLoading} title="Performance-Anomalien" value="0" icon={AlertTriangle} description="Erkannte Abweichungen" />
        <StatCard isLoading={hostsLoading} title="Host-Gesundheit" value={selectedHost?.status === 'online' ? '100' : '0'} unit='%' icon={CircleCheck} description={selectedHost?.status === 'online' ? "Host ist erreichbar" : "Host ist offline"} />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2'>
            <Card>
                <CardHeader>
                    <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
                        <div>
                            <CardTitle>Performance-Vergleich</CardTitle>
                            <CardDescription>
                                Vergleiche die {metricType === 'cpuUsage' ? 'CPU-' : 'Arbeitsspeicher-'}Auslastung des Hosts und seiner Container.
                            </CardDescription>
                        </div>
                        <div className='flex items-center gap-2'>
                             <Tabs value={metricType} onValueChange={(value) => setMetricType(value as MetricType)}>
                                <TabsList>
                                    <TabsTrigger value="cpuUsage">CPU</TabsTrigger>
                                    <TabsTrigger value="memoryUsage">RAM</TabsTrigger>
                                </TabsList>
                            </Tabs>
                            <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
                                <TabsList>
                                    {timeRangeOptions.slice(0,3).map(option => (
                                    <TabsTrigger key={option.value} value={option.value}>{option.label.replace('Letzte ', '')}</TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <CombinedResourceChart
                        history={filteredHistory}
                        entities={allEntities.filter(e => visibleEntities.has(e.id))}
                        dataKey={metricType}
                        unit="%"
                    />
                </CardContent>
            </Card>
        </div>
        <div className='lg:col-span-1'>
            <Card className='h-full flex flex-col'>
                <CardHeader>
                    <CardTitle>Container-Hierarchie</CardTitle>
                    <CardDescription>Wähle Container zum Anzeigen im Graph</CardDescription>
                </CardHeader>
                <CardContent className='flex-1 flex flex-col min-h-0'>
                    <div className='-mx-2 -mt-2'>
                        <div className='flex items-center justify-end px-2 py-1 gap-2'>
                            <Button variant='link' size='sm' className='text-xs' onClick={() => setVisibleEntities(new Set(allEntities.map(e => e.id)))}>Alle</Button>
                            <Button variant='link' size='sm' className='text-xs' onClick={() => setVisibleEntities(new Set())}>Keine</Button>
                        </div>
                        <Separator />
                    </div>
                    
                    {hostsLoading && allEntities.length === 0 && <div className='flex-1 flex items-center justify-center'><p className='text-muted-foreground'>Lade...</p></div>}
                    {!hostsLoading && allEntities.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center h-full rounded-lg text-center text-muted-foreground">
                            <h2 className="text-lg font-semibold">Keine Daten</h2>
                            <p className="mt-1 text-sm">Für diesen Host wurden keine Container gefunden.</p>
                        </div>
                    )}
                     <ScrollArea className='flex-1 -mx-4'>
                        <div className="px-4 mt-4 space-y-2">
                           {allEntities.map((entity) => {
                             const Logo = entity.type === 'host' ? HardDrive : getContainerLogo(selectedHost?.containers.find(c => c.id === entity.id)?.image || '');
                             return (
                               <Label
                                 key={entity.id}
                                 htmlFor={`check-${entity.id}`}
                                 className={cn("flex items-center gap-3 p-2 rounded-md border bg-background/50 hover:bg-accent transition-colors cursor-pointer", {
                                     "bg-accent/50": visibleEntities.has(entity.id)
                                 })}
                               >
                                 <Checkbox
                                   id={`check-${entity.id}`}
                                   checked={visibleEntities.has(entity.id)}
                                   onCheckedChange={(checked) => handleEntityVisibilityChange(entity.id, !!checked)}
                                 />
                                  {Logo && <Logo className="w-5 h-5 text-muted-foreground" />}
                                 <span className='truncate text-sm font-medium'>{entity.name}</span>
                               </Label>
                             )
                           })}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
      </div>
      
       <Card>
            <CardHeader>
                <CardTitle>Detaillierte Container-Metriken</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Container</TableHead>
                        <TableHead>Image</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className='text-right'>CPU (Aktuell)</TableHead>
                        <TableHead className='text-right'>RAM (Aktuell)</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {hostsLoading && [...Array(3)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className='h-5 w-32'/></TableCell>
                            <TableCell><Skeleton className='h-5 w-40'/></TableCell>
                            <TableCell><Skeleton className='h-5 w-24'/></TableCell>
                            <TableCell className='text-right'><Skeleton className='h-5 w-16 ml-auto'/></TableCell>
                            <TableCell className='text-right'><Skeleton className='h-5 w-16 ml-auto'/></TableCell>
                        </TableRow>
                    ))}
                    {!hostsLoading && selectedHost?.containers.map(container => {
                        const Logo = getContainerLogo(container.image || '');
                        return(
                        <TableRow key={container.id}>
                            <TableCell className="font-medium flex items-center gap-3">
                                <Logo className="w-5 h-5 text-muted-foreground" />
                                {container.name}
                            </TableCell>
                            <TableCell className='text-muted-foreground truncate max-w-xs'>
                                {container.image}
                            </TableCell>
                            <TableCell>
                                <div className='flex items-center gap-2'>
                                <span className={cn('w-2 h-2 rounded-full', {
                                    'bg-green-500': container.status === 'running',
                                    'bg-red-500': container.status === 'error',
                                    'bg-gray-400': container.status === 'stopped',
                                })} />
                                <span className='capitalize'>{container.status}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right font-mono">{getCurrentValue('cpuUsage', container.id).toFixed(1)}%</TableCell>
                            <TableCell className="text-right font-mono">{getCurrentValue('memoryUsage', container.id).toFixed(1)}%</TableCell>
                        </TableRow>
                    )})}
                    {!hostsLoading && selectedHost?.containers?.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                                Keine Container auf diesem Host gefunden.
                            </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
