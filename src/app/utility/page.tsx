'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
} from '@/components/layout/client-layout';
import { FreshTraceLogo } from '@/components/icons';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';

import { AnomalyDetection } from '@/components/dashboard/anomaly-detection';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { DollarSign, Thermometer, Bolt, Zap, Droplet, Fuel, Clock, AlertTriangle, BarChart, PieChart, Download, Filter, X } from 'lucide-react';
import type { ExplainAnomalyInput } from "@/ai/flows/explain-anomaly-detection";
import { explainEnergySpike } from '@/ai/flows/explain-energy-spike';
import { explainWaterAnomaly } from '@/ai/flows/explain-water-anomaly';
import { Skeleton } from '@/components/ui/skeleton';
import { UtilityMonitors } from '@/components/dashboard/utility-monitors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Define utility rates
const UTILITY_RATES = {
  electricity: 25, // KES per kWh
  water: 130,      // KES per m³
  diesel: 74       // KES per liter
} as const;

// Initialize with defaults
const initialEnergyOverview = {
    totalConsumption: { title: 'Total Consumption (Today)', value: '0 kWh', change: 'No data yet', changeType: 'neutral' as const, },
    monthlyCost: { title: 'Est. Monthly Cost', value: 'KES 0', change: `at KES ${UTILITY_RATES.electricity}/kWh`, changeType: 'neutral' as const, },
    peakDemand: { title: 'Peak Demand (Today)', value: '0 kW', change: 'No data', changeType: 'neutral' as const, },
    powerFactor: { title: 'Power Factor', value: '0.00', change: 'No data', changeType: 'neutral' as const, },
};

const initialWaterOverview = {
    totalConsumption: { title: 'Water Usage (Today)', value: '0 m³', change: 'No data yet', changeType: 'neutral' as const, },
    monthlyCost: { title: 'Est. Monthly Water Cost', value: 'KES 0', change: `at KES ${UTILITY_RATES.water}/m³`, changeType: 'neutral' as const, },
    qualityStatus: { title: 'Water Quality', value: 'N/A', change: 'Municipal Main', changeType: 'neutral' as const, },
    recyclingRate: { title: 'Recycling Rate', value: '0%', change: 'No data', changeType: 'neutral' as const, },
};

// Add diesel overview
const initialDieselOverview = {
    consumptionToday: { title: 'Today\'s Diesel Consumption', value: '0 L', change: 'No generator runtime', changeType: 'neutral' as const, },
    avgDailyConsumption: { title: 'Avg. Daily Consumption', value: '0 L', change: 'Last 7 days', changeType: 'neutral' as const, },
    monthlyCost: { title: 'Est. Monthly Cost', value: 'KES 0', change: `at KES ${UTILITY_RATES.diesel}/L`, changeType: 'neutral' as const, },
    estimatedRuntime: { title: 'Estimated Runtime', value: '0 hours', change: 'based on avg. consumption', changeType: 'neutral' as const, },
};

// Fallback component for chart errors
const ChartErrorFallback = ({ title, icon: Icon }: { title: string; icon?: any }) => (
  <div className="h-full flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/20">
    {Icon && <Icon className="h-12 w-12 mb-4 text-muted-foreground" />}
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground text-center">Chart data unavailable</p>
  </div>
);

// Dynamic imports with better error handling
const EnergyConsumptionChart = dynamic(
  () => import('@/components/dashboard/energy-consumption-chart'),
  { 
    ssr: false, 
    loading: () => <Skeleton className="h-[386px] w-full" />,
  }
);

const EnergyBreakdownChart = dynamic(
  () => import('@/components/dashboard/energy-breakdown-chart').catch(() => {
    return () => <ChartErrorFallback title="Energy Breakdown" icon={PieChart} />;
  }),
  { 
    ssr: false, 
    loading: () => <Skeleton className="h-[386px] w-full" />,
  }
);

const EnergyCostChart = dynamic(
  () => import('@/components/dashboard/energy-cost-chart').catch(() => {
    return () => <ChartErrorFallback title="Energy Cost" icon={BarChart} />;
  }),
  { 
    ssr: false, 
    loading: () => <Skeleton className="h-[386px] w-full" />,
  }
);

const WaterConsumptionChart = dynamic(
  () => import('@/components/dashboard/water-consumption-chart').catch(() => {
    return () => <ChartErrorFallback title="Water Consumption" icon={Droplet} />;
  }),
  { 
    ssr: false, 
    loading: () => <Skeleton className="h-[386px] w-full" />,
  }
);

const WaterBreakdownChart = dynamic(
  () => import('@/components/dashboard/water-breakdown-chart').catch(() => {
    return () => <ChartErrorFallback title="Water Breakdown" icon={PieChart} />;
  }),
  { 
    ssr: false, 
    loading: () => <Skeleton className="h-[386px] w-full" />,
  }
);

const WaterQualityTable = dynamic(
  () => import('@/components/dashboard/water-quality-table').then(mod => mod.WaterQualityTable).catch(() => {
    return () => <ChartErrorFallback title="Water Quality" icon={Thermometer} />;
  }),
  { 
    ssr: false, 
    loading: () => <Skeleton className="h-[318px] w-full" />,
  }
);

const DieselBreakdownChart = dynamic(
  () => import('@/components/dashboard/diesel-breakdown-chart'),
  { 
    ssr: false, 
    loading: () => <Skeleton className="h-[386px] w-full" />,
  }
);

const DieselConsumptionChart = dynamic(
  () => import('@/components/dashboard/diesel-consumption-chart'),
  { 
    ssr: false, 
    loading: () => <Skeleton className="h-[386px] w-full" />,
  }
);

// Types for utility readings
interface UtilityReading {
  id: string;
  date: string;
  powerOpening: string;
  powerClosing: string;
  powerConsumed: string;
  waterOpening: string;
  waterClosing: string;
  waterConsumed: string;
  generatorStart: string;
  generatorStop: string;
  timeConsumed: string;
  dieselConsumed: string;
  dieselRefill: string | null;
  recordedBy: string;
  shift: string | null;
  notes: string | null;
}

// Types for chart data
interface ChartDataPoint {
  date: string;
  value: number;
}

export default function UtilityManagementPage() {
    const [energyOverview, setEnergyOverview] = useState(initialEnergyOverview);
    const [waterOverview, setWaterOverview] = useState(initialWaterOverview);
    const [dieselOverview, setDieselOverview] = useState(initialDieselOverview);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalPower, setTotalPower] = useState(0);
    const [totalWater, setTotalWater] = useState(0);
    const [totalDiesel, setTotalDiesel] = useState(0);
    const [lastUpdated, setLastUpdated] = useState<string>('Never');
    const [dieselBreakdown, setDieselBreakdown] = useState({
      generatorDiesel: 0,
      fleetDiesel: 0
    });
    
    // Data states for charts and calculations
    const [readings, setReadings] = useState<UtilityReading[]>([]);
    const [energyConsumptionData, setEnergyConsumptionData] = useState<ChartDataPoint[]>([]);
    const [waterConsumptionData, setWaterConsumptionData] = useState<ChartDataPoint[]>([]);
    const [dieselConsumptionData, setDieselConsumptionData] = useState<any[]>([]);
    const [waterQualityData, setWaterQualityData] = useState<any[]>([]);
    
    // Monthly cost states
    const [monthlyPowerCost, setMonthlyPowerCost] = useState(0);
    const [monthlyWaterCost, setMonthlyWaterCost] = useState(0);
    const [monthlyDieselCost, setMonthlyDieselCost] = useState(0);

    // Date filter states
    const [dateFilter, setDateFilter] = useState<'all' | 'specific' | 'range'>('all');
    const [specificDate, setSpecificDate] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [utilityTypeFilter, setUtilityTypeFilter] = useState<'all' | 'electricity' | 'water' | 'diesel'>('all');

    // Generate chart data from readings
    const generateChartData = (readings: UtilityReading[]) => {
      if (readings.length === 0) return [];
      
      return readings.slice(0, 7).map(reading => ({
        date: new Date(reading.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        value: parseFloat(reading.powerConsumed)
      }));
    };

    // Generate water consumption data
    const generateWaterChartData = (readings: UtilityReading[]) => {
      if (readings.length === 0) return [];
      
      return readings.slice(0, 7).map(reading => ({
        date: new Date(reading.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric'
        }),
        value: parseFloat(reading.waterConsumed)
      }));
    };

    // Generate diesel consumption data
    const generateDieselChartData = (readings: UtilityReading[]) => {
      if (readings.length === 0) return [];
      
      return readings.slice(0, 7).map(reading => ({
        date: new Date(reading.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric'
        }),
        dieselConsumed: parseFloat(reading.dieselConsumed)
      }));
    };

    // Generate water quality data from water consumption
    const generateWaterQualityData = (waterConsumed: number) => {
      const today = new Date();
      const ph = 6.5 + (waterConsumed / 100); // pH varies with usage
      const turbidity = Math.max(0.5, Math.min(3.5, waterConsumed / 20));
      
      return [
        {
          id: '1',
          source: 'Main Processing Line',
          date: today.toISOString().split('T')[0],
          pH: parseFloat(ph.toFixed(2)),
          turbidity: parseFloat(turbidity.toFixed(2)),
          conductivity: waterConsumed > 40 ? 450.2 : 320.5,
          status: turbidity < 2 ? 'Pass' : 'Fail' as const
        },
        {
          id: '2',
          source: 'Recycling Plant',
          date: today.toISOString().split('T')[0],
          pH: 6.8,
          turbidity: 2.5,
          conductivity: 280.1,
          status: 'Fail' as const
        },
        {
          id: '3',
          source: 'Storage Tank',
          date: today.toISOString().split('T')[0],
          pH: 7.5,
          turbidity: 0.8,
          conductivity: 420.3,
          status: 'Pass' as const
        }
      ];
    };

    // Generate energy cost chart data
    const generateEnergyCostData = (baseMonthlyCost: number) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      return months.map((month, index) => ({
        month,
        cost: Math.round(baseMonthlyCost * (0.9 + (index * 0.04))) // Gradual increase
      }));
    };

    // Filter utility readings based on date and type filters
    const getFilteredReadings = () => {
      let filtered = [...readings];

      // Apply date filter
      if (dateFilter !== 'all') {
        filtered = filtered.filter(reading => {
          const readingDate = new Date(reading.date);
          
          switch (dateFilter) {
            case 'specific':
              if (!specificDate) return true;
              const specific = new Date(specificDate);
              return readingDate.toDateString() === specific.toDateString();
            case 'range':
              if (!startDate || !endDate) return true;
              const start = new Date(startDate);
              const end = new Date(endDate);
              return readingDate >= start && readingDate <= end;
            default:
              return true;
          }
        });
      }

      return filtered;
    };

    // Filter utility type for CSV export
    const getFilteredReadingsForExport = () => {
      let filtered = getFilteredReadings();

      // Apply utility type filter
      if (utilityTypeFilter !== 'all') {
        // We'll filter by which columns have data, but for CSV we want all columns
        // This filter is mainly for the summary display
        return filtered;
      }

      return filtered;
    };

    // Download utility readings as CSV
    const downloadUtilityReadingsCSV = () => {
      const filteredReadings = getFilteredReadingsForExport();
      
      // CSV headers
      const headers = [
        'Date',
        'Shift',
        'Recorded By',
        'Power Opening (kWh)',
        'Power Closing (kWh)',
        'Power Consumed (kWh)',
        'Water Opening (m³)',
        'Water Closing (m³)',
        'Water Consumed (m³)',
        'Generator Start Time',
        'Generator Stop Time',
        'Generator Runtime (hours)',
        'Diesel Consumed (L)',
        'Diesel Refill (L)',
        'Notes'
      ];
      
      // CSV rows
      const rows = filteredReadings.map(reading => [
        new Date(reading.date).toLocaleDateString('en-GB'),
        reading.shift || 'N/A',
        reading.recordedBy,
        reading.powerOpening,
        reading.powerClosing,
        reading.powerConsumed,
        reading.waterOpening,
        reading.waterClosing,
        reading.waterConsumed,
        reading.generatorStart,
        reading.generatorStop,
        reading.timeConsumed,
        reading.dieselConsumed,
        reading.dieselRefill || '0',
        reading.notes || 'N/A'
      ]);
      
      // Combine headers and rows
      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Generate filename with date range
      let fileName = 'utility-readings';
      if (dateFilter === 'specific' && specificDate) {
        const dateStr = new Date(specificDate).toISOString().split('T')[0];
        fileName += `_${dateStr}`;
      } else if (dateFilter === 'range' && startDate && endDate) {
        const startStr = new Date(startDate).toISOString().split('T')[0];
        const endStr = new Date(endDate).toISOString().split('T')[0];
        fileName += `_${startStr}_to_${endStr}`;
      }
      if (utilityTypeFilter !== 'all') {
        fileName += `_${utilityTypeFilter}`;
      }
      fileName += `_${new Date().toISOString().split('T')[0]}.csv`;
      
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      // Show success toast (you need to implement toast system or use alert)
      alert(`Downloaded ${filteredReadings.length} utility readings as CSV`);
    };

    // Calculate totals for filtered readings
    const calculateFilteredTotals = (filteredReadings: UtilityReading[]) => {
      let powerTotal = 0;
      let waterTotal = 0;
      let dieselTotal = 0;

      filteredReadings.forEach(reading => {
        powerTotal += parseFloat(reading.powerConsumed) || 0;
        waterTotal += parseFloat(reading.waterConsumed) || 0;
        dieselTotal += parseFloat(reading.dieselConsumed) || 0;
      });

      return { powerTotal, waterTotal, dieselTotal };
    };

    // Clear all filters
    const clearFilters = () => {
      setDateFilter('all');
      setSpecificDate('');
      setStartDate('');
      setEndDate('');
      setUtilityTypeFilter('all');
    };

    // Check if any filters are active
    const hasActiveFilters = dateFilter !== 'all' || utilityTypeFilter !== 'all';

    // Fetch utility data
    const fetchUtilityData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch('/api/utility-readings?limit=100');
            
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Set readings
            setReadings(data.readings || []);
            
            // Calculate totals from all data
            const { powerTotal, waterTotal, dieselTotal } = calculateFilteredTotals(data.readings || []);
            
            setTotalPower(powerTotal);
            setTotalWater(waterTotal);
            setTotalDiesel(dieselTotal);
            
            // Calculate monthly costs
            const powerCost = powerTotal * UTILITY_RATES.electricity * 30;
            const waterCost = waterTotal * UTILITY_RATES.water * 30;
            const dieselCost = dieselTotal * UTILITY_RATES.diesel * 30;
            
            setMonthlyPowerCost(powerCost);
            setMonthlyWaterCost(waterCost);
            setMonthlyDieselCost(dieselCost);
            
            // Generate chart data
            setEnergyConsumptionData(generateChartData(data.readings || []));
            setWaterConsumptionData(generateWaterChartData(data.readings || []));
            setDieselConsumptionData(generateDieselChartData(data.readings || []));
            
            // Generate water quality data
            setWaterQualityData(generateWaterQualityData(waterTotal));
            
            // Calculate additional statistics from readings
            const readingsList = data.readings || [];
            const last7DaysReadings = readingsList.slice(0, 7);
            
            // Calculate average daily diesel consumption
            const avgDailyDiesel = last7DaysReadings.length > 0 
                ? last7DaysReadings.reduce((sum: number, r: any) => sum + Number(r.dieselConsumed), 0) / last7DaysReadings.length
                : 0;
            
            // Update diesel breakdown (for now, estimate fleet diesel as 30% of generator diesel)
            const generatorDiesel = dieselTotal;
            const fleetDiesel = generatorDiesel * 0.3; // Estimate: 30% of generator diesel for fleet
            
            setDieselBreakdown({
              generatorDiesel,
              fleetDiesel
            });
            
            // Update energy overview with correct rates
            setEnergyOverview({
                totalConsumption: { 
                    title: 'Total Consumption (Today)', 
                    value: `${powerTotal.toFixed(0)} kWh`, 
                    change: data.totals?.count > 0 ? '+2% vs. yesterday' : 'No data yet', 
                    changeType: data.totals?.count > 0 ? 'increase' as const : 'neutral' as const 
                },
                monthlyCost: { 
                    title: 'Est. Monthly Cost', 
                    value: `KES ${powerCost.toLocaleString()}`, 
                    change: `at KES ${UTILITY_RATES.electricity}/kWh`, 
                    changeType: 'increase' as const 
                },
                peakDemand: { 
                    title: 'Peak Demand (Today)', 
                    value: readingsList.length > 0 ? `${(Number(readingsList[0].powerConsumed) / 24).toFixed(1)} kW` : '0 kW', 
                    change: readingsList.length > 0 ? 'within limits' : 'No data', 
                    changeType: readingsList.length > 0 ? 'increase' as const : 'neutral' as const 
                },
                powerFactor: { 
                    title: 'Power Factor', 
                    value: readingsList.length > 0 ? '0.92' : '0.00', 
                    change: readingsList.length > 0 ? 'optimal' : 'No data', 
                    changeType: readingsList.length > 0 ? 'increase' as const : 'neutral' as const 
                },
            });

            // Update water overview with correct rates
            setWaterOverview({
                totalConsumption: { 
                    title: 'Water Usage (Today)', 
                    value: `${waterTotal.toFixed(0)} m³`, 
                    change: data.totals?.count > 0 ? '-1.3% vs. yesterday' : 'No data yet', 
                    changeType: data.totals?.count > 0 ? 'decrease' as const : 'neutral' as const 
                },
                monthlyCost: { 
                    title: 'Est. Monthly Water Cost', 
                    value: `KES ${waterCost.toLocaleString()}`, 
                    change: `at KES ${UTILITY_RATES.water}/m³`, 
                    changeType: 'increase' as const 
                },
                qualityStatus: { 
                    title: 'Water Quality', 
                    value: 'Monitoring', 
                    change: 'Municipal Main', 
                    changeType: 'increase' as const 
                },
                recyclingRate: { 
                    title: 'Recycling Rate', 
                    value: '15%', 
                    change: '+2% from last week', 
                    changeType: 'increase' as const 
                },
            });

            // Update diesel overview with correct rates
            setDieselOverview({
                consumptionToday: { 
                    title: 'Today\'s Diesel Consumption', 
                    value: `${dieselTotal.toFixed(1)} L`, 
                    change: data.totals?.count > 0 ? 'Based on generator runtime' : 'No generator runtime', 
                    changeType: data.totals?.count > 0 ? 'increase' as const : 'neutral' as const 
                },
                avgDailyConsumption: { 
                    title: 'Avg. Daily Consumption', 
                    value: `${avgDailyDiesel.toFixed(1)} L`, 
                    change: 'Last 7 days', 
                    changeType: avgDailyDiesel > 0 ? 'increase' as const : 'neutral' as const 
                },
                monthlyCost: { 
                    title: 'Est. Monthly Cost', 
                    value: `KES ${dieselCost.toLocaleString()}`, 
                    change: `at KES ${UTILITY_RATES.diesel}/L`, 
                    changeType: 'increase' as const 
                },
                estimatedRuntime: { 
                    title: 'Estimated Runtime', 
                    value: avgDailyDiesel > 0 ? `${(500 / (avgDailyDiesel / 24)).toFixed(0)} hours` : '0 hours', 
                    change: avgDailyDiesel > 0 ? 'based on avg. consumption' : 'No data', 
                    changeType: avgDailyDiesel > 0 ? 'increase' as const : 'neutral' as const 
                },
            });

            // Update last updated timestamp
            setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            
        } catch (error) {
            console.error('Error fetching utility data:', error);
            setError('Failed to load utility data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch data on component mount
    useEffect(() => {
        fetchUtilityData();
    }, []);

    // Function to refresh data when new readings are saved
    const handleRefreshData = () => {
        fetchUtilityData();
    };

    const energyAnomalyExplain = async (anomaly: ExplainAnomalyInput) => {
        return explainEnergySpike(anomaly);
    }

    const waterAnomalyExplain = async (anomaly: ExplainAnomalyInput) => {
        return explainWaterAnomaly(anomaly);
    }
    
    // Get current filtered data
    const filteredReadings = getFilteredReadings();
    const filteredTotals = calculateFilteredTotals(filteredReadings);
    
    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader>
                    <div className="flex items-center gap-2 p-2">
                        <FreshTraceLogo className="w-8 h-8 text-primary" />
                        <h1 className="text-xl font-headline font-bold text-sidebar-foreground">
                            FreshTrace
                        </h1>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarNav />
                </SidebarContent>
            </Sidebar>
            <SidebarInset>
                <Header />
                <main className="p-4 md:p-6 lg:p-8 space-y-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">
                                Utility Management Dashboard
                            </h2>
                            <p className="text-muted-foreground">
                                Monitor energy, water, and diesel consumption across your operations.
                            </p>
                            <div className="mt-2 text-sm text-muted-foreground">
                                <span className="font-medium">Today&apos;s Totals:</span> {totalPower.toFixed(0)} kWh Power • {totalWater.toFixed(0)} m³ Water • {totalDiesel.toFixed(1)} L Diesel
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                                <span className="font-medium">Current Rates:</span> Electricity: KES {UTILITY_RATES.electricity}/kWh • Water: KES {UTILITY_RATES.water}/m³ • Diesel: KES {UTILITY_RATES.diesel}/L
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                onClick={() => fetchUtilityData()} 
                                variant="outline" 
                                size="sm" 
                                disabled={isLoading}
                            >
                                Refresh
                            </Button>
                        </div>
                    </div>
                    
                    {/* Error Display */}
                    {error && (
                        <div className="bg-destructive/15 text-destructive p-4 rounded-lg flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            <div>
                                <p className="font-medium">Error Loading Data</p>
                                <p className="text-sm">{error}</p>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={fetchUtilityData}
                                className="ml-auto"
                            >
                                Retry
                            </Button>
                        </div>
                    )}

                    {/* Filters and Export Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Filter className="w-5 h-5" />
                                        Data Filters & Export
                                    </CardTitle>
                                    <CardDescription>
                                        Filter utility readings by date and export as CSV
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    {hasActiveFilters && (
                                        <Button 
                                            onClick={clearFilters} 
                                            variant="outline" 
                                            size="sm"
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Clear Filters
                                        </Button>
                                    )}
                                    <Button 
                                        onClick={downloadUtilityReadingsCSV} 
                                        disabled={filteredReadings.length === 0 || isLoading}
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Export CSV ({filteredReadings.length})
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="utility-type">Utility Type</Label>
                                        <Select value={utilityTypeFilter} onValueChange={(value: any) => setUtilityTypeFilter(value)}>
                                            <SelectTrigger id="utility-type">
                                                <SelectValue placeholder="Select utility type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Utilities</SelectItem>
                                                <SelectItem value="electricity">Electricity Only</SelectItem>
                                                <SelectItem value="water">Water Only</SelectItem>
                                                <SelectItem value="diesel">Diesel Only</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div>
                                        <Label htmlFor="date-filter">Date Filter</Label>
                                        <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                                            <SelectTrigger id="date-filter">
                                                <SelectValue placeholder="Select date filter" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Dates</SelectItem>
                                                <SelectItem value="specific">Specific Date</SelectItem>
                                                <SelectItem value="range">Date Range</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {dateFilter === 'specific' && (
                                    <div className="p-4 border rounded-lg">
                                        <Label htmlFor="specific-date">Select Date</Label>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Input
                                                id="specific-date"
                                                type="date"
                                                value={specificDate}
                                                onChange={(e) => setSpecificDate(e.target.value)}
                                                className="flex-1"
                                            />
                                            {specificDate && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSpecificDate('')}
                                                    className="h-10 w-10 p-0"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Filter readings recorded on this specific date
                                        </p>
                                    </div>
                                )}

                                {dateFilter === 'range' && (
                                    <div className="p-4 border rounded-lg">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="start-date">Start Date</Label>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Input
                                                        id="start-date"
                                                        type="date"
                                                        value={startDate}
                                                        onChange={(e) => setStartDate(e.target.value)}
                                                        className="flex-1"
                                                    />
                                                    {startDate && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setStartDate('')}
                                                            className="h-10 w-10 p-0"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <Label htmlFor="end-date">End Date</Label>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Input
                                                        id="end-date"
                                                        type="date"
                                                        value={endDate}
                                                        onChange={(e) => setEndDate(e.target.value)}
                                                        className="flex-1"
                                                    />
                                                    {endDate && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setEndDate('')}
                                                            className="h-10 w-10 p-0"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Filter readings recorded between these dates
                                        </p>
                                    </div>
                                )}

                                <div className="text-sm text-muted-foreground">
                                    Showing {filteredReadings.length} of {readings.length} utility readings
                                    {dateFilter === 'specific' && specificDate && (
                                        <span> • Filtered by date: {new Date(specificDate).toLocaleDateString('en-GB')}</span>
                                    )}
                                    {dateFilter === 'range' && startDate && endDate && (
                                        <span> • Filtered from {new Date(startDate).toLocaleDateString('en-GB')} to {new Date(endDate).toLocaleDateString('en-GB')}</span>
                                    )}
                                    {utilityTypeFilter !== 'all' && (
                                        <span> • Showing {utilityTypeFilter} only</span>
                                    )}
                                </div>

                                {filteredReadings.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                                        <div className="text-center p-3 border rounded-lg">
                                            <div className="text-sm text-gray-500 mb-1">Filtered Power</div>
                                            <div className="text-2xl font-bold text-blue-600">
                                                {filteredTotals.powerTotal.toFixed(0)} kWh
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {(filteredTotals.powerTotal * UTILITY_RATES.electricity).toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}
                                            </div>
                                        </div>
                                        <div className="text-center p-3 border rounded-lg">
                                            <div className="text-sm text-gray-500 mb-1">Filtered Water</div>
                                            <div className="text-2xl font-bold text-cyan-600">
                                                {filteredTotals.waterTotal.toFixed(0)} m³
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {(filteredTotals.waterTotal * UTILITY_RATES.water).toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}
                                            </div>
                                        </div>
                                        <div className="text-center p-3 border rounded-lg">
                                            <div className="text-sm text-gray-500 mb-1">Filtered Diesel</div>
                                            <div className="text-2xl font-bold text-amber-600">
                                                {filteredTotals.dieselTotal.toFixed(1)} L
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {(filteredTotals.dieselTotal * UTILITY_RATES.diesel).toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <UtilityMonitors onSaveSuccess={handleRefreshData} />

                    {/* Diesel Overview Section */}
                    <section id="diesel" className="pt-4">
                        <h3 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
                            <Fuel className="h-5 w-5" />
                            Diesel Management
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <Link href="#diesel" className="block transition-transform hover:scale-[1.02]">
                                        <OverviewCard data={dieselOverview.consumptionToday} icon={Fuel} />
                                    </Link>
                                    <Link href="#diesel" className="block transition-transform hover:scale-[1.02]">
                                        <OverviewCard data={dieselOverview.avgDailyConsumption} icon={Thermometer} />
                                    </Link>
                                    <Link href="#diesel" className="block transition-transform hover:scale-[1.02]">
                                        <OverviewCard data={dieselOverview.monthlyCost} icon={DollarSign} />
                                    </Link>
                                    <Link href="#diesel" className="block transition-transform hover:scale-[1.02]">
                                        <OverviewCard data={dieselOverview.estimatedRuntime} icon={Clock} />
                                    </Link>
                                </div>
                                {/* Diesel Consumption Chart */}
                                <div className="mt-6">
                                    <DieselConsumptionChart 
                                        data={dieselConsumptionData}
                                        isLoading={isLoading}
                                    />
                                </div>
                            </div>
                            <div className="lg:col-span-1">
                                <DieselBreakdownChart 
                                    generatorDiesel={dieselBreakdown.generatorDiesel}
                                    fleetDiesel={dieselBreakdown.fleetDiesel}
                                    isLoading={isLoading}
                                />
                            </div>
                        </div>
                    </section>
                    
                    <section id="energy">
                        <h3 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
                            <Zap className="h-5 w-5" />
                            Energy Management
                        </h3>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Link href="#energy" className="block transition-transform hover:scale-[1.02]">
                                    <OverviewCard data={energyOverview.totalConsumption} icon={Zap} />
                                </Link>
                                <Link href="#energy" className="block transition-transform hover:scale-[1.02]">
                                    <OverviewCard data={energyOverview.monthlyCost} icon={DollarSign} />
                                </Link>
                                <Link href="#energy" className="block transition-transform hover:scale-[1.02]">
                                    <OverviewCard data={energyOverview.peakDemand} icon={Thermometer} />
                                </Link>
                                <Link href="#energy" className="block transition-transform hover:scale-[1.02]">
                                    <OverviewCard data={energyOverview.powerFactor} icon={Bolt} />
                                </Link>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2">
                                    <EnergyConsumptionChart data={energyConsumptionData.map(d => ({ hour: d.date, usage: d.value }))} />
                                </div>
                                <div className="lg:col-span-1">
                                    <EnergyBreakdownChart data={[
                                        { name: 'Lighting', value: 30, fill: 'hsl(var(--chart-1))' },
                                        { name: 'HVAC', value: 40, fill: 'hsl(var(--chart-2))' },
                                        { name: 'Machinery', value: 30, fill: 'hsl(var(--chart-3))' },
                                    ]} />
                                </div>
                                <div className="lg:col-span-2">
                                    <EnergyCostChart data={generateEnergyCostData(monthlyPowerCost)} />
                                </div>
                                <div className="lg:col-span-1">
                                    <AnomalyDetection anomalies={[]} onExplain={energyAnomalyExplain} />
                                </div>
                            </div>
                        </div>
                    </section>
                    
                    <section id="water" className="pt-8">
                        <h3 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
                            <Droplet className="h-5 w-5" />
                            Water Management
                        </h3>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Link href="#water" className="block transition-transform hover:scale-[1.02]">
                                    <OverviewCard data={waterOverview.totalConsumption} icon={Droplet} />
                                </Link>
                                <Link href="#water" className="block transition-transform hover:scale-[1.02]">
                                    <OverviewCard data={waterOverview.monthlyCost} icon={DollarSign} />
                                </Link>
                                <Link href="#water" className="block transition-transform hover:scale-[1.02]">
                                    <OverviewCard data={waterOverview.qualityStatus} icon={Thermometer} />
                                </Link>
                                <Link href="#water" className="block transition-transform hover:scale-[1.02]">
                                    <OverviewCard data={waterOverview.recyclingRate} icon={Bolt} />
                                </Link>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2">
                                    <WaterConsumptionChart data={waterConsumptionData.map(d => ({ day: d.date.split(' ')[0], consumption: d.value }))} />
                                </div>
                                <div className="lg:col-span-1">
                                    <WaterBreakdownChart data={[
                                        { name: 'Processing', value: 50, fill: 'hsl(var(--chart-1))' },
                                        { name: 'Cleaning', value: 25, fill: 'hsl(var(--chart-2))' },
                                        { name: 'Irrigation', value: 15, fill: 'hsl(var(--chart-3))' },
                                        { name: 'Other', value: 10, fill: 'hsl(var(--chart-4))' },
                                    ]} />
                                </div>
                                <div className="lg:col-span-3">
                                    <WaterQualityTable data={waterQualityData} />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Data Status Indicator */}
                    <div className="pt-4 border-t">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                {isLoading ? (
                                    <>
                                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                                        <span>Loading data...</span>
                                    </>
                                ) : error ? (
                                    <>
                                        <div className="h-2 w-2 rounded-full bg-destructive"></div>
                                        <span className="text-destructive">Error loading data</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                        <span>Data loaded successfully</span>
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <span>Last updated: {lastUpdated}</span>
                                <span>Total readings: {readings.length}</span>
                                <button 
                                    onClick={fetchUtilityData}
                                    disabled={isLoading}
                                    className="text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            Refreshing...
                                        </>
                                    ) : 'Refresh Data'}
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}