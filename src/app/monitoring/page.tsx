'use client';

import { useState, useEffect } from 'react';
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

export default function MonitoringPage() {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [selectedHostId, setSelectedHostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHosts() {
      try {
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
              <Skeleton className="h-10 w-[250px]" />
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

          {loading && <Skeleton className="h-[400px] w-full" />}
          
          {!loading && !selectedHost && (
             <div className="flex flex-col items-center justify-center h-full rounded-lg border-2 border-dashed bg-card py-12 text-center text-muted-foreground mt-8">
                <h2 className="text-2xl font-semibold">Kein Host ausgewählt</h2>
                <p className="mt-2">Füge zuerst einen Host hinzu oder wähle einen aus der Liste aus.</p>
            </div>
          )}

          {selectedHost && (
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>CPU-Auslastung (%)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResourceChart
                    host={selectedHost}
                    dataKey="cpuUsage"
                    unit="%"
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Arbeitsspeicher-Auslastung (%)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResourceChart
                    host={selectedHost}
                    dataKey="memoryUsage"
                    unit="%"
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
