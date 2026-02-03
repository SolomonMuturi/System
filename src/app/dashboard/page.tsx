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
  Thermometer,
  Users,
  Truck,
  Scale,
  Package,
  HardHat,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  DollarSign,
  BarChart3,
  Calendar,
  RefreshCw,
  Loader2,
  Activity,
  ClipboardCheck,
  FileText,
  User,
  Building,
  Percent,
  Snowflake,
  Warehouse,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Droplets,
  Target,
  Shield,
  Clock as ClockIcon,
  Percent as PercentIcon,
  PackageOpen,
  Box,
  Layers,
  ThermometerSnowflake,
  Home,
  Clock4,
  CalendarCheck,
  CheckCheck,
  AlertCircle,
  ThumbsUp,
  Weight,
  XCircle,
} from 'lucide-react';
import { ColdChainChart } from '@/components/dashboard/cold-chain-chart';
import { RecentAlerts } from '@/components/dashboard/recent-alerts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

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
    capacity: number;
    occupied: number;
    lastUpdate: string;
  }>;
  
  // Cold Room Statistics
  coldRoomStats: {
    total4kgBoxes: number;
    total10kgBoxes: number;
    total4kgPallets: number;
    total10kgPallets: number;
    totalBoxesLoadedToday: number;
    totalWeightLoadedToday: number;
    recentTemperatureLogs: Array<{
      id: string;
      cold_room_id: string;
      temperature: number;
      timestamp: string;
      status: 'normal' | 'warning' | 'critical';
    }>;
  };
  
  // Additional Metrics
  weeklyIntakeTrend: Array<{
    day: string;
    pallets: number;
    weight: number;
  }>;
  
  supplierPerformance: Array<{
    id: string;
    name: string;
    intakeWeight: number; // Total intake weight in kg
    totalBoxes: number; // Total number of boxes/crates
    rejectedWeight: number; // Rejected weight in kg
    rejectionRate: number; // Percentage of rejected weight
    status: 'Active' | 'Inactive' | 'Onboarding';
    region: string;
    lastDelivery: string;
  }>;
}

// Warehouse-related interfaces
interface SupplierIntakeRecord {
  id: string;
  pallet_id: string;
  supplier_name: string;
  driver_name: string;
  vehicle_plate: string;
  total_weight: number;
  fruit_varieties: Array<{
    name: string;
    weight: number;
    crates: number;
  }>;
  region: string;
  timestamp: string;
  status: 'processed' | 'pending' | 'rejected';
}

interface QualityCheck {
  id: string;
  weight_entry_id: string;
  pallet_id: string;
  supplier_name: string;
  overall_status: 'approved' | 'rejected';
  processed_at: string;
}

interface CountingRecord {
  id: string;
  supplier_id: string;
  supplier_name: string;
  region: string;
  pallet_id: string;
  total_weight: number;
  total_counted_weight: number;
  submitted_at: string;
  status: string;
}

interface RejectionRecord {
  id: string;
  supplier_id: string;
  supplier_name: string;
  pallet_id: string;
  region: string;
  total_intake_weight: number;
  total_counted_weight: number;
  total_rejected_weight: number;
  weight_variance: number;
  variance_level: 'low' | 'medium' | 'high';
  submitted_at: string;
}

// Cold Room Interface
interface ColdRoomData {
  id: string;
  name: string;
  current_temperature: number;
  capacity: number;
  occupied: number;
  humidity?: number;
  last_temperature_log?: string;
  status?: 'optimal' | 'warning' | 'normal';
}

// Real Supplier Data Interface
interface RealSupplier {
  id: string;
  name: string;
  location: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  produce_types: string[];
  status: 'Active' | 'Inactive' | 'Onboarding';
  logo_url: string;
  active_contracts: number;
  supplier_code: string;
  kra_pin: string;
  vehicle_number_plate: string;
  driver_name: string;
  driver_id_number: string;
  mpesa_paybill: string;
  mpesa_account_number: string;
  bank_name: string;
  bank_account_number: string;
  password: string;
  created_at: string;
}

const AdminDashboard = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Never');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Warehouse data states
  const [supplierIntakeRecords, setSupplierIntakeRecords] = useState<SupplierIntakeRecord[]>([]);
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  const [countingRecords, setCountingRecords] = useState<CountingRecord[]>([]);
  const [rejectionRecords, setRejectionRecords] = useState<RejectionRecord[]>([]);
  
  // Cold room data states
  const [coldRooms, setColdRooms] = useState<ColdRoomData[]>([]);
  const [temperatureLogs, setTemperatureLogs] = useState<any[]>([]);
  const [coldRoomBoxes, setColdRoomBoxes] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<any[]>([]);
  
  // Real supplier data state
  const [realSuppliers, setRealSuppliers] = useState<RealSupplier[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  
  // Format date function
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };
  
  // Fetch real supplier data
  const fetchRealSuppliers = async () => {
    try {
      setIsLoadingSuppliers(true);
      const response = await fetch('/api/suppliers');
      if (response.ok) {
        const suppliersData = await response.json();
        console.log('Fetched suppliers:', suppliersData.length);
        
        // Transform the database supplier data to match our interface
        const transformedSuppliers: RealSupplier[] = suppliersData.map((supplier: any) => ({
          id: supplier.id,
          name: supplier.name,
          location: supplier.location,
          contact_name: supplier.contact_name,
          contact_email: supplier.contact_email,
          contact_phone: supplier.contact_phone,
          produce_types: Array.isArray(supplier.produce_types) 
            ? supplier.produce_types 
            : (typeof supplier.produce_types === 'string' 
                ? JSON.parse(supplier.produce_types || '[]')
                : []),
          status: supplier.status || 'Active',
          logo_url: supplier.logo_url || '',
          active_contracts: parseInt(supplier.active_contracts) || 0,
          supplier_code: supplier.supplier_code || '',
          kra_pin: supplier.kra_pin || '',
          vehicle_number_plate: supplier.vehicle_number_plate || '',
          driver_name: supplier.driver_name || '',
          driver_id_number: supplier.driver_id_number || '',
          mpesa_paybill: supplier.mpesa_paybill || '',
          mpesa_account_number: supplier.mpesa_account_number || '',
          bank_name: supplier.bank_name || '',
          bank_account_number: supplier.bank_account_number || '',
          password: supplier.password || '',
          created_at: supplier.created_at || new Date().toISOString(),
        }));
        
        setRealSuppliers(transformedSuppliers);
        return transformedSuppliers;
      }
      return [];
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load supplier data',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoadingSuppliers(false);
    }
  };
  
  // Fetch intake weight data from weight capture
  const fetchWeightData = async () => {
    try {
      const response = await fetch('/api/weights?limit=1000');
      if (response.ok) {
        const weightEntries = await response.json();
        
        const intakeRecords: SupplierIntakeRecord[] = weightEntries.map((entry: any) => ({
          id: entry.id,
          pallet_id: entry.pallet_id || `WE-${entry.id}`,
          supplier_name: entry.supplier || 'Unknown Supplier',
          driver_name: entry.driver_name || '',
          vehicle_plate: entry.vehicle_plate || entry.truck_id || '',
          total_weight: entry.net_weight || entry.weight || 0,
          fruit_varieties: Array.isArray(entry.fruit_variety) ? entry.fruit_variety.map((f: any) => ({
            name: f.name || f.product || 'Unknown',
            weight: f.weight || 0,
            crates: f.crates || 0
          })) : [{
            name: entry.product || 'Unknown',
            weight: 0,
            crates: 0
          }],
          region: entry.region || '',
          timestamp: entry.timestamp || entry.created_at || new Date().toISOString(),
          status: 'processed'
        }));
        
        setSupplierIntakeRecords(intakeRecords);
        return intakeRecords;
      }
      return [];
    } catch (error) {
      console.error('Error fetching weight data:', error);
      return [];
    }
  };
  
  // Fetch counting and box data from warehouse
  const fetchWarehouseData = async () => {
    try {
      // Fetch counting records
      const countingResponse = await fetch('/api/counting?limit=100');
      if (countingResponse.ok) {
        const result = await countingResponse.json();
        if (result.success) {
          const countingData = result.data || [];
          setCountingRecords(countingData);
          
          // Fetch rejection records from warehouse history
          const historyResponse = await fetch('/api/counting?action=history');
          if (historyResponse.ok) {
            const historyResult = await historyResponse.json();
            if (historyResult.success) {
              const rejectionData: RejectionRecord[] = (historyResult.data || []).map((record: any) => ({
                id: record.id,
                supplier_id: record.supplier_id,
                supplier_name: record.supplier_name,
                pallet_id: record.pallet_id,
                region: record.region,
                total_intake_weight: record.total_intake_weight || record.total_weight || 0,
                total_counted_weight: record.total_counted_weight || 0,
                total_rejected_weight: record.total_rejected_weight || 0,
                weight_variance: record.weight_variance || 0,
                variance_level: record.variance_level || 'low',
                submitted_at: record.submitted_at || new Date().toISOString()
              }));
              setRejectionRecords(rejectionData);
              return { countingData, rejectionData };
            }
          }
          
          return { countingData, rejectionData: [] };
        }
      }
      return { countingData: [], rejectionData: [] };
    } catch (error) {
      console.error('Error fetching warehouse data:', error);
      return { countingData: [], rejectionData: [] };
    }
  };
  
  // Calculate supplier performance with actual data from weight capture and warehouse
  const calculateSupplierPerformance = (
    suppliers: RealSupplier[],
    intakeRecords: SupplierIntakeRecord[],
    countingRecords: CountingRecord[],
    rejectionRecords: RejectionRecord[]
  ) => {
    if (suppliers.length === 0) {
      return [];
    }
    
    // Group intake records by supplier name
    const intakeBySupplier = new Map<string, number>();
    const boxesBySupplier = new Map<string, number>();
    const rejectionBySupplier = new Map<string, number>();
    
    // Calculate intake weight from weight capture data
    intakeRecords.forEach(record => {
      const supplierName = record.supplier_name;
      const currentWeight = intakeBySupplier.get(supplierName) || 0;
      intakeBySupplier.set(supplierName, currentWeight + record.total_weight);
      
      // Calculate total boxes/crates from fruit varieties
      const totalCrates = record.fruit_varieties.reduce((sum, fv) => sum + (fv.crates || 0), 0);
      const currentBoxes = boxesBySupplier.get(supplierName) || 0;
      boxesBySupplier.set(supplierName, currentBoxes + totalCrates);
    });
    
    // Calculate rejection weight from warehouse rejection records
    rejectionRecords.forEach(record => {
      const supplierName = record.supplier_name;
      const currentRejection = rejectionBySupplier.get(supplierName) || 0;
      rejectionBySupplier.set(supplierName, currentRejection + record.total_rejected_weight);
    });
    
    // Calculate boxes from counting records
    countingRecords.forEach(record => {
      const supplierName = record.supplier_name;
      
      // Parse counting totals if available
      if (record.totals) {
        const totals = typeof record.totals === 'string' ? JSON.parse(record.totals) : record.totals;
        const totalBoxes = 
          (totals.fuerte_4kg_total || 0) +
          (totals.fuerte_10kg_total || 0) +
          (totals.hass_4kg_total || 0) +
          (totals.hass_10kg_total || 0);
        
        const currentBoxes = boxesBySupplier.get(supplierName) || 0;
        boxesBySupplier.set(supplierName, currentBoxes + totalBoxes);
      }
    });
    
    // Calculate performance for each supplier
    return suppliers.map(supplier => {
      const supplierName = supplier.name;
      const intakeWeight = intakeBySupplier.get(supplierName) || 0;
      const totalBoxes = boxesBySupplier.get(supplierName) || 0;
      const rejectedWeight = rejectionBySupplier.get(supplierName) || 0;
      const rejectionRate = intakeWeight > 0 ? (rejectedWeight / intakeWeight) * 100 : 0;
      
      // Get region from intake records if available
      let region = supplier.location || 'Unknown';
      const supplierIntakeRecord = intakeRecords.find(record => record.supplier_name === supplierName);
      if (supplierIntakeRecord) {
        region = supplierIntakeRecord.region || region;
      }
      
      // Get last delivery date
      let lastDelivery = '';
      if (supplierIntakeRecord) {
        lastDelivery = supplierIntakeRecord.timestamp;
      } else if (countingRecords.length > 0) {
        const supplierCounting = countingRecords.find(r => r.supplier_name === supplierName);
        if (supplierCounting) {
          lastDelivery = supplierCounting.submitted_at;
        }
      }
      
      return {
        id: supplier.id,
        name: supplierName,
        intakeWeight: Math.round(intakeWeight),
        totalBoxes,
        rejectedWeight: Math.round(rejectedWeight),
        rejectionRate: Math.round(rejectionRate * 10) / 10, // 1 decimal place
        status: supplier.status,
        region,
        lastDelivery: lastDelivery || supplier.created_at,
      };
    }).filter(supplier => supplier.intakeWeight > 0) // Only show suppliers with intake data
      .sort((a, b) => b.intakeWeight - a.intakeWeight) // Sort by intake weight descending
      .slice(0, 8); // Get top 8 suppliers
  };
  
  // Fetch cold room data
  const fetchColdRoomData = async () => {
    try {
      console.log('🌡️ Fetching cold room data...');
      
      // Fetch cold rooms
      const roomsResponse = await fetch('/api/cold-room');
      let roomsData: ColdRoomData[] = [];
      
      if (roomsResponse.ok) {
        const result = await roomsResponse.json();
        console.log('Cold rooms API response:', result);
        
        if (Array.isArray(result)) {
          roomsData = result;
        } else if (result && Array.isArray(result.data)) {
          roomsData = result.data;
        }
      }
      
      // Fetch temperature logs
      const tempResponse = await fetch('/api/cold-room?action=temperature&limit=5');
      let tempLogs: any[] = [];
      
      if (tempResponse.ok) {
        const result = await tempResponse.json();
        if (result.success && Array.isArray(result.data)) {
          tempLogs = result.data.slice(0, 10);
        }
      }
      
      // Fetch cold room boxes for statistics
      const boxesResponse = await fetch('/api/cold-room?action=boxes');
      let boxesData: any[] = [];
      let total4kgBoxes = 0;
      let total10kgBoxes = 0;
      
      if (boxesResponse.ok) {
        const result = await boxesResponse.json();
        if (result.success && Array.isArray(result.data)) {
          boxesData = result.data;
          
          // Calculate box statistics
          boxesData.forEach(box => {
            if (box.box_type === '4kg' || box.boxType === '4kg') {
              total4kgBoxes += Number(box.quantity) || 0;
            } else if (box.box_type === '10kg' || box.boxType === '10kg') {
              total10kgBoxes += Number(box.quantity) || 0;
            }
          });
        }
      }
      
      // Fetch loading history for today's stats
      const today = new Date().toISOString().split('T')[0];
      const historyResponse = await fetch(`/api/cold-room?action=loading-history&date=${today}`);
      let todayLoadingHistory: any[] = [];
      let totalBoxesLoadedToday = 0;
      let totalWeightLoadedToday = 0;
      
      if (historyResponse.ok) {
        const result = await historyResponse.json();
        if (result.success && Array.isArray(result.data)) {
          todayLoadingHistory = result.data;
          
          todayLoadingHistory.forEach(record => {
            totalBoxesLoadedToday += Number(record.quantity) || 0;
            const boxWeight = (record.box_type === '4kg' || record.boxType === '4kg') ? 4 : 10;
            totalWeightLoadedToday += (Number(record.quantity) || 0) * boxWeight;
          });
        }
      }
      
      // Update cold rooms state
      const updatedColdRooms = roomsData.map(room => {
        // Get latest temperature for this room
        const roomTempLogs = tempLogs.filter(log => log.cold_room_id === room.id);
        const latestTempLog = roomTempLogs[0];
        
        // Determine status based on temperature
        let status: 'optimal' | 'warning' | 'normal' = 'normal';
        if (room.id === 'coldroom1') {
          if (latestTempLog && latestTempLog.temperature >= 3 && latestTempLog.temperature <= 5) {
            status = 'optimal';
          } else if (latestTempLog && (latestTempLog.temperature < 2 || latestTempLog.temperature > 6)) {
            status = 'warning';
          }
        } else if (room.id === 'coldroom2') {
          if (latestTempLog && latestTempLog.temperature >= 4 && latestTempLog.temperature <= 6) {
            status = 'optimal';
          } else if (latestTempLog && (latestTempLog.temperature < 3 || latestTempLog.temperature > 7)) {
            status = 'warning';
          }
        }
        
        return {
          ...room,
          humidity: 75,
          last_temperature_log: latestTempLog?.timestamp,
          status
        };
      });
      
      setColdRooms(updatedColdRooms);
      setTemperatureLogs(tempLogs);
      setColdRoomBoxes(boxesData);
      setLoadingHistory(todayLoadingHistory);
      
      return {
        rooms: updatedColdRooms,
        tempLogs,
        total4kgBoxes,
        total10kgBoxes,
        totalBoxesLoadedToday,
        totalWeightLoadedToday
      };
      
    } catch (error) {
      console.error('❌ Error fetching cold room data:', error);
      
      return {
        rooms: [
          {
            id: 'coldroom1',
            name: 'Cold Room 1',
            current_temperature: 5,
            capacity: 100,
            occupied: 0,
            humidity: 75,
            status: 'normal' as const
          },
          {
            id: 'coldroom2',
            name: 'Cold Room 2',
            current_temperature: 5,
            capacity: 100,
            occupied: 0,
            humidity: 75,
            status: 'normal' as const
          }
        ],
        tempLogs: [],
        total4kgBoxes: 0,
        total10kgBoxes: 0,
        totalBoxesLoadedToday: 0,
        totalWeightLoadedToday: 0
      };
    }
  };
  
  // Generate sample data for charts
  const generateWeeklyTrend = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
      day,
      pallets: Math.floor(Math.random() * 30) + 20,
      weight: Math.floor(Math.random() * 10000) + 5000,
    }));
  };
  
  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch data from all sources in parallel
      const [suppliers, intakeData, warehouseData, coldRoomData] = await Promise.all([
        fetchRealSuppliers(),
        fetchWeightData(),
        fetchWarehouseData(),
        fetchColdRoomData()
      ]);
      
      const { countingData, rejectionData } = warehouseData;
      
      // Calculate supplier performance with real data
      const supplierPerformanceData = calculateSupplierPerformance(
        suppliers,
        intakeData,
        countingData,
        rejectionData
      );
      
      // Calculate statistics from suppliers
      const totalSuppliers = suppliers.length;
      const activeSuppliers = suppliers.filter(s => s.status === 'Active').length;
      const inactiveSuppliers = suppliers.filter(s => s.status === 'Inactive').length;
      const suppliersOnboarding = suppliers.filter(s => s.status === 'Onboarding').length;
      const totalContracts = suppliers.reduce((acc, s) => acc + s.active_contracts, 0);
      
      // Fetch employee data
      const employeesResponse = await fetch('/api/employees');
      const employeesData = employeesResponse.ok ? await employeesResponse.json() : [];
      
      // Fetch attendance data
      const attendanceResponse = await fetch('/api/attendance');
      const attendanceData = attendanceResponse.ok ? await attendanceResponse.json() : [];
      
      // Fetch vehicle/gate data
      const vehiclesResponse = await fetch('/api/suppliers?vehicles=true');
      const vehiclesData = vehiclesResponse.ok ? await vehiclesResponse.json() : [];
      
      // Fetch quality checks
      const qualityResponse = await fetch('/api/quality-control?limit=10');
      if (qualityResponse.ok) {
        const qualityChecksData = await qualityResponse.json();
        const transformedChecks: QualityCheck[] = qualityChecksData.map((qc: any) => ({
          id: qc.id,
          weight_entry_id: qc.weight_entry_id,
          pallet_id: qc.pallet_id || `WE-${qc.weight_entry_id}`,
          supplier_name: qc.supplier_name || 'Unknown Supplier',
          overall_status: qc.overall_status || 'approved',
          processed_at: qc.processed_at || new Date().toISOString(),
        }));
        setQualityChecks(transformedChecks);
      }
      
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
      
      // Process operational statistics
      const todayIntakes = intakeData.filter(record => {
        const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
        return recordDate === today;
      }).length;
      const palletsWeighedToday = todayIntakes;
      const totalWeightToday = intakeData
        .filter(record => {
          const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
          return recordDate === today;
        })
        .reduce((sum, record) => sum + record.total_weight, 0);
      
      // Calculate cold room capacity
      const coldRoomCapacity = coldRoomData.rooms.reduce((total, room) => {
        if (room.capacity > 0) {
          return Math.round((room.occupied / room.capacity) * 100);
        }
        return total;
      }, 0) / coldRoomData.rooms.length || 0;
      
      const qualityCheckPassRate = qualityChecks.length > 0 
        ? Math.round((qualityChecks.filter(q => q.overall_status === 'approved').length / qualityChecks.length) * 100)
        : 94.5;
      const todayProcessed = countingData.filter((record: any) => {
        const recordDate = new Date(record.submitted_at).toISOString().split('T')[0];
        return recordDate === today && record.status === 'processed';
      }).length;
      const todayDispatched = 0;
      
      // Process financial statistics
      const todayOperationalCost = 0;
      const monthlyOperationalCost = 0;
      const dieselConsumptionToday = 0;
      const electricityConsumptionToday = 0;
      
      // Process performance metrics
      const intakeEfficiency = todayIntakes > 0 ? 92 : 0;
      const processingEfficiency = todayProcessed > 0 ? 88 : 0;
      const dispatchAccuracy = 96;
      
      // Generate recent alerts
      const recentAlerts = generateRecentAlerts(
        employeesData,
        attendanceData,
        suppliers,
        vehiclesData,
        coldRoomData.rooms,
        coldRoomData.tempLogs
      );
      
      // Cold chain data
      const coldChainData = coldRoomData.rooms.map(room => ({
        id: room.id,
        name: room.name,
        temperature: room.current_temperature,
        humidity: room.humidity || 75,
        status: room.status || 'normal',
        capacity: room.capacity,
        occupied: room.occupied,
        lastUpdate: room.last_temperature_log || new Date().toISOString()
      }));
      
      // Calculate pallet counts
      const calculatePallets = (boxes: number, boxType: '4kg' | '10kg') => {
        if (boxType === '4kg') {
          return Math.floor(boxes / 288);
        } else {
          return Math.floor(boxes / 120);
        }
      };
      
      const coldRoomStats = {
        total4kgBoxes: coldRoomData.total4kgBoxes,
        total10kgBoxes: coldRoomData.total10kgBoxes,
        total4kgPallets: calculatePallets(coldRoomData.total4kgBoxes, '4kg'),
        total10kgPallets: calculatePallets(coldRoomData.total10kgBoxes, '10kg'),
        totalBoxesLoadedToday: coldRoomData.totalBoxesLoadedToday,
        totalWeightLoadedToday: coldRoomData.totalWeightLoadedToday,
        recentTemperatureLogs: coldRoomData.tempLogs.slice(0, 5).map((log: any) => ({
          id: log.id,
          cold_room_id: log.cold_room_id,
          temperature: log.temperature,
          timestamp: log.timestamp,
          status: log.status || 'normal'
        }))
      };
      
      // Generate sample data for weekly trend
      const weeklyIntakeTrend = generateWeeklyTrend();
      
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
        
        // Cold Room Statistics
        coldRoomStats,
        
        // Additional Metrics
        weeklyIntakeTrend,
        supplierPerformance: supplierPerformanceData,
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
  
  // Generate recent alerts
  const generateRecentAlerts = (
    employees: any[],
    attendance: any[],
    suppliers: RealSupplier[],
    vehicles: any[],
    coldRooms: ColdRoomData[],
    tempLogs: any[]
  ) => {
    const alerts = [];
    const now = new Date();
    
    // Temperature alerts
    coldRooms.forEach(room => {
      const latestTempLog = tempLogs
        .filter(log => log.cold_room_id === room.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      
      if (latestTempLog) {
        if (room.id === 'coldroom1' && (latestTempLog.temperature < 3 || latestTempLog.temperature > 5)) {
          alerts.push({
            id: `temp-${room.id}`,
            type: 'temperature',
            message: `${room.name} temperature out of range: ${latestTempLog.temperature}°C`,
            severity: latestTempLog.temperature < 2 || latestTempLog.temperature > 6 ? 'high' : 'medium',
            time: formatDate(latestTempLog.timestamp),
          });
        } else if (room.id === 'coldroom2' && (latestTempLog.temperature < 4 || latestTempLog.temperature > 6)) {
          alerts.push({
            id: `temp-${room.id}`,
            type: 'temperature',
            message: `${room.name} temperature out of range: ${latestTempLog.temperature}°C`,
            severity: latestTempLog.temperature < 3 || latestTempLog.temperature > 7 ? 'high' : 'medium',
            time: formatDate(latestTempLog.timestamp),
          });
        }
      }
    });
    
    // Cold room capacity alerts
    coldRooms.forEach(room => {
      if (room.capacity > 0) {
        const occupancyRate = (room.occupied / room.capacity) * 100;
        if (occupancyRate > 90) {
          alerts.push({
            id: `capacity-${room.id}`,
            type: 'quality',
            message: `${room.name} nearing capacity: ${Math.round(occupancyRate)}% full`,
            severity: occupancyRate > 95 ? 'high' : 'medium',
            time: 'Today',
          });
        }
      }
    });
    
    // Attendance alerts
    if (now.getHours() >= 9) {
      const today = new Date().toISOString().split('T')[0];
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
    
    // Vehicle alerts
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
    
    // Supplier alerts
    const inactiveSuppliers = suppliers.filter((s: RealSupplier) => 
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
    
    // Check for suppliers with no intake data
    const suppliersNoIntake = suppliers.filter(s => {
      const hasIntake = supplierIntakeRecords.some(record => 
        record.supplier_name === s.name
      );
      return !hasIntake && s.status === 'Active';
    });
    
    if (suppliersNoIntake.length > 0) {
      alerts.push({
        id: 'supplier-2',
        type: 'quality',
        message: `${suppliersNoIntake.length} active suppliers have no intake data`,
        severity: 'low' as const,
        time: 'Today',
      });
    }
    
    // Return sorted alerts
    return alerts.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    }).slice(0, 5);
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
  
  // Calculate accepted suppliers
  const getAcceptedSuppliers = () => {
    return supplierIntakeRecords.filter(intake => {
      const qc = qualityChecks.find(q => q.weight_entry_id === intake.id);
      const inCounting = countingRecords.some(record => record.supplier_id === intake.id);
      return qc && qc.overall_status === 'approved' && !inCounting;
    });
  };
  
  const acceptedSuppliers = getAcceptedSuppliers();
  
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
  
  // Data for pie chart - Employee distribution
  const employeeDistributionData = [
    { name: 'Full-time', value: stats.employeesByContract.fullTime, color: '#3b82f6' },
    { name: 'Part-time', value: stats.employeesByContract.partTime, color: '#10b981' },
    { name: 'Contract', value: stats.employeesByContract.contract, color: '#8b5cf6' },
  ];
  
  // Data for bar chart - Cold room occupancy
  const coldRoomOccupancyData = stats.coldChainData.map(room => ({
    name: room.name,
    occupied: room.occupied,
    capacity: room.capacity,
    occupancyRate: Math.round((room.occupied / room.capacity) * 100),
  }));

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
        <main className="p-4 md:p-6 lg:p-8">
          <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold tracking-tight">Operations Dashboard</h2>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    Live
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  Comprehensive overview of warehouse operations, cold chain status, and performance metrics
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Updated: {lastUpdated}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="gap-2"
                >
                  {isRefreshing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Refresh
                </Button>
              </div>
            </div>

            {/* Main Dashboard Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="gap-2">
                  <Home className="w-4 h-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="operations" className="gap-2">
                  <Activity className="w-4 h-4" />
                  Operations
                </TabsTrigger>
                <TabsTrigger value="coldchain" className="gap-2">
                  <ThermometerSnowflake className="w-4 h-4" />
                  Cold Chain
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab - Redesigned */}
              <TabsContent value="overview" className="mt-6 space-y-8">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Today's Intake */}
                  <Link href="/warehouse" className="block transition-all hover:scale-[1.02]">
                    <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                          <span className="text-muted-foreground">Today's Intake</span>
                          <Package className="w-4 h-4 text-blue-500" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-3xl font-bold">{stats.todayIntakes}</div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">{stats.totalWeightToday.toLocaleString()} kg</span>
                            <Badge variant="outline" className="ml-auto">
                              {stats.palletsWeighedToday} pallets
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  {/* Cold Room Status */}
                  <Link href="/cold-room" className="block transition-all hover:scale-[1.02]">
                    <Card className="border-l-4 border-l-cyan-500 hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                          <span className="text-muted-foreground">Cold Room Status</span>
                          <Snowflake className="w-4 h-4 text-cyan-500" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-3xl font-bold">
                            {stats.coldRoomCapacity}%
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">
                              {stats.coldRoomStats.total4kgBoxes + stats.coldRoomStats.total10kgBoxes} boxes
                            </span>
                            <div className="ml-auto flex items-center gap-1">
                              {stats.coldChainData.every(room => room.status === 'optimal') ? (
                                <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                                  Optimal
                                </Badge>
                              ) : (
                                <Badge variant="destructive">Check Alerts</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  {/* Quality Pass Rate */}
                  <Link href="/quality-control" className="block transition-all hover:scale-[1.02]">
                    <Card className="border-l-4 border-l-emerald-500 hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                          <span className="text-muted-foreground">Quality Pass Rate</span>
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-3xl font-bold">{stats.qualityCheckPassRate}%</div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">This week</span>
                            <div className="ml-auto flex items-center gap-1">
                              {stats.qualityCheckPassRate >= 95 ? (
                                <>
                                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                                  <span className="text-emerald-600">+2.5%</span>
                                </>
                              ) : (
                                <>
                                  <ArrowDownRight className="w-4 h-4 text-red-600" />
                                  <span className="text-red-600">-1.2%</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  {/* Active Suppliers */}
                  <Link href="/suppliers" className="block transition-all hover:scale-[1.02]">
                    <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                          <span className="text-muted-foreground">Active Suppliers</span>
                          <Building className="w-4 h-4 text-purple-500" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-3xl font-bold">
                            {stats.activeSuppliers}/{stats.totalSuppliers}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">
                              {stats.supplierPerformance.length} with intake data
                            </span>
                            <Badge variant="outline" className="ml-auto">
                              {stats.suppliersOnboarding} onboarding
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column - Performance & Alerts */}
                  <div className="lg:col-span-2 space-y-8">
                    {/* Performance Metrics */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="w-5 h-5" />
                          Performance Metrics
                        </CardTitle>
                        <CardDescription>
                          Key operational indicators and trends
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {/* Efficiency Metrics */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Intake Efficiency</span>
                                <Percent className="w-4 h-4 text-blue-500" />
                              </div>
                              <div className="text-2xl font-bold">{stats.intakeEfficiency}%</div>
                              <Progress value={stats.intakeEfficiency} className="h-2" />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Processing</span>
                                <Activity className="w-4 h-4 text-green-500" />
                              </div>
                              <div className="text-2xl font-bold">{stats.processingEfficiency}%</div>
                              <Progress value={stats.processingEfficiency} className="h-2" />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Dispatch Accuracy</span>
                                <ClipboardCheck className="w-4 h-4 text-purple-500" />
                              </div>
                              <div className="text-2xl font-bold">{stats.dispatchAccuracy}%</div>
                              <Progress value={stats.dispatchAccuracy} className="h-2" />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Quality Rate</span>
                                <Shield className="w-4 h-4 text-emerald-500" />
                              </div>
                              <div className="text-2xl font-bold">{stats.qualityCheckPassRate}%</div>
                              <Progress value={stats.qualityCheckPassRate} className="h-2" />
                            </div>
                          </div>

                          {/* Weekly Intake Trend */}
                          <div>
                            <h3 className="text-sm font-medium mb-4">Weekly Intake Trend</h3>
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.weeklyIntakeTrend}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                  <XAxis dataKey="day" />
                                  <YAxis />
                                  <Tooltip />
                                  <Area 
                                    type="monotone" 
                                    dataKey="pallets" 
                                    stroke="#3b82f6" 
                                    fill="#3b82f6" 
                                    fillOpacity={0.2}
                                    name="Pallets"
                                  />
                                  <Area 
                                    type="monotone" 
                                    dataKey="weight" 
                                    stroke="#10b981" 
                                    fill="#10b981" 
                                    fillOpacity={0.2}
                                    name="Weight (kg)"
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Warehouse Processing Overview */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Warehouse className="w-5 h-5" />
                          Warehouse Processing
                          <Badge variant="outline" className="ml-2">
                            {acceptedSuppliers.length} pending
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Real-time processing status and pipeline overview
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {/* Processing Pipeline */}
                          <div className="grid grid-cols-4 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">{supplierIntakeRecords.length}</div>
                              <div className="text-sm text-muted-foreground">Intake</div>
                              <div className="text-xs text-blue-500 mt-1">Received</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-amber-600">
                                {qualityChecks.filter(q => q.overall_status === 'approved').length}
                              </div>
                              <div className="text-sm text-muted-foreground">QC Check</div>
                              <div className="text-xs text-amber-500 mt-1">Approved</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">
                                {countingRecords.filter(r => r.status === 'processed').length}
                              </div>
                              <div className="text-sm text-muted-foreground">Counting</div>
                              <div className="text-xs text-green-500 mt-1">Completed</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">
                                {acceptedSuppliers.length}
                              </div>
                              <div className="text-sm text-muted-foreground">To Cold Room</div>
                              <div className="text-xs text-purple-500 mt-1">Ready</div>
                            </div>
                          </div>

                          {/* Recent Activity */}
                          <div>
                            <h3 className="text-sm font-medium mb-3">Recent Supplier Intake</h3>
                            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                              {supplierIntakeRecords.slice(0, 4).map((supplier) => {
                                const qc = qualityChecks.find(q => q.weight_entry_id === supplier.id);
                                
                                return (
                                  <div key={supplier.id} className="p-3 border rounded-lg hover:bg-black-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <div className="font-medium">{supplier.supplier_name}</div>
                                        <div className="text-sm text-gray-500 mt-1">
                                          <div className="flex items-center gap-4">
                                            <span>🚚 {supplier.vehicle_plate || 'No plate'}</span>
                                            <span>⚖️ {supplier.total_weight} kg</span>
                                            <span>📦 {supplier.fruit_varieties.length} varieties</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-1">
                                        <Badge variant={
                                          qc?.overall_status === 'approved' ? 'default' : 'secondary'
                                        }>
                                          {qc?.overall_status === 'approved' ? 'QC Approved' : 'Intake Complete'}
                                        </Badge>
                                        <div className="text-xs text-gray-400">
                                          {formatDate(supplier.timestamp)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                      </CardFooter>
                    </Card>
                  </div>

                  {/* Right Column - Cold Chain & Alerts */}
                  <div className="space-y-8">
                    {/* Cold Chain Status */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ThermometerSnowflake className="w-5 h-5" />
                          Cold Chain Status
                          <Badge variant="outline" className="ml-2">
                            Live
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Real-time temperature monitoring
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ColdChainChart data={stats.coldChainData} />
                        
                        {/* Cold Room Details */}
                        <div className="space-y-3 mt-4">
                          {stats.coldChainData.map((room) => {
                            const occupancyRate = Math.round((room.occupied / room.capacity) * 100);
                            return (
                              <div key={room.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full ${
                                    room.status === 'optimal' ? 'bg-green-500' :
                                    room.status === 'warning' ? 'bg-yellow-500' :
                                    'bg-blue-500'
                                  }`} />
                                  <div>
                                    <div className="font-medium">{room.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {room.occupied}/{room.capacity} pallets
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-lg flex items-center gap-1">
                                    {room.temperature}°C
                                    <Droplets className="w-4 h-4 text-blue-500" />
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {occupancyRate}% occupied
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                      <CardFooter>
                      </CardFooter>
                    </Card>

                    {/* Recent Alerts */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5" />
                          Recent Alerts
                          {stats.recentAlerts.filter(a => a.severity === 'high').length > 0 && (
                            <Badge variant="destructive" className="ml-2">
                              {stats.recentAlerts.filter(a => a.severity === 'high').length}
                            </Badge>
                          )}
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
                              'bg-black-50 border-blue-200'
                            }`}>
                              <div className="flex items-start gap-3">
                                {alert.type === 'temperature' && (
                                  <Thermometer className="w-4 h-4 text-red-500" />
                                )}
                                {alert.type === 'weight' && (
                                  <Scale className="w-4 h-4 text-blue-500" />
                                )}
                                {alert.type === 'vehicle' && (
                                  <Truck className="w-4 h-4 text-amber-500" />
                                )}
                                {alert.type === 'quality' && (
                                  <Shield className="w-4 h-4 text-emerald-500" />
                                )}
                                {alert.type === 'attendance' && (
                                  <User className="w-4 h-4 text-purple-500" />
                                )}
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{alert.message}</div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge className={`text-xs ${
                                      alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                                      alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-blue-100 text-blue-800'
                                    }`}>
                                      {alert.severity.toUpperCase()}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">{alert.time}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {stats.recentAlerts.length === 0 && (
                            <div className="text-center py-4 border rounded-lg bg-green-50">
                              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                              <p className="text-sm text-green-600">No active alerts</p>
                              <p className="text-xs text-green-500 mt-1">All systems operational</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
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
                        <Truck className="w-5 h-5" />
                        Vehicle Operations
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

              {/* Cold Chain Tab */}
              <TabsContent value="coldchain" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Snowflake className="w-5 h-5" />
                      Cold Chain Overview
                    </CardTitle>
                    <CardDescription>
                      Real-time monitoring of cold storage facilities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold">Cold Room Status</h3>
                        {stats.coldChainData.map((room) => {
                          const occupancyRate = room.capacity > 0 ? Math.round((room.occupied / room.capacity) * 100) : 0;
                          return (
                            <Card key={room.id}>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center justify-between">
                                  <span>{room.name}</span>
                                  <Badge variant={
                                    room.status === 'optimal' ? 'default' :
                                    room.status === 'warning' ? 'secondary' :
                                    'outline'
                                  }>
                                    {room.status.toUpperCase()}
                                  </Badge>
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Thermometer className="w-4 h-4" />
                                      <span>Temperature</span>
                                    </div>
                                    <span className="font-bold text-lg">{room.temperature}°C</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Package className="w-4 h-4" />
                                      <span>Occupancy</span>
                                    </div>
                                    <span className="font-bold">{occupancyRate}%</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Layers className="w-4 h-4" />
                                      <span>Capacity</span>
                                    </div>
                                    <span className="font-medium">{room.occupied}/{room.capacity} pallets</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Last updated: {formatDate(room.lastUpdate)}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="font-semibold">Cold Room Statistics</h3>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Inventory Summary</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="border rounded p-3">
                                  <div className="text-2xl font-bold text-blue-600">
                                    {stats.coldRoomStats.total4kgBoxes.toLocaleString()}
                                  </div>
                                  <div className="text-sm text-muted-foreground">4kg Boxes</div>
                                </div>
                                <div className="border rounded p-3">
                                  <div className="text-2xl font-bold text-purple-600">
                                    {stats.coldRoomStats.total10kgBoxes.toLocaleString()}
                                  </div>
                                  <div className="text-sm text-muted-foreground">10kg Boxes</div>
                                </div>
                              </div>
                              
                              <Separator />
                              
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span>Total Pallets (4kg)</span>
                                  <span className="font-semibold">{stats.coldRoomStats.total4kgPallets}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Total Pallets (10kg)</span>
                                  <span className="font-semibold">{stats.coldRoomStats.total10kgPallets}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Boxes Loaded Today</span>
                                  <span className="font-semibold text-green-600">
                                    {stats.coldRoomStats.totalBoxesLoadedToday}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Weight Loaded Today</span>
                                  <span className="font-semibold">
                                    {Math.round(stats.coldRoomStats.totalWeightLoadedToday / 1000)} tons
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Cold Room Occupancy</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={coldRoomOccupancyData}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="name" />
                                  <YAxis />
                                  <Tooltip />
                                  <Bar 
                                    dataKey="occupied" 
                                    name="Occupied Pallets" 
                                    fill="#3b82f6" 
                                    radius={[4, 4, 0, 0]}
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Tab - UPDATED Supplier Performance */}
              <TabsContent value="analytics" className="mt-6 space-y-6">
                {/* Performance Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Employee Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Employee Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={employeeDistributionData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {employeeDistributionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Supplier Performance - UPDATED WITH REAL DATA */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building className="w-5 h-5" />
                        Supplier Performance
                        <Badge variant="outline" className="ml-2">
                          {stats.supplierPerformance.length} suppliers
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Real supplier performance metrics based on intake weight, boxes, and rejections
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingSuppliers ? (
                        <div className="flex flex-col items-center justify-center py-8">
                          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                          <p className="text-sm text-muted-foreground">Loading supplier data...</p>
                        </div>
                      ) : stats.supplierPerformance.length > 0 ? (
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                          {stats.supplierPerformance.map((supplier) => (
                            <div key={supplier.id} className="space-y-3 p-3 border rounded-lg hover:bg-black-50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full ${
                                    supplier.status === 'Active' ? 'bg-green-500' :
                                    supplier.status === 'Inactive' ? 'bg-red-500' :
                                    'bg-blue-500'
                                  }`} />
                                  <div>
                                    <span className="text-sm font-medium truncate">{supplier.name}</span>
                                    <div className="text-xs text-muted-foreground">{supplier.region}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className={
                                    supplier.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' :
                                    supplier.status === 'Inactive' ? 'bg-red-50 text-red-700 border-red-200' :
                                    'bg-blue-50 text-blue-700 border-blue-200'
                                  }>
                                    {supplier.status}
                                  </Badge>
                                </div>
                              </div>
                              
                              {/* Performance Metrics Grid */}
                              <div className="grid grid-cols-3 gap-3">
                                {/* Intake Weight */}
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                    <Weight className="w-3 h-3" />
                                    Intake Weight
                                  </div>
                                  <div className="font-semibold text-lg">
                                    {(supplier.intakeWeight / 1000).toFixed(1)} t
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {supplier.intakeWeight.toLocaleString()} kg
                                  </div>
                                </div>
                                
                                {/* Boxes Count */}
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                    <Package className="w-3 h-3" />
                                    Boxes
                                  </div>
                                  <div className="font-semibold text-lg">
                                    {supplier.totalBoxes.toLocaleString()}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    total boxes/crates
                                  </div>
                                </div>
                                
                                {/* Rejected Weight */}
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                    <XCircle className="w-3 h-3" />
                                    Rejected
                                  </div>
                                  <div className="font-semibold text-lg">
                                    {(supplier.rejectedWeight / 1000).toFixed(1)} t
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {supplier.rejectionRate.toFixed(1)}% rate
                                  </div>
                                </div>
                              </div>
                              
                              {/* Progress Bars for Visual Comparison */}
                              <div className="space-y-2">
                                <div>
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-muted-foreground">Intake Weight</span>
                                    <span className="font-medium">{supplier.intakeWeight.toLocaleString()} kg</span>
                                  </div>
                                  <Progress 
                                    value={Math.min((supplier.intakeWeight / 10000) * 100, 100)} 
                                    className="h-2" 
                                  />
                                </div>
                                
                                <div>
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-muted-foreground">Rejection Rate</span>
                                    <span className={
                                      supplier.rejectionRate > 10 ? 'text-red-600 font-medium' :
                                      supplier.rejectionRate > 5 ? 'text-yellow-600 font-medium' :
                                      'text-green-600 font-medium'
                                    }>
                                      {supplier.rejectionRate.toFixed(1)}%
                                    </span>
                                  </div>
                                  <Progress 
                                    value={Math.min(supplier.rejectionRate, 100)} 
                                    className={`h-2 ${
                                      supplier.rejectionRate > 10 ? '[&>div]:bg-red-500' :
                                      supplier.rejectionRate > 5 ? '[&>div]:bg-yellow-500' :
                                      '[&>div]:bg-green-500'
                                    }`}
                                  />
                                </div>
                              </div>
                              
                              {/* Additional Info */}
                              <div className="flex items-center justify-between text-xs pt-2 border-t">
                                <div className="text-muted-foreground">
                                  Last delivery: {formatDate(supplier.lastDelivery)}
                                </div>
                                <div className={`px-2 py-1 rounded ${
                                  supplier.rejectionRate > 10 ? 'bg-red-50 text-red-700' :
                                  supplier.rejectionRate > 5 ? 'bg-yellow-50 text-yellow-700' :
                                  'bg-green-50 text-green-700'
                                }`}>
                                  {supplier.rejectionRate > 10 ? 'High Rejection' :
                                   supplier.rejectionRate > 5 ? 'Moderate Rejection' :
                                   'Low Rejection'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Building className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground">No supplier intake data available</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Supplier intake data will appear here after weight capture
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-4"
                            onClick={() => router.push('/weight-capture')}
                          >
                            <Scale className="w-4 h-4 mr-2" />
                            Go to Weight Capture
                          </Button>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      <div className="w-full">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Total Intake Weight</span>
                          <span className="text-sm font-semibold">
                            {(stats.supplierPerformance.reduce((acc, sp) => acc + sp.intakeWeight, 0) / 1000).toFixed(1)} tons
                          </span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Average Rejection Rate</span>
                          <span className="text-sm font-semibold">
                            {stats.supplierPerformance.length > 0 
                              ? (stats.supplierPerformance.reduce((acc, sp) => acc + sp.rejectionRate, 0) / stats.supplierPerformance.length).toFixed(1)
                              : 0}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total Boxes Processed</span>
                          <span className="text-sm font-semibold">
                            {stats.supplierPerformance.reduce((acc, sp) => acc + sp.totalBoxes, 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                </div>

                {/* Operational Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle>Operational Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.weeklyIntakeTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f8f5f5ff" />
                          <XAxis dataKey="day" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="pallets"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            name="Pallets"
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="weight"
                            stroke="#10b981"
                            strokeWidth={2}
                            name="Weight (kg)"
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Supplier Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                          {stats.supplierPerformance.length}
                        </div>
                        <div className="text-sm text-muted-foreground">Suppliers with Intake</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">
                          {(stats.supplierPerformance.reduce((acc, sp) => acc + sp.intakeWeight, 0) / 1000).toFixed(1)}t
                        </div>
                        <div className="text-sm text-muted-foreground">Total Intake Weight</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-amber-600">
                          {stats.supplierPerformance.reduce((acc, sp) => acc + sp.totalBoxes, 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Boxes Processed</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-red-600">
                          {(stats.supplierPerformance.reduce((acc, sp) => acc + sp.rejectedWeight, 0) / 1000).toFixed(1)}t
                        </div>
                        <div className="text-sm text-muted-foreground">Total Rejected Weight</div>
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

export default function DashboardPage() {
  const { user } = useUser();

  return <AdminDashboard />;
}