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
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { 
  Thermometer, 
  Package, 
  Truck, 
  RefreshCw, 
  Snowflake, 
  Upload,
  AlertTriangle,
  BarChart3,
  Calendar,
  Clock,
  Weight,
  Minus,
  Plus,
  Box,
  Layers,
  Check,
  X,
  Warehouse,
  Database,
  History,
  Search,
  FileText,
  Filter,
  Download
} from 'lucide-react';

interface CountingHistoryItem {
  variety: 'fuerte' | 'hass';
  boxType: '4kg' | '10kg';
  size: string;
  grade: 'class1' | 'class2';
  quantity: number;
  supplierName?: string;
  palletId?: string;
  region?: string;
  weightEntryId?: string;
  countingRecordId?: string;
}

interface SelectedBox extends CountingHistoryItem {
  selected: boolean;
  coldRoomId: string;
}

interface ColdRoomBox {
  id: string;
  variety: 'fuerte' | 'hass';
  box_type: '4kg' | '10kg';
  size: string;
  grade: 'class1' | 'class2';
  quantity: number;
  cold_room_id: string;
  created_at: string;
  cold_room_name?: string;
  supplier_name?: string;
  pallet_id?: string;
  region?: string;
}

interface ColdRoomPallet {
  id: string;
  variety: 'fuerte' | 'hass';
  box_type: '4kg' | '10kg';
  size: string;
  grade: 'class1' | 'class2';
  pallet_count: number;
  cold_room_id: string;
  created_at: string;
  last_updated: string;
}

interface TemperatureLog {
  id: string;
  cold_room_id: string;
  temperature: number;
  timestamp: string;
  recorded_by: string;
}

interface RepackingRecord {
  id: string;
  cold_room_id: string;
  removed_boxes: Array<{
    variety: 'fuerte' | 'hass';
    boxType: '4kg' | '10kg';
    size: string;
    grade: 'class1' | 'class2';
    quantity: number;
    weight: number;
  }>;
  returned_boxes: Array<{
    variety: 'fuerte' | 'hass';
    boxType: '4kg' | '10kg';
    size: string;
    grade: 'class1' | 'class2';
    quantity: number;
    weight: number;
  }>;
  rejected_boxes: number;
  notes: string;
  timestamp: string;
  processed_by: string;
}

interface ColdRoomStats {
  total4kgBoxes: number;
  total10kgBoxes: number;
  total4kgPallets: number;
  total10kgPallets: number;
  fuerteClass14kg: number;
  fuerteClass24kg: number;
  fuerteClass110kg: number;
  fuerteClass210kg: number;
  hassClass14kg: number;
  hassClass24kg: number;
  hassClass110kg: number;
  hassClass210kg: number;
  lastTemperatureLogs: TemperatureLog[];
  recentRepacking: RepackingRecord[];
}

interface RepackingBoxForm {
  variety: 'fuerte' | 'hass';
  boxType: '4kg' | '10kg';
  size: string;
  grade: 'class1' | 'class2';
  quantity: number;
}

// Warehouse history record interface
interface WarehouseHistoryRecord {
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
  crates: Array<{
    id: string;
    box_type: string;
    class_type: string;
    quantity: number;
    weight_per_crate: number;
    total_weight: number;
  }>;
  notes: string;
  counting_data: any;
  counting_totals: {
    fuerte_4kg_total: number;
    fuerte_10kg_total: number;
    hass_4kg_total: number;
    hass_10kg_total: number;
    [key: string]: number;
  };
  submitted_at: string;
  processed_by: string;
  original_counting_id: string;
}

// History record interface
interface LoadingHistoryRecord {
  id: string;
  box_id?: string;
  supplier_name: string;
  pallet_id: string;
  region?: string;
  variety: 'fuerte' | 'hass';
  box_type: '4kg' | '10kg';
  size: string;
  grade: 'class1' | 'class2';
  quantity: number;
  cold_room_id: string;
  loaded_by: string;
  loading_date: string;
  created_at: string;
}

// Available sizes
const BOX_SIZES = [
  'size12', 'size14', 'size16', 'size18', 'size20',
  'size22', 'size24', 'size26', 'size28', 'size30'
];

// Helper to format size for display
const formatSize = (size: string) => {
  return size.replace('size', 'Size ');
};

// Utility function to safely format numbers
const safeToFixed = (value: any, decimals: number = 1): string => {
  const num = Number(value);
  return isNaN(num) ? '0.'.padEnd(decimals + 2, '0') : num.toFixed(decimals);
};

// Safe array access utility
const safeArray = <T,>(array: T[] | undefined | null): T[] => {
  return Array.isArray(array) ? array : [];
};

// Safe date formatting
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Safe date formatting for input
const formatDateForInput = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

// CSV Export utility function
const exportToCSV = (data: LoadingHistoryRecord[], filename: string = 'coldroom-loading-history') => {
  if (!data || data.length === 0) {
    return;
  }

  // Define CSV headers
  const headers = [
    'Loading Date',
    'Supplier Name',
    'Pallet ID',
    'Region',
    'Variety',
    'Box Type',
    'Size',
    'Grade',
    'Quantity',
    'Weight Per Box (kg)',
    'Total Weight (kg)',
    'Cold Room',
    'Loaded By',
    'Created At'
  ];

  // Convert data to CSV rows
  const rows = data.map(record => {
    const boxWeight = record.box_type === '4kg' ? 4 : 10;
    const totalWeight = (record.quantity || 0) * boxWeight;
    const loadingDate = record.loading_date ? new Date(record.loading_date).toLocaleDateString() : '';
    const createdDate = record.created_at ? new Date(record.created_at).toLocaleDateString() : '';
    
    return [
      `"${loadingDate}"`,
      `"${record.supplier_name || 'Unknown'}"`,
      `"${record.pallet_id || ''}"`,
      `"${record.region || ''}"`,
      `"${record.variety === 'fuerte' ? 'Fuerte' : 'Hass'}"`,
      `"${record.box_type}"`,
      `"${formatSize(record.size)}"`,
      `"${record.grade === 'class1' ? 'Class 1' : 'Class 2'}"`,
      `"${record.quantity || 0}"`,
      `"${boxWeight}"`,
      `"${totalWeight}"`,
      `"${record.cold_room_id === 'coldroom1' ? 'Cold Room 1' : 'Cold Room 2'}"`,
      `"${record.loaded_by || 'Warehouse Staff'}"`,
      `"${createdDate}"`
    ].join(',');
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows
  ].join('\n');

  // Create blob and download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

// Export filtered data with summary
const exportFilteredHistoryToCSV = (
  data: LoadingHistoryRecord[], 
  filters: any,
  summary: any,
  filename: string = 'coldroom-filtered-history'
) => {
  if (!data || data.length === 0) {
    return;
  }

  // Create summary section
  const summarySection = [
    ['COLD ROOM LOADING HISTORY REPORT'],
    ['Generated on:', new Date().toLocaleString()],
    [''],
    ['FILTER CRITERIA:'],
    [`Date Range: ${filters.dateFrom || 'Any'} to ${filters.dateTo || 'Any'}`],
    [`Supplier: ${filters.supplierName || 'Any'}`],
    [`Cold Room: ${filters.coldRoomId === 'all' ? 'All' : filters.coldRoomId === 'coldroom1' ? 'Cold Room 1' : 'Cold Room 2'}`],
    [''],
    ['REPORT SUMMARY:'],
    [`Total Records: ${summary.totalRecords || 0}`],
    [`Total Boxes Loaded: ${summary.totalBoxesLoaded?.toLocaleString() || 0}`],
    [`Total Weight: ${safeToFixed(summary.totalWeight || 0)} kg`],
    [`Unique Suppliers: ${summary.uniqueSuppliers || 0}`],
    [''],
    ['DETAILED RECORDS:'],
    [''] // Empty line before headers
  ];

  // Define CSV headers
  const headers = [
    'Loading Date',
    'Supplier Name',
    'Pallet ID',
    'Region',
    'Variety',
    'Box Type',
    'Size',
    'Grade',
    'Quantity',
    'Weight Per Box (kg)',
    'Total Weight (kg)',
    'Cold Room',
    'Loaded By',
    'Created At'
  ];

  // Convert data to CSV rows
  const rows = data.map(record => {
    const boxWeight = record.box_type === '4kg' ? 4 : 10;
    const totalWeight = (record.quantity || 0) * boxWeight;
    const loadingDate = record.loading_date ? new Date(record.loading_date).toLocaleDateString() : '';
    const createdDate = record.created_at ? new Date(record.created_at).toLocaleDateString() : '';
    
    return [
      `"${loadingDate}"`,
      `"${record.supplier_name || 'Unknown'}"`,
      `"${record.pallet_id || ''}"`,
      `"${record.region || ''}"`,
      `"${record.variety === 'fuerte' ? 'Fuerte' : 'Hass'}"`,
      `"${record.box_type}"`,
      `"${formatSize(record.size)}"`,
      `"${record.grade === 'class1' ? 'Class 1' : 'Class 2'}"`,
      `"${record.quantity || 0}"`,
      `"${boxWeight}"`,
      `"${totalWeight}"`,
      `"${record.cold_room_id === 'coldroom1' ? 'Cold Room 1' : 'Cold Room 2'}"`,
      `"${record.loaded_by || 'Warehouse Staff'}"`,
      `"${createdDate}"`
    ].join(',');
  });

  // Combine all sections
  const csvContent = [
    ...summarySection.map(row => Array.isArray(row) ? row.join(',') : row),
    headers.join(','),
    ...rows
  ].join('\n');

  // Create blob and download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

export default function ColdRoomPage() {
  const { toast } = useToast();
  
  // State for cold rooms
  const [coldRooms, setColdRooms] = useState<Array<{
    id: string;
    name: string;
    current_temperature: number;
    capacity: number;
    occupied: number;
  }>>([]);
  
  // State for warehouse history records
  const [warehouseHistory, setWarehouseHistory] = useState<WarehouseHistoryRecord[]>([]);
  
  // State for counting history (converted from warehouse history)
  const [countingHistory, setCountingHistory] = useState<CountingHistoryItem[]>([]);
  
  // State for cold room contents
  const [coldRoomBoxes, setColdRoomBoxes] = useState<ColdRoomBox[]>([]);
  const [coldRoomPallets, setColdRoomPallets] = useState<ColdRoomPallet[]>([]);
  const [temperatureLogs, setTemperatureLogs] = useState<TemperatureLog[]>([]);
  const [repackingRecords, setRepackingRecords] = useState<RepackingRecord[]>([]);
  const [coldRoomStats, setColdRoomStats] = useState<{
    overall: ColdRoomStats;
    coldroom1: ColdRoomStats;
    coldroom2: ColdRoomStats;
  } | null>(null);
  
  // State for loading history
  const [loadingHistory, setLoadingHistory] = useState<LoadingHistoryRecord[]>([]);
  
  // State for loading
  const [isLoading, setIsLoading] = useState({
    coldRooms: true,
    warehouseHistory: true,
    counting: true,
    boxes: true,
    pallets: true,
    temperature: true,
    repacking: true,
    stats: true,
    countingRecords: false,
    loadingHistory: false,
  });
  
  // State for counting boxes from database
  const [countingBoxes, setCountingBoxes] = useState<Array<{
    variety: 'fuerte' | 'hass';
    boxType: '4kg' | '10kg';
    size: string;
    grade: 'class1' | 'class2';
    quantity: number;
    supplierName: string;
    palletId: string;
    region: string;
    countingRecordId: string;
    selected: boolean;
    coldRoomId: string;
    boxWeight: number;
    totalWeight: number;
    statusBadge: string;
    status: string;
    forColdroom: boolean;
  }>>([]);
  
  // NEW: State to track if boxes have been loaded
  const [boxesLoaded, setBoxesLoaded] = useState<boolean>(false);
  
  // State for forms
  const [selectedColdRoom, setSelectedColdRoom] = useState<string>('coldroom1');
  const [temperature, setTemperature] = useState<string>('');
  
  // State for load boxes selection
  const [selectedBoxes, setSelectedBoxes] = useState<SelectedBox[]>([]);
  
  // State for data source tracking
  const [dataSource, setDataSource] = useState<'warehouse' | 'local' | 'api' | null>(null);
  
  // State for repacking form
  const [repackingForm, setRepackingForm] = useState<{
    removedBoxes: RepackingBoxForm[];
    returnedBoxes: RepackingBoxForm[];
    notes: string;
  }>({
    removedBoxes: [],
    returnedBoxes: [],
    notes: '',
  });
  
  // State for history search
  const [historySearch, setHistorySearch] = useState({
    dateFrom: '',
    dateTo: '',
    supplierName: '',
    coldRoomId: 'all',
  });
  
  // Active tab state
  const [activeTab, setActiveTab] = useState('loading');

  // ===========================================
  // DATA FETCHING FUNCTIONS
  // ===========================================
  
  // Fetch cold rooms
  const fetchColdRooms = async () => {
    try {
      const response = await fetch('/api/cold-room');
      
      if (!response.ok) {
        console.error('Error response from cold-room API:', response.status);
        setColdRooms([
          {
            id: 'coldroom1',
            name: 'Cold Room 1',
            current_temperature: 5,
            capacity: 100,
            occupied: 0
          },
          {
            id: 'coldroom2',
            name: 'Cold Room 2',
            current_temperature: 5,
            capacity: 100,
            occupied: 0
          }
        ]);
        return;
      }
      
      const data = await response.json();
      console.log('Cold rooms API response:', data);
      
      const calculateOccupiedPallets = (coldRoomId: string) => {
        const boxesInRoom = safeArray(coldRoomBoxes).filter(box => box.cold_room_id === coldRoomId);
        const totalPallets = boxesInRoom.reduce((sum, box) => {
          const boxesPerPallet = box.box_type === '4kg' ? 288 : 120;
          return sum + Math.floor(box.quantity / boxesPerPallet);
        }, 0);
        return totalPallets;
      };
      
      if (Array.isArray(data)) {
        const updatedRooms = data.map(room => ({
          ...room,
          occupied: calculateOccupiedPallets(room.id)
        }));
        setColdRooms(updatedRooms);
      } else if (data && Array.isArray(data.data)) {
        const updatedRooms = data.data.map(room => ({
          ...room,
          occupied: calculateOccupiedPallets(room.id)
        }));
        setColdRooms(updatedRooms);
      } else {
        console.warn('Unexpected cold rooms response format, using defaults:', data);
        setColdRooms([
          {
            id: 'coldroom1',
            name: 'Cold Room 1',
            current_temperature: 5,
            capacity: 100,
            occupied: calculateOccupiedPallets('coldroom1')
          },
          {
            id: 'coldroom2',
            name: 'Cold Room 2',
            current_temperature: 5,
            capacity: 100,
            occupied: calculateOccupiedPallets('coldroom2')
          }
        ]);
      }
      
    } catch (error) {
      console.error('Error fetching cold rooms:', error);
      setColdRooms([
        {
          id: 'coldroom1',
          name: 'Cold Room 1',
          current_temperature: 5,
          capacity: 100,
          occupied: 0
        },
        {
          id: 'coldroom2',
          name: 'Cold Room 2',
          current_temperature: 5,
          capacity: 100,
          occupied: 0
        }
      ]);
    } finally {
      setIsLoading(prev => ({ ...prev, coldRooms: false }));
    }
  };
  
  // Fetch cold room boxes and pallets
  const fetchColdRoomBoxes = async () => {
    try {
      console.log('📦 Fetching cold room boxes and pallets...');
      
      const [boxesResponse, palletsResponse] = await Promise.allSettled([
        fetch('/api/cold-room?action=boxes'),
        fetch('/api/cold-room?action=pallets'),
      ]);
      
      let boxesData: ColdRoomBox[] = [];
      let palletsData: ColdRoomPallet[] = [];
      
      // Process boxes response
      if (boxesResponse.status === 'fulfilled' && boxesResponse.value.ok) {
        const result = await boxesResponse.value.json();
        if (result.success && Array.isArray(result.data)) {
          console.log(`✅ Loaded ${result.data.length} boxes from cold room`);
          boxesData = result.data.map((box: any) => ({
            id: box.id,
            variety: box.variety,
            box_type: box.boxType || box.box_type,
            size: box.size,
            grade: box.grade,
            quantity: Number(box.quantity) || 0,
            cold_room_id: box.cold_room_id,
            created_at: box.created_at,
            cold_room_name: box.cold_room_id === 'coldroom1' ? 'Cold Room 1' : 'Cold Room 2',
            supplier_name: box.supplier_name,
            pallet_id: box.pallet_id,
            region: box.region
          }));
          setColdRoomBoxes(boxesData);
        } else {
          console.warn('No boxes data returned from API');
          setColdRoomBoxes([]);
        }
      } else {
        console.error('Failed to fetch boxes:', boxesResponse);
        setColdRoomBoxes([]);
      }
      
      // Process pallets response
      if (palletsResponse.status === 'fulfilled' && palletsResponse.value.ok) {
        const result = await palletsResponse.value.json();
        if (result.success && Array.isArray(result.data)) {
          console.log(`✅ Loaded ${result.data.length} pallets from cold room`);
          palletsData = result.data.map((pallet: any) => ({
            id: pallet.id,
            variety: pallet.variety,
            box_type: pallet.boxType || pallet.box_type,
            size: pallet.size,
            grade: pallet.grade,
            pallet_count: Number(pallet.pallet_count) || 0,
            cold_room_id: pallet.cold_room_id,
            created_at: pallet.created_at,
            last_updated: pallet.last_updated || pallet.created_at
          }));
          setColdRoomPallets(palletsData);
        } else {
          console.warn('No pallets data returned from API');
          setColdRoomPallets([]);
        }
      } else {
        console.error('Failed to fetch pallets:', palletsResponse);
        setColdRoomPallets([]);
      }
      
    } catch (error) {
      console.error('❌ Error fetching cold room boxes:', error);
      setColdRoomBoxes([]);
      setColdRoomPallets([]);
    } finally {
      setIsLoading(prev => ({ ...prev, boxes: false, pallets: false }));
    }
  };
  
  // Fetch temperature logs
  const fetchTemperatureLogs = async () => {
    try {
      console.log('🌡️ Fetching temperature logs...');
      const response = await fetch('/api/cold-room?action=temperature');
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Loaded ${Array.isArray(result.data) ? result.data.length : 0} temperature logs`);
        setTemperatureLogs(result.data || []);
      } else {
        console.warn('No temperature logs returned from API');
        setTemperatureLogs([]);
      }
    } catch (error) {
      console.error('❌ Error fetching temperature logs:', error);
      setTemperatureLogs([]);
    } finally {
      setIsLoading(prev => ({ ...prev, temperature: false }));
    }
  };
  
  // Fetch repacking records
  const fetchRepackingRecords = async () => {
    try {
      console.log('🔄 Fetching repacking records...');
      const response = await fetch('/api/cold-room?action=repacking');
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Loaded ${Array.isArray(result.data) ? result.data.length : 0} repacking records`);
        setRepackingRecords(result.data || []);
      } else {
        console.warn('No repacking records returned from API');
        setRepackingRecords([]);
      }
    } catch (error) {
      console.error('❌ Error fetching repacking records:', error);
      setRepackingRecords([]);
    } finally {
      setIsLoading(prev => ({ ...prev, repacking: false }));
    }
  };
  
  // Fetch cold room statistics
  const fetchColdRoomStats = async () => {
    try {
      console.log('📊 Fetching cold room statistics...');
      const response = await fetch('/api/cold-room?action=stats');
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Loaded cold room statistics');
        setColdRoomStats(result.data);
      } else {
        console.warn('No cold room stats returned from API');
        setColdRoomStats(null);
      }
    } catch (error) {
      console.error('❌ Error fetching cold room stats:', error);
      setColdRoomStats(null);
    } finally {
      setIsLoading(prev => ({ ...prev, stats: false }));
    }
  };
  
  // Fetch loading history from the new loading_history table
  const fetchLoadingHistory = async () => {
    setIsLoading(prev => ({ ...prev, loadingHistory: true }));
    try {
      console.log('📜 Fetching loading history from database...');
      
      const response = await fetch('/api/cold-room?action=loading-history');
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log(`✅ Loaded ${Array.isArray(result.data) ? result.data.length : 0} history records`);
          
          const historyData: LoadingHistoryRecord[] = safeArray(result.data).map((item: any) => ({
            id: item.id || '',
            box_id: item.box_id || item.id || '',
            supplier_name: item.supplier_name || 'Unknown Supplier',
            pallet_id: item.pallet_id || `PAL-${item.id || Date.now()}`,
            region: item.region || '',
            variety: item.variety || 'fuerte',
            box_type: item.box_type || item.boxType || '4kg',
            size: item.size || 'size24',
            grade: item.grade || 'class1',
            quantity: Number(item.quantity) || 0,
            cold_room_id: item.cold_room_id || item.coldRoomId || 'coldroom1',
            loaded_by: item.loaded_by || 'Warehouse Staff',
            loading_date: item.loading_date || item.created_at || new Date().toISOString(),
            created_at: item.created_at || item.loading_date || new Date().toISOString()
          }));
          
          setLoadingHistory(historyData);
        } else {
          setLoadingHistory([]);
        }
      } else {
        setLoadingHistory([]);
      }
    } catch (error) {
      console.error('❌ Error fetching loading history:', error);
      setLoadingHistory([]);
    } finally {
      setIsLoading(prev => ({ ...prev, loadingHistory: false }));
    }
  };

  // Search loading history
  const searchLoadingHistory = async () => {
    setIsLoading(prev => ({ ...prev, loadingHistory: true }));
    try {
      console.log('🔍 Searching loading history...');
      const response = await fetch('/api/cold-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'search-history',
          dateFrom: historySearch.dateFrom,
          dateTo: historySearch.dateTo,
          supplierName: historySearch.supplierName,
          coldRoomId: historySearch.coldRoomId === 'all' ? '' : historySearch.coldRoomId,
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log(`✅ Found ${Array.isArray(result.data) ? result.data.length : 0} records`);
          
          const historyData: LoadingHistoryRecord[] = safeArray(result.data).map((item: any) => ({
            id: item.id || '',
            box_id: item.box_id || item.id || '',
            supplier_name: item.supplier_name || 'Unknown Supplier',
            pallet_id: item.pallet_id || `PAL-${item.id || Date.now()}`,
            region: item.region || '',
            variety: item.variety || 'fuerte',
            box_type: item.box_type || item.boxType || '4kg',
            size: item.size || 'size24',
            grade: item.grade || 'class1',
            quantity: Number(item.quantity) || 0,
            cold_room_id: item.cold_room_id || item.coldRoomId || 'coldroom1',
            loaded_by: item.loaded_by || 'Warehouse Staff',
            loading_date: item.loading_date || item.created_at || new Date().toISOString(),
            created_at: item.created_at || item.loading_date || new Date().toISOString()
          }));
          
          setLoadingHistory(historyData);
        } else {
          setLoadingHistory([]);
        }
      } else {
        setLoadingHistory([]);
      }
    } catch (error) {
      console.error('❌ Error searching loading history:', error);
      setLoadingHistory([]);
    } finally {
      setIsLoading(prev => ({ ...prev, loadingHistory: false }));
    }
  };
  
  // Enhanced fetchCountingHistory function - now focused on warehouse history
  const fetchCountingHistory = async () => {
    setIsLoading(prev => ({ ...prev, counting: true }));
    
    try {
      console.log('🔄 Checking for warehouse history data...');
      
      // STEP 1: Check localStorage for direct supplier data
      const coldRoomSupplierDataStr = localStorage.getItem('coldRoomSupplierData');
      
      if (coldRoomSupplierDataStr) {
        try {
          const supplierData = JSON.parse(coldRoomSupplierDataStr);
          console.log('✅ Found cold room supplier data:', supplierData.supplier_name);
          
          const transformedData: CountingHistoryItem[] = [];
          const countingData = supplierData.counting_data || {};
          
          Object.keys(countingData).forEach(key => {
            if (!key) return;
            
            if ((key.includes('fuerte_') || key.includes('hass_')) && 
                (key.includes('_4kg_') || key.includes('_10kg_'))) {
              
              const parts = key.split('_');
              if (parts.length >= 4) {
                const variety = parts[0] as 'fuerte' | 'hass';
                const boxType = parts[1] as '4kg' | '10kg';
                const grade = parts[2] as 'class1' | 'class2';
                const size = parts.slice(3).join('_').replace(/_/g, '');
                const quantity = Number(countingData[key]) || 0;
                
                if (quantity > 0 && size) {
                  const cleanSize = size.startsWith('size') ? size : `size${size}`;
                  
                  transformedData.push({
                    variety,
                    boxType,
                    size: cleanSize,
                    grade,
                    quantity,
                    supplierName: supplierData.supplier_name,
                    palletId: supplierData.pallet_id,
                    region: supplierData.region,
                    countingRecordId: supplierData.id
                  });
                }
              }
            }
          });
          
          const filteredData = transformedData.filter(item => item.quantity > 0);
          
          if (filteredData.length > 0) {
            console.log(`✅ Loaded ${filteredData.length} boxes from supplier data`);
            setCountingHistory(filteredData);
            setDataSource('local');
            
            const initialSelectedBoxes = filteredData.map(item => ({
              ...item,
              selected: true,
              coldRoomId: 'coldroom1'
            }));
            setSelectedBoxes(initialSelectedBoxes);
            
            localStorage.removeItem('coldRoomSupplierData');
            
            toast({
              title: "✅ Supplier Loaded Directly!",
              description: `${supplierData.supplier_name}'s boxes are ready to load`,
            });
            
            setIsLoading(prev => ({ ...prev, counting: false }));
            return;
          }
        } catch (error) {
          console.error('❌ Error parsing cold room supplier data:', error);
          localStorage.removeItem('coldRoomSupplierData');
        }
      }
      
      // STEP 2: Fetch warehouse history from API
      const loadedFromHistory = await fetchWarehouseHistory();
      
      if (loadedFromHistory) {
        setIsLoading(prev => ({ ...prev, counting: false }));
        return;
      }
      
      // STEP 3: Fallback - check for warehouse data in localStorage
      const warehouseDataStr = localStorage.getItem('warehouseCountingData');
      
      if (warehouseDataStr) {
        try {
          const warehouseData = JSON.parse(warehouseDataStr);
          console.log('✅ Found warehouse counting data in localStorage');
          
          const transformedData: CountingHistoryItem[] = [];
          
          if (warehouseData.counting_data) {
            const countingData = warehouseData.counting_data;
            
            Object.keys(countingData).forEach(key => {
              if (!key) return;
              
              if ((key.includes('fuerte_') || key.includes('hass_')) && 
                  (key.includes('_4kg_') || key.includes('_10kg_'))) {
                
                const parts = key.split('_');
                if (parts.length >= 4) {
                  const variety = parts[0] as 'fuerte' | 'hass';
                  const boxType = parts[1] as '4kg' | '10kg';
                  const grade = parts[2] as 'class1' | 'class2';
                  const size = parts.slice(3).join('_').replace(/_/g, '');
                  const quantity = Number(countingData[key]) || 0;
                  
                  if (quantity > 0 && size) {
                    const cleanSize = size.startsWith('size') ? size : `size${size}`;
                    
                    transformedData.push({
                      variety,
                      boxType,
                      size: cleanSize,
                      grade,
                      quantity,
                      supplierName: warehouseData.supplier_name,
                      countingRecordId: warehouseData.id
                    });
                  }
                }
              }
            });
          }
          
          const filteredData = transformedData.filter(item => item.quantity > 0);
          
          if (filteredData.length > 0) {
            console.log(`✅ Loaded ${filteredData.length} boxes from localStorage`);
            setCountingHistory(filteredData);
            setDataSource('local');
            
            const initialSelectedBoxes = filteredData.map(item => ({
              ...item,
              selected: true,
              coldRoomId: 'coldroom1'
            }));
            setSelectedBoxes(initialSelectedBoxes);
            
            localStorage.removeItem('warehouseCountingData');
            
            toast({
              title: "📦 Boxes Loaded from Local Storage",
              description: `Loaded ${filteredData.length} box types`,
            });
            
            setIsLoading(prev => ({ ...prev, counting: false }));
            return;
          }
        } catch (error) {
          console.error('❌ Error parsing warehouse data:', error);
          localStorage.removeItem('warehouseCountingData');
        }
      }
      
      // STEP 4: Final fallback - fetch from counting API
      console.log('📡 Fetching from counting API as fallback...');
      try {
        const response = await fetch('/api/counting');
        
        if (response.ok) {
          const result = await response.json();
          
          if (result.success && Array.isArray(result.data)) {
            const transformedData: CountingHistoryItem[] = [];
            
            safeArray(result.data).forEach((record: any) => {
              const countingData = record.counting_data || {};
              
              Object.keys(countingData).forEach(key => {
                if (!key) return;
                
                if ((key.includes('fuerte_') || key.includes('hass_')) && 
                    (key.includes('_4kg_') || key.includes('_10kg_'))) {
                  
                  const parts = key.split('_');
                  if (parts.length >= 4) {
                    const variety = parts[0] as 'fuerte' | 'hass';
                    const boxType = parts[1] as '4kg' | '10kg';
                    const grade = parts[2] as 'class1' | 'class2';
                    const size = parts.slice(3).join('_').replace(/_/g, '');
                    const quantity = Number(countingData[key]) || 0;
                    
                    if (quantity > 0 && size) {
                      const cleanSize = size.startsWith('size') ? size : `size${size}`;
                      
                      transformedData.push({
                        variety,
                        boxType,
                        size: cleanSize,
                        grade,
                        quantity,
                        supplierName: record.supplier_name,
                        countingRecordId: record.id
                      });
                    }
                  }
                }
              });
            });
            
            const filteredData = transformedData.filter(item => item.quantity > 0);
            
            if (filteredData.length > 0) {
              console.log(`✅ Loaded ${filteredData.length} boxes from API`);
              setCountingHistory(filteredData);
              setDataSource('api');
              
              const initialSelectedBoxes = filteredData.map(item => ({
                ...item,
                selected: true,
                coldRoomId: 'coldroom1'
              }));
              setSelectedBoxes(initialSelectedBoxes);
              
              toast({
                title: "📦 Counting Records Found",
                description: `Loaded ${filteredData.length} box types from saved records`,
              });
            } else {
              setCountingHistory([]);
              setSelectedBoxes([]);
              setDataSource(null);
            }
          } else {
            setCountingHistory([]);
            setSelectedBoxes([]);
            setDataSource(null);
          }
        } else {
          setCountingHistory([]);
          setSelectedBoxes([]);
          setDataSource(null);
        }
      } catch (apiError) {
        console.error('❌ Counting API fetch failed:', apiError);
        setCountingHistory([]);
        setSelectedBoxes([]);
        setDataSource(null);
      }
      
    } catch (error) {
      console.error('❌ Error in fetchCountingHistory:', error);
      toast({
        title: 'Error Loading Data',
        description: 'Could not load counting history from warehouse',
        variant: 'destructive',
      });
      setCountingHistory([]);
      setSelectedBoxes([]);
      setDataSource(null);
    } finally {
      setIsLoading(prev => ({ ...prev, counting: false }));
    }
  };
  
  // Fetch warehouse history records from API
  const fetchWarehouseHistory = async () => {
    setIsLoading(prev => ({ ...prev, warehouseHistory: true }));
    
    try {
      console.log('📊 Fetching warehouse history records...');
      const response = await fetch('/api/counting?action=history');
      
      if (response.ok) {
        const result = await response.json();
        console.log('📊 Warehouse history API response:', result);
        
        if (result.success && Array.isArray(result.data)) {
          const historyData = result.data as WarehouseHistoryRecord[];
          console.log(`✅ Loaded ${historyData.length} warehouse history records`);
          setWarehouseHistory(historyData);
          
          processWarehouseHistory(historyData);
        } else {
          console.error('❌ Unexpected response format from warehouse history API');
          setWarehouseHistory([]);
          setCountingHistory([]);
          setSelectedBoxes([]);
          setDataSource(null);
        }
      } else {
        console.error('❌ Failed to fetch warehouse history');
        setWarehouseHistory([]);
        setCountingHistory([]);
        setSelectedBoxes([]);
        setDataSource(null);
      }
    } catch (error) {
      console.error('❌ Error fetching warehouse history:', error);
      setWarehouseHistory([]);
      setCountingHistory([]);
      setSelectedBoxes([]);
      setDataSource(null);
    } finally {
      setIsLoading(prev => ({ ...prev, warehouseHistory: false }));
    }
  };
  
// Process warehouse history into counting items safely
const processWarehouseHistory = (history: WarehouseHistoryRecord[]) => {
  console.log('🔄 Processing warehouse history into boxes...');

  const transformedData: CountingHistoryItem[] = [];

  safeArray(history).forEach(record => {
    const supplierName = record.supplier_name || 'Unknown Supplier';
    const palletId = record.pallet_id || `WH-${record.id || Date.now()}`;
    const region = record.region || '';

    const countingData = record.counting_data ?? {};
    const countingTotals = record.counting_totals ?? {};

    console.log(`🔄 Processing record for ${supplierName}:`, {
      countingDataKeys: Object.keys(countingData).length,
      countingTotals
    });

    let extractedFromCountingData = false;

    if (countingData && typeof countingData === 'object') {
      Object.keys(countingData).forEach(key => {
        if (!key) return;

        if ((key.includes('fuerte_') || key.includes('hass_')) &&
            (key.includes('_4kg_') || key.includes('_10kg_')) &&
            (key.includes('_class1_') || key.includes('_class2_'))) {

          const parts = key.split('_');
          if (parts.length >= 4) {
            const variety = parts[0] as 'fuerte' | 'hass';
            const boxType = parts[1] as '4kg' | '10kg';
            const grade = parts[2] as 'class1' | 'class2';
            const size = parts.slice(3).join('_').replace(/_/g, '');
            const quantity = Number(countingData[key]) || 0;

            if (quantity > 0 && size) {
              const cleanSize = size.startsWith('size') ? size : `size${size}`;

              transformedData.push({
                variety,
                boxType,
                size: cleanSize,
                grade,
                quantity,
                supplierName,
                palletId,
                region,
                countingRecordId: record.id
              });

              extractedFromCountingData = true;
            }
          }
        }
      });
    }

    if (!extractedFromCountingData && countingTotals && typeof countingTotals === 'object') {
      console.log(`📊 Using totals for ${supplierName}:`, countingTotals);

      const sizes = ['size12', 'size14', 'size16', 'size18', 'size20', 'size22', 'size24', 'size26'];

      const processTotal = (variety: 'fuerte' | 'hass', boxType: '4kg' | '10kg', total: number) => {
        if (total > 0) {
          const boxesPerSize = Math.max(1, Math.floor(total / sizes.length));

          sizes.forEach(size => {
            if (boxesPerSize > 0) {
              transformedData.push({
                variety,
                boxType,
                size,
                grade: 'class1',
                quantity: Math.max(1, Math.floor(boxesPerSize * 0.7)),
                supplierName,
                palletId,
                region,
                countingRecordId: record.id
              });

              transformedData.push({
                variety,
                boxType,
                size,
                grade: 'class2',
                quantity: Math.max(1, Math.floor(boxesPerSize * 0.3)),
                supplierName,
                palletId,
                region,
                countingRecordId: record.id
              });
            }
          });
        }
      };

      processTotal('fuerte', '4kg', countingTotals.fuerte_4kg_total ?? 0);
      processTotal('fuerte', '10kg', countingTotals.fuerte_10kg_total ?? 0);
      processTotal('hass', '4kg', countingTotals.hass_4kg_total ?? 0);
      processTotal('hass', '10kg', countingTotals.hass_10kg_total ?? 0);
    }
  });

  const filteredData = transformedData.filter(item => item.quantity > 0);

  if (filteredData.length > 0) {
    console.log(`✅ Created ${filteredData.length} box items from ${history.length} warehouse history records`);

    const suppliers = new Set(filteredData.map(item => item.supplierName).filter(Boolean));

    setCountingHistory(filteredData);
    setDataSource('warehouse');

    const initialSelectedBoxes = filteredData.map(item => ({
      ...item,
      selected: true,
      coldRoomId: 'coldroom1'
    }));

    setSelectedBoxes(initialSelectedBoxes);

    toast({
      title: "📦 Warehouse Boxes Loaded",
      description: (
        <div>
          <p>Loaded {filteredData.length} box types from {suppliers.size} suppliers</p>
          <div className="mt-1 text-sm text-gray-600">
            Total boxes: {filteredData.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()}
          </div>
        </div>
      ),
    });

    return true;
  } else {
    console.warn('⚠️ No valid box data found in warehouse history');
    setCountingHistory([]);
    setSelectedBoxes([]);
    setDataSource(null);
    return false;
  }
};

// Replace the existing fetchCountingRecordsForColdRoom function with this:

const fetchCountingRecordsForColdRoom = async () => {
  setIsLoading(prev => ({ ...prev, countingRecords: true }));
  try {
    console.log('📦 Fetching records from REJECTION RECORDS (final history)...');
    
    // CHANGE 1: Fetch from REJECTION RECORDS instead of counting_records
    const countingResponse = await fetch('/api/counting?action=history');
    const countingResult = await countingResponse.json();
    
    if (!countingResult.success) {
      throw new Error(countingResult.error || 'Failed to fetch rejection records');
    }
    
    console.log(`✅ Found ${countingResult.data?.length || 0} rejection records from database`);
    
    // 2. Get boxes already in cold rooms
    const coldRoomResponse = await fetch('/api/cold-room?action=boxes');
    const coldRoomResult = await coldRoomResponse.json();
    
    const coldRoomBoxes = coldRoomResult.success ? coldRoomResult.data : [];
    console.log(`📊 Found ${coldRoomBoxes.length} boxes already in cold rooms`);
    
    // 3. Create a set of already-loaded box identifiers for fast lookup
    const alreadyLoadedBoxes = new Set<string>();
    
    coldRoomBoxes.forEach((box: any) => {
      const key = `${box.variety}_${box.boxType || box.box_type}_${box.size}_${box.grade}_${box.supplier_name || 'unknown'}_${box.pallet_id || 'unknown'}`;
      alreadyLoadedBoxes.add(key.toLowerCase());
    });
    
    console.log(`📊 Created ${alreadyLoadedBoxes.size} unique identifiers for already loaded boxes`);
    
    if (Array.isArray(countingResult.data) && countingResult.data.length > 0) {
      const boxes: any[] = [];
      const filteredRecords = [];
      
      // 4. Process REJECTION RECORDS (these are the final records after variance)
      for (const record of countingResult.data) {
        const supplierName = record.supplier_name || 'Unknown Supplier';
        const palletId = record.pallet_id || `WH-${record.id}`;
        const region = record.region || '';
        const status = 'completed'; // Rejection records are always completed
        const forColdroom = true; // These are ready for cold room
        
        // CHANGE 2: Use counting_totals instead of counting_data
        const countingTotals = record.counting_totals || {};
        
        let hasUnloadedBoxes = false;
        
        console.log(`🔄 Processing rejection record for ${supplierName}:`, countingTotals);
        
        // Process each variety and box type from counting_totals
        const processTotals = (variety: 'fuerte' | 'hass', boxType: '4kg' | '10kg', total: number) => {
          if (total > 0) {
            const sizes = ['size12', 'size14', 'size16', 'size18', 'size20', 'size22', 'size24', 'size26'];
            const boxesPerSize = Math.max(1, Math.floor(total / sizes.length));
            
            sizes.forEach(size => {
              if (boxesPerSize > 0) {
                // Create Class 1 boxes
                const class1Quantity = Math.max(1, Math.floor(boxesPerSize * 0.7));
                const class1Identifier = `${variety}_${boxType}_${size}_class1_${supplierName}_${palletId}`.toLowerCase();
                
                if (!alreadyLoadedBoxes.has(class1Identifier)) {
                  boxes.push({
                    variety,
                    boxType,
                    size,
                    grade: 'class1',
                    quantity: class1Quantity,
                    supplierName,
                    palletId,
                    region,
                    status,
                    forColdroom,
                    countingRecordId: record.original_counting_id || record.id,
                    selected: true,
                    coldRoomId: 'coldroom1',
                    boxWeight: boxType === '4kg' ? 4 : 10,
                    totalWeight: class1Quantity * (boxType === '4kg' ? 4 : 10),
                    alreadyLoaded: false
                  });
                  hasUnloadedBoxes = true;
                }
                
                // Create Class 2 boxes
                const class2Quantity = Math.max(1, Math.floor(boxesPerSize * 0.3));
                const class2Identifier = `${variety}_${boxType}_${size}_class2_${supplierName}_${palletId}`.toLowerCase();
                
                if (!alreadyLoadedBoxes.has(class2Identifier)) {
                  boxes.push({
                    variety,
                    boxType,
                    size,
                    grade: 'class2',
                    quantity: class2Quantity,
                    supplierName,
                    palletId,
                    region,
                    status,
                    forColdroom,
                    countingRecordId: record.original_counting_id || record.id,
                    selected: true,
                    coldRoomId: 'coldroom1',
                    boxWeight: boxType === '4kg' ? 4 : 10,
                    totalWeight: class2Quantity * (boxType === '4kg' ? 4 : 10),
                    alreadyLoaded: false
                  });
                  hasUnloadedBoxes = true;
                }
              }
            });
          }
        };
        
        // Process all totals from counting_totals
        processTotals('fuerte', '4kg', countingTotals.fuerte_4kg_total || 0);
        processTotals('fuerte', '10kg', countingTotals.fuerte_10kg_total || 0);
        processTotals('hass', '4kg', countingTotals.hass_4kg_total || 0);
        processTotals('hass', '10kg', countingTotals.hass_10kg_total || 0);
        
        if (hasUnloadedBoxes) {
          filteredRecords.push(record);
          console.log(`✅ Added ${supplierName} (has unloaded boxes from rejection records)`);
        } else {
          console.log(`⏭️ Skipping ${supplierName} (all boxes already loaded or no data)`);
        }
      }
      
      console.log(`📦 Created ${boxes.length} unloaded box items from ${filteredRecords.length} rejection records`);
      
      const boxesWithStatus = boxes.map(box => ({
        ...box,
        statusBadge: 'Ready for Cold Room',
        isNew: true
      }));
      
      setCountingBoxes(boxesWithStatus);
      setBoxesLoaded(false);
      
      if (boxes.length > 0) {
        toast({
          title: "📦 Rejection Records Found",
          description: (
            <div>
              <p>Loaded {boxes.length} box types from {filteredRecords.length} final records</p>
              <div className="mt-1 text-sm text-gray-600">
                These are complete records after variance processing
              </div>
            </div>
          ),
        });
      } else {
        toast({
          title: "✅ All boxes loaded",
          description: "All rejection records have already been loaded to cold rooms",
          variant: "default",
        });
      }
      
    } else {
      setCountingBoxes([]);
      toast({
        title: "No rejection records found",
        description: "No completed records available to load",
        variant: "default",
      });
    }
  } catch (error: any) {
    console.error('❌ Error fetching rejection records:', error);
    toast({
      title: "Error",
      description: error.message || "Failed to load rejection records from database",
      variant: "destructive",
    });
    setCountingBoxes([]);
  } finally {
    setIsLoading(prev => ({ ...prev, countingRecords: false }));
  }
};

  // Fetch all data
  const fetchAllData = async () => {
    try {
      setIsLoading({
        coldRooms: true,
        warehouseHistory: true,
        counting: true,
        boxes: true,
        pallets: true,
        temperature: true,
        repacking: true,
        stats: true,
        countingRecords: true,
        loadingHistory: false,
      });
      
      await Promise.allSettled([
        fetchColdRooms(),
        fetchCountingHistory(),
        fetchColdRoomBoxes(),
        fetchTemperatureLogs(),
        fetchRepackingRecords(),
        fetchColdRoomStats(),
        fetchCountingRecordsForColdRoom(),
        fetchLoadingHistory(),
      ]);
      
    } catch (error) {
      console.error('Error in fetchAllData:', error);
      toast({
        title: 'Partial Data Loaded',
        description: 'Some data could not be loaded. Please refresh.',
        variant: 'destructive',
      });
    }
  };
  
  // Selection handlers for counting boxes
  const handleToggleBoxSelection = (index: number) => {
    setCountingBoxes(prev => {
      const updated = [...prev];
      updated[index].selected = !updated[index].selected;
      return updated;
    });
  };
  
  const handleColdRoomSelectionForBox = (index: number, coldRoomId: string) => {
    setCountingBoxes(prev => {
      const updated = [...prev];
      updated[index].coldRoomId = coldRoomId;
      return updated;
    });
  };
  
  const handleSelectAllBoxes = () => {
    setCountingBoxes(prev => 
      prev.map(box => ({ ...box, selected: true }))
    );
  };
  
  const handleDeselectAllBoxes = () => {
    setCountingBoxes(prev => 
      prev.map(box => ({ ...box, selected: false }))
    );
  };
  
  // Load boxes to cold room
  const handleLoadToColdRoom = async () => {
    const boxesToLoad = countingBoxes.filter(box => box.selected);
    
    if (boxesToLoad.length === 0) {
      toast({
        title: 'No boxes selected',
        description: 'Please select at least one box to load',
        variant: 'destructive',
      });
      return;
    }

    try {
      const boxesData = boxesToLoad.map(box => ({
        variety: box.variety,
        boxType: box.boxType,
        size: box.size,
        grade: box.grade,
        quantity: box.quantity,
        coldRoomId: box.coldRoomId,
        supplierName: box.supplierName || 'Unknown Supplier',
        palletId: box.palletId || `PAL-${box.countingRecordId || Date.now()}`,
        region: box.region || '',
        countingRecordId: box.countingRecordId,
        boxWeight: box.boxWeight,
        totalWeight: box.totalWeight,
        loadedBy: 'Warehouse Staff'
      }));
      
      const countingRecordIds = [...new Set(boxesToLoad
        .map(box => box.countingRecordId)
        .filter(id => id))];

      console.log('📤 Sending boxes to cold room:', {
        boxesCount: boxesData.length,
        boxesData: boxesData.map(b => ({
          supplierName: b.supplierName,
          palletId: b.palletId,
          variety: b.variety,
          quantity: b.quantity,
          coldRoomId: b.coldRoomId
        })),
        countingRecordIds
      });

      const response = await fetch('/api/cold-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'load-boxes',
          boxesData: boxesData,
          countingRecordIds: countingRecordIds,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // In the handleLoadToColdRoom function, update the toast message to show which records were loaded:
toast({
  title: '✅ Boxes Loaded Successfully!',
  description: (
    <div className="space-y-2">
      <p>Loaded {boxesToLoad.length} box types ({totalSelectedBoxes.toLocaleString()} boxes)</p>
      <div className="text-sm text-gray-600">
        Cold Room 1: {coldRoom1TotalBoxes.toLocaleString()} boxes<br/>
        Cold Room 2: {coldRoom2TotalBoxes.toLocaleString()} boxes
      </div>
      <p className="text-xs text-green-600 mt-1">
        Updated {countingRecordIds.length} counting record(s)
      </p>
      <p className="text-xs text-blue-600 mt-1">
        ✅ Saved to loading history
      </p>
      {boxesToLoad.length > 0 && boxesToLoad[0].countingRecordId && (
        <p className="text-xs text-gray-500 mt-1">
          These boxes won't appear again for loading
        </p>
      )}
    </div>
  ),
});        
        setCountingBoxes([]);
        setBoxesLoaded(true);
        
        await Promise.all([
          fetchColdRoomBoxes(),
          fetchColdRoomStats(),
          fetchLoadingHistory(),
          fetchColdRooms(),
        ]);
        
        setActiveTab('history');
        
      } else {
        console.error('API Error:', result);
        throw new Error(result.error || `Failed to load boxes: ${result.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('❌ Error loading boxes:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load boxes to cold room',
        variant: 'destructive',
      });
    }
  };
  
  // Calculation functions for counting boxes
  const selectedBoxesCount = countingBoxes.filter(box => box.selected).length;
  const totalSelectedBoxes = countingBoxes
    .filter(box => box.selected)
    .reduce((sum, box) => sum + box.quantity, 0);
  
  const totalSelectedWeight = countingBoxes
    .filter(box => box.selected)
    .reduce((sum, box) => sum + box.totalWeight, 0);
  
  const calculateTotalPallets = () => {
    return countingBoxes
      .filter(box => box.selected)
      .reduce((sum, box) => {
        const boxesPerPallet = box.boxType === '4kg' ? 288 : 120;
        return sum + Math.floor(box.quantity / boxesPerPallet);
      }, 0);
  };
  
  const coldRoom1BoxTypes = countingBoxes.filter(box => box.selected && box.coldRoomId === 'coldroom1').length;
  const coldRoom1TotalBoxes = countingBoxes
    .filter(box => box.selected && box.coldRoomId === 'coldroom1')
    .reduce((sum, box) => sum + box.quantity, 0);
  const coldRoom1TotalWeight = countingBoxes
    .filter(box => box.selected && box.coldRoomId === 'coldroom1')
    .reduce((sum, box) => sum + box.totalWeight, 0);
  
  const coldRoom2BoxTypes = countingBoxes.filter(box => box.selected && box.coldRoomId === 'coldroom2').length;
  const coldRoom2TotalBoxes = countingBoxes
    .filter(box => box.selected && box.coldRoomId === 'coldroom2')
    .reduce((sum, box) => sum + box.quantity, 0);
  const coldRoom2TotalWeight = countingBoxes
    .filter(box => box.selected && box.coldRoomId === 'coldroom2')
    .reduce((sum, box) => sum + box.totalWeight, 0);
  
  
  // Set up polling and initial load
  useEffect(() => {
    fetchAllData();
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'coldRoomSupplierData' || e.key === 'warehouseCountingData') {
        console.log('🔄 Storage change detected, refreshing counting history...');
        fetchCountingHistory();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Handle box selection toggle (for original selectedBoxes)
  const handleBoxSelection = (index: number) => {
    setSelectedBoxes(prev => {
      const updated = [...prev];
      updated[index].selected = !updated[index].selected;
      return updated;
    });
  };
  
  // Handle cold room selection for a box (for original selectedBoxes)
  const handleColdRoomSelection = (index: number, coldRoomId: string) => {
    setSelectedBoxes(prev => {
      const updated = [...prev];
      updated[index].coldRoomId = coldRoomId;
      return updated;
    });
  };
  
  // Select all boxes (for original selectedBoxes)
  const handleSelectAll = () => {
    setSelectedBoxes(prev => 
      prev.map(box => ({ ...box, selected: true }))
    );
  };
  
  // Deselect all boxes (for original selectedBoxes)
  const handleDeselectAll = () => {
    setSelectedBoxes(prev => 
      prev.map(box => ({ ...box, selected: false }))
    );
  };
  
  // Handle load boxes (for original selectedBoxes)
  const handleLoadBoxes = async () => {
    const boxesToLoad = selectedBoxes.filter(box => box.selected);
    
    if (boxesToLoad.length === 0) {
      toast({
        title: 'No boxes selected',
        description: 'Please select at least one box to load',
        variant: 'destructive',
      });
      return;
    }
    
    const invalidBoxes = boxesToLoad.filter(box => !box.coldRoomId);
    if (invalidBoxes.length > 0) {
      toast({
        title: 'Missing cold room selection',
        description: 'Please select a cold room for all selected boxes',
        variant: 'destructive',
      });
      return;
    }
    
    const supplierGroups: { [key: string]: SelectedBox[] } = {};
    
    boxesToLoad.forEach(box => {
      const key = box.countingRecordId || box.supplierName || 'unknown';
      if (!supplierGroups[key]) {
        supplierGroups[key] = [];
      }
      supplierGroups[key].push(box);
    });
    
    const totalSuppliers = Object.keys(supplierGroups).length;
    
    try {
      const response = await fetch('/api/cold-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'load-boxes',
          boxesData: boxesToLoad.map(box => ({
            variety: box.variety,
            boxType: box.boxType,
            size: box.size,
            grade: box.grade,
            quantity: box.quantity,
            coldRoomId: box.coldRoomId,
            supplierName: box.supplierName,
            palletId: box.palletId,
            region: box.region,
            countingRecordId: box.countingRecordId,
          })),
          supplierCount: totalSuppliers,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        const coldroom1Boxes = boxesToLoad
          .filter(b => b.coldRoomId === 'coldroom1')
          .reduce((sum, box) => sum + box.quantity, 0);
        const coldroom2Boxes = boxesToLoad
          .filter(b => b.coldRoomId === 'coldroom2')
          .reduce((sum, box) => sum + box.quantity, 0);
        
        const coldroom1Pallets = boxesToLoad
          .filter(b => b.coldRoomId === 'coldroom1')
          .reduce((sum, box) => sum + calculatePallets(box.quantity, box.boxType), 0);
        const coldroom2Pallets = boxesToLoad
          .filter(b => b.coldRoomId === 'coldroom2')
          .reduce((sum, box) => sum + calculatePallets(box.quantity, box.boxType), 0);
        
        toast({
          title: '✅ Boxes Loaded Successfully!',
          description: (
            <div className="space-y-3">
              <p>Loaded boxes from {totalSuppliers} supplier(s) to Cold Rooms:</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-3 rounded border">
                  <div className="font-semibold text-blue-700">Cold Room 1</div>
                  <div className="text-sm mt-1">
                    <div>📦 {coldroom1Boxes.toLocaleString()} boxes</div>
                    <div>📊 {coldroom1Pallets} pallets</div>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded border">
                  <div className="font-semibold text-gray-700">Cold Room 2</div>
                  <div className="text-sm mt-1">
                    <div>📦 {coldroom2Boxes.toLocaleString()} boxes</div>
                    <div>📊 {coldroom2Pallets} pallets</div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Inventory has been updated. Check the Live Inventory tab.
              </p>
              <p className="text-xs text-blue-600 mt-1">
                ✅ Saved to loading history
              </p>
            </div>
          ),
        });
        
        setSelectedBoxes([]);
        setCountingHistory([]);
        setDataSource(null);
        
        fetchColdRoomBoxes();
        fetchColdRooms();
        fetchColdRoomStats();
        fetchLoadingHistory();
        
        localStorage.removeItem('coldRoomSupplierData');
        localStorage.removeItem('warehouseCountingData');
        
        setActiveTab('history');
        
      } else {
        throw new Error(result.error || 'Failed to load boxes');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load boxes',
        variant: 'destructive',
      });
    }
  };
  
  const handleRecordTemperature = async () => {
    if (!temperature) {
      toast({
        title: 'Missing temperature',
        description: 'Please enter a temperature value',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const response = await fetch('/api/cold-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'record-temperature',
          coldRoomId: selectedColdRoom,
          temperature: parseFloat(temperature),
          recordedBy: 'Warehouse Staff',
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Temperature Recorded',
          description: `Temperature ${temperature}°C recorded for ${selectedColdRoom === 'coldroom1' ? 'Cold Room 1' : 'Cold Room 2'}`,
        });
        
        setTemperature('');
        fetchTemperatureLogs();
        fetchColdRooms();
        
      } else {
        throw new Error(result.error || 'Failed to record temperature');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to record temperature',
        variant: 'destructive',
      });
    }
  };
  
  const handleAddRemovedBox = () => {
    setRepackingForm(prev => ({
      ...prev,
      removedBoxes: [
        ...prev.removedBoxes,
        {
          variety: 'fuerte',
          boxType: '4kg',
          size: 'size24',
          grade: 'class1',
          quantity: 0,
        }
      ]
    }));
  };
  
  const handleAddReturnedBox = () => {
    setRepackingForm(prev => ({
      ...prev,
      returnedBoxes: [
        ...prev.returnedBoxes,
        {
          variety: 'fuerte',
          boxType: '4kg',
          size: 'size24',
          grade: 'class1',
          quantity: 0,
        }
      ]
    }));
  };
  
  const handleUpdateRemovedBox = (index: number, field: keyof RepackingBoxForm, value: any) => {
    setRepackingForm(prev => {
      const updatedRemovedBoxes = [...prev.removedBoxes];
      updatedRemovedBoxes[index] = {
        ...updatedRemovedBoxes[index],
        [field]: field === 'quantity' ? parseInt(value) || 0 : value,
      };
      return { ...prev, removedBoxes: updatedRemovedBoxes };
    });
  };
  
  const handleUpdateReturnedBox = (index: number, field: keyof RepackingBoxForm, value: any) => {
    setRepackingForm(prev => {
      const updatedReturnedBoxes = [...prev.returnedBoxes];
      updatedReturnedBoxes[index] = {
        ...updatedReturnedBoxes[index],
        [field]: field === 'quantity' ? parseInt(value) || 0 : value,
      };
      return { ...prev, returnedBoxes: updatedReturnedBoxes };
    });
  };
  
  const handleRemoveRemovedBox = (index: number) => {
    setRepackingForm(prev => ({
      ...prev,
      removedBoxes: prev.removedBoxes.filter((_, i) => i !== index)
    }));
  };
  
  const handleRemoveReturnedBox = (index: number) => {
    setRepackingForm(prev => ({
      ...prev,
      returnedBoxes: prev.returnedBoxes.filter((_, i) => i !== index)
    }));
  };
  
  // NEW: Handle repacking as inventory update
  const handleRecordRepacking = async () => {
    const invalidRemovedBoxes = safeArray(repackingForm.removedBoxes).filter(box => 
      box.quantity <= 0 || 
      !box.variety || 
      !box.boxType || 
      !box.size || 
      !box.grade
    );
    
    if (invalidRemovedBoxes.length > 0) {
      toast({
        title: 'Invalid removed boxes',
        description: 'Please fill all fields for removed boxes with positive quantities',
        variant: 'destructive',
      });
      return;
    }
    
    const invalidReturnedBoxes = safeArray(repackingForm.returnedBoxes).filter(box => 
      box.quantity <= 0 || 
      !box.variety || 
      !box.boxType || 
      !box.size || 
      !box.grade
    );
    
    if (invalidReturnedBoxes.length > 0) {
      toast({
        title: 'Invalid returned boxes',
        description: 'Please fill all fields for returned boxes with positive quantities',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const response = await fetch('/api/cold-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'record-repacking',
          coldRoomId: selectedColdRoom,
          removedBoxes: safeArray(repackingForm.removedBoxes),
          returnedBoxes: safeArray(repackingForm.returnedBoxes),
          rejectedBoxes: 0,
          notes: repackingForm.notes,
          processedBy: 'Warehouse Staff',
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Repacking Recorded Successfully',
          description: 'Inventory has been updated with repacking changes',
        });
        
        setRepackingForm({
          removedBoxes: [],
          returnedBoxes: [],
          notes: '',
        });
        
        fetchColdRoomBoxes();
        fetchColdRoomStats();
        fetchRepackingRecords();
        fetchColdRooms();
        
      } else {
        throw new Error(result.error || 'Failed to record repacking');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to record repacking',
        variant: 'destructive',
      });
    }
  };
  
  // Calculate pallet conversion
  const calculatePallets = (quantity: number, boxType: '4kg' | '10kg'): number => {
    if (boxType === '4kg') {
      return Math.floor(quantity / 288);
    } else {
      return Math.floor(quantity / 120);
    }
  };
  
  const getRemainingBoxes = (quantity: number, boxType: '4kg' | '10kg'): number => {
    if (boxType === '4kg') {
      return quantity % 288;
    } else {
      return quantity % 120;
    }
  };
  
  // Get stats for selected cold room
  const getSelectedRoomStats = () => {
    if (!coldRoomStats) return null;
    return selectedColdRoom === 'coldroom1' ? coldRoomStats.coldroom1 : coldRoomStats.coldroom2;
  };
  
  const selectedRoomStats = getSelectedRoomStats();
  
  // Calculate total boxes summary (for original selectedBoxes)
  const calculateTotalSummary = () => {
    if (selectedBoxes.length === 0) return { totalBoxes: 0, totalPallets: 0 };
    
    const totalBoxes = selectedBoxes
      .filter(box => box.selected)
      .reduce((sum, box) => sum + box.quantity, 0);
    
    const totalPallets = selectedBoxes
      .filter(box => box.selected)
      .reduce((sum, box) => sum + calculatePallets(box.quantity, box.boxType), 0);
    
    return { totalBoxes, totalPallets };
  };
  
  const { totalBoxes, totalPallets } = calculateTotalSummary();
  
  // Calculate warehouse history summary
  const calculateWarehouseHistorySummary = () => {
    const totalSuppliers = new Set(safeArray(warehouseHistory).map(record => record.supplier_name).filter(Boolean)).size;
    const totalWeight = safeArray(warehouseHistory).reduce((sum, record) => sum + (record.total_counted_weight || 0), 0);
    const totalRecords = safeArray(warehouseHistory).length;
    
    return {
      totalSuppliers,
      totalWeight,
      totalRecords
    };
  };
  
  const warehouseSummary = calculateWarehouseHistorySummary();
  
  // Calculate loading history summary
  const calculateLoadingHistorySummary = () => {
    const totalBoxesLoaded = safeArray(loadingHistory).reduce((sum, record) => sum + (record.quantity || 0), 0);
    const uniqueSuppliers = new Set(safeArray(loadingHistory).map(record => record.supplier_name).filter(Boolean)).size;
    const totalWeight = safeArray(loadingHistory).reduce((sum, record) => {
      const boxWeight = record.box_type === '4kg' ? 4 : 10;
      return sum + ((record.quantity || 0) * boxWeight);
    }, 0);
    
    return {
      totalBoxesLoaded,
      uniqueSuppliers,
      totalWeight
    };
  };
  
  const loadingHistorySummary = calculateLoadingHistorySummary();
  
  // Clear search filters
  const clearSearchFilters = () => {
    setHistorySearch({
      dateFrom: '',
      dateTo: '',
      supplierName: '',
      coldRoomId: 'all',
    });
    fetchLoadingHistory(); 
  };
  
  // Render loading history table
  const renderLoadingHistoryTable = () => {
    const sortedHistory = [...safeArray(loadingHistory)].sort((a, b) => {
      const dateA = a.loading_date ? new Date(a.loading_date).getTime() : 0;
      const dateB = b.loading_date ? new Date(b.loading_date).getTime() : 0;
      return dateB - dateA;
    });
    
    return (
      <ScrollArea className="h-[500px] border rounded">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Loading Date</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Pallet ID</TableHead>
              <TableHead>Variety</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>Cold Room</TableHead>
              <TableHead>Loaded By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedHistory.map((record) => {
              const boxWeight = record.box_type === '4kg' ? 4 : 10;
              const totalWeight = (record.quantity || 0) * boxWeight;
              
              return (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="font-medium">{formatDate(record.loading_date)}</div>
                    <div className="text-xs text-gray-500">
                      {formatDateForInput(record.loading_date)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[120px] truncate" title={record.supplier_name}>
                      {record.supplier_name || 'Unknown'}
                    </div>
                    {record.region && (
                      <div className="text-xs text-gray-500">{record.region}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-xs" title={record.pallet_id}>
                      {record.pallet_id?.substring(0, 8)}...
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">
                    {record.variety === 'fuerte' ? 'Fuerte' : 'Hass'}
                  </TableCell>
                  <TableCell>{record.box_type}</TableCell>
                  <TableCell>{formatSize(record.size)}</TableCell>
                  <TableCell>
                    <Badge variant={record.grade === 'class1' ? 'default' : 'secondary'}>
                      {record.grade === 'class1' ? 'Class 1' : 'Class 2'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-medium">{(record.quantity || 0).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">
                      {safeToFixed(totalWeight)} kg total
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Snowflake className="w-3 h-3" />
                      {record.cold_room_id === 'coldroom1' ? 'Cold Room 1' : 'Cold Room 2'}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{record.loaded_by || 'Warehouse Staff'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>
    );
  };

  // Handle CSV download
  const handleDownloadCSV = () => {
    if (loadingHistory.length === 0) {
      toast({
        title: 'No data to export',
        description: 'There is no loading history data to download',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      exportToCSV(loadingHistory, 'coldroom-loading-history');
      
      toast({
        title: 'CSV Export Started',
        description: `Downloading ${loadingHistory.length} records as CSV file`,
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        title: 'Export Failed',
        description: 'Could not generate CSV file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle filtered CSV download with summary
  const handleDownloadFilteredCSV = () => {
    if (loadingHistory.length === 0) {
      toast({
        title: 'No data to export',
        description: 'There is no loading history data to download',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const filteredData = [...loadingHistory].sort((a, b) => {
        const dateA = a.loading_date ? new Date(a.loading_date).getTime() : 0;
        const dateB = b.loading_date ? new Date(b.loading_date).getTime() : 0;
        return dateB - dateA;
      });
      
      exportFilteredHistoryToCSV(
        filteredData, 
        historySearch, 
        loadingHistorySummary,
        `coldroom-history-${historySearch.dateFrom || 'all'}-${historySearch.dateTo || 'all'}`
      );
      
      toast({
        title: 'CSV Export with Summary',
        description: (
          <div>
            <p>Downloading {filteredData.length} filtered records</p>
            <div className="text-xs text-gray-600 mt-1">
              Includes search criteria and report summary
            </div>
          </div>
        ),
      });
    } catch (error) {
      console.error('Error exporting filtered CSV:', error);
      toast({
        title: 'Export Failed',
        description: 'Could not generate CSV file. Please try again.',
        variant: 'destructive',
      });
    }
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Cold Room Management
              </h2>
              <p className="text-muted-foreground">
                Manage boxes, pallets, and track temperature in cold storage
              </p>
            </div>
            <div className="flex items-center gap-3">
              {dataSource && (
                <Badge variant="outline" className="mr-2">
                  {dataSource === 'warehouse' ? 'Warehouse History' : 
                   dataSource === 'local' ? 'Supplier Data' : 'Counting Records'}
                </Badge>
              )}
              <Button
                onClick={fetchAllData}
                disabled={Object.values(isLoading).some(loading => loading)}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${Object.values(isLoading).some(loading => loading) ? 'animate-spin' : ''}`} />
                Refresh All
              </Button>
            </div>
          </div>
          
          {/* Warehouse History Summary Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Warehouse History Summary
              </CardTitle>
              <CardDescription>
                Data loaded from warehouse processing history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-black-50 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-500">Total History Records</div>
                    <History className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold text-blue-700">
                    {warehouseSummary.totalRecords}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Processed suppliers</div>
                </div>
                
                <div className="bg-black-50 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-500">Total Suppliers</div>
                    <Truck className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold text-green-700">
                    {warehouseSummary.totalSuppliers}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Unique suppliers</div>
                </div>
                
                <div className="bg-black-50 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-500">Total Weight</div>
                    <Weight className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-2xl font-bold text-purple-700">
                    {safeToFixed(warehouseSummary.totalWeight)} kg
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Counted weight</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Cold Room Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {safeArray(coldRooms).map(room => (
              <Card 
                key={room.id}
                className={`cursor-pointer ${selectedColdRoom === room.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedColdRoom(room.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Snowflake className="w-5 h-5" />
                      {room.name}
                    </div>
                    <Badge variant={room.occupied >= room.capacity ? "destructive" : "secondary"}>
                      {room.occupied}/{room.capacity} Pallets
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Current Temperature: {safeToFixed(room.current_temperature)}°C
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Thermometer className="w-4 h-4" />
                      <span>{safeToFixed(room.current_temperature)}°C</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      <span>{room.occupied} Pallets</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="loading">Load Boxes</TabsTrigger>
              <TabsTrigger value="inventory">Live Inventory</TabsTrigger>
              <TabsTrigger value="temperature">Temperature Control</TabsTrigger>
              <TabsTrigger value="repacking">Repacking</TabsTrigger>
              <TabsTrigger value="history">Loading History</TabsTrigger>
            </TabsList>
            
            {/* Load Boxes Tab - Fixed with proper safeArray usage */}
            <TabsContent value="loading" className="space-y-6 mt-6">
              {!boxesLoaded && safeArray(countingBoxes).length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Warehouse className="w-5 h-5" />
                      Load Boxes to Cold Room
                      <Badge variant="outline" className="ml-2">
                        From Counting Records
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Select boxes from counting records and load them into cold rooms
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Available Boxes from Counting</h3>
                          <p className="text-sm text-muted-foreground">
                            Boxes with status 'pending_coldroom' are ready to load
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => fetchCountingRecordsForColdRoom()}
                            variant="outline"
                            size="sm"
                            disabled={isLoading.countingRecords}
                          >
                            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading.countingRecords ? 'animate-spin' : ''}`} />
                            Refresh Counting Records
                          </Button>
                          <Button
                            onClick={handleSelectAllBoxes}
                            variant="outline"
                            size="sm"
                            disabled={safeArray(countingBoxes).length === 0}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Select All
                          </Button>
                          <Button
                            onClick={handleDeselectAllBoxes}
                            variant="outline"
                            size="sm"
                            disabled={safeArray(countingBoxes).length === 0}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Deselect All
                          </Button>
                        </div>
                      </div>
                      
                      {/* Loading State */}
                      {isLoading.countingRecords ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4 mx-auto"></div>
                          <p className="text-muted-foreground">Loading counting records...</p>
                        </div>
                      ) : (
                        <>
                          {/* Boxes Table */}
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <Label>Available Boxes ({safeArray(countingBoxes).length} types)</Label>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  {selectedBoxesCount} selected
                                </Badge>
                                <Badge variant="secondary">
                                  {totalSelectedBoxes.toLocaleString()} boxes
                                </Badge>
                              </div>
                            </div>
                            
                            <ScrollArea className="h-[400px] border rounded">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-12">Select</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Pallet ID</TableHead>
                                    <TableHead>Variety</TableHead>
                                    <TableHead>Box Type</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead>Grade</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead>Cold Room</TableHead>
                                    <TableHead className="text-right">Weight</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {safeArray(countingBoxes).map((item, index) => (
                                    <TableRow 
                                      key={`${item?.countingRecordId || ''}-${item?.variety || ''}-${item?.boxType || ''}-${item?.size || ''}-${item?.grade || ''}`}
                                      className={item?.selected ? "bg-black-50" : ""}
                                    >
                                      <TableCell>
                                        <input
                                          type="checkbox"
                                          checked={item?.selected || false}
                                          onChange={() => handleToggleBoxSelection(index)}
                                          className="h-4 w-4 rounded border-gray-300"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <div className="max-w-[120px] truncate" title={item?.supplierName || 'Unknown'}>
                                          {item?.supplierName || 'Unknown'}
                                        </div>
                                        {item?.region && (
                                          <div className="text-xs text-gray-500">{item.region}</div>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <div className="font-mono text-xs" title={item?.palletId}>
                                          {item?.palletId?.substring(0, 10)}...
                                        </div>
                                      </TableCell>
                                      <TableCell className="font-medium capitalize">
                                        {item?.variety === 'fuerte' ? 'Fuerte' : 'Hass'}
                                      </TableCell>
                                      <TableCell>{item?.boxType}</TableCell>
                                      <TableCell>{formatSize(item?.size || '')}</TableCell>
                                      <TableCell className="capitalize">
                                        <Badge variant={item?.grade === 'class1' ? 'default' : 'secondary'}>
                                          {item?.grade === 'class1' ? 'Class 1' : 'Class 2'}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right">{(item?.quantity || 0).toLocaleString()}</TableCell>
                                      <TableCell>
                                        <Select
                                          value={item?.coldRoomId || 'coldroom1'}
                                          onValueChange={(value) => handleColdRoomSelectionForBox(index, value)}
                                          disabled={!item?.selected}
                                        >
                                          <SelectTrigger className="w-32">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="coldroom1">
                                              <div className="flex items-center gap-2">
                                                <Snowflake className="w-3 h-3" />
                                                Cold Room 1
                                              </div>
                                            </SelectItem>
                                            <SelectItem value="coldroom2">
                                              <div className="flex items-center gap-2">
                                                <Snowflake className="w-3 h-3" />
                                                Cold Room 2
                                              </div>
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="font-medium">
                                          {safeToFixed(item?.boxWeight)} kg
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {(item?.boxType === '4kg' ? '4kg' : '10kg')} each
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </ScrollArea>
                          </div>
                          
                          {/* Load Summary */}
                          <Card>
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm font-medium">Load Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="border rounded p-4 bg-black-50">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Snowflake className="w-5 h-5 text-blue-600" />
                                    <div>
                                      <span className="font-medium">Cold Room 1</span>
                                      <p className="text-xs text-blue-600">5°C (Fresh Storage)</p>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm">Box Types:</span>
                                      <span className="font-medium">
                                        {coldRoom1BoxTypes}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm">Total Boxes:</span>
                                      <span className="font-medium">
                                        {coldRoom1TotalBoxes.toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm">Total Weight:</span>
                                      <span className="font-medium">
                                        {safeToFixed(coldRoom1TotalWeight)} kg
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="border rounded p-4 bg-black-50">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Snowflake className="w-5 h-5 text-gray-600" />
                                    <div>
                                      <span className="font-medium">Cold Room 2</span>
                                      <p className="text-xs text-gray-600">5°C (Fresh Storage)</p>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm">Box Types:</span>
                                      <span className="font-medium">
                                        {coldRoom2BoxTypes}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm">Total Boxes:</span>
                                      <span className="font-medium">
                                        {coldRoom2TotalBoxes.toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm">Total Weight:</span>
                                      <span className="font-medium">
                                        {safeToFixed(coldRoom2TotalWeight)} kg
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Overall Summary */}
                              <div className="mt-4 pt-4 border-t">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <span className="font-medium">Total to Load:</span>
                                    <p className="text-sm text-gray-500">
                                      {selectedBoxesCount} box types, {totalSelectedBoxes.toLocaleString()} boxes
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-lg font-bold">
                                      {safeToFixed(totalSelectedWeight)} kg total weight
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {calculateTotalPallets()} pallets
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          
                          {/* Load Button */}
                          <div className="flex gap-3">
                            <Button
                              onClick={handleLoadToColdRoom}
                              className="flex-1"
                              size="lg"
                              disabled={selectedBoxesCount === 0}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Load Selected Boxes to Cold Room
                              <span className="ml-2">
                                ({selectedBoxesCount} types, {totalSelectedBoxes.toLocaleString()} boxes)
                              </span>
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : boxesLoaded ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <Check className="w-5 h-5" />
                      Boxes Successfully Loaded!
                    </CardTitle>
                    <CardDescription>
                      All selected boxes have been loaded to cold rooms. Check the History tab to view loading records.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Loading Complete</h3>
                      <p className="text-gray-600 mb-6">
                        The boxes have been successfully transferred to cold room storage.
                      </p>
                      <div className="flex gap-3 justify-center">
                        <Button
                          onClick={() => {
                            setBoxesLoaded(false);
                            fetchCountingRecordsForColdRoom();
                          }}
                          variant="outline"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Load More Boxes
                        </Button>
                        <Button
                          onClick={() => setActiveTab('history')}
                        >
                          <History className="w-4 h-4 mr-2" />
                          View Loading History
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Warehouse className="w-5 h-5" />
                      Load Boxes to Cold Room
                      <Badge variant="outline" className="ml-2">
                        From Counting Records
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Select boxes from counting records and load them into cold rooms
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No Boxes Available</h3>
                      <p className="text-gray-600 mb-6">
                        Loading records with status 'pending_coldroom' will appear here.
                      </p>
                      <div className="flex gap-3 justify-center">
                        <Button
                          onClick={() => fetchCountingRecordsForColdRoom()}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Fetch Counting Records
                        </Button>
                        <Button
                          onClick={() => window.open('/warehouse', '_blank')}
                          variant="outline"
                        >
                          <Warehouse className="w-4 h-4 mr-2" />
                          Go to Warehouse
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {/* Live Inventory Tab */}
            <TabsContent value="inventory" className="space-y-6 mt-6">
              {/* Detailed Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Detailed Inventory Statistics
                  </CardTitle>
                  <CardDescription>
                    {selectedColdRoom === 'coldroom1' ? 'Cold Room 1' : 'Cold Room 2'} - Detailed Breakdown
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading.stats ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4 mx-auto"></div>
                      <p className="text-muted-foreground">Loading statistics...</p>
                    </div>
                  ) : !coldRoomStats ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4 mx-auto"></div>
                      <p className="text-muted-foreground">Loading statistics...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {['total4kgBoxes', 'total10kgBoxes', 'total4kgPallets', 'total10kgPallets', 
                        'fuerteClass14kg', 'fuerteClass24kg', 'fuerteClass110kg', 'fuerteClass210kg',
                        'hassClass14kg', 'hassClass24kg', 'hassClass110kg', 'hassClass210kg'].map((statKey) => {
                        const roomStats = selectedColdRoom === 'coldroom1' ? coldRoomStats.coldroom1 : coldRoomStats.coldroom2;
                        const value = (roomStats as any)[statKey] || 0;
                        const label = statKey
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, str => str.toUpperCase())
                          .replace(/Class (\d)/g, 'Class $1')
                          .replace(/Kg/g, 'kg');
                        
                        return (
                          <Card key={statKey}>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium">{label}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">{value.toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground mt-1">{label.toLowerCase()}</div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Boxes Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Boxes in Cold Room
                    </CardTitle>
                    <CardDescription>
                      All boxes currently stored in {selectedColdRoom === 'coldroom1' ? 'Cold Room 1' : 'Cold Room 2'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading.boxes ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4 mx-auto"></div>
                        <p className="text-muted-foreground">Loading boxes...</p>
                      </div>
                    ) : safeArray(coldRoomBoxes).filter(box => box.cold_room_id === selectedColdRoom).length === 0 ? (
                      <div className="text-center py-8 border rounded">
                        <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No boxes in cold room</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Load boxes from counting records to get started
                        </p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Variety</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Size</TableHead>
                              <TableHead>Grade</TableHead>
                              <TableHead className="text-right">Quantity</TableHead>
                              <TableHead className="text-right">Date In</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {safeArray(coldRoomBoxes)
                              .filter(box => box.cold_room_id === selectedColdRoom)
                              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                              .map((box) => (
                                <TableRow key={box.id}>
                                  <TableCell className="font-medium capitalize">
                                    {box.variety === 'fuerte' ? 'Fuerte' : 'Hass'}
                                  </TableCell>
                                  <TableCell>{box.box_type}</TableCell>
                                  <TableCell>{formatSize(box.size)}</TableCell>
                                  <TableCell>
                                    <Badge variant={box.grade === 'class1' ? 'default' : 'secondary'}>
                                      {box.grade === 'class1' ? 'Class 1' : 'Class 2'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {box.quantity.toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-right text-sm">
                                    {formatDate(box.created_at)}
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
                          
          {/* Pallets Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Pallet Conversion Summary
              </CardTitle>
              <CardDescription>
                Converted pallets from boxes in {selectedColdRoom === 'coldroom1' ? 'Cold Room 1' : 'Cold Room 2'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading.boxes ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4 mx-auto"></div>
                  <p className="text-muted-foreground">Loading boxes data...</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Variety</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead className="text-right">Box Count</TableHead>
                        <TableHead className="text-right">Pallet Count</TableHead>
                        <TableHead className="text-right">Remaining</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const boxesInRoom = safeArray(coldRoomBoxes)
                          .filter(box => box.cold_room_id === selectedColdRoom);
                        
                        if (boxesInRoom.length === 0) {
                          return (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8">
                                <div className="flex flex-col items-center">
                                  <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                  <p className="text-gray-500 font-medium">No boxes in cold room</p>
                                  <p className="text-sm text-gray-400 mt-1">
                                    Load boxes from counting records to get started
                                  </p>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        }
                        
                        // Group boxes
                        const groupedBoxes: Record<string, {
                          variety: string;
                          box_type: string;
                          size: string;
                          grade: string;
                          totalBoxes: number;
                        }> = {};
                        
                        boxesInRoom.forEach(box => {
                          const key = `${box.variety}-${box.box_type}-${box.size}-${box.grade}`;
                          
                          if (!groupedBoxes[key]) {
                            groupedBoxes[key] = {
                              variety: box.variety,
                              box_type: box.box_type,
                              size: box.size,
                              grade: box.grade,
                              totalBoxes: 0
                            };
                          }
                          groupedBoxes[key].totalBoxes += box.quantity;
                        });
                        
                        // Convert to array and calculate pallets
                        const palletData = Object.values(groupedBoxes).map(data => {
                          const boxesPerPallet = data.size === '4kg' ? 288 : 120;
                          const palletCount = Math.floor(data.totalBoxes / boxesPerPallet);
                          const remainingBoxes = data.totalBoxes % boxesPerPallet;
                          
                          return {
                            ...data,
                            palletCount,
                            remainingBoxes,
                            boxesPerPallet
                          };
                        }).filter(item => item.palletCount > 0); // Only show if there are complete pallets
                        
                        // Also show items with boxes but no complete pallets
                        const noPalletData = Object.values(groupedBoxes).filter(data => {
                          const boxesPerPallet = data.size === '4kg' ? 288 : 120;
                          return Math.floor(data.totalBoxes / boxesPerPallet) === 0;
                        });
                        
                        if (palletData.length === 0 && noPalletData.length === 0) {
                          return (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8">
                                <div className="flex flex-col items-center">
                                  <Package className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                                  <p className="text-sm text-gray-500">No boxes found</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        }
                        
                        if (palletData.length === 0 && noPalletData.length > 0) {
                          return (
                            <>
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-4 bg-muted/30">
                                  <div className="flex flex-col items-center">
                                    <Package className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                                    <p className="text-sm text-gray-500">No complete pallets yet</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      Boxes are accumulating but thresholds not met
                                    </p>
                                  </div>
                                </TableCell>
                              </TableRow>
                              {noPalletData.map((item, index) => {
                                const boxesPerPallet = item.size === '4kg' ? 288 : 120;
                                
                                return (
                                  <TableRow key={`no-pallet-${index}`} className="opacity-70">
                                    <TableCell className="capitalize">
                                      {item.variety === 'fuerte' ? 'Fuerte' : 'Hass'}
                                    </TableCell>
                                    <TableCell>{item.box_type}</TableCell>
                                    <TableCell>{formatSize(item.size)}</TableCell>
                                    <TableCell>
                                      <Badge variant={item.grade === 'class1' ? 'default' : 'secondary'}>
                                        {item.grade === 'class1' ? 'Class 1' : 'Class 2'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                      {item.totalBoxes.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <span className="text-muted-foreground">0</span>
                                    </TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                      {item.totalBoxes} boxes
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </>
                          );
                        }
                        
                        // Show complete pallets first
                        return (
                          <>
                            {palletData.map((item, index) => (
                              <TableRow key={`pallet-${index}`}>
                                <TableCell className="capitalize">
                                  {item.variety === 'fuerte' ? 'Fuerte' : 'Hass'}
                                </TableCell>
                                <TableCell>{item.box_type}</TableCell>
                                <TableCell>{formatSize(item.size)}</TableCell>
                                <TableCell>
                                  <Badge variant={item.grade === 'class1' ? 'default' : 'secondary'}>
                                    {item.grade === 'class1' ? 'Class 1' : 'Class 2'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {item.totalBoxes.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right font-bold">
                                  <div className="flex items-center justify-end gap-1">
                                    <Truck className="w-4 h-4 text-primary" />
                                    <span className="text-primary">{item.palletCount}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right text-sm text-muted-foreground">
                                  {item.remainingBoxes} boxes
                                </TableCell>
                              </TableRow>
                            ))}
                            
                            {/* Show items with no complete pallets */}
                            {noPalletData.length > 0 && (
                              <>
                                <TableRow className="border-t">
                                  <TableCell colSpan={7} className="py-2 bg-muted/20">
                                    <p className="text-xs text-center text-muted-foreground">
                                      Items accumulating boxes (no complete pallets yet)
                                    </p>
                                  </TableCell>
                                </TableRow>
                                {noPalletData.map((item, index) => {
                                  const boxesPerPallet = item.size === '4kg' ? 288 : 120;
                                  const progress = (item.totalBoxes / boxesPerPallet) * 100;
                                  
                                  return (
                                    <TableRow key={`accumulating-${index}`} className="opacity-70">
                                      <TableCell className="capitalize">
                                        {item.variety === 'fuerte' ? 'Fuerte' : 'Hass'}
                                      </TableCell>
                                      <TableCell>{item.box_type}</TableCell>
                                      <TableCell>{formatSize(item.size)}</TableCell>
                                      <TableCell>
                                        <Badge variant={item.grade === 'class1' ? 'default' : 'secondary'}>
                                          {item.grade === 'class1' ? 'Class 1' : 'Class 2'}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right font-medium">
                                        {item.totalBoxes.toLocaleString()}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <span className="text-muted-foreground">0</span>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex flex-col items-end">
                                          <span className="text-sm text-muted-foreground">
                                            {item.totalBoxes}/{boxesPerPallet} boxes
                                          </span>
                                          <div className="w-20 h-1 bg-gray-200 rounded-full overflow-hidden mt-1">
                                            <div 
                                              className="h-full bg-primary/50" 
                                              style={{ width: `${Math.min(progress, 100)}%` }}
                                            />
                                          </div>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </>
                            )}
                          </>
                        );
                      })()}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
            </div>
            </TabsContent>
            
            {/* Temperature Control Tab */}
            <TabsContent value="temperature" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Thermometer className="w-5 h-5" />
                      Temperature Logs
                    </CardTitle>
                    <CardDescription>
                      Temperature history for {selectedColdRoom === 'coldroom1' ? 'Cold Room 1' : 'Cold Room 2'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading.temperature ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4 mx-auto"></div>
                        <p className="text-muted-foreground">Loading temperature logs...</p>
                      </div>
                    ) : safeArray(temperatureLogs).filter(log => log.cold_room_id === selectedColdRoom).length === 0 ? (
                      <div className="text-center py-8 border rounded">
                        <Thermometer className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No temperature logs</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Record temperature every 12 hours
                        </p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date & Time</TableHead>
                              <TableHead>Temperature</TableHead>
                              <TableHead>Recorded By</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {safeArray(temperatureLogs)
                              .filter(log => log.cold_room_id === selectedColdRoom)
                              .map((log) => (
                                <TableRow key={log.id}>
                                  <TableCell>{formatDate(log.timestamp)}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Thermometer className="w-4 h-4" />
                                      <span className="font-medium">{safeToFixed(log.temperature)}°C</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>{log.recorded_by}</TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant={
                                        (selectedColdRoom === 'coldroom1' && log.temperature >= 3 && log.temperature <= 5) ||
                                        (selectedColdRoom === 'coldroom2' && log.temperature >= -20 && log.temperature <= -16)
                                          ? "outline" 
                                          : "destructive"
                                      }
                                    >
                                      {(
                                        (selectedColdRoom === 'coldroom1' && log.temperature >= 3 && log.temperature <= 5) ||
                                        (selectedColdRoom === 'coldroom2' && log.temperature >= -20 && log.temperature <= -16)
                                      ) ? 'Normal' : 'Alert'}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Snowflake className="w-5 h-5" />
                      Record Temperature
                    </CardTitle>
                    <CardDescription>
                      Record temperature every 12 hours
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="coldroom">Cold Room</Label>
                        <Select value={selectedColdRoom} onValueChange={setSelectedColdRoom}>
                          <SelectTrigger id="coldroom">
                            <SelectValue placeholder="Select cold room" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="coldroom1">Cold Room 1 (5°C)</SelectItem>
                            <SelectItem value="coldroom2">Cold Room 2 (5°C)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="temperature">Temperature (°C)</Label>
                        <Input
                          id="temperature"
                          type="number"
                          step="0.1"
                          value={temperature}
                          onChange={(e) => setTemperature(e.target.value)}
                          placeholder={
                            selectedColdRoom === 'coldroom1' 
                              ? "Enter temperature (3-5°C)" 
                              : "Enter temperature (-18°C)"
                          }
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Expected range: {selectedColdRoom === 'coldroom1' ? '5°C' : '5°C'}
                        </p>
                      </div>
                      
                      <Button
                        onClick={handleRecordTemperature}
                        className="w-full"
                        disabled={!temperature}
                      >
                        <Thermometer className="w-4 h-4 mr-2" />
                        Record Temperature
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Repacking Tab */}
            <TabsContent value="repacking" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <RefreshCw className="w-5 h-5" />
                      Repacking Records
                    </CardTitle>
                    <CardDescription>
                      History of repacking operations in {selectedColdRoom === 'coldroom1' ? 'Cold Room 1' : 'Cold Room 2'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading.repacking ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4 mx-auto"></div>
                        <p className="text-muted-foreground">Loading repacking records...</p>
                      </div>
                    ) : safeArray(repackingRecords).filter(record => record.cold_room_id === selectedColdRoom).length === 0 ? (
                      <div className="text-center py-8 border rounded">
                        <RefreshCw className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No repacking records</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Record repacking operations here
                        </p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date & Time</TableHead>
                              <TableHead>Removed Boxes</TableHead>
                              <TableHead>Returned Boxes</TableHead>
                              <TableHead>Processed By</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {safeArray(repackingRecords)
                              .filter(record => record.cold_room_id === selectedColdRoom)
                              .map((record) => {
                                const removedBoxes = safeArray(record.removed_boxes);
                                const returnedBoxes = safeArray(record.returned_boxes);
                                
                                return (
                                  <TableRow key={record.id}>
                                    <TableCell>{formatDate(record.timestamp)}</TableCell>
                                    <TableCell>
                                      <div className="space-y-1">
                                        {removedBoxes.map((box, idx) => (
                                          <div key={idx} className="text-xs bg-red-50 p-1 rounded text-green-600">
                                            <div className="flex items-center gap-1">
                                              <Minus className="w-3 h-3 text-green-700" />
                                              <span className="font-medium">{box.quantity}</span>
                                              <span className="capitalize">{box.variety}</span>
                                              <span>{box.boxType}</span>
                                              <span>{formatSize(box.size)}</span>
                                              <Badge variant={box.grade === 'class1' ? 'default' : 'secondary'} className="h-4 text-xs">
                                                {box.grade === 'class1' ? 'C1' : 'C2'}
                                              </Badge>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="space-y-1">
                                        {returnedBoxes.map((box, idx) => (
                                          <div key={idx} className="text-xs bg-green-50 p-1 rounded text-green-700">
                                            <div className="flex items-center gap-1">
                                              <Plus className="w-3 h-3 text-green-700" />
                                              <span className="font-medium">{box.quantity}</span>
                                              <span className="capitalize">{box.variety}</span>
                                              <span>{box.boxType}</span>
                                              <span>{formatSize(box.size)}</span>
                                              <Badge variant={box.grade === 'class1' ? 'default' : 'secondary'} className="h-4 text-xs">
                                                {box.grade === 'class1' ? 'C1' : 'C2'}
                                              </Badge>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </TableCell>
                                    <TableCell>{record.processed_by}</TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Weight className="w-5 h-5" />
                      Update Inventory (Repacking)
                    </CardTitle>
                    <CardDescription>
                      Remove or return boxes to update cold room inventory
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label>Cold Room</Label>
                        <Select value={selectedColdRoom} onValueChange={setSelectedColdRoom}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select cold room" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="coldroom1">Cold Room 1 (3-5°C)</SelectItem>
                            <SelectItem value="coldroom2">Cold Room 2 (-18°C)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Removed Boxes Section */}
                      <div className="border rounded p-4">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-red-600 font-medium">Remove Boxes from Inventory</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddRemovedBox}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Box Type
                          </Button>
                        </div>
                        
                        {safeArray(repackingForm.removedBoxes).length === 0 ? (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            No boxes marked for removal
                          </div>
                        ) : (
                          safeArray(repackingForm.removedBoxes).map((box, index) => (
                            <div key={index} className="border rounded p-3 mb-3 bg-black-50">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium text-red-700">Remove Box #{index + 1}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveRemovedBox(index)}
                                >
                                  <Minus className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                <div>
                                  <Label htmlFor={`removed-variety-${index}`}>Variety</Label>
                                  <Select
                                    value={box.variety}
                                    onValueChange={(value: 'fuerte' | 'hass') => 
                                      handleUpdateRemovedBox(index, 'variety', value)
                                    }
                                  >
                                    <SelectTrigger id={`removed-variety-${index}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="fuerte">Fuerte</SelectItem>
                                      <SelectItem value="hass">Hass</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div>
                                  <Label htmlFor={`removed-type-${index}`}>Box Type</Label>
                                  <Select
                                    value={box.boxType}
                                    onValueChange={(value: '4kg' | '10kg') => 
                                      handleUpdateRemovedBox(index, 'boxType', value)
                                    }
                                  >
                                    <SelectTrigger id={`removed-type-${index}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="4kg">4kg Box</SelectItem>
                                      <SelectItem value="10kg">10kg Crate</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                <div>
                                  <Label htmlFor={`removed-size-${index}`}>Size</Label>
                                  <Select
                                    value={box.size}
                                    onValueChange={(value) => 
                                      handleUpdateRemovedBox(index, 'size', value)
                                    }
                                  >
                                    <SelectTrigger id={`removed-size-${index}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {BOX_SIZES.map(size => (
                                        <SelectItem key={size} value={size}>
                                          {formatSize(size)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div>
                                  <Label htmlFor={`removed-grade-${index}`}>Grade</Label>
                                  <Select
                                    value={box.grade}
                                    onValueChange={(value: 'class1' | 'class2') => 
                                      handleUpdateRemovedBox(index, 'grade', value)
                                    }
                                  >
                                    <SelectTrigger id={`removed-grade-${index}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="class1">Class 1</SelectItem>
                                      <SelectItem value="class2">Class 2</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              
                              <div>
                                <Label htmlFor={`removed-quantity-${index}`}>Quantity to Remove</Label>
                                <Input
                                  id={`removed-quantity-${index}`}
                                  type="number"
                                  min="0"
                                  value={box.quantity}
                                  onChange={(e) => 
                                    handleUpdateRemovedBox(index, 'quantity', e.target.value)
                                  }
                                  placeholder="Number of boxes"
                                />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      
                      {/* Returned Boxes Section */}
                      <div className="border rounded p-4">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-green-600 font-medium">Return Boxes to Inventory</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddReturnedBox}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Box Type
                          </Button>
                        </div>
                        
                        {safeArray(repackingForm.returnedBoxes).length === 0 ? (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            No boxes marked for return
                          </div>
                        ) : (
                          safeArray(repackingForm.returnedBoxes).map((box, index) => (
                            <div key={index} className="border rounded p-3 mb-3 bg-black-50">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium text-green-700">Return Box #{index + 1}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveReturnedBox(index)}
                                >
                                  <Minus className="w-4 h-4 text-green-500" />
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                <div>
                                  <Label htmlFor={`returned-variety-${index}`}>Variety</Label>
                                  <Select
                                    value={box.variety}
                                    onValueChange={(value: 'fuerte' | 'hass') => 
                                      handleUpdateReturnedBox(index, 'variety', value)
                                    }
                                  >
                                    <SelectTrigger id={`returned-variety-${index}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="fuerte">Fuerte</SelectItem>
                                      <SelectItem value="hass">Hass</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div>
                                  <Label htmlFor={`returned-type-${index}`}>Box Type</Label>
                                  <Select
                                    value={box.boxType}
                                    onValueChange={(value: '4kg' | '10kg') => 
                                      handleUpdateReturnedBox(index, 'boxType', value)
                                    }
                                  >
                                    <SelectTrigger id={`returned-type-${index}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="4kg">4kg Box</SelectItem>
                                      <SelectItem value="10kg">10kg Crate</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                <div>
                                  <Label htmlFor={`returned-size-${index}`}>Size</Label>
                                  <Select
                                    value={box.size}
                                    onValueChange={(value) => 
                                      handleUpdateReturnedBox(index, 'size', value)
                                    }
                                  >
                                    <SelectTrigger id={`returned-size-${index}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {BOX_SIZES.map(size => (
                                        <SelectItem key={size} value={size}>
                                          {formatSize(size)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div>
                                  <Label htmlFor={`returned-grade-${index}`}>Grade</Label>
                                  <Select
                                    value={box.grade}
                                    onValueChange={(value: 'class1' | 'class2') => 
                                      handleUpdateReturnedBox(index, 'grade', value)
                                    }
                                  >
                                    <SelectTrigger id={`returned-grade-${index}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="class1">Class 1</SelectItem>
                                      <SelectItem value="class2">Class 2</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              
                              <div>
                                <Label htmlFor={`returned-quantity-${index}`}>Quantity to Return</Label>
                                <Input
                                  id={`returned-quantity-${index}`}
                                  type="number"
                                  min="0"
                                  value={box.quantity}
                                  onChange={(e) => 
                                    handleUpdateReturnedBox(index, 'quantity', e.target.value)
                                  }
                                  placeholder="Number of boxes"
                                />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          value={repackingForm.notes}
                          onChange={(e) => setRepackingForm(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Reason for repacking, quality issues, etc."
                          rows={3}
                        />
                      </div>
                      
                      <Button
                        onClick={handleRecordRepacking}
                        className="w-full"
                        disabled={
                          safeArray(repackingForm.removedBoxes).length === 0 && 
                          safeArray(repackingForm.returnedBoxes).length === 0
                        }
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Update Inventory (Repacking)
                      </Button>
                    </div>
                    
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Loading History Tab */}
            <TabsContent value="history" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Loading History
                  </CardTitle>
                  <CardDescription>
                    History of all boxes loaded into cold rooms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-black-50 p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-gray-500">Total Boxes Loaded</div>
                          <Package className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="text-2xl font-bold text-blue-700">
                          {loadingHistorySummary.totalBoxesLoaded.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">All time</div>
                      </div>
                      
                      <div className="bg-black-50 p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-gray-500">Unique Suppliers</div>
                          <Truck className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="text-2xl font-bold text-green-700">
                          {loadingHistorySummary.uniqueSuppliers}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Suppliers loaded</div>
                      </div>
                      
                      <div className="bg-black-50 p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-gray-500">Total Weight</div>
                          <Weight className="w-4 h-4 text-purple-500" />
                        </div>
                        <div className="text-2xl font-bold text-purple-700">
                          {safeToFixed(loadingHistorySummary.totalWeight)} kg
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Total loaded weight</div>
                      </div>
                    </div>
                    
                    {/* Search Filters */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Search Filters</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <Label htmlFor="dateFrom">From Date</Label>
                            <Input
                              id="dateFrom"
                              type="date"
                              value={historySearch.dateFrom}
                              onChange={(e) => setHistorySearch(prev => ({ ...prev, dateFrom: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="dateTo">To Date</Label>
                            <Input
                              id="dateTo"
                              type="date"
                              value={historySearch.dateTo}
                              onChange={(e) => setHistorySearch(prev => ({ ...prev, dateTo: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="supplierName">Supplier Name</Label>
                            <Input
                              id="supplierName"
                              value={historySearch.supplierName}
                              onChange={(e) => setHistorySearch(prev => ({ ...prev, supplierName: e.target.value }))}
                              placeholder="Search by supplier"
                            />
                          </div>
                          <div>
                            <Label htmlFor="coldRoomId">Cold Room</Label>
                            <Select
                              value={historySearch.coldRoomId}
                              onValueChange={(value) => setHistorySearch(prev => ({ ...prev, coldRoomId: value }))}
                            >
                              <SelectTrigger id="coldRoomId">
                                <SelectValue placeholder="All Cold Rooms" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Cold Rooms</SelectItem>
                                <SelectItem value="coldroom1">Cold Room 1</SelectItem>
                                <SelectItem value="coldroom2">Cold Room 2</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={searchLoadingHistory}
                            disabled={isLoading.loadingHistory}
                            className="flex-1"
                          >
                            <Search className="w-4 h-4 mr-2" />
                            Search History
                          </Button>
                          <Button
                            onClick={clearSearchFilters}
                            variant="outline"
                          >
                            <Filter className="w-4 h-4 mr-2" />
                            Clear Filters
                          </Button>
                          <Button
                            onClick={() => fetchLoadingHistory()}
                            variant="outline"
                            disabled={isLoading.loadingHistory}
                          >
                            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading.loadingHistory ? 'animate-spin' : ''}`} />
                            Refresh
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Export Buttons */}
                    <div className="flex justify-end gap-3">
                      <Button
                        onClick={handleDownloadCSV}
                        variant="outline"
                        disabled={loadingHistory.length === 0}
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export All to CSV
                      </Button>
                      <Button
                        onClick={handleDownloadFilteredCSV}
                        disabled={loadingHistory.length === 0}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <FileText className="w-4 h-4" />
                        Export Filtered with Summary
                      </Button>
                    </div>
                    
                    {/* History Table */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <Label>Loading History ({loadingHistory.length} records)</Label>
                        <Badge variant="outline">
                          {new Set(loadingHistory.map(record => {
                            const date = record.loading_date || record.created_at || '';
                            return date ? date.split('T')[0] : '';
                          }).filter(Boolean)).size} days
                        </Badge>
                      </div>
                      
                      {isLoading.loadingHistory ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4 mx-auto"></div>
                          <p className="text-muted-foreground">Loading history...</p>
                        </div>
                      ) : loadingHistory.length === 0 ? (
                        <div className="text-center py-8 border rounded">
                          <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                          <p className="text-gray-500 font-medium">No loading history found</p>
                          <p className="text-sm text-gray-400 mt-1">
                            Load boxes to cold rooms to see history here
                          </p>
                        </div>
                      ) : (
                        renderLoadingHistoryTable()
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}