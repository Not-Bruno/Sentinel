'use client';

import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

export default function SecurityPage() {
  return (
    <div className="flex flex-col min-h-screen bg-secondary/40">
      <Header onAddHost={() => {}} />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldAlert className="w-6 h-6 text-amber-500" />
                        Sicherheits-Analyse (CVE-Scan)
                    </CardTitle>
                    <CardDescription>
                        Prüfe deine Container-Images auf bekannte Sicherheitslücken (CVEs).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center h-64 rounded-lg border-2 border-dashed bg-card text-center text-muted-foreground">
                        <h2 className="text-2xl font-semibold">Dieses Feature ist in Kürze verfügbar</h2>
                        <p className="mt-2 max-w-md">
                            Die Möglichkeit, deine Container direkt aus Sentinel heraus auf Sicherheitslücken zu scannen, wird gerade entwickelt.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
