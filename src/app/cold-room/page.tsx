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
  Pallet,
  Combine,
  Trash2,
  Eye,
  EyeOff,
  ListTree,
  Group
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

// NEW FUNCTION: Check if boxes already exist in cold room
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
  
  // State for cold room contents
  const [coldRoomBoxes, setColdRoomBoxes] = useState<ColdRoomBox[]>([]);
  const [pallets, setPallets] = useState<Pallet[]>([]);
  const [temperatureLogs, setTemperatureLogs] = useState<TemperatureLog[]>([]);
  const [repackingRecords, setRepackingRecords] = useState<RepackingRecord[]>([]);
  const [coldRoomStats, setColdRoomStats] = useState<{
    overall: ColdRoomStats;
    coldroom1: ColdRoomStats;
    coldroom2: ColdRoomStats;
  } | null>(null);
  
  // State for counting records ready for cold room
  const [countingRecords, setCountingRecords] = useState<CountingRecord[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  
  // Loading states
  const [isLoading, setIsLoading] = useState({
    coldRooms: true,
    boxes: true,
    pallets: true,
    temperature: true,
    repacking: true,
    stats: true,
    countingRecords: true,
  });
  
  // State for forms
  const [selectedColdRoom, setSelectedColdRoom] = useState<string>('coldroom1');
  const [temperature, setTemperature] = useState<string>('');
  
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
  
  // State for size groups
  const [sizeGroups, setSizeGroups] = useState<SizeGroup[]>([]);
  
  // State for pallet creation
  const [palletCreation, setPalletCreation] = useState<{
    palletName: string;
    coldRoomId: string;
    boxesPerPallet: number;
    selectedBoxes: BoxSelection[];
    showOnlyAvailable: boolean;
  }>({
    palletName: '',
    coldRoomId: 'coldroom1',
    boxesPerPallet: 288, // 4kg boxes per pallet
    selectedBoxes: [],
    showOnlyAvailable: true,
  });

  // State for expanded pallets
  const [expandedPallets, setExpandedPallets] = useState<Set<string>>(new Set());
  
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
  
  // Fetch cold room boxes
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
          converted_to_pallet_at: box.converted_to_pallet_at
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

  // Fetch pallets with box details
  const fetchPallets = async () => {
    try {
      console.log('🔍 Fetching pallets with box details...');
      const response = await fetch('/api/cold-room?action=pallets');
      const result = await response.json();
      
      console.log('📦 Pallets API response:', result);
      
      if (result.success && Array.isArray(result.data)) {
        const palletsData = await Promise.all(
          result.data.map(async (pallet: any) => {
            // Fetch boxes for this pallet
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
                  converted_to_pallet_at: box.converted_to_pallet_at
                }));
              }
            } catch (error) {
              console.warn(`⚠️ Could not fetch boxes for pallet ${pallet.id}:`, error);
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
              boxes_per_pallet: pallet.boxes_per_pallet || (pallet.box_type === '10kg' ? 120 : 288)
            };
          })
        );
        
        console.log(`✅ Loaded ${palletsData.length} pallets with box details`);
        setPallets(palletsData);
      } else {
        console.warn('⚠️ No pallets data or API error:', result.message);
        setPallets([]);
      }
    } catch (error) {
      console.error('❌ Error fetching pallets:', error);
      setPallets([]);
    } finally {
      setIsLoading(prev => ({ ...prev, pallets: false }));
    }
  };

  // Fetch temperature logs
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
  
  // Fetch repacking records
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
  
  // Fetch cold room statistics
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
  
  // Fetch counting records ready for cold room
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
        
        if (processedRecords.length > 0) {
          toast({
            title: "📦 Counting Records Found",
            description: `Found ${processedRecords.length} records with boxes ready for cold room loading`,
          });
        } else {
          toast({
            title: "📦 No Boxes to Load",
            description: "All boxes from counting records have been loaded to cold rooms",
            variant: "default",
          });
        }
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
  
  // Fetch all data
  const fetchAllData = async () => {
    try {
      setIsLoading({
        coldRooms: true,
        boxes: true,
        pallets: true,
        temperature: true,
        repacking: true,
        stats: true,
        countingRecords: true,
      });
      
      await Promise.allSettled([
        fetchColdRooms(),
        fetchColdRoomBoxes(),
        fetchPallets(),
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
  
  // Process counting records into size groups
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
  
  // Update when selected records or counting records change
  useEffect(() => {
    processSizeGroups();
  }, [selectedRecords, countingRecords, processSizeGroups]);

  // Initialize pallet creation boxes
  useEffect(() => {
    if (coldRoomBoxes.length > 0) {
      const filteredBoxes = coldRoomBoxes.filter(box => 
        !palletCreation.showOnlyAvailable || !box.is_in_pallet
      );
      
      const boxSelections: BoxSelection[] = filteredBoxes.map(box => ({
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
        is_selected: false
      }));
      
      setPalletCreation(prev => ({
        ...prev,
        selectedBoxes: boxSelections
      }));
    }
  }, [coldRoomBoxes, palletCreation.showOnlyAvailable]);
  
  // ===========================================
  // PALLET MANAGEMENT FUNCTIONS
  // ===========================================
  
  // Toggle box selection for pallet creation
  const handleToggleBoxSelection = (boxId: string) => {
    setPalletCreation(prev => {
      const updatedBoxes = prev.selectedBoxes.map(box => {
        if (box.id === boxId) {
          const newSelected = !box.is_selected;
          return {
            ...box,
            is_selected: newSelected,
            selectedQuantity: newSelected ? 1 : 0
          };
        }
        return box;
      });
      return { ...prev, selectedBoxes: updatedBoxes };
    });
  };

  // Update selected quantity for a box
  const handleBoxQuantityChange = (boxId: string, quantity: number) => {
    setPalletCreation(prev => {
      const updatedBoxes = prev.selectedBoxes.map(box => {
        if (box.id === boxId) {
          const validQuantity = Math.max(0, Math.min(quantity, box.maxQuantity));
          return {
            ...box,
            selectedQuantity: validQuantity,
            is_selected: validQuantity > 0
          };
        }
        return box;
      });
      return { ...prev, selectedBoxes: updatedBoxes };
    });
  };

  // Calculate total boxes selected for pallet
  const calculateSelectedBoxesSummary = () => {
    const selectedBoxes = palletCreation.selectedBoxes.filter(box => box.is_selected && box.selectedQuantity > 0);
    
    const totalBoxes = selectedBoxes.reduce((sum, box) => sum + box.selectedQuantity, 0);
    const totalWeight = selectedBoxes.reduce((sum, box) => {
      const boxWeight = box.box_type === '4kg' ? 4 : 10;
      return sum + (box.selectedQuantity * boxWeight);
    }, 0);
    
    const boxesPerPallet = palletCreation.boxesPerPallet;
    
    // REMOVED: No more minimum requirement check
    // Just show info about standard pallet sizes
    const suggestedPallets = Math.ceil(totalBoxes / boxesPerPallet);
    
    return {
      totalBoxes,
      totalWeight,
      boxesPerPallet,
      suggestedPallets,
      isAtLeastOneBox: totalBoxes > 0
    };
  };

  // Create manual pallet
  const handleCreateManualPallet = async () => {
    const summary = calculateSelectedBoxesSummary();
    
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

    if (summary.totalBoxes < palletCreation.boxesPerPallet) {
      toast({
        title: 'Insufficient boxes',
        description: `Need ${palletCreation.boxesPerPallet} boxes for a complete pallet. You have ${summary.totalBoxes} boxes selected.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      const selectedBoxesData = palletCreation.selectedBoxes
        .filter(box => box.is_selected && box.selectedQuantity > 0)
        .map(box => ({
          id: box.id,
          variety: box.variety,
          boxType: box.box_type,
          size: box.size,
          grade: box.grade,
          quantity: box.selectedQuantity,
          supplierName: box.supplier_name,
          region: box.region,
          coldRoomId: box.cold_room_id
        }));

      const response = await fetch('/api/cold-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create-manual-pallet',
          palletName: palletCreation.palletName,
          coldRoomId: palletCreation.coldRoomId,
          boxes: selectedBoxesData,
          boxesPerPallet: palletCreation.boxesPerPallet,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: '✅ Pallet Created Successfully!',
          description: (
            <div className="space-y-2">
              <p>Pallet "{result.data.palletName}" created with {summary.totalBoxes} boxes</p>
              <div className="text-sm text-gray-600">
                {Math.floor(summary.totalBoxes / summary.boxesPerPallet)} full pallet(s) created
              </div>
              <div className="flex gap-2 text-xs">
                <span className="text-green-600">
                  ✅ {result.data.boxUpdates?.length || 0} box(es) converted
                </span>
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
          showOnlyAvailable: true,
        });

        // Refresh data
        await Promise.allSettled([
          fetchColdRoomBoxes(),
          fetchPallets(),
          fetchColdRoomStats(),
        ]);

      } else {
        throw new Error(result.error || 'Failed to create pallet');
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

  // Dissolve pallet
  const handleDissolvePallet = async (palletId: string, coldRoomId: string) => {
    if (!confirm('Are you sure you want to dissolve this pallet? Boxes will be returned to available inventory.')) {
      return;
    }

    try {
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
          fetchColdRoomStats(),
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

  // Toggle pallet expansion
  const handleTogglePalletExpansion = (palletId: string) => {
    const newExpanded = new Set(expandedPallets);
    if (newExpanded.has(palletId)) {
      newExpanded.delete(palletId);
    } else {
      newExpanded.add(palletId);
    }
    setExpandedPallets(newExpanded);
  };

  // ===========================================
  // COUNTING RECORDS FUNCTIONS
  // ===========================================
  
  // Handle counting record selection
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
  
  // Handle size group selection
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
    group.loadingQuantity = group.selectedForLoading ? 
      Math.min(group.remainingQuantity, 100) : 0;
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
  
  // Load selected size groups to cold room - FIXED VERSION
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
      // NEW: Check for existing boxes to prevent duplicates
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
      
      // Filter out groups that already exist in cold room
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
            loadedBy: 'Warehouse Staff'
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
      
      console.log('📤 Loading size groups to cold room:', {
        groupsCount: validGroups.length,
        totalBoxes: validGroups.reduce((sum, { group }) => sum + group.loadingQuantity, 0),
        duplicateGroups: duplicateGroups.length,
        balanceUpdates
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

  // Reset balance for a specific size group
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
  
  // Clear all balance data
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
  
  // ===========================================
  // TEMPERATURE FUNCTIONS
  // ===========================================
  
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
  
  // ===========================================
  // REPACKING FUNCTIONS
  // ===========================================
  
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
  
  // ===========================================
  // UTILITY FUNCTIONS
  // ===========================================
  
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
      'Created At'
    ];

    const rows = data.map(box => {
      const boxWeight = box.box_type === '4kg' ? 4 : 10;
      const totalWeight = (box.quantity || 0) * boxWeight;
      const addedDate = box.created_at ? new Date(box.created_at).toLocaleDateString() : '';
      
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

  // Set up polling and initial load
  useEffect(() => {
    fetchAllData();
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'refreshColdRoom') {
        console.log('🔄 Storage change detected, refreshing cold room data...');
        fetchCountingRecords();
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
                    <Badge variant="secondary">
                      {room.occupied} Boxes
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
                      <span>{room.occupied} Boxes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
                    <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700">
                      Balance Tracking Active
                    </Badge>
                    <Badge variant="outline" className="ml-2 bg-green-50 text-green-700">
                      Duplicate Protection ✓
                    </Badge>
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
                    
                    {/* Loading State */}
                    {isLoading.countingRecords ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4 mx-auto"></div>
                        <p className="text-muted-foreground">Loading counting records...</p>
                      </div>
                    ) : (
                      <>
                        {/* Counting Records Table */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <Label>Available Records ({countingRecords.length})</Label>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {selectedRecords.size} selected
                              </Badge>
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                {sizeGroups.length} size groups loaded
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
                        
                        {/* Size Groups Table */}
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
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                  {sizeGroupSummary.totalAvailable.toLocaleString()} boxes available
                                </Badge>
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  {sizeGroupSummary.completionPercentage}% overall completion
                                </Badge>
                                {sizeGroupSummary.completedGroups > 0 && (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    <Check className="w-3 h-3 mr-1" />
                                    {sizeGroupSummary.completedGroups} completed
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            {/* Balance Summary Card */}
                            <Card className="mb-4 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300">
                              <CardContent className="py-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Database className="w-6 h-6 text-blue-600" />
                                    <div>
                                      <p className="text-sm font-bold text-blue-800">Balance Tracking (Auto-saved)</p>
                                      <p className="text-xs text-blue-600">
                                        Progress persists across page refreshes. Completed groups remain visible.
                                      </p>
                                    </div>
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
                                    <div className="text-center">
                                      <p className="text-xs text-gray-500">Completed Groups</p>
                                      <p className="text-lg font-bold text-green-700">
                                        {sizeGroupSummary.completedGroups}
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
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-right">Loaded</TableHead>
                                    <TableHead className="text-right">Remaining</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Cold Room</TableHead>
                                    <TableHead className="w-20">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {sizeGroups.map((group, index) => {
                                    const completionPercentage = group.totalQuantity > 0 
                                      ? Math.round((group.loadedQuantity / group.totalQuantity) * 100) 
                                      : 0;
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
                                          {isCompleted && (
                                            <div className="text-xs text-green-600 mt-1">✓ All loaded to cold room</div>
                                          )}
                                        </TableCell>
                                        <TableCell className="capitalize">
                                          {group.variety === 'fuerte' ? 'Fuerte' : 'Hass'}
                                        </TableCell>
                                        <TableCell>{group.boxType}</TableCell>
                                        <TableCell>
                                          <Badge variant={group.grade === 'class1' ? 'default' : 'secondary'}>
                                            {group.grade === 'class1' ? 'Class 1' : 'Class 2'}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                          {group.totalQuantity.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <div className={`font-medium ${group.loadedQuantity > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                                            {group.loadedQuantity.toLocaleString()}
                                          </div>
                                          {group.loadedQuantity > 0 && (
                                            <div className="text-xs text-green-500">
                                              {completionPercentage}%
                                            </div>
                                          )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <div className={`font-bold ${isCompleted ? 'text-green-600' : 'text-blue-600'}`}>
                                            {group.remainingQuantity.toLocaleString()}
                                          </div>
                                          {isCompleted ? (
                                            <div className="text-xs text-green-600">✓ All loaded to cold room</div>
                                          ) : (
                                            <div className="text-xs text-blue-500">
                                              {Math.round((group.remainingQuantity / group.totalQuantity) * 100)}% left
                                            </div>
                                          )}
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
                                        <TableCell>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleResetBalance(group.uniqueKey)}
                                            disabled={group.loadedQuantity === 0}
                                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                            title="Reset balance for this size"
                                          >
                                            <RefreshCw className="w-3 h-3" />
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </ScrollArea>
                            
                            {/* Empty State when all groups are completed */}
                            {sizeGroups.length === 0 && (
                              <Card className="mt-4 border-green-200 bg-green-50">
                                <CardContent className="py-8 text-center">
                                  <Check className="w-12 h-12 mx-auto text-green-500 mb-4" />
                                  <h3 className="text-lg font-medium text-green-800 mb-2">All Size Groups Completed!</h3>
                                  <p className="text-green-600 mb-4">
                                    All boxes from the selected counting records have been loaded to cold rooms.
                                  </p>
                                  <div className="flex gap-3 justify-center">
                                    <Button
                                      variant="outline"
                                      onClick={handleDeselectAllRecords}
                                      className="border-green-200 text-green-700 hover:bg-green-100"
                                    >
                                      <X className="w-4 h-4 mr-2" />
                                      Deselect Records
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={handleClearAllBalance}
                                      className="border-blue-200 text-blue-700 hover:bg-blue-100"
                                    >
                                      <RefreshCw className="w-4 h-4 mr-2" />
                                      Clear Balance Data
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                            
                            {/* Size Group Summary */}
                            {sizeGroupSummary.totalGroups > 0 && (
                              <Card className="mt-4 border-blue-200">
                                <CardHeader className="py-3 bg-black-50">
                                  <CardTitle className="text-sm font-medium">Load Summary - Ready to Ship</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
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
                                    
                                    <div className="border rounded p-4 bg-purple-50">
                                      <div className="flex items-center gap-2 mb-3">
                                        <Snowflake className="w-5 h-5 text-purple-600" />
                                        <div>
                                          <span className="font-medium text-purple-600">Cold Room 1</span>
                                          <p className="text-xs text-purple-600">Boxes allocated</p>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                          <span className="text-sm text-purple-600">Boxes:</span>
                                          <span className="font-bold text-purple-700 text-lg">
                                            {sizeGroupSummary.coldroom1Boxes.toLocaleString()}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="border rounded p-4 bg-orange-50">
                                      <div className="flex items-center gap-2 mb-3">
                                        <Snowflake className="w-5 h-5 text-orange-600" />
                                        <div>
                                          <span className="font-medium text-orange-600">Cold Room 2</span>
                                          <p className="text-xs text-orange-600">Boxes allocated</p>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                          <span className="text-sm text-orange-600">Boxes:</span>
                                          <span className="font-bold text-orange-700 text-lg">
                                            {sizeGroupSummary.coldroom2Boxes.toLocaleString()}
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
                            
                            {/* Load Button */}
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
                            
                            {/* Loading History Section */}
                            {sizeGroups.some(group => group.loadingHistory.length > 0) && (
                              <Card className="mt-8">
                                <CardHeader className="py-3 bg-black-50">
                                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <History className="w-4 h-4" />
                                    Loading History
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <ScrollArea className="h-[200px] border rounded">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Date</TableHead>
                                          <TableHead>Size</TableHead>
                                          <TableHead>Variety</TableHead>
                                          <TableHead>Type</TableHead>
                                          <TableHead className="text-right">Loaded Qty</TableHead>
                                          <TableHead>Cold Room</TableHead>
                                          <TableHead>Time</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {sizeGroups
                                          .filter(group => group.loadingHistory.length > 0)
                                          .flatMap(group => 
                                            group.loadingHistory.map((history, idx) => (
                                              <TableRow key={`${group.uniqueKey}-${idx}`}>
                                                <TableCell>{history.date}</TableCell>
                                                <TableCell>{formatSize(group.size)}</TableCell>
                                                <TableCell className="capitalize">{group.variety}</TableCell>
                                                <TableCell>{group.boxType}</TableCell>
                                                <TableCell className="text-right font-medium text-green-600">
                                                  {history.quantity.toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                  <Badge variant="outline">
                                                    {history.targetColdRoom === 'coldroom1' ? 'CR1' : 'CR2'}
                                                  </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                  {formatDate(history.timestamp)}
                                                </TableCell>
                                              </TableRow>
                                            ))
                                          ).sort((a, b) => new Date(b.props.children[6]).getTime() - new Date(a.props.children[6]).getTime())}
                                      </TableBody>
                                    </Table>
                                  </ScrollArea>
                                </CardContent>
                              </Card>
                            )}
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
                {/* Create Pallet Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Create Manual Pallet
                    </CardTitle>
                    <CardDescription>
                      Combine individual boxes from cold room to create a complete pallet
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
                          <h3 className="font-medium">Select Boxes for Pallet</h3>
                          <p className="text-sm text-muted-foreground">
                            Choose boxes and adjust quantities to add to pallet
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="show-available"
                              checked={palletCreation.showOnlyAvailable}
                              onCheckedChange={(checked) => 
                                setPalletCreation(prev => ({ ...prev, showOnlyAvailable: checked as boolean }))
                              }
                            />
                            <label
                              htmlFor="show-available"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Show only available boxes
                            </label>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Smart select all - selects all boxes with default quantity of 1
                              setPalletCreation(prev => {
                                const updatedBoxes = prev.selectedBoxes.map(box => {
                                  if (!prev.showOnlyAvailable || !box.is_in_pallet) {
                                    return {
                                      ...box,
                                      is_selected: box.maxQuantity > 0,
                                      selectedQuantity: box.maxQuantity > 0 ? 1 : 0
                                    };
                                  }
                                  return box;
                                });
                                return { ...prev, selectedBoxes: updatedBoxes };
                              });
                            }}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Select All (1 each)
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Clear all selections
                              setPalletCreation(prev => {
                                const updatedBoxes = prev.selectedBoxes.map(box => ({
                                  ...box,
                                  is_selected: false,
                                  selectedQuantity: 0
                                }));
                                return { ...prev, selectedBoxes: updatedBoxes };
                              });
                            }}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Clear All
                          </Button>
                        </div>
                      </div>
                      
                      {/* Selected Boxes Summary */}
                      {(() => {
                        const summary = calculateSelectedBoxesSummary();
                        if (summary.totalBoxes > 0) {
                          return (
                            <Card className="border-blue-200 bg-blue-50">
                              <CardContent className="py-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-blue-800">Selection Summary</p>
                                    <p className="text-sm text-blue-600">
                                      {summary.totalBoxes} boxes ({summary.totalWeight} kg) selected
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-lg font-bold text-blue-800">
                                      {summary.suggestedPallets} suggested pallet{summary.suggestedPallets !== 1 ? 's' : ''}
                                    </div>
                                    <div className="text-xs text-blue-600">
                                      {summary.boxesPerPallet} boxes per pallet
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        }
                        return null;
                      })()}
                      
                      {/* Boxes Selection Table - UPDATED WITH QUANTITY CONTROLS */}
                      <div className="border rounded-lg overflow-hidden">
                        <ScrollArea className="h-[300px]">
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
                                <TableHead className="text-right w-40">Quantity to Add</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {palletCreation.selectedBoxes
                                .filter(box => !palletCreation.showOnlyAvailable || !box.is_in_pallet)
                                .map((box) => (
                                  <TableRow 
                                    key={box.id}
                                    className={box.is_selected || box.selectedQuantity > 0 ? "bg-black-50" : ""}
                                  >
                                    <TableCell>
                                      <div className="flex justify-center">
                                        <Checkbox
                                          checked={box.is_selected || box.selectedQuantity > 0}
                                          onCheckedChange={() => handleToggleBoxSelection(box.id)}
                                          disabled={box.maxQuantity === 0}
                                        />
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{formatSize(box.size)}</Badge>
                                    </TableCell>
                                    <TableCell className="capitalize">
                                      {box.variety === 'fuerte' ? (
                                        <Badge className="bg-green-100 text-green-800 hover:bg-black-100 text-xs">Fuerte</Badge>
                                      ) : (
                                        <Badge className="bg-purple-100 text-purple-800 hover:bg-black-100 text-xs">Hass</Badge>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1">
                                        {box.box_type === '4kg' ? (
                                          <Box className="w-3 h-3 text-blue-500" />
                                        ) : (
                                          <Package2 className="w-3 h-3 text-orange-500" />
                                        )}
                                        <span className="text-sm">{box.box_type}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={box.grade === 'class1' ? 'default' : 'secondary'} className="text-xs">
                                        {box.grade === 'class1' ? 'Class 1' : 'Class 2'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="max-w-[100px] truncate text-sm" title={box.supplier_name}>
                                        {box.supplier_name || 'Unknown'}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="font-medium">{box.maxQuantity.toLocaleString()}</div>
                                      {box.is_in_pallet && (
                                        <div className="text-xs text-red-500">In pallet</div>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center justify-end gap-2">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="h-7 w-7 p-0"
                                          onClick={() => handleBoxQuantityChange(box.id, box.selectedQuantity - 1)}
                                          disabled={box.selectedQuantity <= 0}
                                        >
                                          <Minus className="w-3 h-3" />
                                        </Button>
                                        
                                        <div className="relative w-20">
                                          <Input
                                            type="number"
                                            min="0"
                                            max={box.maxQuantity}
                                            value={box.selectedQuantity}
                                            onChange={(e) => handleBoxQuantityChange(box.id, parseInt(e.target.value) || 0)}
                                            className="text-center pr-7"
                                          />
                                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                                            max
                                          </div>
                                        </div>
                                        
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="h-7 w-7 p-0"
                                          onClick={() => handleBoxQuantityChange(box.id, box.selectedQuantity + 1)}
                                          disabled={box.selectedQuantity >= box.maxQuantity}
                                        >
                                          <Plus className="w-3 h-3" />
                                        </Button>
                                      </div>
                                      {(box.selectedQuantity > 0) && (
                                        <div className="text-xs text-blue-600 text-right mt-1">
                                          {box.selectedQuantity} box{box.selectedQuantity !== 1 ? 'es' : ''} selected
                                          {box.maxQuantity > 0 && (
                                            <span className="text-gray-400 ml-1">
                                              ({box.maxQuantity - box.selectedQuantity} remaining)
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button
                          onClick={handleCreateManualPallet}
                          className="flex-1"
                          size="lg"
                          disabled={calculateSelectedBoxesSummary().totalBoxes === 0 || !palletCreation.palletName.trim()}
                        >
                          <Palette className="w-5 h-5 mr-2" />
                          Create Manual Pallet
                          {(() => {
                            const summary = calculateSelectedBoxesSummary();
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
                
                {/* Existing Pallets Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ListTree className="w-5 h-5" />
                      Existing Pallets
                      <Badge variant="outline" className="ml-2">
                        {pallets.length} pallets
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
                              const boxWeight = boxTypes.includes('4kg') ? 4 : 10;
                              const totalWeight = totalBoxes * boxWeight;
                              const palletName = pallet.pallet_name || `Pallet ${pallet.id.substring(0, 8)}`;
                              
                              return (
                                <Card key={pallet.id} className="overflow-hidden">
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
                                          </div>
                                          <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                            <Snowflake className="w-3 h-3" />
                                            {pallet.cold_room_id === 'coldroom1' ? 'Cold Room 1' : 'Cold Room 2'}
                                            <span className="mx-1">•</span>
                                            <Calendar className="w-3 h-3" />
                                            {formatDate(pallet.created_at)}
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
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Expanded Content */}
                                  {isExpanded && (
                                    <div className="border-t">
                                      <div className="p-4 bg-black-50">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                          <div className="bg-black p-3 rounded border">
                                            <div className="text-sm text-gray-500">Total Boxes</div>
                                            <div className="font-bold text-lg">{totalBoxes.toLocaleString()}</div>
                                          </div>
                                          <div className="bg-black p-3 rounded border">
                                            <div className="text-sm text-gray-500">Total Weight</div>
                                            <div className="font-bold text-lg">{safeToFixed(totalWeight)} kg</div>
                                          </div>
                                          <div className="bg-black p-3 rounded border">
                                            <div className="text-sm text-gray-500">Box Type</div>
                                            <div className="font-bold text-lg">
                                              {boxTypes.includes('4kg') ? '4kg Boxes' : '10kg Crates'}
                                            </div>
                                          </div>
                                          <div className="bg-black p-3 rounded border">
                                            <div className="text-sm text-gray-500">Boxes per Pallet</div>
                                            <div className="font-bold text-lg">{pallet.boxes_per_pallet}</div>
                                          </div>
                                        </div>
                                        
                                        {/* Boxes in Pallet */}
                                        <div>
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
                                                    <TableHead>Supplier</TableHead>
                                                  </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                  {pallet.boxes.map((box) => (
                                                    <TableRow key={box.id}>
                                                      <TableCell>
                                                        <Badge variant="outline">{formatSize(box.size)}</Badge>
                                                      </TableCell>
                                                      <TableCell className="capitalize">
                                                        {box.variety === 'fuerte' ? (
                                                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">Fuerte</Badge>
                                                        ) : (
                                                          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 text-xs">Hass</Badge>
                                                        )}
                                                      </TableCell>
                                                      <TableCell>
                                                        <div className="flex items-center gap-1">
                                                          {box.box_type === '4kg' ? (
                                                            <Box className="w-3 h-3 text-blue-500" />
                                                          ) : (
                                                            <Package2 className="w-3 h-3 text-orange-500" />
                                                          )}
                                                          <span className="text-sm">{box.box_type}</span>
                                                        </div>
                                                      </TableCell>
                                                      <TableCell>
                                                        <Badge variant={box.grade === 'class1' ? 'default' : 'secondary'} className="text-xs">
                                                          {box.grade === 'class1' ? 'Class 1' : 'Class 2'}
                                                        </Badge>
                                                      </TableCell>
                                                      <TableCell className="text-right font-medium">
                                                        {box.quantity.toLocaleString()}
                                                      </TableCell>
                                                      <TableCell>
                                                        <div className="text-sm truncate max-w-[120px]" title={box.supplier_name}>
                                                          {box.supplier_name || 'Unknown'}
                                                        </div>
                                                      </TableCell>
                                                    </TableRow>
                                                  ))}
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
            
            {/* Current Inventory Tab */}
            <TabsContent value="inventory" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Current Cold Room Inventory
                  </CardTitle>
                  <CardDescription>
                    Live inventory of boxes currently stored in cold rooms with detailed breakdowns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Cold Room Selection for Inventory View */}
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
                        <Badge variant="outline" className="mt-7">
                          {selectedColdRoom === 'all' ? 'Viewing All' : `Viewing ${selectedColdRoom === 'coldroom1' ? 'Cold Room 1' : 'Cold Room 2'}`}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            if (coldRoomBoxes.length === 0) {
                              toast({
                                title: 'No data to export',
                                description: 'There is no inventory data to download',
                                variant: 'destructive',
                              });
                              return;
                            }
                            
                            try {
                              exportColdRoomBoxesToCSV(coldRoomBoxes, 'cold-room-inventory');
                              
                              toast({
                                title: 'CSV Export Started',
                                description: `Downloading ${coldRoomBoxes.length} inventory records as CSV file`,
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
                          disabled={coldRoomBoxes.length === 0}
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Export to CSV
                        </Button>
                        <Button
                          onClick={fetchColdRoomBoxes}
                          variant="outline"
                          size="sm"
                          disabled={isLoading.boxes}
                        >
                          <RefreshCw className={`w-4 h-4 mr-1 ${isLoading.boxes ? 'animate-spin' : ''}`} />
                          Refresh
                        </Button>
                      </div>
                    </div>

                    {/* Summary Statistics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-blue-700">Total Boxes</div>
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-2xl font-bold text-blue-800">
                          {coldRoomBoxes
                            .filter(box => selectedColdRoom === 'all' || box.cold_room_id === selectedColdRoom)
                            .reduce((sum, box) => sum + (box.quantity || 0), 0)
                            .toLocaleString()}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          {selectedColdRoom === 'all' ? 'Across all cold rooms' : `In ${selectedColdRoom === 'coldroom1' ? 'Cold Room 1' : 'Cold Room 2'}`}
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-green-700">Total Weight</div>
                          <Weight className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold text-green-800">
                          {safeToFixed(coldRoomBoxes
                            .filter(box => selectedColdRoom === 'all' || box.cold_room_id === selectedColdRoom)
                            .reduce((sum, box) => {
                              const boxWeight = box.box_type === '4kg' ? 4 : 10;
                              return sum + ((box.quantity || 0) * boxWeight);
                            }, 0))} kg
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          {selectedColdRoom === 'all' ? 'Combined weight' : `Stored weight`}
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-purple-700">Unique Sizes</div>
                          <Layers className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="text-2xl font-bold text-purple-800">
                          {new Set(coldRoomBoxes
                            .filter(box => selectedColdRoom === 'all' || box.cold_room_id === selectedColdRoom)
                            .map(box => box.size)).size}
                        </div>
                        <div className="text-xs text-purple-600 mt-1">
                          Different avocado sizes
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-orange-700">Unique Suppliers</div>
                          <Truck className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="text-2xl font-bold text-orange-800">
                          {new Set(coldRoomBoxes
                            .filter(box => selectedColdRoom === 'all' || box.cold_room_id === selectedColdRoom)
                            .map(box => box.supplier_name)
                            .filter(Boolean)).size}
                        </div>
                        <div className="text-xs text-orange-600 mt-1">Active suppliers</div>
                      </div>
                    </div>

                    {/* Variety and Size Breakdown */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Layers className="w-5 h-5" />
                          Inventory Breakdown by Variety and Size
                        </CardTitle>
                        <CardDescription>
                          Detailed breakdown of boxes stored in {selectedColdRoom === 'all' ? 'all cold rooms' : selectedColdRoom === 'coldroom1' ? 'Cold Room 1' : 'Cold Room 2'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoading.boxes ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4 mx-auto"></div>
                            <p className="text-muted-foreground">Loading breakdown...</p>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {/* Fuerte Breakdown */}
                            <div>
                              <h3 className="font-medium text-lg mb-3 flex items-center gap-2">
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Fuerte</Badge>
                                <span className="text-green-700">Avocado Inventory</span>
                              </h3>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Fuerte Class 1 - 4kg */}
                                <Card>
                                  <CardHeader className="py-3 bg-gradient-to-r from-black-50 to-black-100">
                                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="default">Class 1</Badge>
                                        <span>4kg Boxes</span>
                                      </div>
                                      <Badge variant="outline">
                                        {coldRoomBoxes
                                          .filter(box => (selectedColdRoom === 'all' || box.cold_room_id === selectedColdRoom) && 
                                                box.variety === 'fuerte' && 
                                                box.grade === 'class1' && 
                                                box.box_type === '4kg')
                                          .reduce((sum, box) => sum + (box.quantity || 0), 0)
                                          .toLocaleString()} boxes
                                      </Badge>
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="pt-3">
                                    <div className="space-y-2">
                                      {BOX_SIZES.map(size => {
                                        const boxes = coldRoomBoxes.filter(box => 
                                          (selectedColdRoom === 'all' || box.cold_room_id === selectedColdRoom) &&
                                          box.variety === 'fuerte' && 
                                          box.grade === 'class1' && 
                                          box.box_type === '4kg' && 
                                          box.size === size
                                        );
                                        const totalQuantity = boxes.reduce((sum, box) => sum + (box.quantity || 0), 0);
                                        
                                        if (totalQuantity === 0) return null;
                                        
                                        return (
                                          <div key={size} className="flex items-center justify-between text-sm p-2 hover:bg-black-50 rounded">
                                            <div className="flex items-center gap-2">
                                              <Box className="w-4 h-4 text-green-600" />
                                              <span className="font-medium">{formatSize(size)}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                              <span className="font-bold text-green-700">{totalQuantity.toLocaleString()}</span>
                                              <span className="text-xs text-gray-500">
                                                {boxes.length} {boxes.length === 1 ? 'batch' : 'batches'}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                      {BOX_SIZES.every(size => {
                                        const totalQuantity = coldRoomBoxes.filter(box => 
                                          (selectedColdRoom === 'all' || box.cold_room_id === selectedColdRoom) &&
                                          box.variety === 'fuerte' && 
                                          box.grade === 'class1' && 
                                          box.box_type === '4kg' && 
                                          box.size === size
                                        ).reduce((sum, box) => sum + (box.quantity || 0), 0);
                                        return totalQuantity === 0;
                                      }) && (
                                        <div className="text-center py-4 text-gray-400 text-sm">
                                          No Class 1 4kg Fuerte boxes
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Fuerte Class 1 - 10kg */}
                                <Card>
                                  <CardHeader className="py-3 bg-gradient-to-r from-black-50 to-black-100">
                                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="default">Class 1</Badge>
                                        <span>10kg Crates</span>
                                      </div>
                                      <Badge variant="outline">
                                        {coldRoomBoxes
                                          .filter(box => (selectedColdRoom === 'all' || box.cold_room_id === selectedColdRoom) && 
                                                box.variety === 'fuerte' && 
                                                box.grade === 'class1' && 
                                                box.box_type === '10kg')
                                          .reduce((sum, box) => sum + (box.quantity || 0), 0)
                                          .toLocaleString()} crates
                                      </Badge>
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="pt-3">
                                    <div className="space-y-2">
                                      {BOX_SIZES.map(size => {
                                        const boxes = coldRoomBoxes.filter(box => 
                                          (selectedColdRoom === 'all' || box.cold_room_id === selectedColdRoom) &&
                                          box.variety === 'fuerte' && 
                                          box.grade === 'class1' && 
                                          box.box_type === '10kg' && 
                                          box.size === size
                                        );
                                        const totalQuantity = boxes.reduce((sum, box) => sum + (box.quantity || 0), 0);
                                        
                                        if (totalQuantity === 0) return null;
                                        
                                        return (
                                          <div key={size} className="flex items-center justify-between text-sm p-2 hover:bg-black-50 rounded">
                                            <div className="flex items-center gap-2">
                                              <Package2 className="w-4 h-4 text-green-600" />
                                              <span className="font-medium">{formatSize(size)}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                              <span className="font-bold text-green-700">{totalQuantity.toLocaleString()}</span>
                                              <span className="text-xs text-gray-500">
                                                {boxes.length} {boxes.length === 1 ? 'batch' : 'batches'}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                      {BOX_SIZES.every(size => {
                                        const totalQuantity = coldRoomBoxes.filter(box => 
                                          (selectedColdRoom === 'all' || box.cold_room_id === selectedColdRoom) &&
                                          box.variety === 'fuerte' && 
                                          box.grade === 'class1' && 
                                          box.box_type === '10kg' && 
                                          box.size === size
                                        ).reduce((sum, box) => sum + (box.quantity || 0), 0);
                                        return totalQuantity === 0;
                                      }) && (
                                        <div className="text-center py-4 text-gray-400 text-sm">
                                          No Class 1 10kg Fuerte crates
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Fuerte Class 2 - 4kg */}
                                <Card>
                                  <CardHeader className="py-3 bg-gradient-to-r from-black-50 to-black-100">
                                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="secondary">Class 2</Badge>
                                        <span>4kg Boxes</span>
                                      </div>
                                      <Badge variant="outline">
                                        {coldRoomBoxes
                                          .filter(box => (selectedColdRoom === 'all' || box.cold_room_id === selectedColdRoom) && 
                                                box.variety === 'fuerte' && 
                                                box.grade === 'class2' && 
                                                box.box_type === '4kg')
                                          .reduce((sum, box) => sum + (box.quantity || 0), 0)
                                          .toLocaleString()} boxes
                                      </Badge>
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="pt-3">
                                    <div className="space-y-2">
                                      {BOX_SIZES.map(size => {
                                        const boxes = coldRoomBoxes.filter(box => 
                                          (selectedColdRoom === 'all' || box.cold_room_id === selectedColdRoom) &&
                                          box.variety === 'fuerte' && 
                                          box.grade === 'class2' && 
                                          box.box_type === '4kg' && 
                                          box.size === size
                                        );
                                        const totalQuantity = boxes.reduce((sum, box) => sum + (box.quantity || 0), 0);
                                        
                                        if (totalQuantity === 0) return null;
                                        
                                        return (
                                          <div key={size} className="flex items-center justify-between text-sm p-2 hover:bg-black-50 rounded">
                                            <div className="flex items-center gap-2">
                                              <Box className="w-4 h-4 text-blue-600" />
                                              <span className="font-medium">{formatSize(size)}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                              <span className="font-bold text-blue-700">{totalQuantity.toLocaleString()}</span>
                                              <span className="text-xs text-gray-500">
                                                {boxes.length} {boxes.length === 1 ? 'batch' : 'batches'}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                      {BOX_SIZES.every(size => {
                                        const totalQuantity = coldRoomBoxes.filter(box => 
                                          (selectedColdRoom === 'all' || box.cold_room_id === selectedColdRoom) &&
                                          box.variety === 'fuerte' && 
                                          box.grade === 'class2' && 
                                          box.box_type === '4kg' && 
                                          box.size === size
                                        ).reduce((sum, box) => sum + (box.quantity || 0), 0);
                                        return totalQuantity === 0;
                                      }) && (
                                        <div className="text-center py-4 text-gray-400 text-sm">
                                          No Class 2 4kg Fuerte boxes
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Fuerte Class 2 - 10kg */}
                                <Card>
                                  <CardHeader className="py-3 bg-gradient-to-r from-black-50 to-black-100">
                                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="secondary">Class 2</Badge>
                                        <span>10kg Crates</span>
                                      </div>
                                      <Badge variant="outline">
                                        {coldRoomBoxes
                                          .filter(box => (selectedColdRoom === 'all' || box.cold_room_id === selectedColdRoom) && 
                                                box.variety === 'fuerte' && 
                                                box.grade === 'class2' && 
                                                box.box_type === '10kg')
                                          .reduce((sum, box) => sum + (box.quantity || 0), 0)
                                          .toLocaleString()} crates
                                      </Badge>
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="pt-3">
                                    <div className="space-y-2">
                                      {BOX_SIZES.map(size => {
                                        const boxes = coldRoomBoxes.filter(box => 
                                          (selectedColdRoom === 'all' || box.cold_room_id === selectedColdRoom) &&
                                          box.variety === 'fuerte' && 
                                          box.grade === 'class2' && 
                                          box.box_type === '10kg' && 
                                          box.size === size
                                        );
                                        const totalQuantity = boxes.reduce((sum, box) => sum + (box.quantity || 0), 0);
                                        
                                        if (totalQuantity === 0) return null;
                                        
                                        return (
                                          <div key={size} className="flex items-center justify-between text-sm p-2 hover:bg-black-50 rounded">
                                            <div className="flex items-center gap-2">
                                              <Package2 className="w-4 h-4 text-blue-600" />
                                              <span className="font-medium">{formatSize(size)}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                              <span className="font-bold text-blue-700">{totalQuantity.toLocaleString()}</span>
                                              <span className="text-xs text-gray-500">
                                                {boxes.length} {boxes.length === 1 ? 'batch' : 'batches'}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                      {BOX_SIZES.every(size => {
                                        const totalQuantity = coldRoomBoxes.filter(box => 
                                          (selectedColdRoom === 'all' || box.cold_room_id === selectedColdRoom) &&
                                          box.variety === 'fuerte' && 
                                          box.grade === 'class2' && 
                                          box.box_type === '10kg' && 
                                          box.size === size
                                        ).reduce((sum, box) => sum + (box.quantity || 0), 0);
                                        return totalQuantity === 0;
                                      }) && (
                                        <div className="text-center py-4 text-gray-400 text-sm">
                                          No Class 2 10kg Fuerte crates
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            </div>

                            {/* Hass Breakdown */}
                            <div>
                              <h3 className="font-medium text-lg mb-3 flex items-center gap-2">
                                <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Hass</Badge>
                                <span className="text-purple-700">Avocado Inventory</span>
                              </h3>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Hass Class 1 - 4kg */}
                                <Card>
                                  <CardHeader className="py-3 bg-gradient-to-r from-black-50 to-black-100">
                                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="default">Class 1</Badge>
                                        <span>4kg Boxes</span>
                                      </div>
                                      <Badge variant="outline">
                                        {coldRoomBoxes
                                          .filter(box => (selectedColdRoom === 'all' || box.cold_room_id === selectedColdRoom) && 
                                                box.variety === 'hass' && 
                                                box.grade === 'class1' && 
                                                box.box_type === '4kg')
                                          .reduce((sum, box) => sum + (box.quantity || 0), 0)
                                          .toLocaleString()} boxes
                                      </Badge>
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="pt-3">
                                    <div className="space-y-2">
                                      {BOX_SIZES.map(size => {
                                        const boxes = coldRoomBoxes.filter(box => 
                                          (selectedColdRoom === 'all' || box.cold_room_id === selectedColdRoom) &&
                                          box.variety === 'hass' && 
                                          box.grade === 'class1' && 
                                          box.box_type === '4kg' && 
                                          box.size === size
                                        );
                                        const totalQuantity = boxes.reduce((sum, box) => sum + (box.quantity || 0), 0);
                                        
                                        if (totalQuantity === 0) return null;
                                        
                                        return (
                                          <div key={size} className="flex items-center justify-between text-sm p-2 hover:bg-black-50 rounded">
                                            <div className="flex items-center gap-2">
                                              <Box className="w-4 h-4 text-purple-600" />
                                              <span className="font-medium">{formatSize(size)}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                              <span className="font-bold text-purple-700">{totalQuantity.toLocaleString()}</span>
                                              <span className="text-xs text-gray-500">
                                                {boxes.length} {boxes.length === 1 ? 'batch' : 'batches'}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                      {BOX_SIZES.every(size => {
                                        const totalQuantity = coldRoomBoxes.filter(box => 
                                          (selectedColdRoom === 'all' || box.cold_room_id === selectedColdRoom) &&
                                          box.variety === 'hass' && 
                                          box.grade === 'class1' && 
                                          box.box_type === '4kg' && 
                                          box.size === size
                                        ).reduce((sum, box) => sum + (box.quantity || 0), 0);
                                        return totalQuantity === 0;
                                      }) && (
                                        <div className="text-center py-4 text-gray-400 text-sm">
                                          No Class 1 4kg Hass boxes
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Hass Class 1 - 10kg */}
                                <Card>
                                  <CardHeader className="py-3 bg-gradient-to-r from-black-50 to-black-100">
                                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="default">Class 1</Badge>
                                        <span>10kg Crates</span>
                                      </div>
                                      <Badge variant="outline">
                                        {coldRoomBoxes
                                          .filter(box => (selectedColdRoom === 'all' || box.cold_room_id === selectedColdRoom) && 
                                                box.variety === 'hass' && 
                                                box.grade === 'class1' && 
                                                box.box_type === '10kg')
                                          .reduce((sum, box) => sum + (box.quantity || 0), 0)
                                          .toLocaleString()} crates
                                      </Badge>
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="pt-3">
                                    <div className="space-y-2">
                                      {BOX_SIZES.map(size => {
                                        const boxes = coldRoomBoxes.filter(box => 
                                          (selectedColdRoom === 'all' || box.cold_room_id === selectedColdRoom) &&
                                          box.variety === 'hass' && 
                                          box.grade === 'class1' && 
                                          box.box_type === '10kg' && 
                                          box.size === size
                                        );
                                        const totalQuantity = boxes.reduce((sum, box) => sum + (box.quantity || 0), 0);
                                        
                                        if (totalQuantity === 0) return null;
                                        
                                        return (
                                          <div key={size} className="flex items-center justify-between text-sm p-2 hover:bg-black-50 rounded">
                                            <div className="flex items-center gap-2">
                                              <Package2 className="w-4 h-4 text-purple-600" />
                                              <span className="font-medium">{formatSize(size)}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                              <span className="font-bold text-purple-700">{totalQuantity.toLocaleString()}</span>
                                              <span className="text-xs text-gray-500">
                                                {boxes.length} {boxes.length === 1 ? 'batch' : 'batches'}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                      {BOX_SIZES.every(size => {
                                        const totalQuantity = coldRoomBoxes.filter(box => 
                                          (selectedColdRoom === 'all' || box.cold_room_id === selectedColdRoom) &&
                                          box.variety === 'hass' && 
                                          box.grade === 'class1' && 
                                          box.box_type === '10kg' && 
                                          box.size === size
                                        ).reduce((sum, box) => sum + (box.quantity || 0), 0);
                                        return totalQuantity === 0;
                                      }) && (
                                        <div className="text-center py-4 text-gray-400 text-sm">
                                          No Class 1 10kg Hass crates
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Hass Class 2 - 4kg */}
                                <Card>
                                  <CardHeader className="py-3 bg-gradient-to-r from-black-50 to-black-100">
                                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="secondary">Class 2</Badge>
                                        <span>4kg Boxes</span>
                                      </div>
                                      <Badge variant="outline">
                                        {coldRoomBoxes
                                          .filter(box => (selectedColdRoom === 'all' || box.cold_room_id === selectedColdRoom) && 
                                                box.variety === 'hass' && 
                                                box.grade === 'class2' && 
                                                box.box_type === '4kg')
                                          .reduce((sum, box) => sum + (box.quantity || 0), 0)
                                          .toLocaleString()} boxes
                                      </Badge>
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="pt-3">
                                    <div className="space-y-2">
                                      {BOX_SIZES.map(size => {
                                        const boxes = coldRoomBoxes.filter(box => 
                                          (selectedColdRoom === 'all' || box.cold_room_id === selectedColdRoom) &&
                                          box.variety === 'hass' && 
                                          box.grade === 'class2' && 
                                          box.box_type === '4kg' && 
                                          box.size === size
                                        );
                                        const totalQuantity = boxes.reduce((sum, box) => sum + (box.quantity || 0), 0);
                                        
                                        if (totalQuantity === 0) return null;
                                        
                                        return (
                                          <div key={size} className="flex items-center justify-between text-sm p-2 hover:bg-black-50 rounded">
                                            <div className="flex items-center gap-2">
                                              <Box className="w-4 h-4 text-pink-600" />
                                              <span className="font-medium">{formatSize(size)}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                              <span className="font-bold text-pink-700">{totalQuantity.toLocaleString()}</span>
                                              <span className="text-xs text-gray-500">
                                                {boxes.length} {boxes.length === 1 ? 'batch' : 'batches'}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                      {BOX_SIZES.every(size => {
                                        const totalQuantity = coldRoomBoxes.filter(box => 
                                          (selectedColdRoom === 'all' || box.cold_room_id === selectedColdRoom) &&
                                          box.variety === 'hass' && 
                                          box.grade === 'class2' && 
                                          box.box_type === '4kg' && 
                                          box.size === size
                                        ).reduce((sum, box) => sum + (box.quantity || 0), 0);
                                        return totalQuantity === 0;
                                      }) && (
                                        <div className="text-center py-4 text-gray-400 text-sm">
                                          No Class 2 4kg Hass boxes
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Hass Class 2 - 10kg */}
                                <Card>
                                  <CardHeader className="py-3 bg-gradient-to-r from-black-50 to-black-100">
                                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="secondary">Class 2</Badge>
                                        <span>10kg Crates</span>
                                      </div>
                                      <Badge variant="outline">
                                        {coldRoomBoxes
                                          .filter(box => (selectedColdRoom === 'all' || box.cold_room_id === selectedColdRoom) && 
                                                box.variety === 'hass' && 
                                                box.grade === 'class2' && 
                                                box.box_type === '10kg')
                                          .reduce((sum, box) => sum + (box.quantity || 0), 0)
                                          .toLocaleString()} crates
                                      </Badge>
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="pt-3">
                                    <div className="space-y-2">
                                      {BOX_SIZES.map(size => {
                                        const boxes = coldRoomBoxes.filter(box => 
                                          (selectedColdRoom === 'all' || box.cold_room_id === selectedColdRoom) &&
                                          box.variety === 'hass' && 
                                          box.grade === 'class2' && 
                                          box.box_type === '10kg' && 
                                          box.size === size
                                        );
                                        const totalQuantity = boxes.reduce((sum, box) => sum + (box.quantity || 0), 0);
                                        
                                        if (totalQuantity === 0) return null;
                                        
                                        return (
                                          <div key={size} className="flex items-center justify-between text-sm p-2 hover:bg-black-50 rounded">
                                            <div className="flex items-center gap-2">
                                              <Package2 className="w-4 h-4 text-pink-600" />
                                              <span className="font-medium">{formatSize(size)}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                              <span className="font-bold text-pink-700">{totalQuantity.toLocaleString()}</span>
                                              <span className="text-xs text-gray-500">
                                                {boxes.length} {boxes.length === 1 ? 'batch' : 'batches'}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                      {BOX_SIZES.every(size => {
                                        const totalQuantity = coldRoomBoxes.filter(box => 
                                          (selectedColdRoom === 'all' || box.cold_room_id === selectedColdRoom) &&
                                          box.variety === 'hass' && 
                                          box.grade === 'class2' && 
                                          box.box_type === '10kg' && 
                                          box.size === size
                                        ).reduce((sum, box) => sum + (box.quantity || 0), 0);
                                        return totalQuantity === 0;
                                      }) && (
                                        <div className="text-center py-4 text-gray-400 text-sm">
                                          No Class 2 10kg Hass crates
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

                    {/* Detailed Inventory Table */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Database className="w-5 h-5" />
                          Detailed Inventory Records
                          <Badge variant="outline" className="ml-2">
                            {coldRoomBoxes
                              .filter(box => selectedColdRoom === 'all' || box.cold_room_id === selectedColdRoom)
                              .length} records
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Complete inventory records with dates, suppliers, and batch information
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoading.boxes ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4 mx-auto"></div>
                            <p className="text-muted-foreground">Loading inventory...</p>
                          </div>
                        ) : coldRoomBoxes.filter(box => selectedColdRoom === 'all' || box.cold_room_id === selectedColdRoom).length === 0 ? (
                          <div className="text-center py-8 border rounded-lg bg-gradient-to-br from-black-50 to-black">
                            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium">No inventory found</p>
                            <p className="text-sm text-gray-400 mt-1">
                              Load boxes to cold rooms to see inventory here
                            </p>
                          </div>
                        ) : (
                          <div className="border rounded-lg overflow-hidden">
                            <ScrollArea className="h-[500px]">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-black-50">
                                    <TableHead className="font-semibold">Added Date</TableHead>
                                    <TableHead className="font-semibold">Supplier</TableHead>
                                    <TableHead className="font-semibold">Pallet ID</TableHead>
                                    <TableHead className="font-semibold">Variety</TableHead>
                                    <TableHead className="font-semibold">Type</TableHead>
                                    <TableHead className="font-semibold">Size</TableHead>
                                    <TableHead className="font-semibold">Grade</TableHead>
                                    <TableHead className="font-semibold text-right">Quantity</TableHead>
                                    <TableHead className="font-semibold">Cold Room</TableHead>
                                    <TableHead className="font-semibold">Last Updated</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {[...coldRoomBoxes]
                                    .filter(box => selectedColdRoom === 'all' || box.cold_room_id === selectedColdRoom)
                                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                    .map((box) => {
                                      const boxWeight = box.box_type === '4kg' ? 4 : 10;
                                      const totalWeight = (box.quantity || 0) * boxWeight;
                                      
                                      return (
                                        <TableRow key={box.id} className="hover:bg-black-50">
                                          <TableCell>
                                            <div className="font-medium text-sm">{formatDate(box.created_at)}</div>
                                            <div className="text-xs text-gray-500">
                                              {formatDateForInput(box.created_at)}
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            <div className="max-w-[120px] truncate" title={box.supplier_name}>
                                              {box.supplier_name || 'Unknown'}
                                            </div>
                                            {box.region && (
                                              <div className="text-xs text-gray-500">{box.region}</div>
                                            )}
                                          </TableCell>
                                          <TableCell>
                                            <div className="font-mono text-xs" title={box.pallet_id}>
                                              {box.pallet_id ? `${box.pallet_id?.substring(0, 8)}...` : 'N/A'}
                                            </div>
                                          </TableCell>
                                          <TableCell className="capitalize">
                                            <div className="flex items-center gap-1">
                                              {box.variety === 'fuerte' ? (
                                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">Fuerte</Badge>
                                              ) : (
                                                <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 text-xs">Hass</Badge>
                                              )}
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            <div className="flex items-center gap-1">
                                              {box.box_type === '4kg' ? (
                                                <Box className="w-3 h-3 text-blue-500" />
                                              ) : (
                                                <Package2 className="w-3 h-3 text-orange-500" />
                                              )}
                                              <span className="text-sm">{box.box_type}</span>
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            <Badge variant="outline" className="text-xs">{formatSize(box.size)}</Badge>
                                          </TableCell>
                                          <TableCell>
                                            <Badge variant={box.grade === 'class1' ? 'default' : 'secondary'} className="text-xs">
                                              {box.grade === 'class1' ? 'Class 1' : 'Class 2'}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="text-right">
                                            <div className="font-medium text-blue-700">{(box.quantity || 0).toLocaleString()}</div>
                                            <div className="text-xs text-gray-500">
                                              {safeToFixed(totalWeight)} kg total
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            <div className="flex items-center gap-1">
                                              <Snowflake className="w-3 h-3 text-blue-500" />
                                              <span className="text-sm">{box.cold_room_id === 'coldroom1' ? 'Cold Room 1' : 'Cold Room 2'}</span>
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-sm">
                                            {box.updated_at ? formatDate(box.updated_at) : 'N/A'}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                </TableBody>
                              </Table>
                            </ScrollArea>
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