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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  HardHat, Scale, Package, Truck, ChevronDown, CheckCircle, AlertCircle, 
  RefreshCw, Calculator, Box, History, Search, Calendar, Filter, X, 
  BarChart3, Users, PackageOpen, TrendingUp, XCircle, AlertTriangle, Check,
  Download, FileSpreadsheet
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CountingFormData, CountingRecord } from '@/types/counting';
import { format } from 'date-fns';

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
  fuerte_class1: number;
  fuerte_class2: number;
  fuerte_overall: number;
  hass_class1: number;
  hass_class2: number;
  hass_overall: number;
}

interface CountingStats {
  total_processed: number;
  pending_rejections: number;
  total_suppliers: number;
  fuerte_4kg: number;
  fuerte_10kg: number;
  hass_4kg: number;
  hass_10kg: number;
  recent_activity: {
    last_7_days: number;
    last_30_days: number;
  };
}

interface RejectedCrate {
  id: string;
  box_type: string;
  class_type: string;
  quantity: number;
  weight_per_crate: number;
  total_weight: number;
}

interface CountingTotals {
  fuerte_4kg_class1?: number;
  fuerte_4kg_class2?: number;
  fuerte_4kg_total?: number;
  fuerte_10kg_class1?: number;
  fuerte_10kg_class2?: number;
  fuerte_10kg_total?: number;
  hass_4kg_class1?: number;
  hass_4kg_class2?: number;
  hass_4kg_total?: number;
  hass_10kg_class1?: number;
  hass_10kg_class2?: number;
  hass_10kg_total?: number;
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
  crates: RejectedCrate[];
  notes: string;
  counting_data: any;
  counting_totals: CountingTotals | string | null; // Can be object, string, or null
  submitted_at: string;
  processed_by: string;
  original_counting_id: string;
}

interface CSVRow {
  date: string;
  supplier_name: string;
  region: string;
  pallet_id: string;
  driver_name: string;
  vehicle_plate: string;
  intake_weight_kg: number;
  counted_weight_kg: number;
  rejected_weight_kg: number;
  weight_variance_kg: number;
  variance_level: string;
  fuerte_4kg_boxes: number;
  fuerte_10kg_crates: number;
  hass_4kg_boxes: number;
  hass_10kg_crates: number;
  total_boxes: number;
  processed_by: string;
  notes: string;
}

const processingStages = [
  { id: 'intake', name: 'Intake', icon: Truck, description: 'Supplier intake & initial check-in.', tag: 'Pallet ID' },
  { id: 'quality', name: 'Quality Control', icon: Scale, description: 'Quality assessment and packability checks.', tag: 'QC Assessment' },
  { id: 'counting', name: 'Counting', icon: Calculator, description: 'Box counting and size classification.', tag: 'Box Count Form' },
  { id: 'reject', name: 'Variance', icon: XCircle, description: 'Record rejected crates and weight variance.', tag: 'Variance Check' },
  { id: 'history', name: 'History', icon: History, description: 'Completed processing records.', tag: 'Finalized' },
];

// Utility function to safely format numbers
const safeToFixed = (value: any, decimals: number = 1): string => {
  const num = Number(value);
  return isNaN(num) ? '0.'.padEnd(decimals + 2, '0') : num.toFixed(decimals);
};

// Safe array access utility
const safeArray = <T,>(array: T[] | undefined | null): T[] => {
  return Array.isArray(array) ? array : [];
};

// Function to parse counting totals from database
const parseCountingTotals = (countingTotals: any): CountingTotals => {
  if (!countingTotals) return {};
  
  if (typeof countingTotals === 'string') {
    try {
      return JSON.parse(countingTotals);
    } catch (e) {
      console.error('Error parsing counting_totals:', e);
      return {};
    }
  }
  
  if (typeof countingTotals === 'object') {
    return countingTotals;
  }
  
  return {};
};

// Function to get total boxes from counting totals
const getTotalBoxesFromCountingTotals = (countingTotals: CountingTotals | string | null): number => {
  const totals = parseCountingTotals(countingTotals);
  
  const fuerte4kg = totals.fuerte_4kg_total || 0;
  const fuerte10kg = totals.fuerte_10kg_total || 0;
  const hass4kg = totals.hass_4kg_total || 0;
  const hass10kg = totals.hass_10kg_total || 0;
  
  return fuerte4kg + fuerte10kg + hass4kg + hass10kg;
};

// Function to get formatted boxes summary
const getBoxesSummary = (countingTotals: CountingTotals | string | null): { 
  fuerte_4kg: number; 
  fuerte_10kg: number; 
  hass_4kg: number; 
  hass_10kg: number;
  total: number;
} => {
  const totals = parseCountingTotals(countingTotals);
  
  const fuerte_4kg = totals.fuerte_4kg_total || 0;
  const fuerte_10kg = totals.fuerte_10kg_total || 0;
  const hass_4kg = totals.hass_4kg_total || 0;
  const hass_10kg = totals.hass_10kg_total || 0;
  const total = fuerte_4kg + fuerte_10kg + hass_4kg + hass_10kg;
  
  return { fuerte_4kg, fuerte_10kg, hass_4kg, hass_10kg, total };
};

// Function to get supplier info from counting data
const getSupplierInfoFromCountingData = (countingData: any) => {
  if (!countingData) return { driver_name: '', vehicle_plate: '' };
  
  if (typeof countingData === 'string') {
    try {
      const parsed = JSON.parse(countingData);
      return {
        driver_name: parsed.driver_name || '',
        vehicle_plate: parsed.vehicle_plate || ''
      };
    } catch (e) {
      return { driver_name: '', vehicle_plate: '' };
    }
  }
  
  return {
    driver_name: countingData.driver_name || '',
    vehicle_plate: countingData.vehicle_plate || ''
  };
};

export default function WarehousePage() {
  const { toast } = useToast();
  const [supplierIntakeRecords, setSupplierIntakeRecords] = useState<SupplierIntakeRecord[]>([]);
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  const [countingRecords, setCountingRecords] = useState<CountingRecord[]>([]);
  const [rejectionRecords, setRejectionRecords] = useState<RejectionRecord[]>([]);
  const [stats, setStats] = useState<CountingStats>({
    total_processed: 0,
    pending_rejections: 0,
    total_suppliers: 0,
    fuerte_4kg: 0,
    fuerte_10kg: 0,
    hass_4kg: 0,
    hass_10kg: 0,
    recent_activity: {
      last_7_days: 0,
      last_30_days: 0,
    },
  });
  const [isLoading, setIsLoading] = useState({ 
    intake: true, 
    quality: true, 
    rejections: false,
    stats: false
  });
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [expandedIntake, setExpandedIntake] = useState<Set<string>>(new Set());
  const [expandedQuality, setExpandedQuality] = useState<Set<string>>(new Set());
  const [expandedReject, setExpandedReject] = useState<Set<string>>(new Set());
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierIntakeRecord | null>(null);
  const [selectedQC, setSelectedQC] = useState<QualityCheck | null>(null);
  
  const [activeTab, setActiveTab] = useState<string>('quality');
  
  const [countingForm, setCountingForm] = useState<CountingFormData>({
    supplier_id: '',
    supplier_name: '',
    supplier_phone: '',
    region: '',
    fruits: [],
    // Initialize all form fields to 0
    fuerte_4kg_class1_size12: 0,
    fuerte_4kg_class1_size14: 0,
    fuerte_4kg_class1_size16: 0,
    fuerte_4kg_class1_size18: 0,
    fuerte_4kg_class1_size20: 0,
    fuerte_4kg_class1_size22: 0,
    fuerte_4kg_class1_size24: 0,
    fuerte_4kg_class1_size26: 0,
    fuerte_4kg_class2_size12: 0,
    fuerte_4kg_class2_size14: 0,
    fuerte_4kg_class2_size16: 0,
    fuerte_4kg_class2_size18: 0,
    fuerte_4kg_class2_size20: 0,
    fuerte_4kg_class2_size22: 0,
    fuerte_4kg_class2_size24: 0,
    fuerte_4kg_class2_size26: 0,
    fuerte_10kg_class1_size12: 0,
    fuerte_10kg_class1_size14: 0,
    fuerte_10kg_class1_size16: 0,
    fuerte_10kg_class1_size18: 0,
    fuerte_10kg_class1_size20: 0,
    fuerte_10kg_class1_size22: 0,
    fuerte_10kg_class1_size24: 0,
    fuerte_10kg_class1_size26: 0,
    fuerte_10kg_class1_size28: 0,
    fuerte_10kg_class1_size30: 0,
    fuerte_10kg_class1_size32: 0,
    fuerte_10kg_class2_size12: 0,
    fuerte_10kg_class2_size14: 0,
    fuerte_10kg_class2_size16: 0,
    fuerte_10kg_class2_size18: 0,
    fuerte_10kg_class2_size20: 0,
    fuerte_10kg_class2_size22: 0,
    fuerte_10kg_class2_size24: 0,
    fuerte_10kg_class2_size26: 0,
    fuerte_10kg_class2_size28: 0,
    fuerte_10kg_class2_size30: 0,
    fuerte_10kg_class2_size32: 0,
    hass_4kg_class1_size12: 0,
    hass_4kg_class1_size14: 0,
    hass_4kg_class1_size16: 0,
    hass_4kg_class1_size18: 0,
    hass_4kg_class1_size20: 0,
    hass_4kg_class1_size22: 0,
    hass_4kg_class1_size24: 0,
    hass_4kg_class1_size26: 0,
    hass_4kg_class2_size12: 0,
    hass_4kg_class2_size14: 0,
    hass_4kg_class2_size16: 0,
    hass_4kg_class2_size18: 0,
    hass_4kg_class2_size20: 0,
    hass_4kg_class2_size22: 0,
    hass_4kg_class2_size24: 0,
    hass_4kg_class2_size26: 0,
    hass_10kg_class1_size12: 0,
    hass_10kg_class1_size14: 0,
    hass_10kg_class1_size16: 0,
    hass_10kg_class1_size18: 0,
    hass_10kg_class1_size20: 0,
    hass_10kg_class1_size22: 0,
    hass_10kg_class1_size24: 0,
    hass_10kg_class1_size26: 0,
    hass_10kg_class1_size28: 0,
    hass_10kg_class1_size30: 0,
    hass_10kg_class1_size32: 0,
    hass_10kg_class2_size12: 0,
    hass_10kg_class2_size14: 0,
    hass_10kg_class2_size16: 0,
    hass_10kg_class2_size18: 0,
    hass_10kg_class2_size20: 0,
    hass_10kg_class2_size22: 0,
    hass_10kg_class2_size24: 0,
    hass_10kg_class2_size26: 0,
    hass_10kg_class2_size28: 0,
    hass_10kg_class2_size30: 0,
    hass_10kg_class2_size32: 0,
    notes: '',
  });

  const [rejectionForm, setRejectionForm] = useState<{
    countingRecord: CountingRecord | null;
    crates: RejectedCrate[];
    notes: string;
  }>({
    countingRecord: null,
    crates: [],
    notes: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Fetch intake records
  const fetchIntakeRecords = async () => {
    try {
      setIsLoading(prev => ({ ...prev, intake: true }));
      const response = await fetch('/api/weights?limit=100&order=desc');
      if (!response.ok) throw new Error('Failed to fetch intake records');
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
    } catch (err: any) {
      console.error('Error fetching intake records:', err);
      setError(`Failed to load intake records: ${err.message}`);
    } finally {
      setIsLoading(prev => ({ ...prev, intake: false }));
    }
  };

  // Fetch quality checks
  const fetchQualityChecks = async () => {
    try {
      setIsLoading(prev => ({ ...prev, quality: true }));
      const response = await fetch('/api/quality-control');
      if (!response.ok) throw new Error('Failed to fetch quality checks');
      const qualityChecksData = await response.json();
      
      const transformedChecks: QualityCheck[] = qualityChecksData.map((qc: any) => ({
        id: qc.id,
        weight_entry_id: qc.weight_entry_id,
        pallet_id: qc.pallet_id || `WE-${qc.weight_entry_id}`,
        supplier_name: qc.supplier_name || 'Unknown Supplier',
        overall_status: qc.overall_status,
        processed_at: qc.processed_at || new Date().toISOString(),
        fuerte_class1: qc.fuerte_class1 || 0,
        fuerte_class2: qc.fuerte_class2 || 0,
        fuerte_overall: qc.fuerte_overall || 0,
        hass_class1: qc.hass_class1 || 0,
        hass_class2: qc.hass_class2 || 0,
        hass_overall: qc.hass_overall || 0
      }));
      
      setQualityChecks(transformedChecks);
    } catch (err: any) {
      console.error('Error fetching quality checks:', err);
      setError(`Failed to load quality checks: ${err.message}`);
    } finally {
      setIsLoading(prev => ({ ...prev, quality: false }));
    }
  };

  // Fetch counting records (pending rejection)
  const fetchCountingRecords = async () => {
    try {
      const response = await fetch('/api/counting');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCountingRecords(result.data || []);
        }
      }
    } catch (err: any) {
      console.error('Error fetching counting records:', err);
    }
  };

  // Fetch rejection records (history) - Updated to properly parse counting_totals
  const fetchRejectionRecords = async () => {
    try {
      setIsLoading(prev => ({ ...prev, rejections: true }));
      const response = await fetch('/api/counting?action=history');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Process each record to ensure counting_totals is properly parsed
          const processedRecords = (result.data || []).map((record: any) => {
            // Parse counting_totals if it's a string
            let counting_totals = record.counting_totals;
            if (typeof counting_totals === 'string') {
              try {
                counting_totals = JSON.parse(counting_totals);
              } catch (e) {
                console.error('Error parsing counting_totals for record', record.id, e);
                counting_totals = {};
              }
            }
            
            // Parse counting_data if it's a string
            let counting_data = record.counting_data;
            if (typeof counting_data === 'string') {
              try {
                counting_data = JSON.parse(counting_data);
              } catch (e) {
                console.error('Error parsing counting_data for record', record.id, e);
                counting_data = {};
              }
            }
            
            // Parse crates if it's a string
            let crates = record.crates;
            if (typeof crates === 'string') {
              try {
                crates = JSON.parse(crates);
              } catch (e) {
                console.error('Error parsing crates for record', record.id, e);
                crates = [];
              }
            }
            
            return {
              ...record,
              counting_totals,
              counting_data,
              crates: safeArray(crates)
            };
          });
          
          setRejectionRecords(processedRecords);
        }
      }
    } catch (err: any) {
      console.error('Error fetching rejection records:', err);
    } finally {
      setIsLoading(prev => ({ ...prev, rejections: false }));
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      setIsLoading(prev => ({ ...prev, stats: true }));
      const response = await fetch('/api/counting?action=stats');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStats(result.data);
        }
      }
    } catch (err: any) {
      console.error('Error fetching stats:', err);
    } finally {
      setIsLoading(prev => ({ ...prev, stats: false }));
    }
  };

  const fetchAllData = async () => {
    setError(null);
    await Promise.all([
      fetchIntakeRecords(),
      fetchQualityChecks(),
      fetchCountingRecords(),
      fetchRejectionRecords(),
      fetchStats()
    ]);
    setLastRefreshed(new Date());
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const toggleIntakeExpansion = (supplierName: string) => {
    const newExpanded = new Set(expandedIntake);
    if (newExpanded.has(supplierName)) {
      newExpanded.delete(supplierName);
    } else {
      newExpanded.add(supplierName);
    }
    setExpandedIntake(newExpanded);
  };

  const toggleQualityExpansion = (supplierName: string) => {
    const newExpanded = new Set(expandedQuality);
    if (newExpanded.has(supplierName)) {
      newExpanded.delete(supplierName);
    } else {
      newExpanded.add(supplierName);
    }
    setExpandedQuality(newExpanded);
  };

  const toggleRejectExpansion = (recordId: string) => {
    const newExpanded = new Set(expandedReject);
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId);
    } else {
      newExpanded.add(recordId);
    }
    setExpandedReject(newExpanded);
  };

  const toggleHistoryExpansion = (recordId: string) => {
    const newExpanded = new Set(expandedHistory);
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId);
    } else {
      newExpanded.add(recordId);
    }
    setExpandedHistory(newExpanded);
  };

  // Get accepted suppliers (intake complete + QC approved) that are NOT in ANY subsequent stage
  const acceptedSuppliers = supplierIntakeRecords.filter(intake => {
    const qc = qualityChecks.find(q => q.weight_entry_id === intake.id);
    
    // Check if supplier exists in ANY stage after QC
    const inCounting = countingRecords.some(record => record.supplier_id === intake.id);
    const inRejection = rejectionRecords.some(record => record.supplier_id === intake.id);
    
    // Only show if: has QC approval AND NOT in any subsequent stage
    return qc && 
           qc.overall_status === 'approved' && 
           !inCounting && 
           !inRejection;
  });

  const handleSelectSupplier = (supplier: SupplierIntakeRecord, qc: QualityCheck | null) => {
    setSelectedSupplier(supplier);
    setSelectedQC(qc);
    
    // Pre-fill the counting form
    setCountingForm(prev => ({
      ...prev,
      supplier_id: supplier.id,
      supplier_name: supplier.supplier_name,
      region: supplier.region,
      fruits: safeArray(supplier.fruit_varieties).map(fv => ({
        name: fv.name,
        weight: fv.weight
      }))
    }));
    
    // Immediately remove from expanded quality list
    if (expandedQuality.has(supplier.supplier_name)) {
      const newExpanded = new Set(expandedQuality);
      newExpanded.delete(supplier.supplier_name);
      setExpandedQuality(newExpanded);
    }
    
    // Switch to counting tab automatically
    setActiveTab('counting');
    
    toast({
      title: "Supplier Selected",
      description: `${supplier.supplier_name} loaded for counting`,
    });
  };

  const handleInputChange = (field: keyof CountingFormData, value: string | number) => {
    setCountingForm(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? value : Number(value)
    }));
  };

  const calculateSubtotal = (prefix: string, classType: 'class1' | 'class2', boxType: '4kg' | '10kg'): number => {
    const sizes = boxType === '4kg' 
      ? ['size12', 'size14', 'size16', 'size18', 'size20', 'size22', 'size24', 'size26']
      : ['size12', 'size14', 'size16', 'size18', 'size20', 'size22', 'size24', 'size26', 'size28', 'size30', 'size32'];
    
    return sizes.reduce((total, size) => {
      const fieldName = `${prefix}_${boxType}_${classType}_${size}` as keyof CountingFormData;
      return total + (Number(countingForm[fieldName]) || 0);
    }, 0);
  };

  const calculateTotalBoxes = (prefix: string, boxType: '4kg' | '10kg'): number => {
    const class1 = calculateSubtotal(prefix, 'class1', boxType);
    const class2 = calculateSubtotal(prefix, 'class2', boxType);
    return class1 + class2;
  };

  const handleSubmitCountingForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSupplier) {
      toast({
        title: "No Supplier Selected",
        description: "Please select a supplier first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Calculate totals
      const totals = {
        fuerte_4kg_class1: calculateSubtotal('fuerte', 'class1', '4kg'),
        fuerte_4kg_class2: calculateSubtotal('fuerte', 'class2', '4kg'),
        fuerte_4kg_total: calculateTotalBoxes('fuerte', '4kg'),
        
        fuerte_10kg_class1: calculateSubtotal('fuerte', 'class1', '10kg'),
        fuerte_10kg_class2: calculateSubtotal('fuerte', 'class2', '10kg'),
        fuerte_10kg_total: calculateTotalBoxes('fuerte', '10kg'),
        
        hass_4kg_class1: calculateSubtotal('hass', 'class1', '4kg'),
        hass_4kg_class2: calculateSubtotal('hass', 'class2', '4kg'),
        hass_4kg_total: calculateTotalBoxes('hass', '4kg'),
        
        hass_10kg_class1: calculateSubtotal('hass', 'class1', '10kg'),
        hass_10kg_class2: calculateSubtotal('hass', 'class2', '10kg'),
        hass_10kg_total: calculateTotalBoxes('hass', '10kg'),
      };

      // Calculate total counted weight
      const calculateTotalWeight = () => {
        const fuerte4kgWeight = totals.fuerte_4kg_total * 4;
        const fuerte10kgWeight = totals.fuerte_10kg_total * 10;
        const hass4kgWeight = totals.hass_4kg_total * 4;
        const hass10kgWeight = totals.hass_10kg_total * 10;
        return fuerte4kgWeight + fuerte10kgWeight + hass4kgWeight + hass10kgWeight;
      };

      // Prepare counting data - ADD STATUS FOR COLD ROOM
      const countingData = {
        supplier_id: selectedSupplier.id,
        supplier_name: selectedSupplier.supplier_name,
        supplier_phone: countingForm.supplier_phone,
        region: selectedSupplier.region,
        pallet_id: selectedSupplier.pallet_id,
        total_weight: selectedSupplier.total_weight,
        counting_data: { ...countingForm },
        submitted_at: new Date().toISOString(),
        processed_by: "Warehouse Staff",
        totals,
        total_counted_weight: calculateTotalWeight(),
        // CRITICAL: Add these two fields
        status: 'pending_coldroom', // This tells the Cold Room page to fetch this
        for_coldroom: true, // Explicit flag for cold room
      };

      console.log('📦 Submitting counting data for cold room:', countingData);

      // Submit to API
      const response = await fetch('/api/counting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(countingData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to save counting data');
      }

      // Store the counting data ID for cold room reference
      const countingRecordId = result.data.id;
      
      // Also store in localStorage for immediate access
      localStorage.setItem('recentCountingData', JSON.stringify({
        id: countingRecordId,
        supplier_name: selectedSupplier.supplier_name,
        totals,
        counting_data: countingForm,
        timestamp: new Date().toISOString()
      }));
      
      // Set flag to refresh cold room
      localStorage.setItem('refreshColdRoom', 'true');
      console.log('✅ Set refreshColdRoom flag for cold room');

      // Update local state
      setCountingRecords(prev => [result.data, ...prev]);
      
      // Clear selected supplier
      setSelectedSupplier(null);
      setSelectedQC(null);
      
      // Reset form
      setCountingForm({
        supplier_id: '',
        supplier_name: '',
        supplier_phone: '',
        region: '',
        fruits: [],
        fuerte_4kg_class1_size12: 0,
        fuerte_4kg_class1_size14: 0,
        fuerte_4kg_class1_size16: 0,
        fuerte_4kg_class1_size18: 0,
        fuerte_4kg_class1_size20: 0,
        fuerte_4kg_class1_size22: 0,
        fuerte_4kg_class1_size24: 0,
        fuerte_4kg_class1_size26: 0,
        fuerte_4kg_class2_size12: 0,
        fuerte_4kg_class2_size14: 0,
        fuerte_4kg_class2_size16: 0,
        fuerte_4kg_class2_size18: 0,
        fuerte_4kg_class2_size20: 0,
        fuerte_4kg_class2_size22: 0,
        fuerte_4kg_class2_size24: 0,
        fuerte_4kg_class2_size26: 0,
        fuerte_10kg_class1_size12: 0,
        fuerte_10kg_class1_size14: 0,
        fuerte_10kg_class1_size16: 0,
        fuerte_10kg_class1_size18: 0,
        fuerte_10kg_class1_size20: 0,
        fuerte_10kg_class1_size22: 0,
        fuerte_10kg_class1_size24: 0,
        fuerte_10kg_class1_size26: 0,
        fuerte_10kg_class1_size28: 0,
        fuerte_10kg_class1_size30: 0,
        fuerte_10kg_class1_size32: 0,
        fuerte_10kg_class2_size12: 0,
        fuerte_10kg_class2_size14: 0,
        fuerte_10kg_class2_size16: 0,
        fuerte_10kg_class2_size18: 0,
        fuerte_10kg_class2_size20: 0,
        fuerte_10kg_class2_size22: 0,
        fuerte_10kg_class2_size24: 0,
        fuerte_10kg_class2_size26: 0,
        fuerte_10kg_class2_size28: 0,
        fuerte_10kg_class2_size30: 0,
        fuerte_10kg_class2_size32: 0,
        hass_4kg_class1_size12: 0,
        hass_4kg_class1_size14: 0,
        hass_4kg_class1_size16: 0,
        hass_4kg_class1_size18: 0,
        hass_4kg_class1_size20: 0,
        hass_4kg_class1_size22: 0,
        hass_4kg_class1_size24: 0,
        hass_4kg_class1_size26: 0,
        hass_4kg_class2_size12: 0,
        hass_4kg_class2_size14: 0,
        hass_4kg_class2_size16: 0,
        hass_4kg_class2_size18: 0,
        hass_4kg_class2_size20: 0,
        hass_4kg_class2_size22: 0,
        hass_4kg_class2_size24: 0,
        hass_4kg_class2_size26: 0,
        hass_10kg_class1_size12: 0,
        hass_10kg_class1_size14: 0,
        hass_10kg_class1_size16: 0,
        hass_10kg_class1_size18: 0,
        hass_10kg_class1_size20: 0,
        hass_10kg_class1_size22: 0,
        hass_10kg_class1_size24: 0,
        hass_10kg_class1_size26: 0,
        hass_10kg_class1_size28: 0,
        hass_10kg_class1_size30: 0,
        hass_10kg_class1_size32: 0,
        hass_10kg_class2_size12: 0,
        hass_10kg_class2_size14: 0,
        hass_10kg_class2_size16: 0,
        hass_10kg_class2_size18: 0,
        hass_10kg_class2_size20: 0,
        hass_10kg_class2_size22: 0,
        hass_10kg_class2_size24: 0,
        hass_10kg_class2_size26: 0,
        hass_10kg_class2_size28: 0,
        hass_10kg_class2_size30: 0,
        hass_10kg_class2_size32: 0,
        notes: '',
      });
      
      // Refresh stats
      fetchStats();
      
      // Switch to variance tab
      setActiveTab('reject');
      
      // Show success message with options
      toast({
        title: "✅ Counting Data Saved Successfully!",
        description: (
          <div className="space-y-3">
            <p>{selectedSupplier.supplier_name} has been counted and is ready for cold room.</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                onClick={() => {
                  window.open('/cold-room', '_blank');
                  // Force refresh cold room data
                  localStorage.setItem('forceColdRoomRefresh', 'true');
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                📦 Go to Cold Room
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  // Copy data to clipboard for debugging
                  navigator.clipboard.writeText(JSON.stringify({
                    id: countingRecordId,
                    supplier: selectedSupplier.supplier_name,
                    totals
                  }, null, 2));
                  toast({
                    title: "Copied!",
                    description: "Counting data copied to clipboard",
                  });
                }}
                className="bg-gray-600 hover:bg-gray-700"
              >
                📋 Copy Data
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Data ID: {countingRecordId?.substring(0, 8)}...
            </p>
          </div>
        ),
        duration: 10000, // Show for 10 seconds
      });
      
    } catch (err: any) {
      console.error('Error saving counting data:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to save counting data",
        variant: "destructive",
      });
    }
  };

  const handleAddRejectedCrate = () => {
    setRejectionForm(prev => ({
      ...prev,
      crates: [
        ...prev.crates,
        {
          id: `crate-${Date.now()}`,
          box_type: 'fuerte_4kg',
          class_type: 'class1',
          quantity: 0,
          weight_per_crate: 4,
          total_weight: 0
        }
      ]
    }));
  };

  const handleUpdateRejectedCrate = (index: number, field: keyof RejectedCrate, value: any) => {
    setRejectionForm(prev => {
      const updatedCrates = [...prev.crates];
      updatedCrates[index] = {
        ...updatedCrates[index],
        [field]: value
      };
      
      // Recalculate total weight if quantity or weight_per_crate changes
      if (field === 'quantity' || field === 'weight_per_crate') {
        updatedCrates[index].total_weight = 
          Number(updatedCrates[index].quantity) * Number(updatedCrates[index].weight_per_crate);
      }
      
      return {
        ...prev,
        crates: updatedCrates
      };
    });
  };

  const handleRemoveRejectedCrate = (index: number) => {
    setRejectionForm(prev => ({
      ...prev,
      crates: prev.crates.filter((_, i) => i !== index)
    }));
  };

  const handleSelectForRejection = (record: CountingRecord) => {
    setRejectionForm({
      countingRecord: record,
      crates: [],
      notes: ''
    });
    
    toast({
      title: "Record Selected",
      description: `${record.supplier_name} loaded for variance handling`,
    });
  };

  const handleSubmitRejection = async () => {
    if (!rejectionForm.countingRecord) {
      toast({
        title: "No Record Selected",
        description: "Please select a counting record first",
        variant: "destructive",
      });
      return;
    }

    const record = rejectionForm.countingRecord;
    
    try {
      // Prepare rejection payload
      const rejectionPayload = {
        counting_record_id: record.id,
        rejection_data: {
          crates: rejectionForm.crates,
          notes: rejectionForm.notes,
          processed_by: "Warehouse Staff"
        }
      };

      // Use PUT endpoint to move to rejection/history
      const response = await fetch('/api/counting', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rejectionPayload),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to process variance');
      }

      // Update local state - remove from counting records, add to rejection records
      setCountingRecords(prev => prev.filter(r => r.id !== record.id));
      setRejectionRecords(prev => [result.data, ...prev]);
      
      // Remove from expanded reject list if it was expanded
      if (expandedReject.has(record.id)) {
        const newExpanded = new Set(expandedReject);
        newExpanded.delete(record.id);
        setExpandedReject(newExpanded);
      }
      
      // Reset rejection form
      setRejectionForm({
        countingRecord: null,
        crates: [],
        notes: ''
      });
      
      // Refresh stats
      fetchStats();
      
      // Switch to history tab
      setActiveTab('history');
      
      toast({
        title: "Variance Processed",
        description: `${record.supplier_name} has been moved to history`,
        variant: "default",
      });

    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to process variance",
        variant: "destructive",
      });
    }
  };

  // Filter history records
  const filteredHistory = rejectionRecords.filter(record => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      record.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.pallet_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.region.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Date filter
    const recordDate = new Date(record.submitted_at);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    let matchesDate = true;
    if (start) {
      start.setHours(0, 0, 0, 0);
      matchesDate = matchesDate && recordDate >= start;
    }
    if (end) {
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && recordDate <= end;
    }
    
    return matchesSearch && matchesDate;
  });

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Clear date filter
  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  // Clear search filter
  const clearSearchFilter = () => {
    setSearchTerm('');
  };

  // Function to generate CSV data from rejection records
  const generateCSVData = (records: RejectionRecord[]): CSVRow[] => {
    return records.map(record => {
      const boxesSummary = getBoxesSummary(record.counting_totals);
      const supplierInfo = getSupplierInfoFromCountingData(record.counting_data);
      
      return {
        date: format(new Date(record.submitted_at), 'yyyy-MM-dd HH:mm:ss'),
        supplier_name: record.supplier_name,
        region: record.region,
        pallet_id: record.pallet_id,
        driver_name: supplierInfo.driver_name,
        vehicle_plate: supplierInfo.vehicle_plate,
        intake_weight_kg: record.total_intake_weight,
        counted_weight_kg: record.total_counted_weight,
        rejected_weight_kg: record.total_rejected_weight,
        weight_variance_kg: record.weight_variance,
        variance_level: record.variance_level.toUpperCase(),
        fuerte_4kg_boxes: boxesSummary.fuerte_4kg,
        fuerte_10kg_crates: boxesSummary.fuerte_10kg,
        hass_4kg_boxes: boxesSummary.hass_4kg,
        hass_10kg_crates: boxesSummary.hass_10kg,
        total_boxes: boxesSummary.total,
        processed_by: record.processed_by,
        notes: record.notes || ''
      };
    });
  };

  // Function to download CSV
  const downloadCSV = (records: RejectionRecord[]) => {
    if (records.length === 0) {
      toast({
        title: 'No Data',
        description: 'No records available to download',
        variant: 'destructive',
      });
      return;
    }
    
    const csvData = generateCSVData(records);
    
    // Create CSV headers
    const headers = [
      'Date',
      'Supplier Name',
      'Region',
      'Pallet ID',
      'Driver Name',
      'Vehicle Plate',
      'Intake Weight (kg)',
      'Counted Weight (kg)',
      'Rejected Weight (kg)',
      'Weight Variance (kg)',
      'Variance Level',
      'Fuerte 4kg Boxes',
      'Fuerte 10kg Crates',
      'Hass 4kg Boxes',
      'Hass 10kg Crates',
      'Total Boxes',
      'Processed By',
      'Notes'
    ];
    
    // Create CSV rows
    const rows = csvData.map(row => [
      row.date,
      `"${row.supplier_name}"`,
      `"${row.region}"`,
      row.pallet_id,
      `"${row.driver_name}"`,
      `"${row.vehicle_plate}"`,
      row.intake_weight_kg.toFixed(2),
      row.counted_weight_kg.toFixed(2),
      row.rejected_weight_kg.toFixed(2),
      row.weight_variance_kg.toFixed(2),
      row.variance_level,
      row.fuerte_4kg_boxes,
      row.fuerte_10kg_crates,
      row.hass_4kg_boxes,
      row.hass_10kg_crates,
      row.total_boxes,
      `"${row.processed_by}"`,
      `"${row.notes.replace(/"/g, '""')}"` // Escape quotes in notes
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
    link.setAttribute('download', `warehouse_history_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'CSV Downloaded',
      description: `${records.length} records exported successfully`,
    });
  };

  // Download all history
  const downloadAllHistory = () => {
    downloadCSV(rejectionRecords);
  };

  // Download filtered history
  const downloadFilteredHistory = () => {
    downloadCSV(filteredHistory);
  };

  // Render size input grid
  const renderSizeGrid = (prefix: string, boxType: '4kg' | '10kg', classType: 'class1' | 'class2') => {
    const sizes = boxType === '4kg' 
      ? ['12', '14', '16', '18', '20', '22', '24', '26']
      : ['12', '14', '16', '18', '20', '22', '24', '26', '28', '30', '32'];
    
    return (
      <div className="grid grid-cols-6 gap-2 mb-4">
        {sizes.map(size => {
          const fieldName = `${prefix}_${boxType}_${classType}_size${size}` as keyof CountingFormData;
          return (
            <div key={size} className="space-y-1">
              <Label htmlFor={fieldName} className="text-xs text-center block">Size {size}</Label>
              <Input
                id={fieldName}
                type="number"
                min="0"
                value={countingForm[fieldName]}
                onChange={(e) => handleInputChange(fieldName, e.target.value)}
                className="h-8 text-center"
                placeholder="0"
              />
            </div>
          );
        })}
      </div>
    );
  };

  // Render variance level badge
  const renderVarianceBadge = (varianceLevel: 'low' | 'medium' | 'high') => {
    const config = {
      low: { color: 'bg-green-50 text-green-700 border-green-200', label: 'Low Variance' },
      medium: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Medium Variance' },
      high: { color: 'bg-red-50 text-red-700 border-red-200', label: 'High Variance' }
    };
    
    return (
      <Badge variant="outline" className={config[varianceLevel].color}>
        {config[varianceLevel].label}
      </Badge>
    );
  };

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
        <main className="p-4 md:p-6 lg:p-8 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-md flex items-start justify-between">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Error loading data</p>
                  <p className="text-sm mt-1">{error}</p>
                  <button 
                    onClick={fetchAllData}
                    className="text-sm underline mt-2"
                  >
                    Try again
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-sm hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <HardHat />
                Warehouse Processing Dashboard
              </h2>
              <p className="text-muted-foreground">
                Supplier intake, quality control, and box counting
              </p>
            </div>
            <div className="flex items-center gap-3">
              {lastRefreshed && (
                <div className="text-sm text-muted-foreground">
                  Updated: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              <button
                onClick={fetchAllData}
                disabled={isLoading.intake || isLoading.quality || isLoading.rejections}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-primary/10 hover:bg-primary/20 rounded-md transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading.intake || isLoading.quality || isLoading.rejections ? 'animate-spin' : ''}`} />
                {isLoading.intake || isLoading.quality || isLoading.rejections ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Statistics Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Processing Statistics
              </CardTitle>
              <CardDescription>
                Real-time overview of warehouse processing activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Processed */}
                <div className="bg-black-50 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-500">Total Processed</div>
                    <PackageOpen className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold text-blue-700">
                    {stats.total_processed || 0}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Completed processing sessions</div>
                </div>

                {/* Pending Variance */}
                <div className="bg-black-50 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-500">Pending Variance</div>
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="text-2xl font-bold text-orange-700">
                    {stats.pending_rejections || 0}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Need variance handling</div>
                </div>

                {/* Fuerte Boxes */}
                <div className="bg-black-50 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-500">Fuerte Boxes</div>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">4kg:</span>
                      <span className="font-semibold text-green-700">
                        {stats.fuerte_4kg || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">10kg:</span>
                      <span className="font-semibold text-green-700">
                        {stats.fuerte_10kg || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t">
                      <span className="text-sm font-medium">Total:</span>
                      <span className="font-bold text-green-700">
                        {(stats.fuerte_4kg || 0) + (stats.fuerte_10kg || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hass Boxes */}
                <div className="bg-black-50 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-500">Hass Boxes</div>
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">4kg:</span>
                      <span className="font-semibold text-purple-700">
                        {stats.hass_4kg || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">10kg:</span>
                      <span className="font-semibold text-purple-700">
                        {stats.hass_10kg || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t">
                      <span className="text-sm font-medium">Total:</span>
                      <span className="font-bold text-purple-700">
                        {(stats.hass_4kg || 0) + (stats.hass_10kg || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Summary Row */}
              <div className="mt-6 pt-6 border-t">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Total Boxes</div>
                    <div className="text-xl font-bold">
                      {(stats.fuerte_4kg || 0) + (stats.fuerte_10kg || 0) + (stats.hass_4kg || 0) + (stats.hass_10kg || 0)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Fuerte Percentage</div>
                    <div className="text-xl font-bold">
                      {(() => {
                        const totalBoxes = (stats.fuerte_4kg || 0) + (stats.fuerte_10kg || 0) + (stats.hass_4kg || 0) + (stats.hass_10kg || 0);
                        const fuerteTotal = (stats.fuerte_4kg || 0) + (stats.fuerte_10kg || 0);
                        return totalBoxes > 0 ? `${Math.round((fuerteTotal / totalBoxes) * 100)}%` : '0%';
                      })()}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Hass Percentage</div>
                    <div className="text-xl font-bold">
                      {(() => {
                        const totalBoxes = (stats.fuerte_4kg || 0) + (stats.fuerte_10kg || 0) + (stats.hass_4kg || 0) + (stats.hass_10kg || 0);
                        const hassTotal = (stats.hass_4kg || 0) + (stats.hass_10kg || 0);
                        return totalBoxes > 0 ? `${Math.round((hassTotal / totalBoxes) * 100)}%` : '0%';
                      })()}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Recent Activity</div>
                    <div className="text-xl font-bold">{stats.recent_activity?.last_7_days || 0} (7 days)</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Processing Stages */}
          <Card>
            <CardHeader>
              <CardTitle>Processing Stages</CardTitle>
              <CardDescription>Supplier processing workflow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 text-center">
                {processingStages.map((stage, index) => (
                  <div key={stage.id} className="flex-1 flex flex-col items-center p-4">
                    <div className="bg-primary/10 p-3 rounded-full mb-2">
                      <stage.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-semibold">{stage.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{stage.description}</p>
                    <p className="text-xs font-mono bg-muted px-2 py-1 rounded-md mt-2">{stage.tag}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5">
              <TabsTrigger value="intake">Intake</TabsTrigger>
              <TabsTrigger value="quality">Quality Control</TabsTrigger>
              <TabsTrigger value="counting">Counting</TabsTrigger>
              <TabsTrigger value="reject">Variance</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* Intake Tab */}
            <TabsContent value="intake" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Completed Intake Records
                  </CardTitle>
                  <CardDescription>
                    {supplierIntakeRecords.length} supplier(s) with completed intake
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    {isLoading.intake ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                        <p className="text-muted-foreground">Loading intake records...</p>
                      </div>
                    ) : supplierIntakeRecords.length === 0 ? (
                      <div className="text-center py-8">
                        <Truck className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No intake records found</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Supplier intake records will appear here after weighing
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {supplierIntakeRecords.map((supplier) => (
                          <Collapsible
                            key={supplier.id}
                            open={expandedIntake.has(supplier.supplier_name)}
                            onOpenChange={() => toggleIntakeExpansion(supplier.supplier_name)}
                            className="border rounded-lg overflow-hidden"
                          >
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center justify-between p-4 bg-black-50 hover:bg-black-100 cursor-pointer">
                                <div className="flex items-center gap-3">
                                  <div className={`transition-transform ${expandedIntake.has(supplier.supplier_name) ? 'rotate-180' : ''}`}>
                                    <ChevronDown className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="font-semibold">{supplier.supplier_name}</div>
                                    <div className="text-sm text-gray-500 flex items-center gap-4">
                                      <span>Pallet: {supplier.pallet_id}</span>
                                      <span>Weight: {supplier.total_weight} kg</span>
                                      <span>{formatDate(supplier.timestamp)}</span>
                                    </div>
                                  </div>
                                </div>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Intake Complete
                                </Badge>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="p-4 bg-black border-t">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <div className="text-gray-500">Driver</div>
                                  <div className="font-medium">{supplier.driver_name}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Vehicle Plate</div>
                                  <div className="font-medium">{supplier.vehicle_plate}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Region</div>
                                  <div className="font-medium">{supplier.region}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Total Weight</div>
                                  <div className="font-bold">{supplier.total_weight} kg</div>
                                </div>
                              </div>
                              {safeArray(supplier.fruit_varieties).length > 0 && (
                                <div className="mt-3">
                                  <div className="text-gray-500 mb-1">Fruit Varieties</div>
                                  <div className="flex flex-wrap gap-2">
                                    {safeArray(supplier.fruit_varieties).map((fruit, idx) => (
                                      <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                        {fruit.name}: {fruit.weight}kg ({fruit.crates} crates)
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Quality Control Tab */}
            <TabsContent value="quality" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="w-5 h-5" />
                    Accepted Suppliers (QC Approved)
                  </CardTitle>
                  <CardDescription>
                    {acceptedSuppliers.length} supplier(s) approved for counting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    {isLoading.quality ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                        <p className="text-muted-foreground">Loading quality checks...</p>
                      </div>
                    ) : acceptedSuppliers.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No accepted suppliers pending counting</p>
                        <p className="text-sm text-gray-400 mt-1">
                          All QC-approved suppliers have been counted. Check the Variance tab.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {acceptedSuppliers.map((supplier) => {
                          const qc = qualityChecks.find(q => q.weight_entry_id === supplier.id);
                          return (
                            <Collapsible
                              key={supplier.id}
                              open={expandedQuality.has(supplier.supplier_name)}
                              onOpenChange={() => toggleQualityExpansion(supplier.supplier_name)}
                              className="border rounded-lg overflow-hidden"
                            >
                              <CollapsibleTrigger asChild>
                                <div className="flex items-center justify-between p-4 bg-black-50 hover:bg-black-100 cursor-pointer">
                                  <div className="flex items-center gap-3">
                                    <div className={`transition-transform ${expandedQuality.has(supplier.supplier_name) ? 'rotate-180' : ''}`}>
                                      <ChevronDown className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <div className="font-semibold">{supplier.supplier_name}</div>
                                      <div className="text-sm text-gray-500 flex items-center gap-4">
                                        <span>Pallet: {supplier.pallet_id}</span>
                                        <span>QC Date: {qc ? formatDate(qc.processed_at) : 'N/A'}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectSupplier(supplier, qc || null);
                                      }}
                                      className="bg-blue-600 hover:bg-blue-700"
                                    >
                                      Select for Counting
                                    </Button>
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                      QC Approved
                                    </Badge>
                                  </div>
                                </div>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="p-4 bg-black border-t">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <div className="text-gray-500">Total Weight</div>
                                    <div className="font-bold">{supplier.total_weight} kg</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500">Region</div>
                                    <div className="font-medium">{supplier.region}</div>
                                  </div>
                                </div>
                                {qc && (qc.fuerte_overall > 0 || qc.hass_overall > 0) && (
                                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {qc.fuerte_overall > 0 && (
                                      <div className="bg-gray-50 p-3 rounded border">
                                        <div className="font-medium">Avocado Fuerte</div>
                                        <div className="grid grid-cols-3 gap-1 mt-1 text-xs">
                                          <div>
                                            <div className="text-gray-500">Class 1</div>
                                            <div className="font-semibold">{qc.fuerte_class1}%</div>
                                          </div>
                                          <div>
                                            <div className="text-gray-500">Class 2</div>
                                            <div className="font-semibold">{qc.fuerte_class2}%</div>
                                          </div>
                                          <div>
                                            <div className="text-gray-500">Overall</div>
                                            <div className="font-bold text-green-600">{qc.fuerte_overall}%</div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    {qc.hass_overall > 0 && (
                                      <div className="bg-gray-50 p-3 rounded border">
                                        <div className="font-medium">Avocado Hass</div>
                                        <div className="grid grid-cols-3 gap-1 mt-1 text-xs">
                                          <div>
                                            <div className="text-gray-500">Class 1</div>
                                            <div className="font-semibold">{qc.hass_class1}%</div>
                                          </div>
                                          <div>
                                            <div className="text-gray-500">Class 2</div>
                                            <div className="font-semibold">{qc.hass_class2}%</div>
                                          </div>
                                          <div>
                                            <div className="text-gray-500">Overall</div>
                                            <div className="font-bold text-green-600">{qc.hass_overall}%</div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {safeArray(supplier.fruit_varieties).length > 0 && (
                                  <div className="mt-3">
                                    <div className="text-gray-500 mb-1">Fruit Varieties</div>
                                    <div className="flex flex-wrap gap-2">
                                      {safeArray(supplier.fruit_varieties).map((fruit, idx) => (
                                        <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                          {fruit.name}: {fruit.weight}kg
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Counting Tab */}
            <TabsContent value="counting" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Selected Supplier Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Selected Supplier Information
                    </CardTitle>
                    <CardDescription>
                      {selectedSupplier ? `${selectedSupplier.supplier_name} - Ready for counting` : 'No supplier selected'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedSupplier ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-500">Supplier Name</div>
                            <div className="font-semibold">{selectedSupplier.supplier_name}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Region</div>
                            <div className="font-medium">{selectedSupplier.region}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Pallet ID</div>
                            <div className="font-mono">{selectedSupplier.pallet_id}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Total Weight</div>
                            <div className="font-bold">{selectedSupplier.total_weight} kg</div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-500 mb-2">Fruit Varieties</div>
                          <div className="flex flex-wrap gap-2">
                            {safeArray(selectedSupplier.fruit_varieties).map((fruit, idx) => (
                              <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {fruit.name}: {fruit.weight}kg
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        {selectedQC && (
                          <div>
                            <div className="text-sm text-gray-500 mb-2">QC Results</div>
                            <div className="flex gap-3">
                              {selectedQC.fuerte_overall > 0 && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Fuerte: {selectedQC.fuerte_overall}%
                                </Badge>
                              )}
                              {selectedQC.hass_overall > 0 && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Hass: {selectedQC.hass_overall}%
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="pt-4 border-t">
                          <Label htmlFor="supplier_phone" className="mb-2">Supplier Phone Number</Label>
                          <Input
                            id="supplier_phone"
                            value={countingForm.supplier_phone}
                            onChange={(e) => handleInputChange('supplier_phone', e.target.value)}
                            placeholder="Enter supplier phone number"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calculator className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No supplier selected</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Select a QC-approved supplier from the Quality Control tab to begin counting
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Counting Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Box className="w-5 h-5" />
                      Box Counting Form
                    </CardTitle>
                    <CardDescription>
                      Enter number of boxes per size and class
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmitCountingForm} className="space-y-6">
                      <ScrollArea className="h-[500px] pr-4">
                        {/* Fuerte 4kg */}
                        <div className="mb-6">
                          <h3 className="font-semibold text-lg mb-4">Fuerte 4kg Boxes</h3>
                          
                          <div className="mb-4">
                            <h4 className="font-medium mb-2">Class 1</h4>
                            {renderSizeGrid('fuerte', '4kg', 'class1')}
                            <div className="text-right">
                              <span className="font-medium"> Fuerte 4kg Class 1 Sub-Total: </span>
                              <span className="font-bold">{calculateSubtotal('fuerte', 'class1', '4kg')} boxes</span>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <h4 className="font-medium mb-2">Class 2</h4>
                            {renderSizeGrid('fuerte', '4kg', 'class2')}
                            <div className="text-right">
                              <span className="font-medium">Fuerte 4kg Class 2 Sub-Total: </span>
                              <span className="font-bold">{calculateSubtotal('fuerte', 'class2', '4kg')} boxes</span>
                            </div>
                          </div>
                          
                          <div className="pt-2 border-t">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold">Fuerte Total 4kg:</span>
                              <span className="font-bold text-lg">{calculateTotalBoxes('fuerte', '4kg')} boxes</span>
                            </div>
                          </div>
                        </div>

                        {/* Fuerte 10kg */}
                        <div className="mb-6">
                          <h3 className="font-semibold text-lg mb-4">Fuerte 10kg Crates</h3>
                          
                          <div className="mb-4">
                            <h4 className="font-medium mb-2">Class 1</h4>
                            {renderSizeGrid('fuerte', '10kg', 'class1')}
                            <div className="text-right">
                              <span className="font-medium">Fuerte 10kg Class 1 Sub-Total: </span>
                              <span className="font-bold">{calculateSubtotal('fuerte', 'class1', '10kg')} crates</span>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <h4 className="font-medium mb-2">Class 2</h4>
                            {renderSizeGrid('fuerte', '10kg', 'class2')}
                            <div className="text-right">
                              <span className="font-medium">Fuerte 10kg Class 2 Sub-Total: </span>
                              <span className="font-bold">{calculateSubtotal('fuerte', 'class2', '10kg')} crates</span>
                            </div>
                          </div>
                          
                          <div className="pt-2 border-t">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold">Fuerte Total 10kg:</span>
                              <span className="font-bold text-lg">{calculateTotalBoxes('fuerte', '10kg')} crates</span>
                            </div>
                          </div>
                        </div>

                        {/* Hass 4kg */}
                        <div className="mb-6">
                          <h3 className="font-semibold text-lg mb-4">Hass 4kg Boxes</h3>
                          
                          <div className="mb-4">
                            <h4 className="font-medium mb-2">Class 1</h4>
                            {renderSizeGrid('hass', '4kg', 'class1')}
                            <div className="text-right">
                              <span className="font-medium">Hass 4kg Class 1 Sub-Total: </span>
                              <span className="font-bold">{calculateSubtotal('hass', 'class1', '4kg')} boxes</span>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <h4 className="font-medium mb-2">Class 2</h4>
                            {renderSizeGrid('hass', '4kg', 'class2')}
                            <div className="text-right">
                              <span className="font-medium">Sub-Total: </span>
                              <span className="font-bold">{calculateSubtotal('hass', 'class2', '4kg')} boxes</span>
                            </div>
                          </div>
                          
                          <div className="pt-2 border-t">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold">Total 4kg Boxes:</span>
                              <span className="font-bold text-lg">{calculateTotalBoxes('hass', '4kg')} boxes</span>
                            </div>
                          </div>
                        </div>

                        {/* Hass 10kg */}
                        <div className="mb-6">
                          <h3 className="font-semibold text-lg mb-4">Hass 10kg Crates</h3>
                          
                          <div className="mb-4">
                            <h4 className="font-medium mb-2">Class 1</h4>
                            {renderSizeGrid('hass', '10kg', 'class1')}
                            <div className="text-right">
                              <span className="font-medium">Sub-Total: </span>
                              <span className="font-bold">{calculateSubtotal('hass', 'class1', '10kg')} crates</span>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <h4 className="font-medium mb-2">Class 2</h4>
                            {renderSizeGrid('hass', '10kg', 'class2')}
                            <div className="text-right">
                              <span className="font-medium">Sub-Total: </span>
                              <span className="font-bold">{calculateSubtotal('hass', 'class2', '10kg')} crates</span>
                            </div>
                          </div>
                          
                          <div className="pt-2 border-t">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold">Total 10kg Crates:</span>
                              <span className="font-bold text-lg">{calculateTotalBoxes('hass', '10kg')} crates</span>
                            </div>
                          </div>
                        </div>

                        {/* Notes */}
                        <div>
                          <Label htmlFor="notes" className="mb-2">Notes</Label>
                          <Input
                            id="notes"
                            value={countingForm.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            placeholder="Additional notes (optional)"
                          />
                        </div>
                      </ScrollArea>

                      <div className="pt-4 border-t">
                        <Button
                          type="submit"
                          disabled={!selectedSupplier}
                          className="w-full bg-green-600 hover:bg-green-700"
                          size="lg"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Save Counting Data
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Variance Tab */}
            <TabsContent value="reject" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending Variance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Pending Variance Handling
                    </CardTitle>
                    <CardDescription>
                      {countingRecords.length} supplier(s) need variance handling
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                      {isLoading.rejections ? (
                        <div className="flex flex-col items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                          <p className="text-muted-foreground">Loading pending variance...</p>
                        </div>
                      ) : countingRecords.length === 0 ? (
                        <div className="text-center py-8">
                          <Check className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                          <p className="text-gray-500 font-medium">No pending variance handling</p>
                          <p className="text-sm text-gray-400 mt-1">
                            All counted suppliers have been processed
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {countingRecords.map((record) => (
                            <Collapsible
                              key={record.id}
                              open={expandedReject.has(record.id)}
                              onOpenChange={() => toggleRejectExpansion(record.id)}
                              className="border rounded-lg overflow-hidden"
                            >
                              <CollapsibleTrigger asChild>
                                <div className="flex items-center justify-between p-4 bg-black-50 hover:bg-black-100 cursor-pointer">
                                  <div className="flex items-center gap-3">
                                    <div className={`transition-transform ${expandedReject.has(record.id) ? 'rotate-180' : ''}`}>
                                      <ChevronDown className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <div className="font-semibold">{record.supplier_name}</div>
                                      <div className="text-sm text-gray-500 flex items-center gap-4">
                                        <span>Pallet: {record.pallet_id}</span>
                                        <span>Intake: {record.total_weight} kg</span>
                                        <span>{formatDate(record.submitted_at)}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectForRejection(record);
                                      }}
                                      className="bg-orange-600 hover:bg-orange-700"
                                    >
                                      Handle Variance
                                    </Button>
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                      Needs Handling
                                    </Badge>
                                  </div>
                                </div>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="p-4 bg-black border-t">
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <div className="text-gray-500">Supplier</div>
                                      <div className="font-semibold">{record.supplier_name}</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-500">Region</div>
                                      <div className="font-medium">{record.region}</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-500">Intake Weight</div>
                                      <div className="font-bold">{record.total_weight} kg</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-500">Counted Weight</div>
                                      <div className="font-bold">
                                        {Number(record.total_counted_weight || 0).toFixed(1)} kg
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-black-50 p-3 rounded border">
                                    <div className="font-medium mb-2">Counted Boxes Summary</div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <span className="text-gray-500">Fuerte 4kg:</span>
                                        <span className="font-semibold ml-2">{record.totals?.fuerte_4kg_total || 0}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Fuerte 10kg:</span>
                                        <span className="font-semibold ml-2">{record.totals?.fuerte_10kg_total || 0}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Hass 4kg:</span>
                                        <span className="font-semibold ml-2">{record.totals?.hass_4kg_total || 0}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Hass 10kg:</span>
                                        <span className="font-semibold ml-2">{record.totals?.hass_10kg_total || 0}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
                {/* Variance Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <XCircle className="w-5 h-5" />
                      Record Rejected Crates
                    </CardTitle>
                    <CardDescription>
                      Add rejected crates and calculate weight variance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {rejectionForm.countingRecord ? (
                      <div className="space-y-4">
                        <div className="bg-black-50 p-4 rounded border">
                          <div className="font-medium">Selected Supplier</div>
                          <div className="text-lg font-semibold mt-1">{rejectionForm.countingRecord.supplier_name}</div>
                          <div className="text-sm text-gray-600">
                            Pallet: {rejectionForm.countingRecord.pallet_id} | 
                            Intake: {rejectionForm.countingRecord.total_weight} kg | 
                            Counted: {Number(rejectionForm.countingRecord.total_counted_weight || 0).toFixed(1)} kg
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <Label>Rejected Crates</Label>
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleAddRejectedCrate}
                              className="bg-gray-600 hover:bg-gray-700"
                            >
                              Add Crate
                            </Button>
                          </div>
                          
                          {rejectionForm.crates.length === 0 ? (
                            <div className="text-center py-6 border rounded">
                              <p className="text-gray-500">No rejected crates added yet</p>
                              <p className="text-sm text-gray-400 mt-1">
                                Click "Add Crate" to start recording rejected crates
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {safeArray(rejectionForm.crates).map((crate, index) => (
                                <div key={crate.id} className="border rounded p-3 bg-black">
                                  <div className="flex justify-between items-start mb-3">
                                    <div className="font-medium">Crate #{index + 1}</div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveRejectedCrate(index)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <Label htmlFor={`box-type-${index}`} className="text-xs">Box Type</Label>
                                      <select
                                        id={`box-type-${index}`}
                                        value={crate.box_type}
                                        onChange={(e) => handleUpdateRejectedCrate(index, 'box_type', e.target.value)}
                                        className="w-full border rounded px-2 py-1 text-sm bg-black"
                                      >
                                        <option value="fuerte_4kg">Fuerte 4kg</option>
                                        <option value="fuerte_10kg">Fuerte 10kg</option>
                                        <option value="hass_4kg">Hass 4kg</option>
                                        <option value="hass_10kg">Hass 10kg</option>
                                      </select>
                                    </div>
                                    <div>
                                      <Label htmlFor={`class-type-${index}`} className="text-xs">Class</Label>
                                      <select
                                        id={`class-type-${index}`}
                                        value={crate.class_type}
                                        onChange={(e) => handleUpdateRejectedCrate(index, 'class_type', e.target.value)}
                                        className="w-full border rounded px-2 py-1 text-sm bg-black"
                                      >
                                        <option value="class1">Class 1</option>
                                        <option value="class2">Class 2</option>
                                      </select>
                                    </div>
                                    <div>
                                      <Label htmlFor={`quantity-${index}`} className="text-xs">Quantity</Label>
                                      <Input
                                        id={`quantity-${index}`}
                                        type="number"
                                        min="0"
                                        value={crate.quantity}
                                        onChange={(e) => handleUpdateRejectedCrate(index, 'quantity', e.target.value)}
                                        className="h-8 text-sm"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`weight-${index}`} className="text-xs">Weight/Crate (kg)</Label>
                                      <Input
                                        id={`weight-${index}`}
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={crate.weight_per_crate}
                                        onChange={(e) => handleUpdateRejectedCrate(index, 'weight_per_crate', e.target.value)}
                                        className="h-8 text-sm"
                                      />
                                    </div>
                                  </div>
                                  <div className="mt-3 pt-3 border-t">
                                    <div className="flex justify-between text-sm">
                                      <span>Total Weight:</span>
                                      <span className="font-semibold">{safeToFixed(crate.total_weight)} kg</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="reject-notes" className="mb-2">Rejection Notes</Label>
                          <Input
                            id="reject-notes"
                            value={rejectionForm.notes}
                            onChange={(e) => setRejectionForm(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Reason for rejection, observations, etc."
                          />
                        </div>

                        {rejectionForm.crates.length > 0 && (
                          <div className="bg-black-50 p-4 rounded border">
                            <div className="font-medium mb-2">Weight Variance Summary</div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Total Counted Weight:</span>
                                <span className="font-semibold">
                                  {Number(rejectionForm.countingRecord.total_counted_weight || 0).toFixed(1)} kg
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Total Rejected Weight:</span>
                                <span className="font-semibold">
                                  {safeToFixed(rejectionForm.crates.reduce((sum, crate) => sum + crate.total_weight, 0))} kg
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Total Intake Weight:</span>
                                <span className="font-semibold">
                                  {rejectionForm.countingRecord.total_weight} kg
                                </span>
                              </div>
                              <div className="flex justify-between pt-2 border-t">
                                <span className="font-medium">Weight Variance:</span>
                                <span className={`font-bold ${
                                  Math.abs(rejectionForm.countingRecord.total_weight - 
                                    (Number(rejectionForm.countingRecord.total_counted_weight || 0) + 
                                     rejectionForm.crates.reduce((sum, crate) => sum + crate.total_weight, 0))) >= 10 ? 
                                    'text-red-600' : 'text-green-600'
                                }`}>
                                  {safeToFixed(
                                    rejectionForm.countingRecord.total_weight - 
                                    (Number(rejectionForm.countingRecord.total_counted_weight || 0) + 
                                    rejectionForm.crates.reduce((sum, crate) => sum + crate.total_weight, 0))
                                  )} kg
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        <Button
                          type="button"
                          onClick={handleSubmitRejection}
                          className="w-full bg-red-600 hover:bg-red-700"
                          size="lg"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Submit Variance Data
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <AlertTriangle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No record selected</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Select a counting record from the left panel to record rejected crates
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <History className="w-5 h-5" />
                      Processing History & Export
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={downloadFilteredHistory}
                        disabled={filteredHistory.length === 0 || isLoading.rejections}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export Filtered
                      </Button>
                      <Button
                        onClick={downloadAllHistory}
                        disabled={rejectionRecords.length === 0 || isLoading.rejections}
                        variant="outline"
                        className="gap-2"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        Export All
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {filteredHistory.length} completed processing record(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>

                  {/* Filters */}
                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="search-history">Search</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="search-history"
                            placeholder="Search by supplier, pallet ID, or region..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                          {searchTerm && (
                            <button
                              onClick={clearSearchFilter}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="start-date">Start Date</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="start-date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-date">End Date</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="end-date"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Showing {filteredHistory.length} of {rejectionRecords.length} records
                        {(startDate || endDate) && ' • Date filter applied'}
                        {searchTerm && ' • Search filter applied'}
                      </div>
                      <div className="flex gap-2">
                        {(startDate || endDate) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearDateFilter}
                          >
                            <Filter className="w-4 h-4 mr-2" />
                            Clear Dates
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={fetchAllData}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Refresh
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* History List */}
                  <ScrollArea className="h-[500px] pr-4">
                    {isLoading.rejections ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                        <p className="text-muted-foreground">Loading history...</p>
                      </div>
                    ) : filteredHistory.length === 0 ? (
                      <div className="text-center py-8">
                        <History className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No processing history found</p>
                        <p className="text-sm text-gray-400 mt-1">
                          {searchTerm || startDate || endDate ? 'Try adjusting your filters' : 'Completed processing records will appear here'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredHistory.map((record) => {
                          const boxesSummary = getBoxesSummary(record.counting_totals);
                          const supplierInfo = getSupplierInfoFromCountingData(record.counting_data);
                          return (
                            <Collapsible
                              key={record.id}
                              open={expandedHistory.has(record.id)}
                              onOpenChange={() => toggleHistoryExpansion(record.id)}
                              className="border rounded-lg overflow-hidden"
                            >
                              <CollapsibleTrigger asChild>
                                <div className="flex items-center justify-between p-4 bg-black-50 hover:bg-black-100 cursor-pointer">
                                  <div className="flex items-center gap-3">
                                    <div className={`transition-transform ${expandedHistory.has(record.id) ? 'rotate-180' : ''}`}>
                                      <ChevronDown className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <div className="font-semibold">{record.supplier_name}</div>
                                      <div className="text-sm text-gray-500 flex items-center gap-4">
                                        <span>Pallet: {record.pallet_id}</span>
                                        <span>Boxes: {boxesSummary.total} boxes</span>
                                        <span>Variance: {safeToFixed(record.weight_variance)} kg</span>
                                        <span>{formatDate(record.submitted_at)}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {renderVarianceBadge(record.variance_level)}
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                      Processed
                                    </Badge>
                                  </div>
                                </div>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="p-4 bg-black border-t">
                                <div className="space-y-4">
                                  {/* Supplier Info */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <div className="text-gray-500">Supplier</div>
                                      <div className="font-semibold">{record.supplier_name}</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-500">Pallet ID</div>
                                      <div className="font-medium">{record.pallet_id}</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-500">Region</div>
                                      <div className="font-medium">{record.region}</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-500">Processed By</div>
                                      <div className="font-medium">{record.processed_by}</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-500">Driver</div>
                                      <div className="font-medium">{supplierInfo.driver_name || 'N/A'}</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-500">Vehicle Plate</div>
                                      <div className="font-medium">{supplierInfo.vehicle_plate || 'N/A'}</div>
                                    </div>
                                  </div>

                                  {/* Weight Summary */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div className="bg-black-50 p-3 rounded border">
                                      <div className="text-gray-500">Intake Weight</div>
                                      <div className="font-bold text-lg">{record.total_intake_weight} kg</div>
                                    </div>
                                    <div className="bg-black-50 p-3 rounded border">
                                      <div className="text-gray-500">Counted Weight</div>
                                      <div className="font-bold text-lg">{safeToFixed(record.total_counted_weight)} kg</div>
                                    </div>
                                    <div className="bg-black-50 p-3 rounded border">
                                      <div className="text-gray-500">Rejected Weight</div>
                                      <div className="font-bold text-lg">{safeToFixed(record.total_rejected_weight)} kg</div>
                                    </div>
                                    <div className={`p-3 rounded border ${
                                      Math.abs(record.weight_variance) < 10 ? 'bg-black-50' : 
                                      Math.abs(record.weight_variance) <= 20 ? 'bg-black-50' : 'bg-black-50'
                                    }`}>
                                      <div className="text-gray-500">Weight Variance</div>
                                      <div className={`font-bold text-lg ${
                                        Math.abs(record.weight_variance) < 10 ? 'text-green-700' : 
                                        Math.abs(record.weight_variance) <= 20 ? 'text-yellow-700' : 'text-red-700'
                                      }`}>
                                        {safeToFixed(record.weight_variance)} kg
                                      </div>
                                    </div>
                                  </div>

                                  {/* Boxes Summary */}
                                  <div className="bg-black-50 p-3 rounded border">
                                    <div className="font-medium mb-2">Boxes Summary</div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                      <div>
                                        <div className="text-gray-500">Fuerte 4kg</div>
                                        <div className="font-semibold text-green-700">{boxesSummary.fuerte_4kg} boxes</div>
                                      </div>
                                      <div>
                                        <div className="text-gray-500">Fuerte 10kg</div>
                                        <div className="font-semibold text-green-700">{boxesSummary.fuerte_10kg} crates</div>
                                      </div>
                                      <div>
                                        <div className="text-gray-500">Hass 4kg</div>
                                        <div className="font-semibold text-purple-700">{boxesSummary.hass_4kg} boxes</div>
                                      </div>
                                      <div>
                                        <div className="text-gray-500">Hass 10kg</div>
                                        <div className="font-semibold text-purple-700">{boxesSummary.hass_10kg} crates</div>
                                      </div>
                                    </div>
                                    <div className="mt-2 pt-2 border-t">
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Total Boxes:</span>
                                        <span className="font-bold">{boxesSummary.total} boxes/crates</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Detailed Counting Totals */}
                                  <div>
                                    <div className="text-gray-500 mb-2">Detailed Box Counts</div>
                                    <div className="bg-black-50 p-3 rounded border">
                                      <div className="grid grid-cols-4 gap-2 text-sm mb-2 font-medium">
                                        <div>Type</div>
                                        <div>Class 1</div>
                                        <div>Class 2</div>
                                        <div>Total</div>
                                      </div>
                                      {boxesSummary.fuerte_4kg > 0 && (
                                        <div className="grid grid-cols-4 gap-2 text-sm py-1 border-t">
                                          <div className="font-medium">Fuerte 4kg</div>
                                          <div>{parseCountingTotals(record.counting_totals).fuerte_4kg_class1 || 0}</div>
                                          <div>{parseCountingTotals(record.counting_totals).fuerte_4kg_class2 || 0}</div>
                                          <div className="font-bold">{boxesSummary.fuerte_4kg}</div>
                                        </div>
                                      )}
                                      {boxesSummary.fuerte_10kg > 0 && (
                                        <div className="grid grid-cols-4 gap-2 text-sm py-1 border-t">
                                          <div className="font-medium">Fuerte 10kg</div>
                                          <div>{parseCountingTotals(record.counting_totals).fuerte_10kg_class1 || 0}</div>
                                          <div>{parseCountingTotals(record.counting_totals).fuerte_10kg_class2 || 0}</div>
                                          <div className="font-bold">{boxesSummary.fuerte_10kg}</div>
                                        </div>
                                      )}
                                      {boxesSummary.hass_4kg > 0 && (
                                        <div className="grid grid-cols-4 gap-2 text-sm py-1 border-t">
                                          <div className="font-medium">Hass 4kg</div>
                                          <div>{parseCountingTotals(record.counting_totals).hass_4kg_class1 || 0}</div>
                                          <div>{parseCountingTotals(record.counting_totals).hass_4kg_class2 || 0}</div>
                                          <div className="font-bold">{boxesSummary.hass_4kg}</div>
                                        </div>
                                      )}
                                      {boxesSummary.hass_10kg > 0 && (
                                        <div className="grid grid-cols-4 gap-2 text-sm py-1 border-t">
                                          <div className="font-medium">Hass 10kg</div>
                                          <div>{parseCountingTotals(record.counting_totals).hass_10kg_class1 || 0}</div>
                                          <div>{parseCountingTotals(record.counting_totals).hass_10kg_class2 || 0}</div>
                                          <div className="font-bold">{boxesSummary.hass_10kg}</div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Rejected Crates */}
                                  {safeArray(record.crates).length > 0 && (
                                    <div>
                                      <div className="text-gray-500 mb-2">Rejected Crates</div>
                                      <div className="bg-black-50 p-3 rounded border">
                                        <div className="grid grid-cols-4 gap-2 text-sm mb-2 font-medium">
                                          <div>Type</div>
                                          <div>Class</div>
                                          <div>Quantity</div>
                                          <div>Total Weight</div>
                                        </div>
                                        {safeArray(record.crates).map((crate, idx) => (
                                          <div key={idx} className="grid grid-cols-4 gap-2 text-sm py-1 border-t">
                                            <div>{crate.box_type.replace('_', ' ')}</div>
                                            <div>{crate.class_type}</div>
                                            <div>{crate.quantity}</div>
                                            <div>{safeToFixed(crate.total_weight)} kg</div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Notes */}
                                  {record.notes && (
                                    <div>
                                      <div className="text-gray-500 mb-2">Notes</div>
                                      <div className="bg-gray-50 p-3 rounded border text-sm">
                                        {record.notes}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}