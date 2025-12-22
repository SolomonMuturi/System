'use client';

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
import { OverviewCard } from '@/components/dashboard/overview-card';
import {
  PackageSearch,
  Thermometer,
  Users,
  Truck,
  Scale,
  Package,
  HardHat,
  QrCode,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  BarChart3,
  Calendar,
  RefreshCw,
  Loader2,
  Activity,
  ClipboardCheck,
  FileText,
  Wifi,
  WifiOff,
  User,
  Briefcase,
  Building,
  Percent,
} from 'lucide-react';
import { ColdChainChart } from '@/components/dashboard/cold-chain-chart';
import { RecentAlerts } from '@/components/dashboard/recent-alerts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/use-user';
import { ShipmentDataTable } from '@/components/dashboard/shipment-data-table';
import { ProcessingStationStatus } from '@/components/dashboard/processing-station-status';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Types
interface DashboardStats {
  // Employee Stats
  totalEmployees: number;
  employeesPresentToday: number;
  employeesOnLeave: number;
  attendanceRate: number;
  employeesByContract: {
    fullTime: number;
    partTime: number;
    contract: number;
  };
  
  // Supplier Stats
  totalSuppliers: number;
  activeSuppliers: number;
  inactiveSuppliers: number;
  suppliersOnboarding: number;
  
  // Vehicle/Gate Stats
  totalVehicles: number;
  vehiclesOnSite: number;
  vehiclesInTransit: number;
  vehiclesPendingExit: number;
  vehiclesCompletedToday: number;
  
  // Operational Stats
  palletsWeighedToday: number;
  totalWeightToday: number;
  coldRoomCapacity: number;
  qualityCheckPassRate: number;
  todayIntakes: number;
  todayProcessed: number;
  todayDispatched: number;
  
  // Financial Stats
  todayOperationalCost: number;
  monthlyOperationalCost: number;
  dieselConsumptionToday: number;
  electricityConsumptionToday: number;
  
  // Performance Metrics
  intakeEfficiency: number;
  processingEfficiency: number;
  dispatchAccuracy: number;
  
  // Recent Alerts
  recentAlerts: Array<{
    id: string;
    type: 'temperature' | 'weight' | 'vehicle' | 'quality' | 'attendance';
    message: string;
    severity: 'high' | 'medium' | 'low';
    time: string;
  }>;
  
  // Cold Chain Data
  coldChainData: Array<{
    id: string;
    name: string;
    temperature: number;
    humidity: number;
    status: 'optimal' | 'warning' | 'normal';
  }>;
  
  // Shipment Data
  shipmentData: Array<{
    id: string;
    supplier: string;
    product: string;
    status: 'Receiving' | 'Weighing' | 'Quality Check' | 'Cold Room' | 'Processing' | 'In-Transit' | 'Delivered';
    arrival: string;
    weight: number;
  }>;
  
  // VMS/IoT Data
  vmsIotData: Array<{
    id: string;
    device: string;
    location: string;
    status: 'online' | 'offline';
    lastUpdate: string;
  }>;
}

const AdminDashboard = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Never');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch employee data
      const employeesResponse = await fetch('/api/employees');
      const employeesData = employeesResponse.ok ? await employeesResponse.json() : [];
      
      // Fetch attendance data
      const attendanceResponse = await fetch('/api/attendance');
      const attendanceData = attendanceResponse.ok ? await attendanceResponse.json() : [];
      
      // Fetch supplier data
      const suppliersResponse = await fetch('/api/suppliers');
      const suppliersData = suppliersResponse.ok ? await suppliersResponse.json() : [];
      
      // Fetch vehicle/gate data
      const vehiclesResponse = await fetch('/api/suppliers?vehicles=true');
      const vehiclesData = vehiclesResponse.ok ? await vehiclesResponse.json() : [];
      
      // Calculate today's date for filtering
      const today = new Date().toISOString().split('T')[0];
      
      // Process employee statistics
      const totalEmployees = employeesData.length;
      const todayAttendance = attendanceData.filter((record: any) => record.date === today);
      const employeesPresentToday = todayAttendance.filter((record: any) => 
        record.status === 'Present' || record.status === 'Late'
      ).length;
      const employeesOnLeave = todayAttendance.filter((record: any) => 
        record.status === 'On Leave'
      ).length;
      const attendanceRate = totalEmployees > 0 
        ? Math.round((employeesPresentToday / totalEmployees) * 100)
        : 0;
      
      const employeesByContract = {
        fullTime: employeesData.filter((emp: any) => emp.contract === 'Full-time').length,
        partTime: employeesData.filter((emp: any) => emp.contract === 'Part-time').length,
        contract: employeesData.filter((emp: any) => emp.contract === 'Contract').length,
      };
      
      // Process supplier statistics
      const totalSuppliers = suppliersData.length;
      const activeSuppliers = suppliersData.filter((sup: any) => sup.status === 'Active').length;
      const inactiveSuppliers = suppliersData.filter((sup: any) => sup.status === 'Inactive').length;
      const suppliersOnboarding = suppliersData.filter((sup: any) => sup.status === 'Onboarding').length;
      
      // Process vehicle statistics
      const totalVehicles = vehiclesData.filter((v: any) => v.vehicle_number_plate).length;
      const vehiclesOnSite = vehiclesData.filter((v: any) => 
        v.vehicle_status === 'Checked-in' || v.vehicle_status === 'Pending Exit'
      ).length;
      const vehiclesInTransit = vehiclesData.filter((v: any) => 
        v.vehicle_status === 'In-Transit'
      ).length;
      const vehiclesPendingExit = vehiclesData.filter((v: any) => 
        v.vehicle_status === 'Pending Exit'
      ).length;
      const vehiclesCompletedToday = vehiclesData.filter((v: any) => {
        if (!v.vehicle_check_out_time) return false;
        const checkOutDate = new Date(v.vehicle_check_out_time).toISOString().split('T')[0];
        return checkOutDate === today;
      }).length;
      
      // Process operational statistics (you would need to implement these APIs)
      const palletsWeighedToday = 0; // Implement API for this
      const totalWeightToday = 0; // Implement API for this
      const coldRoomCapacity = 85; // Default or implement API
      const qualityCheckPassRate = 94.5; // Default or implement API
      const todayIntakes = 0; // Implement API for this
      const todayProcessed = 0; // Implement API for this
      const todayDispatched = 0; // Implement API for this
      
      // Process financial statistics (you would need to implement these APIs)
      const todayOperationalCost = 0; // Implement API for this
      const monthlyOperationalCost = 0; // Implement API for this
      const dieselConsumptionToday = 0; // Implement API for this
      const electricityConsumptionToday = 0; // Implement API for this
      
      // Process performance metrics (you would need to implement these APIs)
      const intakeEfficiency = 92; // Implement API for this
      const processingEfficiency = 88; // Implement API for this
      const dispatchAccuracy = 96; // Implement API for this
      
      // Generate recent alerts from various sources
      const recentAlerts = generateRecentAlerts(
        employeesData,
        attendanceData,
        suppliersData,
        vehiclesData
      );
      
      // Cold chain data (you would need IoT API for this)
      const coldChainData = [
        { id: 'cold-1', name: 'Cold Room 1', temperature: 3.2, humidity: 75, status: 'optimal' as const },
        { id: 'cold-2', name: 'Cold Room 2', temperature: 4.8, humidity: 72, status: 'warning' as const },
        { id: 'cold-3', name: 'Cold Room 3', temperature: 2.8, humidity: 78, status: 'optimal' as const },
        { id: 'cold-4', name: 'Processing Line', temperature: 15.5, humidity: 65, status: 'normal' as const },
        { id: 'cold-5', name: 'Loading Dock', temperature: 22.3, humidity: 60, status: 'normal' as const },
      ];
      
      // Shipment data (you would need shipments API for this)
      const shipmentData = [
        { id: 'SHIP-001', supplier: 'Green Valley Farms', product: 'Avocados', status: 'Receiving', arrival: '10:30 AM', weight: 1500 },
        { id: 'SHIP-002', supplier: 'Mountain Fresh', product: 'Mangoes', status: 'Weighing', arrival: '11:15 AM', weight: 1200 },
        { id: 'SHIP-003', supplier: 'Sunrise Orchards', product: 'Avocados', status: 'Quality Check', arrival: '9:45 AM', weight: 1800 },
        { id: 'SHIP-004', supplier: 'River Side Produce', product: 'Pineapples', status: 'Cold Room', arrival: '8:30 AM', weight: 900 },
        { id: 'SHIP-005', supplier: 'Highland Fruits', product: 'Passion Fruits', status: 'Processing', arrival: '1:00 PM', weight: 750 },
      ];
      
      // VMS/IoT data (you would need IoT API for this)
      const vmsIotData = [
        { id: 'device-1', device: 'Temperature Sensor #1', location: 'Cold Room 1', status: 'online' as const, lastUpdate: '2 min ago' },
        { id: 'device-2', device: 'Weight Scale #2', location: 'Weighing Station', status: 'online' as const, lastUpdate: '5 min ago' },
        { id: 'device-3', device: 'GPS Tracker #15', location: 'Vehicle KAB 123X', status: 'online' as const, lastUpdate: '30 sec ago' },
        { id: 'device-4', device: 'Humidity Sensor #3', location: 'Cold Room 3', status: 'offline' as const, lastUpdate: '1 hour ago' },
        { id: 'device-5', device: 'Door Sensor #4', location: 'Loading Bay', status: 'online' as const, lastUpdate: '10 min ago' },
      ];
      
      const dashboardStats: DashboardStats = {
        // Employee Stats
        totalEmployees,
        employeesPresentToday,
        employeesOnLeave,
        attendanceRate,
        employeesByContract,
        
        // Supplier Stats
        totalSuppliers,
        activeSuppliers,
        inactiveSuppliers,
        suppliersOnboarding,
        
        // Vehicle/Gate Stats
        totalVehicles,
        vehiclesOnSite,
        vehiclesInTransit,
        vehiclesPendingExit,
        vehiclesCompletedToday,
        
        // Operational Stats
        palletsWeighedToday,
        totalWeightToday,
        coldRoomCapacity,
        qualityCheckPassRate,
        todayIntakes,
        todayProcessed,
        todayDispatched,
        
        // Financial Stats
        todayOperationalCost,
        monthlyOperationalCost,
        dieselConsumptionToday,
        electricityConsumptionToday,
        
        // Performance Metrics
        intakeEfficiency,
        processingEfficiency,
        dispatchAccuracy,
        
        // Recent Alerts
        recentAlerts,
        
        // Cold Chain Data
        coldChainData,
        
        // Shipment Data
        shipmentData,
        
        // VMS/IoT Data
        vmsIotData,
      };
      
      setStats(dashboardStats);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  // Generate recent alerts from various data sources
  const generateRecentAlerts = (
    employees: any[],
    attendance: any[],
    suppliers: any[],
    vehicles: any[]
  ) => {
    const alerts = [];
    const today = new Date().toISOString().split('T')[0];
    
    // Attendance alerts (employees missing check-in after 9 AM)
    const now = new Date();
    if (now.getHours() >= 9) {
      const checkedInEmployees = attendance
        .filter((a: any) => a.date === today && (a.status === 'Present' || a.status === 'Late'))
        .map((a: any) => a.employeeId);
      
      const missingEmployees = employees.filter(
        (emp: any) => !checkedInEmployees.includes(emp.id)
      );
      
      if (missingEmployees.length > 0) {
        alerts.push({
          id: 'attendance-1',
          type: 'attendance',
          message: `${missingEmployees.length} employees have not checked in yet`,
          severity: 'medium' as const,
          time: 'Today 9:00 AM',
        });
      }
    }
    
    // Vehicle alerts (vehicles pending exit for > 2 hours)
    const pendingExitVehicles = vehicles.filter((v: any) => 
      v.vehicle_status === 'Pending Exit'
    );
    
    if (pendingExitVehicles.length > 0) {
      alerts.push({
        id: 'vehicle-1',
        type: 'vehicle',
        message: `${pendingExitVehicles.length} vehicles pending exit verification`,
        severity: 'low' as const,
        time: 'Today',
      });
    }
    
    // Supplier alerts (inactive suppliers)
    const inactiveSuppliers = suppliers.filter((s: any) => 
      s.status === 'Inactive'
    );
    
    if (inactiveSuppliers.length > 0) {
      alerts.push({
        id: 'supplier-1',
        type: 'quality',
        message: `${inactiveSuppliers.length} suppliers are inactive`,
        severity: 'medium' as const,
        time: 'Today',
      });
    }
    
    // Add some sample alerts
    alerts.push(
      {
        id: 'temp-1',
        type: 'temperature',
        message: 'Cold Room 2 temperature rising: 5.2°C',
        severity: 'high' as const,
        time: '10:30 AM',
      },
      {
        id: 'vehicle-2',
        type: 'vehicle',
        message: 'Vehicle KCD 234X delayed by 45 minutes',
        severity: 'low' as const,
        time: '08:15 AM',
      }
    );
    
    return alerts.slice(0, 4); // Return only the 4 most recent alerts
  };
  
  useEffect(() => {
    fetchDashboardData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    toast({
      title: 'Data Refreshed',
      description: 'Dashboard data has been updated',
    });
  };
  
  const handleRecordWeight = (shipmentId: string) => router.push(`/weight-capture?shipmentId=${shipmentId}`);
  const handleManageTags = (shipmentId: string) => router.push('/tag-management');
  const handleViewDetails = (shipmentId: string) => router.push(`/traceability?shipmentId=${shipmentId}`);
  
  if (isLoading || !stats) {
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
            <Skeleton className="h-12 w-1/3" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
            <Skeleton className="h-[500px] w-full" />
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }
  
  // Overview cards configuration
  const overviewCards = [
    {
      id: 'employees',
      title: 'Employees Present',
      value: `${stats.employeesPresentToday}/${stats.totalEmployees}`,
      change: `${stats.attendanceRate}% attendance rate`,
      changeType: stats.attendanceRate > 85 ? 'increase' : 'decrease' as const,
      icon: Users,
      link: '/employees',
      color: 'bg-blue-500',
    },
    {
      id: 'suppliers',
      title: 'Active Suppliers',
      value: String(stats.activeSuppliers),
      change: `${stats.totalSuppliers} total suppliers`,
      changeType: 'increase' as const,
      icon: Building,
      link: '/suppliers',
      color: 'bg-green-500',
    },
    {
      id: 'vehicles',
      title: 'Vehicles On Site',
      value: String(stats.vehiclesOnSite),
      change: `${stats.vehiclesPendingExit} pending exit`,
      changeType: 'increase' as const,
      icon: Truck,
      link: '/vehicle-management',
      color: 'bg-amber-500',
    },
    {
      id: 'pallets',
      title: 'Pallets Today',
      value: String(stats.palletsWeighedToday),
      change: `${stats.totalWeightToday} kg total`,
      changeType: stats.palletsWeighedToday > 40 ? 'increase' : 'decrease' as const,
      icon: Package,
      link: '/weight-capture',
      color: 'bg-purple-500',
    },
    {
      id: 'quality',
      title: 'Quality Pass Rate',
      value: `${stats.qualityCheckPassRate}%`,
      change: 'Today',
      changeType: stats.qualityCheckPassRate > 90 ? 'increase' : 'decrease' as const,
      icon: CheckCircle,
      link: '/quality-control',
      color: 'bg-emerald-500',
    },
    {
      id: 'intake',
      title: "Today's Intake",
      value: String(stats.todayIntakes),
      change: `${stats.todayProcessed} processed, ${stats.todayDispatched} dispatched`,
      changeType: 'increase' as const,
      icon: ClipboardCheck,
      link: '/warehouse',
      color: 'bg-indigo-500',
    },
  ];

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
        <main className="p-4 md:p-6 lg:p-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">FreshTrace Operations Dashboard</h2>
                <p className="text-muted-foreground">
                  Real-time monitoring of supply chain operations, intake, processing, and dispatch
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground">
                  Updated: {lastUpdated}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Refresh
                </Button>
              </div>
            </div>

            {/* Tabs for different views */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="operations">Operations</TabsTrigger>
                <TabsTrigger value="personnel">Personnel</TabsTrigger>
                <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-6 space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {overviewCards.map((card) => (
                    <Link key={card.id} href={card.link} className="block transition-transform hover:scale-[1.02]">
                      <OverviewCard 
                        data={{ 
                          title: card.title, 
                          value: card.value, 
                          change: card.change, 
                          changeType: card.changeType 
                        }} 
                        icon={card.icon} 
                      />
                    </Link>
                  ))}
                </div>

                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Performance Metrics */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="w-5 h-5" />
                          Operational Performance
                        </CardTitle>
                        <CardDescription>
                          Today's key performance indicators
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Intake Efficiency</span>
                              <span className="font-semibold">{stats.intakeEfficiency}%</span>
                            </div>
                            <Progress value={stats.intakeEfficiency} className="h-2" />
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Processing Efficiency</span>
                              <span className="font-semibold">{stats.processingEfficiency}%</span>
                            </div>
                            <Progress value={stats.processingEfficiency} className="h-2" />
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Dispatch Accuracy</span>
                              <span className="font-semibold">{stats.dispatchAccuracy}%</span>
                            </div>
                            <Progress value={stats.dispatchAccuracy} className="h-2" />
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Quality Pass Rate</span>
                              <span className="font-semibold">{stats.qualityCheckPassRate}%</span>
                            </div>
                            <Progress value={stats.qualityCheckPassRate} className="h-2" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Shipments Overview */}
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Truck className="w-5 h-5" />
                              Today's Shipments
                            </CardTitle>
                            <CardDescription>
                              {stats.shipmentData.length} shipments received today
                            </CardDescription>
                          </div>
                          <Badge variant="outline">
                            Live Tracking
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ShipmentDataTable 
                          shipments={stats.shipmentData} 
                          onRecordWeight={handleRecordWeight}
                          onManageTags={handleManageTags}
                          onViewDetails={handleViewDetails}
                        />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Cold Chain Status */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Thermometer className="w-5 h-5" />
                          Cold Chain Monitoring
                        </CardTitle>
                        <CardDescription>
                          Real-time temperature and humidity
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ColdChainChart data={stats.coldChainData} />
                      </CardContent>
                    </Card>

                    {/* Recent Alerts */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5" />
                          Recent Alerts
                        </CardTitle>
                        <CardDescription>
                          System notifications requiring attention
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {stats.recentAlerts.map((alert) => (
                            <div key={alert.id} className={`p-3 border rounded-lg ${
                              alert.severity === 'high' ? 'bg-red-50 border-red-200' :
                              alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                              'bg-blue-50 border-blue-200'
                            }`}>
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  {alert.type === 'temperature' && <Thermometer className="w-4 h-4" />}
                                  {alert.type === 'weight' && <Scale className="w-4 h-4" />}
                                  {alert.type === 'vehicle' && <Truck className="w-4 h-4" />}
                                  {alert.type === 'quality' && <ClipboardCheck className="w-4 h-4" />}
                                  {alert.type === 'attendance' && <User className="w-4 h-4" />}
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{alert.message}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge className={`text-xs ${
                                        alert.severity === 'high' ? 'bg-red-100 text-red-800 border-red-200' :
                                        alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                        'bg-blue-100 text-blue-800 border-blue-200'
                                      }`}>
                                        {alert.severity.toUpperCase()}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">{alert.time}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Resource Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Resource Summary
                    </CardTitle>
                    <CardDescription>
                      Active personnel and suppliers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{stats.totalSuppliers}</div>
                        <div className="text-sm text-muted-foreground">Total Suppliers</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{stats.totalEmployees}</div>
                        <div className="text-sm text-muted-foreground">Total Employees</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{stats.vehiclesOnSite}</div>
                        <div className="text-sm text-muted-foreground">Vehicles On Site</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-amber-600">{stats.vehiclesCompletedToday}</div>
                        <div className="text-sm text-muted-foreground">Deliveries Today</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Operations Tab */}
              <TabsContent value="operations" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Warehouse Operations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 border rounded-lg">
                            <div className="text-2xl font-bold">{stats.palletsWeighedToday}</div>
                            <div className="text-sm text-muted-foreground">Pallets Weighed</div>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <div className="text-2xl font-bold">{(stats.totalWeightToday / 1000).toFixed(1)} t</div>
                            <div className="text-sm text-muted-foreground">Total Weight</div>
                          </div>
                        </div>
                        <Separator />
                        <div>
                          <h4 className="font-medium mb-2">Processing Status</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Intake</span>
                              <span className="font-semibold">{stats.todayIntakes}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Processing</span>
                              <span className="font-semibold">{stats.todayProcessed}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Dispatch</span>
                              <span className="font-semibold">{stats.todayDispatched}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Thermometer className="w-5 h-5" />
                        Cold Chain Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {stats.coldChainData.map((room) => (
                          <div key={room.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">{room.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {room.temperature}°C • {room.humidity}% humidity
                              </div>
                            </div>
                            <Badge className={
                              room.status === 'optimal' ? 'bg-green-100 text-green-800 border-green-200' :
                              room.status === 'warning' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              'bg-blue-100 text-blue-800 border-blue-200'
                            }>
                              {room.status.toUpperCase()}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quality Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quality Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-3xl font-bold text-emerald-600">{stats.qualityCheckPassRate}%</div>
                        <div className="text-sm text-muted-foreground">Pass Rate</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-3xl font-bold text-blue-600">{stats.intakeEfficiency}%</div>
                        <div className="text-sm text-muted-foreground">Intake Efficiency</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-3xl font-bold text-purple-600">{stats.dispatchAccuracy}%</div>
                        <div className="text-sm text-muted-foreground">Dispatch Accuracy</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Personnel Tab */}
              <TabsContent value="personnel" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Employee Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-3 border rounded-lg">
                            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
                            <div className="text-sm text-muted-foreground">Total</div>
                          </div>
                          <div className="text-center p-3 border rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{stats.employeesPresentToday}</div>
                            <div className="text-sm text-muted-foreground">Present</div>
                          </div>
                          <div className="text-center p-3 border rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{stats.employeesOnLeave}</div>
                            <div className="text-sm text-muted-foreground">On Leave</div>
                          </div>
                        </div>
                        <Separator />
                        <div>
                          <h4 className="font-medium mb-2">By Contract Type</h4>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="p-2 border rounded text-center">
                              <div className="font-bold">{stats.employeesByContract.fullTime}</div>
                              <div className="text-xs text-muted-foreground">Full-time</div>
                            </div>
                            <div className="p-2 border rounded text-center">
                              <div className="font-bold">{stats.employeesByContract.partTime}</div>
                              <div className="text-xs text-muted-foreground">Part-time</div>
                            </div>
                            <div className="p-2 border rounded text-center">
                              <div className="font-bold">{stats.employeesByContract.contract}</div>
                              <div className="text-xs text-muted-foreground">Contract</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" onClick={() => router.push('/employees')}>
                        View Employee Management
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building className="w-5 h-5" />
                        Supplier Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 border rounded-lg">
                            <div className="text-2xl font-bold">{stats.totalSuppliers}</div>
                            <div className="text-sm text-muted-foreground">Total Suppliers</div>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{stats.activeSuppliers}</div>
                            <div className="text-sm text-muted-foreground">Active</div>
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Active Suppliers</span>
                            <span className="font-semibold">{stats.activeSuppliers}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Inactive Suppliers</span>
                            <span className="font-semibold">{stats.inactiveSuppliers}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Onboarding</span>
                            <span className="font-semibold">{stats.suppliersOnboarding}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" onClick={() => router.push('/suppliers')}>
                        View Supplier Management
                      </Button>
                    </CardFooter>
                  </Card>
                </div>

                {/* Attendance Rate */}
                <Card>
                  <CardHeader>
                    <CardTitle>Attendance Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center">
                      <div className="relative w-48 h-48">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-4xl font-bold">{stats.attendanceRate}%</div>
                            <div className="text-sm text-muted-foreground">Today</div>
                          </div>
                        </div>
                        <Progress value={stats.attendanceRate} className="h-48 w-48 [&>div]:bg-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Vehicles Tab */}
              <TabsContent value="vehicles" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="w-5 h-5" />
                        Vehicle Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 border rounded-lg">
                            <div className="text-2xl font-bold">{stats.totalVehicles}</div>
                            <div className="text-sm text-muted-foreground">Total Registered</div>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <div className="text-2xl font-bold text-amber-600">{stats.vehiclesOnSite}</div>
                            <div className="text-sm text-muted-foreground">On Site</div>
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Checked In</span>
                            <span className="font-semibold">{stats.vehiclesOnSite - stats.vehiclesPendingExit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pending Exit</span>
                            <span className="font-semibold">{stats.vehiclesPendingExit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>In Transit</span>
                            <span className="font-semibold">{stats.vehiclesInTransit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Completed Today</span>
                            <span className="font-semibold">{stats.vehiclesCompletedToday}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" onClick={() => router.push('/vehicle-management')}>
                        View Vehicle Management
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Vehicle Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stats.vehiclesCompletedToday > 0 && (
                          <div className="p-3 border rounded-lg bg-green-50">
                            <div className="font-medium">{stats.vehiclesCompletedToday} deliveries completed today</div>
                            <div className="text-sm text-muted-foreground">Successfully checked out</div>
                          </div>
                        )}
                        {stats.vehiclesPendingExit > 0 && (
                          <div className="p-3 border rounded-lg bg-yellow-50">
                            <div className="font-medium">{stats.vehiclesPendingExit} vehicles pending exit</div>
                            <div className="text-sm text-muted-foreground">Awaiting verification</div>
                          </div>
                        )}
                        {stats.vehiclesOnSite > 0 && (
                          <div className="p-3 border rounded-lg bg-blue-50">
                            <div className="font-medium">{stats.vehiclesOnSite} vehicles currently on site</div>
                            <div className="text-sm text-muted-foreground">Making deliveries</div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

// Warehouse Dashboard Component
const WarehouseDashboard = () => {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWarehouseData();
  }, []);

  const fetchWarehouseData = async () => {
    try {
      // Fetch relevant data for warehouse dashboard
      const [shipmentsRes, employeesRes] = await Promise.all([
        fetch('/api/shipments'), // You need to create this API
        fetch('/api/employees'),
      ]);

      // Process data...
      // For now, use mock data
      setStats({
        palletsWeighedToday: 47,
        totalWeightToday: 14250,
        qualityCheckPassRate: 94.5,
        processingEfficiency: 88,
        pendingShipments: 5,
      });
    } catch (error) {
      console.error('Error fetching warehouse data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading warehouse dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Warehouse dashboard content */}
      {/* ... similar structure to admin dashboard but warehouse-focused ... */}
    </div>
  );
};

// Driver Dashboard Component
const DriverDashboard = () => {
  const router = useRouter();
  const { user } = useUser();
  const [driverData, setDriverData] = useState<any>(null);

  // Fetch driver-specific data
  useEffect(() => {
    fetchDriverData();
  }, []);

  const fetchDriverData = async () => {
    // Fetch driver's shipments, schedule, etc.
  };

  return (
    <div className="space-y-6">
      {/* Driver dashboard content */}
    </div>
  );
};

// Main Dashboard Component
export default function DashboardPage() {
  const { user } = useUser();

  const renderDashboard = () => {
    switch (user?.role) {
      case 'Admin':
      case 'Manager':
        return <AdminDashboard />;
      case 'Warehouse':
        return <WarehouseDashboard />;
      case 'Driver':
        return <DriverDashboard />;
      default:
        return <AdminDashboard />;
    }
  };

  return renderDashboard();
}