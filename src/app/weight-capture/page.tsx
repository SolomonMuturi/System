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
import { Scale, Boxes, GitCompareArrows, Loader2, RefreshCw, AlertCircle, Truck, CheckCircle, Package, TrendingUp, TrendingDown, Minus, Clock, CheckCheck, Download, Calendar, FileSpreadsheet, Search, Filter, Printer, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, isSameDay, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Define types based on your API response
interface WeightEntry {
  // Basic info
  id: string;
  palletId: string;
  pallet_id: string;
  product: string;
  weight: number;
  unit: 'kg' | 'lb';
  timestamp: string;
  created_at: string;
  
  // Supplier info
  supplier: string;
  supplier_id: string;
  supplier_phone: string;
  
  // Driver info
  driver_name: string;
  driver_phone: string;
  driver_id_number: string;
  vehicle_plate: string;
  truckId: string;
  truck_id: string;
  driverId: string;
  driver_id: string;
  
  // Weight calculations
  grossWeight: number;
  gross_weight: number;
  tareWeight: number;
  tare_weight: number;
  netWeight: number;
  net_weight: number;
  declaredWeight: number;
  declared_weight: number;
  rejectedWeight: number;
  rejected_weight: number;
  
  // FRUIT VARIETY WEIGHTS - SEPARATED
  fuerte_weight: number;
  fuerte_crates: number;
  hass_weight: number;
  hass_crates: number;
  number_of_crates: number;
  
  // Fruit variety arrays
  fruit_variety: string[];
  perVarietyWeights: Array<{
    variety: string;
    weight: number;
    crates: number;
  }>;
  
  // Other info
  region: string;
  image_url: string;
  notes: string;
  bank_name: string;
  bank_account: string;
  kra_pin: string;
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
  suppliersToday: {
    title: string;
    value: string;
    change: string;
    changeType: 'increase' | 'decrease' | 'neutral';
  };
  pendingSuppliers: {
    title: string;
    value: string;
    change: string;
    changeType: 'increase' | 'decrease' | 'neutral';
  };
}

interface KPIApiResponse {
  todayCount: number;
  changeSinceLastHour: number;
  totalWeightToday: number;
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

interface CSVRow {
  date: string;
  supplier_name: string;
  phone_number: string;
  vehicle_plate_number: string;
  fuerte_weight: number;
  hass_weight: number;
  fuerte_crates_in: number;
  hass_crates_in: number;
  region: string;
}

interface SupplierGRNData {
  supplier_id: string;
  company_name: string;
  driver_name: string;
  vehicle_plate: string;
  phone_number: string;
  check_in_time: string;
  weights: Array<{
    variety: string;
    weight: number;
    crates: number;
    timestamp: string;
  }>;
  pallets: Array<{
    pallet_id: string;
    varieties: string[];
    weight: number;
    crates: number;
    time: string;
    region: string;
  }>;
  total_weight: number;
  total_crates: number;
}

interface VarietyData {
  variety: string;
  weight: number;
  crates: number;
}

interface FruitWeights {
  fuerte_weight: number;
  fuerte_crates: number;
  hass_weight: number;
  hass_crates: number;
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
  
  // History tab states
  const [historyDate, setHistoryDate] = useState<Date | undefined>(new Date());
  const [historyWeights, setHistoryWeights] = useState<WeightEntry[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for pallet ID counter
  const [palletCounter, setPalletCounter] = useState<number>(1);
  
  const { toast } = useToast();

  // Fetch ALL weight entries from database - UPDATED FOR API STRUCTURE
  const fetchWeights = async () => {
    try {
      setError(null);
      console.log('Fetching weights from API...');
      
      const response = await fetch('/api/weights?limit=1000&order=desc');
      
      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch weights: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched weights:', data.length);
      console.log('Sample weight entry:', data[0] ? {
        id: data[0].id,
        fuerte_weight: data[0].fuerte_weight,
        hass_weight: data[0].hass_weight,
        fruit_variety: data[0].fruit_variety
      } : 'No data');
      
      setWeights(data);
      
      // Update processed suppliers based on existing weights
      const processedSet = new Set<string>();
      data.forEach((entry: WeightEntry) => {
        if (entry.supplier_id) {
          processedSet.add(entry.supplier_id);
        }
      });
      setProcessedSuppliers(processedSet);
      
      // Calculate the highest pallet number for today
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      const todayPallets = data
        .filter((entry: WeightEntry) => entry.created_at.startsWith(todayString))
        .filter((entry: WeightEntry) => entry.pallet_id && entry.pallet_id.startsWith('PAL-'));
      
      if (todayPallets.length > 0) {
        const palletNumbers = todayPallets.map((entry: WeightEntry) => {
          const match = entry.pallet_id.match(/PAL-(\d+)/);
          return match ? parseInt(match[1]) : 0;
        }).filter(num => num > 0);
        
        if (palletNumbers.length > 0) {
          setPalletCounter(Math.max(...palletNumbers) + 1);
        }
      }
      
    } catch (error: any) {
      console.error('Error fetching weights:', error);
      setError(error.message || 'Failed to load weight data');
      setWeights([]);
      
      // Show user-friendly error
      toast({
        title: 'Error Loading Data',
        description: 'Could not load weight entries. Please try refreshing.',
        variant: 'destructive',
      });
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

  // Fetch history weights by date - client-side filtering
  const fetchHistoryWeights = async (date: Date) => {
    if (!date) return;
    
    setIsHistoryLoading(true);
    try {
      // Filter weights by selected date
      const filteredWeights = weights.filter(entry => {
        const entryDate = new Date(entry.created_at);
        return isSameDay(entryDate, date);
      });
      
      setHistoryWeights(filteredWeights);
      
      if (filteredWeights.length === 0) {
        toast({
          title: 'No Data Found',
          description: `No weight entries found for ${format(date, 'MMMM d, yyyy')}`,
          variant: 'default',
        });
      }
    } catch (error: any) {
      console.error('Error filtering history:', error);
      toast({
        title: 'Error',
        description: 'Failed to filter history data',
        variant: 'destructive',
      });
      setHistoryWeights([]);
    } finally {
      setIsHistoryLoading(false);
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
      
      // Calculate today's entries
      const todayEntries = weights.filter(entry => {
        const entryDate = new Date(entry.created_at);
        const today = new Date();
        return isSameDay(entryDate, today);
      });
      
      // Get unique suppliers today
      const uniqueSuppliers = new Set(
        todayEntries.map(entry => entry.supplier_id).filter(Boolean)
      ).size;
      
      // Get pending suppliers count
      const pendingSuppliers = checkedInSuppliers.filter(s => !processedSuppliers.has(s.id)).length;
      
      // Calculate total weight - USING SEPARATED VARIETIES
      const totalWeightToday = todayEntries.reduce((sum, entry) => 
        sum + (entry.fuerte_weight || 0) + (entry.hass_weight || 0), 0);
      
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
          value: `${(totalWeightToday / 1000).toFixed(1)} t`,
          change: `${todayEntries.length} entries recorded`,
          changeType: 'increase',
        },
        suppliersToday: {
          title: 'Suppliers Processed',
          value: uniqueSuppliers.toString(),
          change: `${pendingSuppliers} still pending`,
          changeType: pendingSuppliers > 0 ? 'increase' : 'neutral',
        },
        pendingSuppliers: {
          title: 'Pending Weighing',
          value: pendingSuppliers.toString(),
          change: `${checkedInSuppliers.length} checked-in total`,
          changeType: 'neutral',
        },
      });
    } catch (error: any) {
      console.error('Error fetching KPI data:', error);
      // Set default KPI data using separated variety weights
      const todayEntries = weights.filter(entry => {
        const entryDate = new Date(entry.created_at);
        const today = new Date();
        return isSameDay(entryDate, today);
      });
      
      // Calculate total weight using separated varieties
      const totalWeightToday = todayEntries.reduce((sum, entry) => 
        sum + (entry.fuerte_weight || 0) + (entry.hass_weight || 0), 0);
      
      const uniqueSuppliers = new Set(
        todayEntries.map(entry => entry.supplier_id).filter(Boolean)
      ).size;
      const pendingSuppliers = checkedInSuppliers.filter(s => !processedSuppliers.has(s.id)).length;
      
      setKpiData({
        palletsWeighed: {
          title: 'Pallets Weighed Today',
          value: todayEntries.length.toString(),
          change: 'Local data',
          changeType: 'neutral',
        },
        totalWeight: {
          title: 'Total Weight Today',
          value: `${(totalWeightToday / 1000).toFixed(1)} t`,
          change: `${todayEntries.length} entries`,
          changeType: 'neutral',
        },
        suppliersToday: {
          title: 'Suppliers Processed',
          value: uniqueSuppliers.toString(),
          change: `${pendingSuppliers} pending`,
          changeType: 'neutral',
        },
        pendingSuppliers: {
          title: 'Pending Weighing',
          value: pendingSuppliers.toString(),
          change: `${checkedInSuppliers.length} checked-in`,
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

  // Fetch history when date changes
  useEffect(() => {
    if (activeTab === 'history' && historyDate) {
      fetchHistoryWeights(historyDate);
    }
  }, [historyDate, activeTab, weights]);

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

  // Function to generate pallet ID with sequential numbering
  const generatePalletId = () => {
    const today = new Date();
    const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const palletNum = palletCounter.toString().padStart(3, '0');
    
    // Increment counter for next use
    setPalletCounter(prev => prev + 1);
    
    return `PAL-${palletNum}/${dateStr}`;
  };

  // Handle Add Weight function - UPDATED FOR API STRUCTURE
  const handleAddWeight = async (weightData: any) => {
    try {
      console.log('DEBUG - Raw weight data received:', weightData);
      
      // Extract fruit weights from weightData
      const fuerteWeight = weightData.fuerte_weight ? parseFloat(String(weightData.fuerte_weight)) : 0;
      const fuerteCrates = weightData.fuerte_crates ? parseInt(String(weightData.fuerte_crates)) : 0;
      const hassWeight = weightData.hass_weight ? parseFloat(String(weightData.hass_weight)) : 0;
      const hassCrates = weightData.hass_crates ? parseInt(String(weightData.hass_crates)) : 0;
      
      console.log('DEBUG - Parsed fruit weights:', {
        fuerteWeight,
        fuerteCrates,
        hassWeight,
        hassCrates
      });
      
      // Validate at least one weight is provided
      if (fuerteWeight <= 0 && hassWeight <= 0) {
        toast({
          title: 'Validation Error',
          description: 'Please enter weight for at least one variety (Fuerte or Hass)',
          variant: 'destructive',
        });
        return;
      }
      
      // Validate at least one crate count is provided
      if (fuerteCrates <= 0 && hassCrates <= 0) {
        toast({
          title: 'Validation Error',
          description: 'Please enter number of crates for at least one variety',
          variant: 'destructive',
        });
        return;
      }
      
      setError(null);
      
      // Capture supplier info before submission
      const submittedSupplierId = weightData.supplier_id;
      
      // Generate sequential pallet ID
      const generatedPalletId = weightData.pallet_id || generatePalletId();
      
      // Calculate totals
      const totalWeight = fuerteWeight + hassWeight;
      const totalCrates = fuerteCrates + hassCrates;
      
      console.log('DEBUG - Totals:', {
        totalWeight,
        totalCrates
      });
      
      // Create fruit varieties array based on weights
      const fruitVarieties = [];
      if (fuerteWeight > 0) fruitVarieties.push('Fuerte');
      if (hassWeight > 0) fruitVarieties.push('Hass');
      
      // Prepare payload for API
      const payload = {
        // Pallet info
        pallet_id: generatedPalletId,
        unit: weightData.unit || 'kg',
        timestamp: weightData.timestamp || new Date().toISOString(),
        
        // SEPARATED FRUIT WEIGHTS - THIS IS WHAT THE API EXPECTS
        fuerte_weight: String(fuerteWeight),
        fuerte_crates: String(fuerteCrates),
        hass_weight: String(hassWeight),
        hass_crates: String(hassCrates),
        
        // Supplier details
        supplier: weightData.supplier || weightData.supplier_name || '',
        supplier_name: weightData.supplier_name || weightData.supplier || '',
        supplier_id: weightData.supplier_id || '',
        supplier_phone: weightData.supplier_phone || '',
        
        // Region
        region: weightData.region || '',
        
        // Driver/vehicle details
        driver_name: weightData.driver_name || '',
        driver_phone: weightData.driver_phone || '',
        driver_id_number: weightData.driver_id_number || '',
        vehicle_plate: weightData.vehicle_plate || '',
        truck_id: weightData.truck_id || weightData.vehicle_plate || '',
        driver_id: weightData.driver_id || weightData.driver_id_number || '',
        
        // Optional fields
        image_url: weightData.image_url || '',
        notes: weightData.notes || '',
      };
      
      console.log('DEBUG - Sending payload to API:', payload);
      
      const response = await fetch('/api/weights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to save weight';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const savedEntry = await response.json();
      
      console.log('DEBUG - Received saved entry:', savedEntry);
      
      // Update local state
      setWeights(prev => [savedEntry, ...prev]);
      setLastWeightEntry(savedEntry);
      
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
      }
      
      setIsReceiptOpen(true);
      
      // Refresh KPI data
      await fetchKpiData();
      
      toast({
        title: 'Weight Saved Successfully',
        description: `Pallet ${savedEntry.pallet_id} has been recorded with ${fruitVarieties.length} varieties (Fuerte: ${fuerteWeight}kg, Hass: ${hassWeight}kg).`,
      });
      
    } catch (error: any) {
      console.error('Error adding weight:', error);
      setError(error.message || 'Failed to save weight entry');
      
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save weight entry to server',
        variant: 'destructive',
      });
    }
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

  // Function to extract variety data from weight entries with SEPARATED weights
  const extractVarietyData = (weights: WeightEntry[]): VarietyData[] => {
    const varietyMap = new Map<string, { weight: number; crates: number }>();
    
    weights.forEach(entry => {
      // Use separated variety weights from the API
      if (entry.fuerte_weight && entry.fuerte_weight > 0) {
        const key = 'Fuerte';
        if (!varietyMap.has(key)) {
          varietyMap.set(key, { weight: 0, crates: 0 });
        }
        const data = varietyMap.get(key)!;
        data.weight += entry.fuerte_weight;
        data.crates += entry.fuerte_crates || 0;
      }
      
      if (entry.hass_weight && entry.hass_weight > 0) {
        const key = 'Hass';
        if (!varietyMap.has(key)) {
          varietyMap.set(key, { weight: 0, crates: 0 });
        }
        const data = varietyMap.get(key)!;
        data.weight += entry.hass_weight;
        data.crates += entry.hass_crates || 0;
      }
      
      // Also check perVarietyWeights for any other varieties
      if (entry.perVarietyWeights && entry.perVarietyWeights.length > 0) {
        entry.perVarietyWeights.forEach(variety => {
          const key = variety.variety;
          if (!varietyMap.has(key)) {
            varietyMap.set(key, { weight: 0, crates: 0 });
          }
          const data = varietyMap.get(key)!;
          data.weight += variety.weight || 0;
          data.crates += variety.crates || 0;
        });
      }
    });
    
    // Convert map to array and sort by variety name
    return Array.from(varietyMap.entries())
      .map(([variety, data]) => ({
        variety,
        weight: data.weight,
        crates: data.crates
      }))
      .sort((a, b) => a.variety.localeCompare(b.variety));
  };

  // Function to generate CSV data with SEPARATED variety weights
  const generateCSVData = (weights: WeightEntry[]): CSVRow[] => {
    // Group weights by supplier and date
    const supplierMap = new Map<string, CSVRow>();
    
    weights.forEach(entry => {
      const date = new Date(entry.created_at).toISOString().split('T')[0];
      const supplierKey = entry.supplier || entry.driver_name || 'Unknown';
      const phoneKey = entry.supplier_phone || entry.driver_phone || '';
      const vehicleKey = entry.vehicle_plate || '';
      const regionKey = entry.region || '';
      
      const key = `${date}_${supplierKey}_${vehicleKey}`;
      
      if (!supplierMap.has(key)) {
        supplierMap.set(key, {
          date,
          supplier_name: supplierKey,
          phone_number: phoneKey,
          vehicle_plate_number: vehicleKey,
          fuerte_weight: 0,
          hass_weight: 0,
          fuerte_crates_in: 0,
          hass_crates_in: 0,
          region: regionKey
        });
      }
      
      const row = supplierMap.get(key)!;
      
      // Add separated variety weights directly
      row.fuerte_weight += entry.fuerte_weight || 0;
      row.fuerte_crates_in += entry.fuerte_crates || 0;
      row.hass_weight += entry.hass_weight || 0;
      row.hass_crates_in += entry.hass_crates || 0;
    });
    
    return Array.from(supplierMap.values());
  };

  // Function to download CSV
  const downloadCSV = (weights: WeightEntry[], date: Date) => {
    const csvData = generateCSVData(weights);
    
    if (csvData.length === 0) {
      toast({
        title: 'No Data',
        description: 'No data available to download for the selected date.',
        variant: 'destructive',
      });
      return;
    }
    
    // Create CSV content
    const headers = [
      'Date',
      'Supplier Name',
      'Phone Number',
      'Vehicle Plate Number',
      'Fuerte Weight (kg)',
      'Hass Weight (kg)',
      'Fuerte Crates In',
      'Hass Crates In',
      'Region'
    ];
    
    const rows = csvData.map(row => [
      row.date,
      `"${row.supplier_name}"`,
      `"${row.phone_number}"`,
      `"${row.vehicle_plate_number}"`,
      row.fuerte_weight.toFixed(2),
      row.hass_weight.toFixed(2),
      row.fuerte_crates_in,
      row.hass_crates_in,
      `"${row.region}"`
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `weight_data_${format(date, 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'CSV Downloaded',
      description: `Weight data for ${format(date, 'MMMM d, yyyy')} has been downloaded.`,
    });
  };

// Function to download Supplier GRN as PDF with SEPARATED variety display
const downloadSupplierGRN = async (supplierId: string) => {
  try {
    // First, get all weights for this supplier from local state
    const supplierWeights = weights.filter(w => w.supplier_id === supplierId);
    
    if (supplierWeights.length === 0) {
      toast({
        title: 'No Data Found',
        description: 'No weight entries found for this supplier.',
        variant: 'destructive',
      });
      return;
    }
    
    // Use the supplier name from the FIRST weight entry (from Weight Capture Form)
    const supplierName = supplierWeights[0]?.supplier || 'Unknown Supplier';
    const supplierPhone = supplierWeights[0]?.supplier_phone || '';
    const driverName = supplierWeights[0]?.driver_name || '';
    const vehiclePlate = supplierWeights[0]?.vehicle_plate || '';
    
    // Find the supplier for additional info from check-in data
    const supplier = checkedInSuppliers.find(s => s.id === supplierId);
    
    // Extract variety data with SEPARATED weights
    const varietyData = extractVarietyData(supplierWeights);
    
    // Calculate totals
    const totalFuerteWeight = supplierWeights.reduce((sum, w) => sum + (w.fuerte_weight || 0), 0);
    const totalHassWeight = supplierWeights.reduce((sum, w) => sum + (w.hass_weight || 0), 0);
    const totalFuerteCrates = supplierWeights.reduce((sum, w) => sum + (w.fuerte_crates || 0), 0);
    const totalHassCrates = supplierWeights.reduce((sum, w) => sum + (w.hass_crates || 0), 0);
    const totalWeight = totalFuerteWeight + totalHassWeight;
    const totalCrates = totalFuerteCrates + totalHassCrates;
    
    // Create PDF
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // =========== CENTERED LOGO AND TITLE ===========
    let hasLogo = false;
    let logoHeight = 0;
    
    // Try to load logo
    try {
      const logoPaths = [
        '/Harirlogo.svg',
        '/Harirlogo.png',
        '/Harirlogo.jpg',
        '/logo.png',
        '/logo.jpg',
        '/favicon.ico',
        '/public/favicon.ico'
      ];
      
      for (const path of logoPaths) {
        try {
          const response = await fetch(path);
          if (response.ok) {
            const blob = await response.blob();
            const base64String = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            });
            
            // Add centered logo (15mm height)
            doc.addImage(base64String as string, 'PNG', 92.5, 10, 15, 15);
            hasLogo = true;
            logoHeight = 15;
            break;
          }
        } catch (e) {
          continue;
        }
      }
    } catch (error) {
      console.log('Logo loading failed:', error);
    }
    
    // If no logo found, create a centered text logo
    if (!hasLogo) {
      doc.setFillColor(34, 139, 34); // Green
      doc.circle(100, 17.5, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('HI', 100, 19.5, { align: 'center' });
      logoHeight = 15;
      hasLogo = true;
    }
    
    // Company name - Centered and larger
    const startY = hasLogo ? 30 : 15;
    doc.setTextColor(34, 139, 34); // Green text
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('HARIR INTERNATIONAL', 105, startY, { align: 'center' });
    
    // Division name
    doc.setFontSize(11);
    doc.text('FRESH PRODUCE EXPORTER', 105, startY + 6, { align: 'center' });
    
    // Draw a green line under the header
    doc.setDrawColor(34, 139, 34);
    doc.setLineWidth(0.5);
    doc.line(10, startY + 10, 200, startY + 10);
    
    // =========== GRN TITLE ===========
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0); // Black text
    doc.text('GOODS RECEIVED NOTE (GRN)', 105, startY + 20, { align: 'center' });
    
    // =========== GRN DETAILS ===========
    let yPos = startY + 30;
    
    // GRN Details box
    doc.setFillColor(248, 249, 250); // Very light gray
    doc.rect(10, yPos, 190, 15, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('GRN Details', 15, yPos + 6);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    // GRN details in two columns
    doc.text(`GRN: GRN-${supplierId.slice(0, 8)}`, 15, yPos + 12);
    doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`, 50, yPos + 12);
    doc.text(`Time: ${format(new Date(), 'HH:mm')}`, 85, yPos + 12);
    doc.text(`Code: ${supplier?.supplier_code || 'N/A'}`, 120, yPos + 12);
    
    yPos += 20;
    
    // =========== SUPPLIER INFORMATION ===========
    doc.setFillColor(233, 236, 239); // Light gray
    doc.rect(10, yPos, 190, 20, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Supplier Information', 15, yPos + 6);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Supplier: ${supplierName}`, 15, yPos + 12);
    doc.text(`Phone: ${supplierPhone}`, 80, yPos + 12);
    doc.text(`Driver: ${driverName || 'N/A'}`, 120, yPos + 12);
    doc.text(`Vehicle: ${vehiclePlate || 'N/A'}`, 160, yPos + 12);
    
    doc.text(`Check-in: ${format(new Date(supplier?.check_in_time || new Date()), 'dd/MM/yyyy HH:mm')}`, 15, yPos + 18);
    
    yPos += 25;
    
    // =========== RECEIVED GOODS TABLE ===========
    if (varietyData.length > 0) {
      // Table header
      doc.setFillColor(52, 58, 64); // Dark gray header
      doc.rect(10, yPos, 190, 8, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255); // White text
      doc.text('Received Goods Details', 15, yPos + 5.5);
      
      yPos += 10;
      
      // Column headers
      doc.setFillColor(248, 249, 250);
      doc.rect(10, yPos, 190, 7, 'F');
      doc.setTextColor(0, 0, 0);
      
      doc.text('Fruit Variety', 15, yPos + 4.5);
      doc.text('Weight (kg)', 130, yPos + 4.5, { align: 'right' });
      doc.text('Crates', 180, yPos + 4.5, { align: 'right' });
      
      yPos += 7;
      
      // Table rows
      varietyData.forEach((item, index) => {
        // Alternate row colors
        doc.setFillColor(index % 2 === 0 ? 255 : 248, 249, 250);
        doc.rect(10, yPos, 190, 7, 'F');
        
        // Variety name with color
        if (item.variety.toLowerCase().includes('fuerte')) {
          doc.setTextColor(0, 102, 204); // Blue
        } else if (item.variety.toLowerCase().includes('hass')) {
          doc.setTextColor(0, 153, 0); // Green
        } else {
          doc.setTextColor(102, 102, 102);
        }
        
        doc.setFont('helvetica', 'bold');
        doc.text(item.variety, 15, yPos + 4.5);
        
        // Numbers
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.text(item.weight.toFixed(2), 130, yPos + 4.5, { align: 'right' });
        doc.text(item.crates.toString(), 180, yPos + 4.5, { align: 'right' });
        
        yPos += 7;
      });
      
      // Grand total row - SHOWING ONLY TOTAL WEIGHT AND TOTAL CRATES
      yPos += 3;
      doc.setFillColor(40, 167, 69); // Green
      doc.rect(10, yPos, 190, 8, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('GRAND TOTAL', 15, yPos + 5);
      doc.text(totalWeight.toFixed(2), 130, yPos + 5, { align: 'right' });
      doc.text(totalCrates.toString(), 180, yPos + 5, { align: 'right' });
      
      yPos += 12;
    }
    
    // =========== FOOTER AND SIGNATURES ===========
    // Notes (very compact)
    doc.setFontSize(7);
    doc.setTextColor(108, 117, 125); // Gray
    doc.setFont('helvetica', 'italic');
    
    const notes = [
      '• All weights in kilograms (kg) • Quality inspection within 24 hours • Discrepancies must be reported immediately'
    ];
    
    notes.forEach((note, index) => {
      doc.text(note, 105, yPos + (index * 5), { align: 'center' });
    });
    
    yPos += 10;
    
    // Signature lines (compact)
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    
    // Received by
    doc.line(20, yPos, 90, yPos);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('Received By (Name & Signature)', 55, yPos + 3, { align: 'center' });
    doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`, 55, yPos + 6, { align: 'center' });
    
    // Supplier/Driver
    doc.line(120, yPos, 190, yPos);
    doc.text('Supplier/Driver (Name & Signature)', 155, yPos + 3, { align: 'center' });
    doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`, 155, yPos + 6, { align: 'center' });
    
    yPos += 15;
    
    // Final footer
    doc.setFontSize(6);
    doc.setTextColor(128, 128, 128);
    doc.text('This is a computer-generated document. No physical signature required.', 105, yPos, { align: 'center' });
    doc.text('Harir International © 2024 | GRN System v1.0', 105, yPos + 3, { align: 'center' });
    
    // =========== SAVE PDF ===========
    const fileName = `GRN_${supplierName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`;
    doc.save(fileName);
    
    toast({
      title: 'GRN Downloaded',
      description: `Goods Received Note has been downloaded for ${supplierName}.`,
    });
    
  } catch (error: any) {
    console.error('Error downloading GRN:', error);
    toast({
      title: 'Error Downloading GRN',
      description: error.message || 'Failed to download GRN. Please try again.',
      variant: 'destructive',
    });
  }
};

  // Filter history weights based on search query
  const filteredHistoryWeights = historyWeights.filter(entry => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const varieties = entry.fruit_variety || [];
    
    return (
      (entry.supplier?.toLowerCase().includes(query)) ||
      (entry.driver_name?.toLowerCase().includes(query)) ||
      (entry.vehicle_plate?.toLowerCase().includes(query)) ||
      (entry.region?.toLowerCase().includes(query)) ||
      varieties.some(v => v.toLowerCase().includes(query)) ||
      (entry.pallet_id?.toLowerCase().includes(query))
    );
  });

  // Calculate statistics - UPDATED FOR SEPARATED WEIGHTS
  const totalWeightToday = weights
    .filter(w => {
      const today = new Date();
      return isSameDay(new Date(w.created_at), today);
    })
    .reduce((sum, w) => sum + (w.fuerte_weight || 0) + (w.hass_weight || 0), 0);

  const uniqueSuppliersToday = new Set(
    weights
      .filter(w => {
        const today = new Date();
        return isSameDay(new Date(w.created_at), today) && w.supplier_id;
      })
      .map(w => w.supplier_id)
  ).size;

  // Count pending and weighed suppliers
  const pendingSuppliersCount = checkedInSuppliers.filter(s => !processedSuppliers.has(s.id)).length;
  const weighedSuppliersCount = checkedInSuppliers.filter(s => processedSuppliers.has(s.id)).length;

  // Calculate total Fuerte and Hass weights for today
  const totalFuerteWeightToday = weights
    .filter(w => {
      const today = new Date();
      return isSameDay(new Date(w.created_at), today);
    })
    .reduce((sum, w) => sum + (w.fuerte_weight || 0), 0);

  const totalHassWeightToday = weights
    .filter(w => {
      const today = new Date();
      return isSameDay(new Date(w.created_at), today);
    })
    .reduce((sum, w) => sum + (w.hass_weight || 0), 0);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <FreshViewLogo className="w-8 h-8 text-primary" />
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

          {/* Quick Stats with SEPARATED VARIETIES */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-gray-500">Pallets Today</p>
                  <h3 className="text-2xl font-bold mt-1">{weights.filter(w => {
                    const today = new Date();
                    return isSameDay(new Date(w.created_at), today);
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
                  <p className="text-sm font-medium text-gray-500">Total Weight Today</p>
                  <h3 className="text-2xl font-bold mt-1">{(totalWeightToday / 1000).toFixed(1)} t</h3>
                  <div className="flex flex-col mt-1 text-xs text-gray-500">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
                      Fuerte: {(totalFuerteWeightToday / 1000).toFixed(1)} t
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                      Hass: {(totalHassWeightToday / 1000).toFixed(1)} t
                    </div>
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
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Boxes className="h-4 w-4" />
                Dashboard Overview
              </TabsTrigger>
              <TabsTrigger value="capture" className="flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Weight Capture
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab Content */}
            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* KPI Cards */}
              {kpiData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(Object.entries(kpiData) as [keyof KPIData, any][]).map(([key, data]) => (
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
              )}

              {/* Checked-in Suppliers - UPDATED FOR SEPARATED WEIGHTS */}
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
                        
                        // Get weight entries for this supplier
                        const supplierWeights = weights.filter(w => w.supplier_id === supplier.id);
                        
                        // Extract SEPARATED variety data
                        const varietyData = extractVarietyData(supplierWeights);
                        
                        // Calculate total Fuerte and Hass weights for this supplier
                        const supplierFuerteWeight = supplierWeights.reduce((sum, w) => sum + (w.fuerte_weight || 0), 0);
                        const supplierHassWeight = supplierWeights.reduce((sum, w) => sum + (w.hass_weight || 0), 0);
                        const supplierFuerteCrates = supplierWeights.reduce((sum, w) => sum + (w.fuerte_crates || 0), 0);
                        const supplierHassCrates = supplierWeights.reduce((sum, w) => sum + (w.hass_crates || 0), 0);
                        
                        return (
                          <div 
                            key={supplier.id} 
                            className={`flex items-center justify-between p-4 rounded-lg border ${
                              isWeighed 
                                ? 'border-green-200 bg-black-50 hover:bg-black-100' 
                                : 'border-amber-200 bg-black-50 hover:bg-black-100'
                            } transition-colors`}
                          >
                            <div className="flex items-center gap-4 flex-1">
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
                              <div className="flex-1">
                                <div className="font-semibold text-lg">{supplier.driver_name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {supplier.company_name} • {supplier.vehicle_plate} • {supplier.region}
                                </div>
                                
                                {/* SEPARATED variety weights display */}
                                {isWeighed && varietyData.length > 0 && (
                                  <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {varietyData.map((item) => (
                                      <div 
                                        key={item.variety} 
                                        className={`p-2 rounded ${
                                          item.variety.toLowerCase().includes('fuerte') 
                                            ? 'bg-black-50 border border-blue-200' 
                                            : item.variety.toLowerCase().includes('hass')
                                            ? 'bg-black-50 border border-green-200'
                                            : 'bg-black-50 border border-gray-200'
                                        }`}
                                      >
                                        <div className="text-xs font-medium flex items-center gap-1">
                                          {item.variety.toLowerCase().includes('fuerte') ? (
                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                          ) : item.variety.toLowerCase().includes('hass') ? (
                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                          ) : (
                                            <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                                          )}
                                          {item.variety}
                                        </div>
                                        <div className="text-sm font-semibold mt-1">
                                          {item.weight.toFixed(1)} kg
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {item.crates} crates
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Show pending varieties if not weighed yet */}
                                {supplier.fruit_varieties.length > 0 && !isWeighed && (
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
                                <div className="flex gap-2 mt-2">
                                  <Badge 
                                    variant="outline" 
                                    className="px-3 py-1 text-xs bg-green-100 text-green-800 border-green-300"
                                  >
                                    <CheckCheck className="w-3 h-3 mr-1" />
                                    Weighed
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs gap-1"
                                    onClick={() => downloadSupplierGRN(supplier.id)}
                                  >
                                    <FileText className="w-3 h-3" />
                                    Download GRN
                                  </Button>
                                </div>
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
                      palletCounter={palletCounter}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab Content - UPDATED FOR SEPARATED WEIGHTS */}
            <TabsContent value="history" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5" />
                      Weight History & Export
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => historyDate && downloadCSV(filteredHistoryWeights, historyDate)}
                        disabled={isHistoryLoading || filteredHistoryWeights.length === 0}
                        className="gap-2"
                        variant="outline"
                      >
                        <Download className="w-4 h-4" />
                        CSV
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    View weight history by date and export data in multiple formats
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Date Selection and Search */}
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="space-y-2 flex-1">
                        <Label htmlFor="history-date">Select Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !historyDate && "text-muted-foreground"
                              )}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {historyDate ? format(historyDate, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={historyDate}
                              onSelect={setHistoryDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2 flex-1">
                        <Label htmlFor="search-history">Search Entries</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            id="search-history"
                            placeholder="Search by supplier, driver, vehicle plate..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    {/* CSV Preview Header */}
                    <div className="bg-black-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FileSpreadsheet className="w-5 h-5 text-green-600" />
                        <span className="font-medium">Export Options</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Export data in CSV format or download individual supplier GRNs as PDF</p>
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => historyDate && downloadCSV(filteredHistoryWeights, historyDate)}
                            disabled={filteredHistoryWeights.length === 0}
                          >
                            <Download className="w-3 h-3" />
                            Download All as CSV
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* History Table */}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-black-50 px-4 py-3 border-b">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">
                              {historyDate ? `Entries for ${format(historyDate, 'MMMM d, yyyy')}` : 'Select a date'}
                            </span>
                            <Badge variant="outline" className="ml-2">
                              {filteredHistoryWeights.length} entries
                            </Badge>
                          </div>
                          {filteredHistoryWeights.length > 0 && (
                            <div className="text-sm text-gray-500">
                              Total Weight: {(filteredHistoryWeights.reduce((sum, w) => sum + (w.fuerte_weight || 0) + (w.hass_weight || 0), 0) / 1000).toFixed(1)} t
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {isHistoryLoading ? (
                        <div className="h-64 flex items-center justify-center">
                          <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                            <p className="mt-2 text-gray-600">Loading history data...</p>
                          </div>
                        </div>
                      ) : filteredHistoryWeights.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-black-50 border-b">
                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Time</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Pallet ID</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Supplier</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Driver</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Vehicle</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Separated Varieties</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Fuerte Weight</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Hass Weight</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Crates</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Region</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredHistoryWeights.map((entry) => {
                                // Get varieties from separated weights
                                const varieties = [];
                                if (entry.fuerte_weight > 0) varieties.push('Fuerte');
                                if (entry.hass_weight > 0) varieties.push('Hass');
                                
                                return (
                                  <tr key={entry.id} className="border-b hover:bg-black-50">
                                    <td className="p-3">
                                      {new Date(entry.created_at).toLocaleTimeString([], { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </td>
                                    <td className="p-3 font-mono font-medium">
                                      {entry.pallet_id || '-'}
                                    </td>
                                    <td className="p-3 font-medium">{entry.supplier || '-'}</td>
                                    <td className="p-3">{entry.driver_name || '-'}</td>
                                    <td className="p-3">
                                      <Badge variant="outline" className="text-xs">
                                        {entry.vehicle_plate || '-'}
                                      </Badge>
                                    </td>
                                    <td className="p-3">
                                      <div className="flex flex-wrap gap-1">
                                        {varieties.length > 0 ? (
                                          varieties.map((variety, idx) => (
                                            <div 
                                              key={idx} 
                                              className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                                                variety.toLowerCase().includes('fuerte') 
                                                  ? 'bg-blue-100 text-blue-800' 
                                                  : 'bg-green-100 text-green-800'
                                              }`}
                                            >
                                              {variety.toLowerCase().includes('fuerte') ? (
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                                              ) : (
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div>
                                              )}
                                              {variety}
                                            </div>
                                          ))
                                        ) : (
                                          <span className="text-xs text-gray-500">No varieties</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="p-3 font-semibold text-blue-700">
                                      {(entry.fuerte_weight || 0).toFixed(1)} {entry.unit}
                                    </td>
                                    <td className="p-3 font-semibold text-green-700">
                                      {(entry.hass_weight || 0).toFixed(1)} {entry.unit}
                                    </td>
                                    <td className="p-3">
                                      <div className="flex flex-col">
                                        <span className="text-xs">Total: {entry.number_of_crates || 0}</span>
                                        {(entry.fuerte_crates > 0 || entry.hass_crates > 0) && (
                                          <div className="flex gap-2 text-xs text-gray-500">
                                            {entry.fuerte_crates > 0 && (
                                              <span>F: {entry.fuerte_crates}</span>
                                            )}
                                            {entry.hass_crates > 0 && (
                                              <span>H: {entry.hass_crates}</span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                    <td className="p-3">
                                      <Badge variant="secondary" className="text-xs">
                                        {entry.region || '-'}
                                      </Badge>
                                    </td>
                                    <td className="p-3">
                                      {entry.supplier_id && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 w-8 p-0"
                                          onClick={() => downloadSupplierGRN(entry.supplier_id!)}
                                          title="Download Supplier GRN"
                                        >
                                          <Printer className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="h-64 flex flex-col items-center justify-center p-6">
                          <div className="text-center">
                            <FileSpreadsheet className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">
                              {historyDate ? 'No entries found' : 'Select a date'}
                            </h3>
                            <p className="text-gray-500 max-w-md mx-auto">
                              {historyDate 
                                ? `No weight entries found for ${format(historyDate, 'MMMM d, yyyy')}. Try selecting a different date.`
                                : 'Choose a date to view weight history and export options.'
                              }
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Export Summary */}
                    {filteredHistoryWeights.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Export Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">
                                {new Set(filteredHistoryWeights.map(w => w.supplier_id)).size}
                              </div>
                              <div className="text-sm text-gray-600">Total Suppliers</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">
                                {filteredHistoryWeights.length}
                              </div>
                              <div className="text-sm text-gray-600">Total Pallets</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">
                                {(filteredHistoryWeights.reduce((sum, w) => sum + (w.fuerte_weight || 0) + (w.hass_weight || 0), 0) / 1000).toFixed(1)} t
                              </div>
                              <div className="text-sm text-gray-600">Total Weight</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">
                                {new Set(filteredHistoryWeights.map(w => w.region)).size}
                              </div>
                              <div className="text-sm text-gray-600">Regions</div>
                            </div>
                          </div>
                          <div className="mt-4 flex justify-center">
                            <Button
                              onClick={() => historyDate && downloadCSV(filteredHistoryWeights, historyDate)}
                              className="gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Download All Data as CSV
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
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
              palletId: lastWeightEntry.pallet_id || '',
              shipmentId: '',
              weight: `${((lastWeightEntry.fuerte_weight || 0) + (lastWeightEntry.hass_weight || 0))} kg`,
              timestamp: lastWeightEntry.timestamp || lastWeightEntry.created_at,
              status: 'approved',
              operator: 'operator',
              notes: lastWeightEntry.notes || '',
              supplier: lastWeightEntry.supplier || '',
              truckId: lastWeightEntry.vehicle_plate || '',
              driverId: lastWeightEntry.driver_name || '',
              driverName: lastWeightEntry.driver_name || '',
              driverPhone: lastWeightEntry.driver_phone || '',
              fruitVariety: lastWeightEntry.fruit_variety?.join(', ') || '',
              numberOfCrates: lastWeightEntry.number_of_crates || 0,
              region: lastWeightEntry.region || '',
              imageUrl: lastWeightEntry.image_url || '',
              netWeight: (lastWeightEntry.fuerte_weight || 0) + (lastWeightEntry.hass_weight || 0),
              unit: lastWeightEntry.unit || 'kg',
              client: lastWeightEntry.supplier || '',
              products: lastWeightEntry.fruit_variety?.map(variety => ({
                product: variety,
                quantity: 1,
                weight: variety.toLowerCase().includes('fuerte') ? lastWeightEntry.fuerte_weight : lastWeightEntry.hass_weight
              })) || [],
              supplierPhone: lastWeightEntry.supplier_phone || '',
            }}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}