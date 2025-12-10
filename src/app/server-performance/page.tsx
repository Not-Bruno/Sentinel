
'use client';

import { useState, useEffect, useMemo } from 'react';
import { getSavedHosts } from '@/ai/flows/manage-hosts-flow';
import type { Container, Host, HostMetric } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Cpu, HardDrive, MemoryStick, Server, Gauge, Clock, Activity, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { format } from 'date-fns';
import { getContainerLogo } from '@/components/logos';
import { cn } from '@/lib/utils';
import { formatUptime } from '@/lib/utils';


const StatCard = ({ title, value, icon: Icon, unit, description, isLoading }: { title: string, value: string | number, icon: React.ElementType, unit?: string, description: string, isLoading?: boolean }) => {
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

const ResourceChart = ({ data, dataKey, color, unit }: { data: any[], dataKey: string, color: string, unit: string }) => {
    const chartConfig = {
      [dataKey]: {
        label: dataKey,
        color: `hsl(var(--chart-${color}))`,
      },
    };

    return (
        <Card>
            <CardContent className="pt-6">
                <ChartContainer config={chartConfig} className='h-48 w-full'>
                    <ResponsiveContainer>
                        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                            <YAxis unit={unit} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                             <ChartTooltip
                                content={
                                    <ChartTooltipContent
                                    indicator="dot"
                                    labelFormatter={(label) => format(new Date(), `dd.MM.yy, ${label}`)}
                                    formatter={(value) => [`${(value as number).toFixed(1)}${unit}`, dataKey]}
                                    />
                                }
                                cursor={{ strokeDasharray: '3 3' }}
                            />
                            <Line type="monotone" dataKey={dataKey} stroke={chartConfig[dataKey].color} strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

export default function ServerPerformancePage() {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [selectedHostId, setSelectedHostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadHosts() {
      try {
        setLoading(true);
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

  const chartHistory = useMemo(() => {
    if (!selectedHost?.history) return { cpu: [], memory: [], disk: [] };
    
    const cutoff = now - 1 * 60 * 60 * 1000; // Last hour
    const filtered = selectedHost.history.filter(entry => entry.timestamp >= cutoff);

    return {
        cpu: filtered.map(h => ({ name: format(h.timestamp, 'HH:mm'), cpuUsage: h.cpuUsage })),
        memory: filtered.map(h => ({ name: format(h.timestamp, 'HH:mm'), memoryUsage: h.memoryUsage })),
        disk: filtered.map(h => ({ name: format(h.timestamp, 'HH:mm'), diskUsage: selectedHost.diskUsage ?? 0 })),
    }

  }, [selectedHost, now]);


  const runningContainers = useMemo(() => {
    return selectedHost?.containers.filter(c => c.status === 'running').length ?? 0;
  }, [selectedHost]);

  return (
    <div className="flex flex-col flex-1 p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
         <div>
            <h1 className="text-2xl font-bold tracking-tight">
                Server-Performance
            </h1>
            <p className='text-muted-foreground text-sm'>Detaillierte Analyse der Host-Metriken.</p>
        </div>
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

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard isLoading={loading} title="CPU-Temperatur" value="42" unit='°C' icon={Gauge} description="Simulierter Wert" />
        <StatCard isLoading={loading} title="Betriebszeit" value={formatUptime(selectedHost?.createdAt ?? Date.now())} icon={Clock} description="Seit Hinzufügen des Hosts" />
        <StatCard isLoading={loading} title="Aktive Prozesse" value={runningContainers} icon={Activity} description={`${selectedHost?.containers.length ?? 0} Container insgesamt`} />
        <StatCard isLoading={loading} title="Warnungen" value="0" icon={AlertTriangle} description="Keine kritischen Fehler" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ResourceChart data={chartHistory.cpu} dataKey="cpuUsage" color="1" unit="%" />
        <ResourceChart data={chartHistory.memory} dataKey="memoryUsage" color="2" unit="%" />
        <ResourceChart data={chartHistory.disk} dataKey="diskUsage" color="4" unit="%" />
      </div>

       <Card>
            <CardHeader>
                <CardTitle>Prozessliste (Container)</CardTitle>
                <CardDescription>Aktive Container auf {selectedHost?.name ?? 'dem Host'}.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Prozess</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className='text-right'>CPU</TableHead>
                            <TableHead className='text-right'>RAM</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && [...Array(3)].map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className='h-5 w-32'/></TableCell>
                                <TableCell><Skeleton className='h-5 w-24'/></TableCell>
                                <TableCell className='text-right'><Skeleton className='h-5 w-16 ml-auto'/></TableCell>
                                <TableCell className='text-right'><Skeleton className='h-5 w-16 ml-auto'/></TableCell>
                            </TableRow>
                        ))}
                        {!loading && selectedHost?.containers.map(container => {
                            const Logo = getContainerLogo(container.image || '');
                            return(
                            <TableRow key={container.id}>
                                <TableCell className="font-medium flex items-center gap-3">
                                    <Logo className="w-5 h-5 text-muted-foreground" />
                                    {container.name}
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
                                <TableCell className="text-right font-mono">{container.cpuUsage?.toFixed(1) ?? 'N/A'}%</TableCell>
                                <TableCell className="text-right font-mono">{container.memoryUsage?.toFixed(1) ?? 'N/A'}%</TableCell>
                            </TableRow>
                        )})}
                        {!loading && selectedHost?.containers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                    Keine laufenden Prozesse gefunden.
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
