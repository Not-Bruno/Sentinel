
'use client';
import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import type { HostMetric } from '@/lib/types';
import { format } from 'date-fns';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface ResourceChartProps {
  title: string;
  history: HostMetric[];
  dataKey: 'cpuUsage' | 'memoryUsage';
  unit: string;
  containerId?: string;
  containerName?: string;
  chartId: string;
}

export function ResourceChart({ title, history, dataKey, unit, containerId, containerName, chartId }: ResourceChartProps) {
  
  const chartData = useMemo(() => {
    return history.map((entry) => {
      let value;
      if (containerId) {
        value = entry.containers?.[containerId]?.[dataKey] ?? null;
      } else {
        value = entry[dataKey];
      }
      return {
        name: format(new Date(entry.timestamp), 'HH:mm'),
        value: value,
      };
    }).filter(d => d.value !== null);
  }, [history, dataKey, containerId]);

  const dataName = containerName || 'Host';

  const chartConfig = useMemo(() => ({
    [dataName]: {
      label: dataName,
      color: "hsl(var(--chart-1))",
    },
  }), [dataName]);
  
  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-60 text-muted-foreground p-4 text-center">
         <p className='font-semibold'>{title}</p>
        <p className='text-sm'>Keine Verlaufsdaten für diesen Zeitraum verfügbar.</p>
      </div>
    );
  }

  return (
    <Card className='border-none shadow-none'>
        <CardHeader className='p-0 mb-4'>
            <CardTitle className='text-base font-semibold'>{title}</CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
            <div className="h-60 w-full">
                <ChartContainer config={chartConfig} className="h-full w-full">
                    <ResponsiveContainer>
                    <LineChart
                        data={chartData}
                        margin={{
                        top: 5,
                        right: 20,
                        left: -10,
                        bottom: 0,
                        }}
                    >
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <YAxis unit={unit} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                indicator="dot"
                                labelFormatter={(label) => format(new Date(), `dd.MM.yy, ${label}`)}
                                formatter={(value, name) => [`${(value as number).toFixed(1)}${unit}`, name]}
                                />
                            }
                            cursor={{ strokeDasharray: '3 3' }}
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Line
                            key={dataName}
                            type="monotone"
                            dataKey="value"
                            name={dataName}
                            stroke={chartConfig[dataName].color}
                            strokeWidth={2}
                            dot={false}
                        />
                    </LineChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </div>
        </CardContent>
    </Card>
  );
}
