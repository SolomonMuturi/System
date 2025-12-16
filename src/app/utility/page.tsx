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
import { DollarSign, Thermometer, Bolt, Zap, Droplet, Fuel, Clock, AlertTriangle, BarChart, PieChart } from 'lucide-react';
import type { ExplainAnomalyInput } from "@/ai/flows/explain-anomaly-detection";
import { explainEnergySpike } from '@/ai/flows/explain-energy-spike';
import { explainWaterAnomaly } from '@/ai/flows/explain-water-anomaly';
import { Skeleton } from '@/components/ui/skeleton';
import { UtilityMonitors } from '@/components/dashboard/utility-monitors';
import { Button } from '@/components/ui/button';

// Define utility rates
const UTILITY_RATES = {
  electricity: 25, // KES per kWh
  water: 130,      // KES per m³
  diesel: 74       // KES per liter
} as const;

// Default/fallback data in case imports fail
const defaultEnergyConsumptionData = [
  { hour: '00:00', usage: 120 },
  { hour: '04:00', usage: 90 },
  { hour: '08:00', usage: 250 },
  { hour: '12:00', usage: 320 },
  { hour: '16:00', usage: 280 },
  { hour: '20:00', usage: 180 },
];

const defaultEnergyBreakdownData = [
  { name: 'Lighting', value: 25, fill: 'hsl(var(--chart-1))' },
  { name: 'HVAC', value: 40, fill: 'hsl(var(--chart-2))' },
  { name: 'Machinery', value: 35, fill: 'hsl(var(--chart-3))' },
];

const defaultEnergyCostData = [
  { month: 'Jan', cost: 125000 },
  { month: 'Feb', cost: 132000 },
  { month: 'Mar', cost: 118000 },
  { month: 'Apr', cost: 140000 },
  { month: 'May', cost: 128000 },
  { month: 'Jun', cost: 135000 },
];

const defaultWaterConsumptionData = [
  { day: 'Mon', consumption: 45 },
  { day: 'Tue', consumption: 48 },
  { day: 'Wed', consumption: 42 },
  { day: 'Thu', consumption: 50 },
  { day: 'Fri', consumption: 47 },
  { day: 'Sat', consumption: 38 },
  { day: 'Sun', consumption: 35 },
];

const defaultWaterBreakdownData = [
  { name: 'Processing', value: 45, fill: 'hsl(var(--chart-1))' },
  { name: 'Cleaning', value: 25, fill: 'hsl(var(--chart-2))' },
  { name: 'Irrigation', value: 20, fill: 'hsl(var(--chart-3))' },
  { name: 'Other', value: 10, fill: 'hsl(var(--chart-4))' },
];

const defaultWaterQualityData = [
  { parameter: 'pH', value: '7.2', status: 'Good', unit: '' },
  { parameter: 'Turbidity', value: '1.2', status: 'Good', unit: 'NTU' },
  { parameter: 'Chlorine', value: '1.8', status: 'Good', unit: 'mg/L' },
  { parameter: 'TDS', value: '320', status: 'Good', unit: 'ppm' },
  { parameter: 'Hardness', value: '150', status: 'Moderate', unit: 'mg/L' },
];

const defaultEnergyAnomalyData = [
  { id: 1, metric: 'Power Spike', value: '450 kW', timestamp: '2024-01-15 14:30', severity: 'high' },
  { id: 2, metric: 'Low Power Factor', value: '0.75', timestamp: '2024-01-14 11:15', severity: 'medium' },
  { id: 3, metric: 'Voltage Fluctuation', value: '±8%', timestamp: '2024-01-13 09:45', severity: 'low' },
];

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
  () => import('@/components/dashboard/diesel-breakdown-chart').catch(() => {
    return () => <ChartErrorFallback title="Diesel Breakdown" icon={Fuel} />;
  }),
  { 
    ssr: false, 
    loading: () => <Skeleton className="h-[386px] w-full" />,
  }
);

// Try to import data from lib, fallback to defaults
let energyConsumptionData = defaultEnergyConsumptionData;
let energyBreakdownData = defaultEnergyBreakdownData;
let energyCostData = defaultEnergyCostData;
let energyAnomalyData = defaultEnergyAnomalyData;
let waterConsumptionData = defaultWaterConsumptionData;
let waterBreakdownData = defaultWaterBreakdownData;
let waterQualityData = defaultWaterQualityData;

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
    const [chartDataError, setChartDataError] = useState<string | null>(null);

    // Fetch utility data
    const fetchUtilityData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch('/api/utility-readings');
            
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Update state with totals
            setTotalPower(data.totals?.totalPower || 0);
            setTotalWater(data.totals?.totalWater || 0);
            setTotalDiesel(data.totals?.totalDiesel || 0);
            
            // Calculate additional statistics from readings
            const readings = data.readings || [];
            const last7DaysReadings = readings.slice(0, 7);
            
            // Calculate average daily diesel consumption
            const avgDailyDiesel = last7DaysReadings.length > 0 
                ? last7DaysReadings.reduce((sum: number, r: any) => sum + Number(r.dieselConsumed), 0) / last7DaysReadings.length
                : 0;
            
            // Calculate monthly costs with correct rates
            const monthlyPowerCost = (data.totals?.totalPower || 0) * UTILITY_RATES.electricity * 30;
            const monthlyWaterCost = (data.totals?.totalWater || 0) * UTILITY_RATES.water * 30;
            const monthlyDieselCost = (data.totals?.totalDiesel || 0) * UTILITY_RATES.diesel * 30;
            
            // Update diesel breakdown (for now, estimate fleet diesel as 30% of generator diesel)
            // In a real app, you would fetch this from a fleet/vehicle API
            const generatorDiesel = data.totals?.totalDiesel || 0;
            const fleetDiesel = generatorDiesel * 0.3; // Estimate: 30% of generator diesel for fleet
            
            setDieselBreakdown({
              generatorDiesel,
              fleetDiesel
            });
            
            // Update energy overview with correct rates
            setEnergyOverview({
                totalConsumption: { 
                    title: 'Total Consumption (Today)', 
                    value: `${(data.totals?.totalPower || 0).toFixed(0)} kWh`, 
                    change: data.totals?.count > 0 ? '+2% vs. yesterday' : 'No data yet', 
                    changeType: data.totals?.count > 0 ? 'increase' as const : 'neutral' as const 
                },
                monthlyCost: { 
                    title: 'Est. Monthly Cost', 
                    value: `KES ${monthlyPowerCost.toLocaleString()}`, 
                    change: `at KES ${UTILITY_RATES.electricity}/kWh`, 
                    changeType: 'increase' as const 
                },
                peakDemand: { 
                    title: 'Peak Demand (Today)', 
                    value: readings.length > 0 ? `${(Number(readings[0].powerConsumed) / 24).toFixed(1)} kW` : '0 kW', 
                    change: readings.length > 0 ? 'within limits' : 'No data', 
                    changeType: readings.length > 0 ? 'increase' as const : 'neutral' as const 
                },
                powerFactor: { 
                    title: 'Power Factor', 
                    value: readings.length > 0 ? '0.92' : '0.00', 
                    change: readings.length > 0 ? 'optimal' : 'No data', 
                    changeType: readings.length > 0 ? 'increase' as const : 'neutral' as const 
                },
            });

            // Update water overview with correct rates
            setWaterOverview({
                totalConsumption: { 
                    title: 'Water Usage (Today)', 
                    value: `${(data.totals?.totalWater || 0).toFixed(0)} m³`, 
                    change: data.totals?.count > 0 ? '-1.3% vs. yesterday' : 'No data yet', 
                    changeType: data.totals?.count > 0 ? 'decrease' as const : 'neutral' as const 
                },
                monthlyCost: { 
                    title: 'Est. Monthly Water Cost', 
                    value: `KES ${monthlyWaterCost.toLocaleString()}`, 
                    change: `at KES ${UTILITY_RATES.water}/m³`, 
                    changeType: 'increase' as const 
                },
                qualityStatus: { 
                    title: 'Water Quality', 
                    value: readings.length > 0 ? 'Fail' : 'N/A', 
                    change: 'Municipal Main', 
                    changeType: 'increase' as const 
                },
                recyclingRate: { 
                    title: 'Recycling Rate', 
                    value: readings.length > 0 ? '15%' : '0%', 
                    change: readings.length > 0 ? '+2% from last week' : 'No data', 
                    changeType: readings.length > 0 ? 'increase' as const : 'neutral' as const 
                },
            });

            // Update diesel overview with correct rates
            setDieselOverview({
                consumptionToday: { 
                    title: 'Today\'s Diesel Consumption', 
                    value: `${(data.totals?.totalDiesel || 0).toFixed(1)} L`, 
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
                    value: `KES ${monthlyDieselCost.toLocaleString()}`, 
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
        
        // Try to load chart data from lib
        try {
          // Dynamically import the data
          import('@/lib/data').then((dataModule) => {
            energyConsumptionData = dataModule.energyConsumptionData || defaultEnergyConsumptionData;
            energyBreakdownData = dataModule.energyBreakdownData || defaultEnergyBreakdownData;
            energyCostData = dataModule.energyCostData || defaultEnergyCostData;
            energyAnomalyData = dataModule.energyAnomalyData || defaultEnergyAnomalyData;
            waterConsumptionData = dataModule.waterConsumptionData || defaultWaterConsumptionData;
            waterBreakdownData = dataModule.waterBreakdownData || defaultWaterBreakdownData;
            waterQualityData = dataModule.waterQualityData || defaultWaterQualityData;
          }).catch((importError) => {
            console.warn('Failed to import chart data from lib/data:', importError);
            setChartDataError('Using default chart data');
          });
        } catch (error) {
          console.warn('Error loading chart data:', error);
          setChartDataError('Using default chart data');
        }
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
                        {chartDataError && (
                            <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded inline-block">
                                {chartDataError}
                            </div>
                        )}
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
                                    <EnergyConsumptionChart data={energyConsumptionData} />
                                </div>
                                <div className="lg:col-span-1">
                                    <EnergyBreakdownChart data={energyBreakdownData} />
                                </div>
                                <div className="lg:col-span-2">
                                    <EnergyCostChart data={energyCostData} />
                                </div>
                                <div className="lg:col-span-1">
                                    <AnomalyDetection anomalies={energyAnomalyData} onExplain={energyAnomalyExplain} />
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
                                    <WaterConsumptionChart data={waterConsumptionData} />
                                </div>
                                <div className="lg:col-span-1">
                                    <WaterBreakdownChart data={waterBreakdownData} />
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