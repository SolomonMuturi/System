'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Button } from '@/components/ui/button';
import { ArrowLeft, Fuel, Bell, Save, Zap, Droplet, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { DieselConsumptionChart } from '@/components/dashboard/diesel-consumption-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

// Types for our data
interface UtilityReading {
  id: string;
  date: string;
  dieselConsumed: string;
  dieselRefill: string | null;
  generatorStart: string;
  generatorStop: string;
  timeConsumed: string;
  recordedBy: string;
  shift: string | null;
}

interface DieselAnalytics {
  totalConsumed: number;
  totalRefilled: number;
  avgDailyConsumption: number;
  currentLevel: number;
  daysWithoutRefill: number;
  estimatedRemainingDays: number;
}

export default function DieselAnalyticsPage() {
    const router = useRouter();
    const { toast } = useToast();
    
    // State
    const [readings, setReadings] = useState<UtilityReading[]>([]);
    const [analytics, setAnalytics] = useState<DieselAnalytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [alertThreshold, setAlertThreshold] = useState(25);
    const [timeRange, setTimeRange] = useState('7'); // 7, 30, 90 days

    // Fetch diesel data
    const fetchDieselData = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/utility-readings?limit=${timeRange}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch diesel data');
            }
            
            const data = await response.json();
            
            // Transform the data for our needs
            const dieselReadings: UtilityReading[] = data.readings.map((reading: any) => ({
                id: reading.id,
                date: new Date(reading.date).toLocaleDateString(),
                dieselConsumed: reading.dieselConsumed,
                dieselRefill: reading.dieselRefill,
                generatorStart: reading.generatorStart,
                generatorStop: reading.generatorStop,
                timeConsumed: reading.timeConsumed,
                recordedBy: reading.recordedBy,
                shift: reading.shift
            }));
            
            setReadings(dieselReadings);
            
            // Calculate analytics
            calculateAnalytics(dieselReadings, data.totals?.totalDiesel || 0);
            
        } catch (error) {
            console.error('Error fetching diesel data:', error);
            toast({
                title: 'Error',
                description: 'Failed to load diesel analytics data',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate analytics from readings
    const calculateAnalytics = (readings: UtilityReading[], totalDiesel: number) => {
        if (readings.length === 0) {
            setAnalytics({
                totalConsumed: 0,
                totalRefilled: 0,
                avgDailyConsumption: 0,
                currentLevel: 100, // Default to full
                daysWithoutRefill: 0,
                estimatedRemainingDays: 0
            });
            return;
        }

        // Calculate totals
        const totalConsumed = readings.reduce((sum, reading) => 
            sum + parseFloat(reading.dieselConsumed), 0);
        
        const totalRefilled = readings.reduce((sum, reading) => 
            sum + (reading.dieselRefill ? parseFloat(reading.dieselRefill) : 0), 0);

        // Find last refill
        const lastRefill = readings.find(reading => reading.dieselRefill && parseFloat(reading.dieselRefill) > 0);
        const daysWithoutRefill = lastRefill 
            ? Math.floor((new Date().getTime() - new Date(lastRefill.date).getTime()) / (1000 * 60 * 60 * 24))
            : readings.length;

        // Average daily consumption (L/day)
        const uniqueDays = new Set(readings.map(r => r.date)).size;
        const avgDailyConsumption = totalConsumed / (uniqueDays || 1);

        // Current level simulation (this would come from IoT sensor in real app)
        const tankCapacity = 1000; // Assume 1000L tank
        const startingLevel = 800; // Assume starting at 800L
        const currentLevelInLiters = Math.max(0, startingLevel + totalRefilled - totalConsumed);
        const currentLevel = (currentLevelInLiters / tankCapacity) * 100;
        
        // Estimated remaining days at current consumption rate
        const estimatedRemainingDays = avgDailyConsumption > 0 
            ? Math.floor(currentLevelInLiters / avgDailyConsumption) 
            : 0;

        setAnalytics({
            totalConsumed,
            totalRefilled,
            avgDailyConsumption,
            currentLevel: Math.round(currentLevel),
            daysWithoutRefill,
            estimatedRemainingDays
        });
    };

    // Handle saving alert threshold
    const handleSaveThreshold = () => {
        // In a real app, you would save this to your database
        localStorage.setItem('dieselAlertThreshold', alertThreshold.toString());
        
        toast({
            title: 'Threshold Saved',
            description: `You will be alerted when diesel level drops below ${alertThreshold}%.`
        });
    };

    // Format data for the chart
    const getChartData = () => {
        if (readings.length === 0) {
            return Array.from({ length: 7 }, (_, i) => ({
                date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
                dieselConsumed: 0
            }));
        }

        return readings.slice(0, 7).map(reading => ({
            date: reading.date,
            dieselConsumed: parseFloat(reading.dieselConsumed)
        })).reverse(); // Reverse to show oldest to newest
    };

    // Load alert threshold from localStorage
    useEffect(() => {
        const savedThreshold = localStorage.getItem('dieselAlertThreshold');
        if (savedThreshold) {
            setAlertThreshold(parseInt(savedThreshold));
        }
    }, []);

    // Fetch data on component mount and when timeRange changes
    useEffect(() => {
        fetchDieselData();
    }, [timeRange]);

    const isLow = analytics && analytics.currentLevel <= alertThreshold;

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader>
                    <div className="flex items-center gap-2 p-2">
                        <FreshTraceLogo className="w-8 h-8 text-primary" />
                        <h1 className="text-xl font-headline font-bold text-sidebar-foreground">
                            Harir International
                        </h1>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarNav />
                </SidebarContent>
            </Sidebar>
            <SidebarInset>
                <Header />
                <main className="p-4 md:p-6 lg:p-8 space-y-6">
                    <div className="mb-6">
                        <Button variant="outline" onClick={() => router.back()} className="mb-4">
                            <ArrowLeft className="mr-2" />
                            Back to Utility Management
                        </Button>
                        <h2 className="text-2xl font-bold tracking-tight">
                            Generator Diesel Analytics
                        </h2>
                        <p className="text-muted-foreground">
                            Track diesel consumption, refill history, and set alert thresholds.
                        </p>
                    </div>

                    {/* Time Range Selector */}
                    <div className="flex justify-between items-center">
                        <div className="space-y-2">
                            <Label htmlFor="time-range">Time Range</Label>
                            <Select value={timeRange} onValueChange={setTimeRange}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select time range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7">Last 7 days</SelectItem>
                                    <SelectItem value="30">Last 30 days</SelectItem>
                                    <SelectItem value="90">Last 90 days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {isLoading && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading data...
                            </div>
                        )}
                    </div>

                    {/* Analytics Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Total Consumed ({timeRange} days)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-24" />
                                ) : (
                                    <div className="text-2xl font-bold">
                                        {analytics?.totalConsumed.toFixed(1)} L
                                    </div>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    @ {analytics?.avgDailyConsumption.toFixed(1)} L/day
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Total Refilled
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-24" />
                                ) : (
                                    <div className="text-2xl font-bold text-green-600">
                                        +{analytics?.totalRefilled.toFixed(1)} L
                                    </div>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Days since last refill: {analytics?.daysWithoutRefill}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className={cn(isLow && "border-destructive ring-1 ring-destructive")}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                    <Fuel className="h-3 w-3" />
                                    Current Level
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-24" />
                                ) : (
                                    <>
                                        <div className={cn("text-2xl font-bold", isLow && "text-destructive")}>
                                            {analytics?.currentLevel}%
                                        </div>
                                        {isLow && (
                                            <div className="flex items-center gap-1 text-xs text-destructive mt-1">
                                                <AlertTriangle className="h-3 w-3" />
                                                Low fuel alert
                                            </div>
                                        )}
                                    </>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    ~{analytics?.estimatedRemainingDays} days remaining
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Avg. Runtime
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-24" />
                                ) : readings.length > 0 ? (
                                    <>
                                        <div className="text-2xl font-bold">
                                            {(readings.reduce((sum, r) => {
                                                const [hours, minutes] = r.timeConsumed.split(' ').filter(word => 
                                                    word.includes('hour') || word.includes('minute')
                                                );
                                                let totalHours = 0;
                                                if (hours) totalHours += parseInt(hours);
                                                if (minutes) totalHours += parseInt(minutes) / 60;
                                                return sum + totalHours;
                                            }, 0) / readings.length).toFixed(1)} hrs
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            per day
                                        </p>
                                    </>
                                ) : (
                                    <div className="text-2xl font-bold">0 hrs</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Consumption Chart */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Daily Diesel Consumption</CardTitle>
                                    <CardDescription>
                                        Generator diesel usage over the last {readings.length > 7 ? 7 : readings.length} days
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {isLoading ? (
                                        <Skeleton className="h-[300px] w-full" />
                                    ) : (
                                        <DieselConsumptionChart data={getChartData()} />
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                        
                        {/* Alert Threshold Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell />
                                    Alert Settings
                                </CardTitle>
                                <CardDescription>Configure low fuel notifications</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="threshold-input">Low Fuel Alert Level (%)</Label>
                                    <Input
                                        id="threshold-input"
                                        type="number"
                                        min="5"
                                        max="50"
                                        value={alertThreshold}
                                        onChange={(e) => setAlertThreshold(Number(e.target.value))}
                                        className="text-lg"
                                    />
                                </div>
                                
                                <div className="p-4 rounded-lg bg-muted/50">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm">Tank Level</span>
                                        <span className="text-sm font-mono">{analytics?.currentLevel}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                            className={cn("h-full transition-all duration-500", 
                                                analytics && analytics.currentLevel > 50 ? 'bg-green-500' :
                                                analytics && analytics.currentLevel > 25 ? 'bg-yellow-500' : 'bg-red-500'
                                            )}
                                            style={{ width: `${analytics?.currentLevel || 0}%` }}
                                        />
                                    </div>
                                    <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                                        <span>Empty</span>
                                        <span>Full</span>
                                    </div>
                                </div>
                                
                                {isLow && (
                                    <div className="p-3 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        <div>
                                            <p className="font-medium">Low Fuel Alert</p>
                                            <p className="text-sm">Fuel level is below threshold</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleSaveThreshold} className="w-full" disabled={isLoading}>
                                    <Save className="mr-2 h-4 w-4"/>
                                    Save Threshold
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                    
                    {/* Historical Readings Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Historical Readings</CardTitle>
                            <CardDescription>
                                Daily log of generator diesel consumption and refills
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ) : readings.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Fuel className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p>No diesel readings found</p>
                                    <p className="text-sm">Start recording utility readings to see data here</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Shift</TableHead>
                                            <TableHead>Runtime</TableHead>
                                            <TableHead className="text-right">Diesel Used (L)</TableHead>
                                            <TableHead className="text-right">Refill (L)</TableHead>
                                            <TableHead>Recorded By</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {readings.map((reading) => {
                                            const isLowLevel = analytics && 
                                                (analytics.currentLevel - parseFloat(reading.dieselConsumed) / 10) <= alertThreshold;
                                            
                                            return (
                                                <TableRow key={reading.id}>
                                                    <TableCell className="font-medium">{reading.date}</TableCell>
                                                    <TableCell>
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                                                            {reading.shift || 'N/A'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {reading.timeConsumed}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className={cn("text-right font-mono", isLowLevel && "text-destructive font-bold")}>
                                                        {parseFloat(reading.dieselConsumed).toFixed(1)} L
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono">
                                                        {reading.dieselRefill ? (
                                                            <span className="text-green-600 font-bold">
                                                                +{parseFloat(reading.dieselRefill).toFixed(1)} L
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm text-muted-foreground">
                                                            {reading.recordedBy}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}