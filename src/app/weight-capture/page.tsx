'use client';

import { useState, useEffect } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
} from '@/components/layout/client-layout';
import { FreshViewLogo } from '@/components/icons';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import { WeightCapture } from '@/components/dashboard/weight-capture';
import { FinalTagDialog } from '@/components/dashboard/final-tag-dialog';
import { Scale, Boxes, GitCompareArrows, Loader2, RefreshCw, AlertCircle, Truck, CheckCircle, Package, TrendingUp, TrendingDown, Minus, Clock, CheckCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

// Define types based on your schema
interface WeightEntry {
  id: string;
  pallet_id: string | null;
  palletId?: string | null;
  product: string | null;
  weight: number | null;
  unit: 'kg' | 'lb';
  timestamp: string | null;
  supplier: string | null;
  supplier_id: string | null;
  supplier_phone: string | null;
  fruit_variety: string[] | string | null;
  number_of_crates: number | null;
  region: string | null;
  image_url: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  driver_id_number: string | null;
  vehicle_plate: string | null;
  truck_id: string | null;
  driver_id: string | null;
  gross_weight: number | null;
  grossWeight?: number | null;
  tare_weight: number | null;
  tareWeight?: number | null;
  net_weight: number | null;
  netWeight?: number | null;
  declared_weight: number | null;
  declaredWeight?: number | null;
  rejected_weight: number | null;
  rejectedWeight?: number | null;
  notes: string | null;
  created_at: string;
}

interface KPIData {
  palletsWeighed: {
    title: string;
    value: string;
    change: string;
    changeType: 'increase' | 'decrease' | 'neutral';
  };
  totalWeight: {
    title: string;
    value: string;
    change: string;
    changeType: 'increase' | 'decrease' | 'neutral';
  };
  discrepancyRate: {
    title: string;
    value: string;
    change: string;
    changeType: 'increase' | 'decrease' | 'neutral';
  };
  suppliersToday: {
    title: string;
    value: string;
    change: string;
    changeType: 'increase' | 'decrease' | 'neutral';
  };
}

interface WeightEntryAPI {
  id: string;
  pallet_id: string | null;
  product: string | null;
  weight: number | null;
  unit: 'kg' | 'lb';
  timestamp: string | null;
  supplier: string | null;
  supplier_id: string | null;
  supplier_phone: string | null;
  fruit_variety: string[];
  number_of_crates: number | null;
  region: string | null;
  image_url: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  driver_id_number: string | null;
  vehicle_plate: string | null;
  truck_id: string | null;
  driver_id: string | null;
  gross_weight: number | null;
  tare_weight: number | null;
  net_weight: number | null;
  declared_weight: number | null;
  rejected_weight: number | null;
  notes: string | null;
  created_at: string;
}

interface KPIApiResponse {
  todayCount: number;
  changeSinceLastHour: number;
  totalWeightToday: number;
  discrepancyRate: number;
}

interface CheckedInSupplier {
  id: string;
  supplier_code: string;
  company_name: string;
  driver_name: string;
  phone_number: string;
  id_number: string;
  vehicle_plate: string;
  fruit_varieties: string[];
  region: string;
  check_in_time: string;
  status?: 'pending' | 'weighed';
}

const getChangeIcon = (changeType: 'increase' | 'decrease' | 'neutral') => {
  switch (changeType) {
    case 'increase':
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    case 'decrease':
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    default:
      return <Minus className="h-4 w-4 text-gray-600" />;
  }
};

export default function WeightCapturePage() {
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [checkedInSuppliers, setCheckedInSuppliers] = useState<CheckedInSupplier[]>([]);
  const [lastWeightEntry, setLastWeightEntry] = useState<WeightEntry | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [processedSuppliers, setProcessedSuppliers] = useState<Set<string>>(new Set());
  const [selectedSupplier, setSelectedSupplier] = useState<CheckedInSupplier | null>(null);
  const { toast } = useToast();

  // Fetch weight entries from database
  const fetchWeights = async () => {
    try {
      setError(null);
      const response = await fetch('/api/weights?limit=50&order=desc');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch weights: ${response.statusText}`);
      }
      
      const data: WeightEntryAPI[] = await response.json();
      
      // Transform to match WeightEntry type
      const transformedWeights: WeightEntry[] = data.map(entry => ({
        id: entry.id,
        pallet_id: entry.pallet_id,
        product: entry.product,
        weight: entry.weight,
        unit: entry.unit,
        timestamp: entry.timestamp,
        supplier: entry.supplier,
        supplier_id: entry.supplier_id,
        supplier_phone: entry.supplier_phone,
        fruit_variety: entry.fruit_variety || [],
        number_of_crates: entry.number_of_crates,
        region: entry.region,
        image_url: entry.image_url,
        driver_name: entry.driver_name,
        driver_phone: entry.driver_phone,
        driver_id_number: entry.driver_id_number,
        vehicle_plate: entry.vehicle_plate,
        truck_id: entry.truck_id,
        driver_id: entry.driver_id,
        gross_weight: entry.gross_weight,
        tare_weight: entry.tare_weight,
        net_weight: entry.net_weight,
        declared_weight: entry.declared_weight,
        rejected_weight: entry.rejected_weight,
        notes: entry.notes,
        created_at: entry.created_at,
      }));
      
      setWeights(transformedWeights);
      
      // Update processed suppliers based on existing weights
      const processedSet = new Set<string>();
      transformedWeights.forEach(entry => {
        if (entry.supplier_id) {
          processedSet.add(entry.supplier_id);
        }
      });
      setProcessedSuppliers(processedSet);
      
    } catch (error: any) {
      console.error('Error fetching weights:', error);
      setError(error.message || 'Failed to load weight data');
      setWeights([]);
    }
  };

  // Fetch checked-in suppliers
  const fetchCheckedInSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers/checked-in');
      
      if (!response.ok) {
        throw new Error('Failed to fetch checked-in suppliers');
      }
      
      const data: CheckedInSupplier[] = await response.json();
      // Initialize suppliers with status based on processedSuppliers
      const suppliersWithStatus = data.map(supplier => ({
        ...supplier,
        status: processedSuppliers.has(supplier.id) ? 'weighed' : 'pending' as const
      }));
      setCheckedInSuppliers(suppliersWithStatus);
    } catch (error: any) {
      console.error('Error fetching checked-in suppliers:', error);
      setCheckedInSuppliers([]);
    }
  };

  // Update supplier status when processedSuppliers changes
  useEffect(() => {
    if (checkedInSuppliers.length > 0) {
      const updatedSuppliers = checkedInSuppliers.map(supplier => ({
        ...supplier,
        status: processedSuppliers.has(supplier.id) ? 'weighed' : 'pending' as const
      }));
      setCheckedInSuppliers(updatedSuppliers);
    }
  }, [processedSuppliers]);

  // Fetch KPI data
  const fetchKpiData = async () => {
    try {
      const response = await fetch('/api/weights/kpi');
      
      if (!response.ok) {
        throw new Error('Failed to fetch KPI data');
      }
      
      const data: KPIApiResponse = await response.json();
      
      // Calculate discrepancy rate
      const todayEntries = weights.filter(entry => {
        const entryDate = new Date(entry.created_at);
        const today = new Date();
        return entryDate.toDateString() === today.toDateString();
      });
      
      let calculatedDiscrepancy = 0;
      if (todayEntries.length > 0) {
        const totalDeclared = todayEntries.reduce((sum, entry) => 
          sum + (entry.declared_weight || entry.net_weight || 0), 0);
        const totalActual = todayEntries.reduce((sum, entry) => 
          sum + (entry.net_weight || 0), 0);
        
        if (totalDeclared > 0) {
          calculatedDiscrepancy = Math.abs(totalDeclared - totalActual) / totalDeclared * 100;
        }
      }
      
      // Get unique suppliers today
      const uniqueSuppliers = new Set(
        todayEntries.map(entry => entry.supplier_id).filter(Boolean)
      ).size;
      
      setKpiData({
        palletsWeighed: {
          title: 'Pallets Weighed Today',
          value: data.todayCount.toString(),
          change: data.changeSinceLastHour >= 0 ? 
            `+${data.changeSinceLastHour} since last hour` : 
            `${data.changeSinceLastHour} since last hour`,
          changeType: data.changeSinceLastHour >= 0 ? 'increase' : 'decrease',
        },
        totalWeight: {
          title: 'Total Weight Today',
          value: `${(data.totalWeightToday / 1000).toFixed(1)} t`,
          change: 'across all entries',
          changeType: 'increase',
        },
        discrepancyRate: {
          title: 'Discrepancy Rate',
          value: `${calculatedDiscrepancy.toFixed(1)}%`,
          change: 'net vs. declared weight',
          changeType: calculatedDiscrepancy > 5 ? 'increase' : 'decrease',
        },
        suppliersToday: {
          title: 'Suppliers Today',
          value: uniqueSuppliers.toString(),
          change: `${checkedInSuppliers.length} checked-in now`,
          changeType: checkedInSuppliers.length > 0 ? 'increase' : 'neutral',
        },
      });
    } catch (error: any) {
      console.error('Error fetching KPI data:', error);
      // Set default KPI data
      setKpiData({
        palletsWeighed: {
          title: 'Pallets Weighed Today',
          value: '0',
          change: 'No data',
          changeType: 'neutral',
        },
        totalWeight: {
          title: 'Total Weight Today',
          value: '0 t',
          change: 'No data',
          changeType: 'neutral',
        },
        discrepancyRate: {
          title: 'Discrepancy Rate',
          value: '0%',
          change: 'No data',
          changeType: 'neutral',
        },
        suppliersToday: {
          title: 'Suppliers Today',
          value: '0',
          change: 'No suppliers',
          changeType: 'neutral',
        },
      });
    }
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchWeights(),
        fetchCheckedInSuppliers(),
        fetchKpiData()
      ]);
      setIsLoading(false);
    };
    
    loadData();
  }, []);

  // Refresh data when weights change
  useEffect(() => {
    if (!isLoading) {
      fetchKpiData();
    }
  }, [weights]);

  // Function to refresh all data
  const refreshAllData = async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchWeights(),
      fetchCheckedInSuppliers(),
      fetchKpiData()
    ]);
    setIsRefreshing(false);
    
    toast({
      title: 'Data Refreshed',
      description: 'Latest data has been loaded.',
    });
  };

  const handleAddWeight = async (weightData: any) => {
    try {
      console.log('Submitting weight data:', weightData); // Debug log
      setError(null);
      
      // Capture supplier info before submission
      const submittedSupplierId = weightData.supplier_id;
      
      const response = await fetch('/api/weights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product: weightData.product || '',
          net_weight: parseFloat(weightData.net_weight || weightData.netWeight || '0'),
          unit: weightData.unit || 'kg',
          gross_weight: parseFloat(weightData.gross_weight || weightData.grossWeight || '0'),
          tare_weight: parseFloat(weightData.tare_weight || weightData.tareWeight || '0'),
          declared_weight: parseFloat(weightData.declared_weight || weightData.declaredWeight || '0'),
          rejected_weight: parseFloat(weightData.rejected_weight || weightData.rejectedWeight || '0'),
          supplier: weightData.supplier || '',
          supplier_id: weightData.supplier_id || '',
          supplier_phone: weightData.supplier_phone || '',
          fruit_variety: Array.isArray(weightData.fruit_variety) ? weightData.fruit_variety : [],
          number_of_crates: parseInt(weightData.number_of_crates || '0'),
          region: weightData.region || '',
          image_url: weightData.image_url || '',
          driver_name: weightData.driver_name || '',
          driver_phone: weightData.driver_phone || '',
          driver_id_number: weightData.driver_id_number || '',
          vehicle_plate: weightData.vehicle_plate || '',
          truck_id: weightData.truck_id || '',
          driver_id: weightData.driver_id || '',
          timestamp: weightData.timestamp || new Date().toISOString(),
          notes: weightData.notes || '',
        }),
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to save weight';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const savedEntry = await response.json();
      
      // Transform saved entry to match WeightEntry type
      const transformedEntry: WeightEntry = {
        id: savedEntry.id,
        pallet_id: savedEntry.pallet_id || '',
        palletId: savedEntry.pallet_id || '',
        product: savedEntry.product || '',
        weight: savedEntry.net_weight || 0,
        unit: savedEntry.unit || 'kg',
        timestamp: savedEntry.timestamp || savedEntry.created_at,
        supplier: savedEntry.supplier || '',
        supplier_id: savedEntry.supplier_id || '',
        supplier_phone: savedEntry.supplier_phone || '',
        fruit_variety: savedEntry.fruit_variety || [],
        number_of_crates: savedEntry.number_of_crates || 0,
        region: savedEntry.region || '',
        image_url: savedEntry.image_url || '',
        driver_name: savedEntry.driver_name || '',
        driver_phone: savedEntry.driver_phone || '',
        driver_id_number: savedEntry.driver_id_number || '',
        vehicle_plate: savedEntry.vehicle_plate || '',
        truck_id: savedEntry.truck_id || '',
        driver_id: savedEntry.driver_id || '',
        gross_weight: savedEntry.gross_weight || 0,
        grossWeight: savedEntry.gross_weight || 0,
        tare_weight: savedEntry.tare_weight || 0,
        tareWeight: savedEntry.tare_weight || 0,
        net_weight: savedEntry.net_weight || 0,
        netWeight: savedEntry.net_weight || 0,
        declared_weight: savedEntry.declared_weight || 0,
        declaredWeight: savedEntry.declared_weight || 0,
        rejected_weight: savedEntry.rejected_weight || 0,
        rejectedWeight: savedEntry.rejected_weight || 0,
        notes: savedEntry.notes || '',
        created_at: savedEntry.created_at || new Date().toISOString(),
      };
      
      // Update local state
      setWeights(prev => [transformedEntry, ...prev]);
      setLastWeightEntry(transformedEntry);
      
      // Mark supplier as processed
      if (submittedSupplierId) {
        setProcessedSuppliers(prev => {
          const newSet = new Set(prev);
          newSet.add(submittedSupplierId);
          return newSet;
        });
        
        // Update the checked-in suppliers list to reflect the new status
        setCheckedInSuppliers(prev => 
          prev.map(supplier => 
            supplier.id === submittedSupplierId 
              ? { ...supplier, status: 'weighed' } 
              : supplier
          )
        );
        
        toast({
          title: 'Intake Complete',
          description: 'Supplier has been successfully weighed and processed.',
        });
      }
      
      setIsReceiptOpen(true);
      
      // Refresh KPI data
      await fetchKpiData();
      
      toast({
        title: 'Weight Saved Successfully',
        description: `Pallet ${transformedEntry.pallet_id} has been recorded.`,
      });
      
    } catch (error: any) {
      console.error('Error adding weight:', error);
      setError(error.message || 'Failed to save weight entry');
      
      // Fallback: add to local state even if API fails
      const fallbackEntry: WeightEntry = {
        id: `weight-${Date.now()}`,
        pallet_id: weightData.pallet_id || generateDefaultPalletId(),
        palletId: weightData.pallet_id || generateDefaultPalletId(),
        product: weightData.product || '',
        weight: parseFloat(weightData.net_weight) || parseFloat(weightData.netWeight) || 0,
        unit: (weightData.unit || 'kg'),
        timestamp: new Date().toISOString(),
        supplier: weightData.supplier || '',
        supplier_id: weightData.supplier_id || '',
        supplier_phone: weightData.supplier_phone || '',
        fruit_variety: Array.isArray(weightData.fruit_variety) ? weightData.fruit_variety : [],
        number_of_crates: parseInt(weightData.number_of_crates) || 0,
        region: weightData.region || '',
        image_url: weightData.image_url || '',
        driver_name: weightData.driver_name || '',
        driver_phone: weightData.driver_phone || '',
        driver_id_number: weightData.driver_id_number || '',
        vehicle_plate: weightData.vehicle_plate || '',
        truck_id: weightData.truck_id || '',
        driver_id: weightData.driver_id || '',
        gross_weight: parseFloat(weightData.gross_weight) || parseFloat(weightData.net_weight) || parseFloat(weightData.netWeight) || 0,
        grossWeight: parseFloat(weightData.gross_weight) || parseFloat(weightData.net_weight) || parseFloat(weightData.netWeight) || 0,
        tare_weight: parseFloat(weightData.tare_weight) || 0,
        tareWeight: parseFloat(weightData.tare_weight) || 0,
        net_weight: parseFloat(weightData.net_weight) || parseFloat(weightData.netWeight) || 0,
        netWeight: parseFloat(weightData.net_weight) || parseFloat(weightData.netWeight) || 0,
        declared_weight: parseFloat(weightData.declared_weight) || parseFloat(weightData.net_weight) || parseFloat(weightData.netWeight) || 0,
        declaredWeight: parseFloat(weightData.declared_weight) || parseFloat(weightData.net_weight) || parseFloat(weightData.netWeight) || 0,
        rejected_weight: parseFloat(weightData.rejected_weight) || 0,
        rejectedWeight: parseFloat(weightData.rejected_weight) || 0,
        notes: weightData.notes || '',
        created_at: new Date().toISOString(),
      };
      
      setWeights(prev => [fallbackEntry, ...prev]);
      setLastWeightEntry(fallbackEntry);
      
      // Still mark supplier as processed even if API fails
      if (weightData.supplier_id) {
        setProcessedSuppliers(prev => {
          const newSet = new Set(prev);
          newSet.add(weightData.supplier_id);
          return newSet;
        });
        
        // Update the checked-in suppliers list locally
        setCheckedInSuppliers(prev => 
          prev.map(supplier => 
            supplier.id === weightData.supplier_id 
              ? { ...supplier, status: 'weighed' } 
              : supplier
          )
        );
      }
      
      setIsReceiptOpen(true);
      
      toast({
        title: 'Save Failed (Local Only)',
        description: error.message || 'Failed to save weight entry to server',
        variant: 'destructive',
      });
    }
  };

  // Helper function to generate a default pallet ID
  const generateDefaultPalletId = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PAL${randomNum}/${month}${day}`;
  };

  // Handle supplier selection for weighing
  const handleSelectSupplierForWeighing = (supplier: CheckedInSupplier) => {
    if (processedSuppliers.has(supplier.id)) {
      toast({
        title: 'Supplier Already Processed',
        description: `${supplier.driver_name} has already been weighed.`,
        variant: 'default',
      });
      return;
    }
    
    setSelectedSupplier(supplier);
    setActiveTab('capture');
    
    toast({
      title: 'Supplier Selected',
      description: `${supplier.driver_name} from ${supplier.company_name} is ready for weighing. Details have been pre-filled.`,
    });
  };

  // Default KPI data while loading
  const defaultKpiData: KPIData = {
    palletsWeighed: {
      title: 'Pallets Weighed Today',
      value: isLoading ? '...' : '0',
      change: isLoading ? 'Loading...' : 'No data',
      changeType: 'neutral',
    },
    totalWeight: {
      title: 'Total Weight Today',
      value: isLoading ? '...' : '0 t',
      change: isLoading ? 'Loading...' : 'No data',
      changeType: 'neutral',
    },
    discrepancyRate: {
      title: 'Discrepancy Rate',
      value: isLoading ? '...' : '0%',
      change: isLoading ? 'Loading...' : 'No data',
      changeType: 'neutral',
    },
    suppliersToday: {
      title: 'Suppliers Today',
      value: isLoading ? '...' : '0',
      change: isLoading ? 'Loading...' : 'No suppliers',
      changeType: 'neutral',
    },
  };

  // Calculate statistics
  const totalWeightToday = weights
    .filter(w => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const entryDate = new Date(w.created_at);
      return entryDate >= today;
    })
    .reduce((sum, w) => sum + (w.net_weight || 0), 0);

  const uniqueSuppliersToday = new Set(
    weights
      .filter(w => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const entryDate = new Date(w.created_at);
        return entryDate >= today && w.supplier_id;
      })
      .map(w => w.supplier_id)
  ).size;

  // Count pending and weighed suppliers
  const pendingSuppliersCount = checkedInSuppliers.filter(s => !processedSuppliers.has(s.id)).length;
  const weighedSuppliersCount = checkedInSuppliers.filter(s => processedSuppliers.has(s.id)).length;

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <FreshViewLogo className="w-8 h-8 text-primary" />
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
        <main className="p-6 space-y-6">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Weight Capture Station
              </h1>
              <p className="text-muted-foreground mt-1">
                Record pallet weights with supplier details from check-in system
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={refreshAllData}
                disabled={isRefreshing || isLoading}
                variant="outline"
                className="gap-2"
              >
                {isRefreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
              </Button>
              <Badge variant="outline" className="px-3 py-1">
                <Scale className="w-3 h-3 mr-1" />
                Live
              </Badge>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-gray-500">Pallets Today</p>
                  <h3 className="text-2xl font-bold mt-1">{weights.filter(w => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return new Date(w.created_at) >= today;
                  }).length}</h3>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <Boxes className="h-4 w-4 mr-1 text-blue-500" />
                    <span>Total weighed</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-gray-500">Weight Today</p>
                  <h3 className="text-2xl font-bold mt-1">{(totalWeightToday / 1000).toFixed(1)} t</h3>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <Scale className="h-4 w-4 mr-1 text-green-500" />
                    <span>Total weight</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-gray-500">Pending Weighing</p>
                  <h3 className="text-2xl font-bold mt-1">{pendingSuppliersCount}</h3>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1 text-amber-500" />
                    <span>Ready for weighing</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-gray-500">Intake Complete</p>
                  <h3 className="text-2xl font-bold mt-1">{weighedSuppliersCount}</h3>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <CheckCheck className="h-4 w-4 mr-1 text-purple-500" />
                    <span>Weighed today</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Boxes className="h-4 w-4" />
                Dashboard Overview
              </TabsTrigger>
              <TabsTrigger value="capture" className="flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Weight Capture
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab Content */}
            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(Object.entries(kpiData || defaultKpiData) as [keyof KPIData, any][]).map(([key, data]) => (
                  <Card key={key} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-500">{data.title}</p>
                          {getChangeIcon(data.changeType)}
                        </div>
                        <div className="flex items-baseline space-x-2">
                          <h3 className="text-2xl font-bold">{data.value}</h3>
                        </div>
                        <div className="text-sm text-gray-500">
                          {data.change}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Checked-in Suppliers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Suppliers Status
                  </CardTitle>
                  <CardDescription>
                    Track which suppliers have been weighed and which are pending
                  </CardDescription>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>Intake Complete ({weighedSuppliersCount})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <span>Pending Weighing ({pendingSuppliersCount})</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {checkedInSuppliers.length > 0 ? (
                      checkedInSuppliers.map((supplier) => {
                        const isWeighed = processedSuppliers.has(supplier.id);
                        
                        return (
                          <div 
                            key={supplier.id} 
                            className={`flex items-center justify-between p-4 rounded-lg border ${
                              isWeighed 
                                ? 'border-green-200 bg-black-50 hover:bg-black-100' 
                                : 'border-amber-200 bg-black-50 hover:bg-black-100'
                            } transition-colors`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                isWeighed 
                                  ? 'bg-black-100 border border-green-200' 
                                  : 'bg-black-100 border border-amber-200'
                              }`}>
                                {isWeighed ? (
                                  <CheckCircle className="w-6 h-6 text-green-600" />
                                ) : (
                                  <Clock className="w-6 h-6 text-amber-600" />
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-lg">{supplier.driver_name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {supplier.company_name} • {supplier.vehicle_plate}
                                </div>
                                {supplier.fruit_varieties.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {supplier.fruit_varieties.slice(0, 2).map((variety, idx) => (
                                      <Badge key={idx} variant="outline" className={`text-xs ${
                                        isWeighed 
                                          ? 'bg-green-50 text-green-700 border-green-300' 
                                          : 'bg-amber-50 text-amber-700 border-amber-300'
                                      }`}>
                                        {variety}
                                      </Badge>
                                    ))}
                                    {supplier.fruit_varieties.length > 2 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{supplier.fruit_varieties.length - 2} more
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end">
                              <div className={`text-sm font-semibold ${
                                isWeighed ? 'text-green-700' : 'text-amber-700'
                              }`}>
                                {isWeighed ? 'Intake Complete' : 'Pending Weighing'}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Checked in: {new Date(supplier.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              {isWeighed ? (
                                <Badge 
                                  variant="outline" 
                                  className="mt-2 px-3 py-1 text-xs bg-green-100 text-green-800 border-green-300"
                                >
                                  <CheckCheck className="w-3 h-3 mr-1" />
                                  Weighed
                                </Badge>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="mt-2 text-xs bg-white hover:bg-amber-50 border-amber-300 text-amber-700"
                                  onClick={() => handleSelectSupplierForWeighing(supplier)}
                                >
                                  <Scale className="w-3 h-3 mr-1" />
                                  Weigh Now
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12">
                        <Truck className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-600 font-semibold text-lg">No suppliers checked in</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Suppliers will appear here once they check in at the gate
                        </p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={refreshAllData}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Refresh
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Weight Capture Tab */}
            <TabsContent value="capture" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Weight Capture Interface</CardTitle>
                  <CardDescription>
                    Record weights for supplier deliveries. {selectedSupplier && 
                      <span className="font-semibold text-primary">
                        Currently processing: {selectedSupplier.driver_name} from {selectedSupplier.company_name}
                      </span>
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-96 rounded-lg bg-gray-50 flex flex-col items-center justify-center">
                      <div className="relative">
                        <Loader2 className="w-12 h-12 animate-spin text-primary/60" />
                        <Scale className="w-6 h-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <p className="mt-4 text-lg font-medium">Loading weight data...</p>
                      <p className="text-sm text-muted-foreground mt-2">Please wait while we fetch the latest entries</p>
                    </div>
                  ) : (
                    <WeightCapture 
                      onAddWeight={handleAddWeight}
                      isLoading={isLoading}
                      onRefreshSuppliers={fetchCheckedInSuppliers}
                      processedSupplierIds={processedSuppliers}
                      selectedSupplier={selectedSupplier}
                      onClearSelectedSupplier={() => setSelectedSupplier(null)}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
        
        {/* Receipt Dialog */}
        {lastWeightEntry && (
          <FinalTagDialog
            isOpen={isReceiptOpen}
            onOpenChange={setIsReceiptOpen}
            weightEntry={{
              id: lastWeightEntry.id,
              palletId: lastWeightEntry.pallet_id || lastWeightEntry.palletId || '',
              shipmentId: '',
              weight: `${(lastWeightEntry.net_weight || lastWeightEntry.netWeight || 0)} kg`,
              timestamp: lastWeightEntry.timestamp || lastWeightEntry.created_at,
              status: 'approved',
              operator: 'operator',
              notes: lastWeightEntry.notes || '',
              supplier: lastWeightEntry.supplier || '',
              truckId: lastWeightEntry.vehicle_plate || lastWeightEntry.truck_id || '',
              driverId: lastWeightEntry.driver_name || lastWeightEntry.driver_id || '',
              driverName: lastWeightEntry.driver_name || '',
              driverPhone: lastWeightEntry.driver_phone || '',
              fruitVariety: Array.isArray(lastWeightEntry.fruit_variety) 
                ? lastWeightEntry.fruit_variety.join(', ')
                : (typeof lastWeightEntry.fruit_variety === 'string' 
                    ? lastWeightEntry.fruit_variety 
                    : ''),
              numberOfCrates: lastWeightEntry.number_of_crates || 0,
              region: lastWeightEntry.region || '',
              imageUrl: lastWeightEntry.image_url || '',
              netWeight: lastWeightEntry.net_weight || lastWeightEntry.netWeight || 0,
              unit: lastWeightEntry.unit || 'kg',
              client: lastWeightEntry.supplier || '',
              products: Array.isArray(lastWeightEntry.fruit_variety) 
                ? lastWeightEntry.fruit_variety.map(variety => ({
                    product: variety,
                    quantity: 1,
                    weight: lastWeightEntry.net_weight || lastWeightEntry.netWeight || 0
                  })) 
                : [],
            }}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}