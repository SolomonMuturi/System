'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Download,
  ChevronDown,
  ChevronUp,
  Grid,
  Boxes,
  Package2,
  Archive,
  AlertCircle,
  Info,
  Palette,
  Combine,
  Trash2,
  Eye,
  EyeOff,
  ListTree,
  Group,
  FileSpreadsheet,
  CalendarDays,
  Layers2,
  GitBranch,
  GitCommitVertical
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

interface ColdRoomBox {
  id: string;
  variety: 'fuerte' | 'hass';
  box_type: '4kg' | '10kg';
  size: string;
  grade: 'class1' | 'class2';
  quantity: number;
  cold_room_id: string;
  created_at: string;
  updated_at: string;
  supplier_name?: string;
  pallet_id?: string;
  region?: string;
  counting_record_id?: string;
  is_in_pallet?: boolean;
  converted_to_pallet_at?: string;
  loading_sheet_id?: string | null;
  converted_to_pallet_date?: string;
  original_box_count?: number;
}

interface Pallet {
  id: string;
  variety: string;
  box_type: string;
  size: string;
  grade: string;
  pallet_count: number;
  cold_room_id: string;
  pallet_name?: string;
  is_manual: boolean;
  created_at: string;
  last_updated: string;
  boxes?: ColdRoomBox[];
  total_boxes?: number;
  boxes_per_pallet: number;
  loading_sheet_id?: string | null;
  conversion_date?: string;
  original_box_ids?: string[];
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
  totalAvailableBoxes: number;
  totalAssignedBoxes: number;
}

interface CountingRecord {
  id: string;
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
  for_coldroom: boolean;
  status: string;
  boxes_loaded_to_coldroom?: any;
  total_boxes_loaded?: number;
  loading_progress_percentage?: number;
  remaining_boxes?: any;
  total_remaining_boxes?: number;
  has_remaining_boxes?: boolean;
  submitted_at: string;
  processed_by: string;
}

interface RepackingBoxForm {
  variety: 'fuerte' | 'hass';
  boxType: '4kg' | '10kg';
  size: string;
  grade: 'class1' | 'class2';
  quantity: number;
}

interface SizeGroup {
  size: string;
  variety: 'fuerte' | 'hass';
  boxType: '4kg' | '10kg';
  grade: 'class1' | 'class2';
  totalQuantity: number;
  coldRoomId: string;
  supplierName?: string;
  palletId?: string;
  region?: string;
  countingRecordId?: string;
  selectedForLoading: boolean;
  loadingQuantity: number;
  targetColdRoom: string;
  loadedQuantity: number;
  remainingQuantity: number;
  uniqueKey: string;
  loadingHistory: Array<{
    quantity: number;
    targetColdRoom: string;
    timestamp: string;
    date: string;
  }>;
}

interface BoxSelection {
  id: string;
  variety: 'fuerte' | 'hass';
  box_type: '4kg' | '10kg';
  size: string;
  grade: 'class1' | 'class2';
  quantity: number;
  maxQuantity: number;
  selectedQuantity: number;
  cold_room_id: string;
  supplier_name?: string;
  region?: string;
  is_selected: boolean;
  loading_sheet_id?: string | null;
  is_in_pallet?: boolean;
}

interface BoxGroup {
  size: string;
  variety: 'fuerte' | 'hass';
  box_type: '4kg' | '10kg';
  grade: 'class1' | 'class2';
  totalQuantity: number;
  cold_room_id: string;
  selectedQuantity: number;
  is_selected: boolean;
  boxes: BoxSelection[];
}

interface LoadingSheet {
  id: string;
  bill_number: string;
  client: string;
  container: string;
  loading_date: string;
  pallets: Array<{
    pallet_id?: string;
    quantity: number;
    box_type: string;
    variety: string;
    size: string;
    grade: string;
  }>;
  status: string;
}

interface PalletHistory {
  id: string;
  pallet_id: string;
  pallet_name: string;
  cold_room_id: string;
  conversion_date: string;
  box_type: string;
  variety: string;
  size: string;
  grade: string;
  boxes_converted: number;
  original_box_ids: string[];
  is_manual: boolean;
  created_at: string;
}

const BOX_SIZES = [
  'size32', 'size30', 'size28', 'size26', 'size24',
  'size22', 'size20', 'size18', 'size16', 'size14', 'size12'
];

const formatSize = (size: string) => {
  return size.replace('size', 'Size ');
};

const safeToFixed = (value: any, decimals: number = 1): string => {
  const num = Number(value);
  return isNaN(num) ? '0.'.padEnd(decimals + 2, '0') : num.toFixed(decimals);
};

const safeArray = <T,>(array: T[] | undefined | null): T[] => {
  return Array.isArray(array) ? array : [];
};

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

const formatDateForInput = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

const parseLoadedBoxesData = (loadedData: any): Record<string, number> => {
  if (!loadedData) return {};
  
  try {
    if (typeof loadedData === 'string') {
      loadedData = JSON.parse(loadedData);
    }
    
    if (typeof loadedData === 'object') {
      if (loadedData.loaded && typeof loadedData.loaded === 'object') {
        return loadedData.loaded;
      }
      return loadedData;
    }
    
    return {};
  } catch (error) {
    console.warn('Failed to parse loaded boxes data:', error);
    return {};
  }
};

const generateSizeGroupKey = (
  variety: string, 
  boxType: string, 
  size: string, 
  grade: string,
  countingRecordId?: string
): string => {
  const baseKey = `${variety}_${boxType}_${grade}_${size}`;
  return countingRecordId ? `${countingRecordId}_${baseKey}` : baseKey;
};

const saveBalanceData = (sizeGroups: SizeGroup[]) => {
  try {
    const balanceData = sizeGroups.map(group => ({
      uniqueKey: group.uniqueKey,
      loadedQuantity: group.loadedQuantity,
      remainingQuantity: group.remainingQuantity,
      loadingHistory: group.loadingHistory
    }));
    localStorage.setItem('coldRoomBalanceData', JSON.stringify(balanceData));
  } catch (error) {
    console.warn('Failed to save balance data to localStorage:', error);
  }
};

const loadBalanceData = (): Record<string, Partial<SizeGroup>> => {
  try {
    const saved = localStorage.getItem('coldRoomBalanceData');
    if (!saved) return {};
    
    const balanceData = JSON.parse(saved);
    const balanceMap: Record<string, Partial<SizeGroup>> = {};
    
    balanceData.forEach((item: any) => {
      balanceMap[item.uniqueKey] = {
        loadedQuantity: item.loadedQuantity || 0,
        remainingQuantity: item.remainingQuantity || 0,
        loadingHistory: item.loadingHistory || []
      };
    });
    
    return balanceMap;
  } catch (error) {
    console.warn('Failed to load balance data from localStorage:', error);
    return {};
  }
};

const clearBalanceData = () => {
  localStorage.removeItem('coldRoomBalanceData');
};

const checkForExistingBoxes = async (
  variety: string,
  boxType: string,
  size: string,
  grade: string,
  countingRecordId: string,
  coldRoomId: string
): Promise<{ exists: boolean; quantity: number }> => {
  try {
    const response = await fetch(`/api/cold-room?action=check-existing-boxes&variety=${variety}&boxType=${boxType}&size=${size}&grade=${grade}&countingRecordId=${countingRecordId}&coldRoomId=${coldRoomId}`);
    const result = await response.json();
    
    if (result.success) {
      return { exists: result.exists, quantity: result.quantity || 0 };
    }
    return { exists: false, quantity: 0 };
  } catch (error) {
    console.error('Error checking for existing boxes:', error);
    return { exists: false, quantity: 0 };
  }
};

const checkForExistingPallet = async (
  coldRoomId: string,
  boxGroups: Array<{
    variety: 'fuerte' | 'hass';
    boxType: '4kg' | '10kg';
    size: string;
    grade: 'class1' | 'class2';
    quantity: number;
  }>
): Promise<{ exists: boolean; palletId?: string; palletName?: string }> => {
  try {
    const response = await fetch(`/api/cold-room?action=check-existing-pallet&coldRoomId=${coldRoomId}&boxGroups=${JSON.stringify(boxGroups)}`);
    const result = await response.json();
    
    if (result.success) {
      return { 
        exists: result.exists, 
        palletId: result.palletId,
        palletName: result.palletName
      };
    }
    return { exists: false };
  } catch (error) {
    console.error('Error checking for existing pallet:', error);
    return { exists: false };
  }
};

export default function ColdRoomPage() {
  const { toast } = useToast();
  
  const [coldRooms, setColdRooms] = useState<Array<{
    id: string;
    name: string;
    current_temperature: number;
    capacity: number;
    occupied: number;
    available_capacity: number;
  }>>([]);
  
  const [coldRoomBoxes, setColdRoomBoxes] = useState<ColdRoomBox[]>([]);
  const [pallets, setPallets] = useState<Pallet[]>([]);
  const [palletHistory, setPalletHistory] = useState<PalletHistory[]>([]);
  const [temperatureLogs, setTemperatureLogs] = useState<TemperatureLog[]>([]);
  const [repackingRecords, setRepackingRecords] = useState<RepackingRecord[]>([]);
  const [coldRoomStats, setColdRoomStats] = useState<{
    overall: ColdRoomStats;
    coldroom1: ColdRoomStats;
    coldroom2: ColdRoomStats;
  } | null>(null);
  
  const [countingRecords, setCountingRecords] = useState<CountingRecord[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  
  const [loadingSheets, setLoadingSheets] = useState<LoadingSheet[]>([]);
  
  const [isLoading, setIsLoading] = useState({
    coldRooms: true,
    boxes: true,
    pallets: true,
    palletHistory: true,
    temperature: true,
    repacking: true,
    stats: true,
    countingRecords: true,
    loadingSheets: false,
    groupedBoxes: false,
  });
  
  const [selectedColdRoom, setSelectedColdRoom] = useState<string>('coldroom1');
  const [temperature, setTemperature] = useState<string>('');
  
  const [repackingForm, setRepackingForm] = useState<{
    removedBoxes: RepackingBoxForm[];
    returnedBoxes: RepackingBoxForm[];
    notes: string;
  }>({
    removedBoxes: [],
    returnedBoxes: [],
    notes: '',
  });
  
  const [sizeGroups, setSizeGroups] = useState<SizeGroup[]>([]);
  
  const [palletCreation, setPalletCreation] = useState<{
    palletName: string;
    coldRoomId: string;
    boxesPerPallet: number;
    selectedBoxes: BoxSelection[];
    boxGroups: BoxGroup[];
    showOnlyAvailable: boolean;
    viewMode: 'grouped' | 'individual';
  }>({
    palletName: '',
    coldRoomId: 'coldroom1',
    boxesPerPallet: 288,
    selectedBoxes: [],
    boxGroups: [],
    showOnlyAvailable: true,
    viewMode: 'grouped',
  });

  const [expandedPallets, setExpandedPallets] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('loading');
  const [palletCounts, setPalletCounts] = useState<{ [key: string]: number }>({});

  const fetchColdRooms = async () => {
    try {
      const response = await fetch('/api/cold-room?action=cold-rooms');
      
      if (!response.ok) {
        console.error('Error response from cold-room API:', response.status);
        setColdRooms([
          {
            id: 'coldroom1',
            name: 'Cold Room 1',
            current_temperature: 5,
            capacity: 100,
            occupied: 0,
            available_capacity: 0
          },
          {
            id: 'coldroom2',
            name: 'Cold Room 2',
            current_temperature: 5,
            capacity: 100,
            occupied: 0,
            available_capacity: 0
          }
        ]);
        return;
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setColdRooms(data);
      } else if (data && Array.isArray(data.data)) {
        setColdRooms(data.data);
      } else {
        setColdRooms([
          {
            id: 'coldroom1',
            name: 'Cold Room 1',
            current_temperature: 5,
            capacity: 100,
            occupied: 0,
            available_capacity: 0
          },
          {
            id: 'coldroom2',
            name: 'Cold Room 2',
            current_temperature: 5,
            capacity: 100,
            occupied: 0,
            available_capacity: 0
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
          occupied: 0,
          available_capacity: 0
        },
        {
          id: 'coldroom2',
          name: 'Cold Room 2',
          current_temperature: 5,
          capacity: 100,
          occupied: 0,
          available_capacity: 0
        }
      ]);
    } finally {
      setIsLoading(prev => ({ ...prev, coldRooms: false }));
    }
  };
  
  const fetchColdRoomBoxes = async () => {
    try {
      const response = await fetch('/api/cold-room?action=boxes');
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        const boxesData = result.data.map((box: any) => ({
          id: box.id,
          variety: box.variety,
          box_type: box.boxType || box.box_type,
          size: box.size,
          grade: box.grade,
          quantity: Number(box.quantity) || 0,
          cold_room_id: box.cold_room_id,
          created_at: box.created_at,
          updated_at: box.updated_at,
          supplier_name: box.supplier_name,
          pallet_id: box.pallet_id,
          region: box.region,
          counting_record_id: box.counting_record_id,
          is_in_pallet: box.is_in_pallet || false,
          converted_to_pallet_at: box.converted_to_pallet_at,
          loading_sheet_id: box.loading_sheet_id || null,
          converted_to_pallet_date: box.converted_to_pallet_date,
          original_box_count: box.original_box_count || 0
        }));
        setColdRoomBoxes(boxesData);
      } else {
        setColdRoomBoxes([]);
      }
    } catch (error) {
      console.error('Error fetching cold room boxes:', error);
      setColdRoomBoxes([]);
    } finally {
      setIsLoading(prev => ({ ...prev, boxes: false }));
    }
  };

  const fetchGroupedBoxes = async () => {
    try {
      setIsLoading(prev => ({ ...prev, groupedBoxes: true }));
      const response = await fetch(`/api/cold-room?action=grouped-boxes&coldRoomId=${palletCreation.coldRoomId}&showOnlyAvailable=${palletCreation.showOnlyAvailable}`);
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        const groups: BoxGroup[] = result.data.map((group: any) => ({
          size: group.size,
          variety: group.variety,
          box_type: group.box_type,
          grade: group.grade,
          totalQuantity: group.totalQuantity,
          cold_room_id: group.cold_room_id,
          selectedQuantity: 0,
          is_selected: false,
          boxes: group.boxes.map((box: any) => ({
            id: box.id,
            variety: box.variety,
            box_type: box.box_type,
            size: box.size,
            grade: box.grade,
            quantity: box.quantity,
            maxQuantity: box.quantity,
            selectedQuantity: 0,
            cold_room_id: box.cold_room_id,
            supplier_name: box.supplier_name,
            region: box.region,
            is_selected: false,
            loading_sheet_id: box.loading_sheet_id,
            is_in_pallet: box.is_in_pallet
          }))
        }));
        
        setPalletCreation(prev => ({ ...prev, boxGroups: groups }));
      } else {
        setPalletCreation(prev => ({ ...prev, boxGroups: [] }));
      }
    } catch (error) {
      console.error('Error fetching grouped boxes:', error);
      setPalletCreation(prev => ({ ...prev, boxGroups: [] }));
    } finally {
      setIsLoading(prev => ({ ...prev, groupedBoxes: false }));
    }
  };

  const fetchPallets = async () => {
    try {
      const response = await fetch('/api/cold-room?action=pallets');
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        const palletsData = await Promise.all(
          result.data.map(async (pallet: any) => {
            let boxes: ColdRoomBox[] = [];
            try {
              const boxesResponse = await fetch(`/api/cold-room?action=pallet-boxes&palletId=${pallet.id}`);
              const boxesResult = await boxesResponse.json();
              
              if (boxesResult.success && Array.isArray(boxesResult.data)) {
                boxes = boxesResult.data.map((box: any) => ({
                  id: box.id,
                  variety: box.variety,
                  box_type: box.boxType || box.box_type,
                  size: box.size,
                  grade: box.grade,
                  quantity: Number(box.quantity) || 0,
                  cold_room_id: box.cold_room_id,
                  created_at: box.created_at,
                  updated_at: box.updated_at,
                  supplier_name: box.supplier_name,
                  pallet_id: box.pallet_id,
                  region: box.region,
                  counting_record_id: box.counting_record_id,
                  is_in_pallet: box.is_in_pallet || false,
                  converted_to_pallet_at: box.converted_to_pallet_at,
                  loading_sheet_id: box.loading_sheet_id || null,
                  converted_to_pallet_date: box.converted_to_pallet_date,
                  original_box_count: box.original_box_count || 0
                }));
              }
            } catch (error) {
              console.warn(`Could not fetch boxes for pallet ${pallet.id}:`, error);
            }
            
            const totalBoxes = boxes.reduce((sum: number, box: ColdRoomBox) => sum + (box.quantity || 0), 0);
            
            return {
              id: pallet.id,
              variety: pallet.variety,
              box_type: pallet.boxType || pallet.box_type,
              size: pallet.size,
              grade: pallet.grade,
              pallet_count: Number(pallet.pallet_count) || 0,
              cold_room_id: pallet.cold_room_id,
              pallet_name: pallet.pallet_name,
              is_manual: pallet.is_manual || false,
              created_at: pallet.created_at,
              last_updated: pallet.last_updated,
              boxes: boxes,
              total_boxes: totalBoxes,
              boxes_per_pallet: pallet.boxes_per_pallet || (pallet.box_type === '10kg' ? 120 : 288),
              loading_sheet_id: pallet.loading_sheet_id || null,
              conversion_date: pallet.conversion_date || pallet.created_at,
              original_box_ids: pallet.original_box_ids || []
            };
          })
        );
        
        setPallets(palletsData);
      } else {
        setPallets([]);
      }
    } catch (error) {
      console.error('Error fetching pallets:', error);
      setPallets([]);
    } finally {
      setIsLoading(prev => ({ ...prev, pallets: false }));
    }
  };

  const fetchPalletHistory = async () => {
    try {
      const response = await fetch('/api/cold-room?action=pallet-history');
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        setPalletHistory(result.data);
      } else {
        setPalletHistory([]);
      }
    } catch (error) {
      console.error('Error fetching pallet history:', error);
      setPalletHistory([]);
    } finally {
      setIsLoading(prev => ({ ...prev, palletHistory: false }));
    }
  };

  const fetchTemperatureLogs = async () => {
    try {
      const response = await fetch('/api/cold-room?action=temperature');
      const result = await response.json();
      
      if (result.success) {
        setTemperatureLogs(result.data || []);
      } else {
        setTemperatureLogs([]);
      }
    } catch (error) {
      console.error('Error fetching temperature logs:', error);
      setTemperatureLogs([]);
    } finally {
      setIsLoading(prev => ({ ...prev, temperature: false }));
    }
  };
  
  const fetchRepackingRecords = async () => {
    try {
      const response = await fetch('/api/cold-room?action=repacking');
      const result = await response.json();
      
      if (result.success) {
        setRepackingRecords(result.data || []);
      } else {
        setRepackingRecords([]);
      }
    } catch (error) {
      console.error('Error fetching repacking records:', error);
      setRepackingRecords([]);
    } finally {
      setIsLoading(prev => ({ ...prev, repacking: false }));
    }
  };
  
  const fetchColdRoomStats = async () => {
    try {
      const response = await fetch('/api/cold-room?action=stats');
      const result = await response.json();
      
      if (result.success) {
        setColdRoomStats(result.data);
      } else {
        setColdRoomStats(null);
      }
    } catch (error) {
      console.error('Error fetching cold room stats:', error);
      setColdRoomStats(null);
    } finally {
      setIsLoading(prev => ({ ...prev, stats: false }));
    }
  };
  
  const fetchCountingRecords = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, countingRecords: true }));
    try {
      const response = await fetch('/api/cold-room?action=remaining-boxes');
      const result = await response.json();
      
      if (result.success) {
        const records = safeArray(result.data);
        
        const processedRecords = records.map((record: any) => {
          let counting_data = record.counting_data;
          if (typeof counting_data === 'string') {
            try {
              counting_data = JSON.parse(counting_data);
            } catch (e) {
              counting_data = {};
            }
          }
          
          let totals = record.totals;
          if (typeof totals === 'string') {
            try {
              totals = JSON.parse(totals);
            } catch (e) {
              totals = {};
            }
          }
          
          let boxes_loaded_to_coldroom = record.boxes_loaded_to_coldroom;
          if (boxes_loaded_to_coldroom) {
            boxes_loaded_to_coldroom = parseLoadedBoxesData(boxes_loaded_to_coldroom);
          } else {
            boxes_loaded_to_coldroom = {};
          }
          
          const remaining_boxes = record.remaining_boxes || {};
          const total_remaining_boxes = record.total_remaining_boxes || 0;
          const has_remaining_boxes = record.has_remaining_boxes || false;
          
          let totalOriginalBoxes = 0;
          Object.keys(counting_data).forEach(key => {
            if ((key.includes('fuerte_') || key.includes('hass_')) && 
                (key.includes('_4kg_') || key.includes('_10kg_'))) {
              totalOriginalBoxes += Number(counting_data[key]) || 0;
            }
          });
          
          const loadedBoxes = totalOriginalBoxes - total_remaining_boxes;
          const loading_progress_percentage = totalOriginalBoxes > 0 
            ? Math.min(100, Math.round((loadedBoxes / totalOriginalBoxes) * 100))
            : 0;
          
          return {
            ...record,
            counting_data,
            totals,
            boxes_loaded_to_coldroom,
            remaining_boxes,
            total_remaining_boxes,
            has_remaining_boxes,
            total_boxes_loaded: loadedBoxes,
            loading_progress_percentage: loading_progress_percentage,
            should_show: has_remaining_boxes
          };
        }).filter(record => record.should_show);
        
        setCountingRecords(processedRecords);
      } else {
        setCountingRecords([]);
      }
    } catch (error) {
      console.error('Error fetching counting records:', error);
      setCountingRecords([]);
    } finally {
      setIsLoading(prev => ({ ...prev, countingRecords: false }));
    }
  }, [toast]);
  
  const fetchLoadingSheets = async () => {
    try {
      setIsLoading(prev => ({ ...prev, loadingSheets: true }));
      
      const response = await fetch(`/api/loading-sheets?coldRoomId=${selectedColdRoom}&status=active`);
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        setLoadingSheets(result.data);
      } else {
        setLoadingSheets([]);
      }
    } catch (error) {
      console.error('Error fetching loading sheets:', error);
      setLoadingSheets([]);
    } finally {
      setIsLoading(prev => ({ ...prev, loadingSheets: false }));
    }
  };
  
  const fetchAllData = async () => {
    try {
      setIsLoading({
        coldRooms: true,
        boxes: true,
        pallets: true,
        palletHistory: true,
        temperature: true,
        repacking: true,
        stats: true,
        countingRecords: true,
        loadingSheets: false,
        groupedBoxes: false,
      });
      
      await Promise.allSettled([
        fetchColdRooms(),
        fetchColdRoomBoxes(),
        fetchPallets(),
        fetchPalletHistory(),
        fetchTemperatureLogs(),
        fetchRepackingRecords(),
        fetchColdRoomStats(),
        fetchCountingRecords(),
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
  
  const calculateAvailableBoxes = (boxes: ColdRoomBox[]) => {
    return boxes.filter(box => 
      !box.loading_sheet_id && 
      !box.is_in_pallet
    );
  };

  const calculateAvailablePallets = (pallets: Pallet[]) => {
    return pallets.filter(pallet => !pallet.loading_sheet_id);
  };

  const calculateRealTimeStats = () => {
    const availableBoxes = calculateAvailableBoxes(coldRoomBoxes);
    const availablePallets = calculateAvailablePallets(pallets);
    
    const totalAvailableBoxes = availableBoxes.reduce((sum, box) => sum + (box.quantity || 0), 0);
    const totalAssignedBoxes = coldRoomBoxes
      .filter(box => box.loading_sheet_id || box.is_in_pallet)
      .reduce((sum, box) => sum + (box.quantity || 0), 0);
    
    const boxesInPallets = coldRoomBoxes
      .filter(box => box.is_in_pallet)
      .reduce((sum, box) => sum + (box.quantity || 0), 0);
    
    const palletsAssigned = pallets.filter(pallet => pallet.loading_sheet_id).length;
    
    const boxesInAssignedPallets = pallets
      .filter(pallet => pallet.loading_sheet_id)
      .reduce((sum, pallet) => sum + (pallet.total_boxes || 0), 0);
    
    return {
      totalAvailableBoxes,
      totalAssignedBoxes,
      availableBoxes,
      availablePallets,
      boxesInPallets,
      palletsAssigned,
      boxesInAssignedPallets,
      totalBoxesInColdRoom: coldRoomBoxes.reduce((sum, box) => sum + (box.quantity || 0), 0)
    };
  };

  const processSizeGroups = useCallback(() => {
    if (countingRecords.length === 0) {
      setSizeGroups([]);
      return;
    }
    
    const selectedRecordIds = Array.from(selectedRecords);
    const selectedRecordsData = countingRecords.filter(record => selectedRecordIds.includes(record.id));
    
    if (selectedRecordsData.length === 0) {
      setSizeGroups([]);
      return;
    }
    
    const savedBalanceData = loadBalanceData();
    const sizeGroupMap: Record<string, SizeGroup> = {};
    
    selectedRecordsData.forEach(record => {
      const countingData = record.counting_data || {};
      const remainingBoxes = record.remaining_boxes || {};
      
      Object.keys(remainingBoxes).forEach(boxKey => {
        const quantity = Number(remainingBoxes[boxKey]) || 0;
        
        if (quantity > 0) {
          const parts = boxKey.split('_');
          if (parts.length >= 4) {
            const variety = parts[0] as 'fuerte' | 'hass';
            const boxType = parts[1] as '4kg' | '10kg';
            const grade = parts[2] as 'class1' | 'class2';
            let size = parts.slice(3).join('_');
            
            if (!size.startsWith('size') && /^\d+$/.test(size)) {
              size = `size${size}`;
            }
            
            let originalQuantity = 0;
            Object.keys(countingData).forEach(key => {
              if (key.includes(`${variety}_${boxType}_${grade}_`)) {
                const keySize = key.replace(`${variety}_${boxType}_${grade}_`, '');
                if (keySize === size || `size${keySize}` === size) {
                  originalQuantity = Number(countingData[key]) || 0;
                }
              }
            });
            
            const uniqueKey = generateSizeGroupKey(variety, boxType, size, grade, record.id);
            
            const savedBalance = savedBalanceData[uniqueKey];
            
            let alreadyLoadedForThisGroup = 0;
            let loadingHistory: Array<{
              quantity: number;
              targetColdRoom: string;
              timestamp: string;
              date: string;
            }> = [];
            
            if (savedBalance) {
              alreadyLoadedForThisGroup = savedBalance.loadedQuantity || 0;
              loadingHistory = savedBalance.loadingHistory || [];
            }
            
            const remainingQuantity = Math.max(0, quantity - alreadyLoadedForThisGroup);
            
            if (!sizeGroupMap[uniqueKey]) {
              sizeGroupMap[uniqueKey] = {
                size,
                variety,
                boxType,
                grade,
                totalQuantity: originalQuantity,
                coldRoomId: '',
                supplierName: record.supplier_name,
                palletId: record.pallet_id,
                region: record.region,
                countingRecordId: record.id,
                selectedForLoading: false,
                loadingQuantity: 0,
                targetColdRoom: 'coldroom1',
                loadedQuantity: alreadyLoadedForThisGroup,
                remainingQuantity: remainingQuantity,
                uniqueKey: uniqueKey,
                loadingHistory: loadingHistory
              };
            }
            
            sizeGroupMap[uniqueKey].totalQuantity = originalQuantity;
            sizeGroupMap[uniqueKey].remainingQuantity = Math.max(
              0, 
              sizeGroupMap[uniqueKey].totalQuantity - sizeGroupMap[uniqueKey].loadedQuantity
            );
          }
        }
      });
    });
    
    const sizeGroupsArray = Object.values(sizeGroupMap).sort((a, b) => {
      if (b.remainingQuantity !== a.remainingQuantity) {
        return b.remainingQuantity - a.remainingQuantity;
      }
      return a.size.localeCompare(b.size);
    });

    setSizeGroups(sizeGroupsArray);
    saveBalanceData(sizeGroupsArray);

  }, [selectedRecords, countingRecords]);

  useEffect(() => {
    processSizeGroups();
  }, [selectedRecords, countingRecords, processSizeGroups]);

  useEffect(() => {
    if (activeTab === 'inventory' || activeTab === 'pallets') {
      fetchLoadingSheets();
    }
  }, [selectedColdRoom, activeTab]);

  useEffect(() => {
    if (activeTab === 'pallets') {
      fetchGroupedBoxes();
    }
  }, [palletCreation.coldRoomId, palletCreation.showOnlyAvailable, activeTab]);

  const handleToggleGroupSelection = (index: number) => {
    setPalletCreation(prev => {
      const updatedGroups = [...prev.boxGroups];
      const group = updatedGroups[index];
      
      const newSelected = !group.is_selected;
      group.is_selected = newSelected;
      group.selectedQuantity = newSelected ? group.totalQuantity : 0;
      
      // Update individual boxes
      group.boxes.forEach(box => {
        box.is_selected = newSelected;
        box.selectedQuantity = newSelected ? box.quantity : 0;
      });
      
      return { ...prev, boxGroups: updatedGroups };
    });
  };

  const handleGroupQuantityChange = (index: number, quantity: number) => {
    setPalletCreation(prev => {
      const updatedGroups = [...prev.boxGroups];
      const group = updatedGroups[index];
      
      const validQuantity = Math.max(0, Math.min(quantity, group.totalQuantity));
      group.selectedQuantity = validQuantity;
      group.is_selected = validQuantity > 0;
      
      // Distribute quantity among individual boxes
      let remainingQty = validQuantity;
      group.boxes.forEach(box => {
        if (remainingQty <= 0) {
          box.is_selected = false;
          box.selectedQuantity = 0;
        } else if (box.quantity <= remainingQty) {
          box.is_selected = true;
          box.selectedQuantity = box.quantity;
          remainingQty -= box.quantity;
        } else {
          box.is_selected = true;
          box.selectedQuantity = remainingQty;
          remainingQty = 0;
        }
      });
      
      return { ...prev, boxGroups: updatedGroups };
    });
  };

  const handleSelectAllGroups = (type: 'fuerte' | 'hass' | 'all') => {
    setPalletCreation(prev => {
      const updatedGroups = prev.boxGroups.map(group => {
        const shouldSelect = type === 'all' || 
          (type === 'fuerte' && group.variety === 'fuerte') || 
          (type === 'hass' && group.variety === 'hass');
        
        if (shouldSelect) {
          return {
            ...group,
            is_selected: true,
            selectedQuantity: group.totalQuantity,
            boxes: group.boxes.map(box => ({
              ...box,
              is_selected: true,
              selectedQuantity: box.quantity
            }))
          };
        }
        return group;
      });
      
      return { ...prev, boxGroups: updatedGroups };
    });
  };

  const handleClearAllSelections = () => {
    setPalletCreation(prev => {
      const updatedGroups = prev.boxGroups.map(group => ({
        ...group,
        is_selected: false,
        selectedQuantity: 0,
        boxes: group.boxes.map(box => ({
          ...box,
          is_selected: false,
          selectedQuantity: 0
        }))
      }));
      
      return { ...prev, boxGroups: updatedGroups };
    });
  };

  const calculateSelectedGroupsSummary = () => {
    const selectedGroups = palletCreation.boxGroups.filter(group => group.is_selected && group.selectedQuantity > 0);
    
    const totalBoxes = selectedGroups.reduce((sum, group) => sum + group.selectedQuantity, 0);
    const totalWeight = selectedGroups.reduce((sum, group) => {
      const boxWeight = group.box_type === '4kg' ? 4 : 10;
      return sum + (group.selectedQuantity * boxWeight);
    }, 0);
    
    // Group by variety and size
    const varietySizeGroups: Record<string, {
      variety: string;
      size: string;
      totalQuantity: number;
      groups: BoxGroup[];
    }> = {};
    
    selectedGroups.forEach(group => {
      const key = `${group.variety}_${group.size}`;
      if (!varietySizeGroups[key]) {
        varietySizeGroups[key] = {
          variety: group.variety,
          size: group.size,
          totalQuantity: 0,
          groups: []
        };
      }
      varietySizeGroups[key].totalQuantity += group.selectedQuantity;
      varietySizeGroups[key].groups.push(group);
    });
    
    // Calculate pallet counts for each box type
    const boxTypeSummary: { [key: string]: { totalBoxes: number, pallets: number, remaining: number } } = {};
    
    selectedGroups.forEach(group => {
      if (!boxTypeSummary[group.box_type]) {
        boxTypeSummary[group.box_type] = { totalBoxes: 0, pallets: 0, remaining: 0 };
      }
      boxTypeSummary[group.box_type].totalBoxes += group.selectedQuantity;
    });
    
    // Calculate pallets for each type
    Object.keys(boxTypeSummary).forEach(type => {
      const standardBoxesPerPallet = type === '4kg' ? 288 : 120;
      boxTypeSummary[type].pallets = Math.floor(boxTypeSummary[type].totalBoxes / standardBoxesPerPallet);
      boxTypeSummary[type].remaining = boxTypeSummary[type].totalBoxes % standardBoxesPerPallet;
    });
    
    const suggestedPallets = Math.ceil(totalBoxes / palletCreation.boxesPerPallet);
    
    return {
      totalBoxes,
      totalWeight,
      boxesPerPallet: palletCreation.boxesPerPallet,
      suggestedPallets,
      isAtLeastOneBox: totalBoxes > 0,
      boxTypeSummary,
      varietySizeGroups: Object.values(varietySizeGroups),
      selectedGroups: selectedGroups.map(group => ({
        size: group.size,
        variety: group.variety,
        box_type: group.box_type,
        grade: group.grade,
        quantity: group.selectedQuantity,
        cold_room_id: group.cold_room_id,
        supplierName: group.boxes[0]?.supplier_name || 'Unknown Supplier',
        region: group.boxes[0]?.region || '',
        countingRecordId: group.boxes[0]?.counting_record_id || null
      }))
    };
  };

  const calculatePalletCounts = () => {
    const summary = calculateSelectedGroupsSummary();
    setPalletCounts({});
    
    if (!summary.isAtLeastOneBox) return;
    
    const counts: { [key: string]: number } = {};
    
    // Group by box type
    const boxTypes = ['4kg', '10kg'];
    
    boxTypes.forEach(type => {
      const boxesOfType = palletCreation.boxGroups
        .filter(group => group.is_selected && group.selectedQuantity > 0 && group.box_type === type)
        .reduce((sum, group) => sum + group.selectedQuantity, 0);
      
      if (boxesOfType > 0) {
        const boxesPerPallet = type === '4kg' ? 288 : 120;
        const fullPallets = Math.floor(boxesOfType / boxesPerPallet);
        const remainingBoxes = boxesOfType % boxesPerPallet;
        
        counts[type] = fullPallets;
        
        if (remainingBoxes > 0) {
          counts[`${type}_remaining`] = remainingBoxes;
        }
      }
    });
    
    setPalletCounts(counts);
  };

  useEffect(() => {
    calculatePalletCounts();
  }, [palletCreation.boxGroups]);

  const handleCreateManualPallet = async () => {
    const summary = calculateSelectedGroupsSummary();
    
    if (summary.totalBoxes === 0) {
      toast({
        title: 'No boxes selected',
        description: 'Please select at least one box to create a pallet',
        variant: 'destructive',
      });
      return;
    }

    if (!palletCreation.palletName.trim()) {
      toast({
        title: 'Pallet name required',
        description: 'Please enter a name for the pallet',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Check for duplicate pallet
      const duplicateCheck = await checkForExistingPallet(
        palletCreation.coldRoomId,
        summary.selectedGroups
      );

      if (duplicateCheck.exists) {
        toast({
          title: 'Duplicate Pallet Detected',
          description: (
            <div className="space-y-2">
              <p>A pallet with the exact same box combination already exists:</p>
              <div className="bg-amber-50 p-3 rounded border border-amber-200">
                <p className="font-medium text-amber-800">
                  "{duplicateCheck.palletName}"
                </p>
                <p className="text-sm text-amber-600">
                  Pallet ID: {duplicateCheck.palletId}
                </p>
              </div>
              <p className="text-sm text-gray-600">
                To avoid duplicates, please modify your selection or use the existing pallet.
              </p>
            </div>
          ),
          variant: 'destructive',
          duration: 10000,
        });
        return;
      }

      const response = await fetch('/api/cold-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create-manual-pallet',
          palletName: palletCreation.palletName,
          coldRoomId: palletCreation.coldRoomId,
          boxes: summary.selectedGroups,
          boxesPerPallet: palletCreation.boxesPerPallet,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: '✅ Pallet Created Successfully!',
          description: (
            <div className="space-y-2">
              <p>Pallet "{palletCreation.palletName}" created with {summary.totalBoxes} boxes</p>
              <div className="text-sm text-gray-600">
                {Object.entries(summary.boxTypeSummary).map(([type, stats]) => (
                  <div key={type}>
                    {type}: {stats.pallets} pallet{stats.pallets !== 1 ? 's' : ''} 
                    {stats.remaining > 0 && ` + ${stats.remaining} box${stats.remaining !== 1 ? 'es' : ''}`}
                  </div>
                ))}
              </div>
              <div className="text-xs text-green-600 mt-2">
                ✅ No duplicates detected - This is a unique pallet combination
              </div>
            </div>
          ),
        });

        // Reset form
        setPalletCreation({
          palletName: '',
          coldRoomId: 'coldroom1',
          boxesPerPallet: 288,
          selectedBoxes: [],
          boxGroups: [],
          showOnlyAvailable: true,
          viewMode: 'grouped',
        });

        // Refresh data
        await Promise.allSettled([
          fetchColdRoomBoxes(),
          fetchPallets(),
          fetchPalletHistory(),
          fetchColdRoomStats(),
          fetchGroupedBoxes(),
        ]);

      } else {
        if (result.status === 409) {
          // Duplicate pallet error from server
          toast({
            title: 'Duplicate Pallet Detected',
            description: (
              <div className="space-y-2">
                <p>{result.error}</p>
                <div className="bg-amber-50 p-3 rounded border border-amber-200">
                  <p className="text-sm text-amber-600">
                    Pallet ID: {result.palletId}
                  </p>
                </div>
              </div>
            ),
            variant: 'destructive',
            duration: 10000,
          });
        } else {
          throw new Error(result.error || 'Failed to create pallet');
        }
      }
    } catch (error: any) {
      console.error('Error creating manual pallet:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create pallet',
        variant: 'destructive',
      });
    }
  };

  const handleDissolvePallet = async (palletId: string, coldRoomId: string) => {
    try {
      const pallet = pallets.find(p => p.id === palletId);
      if (pallet?.loading_sheet_id) {
        toast({
          title: 'Cannot dissolve pallet',
          description: 'This pallet is assigned to a loading sheet. Remove it from the loading sheet first.',
          variant: 'destructive',
        });
        return;
      }

      if (!confirm('Are you sure you want to dissolve this pallet? Boxes will be returned to available inventory.')) {
        return;
      }

      const response = await fetch('/api/cold-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'dissolve-pallet',
          palletId,
          coldRoomId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: '✅ Pallet Dissolved',
          description: `${result.data.boxesReturned} boxes returned to available inventory`,
        });

        // Refresh data
        await Promise.allSettled([
          fetchColdRoomBoxes(),
          fetchPallets(),
          fetchPalletHistory(),
          fetchColdRoomStats(),
          fetchGroupedBoxes(),
        ]);

      } else {
        throw new Error(result.error || 'Failed to dissolve pallet');
      }
    } catch (error: any) {
      console.error('Error dissolving pallet:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to dissolve pallet',
        variant: 'destructive',
      });
    }
  };

  const handleTogglePalletExpansion = (palletId: string) => {
    const newExpanded = new Set(expandedPallets);
    if (newExpanded.has(palletId)) {
      newExpanded.delete(palletId);
    } else {
      newExpanded.add(palletId);
    }
    setExpandedPallets(newExpanded);
  };

  const handleToggleRecordSelection = (recordId: string) => {
    const newSelected = new Set(selectedRecords);
    if (newSelected.has(recordId)) {
      newSelected.delete(recordId);
    } else {
      newSelected.add(recordId);
    }
    setSelectedRecords(newSelected);
  };
  
  const handleSelectAllRecords = () => {
    const allIds = new Set(countingRecords.map(record => record.id));
    setSelectedRecords(allIds);
  };
  
  const handleDeselectAllRecords = () => {
    setSelectedRecords(new Set());
  };
  
  const handleToggleSizeGroupSelection = (index: number) => {
    const updatedGroups = [...sizeGroups];
    const group = updatedGroups[index];
    
    if (!group.selectedForLoading && group.remainingQuantity === 0) {
      toast({
        title: 'No boxes available',
        description: `No remaining boxes for ${formatSize(group.size)} ${group.variety} ${group.boxType}`,
        variant: 'destructive',
      });
      return;
    }
    
    group.selectedForLoading = !group.selectedForLoading;
    group.loadingQuantity = group.selectedForLoading ? group.remainingQuantity : 0;
    setSizeGroups(updatedGroups);
  };
  
  const handleSizeGroupQuantityChange = (index: number, quantity: number) => {
    const updatedGroups = [...sizeGroups];
    const group = updatedGroups[index];
    
    const maxQuantity = group.remainingQuantity;
    
    if (quantity >= 0 && quantity <= maxQuantity) {
      group.loadingQuantity = quantity;
    } else if (quantity > maxQuantity) {
      group.loadingQuantity = maxQuantity;
      toast({
        title: 'Quantity adjusted',
        description: `Cannot load more than ${maxQuantity} remaining boxes`,
        variant: 'destructive',
      });
    }
    
    setSizeGroups(updatedGroups);
  };
  
  const handleSizeGroupTargetChange = (index: number, coldRoomId: string) => {
    const updatedGroups = [...sizeGroups];
    updatedGroups[index].targetColdRoom = coldRoomId;
    setSizeGroups(updatedGroups);
  };
  
  const handleLoadSizeGroups = async () => {
    const selectedGroups = sizeGroups.filter(group => group.selectedForLoading && group.loadingQuantity > 0);
    
    if (selectedGroups.length === 0) {
      toast({
        title: 'No boxes selected',
        description: 'Please select at least one size group with quantity to load',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const duplicateChecks = await Promise.all(
        selectedGroups.map(async (group) => {
          const existingCheck = await checkForExistingBoxes(
            group.variety,
            group.boxType,
            group.size,
            group.grade,
            group.countingRecordId || '',
            group.targetColdRoom
          );
          
          return {
            group,
            existingCheck,
            isDuplicate: existingCheck.exists && existingCheck.quantity >= group.loadingQuantity
          };
        })
      );
      
      const validGroups = duplicateChecks.filter(check => !check.isDuplicate);
      const duplicateGroups = duplicateChecks.filter(check => check.isDuplicate);
      
      if (duplicateGroups.length > 0) {
        toast({
          title: '⚠️ Duplicate Boxes Detected',
          description: `${duplicateGroups.length} size groups already exist in cold room. Skipping duplicates.`,
          variant: 'destructive',
        });
      }
      
      if (validGroups.length === 0) {
        toast({
          title: 'No new boxes to load',
          description: 'All selected boxes already exist in the cold room',
          variant: 'destructive',
        });
        return;
      }
      
      const boxesData: any[] = [];
      const countingRecordIds = new Set<string>();
      const balanceUpdates: Record<string, { loaded: number, remaining: number }> = {};
      
      validGroups.forEach(({ group }) => {
        if (group.loadingQuantity > 0 && group.loadingQuantity <= group.remainingQuantity) {
          boxesData.push({
            variety: group.variety,
            boxType: group.boxType,
            size: group.size,
            grade: group.grade,
            quantity: group.loadingQuantity,
            coldRoomId: group.targetColdRoom,
            supplierName: group.supplierName || 'Unknown Supplier',
            palletId: null,
            region: group.region || '',
            countingRecordId: group.countingRecordId,
            loadedBy: 'Warehouse Staff',
            loading_sheet_id: null,
            is_in_pallet: false
          });
          
          if (group.countingRecordId) {
            countingRecordIds.add(group.countingRecordId);
          }
          
          balanceUpdates[group.uniqueKey] = {
            loaded: group.loadedQuantity + group.loadingQuantity,
            remaining: group.remainingQuantity - group.loadingQuantity
          };
        }
      });
      
      const response = await fetch('/api/cold-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'load-boxes',
          boxesData: boxesData,
          countingRecordIds: Array.from(countingRecordIds),
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        const totalBoxes = validGroups.reduce((sum, { group }) => sum + group.loadingQuantity, 0);
        const currentDate = new Date().toISOString().split('T')[0];
        
        const updatedGroups = [...sizeGroups];
        validGroups.forEach(({ group }) => {
          const groupIndex = updatedGroups.findIndex(g => g.uniqueKey === group.uniqueKey);
          
          if (groupIndex !== -1) {
            const loadedQty = group.loadingQuantity;
            updatedGroups[groupIndex].loadedQuantity += loadedQty;
            updatedGroups[groupIndex].remainingQuantity -= loadedQty;
            
            updatedGroups[groupIndex].loadingHistory.push({
              quantity: loadedQty,
              targetColdRoom: group.targetColdRoom,
              timestamp: new Date().toISOString(),
              date: currentDate
            });
            
            updatedGroups[groupIndex].selectedForLoading = false;
            updatedGroups[groupIndex].loadingQuantity = 0;
          }
        });
        
        setSizeGroups(updatedGroups);
        
        saveBalanceData(updatedGroups);
        
        toast({
          title: '✅ Boxes Loaded Successfully!',
          description: (
            <div className="space-y-2">
              <p>Loaded {validGroups.length} size groups ({totalBoxes.toLocaleString()} boxes)</p>
              {duplicateGroups.length > 0 && (
                <div className="text-sm text-orange-600">
                  ⚠️ Skipped {duplicateGroups.length} duplicate groups
                </div>
              )}
              <div className="text-sm text-gray-600">
                Balance has been updated and saved
              </div>
              <div className="flex gap-2 text-xs">
                <span className="text-green-600">
                  ✅ {countingRecordIds.size} record(s) updated
                </span>
                <span className="text-blue-600">
                  💾 Balance data saved locally
                </span>
              </div>
            </div>
          ),
        });
        
        await Promise.allSettled([
          fetchColdRoomBoxes(),
          fetchColdRoomStats(),
          fetchColdRooms(),
          fetchCountingRecords(),
        ]);
        
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

  const handleResetBalance = (uniqueKey: string) => {
    const updatedGroups = [...sizeGroups];
    const groupIndex = updatedGroups.findIndex(g => g.uniqueKey === uniqueKey);
    
    if (groupIndex !== -1) {
      updatedGroups[groupIndex].loadedQuantity = 0;
      updatedGroups[groupIndex].remainingQuantity = updatedGroups[groupIndex].totalQuantity;
      updatedGroups[groupIndex].loadingHistory = [];
      
      setSizeGroups(updatedGroups);
      saveBalanceData(updatedGroups);
      
      toast({
        title: 'Balance Reset',
        description: `Balance reset for ${formatSize(updatedGroups[groupIndex].size)} ${updatedGroups[groupIndex].variety}`,
      });
    }
  };
  
  const handleClearAllBalance = () => {
    const updatedGroups = [...sizeGroups];
    
    updatedGroups.forEach(group => {
      group.loadedQuantity = 0;
      group.remainingQuantity = group.totalQuantity;
      group.loadingHistory = [];
    });
    
    setSizeGroups(updatedGroups);
    clearBalanceData();
    
    toast({
      title: 'All Balance Data Cleared',
      description: 'All loading history and balance tracking has been reset',
    });
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
  
  const getSelectedRoomStats = () => {
    if (!coldRoomStats) return null;
    return selectedColdRoom === 'coldroom1' ? coldRoomStats.coldroom1 : coldRoomStats.coldroom2;
  };
  
  const selectedRoomStats = getSelectedRoomStats();
  
  const calculateSelectedSummary = () => {
    const selected = countingRecords.filter(record => selectedRecords.has(record.id));
    
    const totalBoxes = selected.reduce((sum, record) => {
      return sum + (record.total_remaining_boxes || 0);
    }, 0);
    
    const totalWeight = selected.reduce((sum, record) => sum + (record.total_counted_weight || 0), 0);
    const totalSuppliers = new Set(selected.map(record => record.supplier_name)).size;
    
    return { totalRecords: selected.length, totalBoxes, totalWeight, totalSuppliers };
  };
  
  const selectedSummary = calculateSelectedSummary();
  
  const calculateSizeGroupSummary = () => {
    const selectedGroups = sizeGroups.filter(group => group.selectedForLoading && group.loadingQuantity > 0);
    const allGroups = sizeGroups;
    
    const totalBoxes = selectedGroups.reduce((sum, group) => sum + group.loadingQuantity, 0);
    const totalWeight = selectedGroups.reduce((sum, group) => {
      const boxWeight = group.boxType === '4kg' ? 4 : 10;
      return sum + (group.loadingQuantity * boxWeight);
    }, 0);
    
    const coldroom1Boxes = selectedGroups
      .filter(group => group.targetColdRoom === 'coldroom1')
      .reduce((sum, group) => sum + group.loadingQuantity, 0);
    
    const coldroom2Boxes = selectedGroups
      .filter(group => group.targetColdRoom === 'coldroom2')
      .reduce((sum, group) => sum + group.loadingQuantity, 0);
    
    const totalAvailable = sizeGroups.reduce((sum, group) => sum + group.remainingQuantity, 0);
    const totalLoaded = sizeGroups.reduce((sum, group) => sum + group.loadedQuantity, 0);
    const totalOriginal = sizeGroups.reduce((sum, group) => sum + group.totalQuantity, 0);
    
    const completedGroups = sizeGroups.filter(group => group.remainingQuantity === 0).length;
    
    return {
      totalGroups: selectedGroups.length,
      totalBoxes,
      totalWeight,
      coldroom1Boxes,
      coldroom2Boxes,
      totalAvailable,
      totalLoaded,
      totalOriginal,
      remainingGroups: allGroups.length,
      completedGroups,
      completionPercentage: totalOriginal > 0 ? Math.round((totalLoaded / totalOriginal) * 100) : 0
    };
  };
  
  const sizeGroupSummary = calculateSizeGroupSummary();
  
  const realTimeStats = calculateRealTimeStats();
  
  const getInventoryBreakdown = () => {
    const availableBoxes = calculateAvailableBoxes(coldRoomBoxes);
    const breakdown: Record<string, any> = {};
    
    availableBoxes.forEach(box => {
      const key = `${box.cold_room_id}_${box.variety}_${box.box_type}_${box.grade}_${box.size}`;
      if (!breakdown[key]) {
        breakdown[key] = {
          cold_room_id: box.cold_room_id,
          variety: box.variety,
          box_type: box.box_type,
          grade: box.grade,
          size: box.size,
          totalQuantity: 0,
          boxes: []
        };
      }
      breakdown[key].totalQuantity += box.quantity || 0;
      breakdown[key].boxes.push(box);
    });
    
    return Object.values(breakdown);
  };
  
  const exportColdRoomBoxesToCSV = (data: ColdRoomBox[], filename: string = 'cold-room-inventory') => {
    if (!data || data.length === 0) {
      return;
    }

    const headers = [
      'Box ID',
      'Added Date',
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
      'Counting Record ID',
      'Loading Sheet ID',
      'Status',
      'Created At'
    ];

    const rows = data.map(box => {
      const boxWeight = box.box_type === '4kg' ? 4 : 10;
      const totalWeight = (box.quantity || 0) * boxWeight;
      const addedDate = box.created_at ? new Date(box.created_at).toLocaleDateString() : '';
      const status = box.loading_sheet_id ? 'Assigned to Loading Sheet' : box.is_in_pallet ? 'In Pallet' : 'Available in Cold Room';
      
      return [
        `"${box.id || ''}"`,
        `"${addedDate}"`,
        `"${box.supplier_name || 'Unknown'}"`,
        `"${box.pallet_id || ''}"`,
        `"${box.region || ''}"`,
        `"${box.variety === 'fuerte' ? 'Fuerte' : 'Hass'}"`,
        `"${box.box_type}"`,
        `"${formatSize(box.size)}"`,
        `"${box.grade === 'class1' ? 'Class 1' : 'Class 2'}"`,
        `"${box.quantity || 0}"`,
        `"${boxWeight}"`,
        `"${totalWeight}"`,
        `"${box.cold_room_id === 'coldroom1' ? 'Cold Room 1' : 'Cold Room 2'}"`,
        `"${box.counting_record_id || ''}"`,
        `"${box.loading_sheet_id || 'Not Assigned'}"`,
        `"${status}"`,
        `"${box.created_at || ''}"`
      ].join(',');
    });

    const csvContent = [
      headers.join(','),
      ...rows
    ].join('\n');

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

  const handleViewLoadingSheet = (loadingSheetId: string) => {
    window.open(`/outbound?tab=loading-sheet&sheet=${loadingSheetId}`, '_blank');
  };

  useEffect(() => {
    fetchAllData();
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'refreshColdRoom' || e.key === 'loadingSheetUpdated') {
        fetchAllData();
        fetchLoadingSheets();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchCountingRecords]);

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
                Manage boxes, pallets and track temperature in cold storage
              </p>
            </div>
            <div className="flex items-center gap-3">
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
          
          {/* Cold Room Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {safeArray(coldRooms).map(room => {
              const roomAvailableBoxes = calculateAvailableBoxes(coldRoomBoxes)
                .filter(box => box.cold_room_id === room.id)
                .reduce((sum, box) => sum + (box.quantity || 0), 0);
              
              const roomTotalBoxes = coldRoomBoxes
                .filter(box => box.cold_room_id === room.id)
                .reduce((sum, box) => sum + (box.quantity || 0), 0);
              
              const roomBoxesInPallets = coldRoomBoxes
                .filter(box => box.cold_room_id === room.id && box.is_in_pallet)
                .reduce((sum, box) => sum + (box.quantity || 0), 0);
              
              return (
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
                      <Badge variant="secondary">
                        {roomAvailableBoxes} Available Boxes
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Current Temperature: {safeToFixed(room.current_temperature)}°C
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Thermometer className="w-4 h-4" />
                          <span>{safeToFixed(room.current_temperature)}°C</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          <span>{roomAvailableBoxes} Available</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Inventory Status:</span>
                          <span className="font-medium">
                            {roomAvailableBoxes} available / {roomTotalBoxes} total
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ 
                              width: `${roomTotalBoxes > 0 ? (roomAvailableBoxes / roomTotalBoxes) * 100 : 0}%` 
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-green-600">
                            ✅ {roomAvailableBoxes} available
                          </span>
                          <span className="text-amber-600">
                            📦 {roomBoxesInPallets} in pallets
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="loading">Load Boxes</TabsTrigger>
              <TabsTrigger value="pallets">Pallets</TabsTrigger>
              <TabsTrigger value="temperature">Temperature Control</TabsTrigger>
              <TabsTrigger value="repacking">Repacking</TabsTrigger>
              <TabsTrigger value="inventory">Current Inventory</TabsTrigger>
            </TabsList>
            
            {/* Load Boxes Tab */}
            <TabsContent value="loading" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Warehouse className="w-5 h-5" />
                    Load Boxes to Cold Room - By Size Groups
                  </CardTitle>
                  <CardDescription>
                    Select counting records and load boxes by size to different cold rooms. Only shows boxes that haven't been loaded yet.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Available Counting Records</h3>
                        <p className="text-sm text-muted-foreground">
                          Only shows records with boxes that haven't been loaded to cold rooms yet
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => fetchCountingRecords()}
                          variant="outline"
                          size="sm"
                          disabled={isLoading.countingRecords}
                        >
                          <RefreshCw className={`w-4 h-4 mr-1 ${isLoading.countingRecords ? 'animate-spin' : ''}`} />
                          Refresh Records
                        </Button>
                        <Button
                          onClick={handleSelectAllRecords}
                          variant="outline"
                          size="sm"
                          disabled={countingRecords.length === 0}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Select All
                        </Button>
                        <Button
                          onClick={handleDeselectAllRecords}
                          variant="outline"
                          size="sm"
                          disabled={countingRecords.length === 0}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Deselect All
                        </Button>
                      </div>
                    </div>
                    
                    {isLoading.countingRecords ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4 mx-auto"></div>
                        <p className="text-muted-foreground">Loading counting records...</p>
                      </div>
                    ) : (
                      <>
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <Label>Available Records ({countingRecords.length})</Label>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {selectedRecords.size} selected
                              </Badge>
                            </div>
                          </div>
                          
                          <ScrollArea className="h-[300px] border rounded">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-12">Select</TableHead>
                                  <TableHead>Supplier</TableHead>
                                  <TableHead>Pallet ID</TableHead>
                                  <TableHead>Region</TableHead>
                                  <TableHead>Total Weight</TableHead>
                                  <TableHead>Counted Weight</TableHead>
                                  <TableHead>Box Types</TableHead>
                                  <TableHead>Loading Progress</TableHead>
                                  <TableHead>Submitted</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {countingRecords.map((record) => {
                                  const totals = record.totals || {};
                                  const totalBoxes = record.total_remaining_boxes || 0;
                                  const boxTypes = [
                                    totals.fuerte_4kg_total > 0 && 'Fuerte 4kg',
                                    totals.fuerte_10kg_total > 0 && 'Fuerte 10kg',
                                    totals.hass_4kg_total > 0 && 'Hass 4kg',
                                    totals.hass_10kg_total > 0 && 'Hass 10kg'
                                  ].filter(Boolean).join(', ');
                                  
                                  const progress = record.loading_progress_percentage || 0;
                                  const loadedBoxes = record.total_boxes_loaded || 0;
                                  const remainingBoxes = record.total_remaining_boxes || 0;
                                  
                                  return (
                                    <TableRow 
                                      key={record.id}
                                      className={selectedRecords.has(record.id) ? "bg-black-50" : ""}
                                    >
                                      <TableCell>
                                        <input
                                          type="checkbox"
                                          checked={selectedRecords.has(record.id)}
                                          onChange={() => handleToggleRecordSelection(record.id)}
                                          className="h-4 w-4 rounded border-gray-300"
                                          disabled={remainingBoxes === 0}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <div className="font-medium">{record.supplier_name}</div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="font-mono text-sm">{record.pallet_id}</div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="text-sm">{record.region || 'N/A'}</div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="font-medium">{safeToFixed(record.total_weight)} kg</div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="font-medium text-green-600">{safeToFixed(record.total_counted_weight)} kg</div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="text-sm">{boxTypes || 'No boxes'}</div>
                                        <div className="text-xs text-gray-500">
                                          {remainingBoxes} boxes remaining
                                          {loadedBoxes > 0 && (
                                            <span className="text-green-600 ml-1">
                                              ({loadedBoxes} already loaded)
                                            </span>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                              className="bg-green-500 h-2 rounded-full" 
                                              style={{ width: `${progress}%` }}
                                            />
                                          </div>
                                          <span className="text-xs font-medium w-10 text-right">
                                            {progress}%
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                          {remainingBoxes} remaining of {totalBoxes + loadedBoxes} total
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="text-sm">{formatDate(record.submitted_at)}</div>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </ScrollArea>
                          
                          {countingRecords.length === 0 && (
                            <div className="text-center py-8 border rounded">
                              <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                              <p className="text-gray-500 font-medium">No counting records available</p>
                              <p className="text-sm text-gray-400 mt-1">
                                All boxes from counting records have been loaded to cold rooms
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {selectedRecords.size > 0 && (
                          <div className="mt-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="font-medium">Size Groups from Selected Records</h3>
                                <p className="text-sm text-muted-foreground">
                                  Select sizes and quantities to load to different cold rooms. Only shows boxes not yet loaded.
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant="outline">
                                  {sizeGroups.length} size groups
                                </Badge>
                              </div>
                            </div>
                            
                            <Card className="mb-4 border-blue-200">
                              <CardContent className="py-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-bold text-blue-800">Balance Tracking</p>
                                    <p className="text-xs text-blue-600">
                                      Progress persists across page refreshes
                                    </p>
                                  </div>
                                  <div className="flex gap-6">
                                    <div className="text-center">
                                      <p className="text-xs text-gray-500">Total Original</p>
                                      <p className="text-lg font-bold text-blue-800">
                                        {sizeGroupSummary.totalOriginal.toLocaleString()}
                                      </p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-xs text-gray-500">Already Loaded</p>
                                      <p className="text-lg font-bold text-green-700">
                                        {sizeGroupSummary.totalLoaded.toLocaleString()}
                                      </p>
                                      <p className="text-xs text-green-600">
                                        {sizeGroupSummary.completionPercentage}%
                                      </p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-xs text-gray-500">Available Now</p>
                                      <p className="text-lg font-bold text-orange-700">
                                        {sizeGroupSummary.totalAvailable.toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            
                            <ScrollArea className="h-[500px] border rounded">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-black-50">
                                    <TableHead className="w-12">Status</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead>Variety</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Grade</TableHead>
                                    <TableHead className="text-right">Remaining</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Cold Room</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {sizeGroups.map((group, index) => {
                                    const isCompleted = group.remainingQuantity === 0;
                                    
                                    return (
                                      <TableRow 
                                        key={group.uniqueKey}
                                        className={group.selectedForLoading ? "bg-black-50" : isCompleted ? "bg-black-50" : ""}
                                      >
                                        <TableCell>
                                          {isCompleted ? (
                                            <div className="flex items-center justify-center">
                                              <Check className="w-5 h-5 text-green-600" />
                                            </div>
                                          ) : (
                                            <input
                                              type="checkbox"
                                              checked={group.selectedForLoading}
                                              onChange={() => handleToggleSizeGroupSelection(index)}
                                              disabled={isCompleted}
                                              className="h-4 w-4 rounded border-gray-300 disabled:opacity-50"
                                            />
                                          )}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                          {formatSize(group.size)}
                                        </TableCell>
                                        <TableCell className="capitalize">
                                          {group.variety === 'fuerte' ? 'Fuerte' : 'Hass'}
                                        </TableCell>
                                        <TableCell>{group.boxType}</TableCell>
                                        <TableCell>
                                          {group.grade === 'class1' ? 'Class 1' : 'Class 2'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <div className={`font-bold ${isCompleted ? 'text-green-600' : 'text-blue-600'}`}>
                                            {group.remainingQuantity.toLocaleString()}
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          {isCompleted ? (
                                            <div className="text-center text-green-600 font-medium">
                                              ✓ Complete
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-2">
                                              <Input
                                                type="number"
                                                min="0"
                                                max={group.remainingQuantity}
                                                value={group.loadingQuantity}
                                                onChange={(e) => handleSizeGroupQuantityChange(index, parseInt(e.target.value) || 0)}
                                                disabled={!group.selectedForLoading}
                                                className="w-24"
                                              />
                                              <div className="text-xs text-gray-500 w-8">
                                                max: {group.remainingQuantity}
                                              </div>
                                            </div>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          {isCompleted ? (
                                            <div className="text-sm text-gray-500">Completed</div>
                                          ) : (
                                            <Select
                                              value={group.targetColdRoom}
                                              onValueChange={(value) => handleSizeGroupTargetChange(index, value)}
                                              disabled={!group.selectedForLoading}
                                            >
                                              <SelectTrigger className="w-32">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="coldroom1">Cold Room 1</SelectItem>
                                                <SelectItem value="coldroom2">Cold Room 2</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </ScrollArea>
                            
                            {sizeGroupSummary.totalGroups > 0 && (
                              <Card className="mt-4 border-blue-200">
                                <CardHeader className="py-3 bg-black-50">
                                  <CardTitle className="text-sm font-medium">Load Summary - Ready to Ship</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                    <div className="border rounded p-4 bg-blue-50">
                                      <div className="flex items-center gap-2 mb-3">
                                        <Box className="w-5 h-5 text-blue-600" />
                                        <div>
                                          <span className="font-medium text-blue-600">Selected Sizes</span>
                                          <p className="text-xs text-blue-600">Ready for loading</p>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                          <span className="text-sm text-blue-600">Size Groups:</span>
                                          <span className="font-medium text-blue-600">
                                            {sizeGroupSummary.totalGroups}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-sm text-blue-600">Boxes to Load:</span>
                                          <span className="font-bold text-blue-700 text-lg">
                                            {sizeGroupSummary.totalBoxes.toLocaleString()}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="border rounded p-4 bg-green-50">
                                      <div className="flex items-center gap-2 mb-3">
                                        <Weight className="w-5 h-5 text-green-600" />
                                        <div>
                                          <span className="font-medium text-green-600">Weight Summary</span>
                                          <p className="text-xs text-green-600">Total weight to load</p>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                          <span className="text-sm text-green-600">Total Weight:</span>
                                          <span className="font-bold text-green-700 text-lg">
                                            {safeToFixed(sizeGroupSummary.totalWeight)} kg
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="border rounded p-4 bg-gradient-to-r from-green-50 to-blue-50">
                                      <div className="flex items-center gap-2 mb-3">
                                        <Check className="w-5 h-5 text-green-600" />
                                        <div>
                                          <span className="font-medium text-green-600">Overall Progress</span>
                                          <p className="text-xs text-green-600">Completion status</p>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                          <span className="text-sm text-green-600">Loaded:</span>
                                          <span className="font-bold text-green-700 text-lg">
                                            {sizeGroupSummary.totalLoaded.toLocaleString()}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-sm text-green-600">Completion:</span>
                                          <span className="font-bold text-green-700 text-lg">
                                            {sizeGroupSummary.completionPercentage}%
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                            
                            <div className="flex gap-3 mt-6">
                              <Button
                                onClick={handleLoadSizeGroups}
                                className="flex-1 py-6 text-lg"
                                size="lg"
                                disabled={sizeGroupSummary.totalGroups === 0}
                              >
                                <Upload className="w-5 h-5 mr-3" />
                                Load Selected Sizes to Cold Rooms
                                <span className="ml-3 font-bold">
                                  ({sizeGroupSummary.totalGroups} sizes, {sizeGroupSummary.totalBoxes} boxes)
                                </span>
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Pallets Tab */}
            <TabsContent value="pallets" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Create Manual Pallet
                    </CardTitle>
                    <CardDescription>
                      Combine available boxes from cold room to create complete pallets. Boxes are grouped by size, variety, type, and grade.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="pallet-name">Pallet Name *</Label>
                          <Input
                            id="pallet-name"
                            value={palletCreation.palletName}
                            onChange={(e) => setPalletCreation(prev => ({ ...prev, palletName: e.target.value }))}
                            placeholder="e.g., Mixed Fuerte Pallet 001"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cold-room-pallet">Cold Room *</Label>
                          <Select
                            value={palletCreation.coldRoomId}
                            onValueChange={(value) => setPalletCreation(prev => ({ ...prev, coldRoomId: value }))}
                          >
                            <SelectTrigger id="cold-room-pallet">
                              <SelectValue placeholder="Select cold room" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="coldroom1">Cold Room 1</SelectItem>
                              <SelectItem value="coldroom2">Cold Room 2</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="boxes-per-pallet">Boxes per Pallet *</Label>
                        <Select
                          value={palletCreation.boxesPerPallet.toString()}
                          onValueChange={(value) => setPalletCreation(prev => ({ ...prev, boxesPerPallet: parseInt(value) }))}
                        >
                          <SelectTrigger id="boxes-per-pallet">
                            <SelectValue placeholder="Select boxes per pallet" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="288">288 boxes (4kg boxes)</SelectItem>
                            <SelectItem value="120">120 crates (10kg crates)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          Standard pallet sizes: 288 boxes for 4kg, 120 crates for 10kg
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Select Box Groups for Pallet</h3>
                          <p className="text-sm text-muted-foreground">
                            Boxes are grouped by size, variety, type, and grade
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchGroupedBoxes}
                            disabled={isLoading.groupedBoxes}
                          >
                            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading.groupedBoxes ? 'animate-spin' : ''}`} />
                            Refresh Groups
                          </Button>
                          <Select
                            value={palletCreation.viewMode}
                            onValueChange={(value: 'grouped' | 'individual') => 
                              setPalletCreation(prev => ({ ...prev, viewMode: value }))
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="grouped">Grouped View</SelectItem>
                              <SelectItem value="individual">Individual View</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelectAllGroups('all')}
                          disabled={palletCreation.boxGroups.length === 0}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Select All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelectAllGroups('fuerte')}
                          disabled={palletCreation.boxGroups.filter(g => g.variety === 'fuerte').length === 0}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          All Fuerte
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelectAllGroups('hass')}
                          disabled={palletCreation.boxGroups.filter(g => g.variety === 'hass').length === 0}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          All Hass
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClearAllSelections}
                          disabled={palletCreation.boxGroups.filter(g => g.is_selected).length === 0}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Clear All
                        </Button>
                      </div>
                      
                      {/* Pallet Count Summary */}
                      {(() => {
                        const summary = calculateSelectedGroupsSummary();
                        if (summary.totalBoxes > 0) {
                          return (
                            <Card className="border-blue-200 bg-black-50">
                              <CardContent className="py-3">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium text-blue-800">Pallet Creation Summary</p>
                                      <p className="text-sm text-blue-600">
                                        {summary.totalBoxes} boxes ({summary.totalWeight} kg) selected from {summary.selectedGroups.length} groups
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-lg font-bold text-blue-800">
                                        {summary.suggestedPallets} pallet{summary.suggestedPallets !== 1 ? 's' : ''}
                                      </div>
                                      <div className="text-xs text-blue-600">
                                        {summary.boxesPerPallet} boxes per pallet
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Variety Size Breakdown */}
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-gray-700">Selected Groups by Variety and Size:</h4>
                                    {summary.varietySizeGroups.map((group, idx) => (
                                      <div key={idx} className="bg-black p-2 rounded border flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                          <Badge className={group.variety === 'fuerte' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}>
                                            {group.variety === 'fuerte' ? 'Fuerte' : 'Hass'}
                                          </Badge>
                                          <span className="text-sm font-medium">{formatSize(group.size)}</span>
                                        </div>
                                        <div className="text-right">
                                          <div className="font-bold text-blue-700">
                                            {group.totalQuantity} boxes
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {group.groups.length} type{group.groups.length !== 1 ? 's' : ''}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  {/* Box Type Breakdown */}
                                  <div className="grid grid-cols-2 gap-4 mt-4">
                                    {Object.entries(summary.boxTypeSummary).map(([type, stats]) => (
                                      <div key={type} className="bg-black p-3 rounded border">
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <div className="text-sm font-medium text-gray-700">
                                              {type === '4kg' ? '4kg Boxes' : '10kg Crates'}
                                            </div>
                                            <div className="text-lg font-bold text-blue-700">
                                              {stats.totalBoxes} boxes
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <div className="text-2xl font-bold text-green-700">
                                              {stats.pallets}
                                            </div>
                                            <div className="text-xs text-gray-600">
                                              full pallet{stats.pallets !== 1 ? 's' : ''}
                                            </div>
                                            {stats.remaining > 0 && (
                                              <div className="text-xs text-amber-600 mt-1">
                                                +{stats.remaining} box{stats.remaining !== 1 ? 'es' : ''} extra
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  {/* Countdown Display */}
                                  <div className="grid grid-cols-2 gap-4 mt-2">
                                    {Object.entries(palletCounts).map(([key, count]) => {
                                      if (key.endsWith('_remaining')) return null;
                                      
                                      const type = key;
                                      const standardBoxes = type === '4kg' ? 288 : 120;
                                      const remaining = palletCounts[`${type}_remaining`] || 0;
                                      const neededForNextPallet = standardBoxes - remaining;
                                      
                                      return (
                                        <div key={type} className="bg-gradient-to-r from-amber-50 to-amber-100 p-3 rounded border border-amber-200">
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <div className="text-sm font-medium text-amber-800">
                                                {type === '4kg' ? '4kg Boxes' : '10kg Crates'}
                                              </div>
                                              <div className="text-xs text-amber-600">
                                                {count} full pallet{count !== 1 ? 's' : ''}
                                              </div>
                                            </div>
                                            {remaining > 0 && (
                                              <div className="text-right">
                                                <div className="text-lg font-bold text-amber-700">
                                                  {neededForNextPallet} more
                                                </div>
                                                <div className="text-xs text-amber-600">
                                                  for next pallet ({remaining} available)
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                          {remaining > 0 && (
                                            <div className="mt-2">
                                              <div className="w-full bg-amber-200 rounded-full h-2">
                                                <div 
                                                  className="bg-amber-500 h-2 rounded-full" 
                                                  style={{ width: `${(remaining / standardBoxes) * 100}%` }}
                                                />
                                              </div>
                                              <div className="text-xs text-amber-700 mt-1 text-center">
                                                {remaining}/{standardBoxes} ({Math.round((remaining / standardBoxes) * 100)}%)
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        }
                        return null;
                      })()}
                      
                      {isLoading.groupedBoxes ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4 mx-auto"></div>
                          <p className="text-muted-foreground">Loading box groups...</p>
                        </div>
                      ) : palletCreation.boxGroups.length === 0 ? (
                        <div className="text-center py-8 border rounded">
                          <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                          <p className="text-gray-500 font-medium">No available box groups</p>
                          <p className="text-sm text-gray-400 mt-1">
                            All boxes may be in pallets or assigned to loading sheets
                          </p>
                        </div>
                      ) : palletCreation.viewMode === 'grouped' ? (
                        <div className="border rounded-lg overflow-hidden">
                          <ScrollArea className="h-[400px]">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-black-50">
                                  <TableHead className="w-12 text-center">Select</TableHead>
                                  <TableHead>Size</TableHead>
                                  <TableHead>Variety</TableHead>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Grade</TableHead>
                                  <TableHead className="text-right">Available</TableHead>
                                  <TableHead className="text-right w-32">Selected</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {palletCreation.boxGroups.map((group, index) => (
                                  <TableRow 
                                    key={`${group.size}_${group.variety}_${group.box_type}_${group.grade}`}
                                    className={group.is_selected ? "bg-black-50" : ""}
                                  >
                                    <TableCell>
                                      <div className="flex justify-center">
                                        <Checkbox
                                          checked={group.is_selected}
                                          onCheckedChange={() => handleToggleGroupSelection(index)}
                                          disabled={group.totalQuantity === 0}
                                        />
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{formatSize(group.size)}</Badge>
                                    </TableCell>
                                    <TableCell className="capitalize">
                                      {group.variety === 'fuerte' ? (
                                        <Badge className="bg-green-100 text-green-800 hover:bg-black-100 text-xs">Fuerte</Badge>
                                      ) : (
                                        <Badge className="bg-purple-100 text-purple-800 hover:bg-black-100 text-xs">Hass</Badge>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1">
                                        {group.box_type === '4kg' ? (
                                          <Box className="w-3 h-3 text-blue-500" />
                                        ) : (
                                          <Package2 className="w-3 h-3 text-orange-500" />
                                        )}
                                        <span className="text-sm">{group.box_type}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {group.grade === 'class1' ? 'Class 1' : 'Class 2'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="font-medium">{group.totalQuantity.toLocaleString()}</div>
                                      {group.selectedQuantity > 0 && (
                                        <div className="text-xs text-blue-600">
                                          {group.totalQuantity - group.selectedQuantity} remaining
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center justify-end gap-2">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="h-7 w-7 p-0"
                                          onClick={() => handleGroupQuantityChange(index, group.selectedQuantity - 1)}
                                          disabled={group.selectedQuantity <= 0}
                                        >
                                          <Minus className="w-3 h-3" />
                                        </Button>
                                        
                                        <Input
                                          type="number"
                                          min="0"
                                          max={group.totalQuantity}
                                          value={group.selectedQuantity}
                                          onChange={(e) => handleGroupQuantityChange(index, parseInt(e.target.value) || 0)}
                                          className="w-20 text-center"
                                        />
                                        
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="h-7 w-7 p-0"
                                          onClick={() => handleGroupQuantityChange(index, group.selectedQuantity + 1)}
                                          disabled={group.selectedQuantity >= group.totalQuantity}
                                        >
                                          <Plus className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </ScrollArea>
                        </div>
                      ) : (
                        <div className="border rounded-lg overflow-hidden">
                          <ScrollArea className="h-[400px]">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-black-50">
                                  <TableHead className="w-12 text-center">Select</TableHead>
                                  <TableHead>Size</TableHead>
                                  <TableHead>Variety</TableHead>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Grade</TableHead>
                                  <TableHead>Supplier</TableHead>
                                  <TableHead className="text-right">Available</TableHead>
                                  <TableHead className="text-right w-32">Selected</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {palletCreation.boxGroups.flatMap(group => 
                                  group.boxes.map((box, boxIndex) => (
                                    <TableRow 
                                      key={box.id}
                                      className={box.is_selected ? "bg-black-50" : ""}
                                    >
                                      <TableCell>
                                        <div className="flex justify-center">
                                          <Checkbox
                                            checked={box.is_selected}
                                            onCheckedChange={() => {
                                              setPalletCreation(prev => {
                                                const updatedGroups = [...prev.boxGroups];
                                                const groupIndex = updatedGroups.findIndex(g => 
                                                  g.size === group.size && 
                                                  g.variety === group.variety && 
                                                  g.box_type === group.box_type && 
                                                  g.grade === group.grade
                                                );
                                                
                                                if (groupIndex !== -1) {
                                                  const boxToUpdate = updatedGroups[groupIndex].boxes[boxIndex];
                                                  const newSelected = !boxToUpdate.is_selected;
                                                  boxToUpdate.is_selected = newSelected;
                                                  boxToUpdate.selectedQuantity = newSelected ? boxToUpdate.quantity : 0;
                                                  
                                                  // Update group selection status
                                                  const groupSelectedQuantity = updatedGroups[groupIndex].boxes.reduce(
                                                    (sum, b) => sum + (b.selectedQuantity || 0), 0
                                                  );
                                                  updatedGroups[groupIndex].selectedQuantity = groupSelectedQuantity;
                                                  updatedGroups[groupIndex].is_selected = groupSelectedQuantity > 0;
                                                }
                                                
                                                return { ...prev, boxGroups: updatedGroups };
                                              });
                                            }}
                                            disabled={box.quantity === 0}
                                          />
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="outline">{formatSize(box.size)}</Badge>
                                      </TableCell>
                                      <TableCell className="capitalize">
                                        {box.variety === 'fuerte' ? 'Fuerte' : 'Hass'}
                                      </TableCell>
                                      <TableCell>{box.box_type}</TableCell>
                                      <TableCell>
                                        {box.grade === 'class1' ? 'Class 1' : 'Class 2'}
                                      </TableCell>
                                      <TableCell className="text-sm">
                                        {box.supplier_name || 'Unknown'}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="font-medium">{box.quantity.toLocaleString()}</div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center justify-end gap-2">
                                          <Input
                                            type="number"
                                            min="0"
                                            max={box.quantity}
                                            value={box.selectedQuantity}
                                            onChange={(e) => {
                                              const quantity = parseInt(e.target.value) || 0;
                                              setPalletCreation(prev => {
                                                const updatedGroups = [...prev.boxGroups];
                                                const groupIndex = updatedGroups.findIndex(g => 
                                                  g.size === group.size && 
                                                  g.variety === group.variety && 
                                                  g.box_type === group.box_type && 
                                                  g.grade === group.grade
                                                );
                                                
                                                if (groupIndex !== -1) {
                                                  const boxToUpdate = updatedGroups[groupIndex].boxes[boxIndex];
                                                  const validQuantity = Math.max(0, Math.min(quantity, boxToUpdate.quantity));
                                                  boxToUpdate.selectedQuantity = validQuantity;
                                                  boxToUpdate.is_selected = validQuantity > 0;
                                                  
                                                  // Update group selection status
                                                  const groupSelectedQuantity = updatedGroups[groupIndex].boxes.reduce(
                                                    (sum, b) => sum + (b.selectedQuantity || 0), 0
                                                  );
                                                  updatedGroups[groupIndex].selectedQuantity = groupSelectedQuantity;
                                                  updatedGroups[groupIndex].is_selected = groupSelectedQuantity > 0;
                                                }
                                                
                                                return { ...prev, boxGroups: updatedGroups };
                                              });
                                            }}
                                            className="w-20 text-center"
                                          />
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </ScrollArea>
                        </div>
                      )}
                      
                      <div className="flex gap-3">
                        <Button
                          onClick={handleCreateManualPallet}
                          className="flex-1"
                          size="lg"
                          disabled={calculateSelectedGroupsSummary().totalBoxes === 0 || !palletCreation.palletName.trim()}
                        >
                          <Palette className="w-5 h-5 mr-2" />
                          Create Manual Pallet
                          {(() => {
                            const summary = calculateSelectedGroupsSummary();
                            if (summary.totalBoxes > 0) {
                              return (
                                <span className="ml-2 font-bold">
                                  ({summary.totalBoxes} boxes)
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ListTree className="w-5 h-5" />
                      Existing Pallets
                      <Badge variant="outline" className="ml-2">
                        {calculateAvailablePallets(pallets).length} available pallets
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      View and manage pallets in cold rooms
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading.pallets ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4 mx-auto"></div>
                        <p className="text-muted-foreground">Loading pallets...</p>
                      </div>
                    ) : pallets.length === 0 ? (
                      <div className="text-center py-8 border rounded">
                        <Palette className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No pallets created yet</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Create your first pallet by combining boxes from the cold room
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Showing {pallets.length} pallet{pallets.length !== 1 ? 's' : ''} 
                            ({calculateAvailablePallets(pallets).length} available)
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchPallets}
                            disabled={isLoading.pallets}
                          >
                            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading.pallets ? 'animate-spin' : ''}`} />
                            Refresh
                          </Button>
                        </div>
                        
                        <ScrollArea className="h-[500px]">
                          <div className="space-y-4">
                            {pallets.map((pallet) => {
                              const isExpanded = expandedPallets.has(pallet.id);
                              const boxTypes = Array.from(new Set(pallet.boxes?.map(box => box.box_type) || []));
                              const totalBoxes = pallet.total_boxes || 0;
                              const palletName = pallet.pallet_name || `Pallet ${pallet.id.substring(0, 8)}`;
                              const isAssigned = pallet.loading_sheet_id !== null;
                              
                              return (
                                <Card key={pallet.id} className={`overflow-hidden ${isAssigned ? 'border-amber-300 bg-black-50' : ''}`}>
                                  <div 
                                    className="p-4 cursor-pointer hover:bg-black-50 transition-colors"
                                    onClick={() => handleTogglePalletExpansion(pallet.id)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        {isExpanded ? (
                                          <ChevronUp className="w-5 h-5 text-gray-400" />
                                        ) : (
                                          <ChevronDown className="w-5 h-5 text-gray-400" />
                                        )}
                                        <div>
                                          <div className="font-medium flex items-center gap-2">
                                            <Palette className="w-4 h-4" />
                                            {palletName}
                                            {pallet.is_manual && (
                                              <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 text-xs">
                                                Manual
                                              </Badge>
                                            )}
                                            {isAssigned && (
                                              <Badge variant="outline" className="ml-2 bg-black-100 text-amber-800 text-xs">
                                                Assigned to Loading Sheet
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                            <Snowflake className="w-3 h-3" />
                                            {pallet.cold_room_id === 'coldroom1' ? 'Cold Room 1' : 'Cold Room 2'}
                                            <span className="mx-1">•</span>
                                            <Calendar className="w-3 h-3" />
                                            {formatDate(pallet.conversion_date || pallet.created_at)}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <div className="text-right">
                                          <div className="font-bold text-lg">{pallet.pallet_count} pallet{pallet.pallet_count !== 1 ? 's' : ''}</div>
                                          <div className="text-sm text-gray-500">
                                            {totalBoxes.toLocaleString()} boxes
                                          </div>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDissolvePallet(pallet.id, pallet.cold_room_id);
                                          }}
                                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                          disabled={isAssigned}
                                          title={isAssigned ? "Cannot dissolve pallet assigned to loading sheet" : "Dissolve pallet"}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {isExpanded && (
                                    <div className="border-t">
                                      <div className="p-4 bg-black-50">
                                        <div className="mb-4">
                                          <h4 className="font-medium mb-3 flex items-center gap-2">
                                            <Box className="w-4 h-4" />
                                            Boxes in this Pallet ({pallet.boxes?.length || 0})
                                          </h4>
                                          
                                          {pallet.boxes && pallet.boxes.length > 0 ? (
                                            <div className="border rounded overflow-hidden">
                                              <Table>
                                                <TableHeader>
                                                  <TableRow className="bg-black-50">
                                                    <TableHead>Size</TableHead>
                                                    <TableHead>Variety</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead>Grade</TableHead>
                                                    <TableHead className="text-right">Quantity</TableHead>
                                                  </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                  {pallet.boxes.map((box) => {
                                                    return (
                                                      <TableRow key={box.id}>
                                                        <TableCell>
                                                          <Badge variant="outline">{formatSize(box.size)}</Badge>
                                                        </TableCell>
                                                        <TableCell className="capitalize">
                                                          {box.variety === 'fuerte' ? 'Fuerte' : 'Hass'}
                                                        </TableCell>
                                                        <TableCell>{box.box_type}</TableCell>
                                                        <TableCell>
                                                          {box.grade === 'class1' ? 'Class 1' : 'Class 2'}
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">
                                                          {box.quantity.toLocaleString()}
                                                        </TableCell>
                                                      </TableRow>
                                                    );
                                                  })}
                                                </TableBody>
                                              </Table>
                                            </div>
                                          ) : (
                                            <div className="text-center py-6 border rounded bg-white">
                                              <Box className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                                              <p className="text-gray-500">No boxes assigned to this pallet</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Card>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </div>
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
                          placeholder="Enter temperature"
                        />
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
                                            -{box.quantity} {box.variety} {box.boxType} {formatSize(box.size)} {box.grade}
                                          </div>
                                        ))}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="space-y-1">
                                        {returnedBoxes.map((box, idx) => (
                                          <div key={idx} className="text-xs bg-green-50 p-1 rounded text-green-700">
                                            +{box.quantity} {box.variety} {box.boxType} {formatSize(box.size)} {box.grade}
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
                            <SelectItem value="coldroom1">Cold Room 1</SelectItem>
                            <SelectItem value="coldroom2">Cold Room 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
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
                            <div key={index} className="border rounded p-3 mb-3 bg-blue-50">
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
                                  <Label>Variety</Label>
                                  <Select
                                    value={box.variety}
                                    onValueChange={(value: 'fuerte' | 'hass') => 
                                      handleUpdateRemovedBox(index, 'variety', value)
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="fuerte">Fuerte</SelectItem>
                                      <SelectItem value="hass">Hass</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div>
                                  <Label>Box Type</Label>
                                  <Select
                                    value={box.boxType}
                                    onValueChange={(value: '4kg' | '10kg') => 
                                      handleUpdateRemovedBox(index, 'boxType', value)
                                    }
                                  >
                                    <SelectTrigger>
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
                                  <Label>Size</Label>
                                  <Select
                                    value={box.size}
                                    onValueChange={(value) => 
                                      handleUpdateRemovedBox(index, 'size', value)
                                    }
                                  >
                                    <SelectTrigger>
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
                                  <Label>Grade</Label>
                                  <Select
                                    value={box.grade}
                                    onValueChange={(value: 'class1' | 'class2') => 
                                      handleUpdateRemovedBox(index, 'grade', value)
                                    }
                                  >
                                    <SelectTrigger>
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
                                <Label>Quantity to Remove</Label>
                                <Input
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
                            <div key={index} className="border rounded p-3 mb-3 bg-blue-50">
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
                                  <Label>Variety</Label>
                                  <Select
                                    value={box.variety}
                                    onValueChange={(value: 'fuerte' | 'hass') => 
                                      handleUpdateReturnedBox(index, 'variety', value)
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="fuerte">Fuerte</SelectItem>
                                      <SelectItem value="hass">Hass</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div>
                                  <Label>Box Type</Label>
                                  <Select
                                    value={box.boxType}
                                    onValueChange={(value: '4kg' | '10kg') => 
                                      handleUpdateReturnedBox(index, 'boxType', value)
                                    }
                                  >
                                    <SelectTrigger>
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
                                  <Label>Size</Label>
                                  <Select
                                    value={box.size}
                                    onValueChange={(value) => 
                                      handleUpdateReturnedBox(index, 'size', value)
                                    }
                                  >
                                    <SelectTrigger>
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
                                  <Label>Grade</Label>
                                  <Select
                                    value={box.grade}
                                    onValueChange={(value: 'class1' | 'class2') => 
                                      handleUpdateReturnedBox(index, 'grade', value)
                                    }
                                  >
                                    <SelectTrigger>
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
                                <Label>Quantity to Return</Label>
                                <Input
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
            
            {/* Current Inventory Tab */}
            <TabsContent value="inventory" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Current Cold Room Inventory
                    <Badge variant="outline" className="ml-2 bg-green-50 text-green-700">
                      ✅ Real-time Available Stock
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Live inventory of AVAILABLE boxes currently stored in cold rooms. Boxes in pallets or assigned to loading sheets are excluded.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-4">
                        <div>
                          <Label htmlFor="inventory-coldroom">View Inventory for:</Label>
                          <Select 
                            value={selectedColdRoom} 
                            onValueChange={setSelectedColdRoom}
                          >
                            <SelectTrigger id="inventory-coldroom" className="w-48">
                              <SelectValue placeholder="Select cold room" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="coldroom1">❄️ Cold Room 1 (5°C)</SelectItem>
                              <SelectItem value="coldroom2">❄️ Cold Room 2 (5°C)</SelectItem>
                              <SelectItem value="all">📊 All Cold Rooms</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2 mt-7">
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            ✅ {realTimeStats.totalAvailableBoxes.toLocaleString()} Available
                          </Badge>
                          <Badge variant="outline" className="bg-amber-50 text-amber-700">
                            📦 {realTimeStats.boxesInPallets.toLocaleString()} In Pallets
                          </Badge>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            📋 {realTimeStats.totalAssignedBoxes.toLocaleString()} Total Assigned
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            const availableBoxes = calculateAvailableBoxes(coldRoomBoxes);
                            if (availableBoxes.length === 0) {
                              toast({
                                title: 'No data to export',
                                description: 'There is no available inventory data to download',
                                variant: 'destructive',
                              });
                              return;
                            }
                            
                            try {
                              exportColdRoomBoxesToCSV(availableBoxes, 'cold-room-available-inventory');
                              
                              toast({
                                title: 'CSV Export Started',
                                description: `Downloading ${availableBoxes.length} available inventory records as CSV file`,
                              });
                            } catch (error) {
                              console.error('Error exporting CSV:', error);
                              toast({
                                title: 'Export Failed',
                                description: 'Could not generate CSV file. Please try again.',
                                variant: 'destructive',
                              });
                            }
                          }}
                          variant="outline"
                          disabled={realTimeStats.totalAvailableBoxes === 0}
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Export Available to CSV
                        </Button>
                        <Button
                          onClick={() => {
                            fetchColdRoomBoxes();
                            fetchLoadingSheets();
                            fetchPalletHistory();
                          }}
                          variant="outline"
                          size="sm"
                          disabled={isLoading.boxes || isLoading.loadingSheets || isLoading.palletHistory}
                        >
                          <RefreshCw className={`w-4 h-4 mr-1 ${isLoading.boxes || isLoading.loadingSheets ? 'animate-spin' : ''}`} />
                          Refresh
                        </Button>
                      </div>
                    </div>

                    {/* Real-time Statistics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-green-700">Available Boxes</div>
                          <Package className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold text-green-800">
                          {realTimeStats.totalAvailableBoxes.toLocaleString()}
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          Ready for outbound loading
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-amber-700">Boxes in Pallets</div>
                          <Palette className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="text-2xl font-bold text-amber-800">
                          {realTimeStats.boxesInPallets.toLocaleString()}
                        </div>
                        <div className="text-xs text-amber-600 mt-1">
                          Converted to pallets
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-blue-700">Assigned to Loading</div>
                          <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-2xl font-bold text-blue-800">
                          {realTimeStats.boxesInAssignedPallets.toLocaleString()}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          In loading sheets for dispatch
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-purple-700">Total Boxes in Cold Room</div>
                          <Warehouse className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="text-2xl font-bold text-purple-800">
                          {realTimeStats.totalBoxesInColdRoom.toLocaleString()}
                        </div>
                        <div className="text-xs text-purple-600 mt-1">All boxes (available + in pallets)</div>
                      </div>
                    </div>

                    {/* Available Inventory Breakdown */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Layers className="w-5 h-5" />
                          Available Inventory Breakdown by Variety and Size
                        </CardTitle>
                        <CardDescription>
                          Detailed breakdown of AVAILABLE boxes in {selectedColdRoom === 'all' ? 'all cold rooms' : selectedColdRoom === 'coldroom1' ? 'Cold Room 1' : 'Cold Room 2'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoading.boxes ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4 mx-auto"></div>
                            <p className="text-muted-foreground">Loading breakdown...</p>
                          </div>
                        ) : realTimeStats.totalAvailableBoxes === 0 ? (
                          <div className="text-center py-8 border rounded">
                            <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium">No available inventory found</p>
                            <p className="text-sm text-gray-400 mt-1">
                              All boxes may be in pallets or assigned to loading sheets. Check pallets or load more boxes from counting records.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div>
                              <h3 className="font-medium text-lg mb-3 flex items-center gap-2">
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Fuerte</Badge>
                                <span className="text-green-700">Avocado Available Inventory</span>
                                <span className="text-sm text-gray-500 ml-2">
                                  ({getInventoryBreakdown().filter(item => item.variety === 'fuerte').reduce((sum, item) => sum + item.totalQuantity, 0)} boxes available)
                                </span>
                              </h3>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <Card>
                                  <CardHeader className="py-3 bg-gradient-to-r from-black-50 to-black-100">
                                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="default">Class 1</Badge>
                                        <span>4kg Boxes</span>
                                      </div>
                                      <Badge variant="outline" className="bg-green-50 text-green-700">
                                        {getInventoryBreakdown()
                                          .filter(item => item.variety === 'fuerte' && item.grade === 'class1' && item.box_type === '4kg')
                                          .reduce((sum, item) => sum + item.totalQuantity, 0)
                                          .toLocaleString()} available
                                      </Badge>
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="pt-3">
                                    <div className="space-y-2">
                                      {BOX_SIZES.map(size => {
                                        const availableItems = getInventoryBreakdown().filter(item => 
                                          (selectedColdRoom === 'all' || item.cold_room_id === selectedColdRoom) &&
                                          item.variety === 'fuerte' && 
                                          item.grade === 'class1' && 
                                          item.box_type === '4kg' && 
                                          item.size === size
                                        );
                                        const totalQuantity = availableItems.reduce((sum, item) => sum + item.totalQuantity, 0);
                                        
                                        if (totalQuantity === 0) return null;
                                        
                                        return (
                                          <div key={size} className="flex items-center justify-between text-sm p-2 hover:bg-black-50 rounded">
                                            <div className="flex items-center gap-2">
                                              <Box className="w-4 h-4 text-green-600" />
                                              <span className="font-medium">{formatSize(size)}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                              <span className="font-bold text-green-700">{totalQuantity.toLocaleString()}</span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                      {BOX_SIZES.every(size => {
                                        const totalQuantity = getInventoryBreakdown()
                                          .filter(item => 
                                            (selectedColdRoom === 'all' || item.cold_room_id === selectedColdRoom) &&
                                            item.variety === 'fuerte' && 
                                            item.grade === 'class1' && 
                                            item.box_type === '4kg' && 
                                            item.size === size
                                          )
                                          .reduce((sum, item) => sum + item.totalQuantity, 0);
                                        return totalQuantity === 0;
                                      }) && (
                                        <div className="text-center py-4 text-gray-400 text-sm">
                                          No available Class 1 4kg Fuerte boxes
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>

                                <Card>
                                  <CardHeader className="py-3 bg-gradient-to-r from-black-50 to-black-100">
                                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="default">Class 1</Badge>
                                        <span>10kg Crates</span>
                                      </div>
                                      <Badge variant="outline" className="bg-green-50 text-green-700">
                                        {getInventoryBreakdown()
                                          .filter(item => item.variety === 'fuerte' && item.grade === 'class1' && item.box_type === '10kg')
                                          .reduce((sum, item) => sum + item.totalQuantity, 0)
                                          .toLocaleString()} available
                                      </Badge>
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="pt-3">
                                    <div className="space-y-2">
                                      {BOX_SIZES.map(size => {
                                        const availableItems = getInventoryBreakdown().filter(item => 
                                          (selectedColdRoom === 'all' || item.cold_room_id === selectedColdRoom) &&
                                          item.variety === 'fuerte' && 
                                          item.grade === 'class1' && 
                                          item.box_type === '10kg' && 
                                          item.size === size
                                        );
                                        const totalQuantity = availableItems.reduce((sum, item) => sum + item.totalQuantity, 0);
                                        
                                        if (totalQuantity === 0) return null;
                                        
                                        return (
                                          <div key={size} className="flex items-center justify-between text-sm p-2 hover:bg-black-50 rounded">
                                            <div className="flex items-center gap-2">
                                              <Package2 className="w-4 h-4 text-green-600" />
                                              <span className="font-medium">{formatSize(size)}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                              <span className="font-bold text-green-700">{totalQuantity.toLocaleString()}</span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                      {BOX_SIZES.every(size => {
                                        const totalQuantity = getInventoryBreakdown()
                                          .filter(item => 
                                            (selectedColdRoom === 'all' || item.cold_room_id === selectedColdRoom) &&
                                            item.variety === 'fuerte' && 
                                            item.grade === 'class1' && 
                                            item.box_type === '10kg' && 
                                            item.size === size
                                          )
                                          .reduce((sum, item) => sum + item.totalQuantity, 0);
                                        return totalQuantity === 0;
                                      }) && (
                                        <div className="text-center py-4 text-gray-400 text-sm">
                                          No available Class 1 10kg Fuerte crates
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>

                                <Card>
                                  <CardHeader className="py-3 bg-gradient-to-r from-black-50 to-black-100">
                                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="secondary">Class 2</Badge>
                                        <span>4kg Boxes</span>
                                      </div>
                                      <Badge variant="outline" className="bg-green-50 text-green-700">
                                        {getInventoryBreakdown()
                                          .filter(item => item.variety === 'fuerte' && item.grade === 'class2' && item.box_type === '4kg')
                                          .reduce((sum, item) => sum + item.totalQuantity, 0)
                                          .toLocaleString()} available
                                      </Badge>
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="pt-3">
                                    <div className="space-y-2">
                                      {BOX_SIZES.map(size => {
                                        const availableItems = getInventoryBreakdown().filter(item => 
                                          (selectedColdRoom === 'all' || item.cold_room_id === selectedColdRoom) &&
                                          item.variety === 'fuerte' && 
                                          item.grade === 'class2' && 
                                          item.box_type === '4kg' && 
                                          item.size === size
                                        );
                                        const totalQuantity = availableItems.reduce((sum, item) => sum + item.totalQuantity, 0);
                                        
                                        if (totalQuantity === 0) return null;
                                        
                                        return (
                                          <div key={size} className="flex items-center justify-between text-sm p-2 hover:bg-black-50 rounded">
                                            <div className="flex items-center gap-2">
                                              <Box className="w-4 h-4 text-blue-600" />
                                              <span className="font-medium">{formatSize(size)}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                              <span className="font-bold text-blue-700">{totalQuantity.toLocaleString()}</span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                      {BOX_SIZES.every(size => {
                                        const totalQuantity = getInventoryBreakdown()
                                          .filter(item => 
                                            (selectedColdRoom === 'all' || item.cold_room_id === selectedColdRoom) &&
                                            item.variety === 'fuerte' && 
                                            item.grade === 'class2' && 
                                            item.box_type === '4kg' && 
                                            item.size === size
                                          )
                                          .reduce((sum, item) => sum + item.totalQuantity, 0);
                                        return totalQuantity === 0;
                                      }) && (
                                        <div className="text-center py-4 text-gray-400 text-sm">
                                          No available Class 2 4kg Fuerte boxes
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>

                                <Card>
                                  <CardHeader className="py-3 bg-gradient-to-r from-black-50 to-black-100">
                                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="secondary">Class 2</Badge>
                                        <span>10kg Crates</span>
                                      </div>
                                      <Badge variant="outline" className="bg-green-50 text-green-700">
                                        {getInventoryBreakdown()
                                          .filter(item => item.variety === 'fuerte' && item.grade === 'class2' && item.box_type === '10kg')
                                          .reduce((sum, item) => sum + item.totalQuantity, 0)
                                          .toLocaleString()} available
                                      </Badge>
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="pt-3">
                                    <div className="space-y-2">
                                      {BOX_SIZES.map(size => {
                                        const availableItems = getInventoryBreakdown().filter(item => 
                                          (selectedColdRoom === 'all' || item.cold_room_id === selectedColdRoom) &&
                                          item.variety === 'fuerte' && 
                                          item.grade === 'class2' && 
                                          item.box_type === '10kg' && 
                                          item.size === size
                                        );
                                        const totalQuantity = availableItems.reduce((sum, item) => sum + item.totalQuantity, 0);
                                        
                                        if (totalQuantity === 0) return null;
                                        
                                        return (
                                          <div key={size} className="flex items-center justify-between text-sm p-2 hover:bg-black-50 rounded">
                                            <div className="flex items-center gap-2">
                                              <Package2 className="w-4 h-4 text-blue-600" />
                                              <span className="font-medium">{formatSize(size)}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                              <span className="font-bold text-blue-700">{totalQuantity.toLocaleString()}</span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                      {BOX_SIZES.every(size => {
                                        const totalQuantity = getInventoryBreakdown()
                                          .filter(item => 
                                            (selectedColdRoom === 'all' || item.cold_room_id === selectedColdRoom) &&
                                            item.variety === 'fuerte' && 
                                            item.grade === 'class2' && 
                                            item.box_type === '10kg' && 
                                            item.size === size
                                          )
                                          .reduce((sum, item) => sum + item.totalQuantity, 0);
                                        return totalQuantity === 0;
                                      }) && (
                                        <div className="text-center py-4 text-gray-400 text-sm">
                                          No available Class 2 10kg Fuerte crates
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            </div>

                            <div>
                              <h3 className="font-medium text-lg mb-3 flex items-center gap-2">
                                <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Hass</Badge>
                                <span className="text-purple-700">Avocado Available Inventory</span>
                                <span className="text-sm text-gray-500 ml-2">
                                  ({getInventoryBreakdown().filter(item => item.variety === 'hass').reduce((sum, item) => sum + item.totalQuantity, 0)} boxes available)
                                </span>
                              </h3>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <Card>
                                  <CardHeader className="py-3 bg-gradient-to-r from-black-50 to-black-100">
                                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="default">Class 1</Badge>
                                        <span>4kg Boxes</span>
                                      </div>
                                      <Badge variant="outline" className="bg-green-50 text-green-700">
                                        {getInventoryBreakdown()
                                          .filter(item => item.variety === 'hass' && item.grade === 'class1' && item.box_type === '4kg')
                                          .reduce((sum, item) => sum + item.totalQuantity, 0)
                                          .toLocaleString()} available
                                      </Badge>
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="pt-3">
                                    <div className="space-y-2">
                                      {BOX_SIZES.map(size => {
                                        const availableItems = getInventoryBreakdown().filter(item => 
                                          (selectedColdRoom === 'all' || item.cold_room_id === selectedColdRoom) &&
                                          item.variety === 'hass' && 
                                          item.grade === 'class1' && 
                                          item.box_type === '4kg' && 
                                          item.size === size
                                        );
                                        const totalQuantity = availableItems.reduce((sum, item) => sum + item.totalQuantity, 0);
                                        
                                        if (totalQuantity === 0) return null;
                                        
                                        return (
                                          <div key={size} className="flex items-center justify-between text-sm p-2 hover:bg-black-50 rounded">
                                            <div className="flex items-center gap-2">
                                              <Box className="w-4 h-4 text-purple-600" />
                                              <span className="font-medium">{formatSize(size)}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                              <span className="font-bold text-purple-700">{totalQuantity.toLocaleString()}</span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                      {BOX_SIZES.every(size => {
                                        const totalQuantity = getInventoryBreakdown()
                                          .filter(item => 
                                            (selectedColdRoom === 'all' || item.cold_room_id === selectedColdRoom) &&
                                            item.variety === 'hass' && 
                                            item.grade === 'class1' && 
                                            item.box_type === '4kg' && 
                                            item.size === size
                                          )
                                          .reduce((sum, item) => sum + item.totalQuantity, 0);
                                        return totalQuantity === 0;
                                      }) && (
                                        <div className="text-center py-4 text-gray-400 text-sm">
                                          No available Class 1 4kg Hass boxes
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>

                                <Card>
                                  <CardHeader className="py-3 bg-gradient-to-r from-black-50 to-black-100">
                                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="default">Class 1</Badge>
                                        <span>10kg Crates</span>
                                      </div>
                                      <Badge variant="outline" className="bg-green-50 text-green-700">
                                        {getInventoryBreakdown()
                                          .filter(item => item.variety === 'hass' && item.grade === 'class1' && item.box_type === '10kg')
                                          .reduce((sum, item) => sum + item.totalQuantity, 0)
                                          .toLocaleString()} available
                                      </Badge>
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="pt-3">
                                    <div className="space-y-2">
                                      {BOX_SIZES.map(size => {
                                        const availableItems = getInventoryBreakdown().filter(item => 
                                          (selectedColdRoom === 'all' || item.cold_room_id === selectedColdRoom) &&
                                          item.variety === 'hass' && 
                                          item.grade === 'class1' && 
                                          item.box_type === '10kg' && 
                                          item.size === size
                                        );
                                        const totalQuantity = availableItems.reduce((sum, item) => sum + item.totalQuantity, 0);
                                        
                                        if (totalQuantity === 0) return null;
                                        
                                        return (
                                          <div key={size} className="flex items-center justify-between text-sm p-2 hover:bg-black-50 rounded">
                                            <div className="flex items-center gap-2">
                                              <Package2 className="w-4 h-4 text-purple-600" />
                                              <span className="font-medium">{formatSize(size)}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                              <span className="font-bold text-purple-700">{totalQuantity.toLocaleString()}</span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                      {BOX_SIZES.every(size => {
                                        const totalQuantity = getInventoryBreakdown()
                                          .filter(item => 
                                            (selectedColdRoom === 'all' || item.cold_room_id === selectedColdRoom) &&
                                            item.variety === 'hass' && 
                                            item.grade === 'class1' && 
                                            item.box_type === '10kg' && 
                                            item.size === size
                                          )
                                          .reduce((sum, item) => sum + item.totalQuantity, 0);
                                        return totalQuantity === 0;
                                      }) && (
                                        <div className="text-center py-4 text-gray-400 text-sm">
                                          No available Class 1 10kg Hass crates
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>

                                <Card>
                                  <CardHeader className="py-3 bg-gradient-to-r from-black-50 to-black-100">
                                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="secondary">Class 2</Badge>
                                        <span>4kg Boxes</span>
                                      </div>
                                      <Badge variant="outline" className="bg-green-50 text-green-700">
                                        {getInventoryBreakdown()
                                          .filter(item => item.variety === 'hass' && item.grade === 'class2' && item.box_type === '4kg')
                                          .reduce((sum, item) => sum + item.totalQuantity, 0)
                                          .toLocaleString()} available
                                      </Badge>
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="pt-3">
                                    <div className="space-y-2">
                                      {BOX_SIZES.map(size => {
                                        const availableItems = getInventoryBreakdown().filter(item => 
                                          (selectedColdRoom === 'all' || item.cold_room_id === selectedColdRoom) &&
                                          item.variety === 'hass' && 
                                          item.grade === 'class2' && 
                                          item.box_type === '4kg' && 
                                          item.size === size
                                        );
                                        const totalQuantity = availableItems.reduce((sum, item) => sum + item.totalQuantity, 0);
                                        
                                        if (totalQuantity === 0) return null;
                                        
                                        return (
                                          <div key={size} className="flex items-center justify-between text-sm p-2 hover:bg-black-50 rounded">
                                            <div className="flex items-center gap-2">
                                              <Box className="w-4 h-4 text-pink-600" />
                                              <span className="font-medium">{formatSize(size)}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                              <span className="font-bold text-pink-700">{totalQuantity.toLocaleString()}</span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                      {BOX_SIZES.every(size => {
                                        const totalQuantity = getInventoryBreakdown()
                                          .filter(item => 
                                            (selectedColdRoom === 'all' || item.cold_room_id === selectedColdRoom) &&
                                            item.variety === 'hass' && 
                                            item.grade === 'class2' && 
                                            item.box_type === '4kg' && 
                                            item.size === size
                                          )
                                          .reduce((sum, item) => sum + item.totalQuantity, 0);
                                        return totalQuantity === 0;
                                      }) && (
                                        <div className="text-center py-4 text-gray-400 text-sm">
                                          No available Class 2 4kg Hass boxes
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>

                                <Card>
                                  <CardHeader className="py-3 bg-gradient-to-r from-black-50 to-black-100">
                                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="secondary">Class 2</Badge>
                                        <span>10kg Crates</span>
                                      </div>
                                      <Badge variant="outline" className="bg-green-50 text-green-700">
                                        {getInventoryBreakdown()
                                          .filter(item => item.variety === 'hass' && item.grade === 'class2' && item.box_type === '10kg')
                                          .reduce((sum, item) => sum + item.totalQuantity, 0)
                                          .toLocaleString()} available
                                      </Badge>
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="pt-3">
                                    <div className="space-y-2">
                                      {BOX_SIZES.map(size => {
                                        const availableItems = getInventoryBreakdown().filter(item => 
                                          (selectedColdRoom === 'all' || item.cold_room_id === selectedColdRoom) &&
                                          item.variety === 'hass' && 
                                          item.grade === 'class2' && 
                                          item.box_type === '10kg' && 
                                          item.size === size
                                        );
                                        const totalQuantity = availableItems.reduce((sum, item) => sum + item.totalQuantity, 0);
                                        
                                        if (totalQuantity === 0) return null;
                                        
                                        return (
                                          <div key={size} className="flex items-center justify-between text-sm p-2 hover:bg-black-50 rounded">
                                            <div className="flex items-center gap-2">
                                              <Package2 className="w-4 h-4 text-pink-600" />
                                              <span className="font-medium">{formatSize(size)}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                              <span className="font-bold text-pink-700">{totalQuantity.toLocaleString()}</span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                      {BOX_SIZES.every(size => {
                                        const totalQuantity = getInventoryBreakdown()
                                          .filter(item => 
                                            (selectedColdRoom === 'all' || item.cold_room_id === selectedColdRoom) &&
                                            item.variety === 'hass' && 
                                            item.grade === 'class2' && 
                                            item.box_type === '10kg' && 
                                            item.size === size
                                          )
                                          .reduce((sum, item) => sum + item.totalQuantity, 0);
                                        return totalQuantity === 0;
                                      }) && (
                                        <div className="text-center py-4 text-gray-400 text-sm">
                                          No available Class 2 10kg Hass crates
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
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