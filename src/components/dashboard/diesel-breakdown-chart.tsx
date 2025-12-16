'use client';

import React, { useState, useEffect } from 'react'; // ADDED React import
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip, Legend } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { Factory, Fuel } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

interface DieselBreakdownChartProps {
  data?: {
    name: string;
    value: number;
    fill: string;
  }[];
  generatorDiesel?: number;
  fleetDiesel?: number;
  isLoading?: boolean;
}

const chartConfig: ChartConfig = {
  value: {
    label: 'Liters',
  },
  Generators: { 
    label: 'Generators', 
    color: 'hsl(var(--chart-1))' 
  },
  Fleet: { 
    label: 'Fleet', 
    color: 'hsl(var(--chart-2))' 
  },
};

// Default data if no props provided
const defaultData = [
  { name: 'Generators', value: 75, fill: 'hsl(var(--chart-1))' },
  { name: 'Fleet', value: 25, fill: 'hsl(var(--chart-2))' },
];

export function DieselBreakdownChart({ 
  data: propData, 
  generatorDiesel = 0, 
  fleetDiesel = 0,
  isLoading = false 
}: DieselBreakdownChartProps) {
  
  // Calculate data from actual diesel values or use provided data
  const chartData = React.useMemo(() => {
    if (propData) return propData;
    
    const total = generatorDiesel + fleetDiesel;
    
    if (total === 0) return defaultData;
    
    return [
      { 
        name: 'Generators', 
        value: generatorDiesel, 
        fill: 'hsl(var(--chart-1))' 
      },
      { 
        name: 'Fleet', 
        value: fleetDiesel, 
        fill: 'hsl(var(--chart-2))' 
      },
    ];
  }, [propData, generatorDiesel, fleetDiesel]);

  const totalDiesel = chartData.reduce((sum, item) => sum + item.value, 0);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = totalDiesel > 0 ? ((data.value / totalDiesel) * 100).toFixed(1) : '0';
      
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">
            {data.value.toFixed(1)} L ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className='w-5 h-5 text-primary'/>
            Diesel Consumption Breakdown
          </CardTitle>
          <CardDescription>
            Loading diesel usage data...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <Skeleton className="w-full h-[300px]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Factory className='w-5 h-5 text-primary'/>
          Diesel Consumption Breakdown
        </CardTitle>
        <CardDescription>
          {totalDiesel > 0 ? (
            <>
              Total diesel: <span className="font-semibold">{totalDiesel.toFixed(1)} L</span>
            </>
          ) : (
            'Breakdown of diesel usage between fleet and generators.'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-full max-h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                strokeWidth={5}
                label={({ name, value }) => {
                  const percentage = totalDiesel > 0 ? ((value / totalDiesel) * 100).toFixed(1) : '0';
                  return `${name}: ${percentage}%`;
                }}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${entry.name}-${index}`} 
                    fill={entry.fill} 
                    stroke="white"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Summary stats */}
        {totalDiesel > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 rounded bg-primary/5 border">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-1))]" />
                <span className="font-medium">Generators</span>
              </div>
              <p className="text-lg font-bold mt-1">
                {chartData.find(d => d.name === 'Generators')?.value.toFixed(1) || 0} L
              </p>
              <p className="text-xs text-muted-foreground">
                From utility readings
              </p>
            </div>
            <div className="p-2 rounded bg-primary/5 border">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-2))]" />
                <span className="font-medium">Fleet</span>
              </div>
              <p className="text-lg font-bold mt-1">
                {chartData.find(d => d.name === 'Fleet')?.value.toFixed(1) || 0} L
              </p>
              <p className="text-xs text-muted-foreground">
                Estimated (30% of generators)
              </p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="mt-auto pt-4">
        <Button asChild variant="outline" className="w-full">
          <Link href="/utility/diesel-analytics">View Detailed Analytics</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default DieselBreakdownChart;