'use client';

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { Fuel } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const chartConfig: ChartConfig = {
  dieselConsumed: {
    label: 'Diesel (L)',
    color: 'hsl(var(--chart-1))',
  },
};

interface DieselConsumptionChartProps {
  data: { date: string; dieselConsumed: number }[];
  isLoading?: boolean;
}

export function DieselConsumptionChart({ data, isLoading = false }: DieselConsumptionChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className='w-5 h-5 text-primary' />
            Daily Diesel Consumption
          </CardTitle>
          <CardDescription>Loading consumption data...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Format data for chart
  const chartData = data.map(item => ({
    date: item.date,
    dieselConsumed: item.dieselConsumed
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Fuel className='w-5 h-5 text-primary' />
            Daily Diesel Consumption
        </CardTitle>
        <CardDescription>
          Generator diesel usage over time. Total: {data.reduce((sum, item) => sum + item.dieselConsumed, 0).toFixed(1)} L
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer>
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis 
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `${value} L`}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
                        <p className="font-medium">{label}</p>
                        <p className="text-sm text-blue-500">
                          {payload[0].value} L
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="dieselConsumed"
                stroke="var(--color-dieselConsumed)"
                strokeWidth={2}
                activeDot={{ r: 8 }}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export default DieselConsumptionChart;