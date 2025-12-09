
'use client';
import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { Host } from '@/lib/types';
import { format } from 'date-fns';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';

interface ResourceChartProps {
  host: Host;
  dataKey: 'cpuUsage' | 'memoryUsage';
  unit: string;
}

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', 
  '#00c49f', '#ffbb28', '#ff8042', '#a4de6c', '#d0ed57'
];


export function ResourceChart({ host, dataKey, unit }: ResourceChartProps) {
  const chartData = useMemo(() => {
    return host.history?.map((entry) => ({
      name: format(new Date(entry.timestamp), 'HH:mm'),
      [host.name]: entry[dataKey],
    })) || [];
  }, [host, dataKey]);

  const chartConfig = useMemo(() => {
    const config: any = {
      [host.name]: {
        label: host.name,
        color: COLORS[0],
      },
    };
    return config;
  }, [host.name]);
  
  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-muted-foreground">
        Keine Verlaufsdaten für diesen Host verfügbar.
      </div>
    );
  }

  return (
    <div className="h-80 w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer>
            <LineChart
                data={chartData}
                margin={{
                top: 5,
                right: 30,
                left: 0,
                bottom: 5,
                }}
            >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis unit={unit} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip
                    content={
                        <ChartTooltipContent
                        indicator="dot"
                        labelFormatter={(label) => format(new Date(), `dd.MM.yy, ${label}`)}
                        />
                    }
                    cursor={{ strokeDasharray: '3 3' }}
                />
                <Legend content={<ChartLegendContent />} />
                {Object.keys(chartConfig).map((key, index) => (
                <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={chartConfig[key].color}
                    strokeWidth={2}
                    dot={false}
                />
                ))}
            </LineChart>
            </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
