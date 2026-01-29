// app/weights/page.tsx
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
import { Scale, Boxes, Truck, Loader2, RefreshCw, AlertCircle, CheckCircle, Package, TrendingUp, TrendingDown, Minus, Clock, CheckCheck, Download, Calendar, FileSpreadsheet, Search, Printer, FileText, AlertTriangle, XCircle, Trash2, Plus, Filter, Eye, EyeOff, Users, Apple, PieChart, History, Calculator, BarChart3, Layers } from 'lucide-react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Define types
interface WeightEntry {
  id: string;
  pallet_id: string;
  product: string;
  weight: number;
  unit: 'kg' | 'lb';
  timestamp: string;
  created_at: string;
  supplier: string;
  supplier_id: string;
  supplier_phone: string;
  driver_name: string;
  driver_phone: string;
  driver_id_number: string;
  vehicle_plate: string;
  truck_id: string;
  gross_weight: number;
  tare_weight: number;
  net_weight: number;
  declared_weight: number;
  rejected_weight: number;
  fuerte_weight: number;
  fuerte_crates: number;
  hass_weight: number;
  hass_crates: number;
  number_of_crates: number;
  fruit_variety: string[];
  perVarietyWeights: Array<{
    variety: string;
    weight: number;
    crates: number;
  }>;
  region: string;
  image_url: string;
  notes: string;
  bank_name: string;
  bank_account: string;
  kra_pin: string;
}

interface CheckedInSupplier {
  id: string;
  supplier_code?: string;
  company_name?: string;
  driver_name?: string;
  phone_number?: string;
  id_number?: string;
  vehicle_plate?: string;
  fruit_varieties?: string[];
  region?: string;
  check_in_time: string;
  status?: 'pending' | 'weighed';
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

interface RejectionEntry {
  id?: string;
  weight_entry_id: string;
  pallet_id: string;
  supplier_id: string;
  supplier_name: string;
  driver_name: string;
  vehicle_plate: string;
  region: string;
  fuerte_weight: number;
  fuerte_crates: number;
  hass_weight: number;
  hass_crates: number;
  total_rejected_weight: number;
  total_rejected_crates: number;
  counted_weight: number;
  variance: number;
  reason?: string;
  notes?: string;
  rejected_at: string;
  created_by: string;
}

interface CountingHistoryRecord {
  id: string;
  supplier_id: string;
  supplier_name: string;
  pallet_id: string;
  region: string;
  total_weight: number;
  total_counted_weight: number;
  fuerte_4kg_total: number;
  fuerte_10kg_total: number;
  hass_4kg_total: number;
  hass_10kg_total: number;
  counting_data: any;
  totals: any;
  status: string;
  for_coldroom: boolean;
  submitted_at: string;
  processed_by: string;
  notes?: string;
  driver_name?: string;
  vehicle_plate?: string;
  supplier_phone?: string;
  bank_name?: string;
  bank_account?: string;
  kra_pin?: string;
}

interface VarietyStats {
  variety: string;
  total_weight: number;
  total_crates: number;
  avg_weight_per_crate: number;
}

interface DailySummary {
  date: string;
  total_weight: number;
  total_crates: number;
  total_pallets: number;
  total_suppliers: number;
  varieties: VarietyStats[];
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
  const [countingHistory, setCountingHistory] = useState<CountingHistoryRecord[]>([]);
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
  const [filterRegion, setFilterRegion] = useState<string>('all');
  
  // Rejects tab states
  const [rejects, setRejects] = useState<RejectionEntry[]>([]);
  const [isRejectsLoading, setIsRejectsLoading] = useState(false);
  const [newRejection, setNewRejection] = useState<RejectionEntry>({
    weight_entry_id: '',
    pallet_id: '',
    supplier_id: '',
    supplier_name: '',
    driver_name: '',
    vehicle_plate: '',
    region: '',
    fuerte_weight: 0,
    fuerte_crates: 0,
    hass_weight: 0,
    hass_crates: 0,
    total_rejected_weight: 0,
    total_rejected_crates: 0,
    counted_weight: 0,
    variance: 0,
    reason: '',
    notes: '',
    rejected_at: new Date().toISOString(),
    created_by: 'Weight Capture Station'
  });
  const [selectedWeightForReject, setSelectedWeightForReject] = useState<WeightEntry | null>(null);
  const [selectedCountingRecordForReject, setSelectedCountingRecordForReject] = useState<CountingHistoryRecord | null>(null);
  const [isAddingRejection, setIsAddingRejection] = useState(false);
  
  // Statistics tab states
  const [statsPeriod, setStatsPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  
  // State for pallet ID counter
  const [palletCounter, setPalletCounter] = useState<number>(1);
  
  const { toast } = useToast();

  // Fetch all weight entries
  const fetchWeights = async () => {
    try {
      setError(null);
      const response = await fetch('/api/weights?limit=1000&order=desc');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch weights: ${response.statusText}`);
      }
      
      const data = await response.json();
      setWeights(data);
      
      const processedSet = new Set<string>();
      data.forEach((entry: WeightEntry) => {
        if (entry.supplier_id) {
          processedSet.add(entry.supplier_id);
        }
      });
      setProcessedSuppliers(processedSet);
      
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

  // Fetch counting history
  const fetchCountingHistory = async () => {
    try {
      const response = await fetch('/api/counting?action=history');
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCountingHistory(result.data || []);
        }
      }
    } catch (error: any) {
      console.error('Error fetching counting history:', error);
      setCountingHistory([]);
    }
  };

  // Add this helper function near the top (after imports):
const safeFormatDate = (dateString: string, formatStr: string = 'PPpp') => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return format(date, formatStr);
  } catch {
    return 'Date Error';
  }
};

const safeFormatTime = (dateString: string) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Error';
  }
};

  // Fetch rejects
  const fetchRejects = async () => {
    try {
      setIsRejectsLoading(true);
      const response = await fetch('/api/rejects');
      
      if (response.ok) {
        const data: RejectionEntry[] = await response.json();
        setRejects(data);
      } else {
        // If no rejects API, use empty array
        setRejects([]);
      }
    } catch (error: any) {
      console.error('Error fetching rejects:', error);
      setRejects([]);
    } finally {
      setIsRejectsLoading(false);
    }
  };

  // Calculate statistics
  const calculateStatistics = () => {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setDate(today.getDate() - 30);
    
    let periodWeights: WeightEntry[] = [];
    
    switch (statsPeriod) {
      case 'today':
        periodWeights = weights.filter(w => isSameDay(new Date(w.created_at), today));
        break;
      case 'week':
        periodWeights = weights.filter(w => new Date(w.created_at) >= weekAgo);
        break;
      case 'month':
        periodWeights = weights.filter(w => new Date(w.created_at) >= monthAgo);
        break;
    }
    
    // Group by date
    const summariesMap = new Map<string, DailySummary>();
    
    periodWeights.forEach(entry => {
      const date = new Date(entry.created_at).toISOString().split('T')[0];
      
      if (!summariesMap.has(date)) {
        summariesMap.set(date, {
          date,
          total_weight: 0,
          total_crates: 0,
          total_pallets: 0,
          total_suppliers: 0,
          varieties: []
        });
      }
      
      const summary = summariesMap.get(date)!;
      summary.total_weight += (entry.fuerte_weight || 0) + (entry.hass_weight || 0);
      summary.total_crates += (entry.fuerte_crates || 0) + (entry.hass_crates || 0);
      summary.total_pallets++;
      
      // Add supplier if not counted yet
      if (entry.supplier_id && !summary.total_suppliers) {
        summary.total_suppliers = 1;
      }
      
      // Update variety stats
      if (entry.fuerte_weight > 0) {
        let variety = summary.varieties.find(v => v.variety === 'Fuerte');
        if (!variety) {
          variety = { variety: 'Fuerte', total_weight: 0, total_crates: 0, avg_weight_per_crate: 0 };
          summary.varieties.push(variety);
        }
        variety.total_weight += entry.fuerte_weight;
        variety.total_crates += entry.fuerte_crates || 0;
      }
      
      if (entry.hass_weight > 0) {
        let variety = summary.varieties.find(v => v.variety === 'Hass');
        if (!variety) {
          variety = { variety: 'Hass', total_weight: 0, total_crates: 0, avg_weight_per_crate: 0 };
          summary.varieties.push(variety);
        }
        variety.total_weight += entry.hass_weight;
        variety.total_crates += entry.hass_crates || 0;
      }
    });
    
    // Calculate averages
    summariesMap.forEach(summary => {
      summary.varieties.forEach(variety => {
        variety.avg_weight_per_crate = variety.total_crates > 0 
          ? variety.total_weight / variety.total_crates 
          : 0;
      });
    });
    
    const summaries = Array.from(summariesMap.values())
      .sort((a, b) => b.date.localeCompare(a.date));
    
    setDailySummaries(summaries);
  };

  // Update supplier status
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
      
      if (response.ok) {
        const data = await response.json();
        
        const todayEntries = weights.filter(entry => {
          const entryDate = new Date(entry.created_at);
          const today = new Date();
          return isSameDay(entryDate, today);
        });
        
        const uniqueSuppliers = new Set(
          todayEntries.map(entry => entry.supplier_id).filter(Boolean)
        ).size;
        
        const pendingSuppliers = checkedInSuppliers.filter(s => !processedSuppliers.has(s.id)).length;
        
        const totalWeightToday = todayEntries.reduce((sum, entry) => 
          sum + (entry.fuerte_weight || 0) + (entry.hass_weight || 0), 0);
        
        setKpiData({
          palletsWeighed: {
            title: 'Pallets Weighed Today',
            value: data.todayCount?.toString() || todayEntries.length.toString(),
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
      }
    } catch (error: any) {
      console.error('Error fetching KPI data:', error);
      
      const todayEntries = weights.filter(entry => {
        const entryDate = new Date(entry.created_at);
        const today = new Date();
        return isSameDay(entryDate, today);
      });
      
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
        fetchCountingHistory(),
        fetchRejects()
      ]);
      setIsLoading(false);
    };
    
    loadData();
  }, []);

  // Refresh data when weights change
  useEffect(() => {
    if (!isLoading) {
      fetchKpiData();
      calculateStatistics();
    }
  }, [weights, statsPeriod]);

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
      fetchCountingHistory(),
      fetchRejects()
    ]);
    setIsRefreshing(false);
    
    toast({
      title: 'Data Refreshed',
      description: 'Latest data has been loaded.',
    });
  };

  // Fetch history weights by date
  const fetchHistoryWeights = async (date: Date) => {
    if (!date) return;
    
    setIsHistoryLoading(true);
    try {
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

  // Generate pallet ID
  const generatePalletId = () => {
    const today = new Date();
    const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const palletNum = palletCounter.toString().padStart(3, '0');
    
    setPalletCounter(prev => prev + 1);
    
    return `PAL-${palletNum}/${dateStr}`;
  };

  // Handle Add Weight
  const handleAddWeight = async (weightData: any) => {
    try {
      const fuerteWeight = weightData.fuerte_weight ? parseFloat(String(weightData.fuerte_weight)) : 0;
      const fuerteCrates = weightData.fuerte_crates ? parseInt(String(weightData.fuerte_crates)) : 0;
      const hassWeight = weightData.hass_weight ? parseFloat(String(weightData.hass_weight)) : 0;
      const hassCrates = weightData.hass_crates ? parseInt(String(weightData.hass_crates)) : 0;
      
      if (fuerteWeight <= 0 && hassWeight <= 0) {
        toast({
          title: 'Validation Error',
          description: 'Please enter weight for at least one variety (Fuerte or Hass)',
          variant: 'destructive',
        });
        return;
      }
      
      if (fuerteCrates <= 0 && hassCrates <= 0) {
        toast({
          title: 'Validation Error',
          description: 'Please enter number of crates for at least one variety',
          variant: 'destructive',
        });
        return;
      }
      
      setError(null);
      
      const submittedSupplierId = weightData.supplier_id;
      const generatedPalletId = weightData.pallet_id || generatePalletId();
      
      const payload = {
        pallet_id: generatedPalletId,
        unit: weightData.unit || 'kg',
        timestamp: weightData.timestamp || new Date().toISOString(),
        fuerte_weight: String(fuerteWeight),
        fuerte_crates: String(fuerteCrates),
        hass_weight: String(hassWeight),
        hass_crates: String(hassCrates),
        supplier: weightData.supplier || weightData.supplier_name || '',
        supplier_name: weightData.supplier_name || weightData.supplier || '',
        supplier_id: weightData.supplier_id || '',
        supplier_phone: weightData.supplier_phone || '',
        region: weightData.region || '',
        driver_name: weightData.driver_name || '',
        driver_phone: weightData.driver_phone || '',
        driver_id_number: weightData.driver_id_number || '',
        vehicle_plate: weightData.vehicle_plate || '',
        truck_id: weightData.truck_id || weightData.vehicle_plate || '',
        driver_id: weightData.driver_id || weightData.driver_id_number || '',
        image_url: weightData.image_url || '',
        notes: weightData.notes || '',
      };
      
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
      
      setWeights(prev => [savedEntry, ...prev]);
      setLastWeightEntry(savedEntry);
      
      if (submittedSupplierId) {
        setProcessedSuppliers(prev => {
          const newSet = new Set(prev);
          newSet.add(submittedSupplierId);
          return newSet;
        });
        
        setCheckedInSuppliers(prev => 
          prev.map(supplier => 
            supplier.id === submittedSupplierId 
              ? { ...supplier, status: 'weighed' } 
              : supplier
          )
        );
      }
      
      setIsReceiptOpen(true);
      await fetchKpiData();
      
      toast({
        title: 'Weight Saved Successfully',
        description: `Pallet ${savedEntry.pallet_id} has been recorded.`,
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

  // Handle supplier selection
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
      description: `${supplier.driver_name} from ${supplier.company_name} is ready for weighing.`,
    });
  };

  // Extract variety data
  const extractVarietyData = (weights: WeightEntry[]) => {
    const varietyMap = new Map<string, { weight: number; crates: number }>();
    
    weights.forEach(entry => {
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
    
    return Array.from(varietyMap.entries())
      .map(([variety, data]) => ({
        variety,
        weight: data.weight,
        crates: data.crates
      }))
      .sort((a, b) => a.variety.localeCompare(b.variety));
  };

  // Generate CSV data
// Generate CSV data with row totals
const generateCSVData = (weights: WeightEntry[]) => {
  const supplierMap = new Map<string, any>();
  
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
        total_weight: 0,
        fuerte_crates_in: 0,
        hass_crates_in: 0,
        total_crates: 0,
        region: regionKey
      });
    }
    
    const row = supplierMap.get(key)!;
    
    row.fuerte_weight += entry.fuerte_weight || 0;
    row.fuerte_crates_in += entry.fuerte_crates || 0;
    row.hass_weight += entry.hass_weight || 0;
    row.hass_crates_in += entry.hass_crates || 0;
    row.total_weight = row.fuerte_weight + row.hass_weight;
    row.total_crates = row.fuerte_crates_in + row.hass_crates_in;
  });
  
  return Array.from(supplierMap.values());
};

// Download CSV with totals row
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
  
  // Calculate totals
  const totals = csvData.reduce((acc, row) => {
    return {
      totalFuerteWeight: acc.totalFuerteWeight + (row.fuerte_weight || 0),
      totalHassWeight: acc.totalHassWeight + (row.hass_weight || 0),
      totalFuerteCrates: acc.totalFuerteCrates + (row.fuerte_crates_in || 0),
      totalHassCrates: acc.totalHassCrates + (row.hass_crates_in || 0),
      totalWeight: acc.totalWeight + (row.fuerte_weight || 0) + (row.hass_weight || 0)
    };
  }, {
    totalFuerteWeight: 0,
    totalHassWeight: 0,
    totalFuerteCrates: 0,
    totalHassCrates: 0,
    totalWeight: 0
  });
  
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
  
  // Add empty row before totals
  rows.push(['', '', '', '', '', '', '', '', '']);
  
  // Add totals row
  rows.push([
    'TOTALS',
    '',
    '',
    '',
    totals.totalFuerteWeight.toFixed(2),
    totals.totalHassWeight.toFixed(2),
    totals.totalFuerteCrates,
    totals.totalHassCrates,
    ''
  ]);
  
  // Add grand total row for total fruits weight
  rows.push([
    'GRAND TOTAL',
    '',
    '',
    '',
    'Total Fruits Weight:',
    totals.totalWeight.toFixed(2) + ' kg',
    '',
    '',
    ''
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
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
    description: `Weight data for ${format(date, 'MMMM d, yyyy')} has been downloaded with totals.`,
  });
};

  // Download Supplier GRN
  const downloadSupplierGRN = async (supplierId: string) => {
    try {
      const supplierWeights = weights.filter(w => w.supplier_id === supplierId);
      
      if (supplierWeights.length === 0) {
        toast({
          title: 'No Data Found',
          description: 'No weight entries found for this supplier.',
          variant: 'destructive',
        });
        return;
      }
      
      const supplierName = supplierWeights[0]?.supplier || 'Unknown Supplier';
      const supplierPhone = supplierWeights[0]?.supplier_phone || '';
      const driverName = supplierWeights[0]?.driver_name || '';
      const vehiclePlate = supplierWeights[0]?.vehicle_plate || '';
      
      const supplier = checkedInSuppliers.find(s => s.id === supplierId);
      
      const varietyData = extractVarietyData(supplierWeights);
      
      const totalFuerteWeight = supplierWeights.reduce((sum, w) => sum + (w.fuerte_weight || 0), 0);
      const totalHassWeight = supplierWeights.reduce((sum, w) => sum + (w.hass_weight || 0), 0);
      const totalFuerteCrates = supplierWeights.reduce((sum, w) => sum + (w.fuerte_crates || 0), 0);
      const totalHassCrates = supplierWeights.reduce((sum, w) => sum + (w.hass_crates || 0), 0);
      const totalWeight = totalFuerteWeight + totalHassWeight;
      const totalCrates = totalFuerteCrates + totalHassCrates;
      
      const doc = new jsPDF('p', 'mm', 'a4');
      
      let hasLogo = false;
      let logoHeight = 0;
      
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
      
      if (!hasLogo) {
        doc.setFillColor(34, 139, 34);
        doc.circle(100, 17.5, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('HI', 100, 19.5, { align: 'center' });
        logoHeight = 15;
        hasLogo = true;
      }
      
      const startY = hasLogo ? 30 : 15;
      doc.setTextColor(34, 139, 34);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('HARIR INTERNATIONAL', 105, startY, { align: 'center' });
      
      doc.setFontSize(11);
      doc.text('FRESH PRODUCE EXPORTER', 105, startY + 6, { align: 'center' });
      
      doc.setDrawColor(34, 139, 34);
      doc.setLineWidth(0.5);
      doc.line(10, startY + 10, 200, startY + 10);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('GOODS RECEIVED NOTE (GRN)', 105, startY + 20, { align: 'center' });
      
      let yPos = startY + 30;
      
      doc.setFillColor(248, 249, 250);
      doc.rect(10, yPos, 190, 15, 'F');
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('GRN Details', 15, yPos + 6);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      
      doc.text(`GRN: GRN-${supplierId.slice(0, 8)}`, 15, yPos + 12);
      doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`, 50, yPos + 12);
      doc.text(`Time: ${format(new Date(), 'HH:mm')}`, 85, yPos + 12);
      doc.text(`Code: ${supplier?.supplier_code || 'N/A'}`, 120, yPos + 12);
      
      yPos += 20;
      
      doc.setFillColor(233, 236, 239);
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
      
      if (varietyData.length > 0) {
        doc.setFillColor(52, 58, 64);
        doc.rect(10, yPos, 190, 8, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('Received Goods Details', 15, yPos + 5.5);
        
        yPos += 10;
        
        doc.setFillColor(248, 249, 250);
        doc.rect(10, yPos, 190, 7, 'F');
        doc.setTextColor(0, 0, 0);
        
        doc.text('Fruit Variety', 15, yPos + 4.5);
        doc.text('Weight (kg)', 130, yPos + 4.5, { align: 'right' });
        doc.text('Crates', 180, yPos + 4.5, { align: 'right' });
        
        yPos += 7;
        
        varietyData.forEach((item, index) => {
          doc.setFillColor(index % 2 === 0 ? 255 : 248, 249, 250);
          doc.rect(10, yPos, 190, 7, 'F');
          
          if (item.variety.toLowerCase().includes('fuerte')) {
            doc.setTextColor(0, 102, 204);
          } else if (item.variety.toLowerCase().includes('hass')) {
            doc.setTextColor(0, 153, 0);
          } else {
            doc.setTextColor(102, 102, 102);
          }
          
          doc.setFont('helvetica', 'bold');
          doc.text(item.variety, 15, yPos + 4.5);
          
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
          doc.text(item.weight.toFixed(2), 130, yPos + 4.5, { align: 'right' });
          doc.text(item.crates.toString(), 180, yPos + 4.5, { align: 'right' });
          
          yPos += 7;
        });
        
        yPos += 3;
        doc.setFillColor(40, 167, 69);
        doc.rect(10, yPos, 190, 8, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('GRAND TOTAL', 15, yPos + 5);
        doc.text(totalWeight.toFixed(2), 130, yPos + 5, { align: 'right' });
        doc.text(totalCrates.toString(), 180, yPos + 5, { align: 'right' });
        
        yPos += 12;
      }
      
      doc.setFontSize(7);
      doc.setTextColor(108, 117, 125);
      doc.setFont('helvetica', 'italic');
      
      const notes = [
        '• All weights in kilograms (kg) • Quality inspection within 24 hours • Discrepancies must be reported immediately'
      ];
      
      notes.forEach((note, index) => {
        doc.text(note, 105, yPos + (index * 5), { align: 'center' });
      });
      
      yPos += 10;
      
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.2);
      
      doc.line(20, yPos, 90, yPos);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('Received By (Name & Signature)', 55, yPos + 3, { align: 'center' });
      doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`, 55, yPos + 6, { align: 'center' });
      
      doc.line(120, yPos, 190, yPos);
      doc.text('Supplier/Driver (Name & Signature)', 155, yPos + 3, { align: 'center' });
      doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`, 155, yPos + 6, { align: 'center' });
      
      yPos += 15;
      
      doc.setFontSize(6);
      doc.setTextColor(128, 128, 128);
      doc.text('This is a computer-generated document. No physical signature required.', 105, yPos, { align: 'center' });
      doc.text('Harir International © 2024 | GRN System v1.0', 105, yPos + 3, { align: 'center' });
      
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

  // Filter history weights
  const filteredHistoryWeights = historyWeights.filter(entry => {
    if (!searchQuery && filterRegion === 'all') return true;
    
    const query = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      (entry.supplier?.toLowerCase().includes(query)) ||
      (entry.driver_name?.toLowerCase().includes(query)) ||
      (entry.vehicle_plate?.toLowerCase().includes(query)) ||
      (entry.pallet_id?.toLowerCase().includes(query));
    
    const matchesRegion = filterRegion === 'all' || entry.region === filterRegion;
    
    return matchesSearch && matchesRegion;
  });

  // Handle weight selection for rejection from weight history
  const handleSelectWeightForRejection = (weight: WeightEntry) => {
    setSelectedWeightForReject(weight);
    // Find counting record for this pallet/supplier
    const countingRecord = countingHistory.find(
      record => record.pallet_id === weight.pallet_id || record.supplier_id === weight.supplier_id
    );
    
    setNewRejection({
      ...newRejection,
      weight_entry_id: weight.id,
      pallet_id: weight.pallet_id,
      supplier_id: weight.supplier_id || '',
      supplier_name: weight.supplier || '',
      driver_name: weight.driver_name || '',
      vehicle_plate: weight.vehicle_plate || '',
      region: weight.region || '',
      fuerte_weight: 0,
      fuerte_crates: 0,
      hass_weight: 0,
      hass_crates: 0,
      counted_weight: countingRecord?.total_counted_weight || 0,
      total_rejected_weight: 0,
      total_rejected_crates: 0,
      variance: calculateVariance(weight, countingRecord, 0, 0)
    });
    
    toast({
      title: 'Weight Selected',
      description: `${weight.supplier} (Pallet: ${weight.pallet_id}) selected for rejection entry.`,
    });
  };

  // Handle counting record selection for rejection
  const handleSelectCountingRecordForRejection = (record: CountingHistoryRecord) => {
    setSelectedCountingRecordForReject(record);
    
    // Find weight entry for this pallet/supplier
    const weightEntry = weights.find(
      weight => weight.pallet_id === record.pallet_id || weight.supplier_id === record.supplier_id
    );
    
    setNewRejection({
      ...newRejection,
      weight_entry_id: record.id,
      pallet_id: record.pallet_id,
      supplier_id: record.supplier_id || '',
      supplier_name: record.supplier_name || '',
      driver_name: record.driver_name || '',
      vehicle_plate: record.vehicle_plate || '',
      region: record.region || '',
      fuerte_weight: 0,
      fuerte_crates: 0,
      hass_weight: 0,
      hass_crates: 0,
      counted_weight: record.total_counted_weight || 0,
      total_rejected_weight: 0,
      total_rejected_crates: 0,
      variance: calculateVariance(weightEntry || null, record, 0, 0)
    });
    
    toast({
      title: 'Counting Record Selected',
      description: `${record.supplier_name} (Pallet: ${record.pallet_id}) selected for rejection entry.`,
    });
  };

  // Calculate variance: intake weight - (counted weight + rejected weight)
  const calculateVariance = (
    weightEntry: WeightEntry | null, 
    countingRecord: CountingHistoryRecord | null, 
    rejectedWeight: number,
    rejectedCrates: number
  ) => {
    // Get intake weight from weight entry if available, otherwise from counting record
    let intakeWeight = 0;
    
    if (weightEntry) {
      intakeWeight = (weightEntry.fuerte_weight || 0) + (weightEntry.hass_weight || 0);
    } else if (countingRecord) {
      intakeWeight = countingRecord.total_weight || 0;
    }
    
    // Get counted weight from counting record
    const countedWeight = countingRecord?.total_counted_weight || 0;
    
    // Calculate variance: intake - (counted + rejected)
    const variance = intakeWeight - (countedWeight + rejectedWeight);
    
    return variance;
  };

  // Handle rejection input change
  const handleRejectionInputChange = (field: keyof RejectionEntry, value: string | number) => {
    const updatedRejection = {
      ...newRejection,
      [field]: value
    };
    
    if (field === 'fuerte_weight' || field === 'hass_weight' || 
        field === 'fuerte_crates' || field === 'hass_crates' ||
        field === 'counted_weight') {
      
      const totalRejectedWeight = (updatedRejection.fuerte_weight || 0) + (updatedRejection.hass_weight || 0);
      const totalRejectedCrates = (updatedRejection.fuerte_crates || 0) + (updatedRejection.hass_crates || 0);
      
      updatedRejection.total_rejected_weight = totalRejectedWeight;
      updatedRejection.total_rejected_crates = totalRejectedCrates;
      
      // Recalculate variance with new counted weight and rejected weight
      const intakeWeight = selectedWeightForReject 
        ? (selectedWeightForReject.fuerte_weight || 0) + (selectedWeightForReject.hass_weight || 0)
        : selectedCountingRecordForReject?.total_weight || 0;
      
      const countedWeight = updatedRejection.counted_weight || 0;
      const rejectedWeight = updatedRejection.total_rejected_weight || 0;
      
      // Variance = intake - (counted + rejected)
      updatedRejection.variance = intakeWeight - (countedWeight + rejectedWeight);
    }
    
    setNewRejection(updatedRejection);
  };

  // Submit rejection
  const handleSubmitRejection = async () => {
    if (!selectedWeightForReject && !selectedCountingRecordForReject) {
      toast({
        title: 'No Record Selected',
        description: 'Please select a weight entry or counting record first.',
        variant: 'destructive',
      });
      return;
    }
    
    if (newRejection.total_rejected_weight <= 0 && newRejection.counted_weight <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter either rejected weight or counted weight.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsAddingRejection(true);
      
      // Get the appropriate intake weight
      let intakeWeight = 0;
      if (selectedWeightForReject) {
        intakeWeight = (selectedWeightForReject.fuerte_weight || 0) + (selectedWeightForReject.hass_weight || 0);
      } else if (selectedCountingRecordForReject) {
        intakeWeight = selectedCountingRecordForReject.total_weight || 0;
      }
      
      const rejectionData = {
        ...newRejection,
        rejected_at: new Date().toISOString(),
        created_by: 'Weight Capture Station',
        // Ensure variance is calculated correctly
        variance: intakeWeight - (newRejection.counted_weight + newRejection.total_rejected_weight)
      };
      
      const response = await fetch('/api/rejects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rejectionData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save rejection entry');
      }
      
      const savedRejection = await response.json();
      
      setRejects(prev => [savedRejection, ...prev]);
      
      // Reset form
      setNewRejection({
        weight_entry_id: '',
        pallet_id: '',
        supplier_id: '',
        supplier_name: '',
        driver_name: '',
        vehicle_plate: '',
        region: '',
        fuerte_weight: 0,
        fuerte_crates: 0,
        hass_weight: 0,
        hass_crates: 0,
        counted_weight: 0,
        total_rejected_weight: 0,
        total_rejected_crates: 0,
        variance: 0,
        reason: '',
        notes: '',
        rejected_at: new Date().toISOString(),
        created_by: 'Weight Capture Station'
      });
      
      setSelectedWeightForReject(null);
      setSelectedCountingRecordForReject(null);
      
      toast({
        title: 'Rejection Saved',
        description: `Rejection entry saved for ${savedRejection.supplier_name}. Variance: ${savedRejection.variance.toFixed(1)} kg`,
      });
      
    } catch (error: any) {
      console.error('Error saving rejection:', error);
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save rejection entry',
        variant: 'destructive',
      });
    } finally {
      setIsAddingRejection(false);
    }
  };

  // Delete rejection
  const handleDeleteRejection = async (rejectionId: string) => {
    if (!confirm('Are you sure you want to delete this rejection entry?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/rejects/${rejectionId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete rejection entry');
      }
      
      setRejects(prev => prev.filter(r => r.id !== rejectionId));
      
      toast({
        title: 'Rejection Deleted',
        description: 'Rejection entry has been deleted.',
      });
      
    } catch (error: any) {
      console.error('Error deleting rejection:', error);
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete rejection entry',
        variant: 'destructive',
      });
    }
  };

  // Get regions for filter
  const regions = Array.from(new Set(weights.map(w => w.region).filter(Boolean)));

  // Calculate totals
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

  const pendingSuppliersCount = checkedInSuppliers.filter(s => !processedSuppliers.has(s.id)).length;
  const weighedSuppliersCount = checkedInSuppliers.filter(s => processedSuppliers.has(s.id)).length;

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

  const totalRejectedWeight = rejects.reduce((sum, r) => sum + r.total_rejected_weight, 0);
  const totalRejectedToday = rejects.filter(r => {
    const today = new Date();
    const rejectDate = new Date(r.rejected_at);
    return isSameDay(rejectDate, today);
  }).length;

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
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Scale className="w-8 h-8" />
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

            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-gray-500">Rejects Today</p>
                  <h3 className="text-2xl font-bold mt-1">{totalRejectedToday}</h3>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
                    <span>{totalRejectedWeight.toFixed(1)} kg rejected</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Boxes className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="capture" className="flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Capture
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                History
              </TabsTrigger>
              <TabsTrigger value="rejects" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Rejects
              </TabsTrigger>
              <TabsTrigger value="statistics" className="flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Statistics
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
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
                        const supplierWeights = weights.filter(w => w.supplier_id === supplier.id);
                        const varietyData = extractVarietyData(supplierWeights);
                        
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

            {/* History Tab */}
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
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
                      <div className="space-y-2">
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
                      <div className="space-y-2">
                        <Label htmlFor="filter-region">Filter by Region</Label>
                        <Select value={filterRegion} onValueChange={setFilterRegion}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Regions" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Regions</SelectItem>
                            {regions.map(region => (
                              <SelectItem key={region} value={region}>{region}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Varieties</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Fuerte Weight</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Hass Weight</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Crates</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Region</th>
                                <th className="text-left p-3 text-sm font-semibold text-gray-700">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredHistoryWeights.map((entry) => {
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
                                      <div className="flex gap-2">
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
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 w-8 p-0"
                                          onClick={() => handleSelectWeightForRejection(entry)}
                                          title="Add Rejection"
                                        >
                                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                                        </Button>
                                      </div>
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

                    {/* Updated Export Summary */}
                    {filteredHistoryWeights.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Export Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
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
                                {(filteredHistoryWeights.reduce((sum, w) => sum + (w.fuerte_weight || 0), 0) / 1000).toFixed(1)} t
                              </div>
                              <div className="text-sm text-gray-600">Fuerte Weight</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">
                                {(filteredHistoryWeights.reduce((sum, w) => sum + (w.hass_weight || 0), 0) / 1000).toFixed(1)} t
                              </div>
                              <div className="text-sm text-gray-600">Hass Weight</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">
                                {filteredHistoryWeights.reduce((sum, w) => sum + (w.fuerte_crates || 0), 0)}
                              </div>
                              <div className="text-sm text-gray-600">Fuerte Crates</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">
                                {filteredHistoryWeights.reduce((sum, w) => sum + (w.hass_crates || 0), 0)}
                              </div>
                              <div className="text-sm text-gray-600">Hass Crates</div>
                            </div>
                          </div>
                          
                          <div className="bg-black-50 p-4 rounded-lg mb-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="text-lg font-bold">
                                  Total Fruits Weight: {(filteredHistoryWeights.reduce((sum, w) => sum + (w.fuerte_weight || 0) + (w.hass_weight || 0), 0) / 1000).toFixed(1)} tons
                                </div>
                                <div className="text-sm text-gray-600">
                                  Total Crates: {filteredHistoryWeights.reduce((sum, w) => sum + (w.fuerte_crates || 0) + (w.hass_crates || 0), 0)}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex justify-center gap-4">
                            <Button
                              onClick={() => historyDate && downloadCSV(filteredHistoryWeights, historyDate)}
                              className="gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Download CSV with Totals
                            </Button>
                            <Button
                              onClick={() => historyDate && downloadEnhancedCSV(filteredHistoryWeights, historyDate)}
                              className="gap-2"
                              variant="outline"
                            >
                              <Download className="w-4 h-4" />
                              Enhanced CSV
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Rejects Tab */}
            <TabsContent value="rejects" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Rejects History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Rejects History
                    </CardTitle>
                    <CardDescription>
                      {rejects.length} rejection entries recorded
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isRejectsLoading ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                        <p className="text-muted-foreground">Loading rejects...</p>
                      </div>
                    ) : rejects.length === 0 ? (
                      <div className="text-center py-8">
                        <AlertTriangle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No rejection entries found</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Rejection entries will appear here after they are recorded
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {rejects.map((reject) => {
                          // Safe access with default values to prevent undefined errors
                          const totalWeight = reject?.total_rejected_weight || 0;
                          const variance = reject?.variance || 0;
                          const countedWeight = reject?.counted_weight || 0;
                          const fuerteWeight = reject?.fuerte_weight || 0;
                          const hassWeight = reject?.hass_weight || 0;
                          const fuerteCrates = reject?.fuerte_crates || 0;
                          const hassCrates = reject?.hass_crates || 0;
                          const totalCrates = reject?.total_rejected_crates || 0;
                          
                          return (
                            <div key={reject.id} className="border rounded-lg p-4 hover:bg-black-50">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <div className="font-semibold">{reject?.supplier_name || 'Unknown Supplier'}</div>
                                  <div className="text-sm text-gray-500">
                                    Pallet: {reject?.pallet_id || '-'} • {safeFormatDate(reject?.rejected_at, 'PPpp')}
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-black-50"
                                  onClick={() => reject?.id && handleDeleteRejection(reject.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                                <div>
                                  <div className="text-gray-500">Total Rejected</div>
                                  <div className="font-bold text-red-700">{totalWeight.toFixed(1)} kg</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Counted Weight</div>
                                  <div className="font-bold text-blue-700">{countedWeight.toFixed(1)} kg</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Total Crates</div>
                                  <div className="font-bold">{totalCrates}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Variance</div>
                                  <div className={`font-bold ${variance > 0 ? 'text-green-700' : 'text-red-700'}`}>
                                    {variance > 0 ? '+' : ''}{variance.toFixed(1)} kg
                                  </div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Fuerte</div>
                                  <div className="font-semibold">
                                    {fuerteWeight > 0 ? `${fuerteWeight} kg (${fuerteCrates} crates)` : '-'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Hass</div>
                                  <div className="font-semibold">
                                    {hassWeight > 0 ? `${hassWeight} kg (${hassCrates} crates)` : '-'}
                                  </div>
                                </div>
                              </div>
                              
                              {reject?.reason && (
                                <div className="mt-3 pt-3 border-t">
                                  <div className="text-sm text-gray-500">Reason</div>
                                  <div className="text-sm">{reject.reason}</div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Add Rejection Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Add New Rejection
                    </CardTitle>
                    <CardDescription>
                      Record rejected weight from quality control
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Source Selection */}
                      <div className="space-y-2">
                        <Label>Select Source</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant={selectedWeightForReject ? "default" : "outline"}
                            onClick={() => {
                              setSelectedCountingRecordForReject(null);
                              setActiveTab('history');
                            }}
                          >
                            <Scale className="h-4 w-4 mr-2" />
                            Weight History
                          </Button>
                          <Button
                            variant={selectedCountingRecordForReject ? "default" : "outline"}
                            onClick={() => {
                              setSelectedWeightForReject(null);
                              setActiveTab('statistics');
                            }}
                          >
                            <Calculator className="h-4 w-4 mr-2" />
                            Counting History
                          </Button>
                        </div>
                      </div>

                      {/* Selected Record Info */}
                      {(selectedWeightForReject || selectedCountingRecordForReject) && (
                        <div className="bg-black-50 p-4 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold text-blue-800">
                              {selectedWeightForReject ? 'Selected Weight Entry' : 'Selected Counting Record'}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedWeightForReject(null);
                                setSelectedCountingRecordForReject(null);
                              }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="text-sm">
                            <div><span className="font-medium">Supplier:</span> {
                              selectedWeightForReject?.supplier || selectedCountingRecordForReject?.supplier_name || 'Unknown'
                            }</div>
                            <div><span className="font-medium">Pallet ID:</span> {
                              selectedWeightForReject?.pallet_id || selectedCountingRecordForReject?.pallet_id || '-'
                            }</div>
                            <div><span className="font-medium">Intake Weight:</span> 
                              {selectedWeightForReject 
                                ? ((selectedWeightForReject.fuerte_weight + selectedWeightForReject.hass_weight).toFixed(1))
                                : ((selectedCountingRecordForReject?.total_weight || 0).toFixed(1))
                              } kg
                            </div>
                            <div><span className="font-medium">Counted Weight:</span> 
                              {selectedCountingRecordForReject?.total_counted_weight 
                                ? `${selectedCountingRecordForReject.total_counted_weight.toFixed(1)} kg` 
                                : 'Not counted yet'}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Rejection Form */}
                      <div className="space-y-4">
                        {/* Counted Weight Input */}
                        <div className="space-y-2">
                          <Label htmlFor="counted_weight">Counted Weight (kg)</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id="counted_weight"
                              type="number"
                              min="0"
                              step="0.1"
                              value={newRejection.counted_weight}
                              onChange={(e) => handleRejectionInputChange('counted_weight', parseFloat(e.target.value) || 0)}
                              placeholder="Enter counted weight"
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (selectedCountingRecordForReject) {
                                  handleRejectionInputChange('counted_weight', selectedCountingRecordForReject.total_counted_weight || 0);
                                }
                              }}
                              disabled={!selectedCountingRecordForReject}
                              title="Use counted weight from selected record"
                            >
                              Auto-fill
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500">
                            Weight after counting/quality check
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="fuerte_weight">Fuerte Rejected (kg)</Label>
                            <Input
                              id="fuerte_weight"
                              type="number"
                              min="0"
                              step="0.1"
                              value={newRejection.fuerte_weight}
                              onChange={(e) => handleRejectionInputChange('fuerte_weight', parseFloat(e.target.value) || 0)}
                              placeholder="0.0"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="fuerte_crates">Fuerte Crates Rejected</Label>
                            <Input
                              id="fuerte_crates"
                              type="number"
                              min="0"
                              value={newRejection.fuerte_crates}
                              onChange={(e) => handleRejectionInputChange('fuerte_crates', parseInt(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="hass_weight">Hass Rejected (kg)</Label>
                            <Input
                              id="hass_weight"
                              type="number"
                              min="0"
                              step="0.1"
                              value={newRejection.hass_weight}
                              onChange={(e) => handleRejectionInputChange('hass_weight', parseFloat(e.target.value) || 0)}
                              placeholder="0.0"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="hass_crates">Hass Crates Rejected</Label>
                            <Input
                              id="hass_crates"
                              type="number"
                              min="0"
                              value={newRejection.hass_crates}
                              onChange={(e) => handleRejectionInputChange('hass_crates', parseInt(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="reason">Reason for Rejection</Label>
                          <Input
                            id="reason"
                            value={newRejection.reason || ''}
                            onChange={(e) => handleRejectionInputChange('reason', e.target.value)}
                            placeholder="Quality issues, damage, etc."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="notes">Notes</Label>
                          <Input
                            id="notes"
                            value={newRejection.notes || ''}
                            onChange={(e) => handleRejectionInputChange('notes', e.target.value)}
                            placeholder="Additional details..."
                          />
                        </div>

                        {/* Summary */}
                        <div className="bg-black-50 p-4 rounded-lg border">
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <div className="text-sm text-gray-500">Total Rejected Weight</div>
                              <div className="text-xl font-bold text-red-700">
                                {(newRejection.total_rejected_weight || 0).toFixed(1)} kg
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">Total Rejected Crates</div>
                              <div className="text-xl font-bold">
                                {newRejection.total_rejected_crates || 0}
                              </div>
                            </div>
                          </div>
                          
                          {(selectedWeightForReject || selectedCountingRecordForReject) && (
                            <div className="mt-4 pt-4 border-t">
                              <div className="text-sm text-gray-500 font-medium mb-2">Variance Calculation</div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Intake Weight:</span>
                                  <span className="font-semibold">
                                    {selectedWeightForReject 
                                      ? ((selectedWeightForReject.fuerte_weight + selectedWeightForReject.hass_weight).toFixed(1))
                                      : ((selectedCountingRecordForReject?.total_weight || 0).toFixed(1))
                                    } kg
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Counted Weight:</span>
                                  <span className="font-semibold text-blue-700">-{(newRejection.counted_weight || 0).toFixed(1)} kg</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Rejected Weight:</span>
                                  <span className="font-semibold text-red-700">-{(newRejection.total_rejected_weight || 0).toFixed(1)} kg</span>
                                </div>
                              </div>
                              <div className="mt-3 pt-3 border-t">
                                <div className="flex justify-between font-bold text-lg">
                                  <span>Variance:</span>
                                  <span className={(newRejection.variance || 0) > 0 ? 'text-green-700' : 'text-red-700'}>
                                    {(newRejection.variance || 0) > 0 ? '+' : ''}{(newRejection.variance || 0).toFixed(1)} kg
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Formula: Intake - (Counted + Rejected)
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={handleSubmitRejection}
                          disabled={isAddingRejection || (!selectedWeightForReject && !selectedCountingRecordForReject) || 
                                   ((newRejection.total_rejected_weight || 0) <= 0 && (newRejection.counted_weight || 0) <= 0)}
                          className="w-full bg-red-600 hover:bg-red-700"
                        >
                          {isAddingRejection ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="mr-2 h-4 w-4" />
                              Save Rejection Entry
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="statistics" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Weight Statistics
                  </CardTitle>
                  <CardDescription>
                    Detailed analysis of weight data across different time periods
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Period Selection */}
                    <div className="flex gap-2">
                      <Button
                        variant={statsPeriod === 'today' ? 'default' : 'outline'}
                        onClick={() => setStatsPeriod('today')}
                      >
                        Today
                      </Button>
                      <Button
                        variant={statsPeriod === 'week' ? 'default' : 'outline'}
                        onClick={() => setStatsPeriod('week')}
                      >
                        Last 7 Days
                      </Button>
                      <Button
                        variant={statsPeriod === 'month' ? 'default' : 'outline'}
                        onClick={() => setStatsPeriod('month')}
                      >
                        Last 30 Days
                      </Button>
                    </div>

                    {/* Counting History Table */}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-black-50 px-4 py-3 border-b">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calculator className="w-4 h-4" />
                            <span className="font-medium">Counting History Records</span>
                            <Badge variant="outline" className="ml-2">
                              {countingHistory.length} records
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={fetchCountingHistory}
                            className="gap-2"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Refresh
                          </Button>
                        </div>
                      </div>
                      
                      {countingHistory.length > 0 ? (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Pallet ID</TableHead>
                                <TableHead>Region</TableHead>
                                <TableHead>Fuerte Boxes</TableHead>
                                <TableHead>Hass Boxes</TableHead>
                                <TableHead>Counted Weight</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {countingHistory.slice(0, 10).map((record) => (
                                <TableRow key={record.id}>
                                  <TableCell>
                                    {safeFormatDate(record.submitted_at, 'MM/dd/yyyy')}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {record.supplier_name || 'Unknown'}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{record.pallet_id || '-'}</Badge>
                                  </TableCell>
                                  <TableCell>{record.region || '-'}</TableCell>
                                  <TableCell>
                                    <div className="flex flex-col">
                                      <span>4kg: {record.fuerte_4kg_total || 0}</span>
                                      <span>10kg: {record.fuerte_10kg_total || 0}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col">
                                      <span>4kg: {record.hass_4kg_total || 0}</span>
                                      <span>10kg: {record.hass_10kg_total || 0}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-bold">
                                    {(record.total_counted_weight || 0).toFixed(1)} kg
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={
                                      record.for_coldroom && record.status === 'pending_coldroom' 
                                        ? "default" 
                                        : record.status === 'completed'
                                        ? "secondary"
                                        : "outline"
                                    }>
                                      {record.for_coldroom && record.status === 'pending_coldroom' 
                                        ? 'Cold Room Ready'
                                        : record.status === 'completed'
                                        ? 'Completed'
                                        : 'Pending'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleSelectCountingRecordForRejection(record)}
                                      title="Add Rejection for this record"
                                    >
                                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="h-64 flex flex-col items-center justify-center p-6">
                          <div className="text-center">
                            <Calculator className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">
                              No counting history found
                            </h3>
                            <p className="text-gray-500 max-w-md mx-auto">
                              Counting records from the warehouse will appear here once they are processed.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Daily Summaries */}
                    {dailySummaries.length > 0 && (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-black-50 px-4 py-3 border-b">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            <span className="font-medium">Daily Weight Summary ({statsPeriod === 'today' ? 'Today' : statsPeriod === 'week' ? 'Last 7 Days' : 'Last 30 Days'})</span>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Total Weight (kg)</TableHead>
                                <TableHead>Total Crates</TableHead>
                                <TableHead>Total Pallets</TableHead>
                                <TableHead>Suppliers</TableHead>
                                <TableHead>Varieties</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {dailySummaries.map((summary) => (
                                <TableRow key={summary.date}>
                                  <TableCell className="font-medium">
                                    {safeFormatDate(summary.date, 'MM/dd/yyyy')}
                                  </TableCell>
                                  <TableCell className="font-bold">
                                    {summary.total_weight.toFixed(1)} kg
                                  </TableCell>
                                  <TableCell>{summary.total_crates}</TableCell>
                                  <TableCell>{summary.total_pallets}</TableCell>
                                  <TableCell>{summary.total_suppliers}</TableCell>
                                  <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                      {summary.varieties.map((variety) => (
                                        <Badge 
                                          key={variety.variety}
                                          variant="outline"
                                          className={
                                            variety.variety === 'Fuerte' 
                                              ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                              : 'bg-green-50 text-green-700 border-green-200'
                                          }
                                        >
                                          <Apple className="w-3 h-3 mr-1" />
                                          {variety.variety}: {(variety.total_weight || 0).toFixed(0)}kg
                                        </Badge>
                                      ))}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {/* Variety Breakdown */}
                    {dailySummaries.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Variety Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {dailySummaries.flatMap(s => s.varieties)
                              .reduce((acc, variety) => {
                                const existing = acc.find(v => v.variety === variety.variety);
                                if (existing) {
                                  existing.total_weight += (variety.total_weight || 0);
                                  existing.total_crates += (variety.total_crates || 0);
                                } else {
                                  acc.push({...variety});
                                }
                                return acc;
                              }, [] as VarietyStats[])
                              .map((variety) => (
                                <div key={variety.variety} className={`p-4 rounded-lg border ${
                                  variety.variety === 'Fuerte' 
                                    ? 'border-blue-200 bg-blue-50' 
                                    : 'border-green-200 bg-green-50'
                                }`}>
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <Apple className={`w-5 h-5 ${
                                        variety.variety === 'Fuerte' ? 'text-blue-600' : 'text-green-600'
                                      }`} />
                                      <h4 className="font-semibold">{variety.variety} Avocado</h4>
                                    </div>
                                    <Badge variant="outline">
                                      {variety.total_crates || 0} crates
                                    </Badge>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-sm text-gray-600">Total Weight</span>
                                      <span className={`font-bold ${
                                        variety.variety === 'Fuerte' ? 'text-blue-700' : 'text-green-700'
                                      }`}>
                                        {(variety.total_weight || 0).toFixed(1)} kg
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm text-gray-600">Average per Crate</span>
                                      <span className="font-medium">
                                        {((variety.total_crates || 0) > 0 ? (variety.total_weight || 0) / (variety.total_crates || 1) : 0).toFixed(1)} kg
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm text-gray-600">Percentage of Total</span>
                                      <span className="font-medium">
                                        {((variety.total_weight || 0) / dailySummaries.reduce((sum, s) => sum + (s.total_weight || 0), 0) * 100).toFixed(1)}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
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