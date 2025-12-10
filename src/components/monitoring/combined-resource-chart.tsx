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
} from '@/components/ui/chart';

interface ChartEntity {
  id: string;
  name: string;
  type: 'host' | 'container';
}

interface CombinedResourceChartProps {
  history: HostMetric[];
  entities: ChartEntity[];
  dataKey: 'cpuUsage' | 'memoryUsage';
  unit: string;
}

// Generates a color palette for the charts
const generateColor = (index: number, total: number) => {
  if (index === 0) return "hsl(var(--chart-1))"; // Host is always the first color
  // Distribute other colors across the hue spectrum
  const hue = (200 + (index - 1) * (160 / (total > 1 ? total - 1 : 1))) % 360;
  return `hsl(${hue}, 70%, 50%)`;
};


export function CombinedResourceChart({ history, entities, dataKey, unit }: CombinedResourceChartProps) {

  const { chartData, chartConfig } = useMemo(() => {
    const config: any = {};
    entities.forEach((entity, index) => {
      config[entity.id] = {
        label: entity.name,
        color: generateColor(index, entities.length),
      };
    });

    const data = history.map((entry) => {
      const point: { name: string, [key: string]: any } = {
        name: format(new Date(entry.timestamp), 'HH:mm'),
      };
      
      entities.forEach(entity => {
        let value: number | null = null;
        if (entity.type === 'host' && entry[dataKey] !== undefined) {
          value = entry[dataKey];
        } else if (entity.type === 'container' && entry.containers?.[entity.id]?.[dataKey] !== undefined) {
          value = entry.containers[entity.id][dataKey];
        }
        point[entity.id] = value;
      });

      return point;
    });

    return { chartData: data, chartConfig: config };
  }, [history, entities, dataKey]);

  if (!chartData || chartData.length === 0 || entities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-muted-foreground p-4 text-center border-2 border-dashed rounded-lg">
        <p className='font-semibold'>Keine Diagrammdaten verfügbar</p>
        <p className='text-sm'>Wähle mindestens eine Datenquelle aus oder ändere den Zeitraum.</p>
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
                  formatter={(value, name) => {
                    const entity = entities.find(e => e.id === name);
                    return [`${(value as number).toFixed(1)}${unit}`, entity?.name || 'Unbekannt'];
                  }}
                />
              }
              cursor={{ strokeDasharray: '3 3' }}
            />
            {entities.map(entity => (
              <Line
                key={entity.id}
                type="monotone"
                dataKey={entity.id}
                name={entity.name}
                stroke={chartConfig[entity.id].color}
                strokeWidth={entity.type === 'host' ? 3 : 2}
                dot={false}
                strokeDasharray={entity.type === 'host' ? "1" : "5 5"}
                connectNulls // Connects line over missing data points
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
