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
  Download,
  // Pallet is not exported from lucide-react - using Boxes instead
  ChevronDown,
  ChevronUp,
  Grid,
  // Additional icons that might be needed
  Boxes,
  Package2,
  Archive,
  AlertCircle,
  Info
} from 'lucide-react';

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
  // NEW: Track loaded and remaining quantities
  loadedQuantity: number;
  remainingQuantity: number;
  // Track loading history
  loadingHistory: Array<{
    quantity: number;
    targetColdRoom: string;
    timestamp: string;
  }>;
}

interface ManualPalletBox {
  id: string;
  variety: 'fuerte' | 'hass';
  boxType: '4kg' | '10kg';
  size: string;
  grade: 'class1' | 'class2';
  quantity: number;
  availableQuantity: number;
}

interface ManualPallet {
  boxes: ManualPalletBox[];
  totalBoxes: number;
  boxesPerPallet: number;
  coldRoomId: string;
  palletName: string;
}

const BOX_SIZES = [
  'size12', 'size14', 'size16', 'size18', 'size20',
  'size22', 'size24', 'size26', 'size28', 'size30'
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
  const [coldRoomPallets, setColdRoomPallets] = useState<ColdRoomPallet[]>([]);
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
  
  // State for size groups (for loading by size) - UPDATED WITH BALANCE TRACKING
  const [sizeGroups, setSizeGroups] = useState<SizeGroup[]>([]);
  
  // State for manual pallet creation
  const [manualPallets, setManualPallets] = useState<ManualPallet[]>([]);
  const [newPallet, setNewPallet] = useState<ManualPallet>({
    boxes: [],
    totalBoxes: 0,
    boxesPerPallet: 288, // Default for 4kg
    coldRoomId: 'coldroom1',
    palletName: `PALLET-${Date.now().toString().slice(-6)}`
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
          boxesData = result.data.map((box: any) => ({
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
            counting_record_id: box.counting_record_id
          }));
          setColdRoomBoxes(boxesData);
        } else {
          setColdRoomBoxes([]);
        }
      } else {
        setColdRoomBoxes([]);
      }
      
      // Process pallets response
      if (palletsResponse.status === 'fulfilled' && palletsResponse.value.ok) {
        const result = await palletsResponse.value.json();
        if (result.success && Array.isArray(result.data)) {
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
          setColdRoomPallets([]);
        }
      } else {
        setColdRoomPallets([]);
      }
      
    } catch (error) {
      console.error('Error fetching cold room boxes:', error);
      setColdRoomBoxes([]);
      setColdRoomPallets([]);
    } finally {
      setIsLoading(prev => ({ ...prev, boxes: false, pallets: false }));
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
  const fetchCountingRecords = async () => {
    setIsLoading(prev => ({ ...prev, countingRecords: true }));
    try {
      // Fetch counting records with status 'pending_coldroom' and for_coldroom = true
      const response = await fetch('/api/counting?action=coldroom');
      const result = await response.json();
      
      if (result.success) {
        const records = safeArray(result.data).filter((record: any) => 
          record.for_coldroom === true && 
          record.status === 'pending_coldroom'
        );
        
        // Process records to ensure counting_data and totals are properly parsed
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
          
          return {
            ...record,
            counting_data,
            totals
          };
        });
        
        setCountingRecords(processedRecords);
        
        if (processedRecords.length > 0) {
          toast({
            title: "📦 Counting Records Found",
            description: `Found ${processedRecords.length} records ready for cold room loading`,
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
  };
  
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
  
  // Process counting records into size groups - UPDATED WITH BALANCE TRACKING
  const processSizeGroups = () => {
    if (countingRecords.length === 0) {
      setSizeGroups([]);
      return;
    }
    
    const selectedRecordIds = Array.from(selectedRecords);
    const selectedRecordsData = countingRecords.filter(record => selectedRecordIds.includes(record.id));
    
    const sizeGroupMap: Record<string, SizeGroup> = {};
    
    selectedRecordsData.forEach(record => {
      const countingData = record.counting_data || {};
      const totals = record.totals || {};
      
      // Extract box data from counting_data
      Object.keys(countingData).forEach(key => {
        if ((key.includes('fuerte_') || key.includes('hass_')) && 
            (key.includes('_4kg_') || key.includes('_10kg_'))) {
          
          const parts = key.split('_');
          if (parts.length >= 4) {
            const variety = parts[0] as 'fuerte' | 'hass';
            const boxType = parts[1] as '4kg' | '10kg';
            const grade = parts[2] as 'class1' | 'class2';
            const size = parts.slice(3).join('_').replace(/_/g, '');
            const quantity = Number(countingData[key]) || 0;
            
            if (quantity > 0) {
              const cleanSize = size.startsWith('size') ? size : `size${size}`;
              const groupKey = `${variety}-${boxType}-${cleanSize}-${grade}`;
              
              if (!sizeGroupMap[groupKey]) {
                sizeGroupMap[groupKey] = {
                  size: cleanSize,
                  variety,
                  boxType,
                  grade,
                  totalQuantity: 0,
                  coldRoomId: '',
                  supplierName: record.supplier_name,
                  palletId: record.pallet_id,
                  region: record.region,
                  countingRecordId: record.id,
                  selectedForLoading: false,
                  loadingQuantity: 0,
                  targetColdRoom: 'coldroom1',
                  // Initialize balance tracking
                  loadedQuantity: 0,
                  remainingQuantity: 0,
                  loadingHistory: []
                };
              }
              
              sizeGroupMap[groupKey].totalQuantity += quantity;
              // Initialize remaining quantity as total quantity (none loaded yet)
              sizeGroupMap[groupKey].remainingQuantity = sizeGroupMap[groupKey].totalQuantity;
            }
          }
        }
      });
    });
    
    // Convert map to array
    const sizeGroupsArray = Object.values(sizeGroupMap);
    setSizeGroups(sizeGroupsArray);
  };
  
  // Update when selected records change
  useEffect(() => {
    processSizeGroups();
  }, [selectedRecords, countingRecords]);
  
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
  
  // Handle size group selection - UPDATED WITH BALANCE VALIDATION
  const handleToggleSizeGroupSelection = (index: number) => {
    const updatedGroups = [...sizeGroups];
    const group = updatedGroups[index];
    
    // If we're selecting a group that has no remaining quantity, don't allow selection
    if (!group.selectedForLoading && group.remainingQuantity === 0) {
      toast({
        title: 'No boxes available',
        description: `No remaining boxes for ${formatSize(group.size)} ${group.variety} ${group.boxType}`,
        variant: 'destructive',
      });
      return;
    }
    
    group.selectedForLoading = !group.selectedForLoading;
    // Set loading quantity to available balance, but max 100
    group.loadingQuantity = group.selectedForLoading ? 
      Math.min(group.remainingQuantity, 100) : 0;
    setSizeGroups(updatedGroups);
  };
  
  const handleSizeGroupQuantityChange = (index: number, quantity: number) => {
    const updatedGroups = [...sizeGroups];
    const group = updatedGroups[index];
    
    // Cannot load more than remaining quantity
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
  
  // Load selected size groups to cold room - UPDATED WITH BALANCE TRACKING
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
      // Prepare boxes data from selected size groups
      const boxesData: any[] = [];
      const countingRecordIds = new Set<string>();
      
      selectedGroups.forEach(group => {
        if (group.loadingQuantity > 0 && group.loadingQuantity <= group.remainingQuantity) {
          boxesData.push({
            variety: group.variety,
            boxType: group.boxType,
            size: group.size,
            grade: group.grade,
            quantity: group.loadingQuantity,
            coldRoomId: group.targetColdRoom,
            supplierName: group.supplierName || 'Unknown Supplier',
            palletId: group.palletId || `PAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            region: group.region || '',
            countingRecordId: group.countingRecordId,
            loadedBy: 'Warehouse Staff'
          });
          
          if (group.countingRecordId) {
            countingRecordIds.add(group.countingRecordId);
          }
        }
      });
      
      console.log('📤 Loading size groups to cold room:', {
        groupsCount: selectedGroups.length,
        totalBoxes: selectedGroups.reduce((sum, group) => sum + group.loadingQuantity, 0)
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
        const totalBoxes = selectedGroups.reduce((sum, group) => sum + group.loadingQuantity, 0);
        
        // Update size groups with loaded quantities and track balance
        const updatedGroups = [...sizeGroups];
        selectedGroups.forEach(group => {
          const groupIndex = updatedGroups.findIndex(g => 
            g.size === group.size && 
            g.variety === group.variety && 
            g.boxType === group.boxType && 
            g.grade === group.grade
          );
          
          if (groupIndex !== -1) {
            const loadedQty = group.loadingQuantity;
            updatedGroups[groupIndex].loadedQuantity += loadedQty;
            updatedGroups[groupIndex].remainingQuantity -= loadedQty;
            
            // Add to loading history
            updatedGroups[groupIndex].loadingHistory.push({
              quantity: loadedQty,
              targetColdRoom: group.targetColdRoom,
              timestamp: new Date().toISOString()
            });
            
            // Reset selection for this group
            updatedGroups[groupIndex].selectedForLoading = false;
            updatedGroups[groupIndex].loadingQuantity = 0;
          }
        });
        
        setSizeGroups(updatedGroups);
        
        toast({
          title: '✅ Boxes Loaded Successfully!',
          description: (
            <div className="space-y-2">
              <p>Loaded {selectedGroups.length} size groups ({totalBoxes.toLocaleString()} boxes)</p>
              <div className="text-sm text-gray-600">
                Distributed to different cold rooms as selected
              </div>
              <p className="text-xs text-green-600 mt-1">
                Updated {countingRecordIds.size} counting record(s)
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Remaining boxes: {updatedGroups.reduce((sum, group) => sum + group.remainingQuantity, 0).toLocaleString()}
              </p>
            </div>
          ),
        });
        
        // Refresh cold room data
        await Promise.all([
          fetchColdRoomBoxes(),
          fetchColdRoomStats(),
          fetchColdRooms(),
        ]);
        
        // Only clear selected records if all quantities have been loaded
        const hasRemainingBoxes = updatedGroups.some(group => group.remainingQuantity > 0);
        if (!hasRemainingBoxes) {
          setSelectedRecords(new Set());
        }
        
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
  
  // Set up polling and initial load
  useEffect(() => {
    fetchAllData();
    
    // Refresh counting records when localStorage indicates new data
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
  }, []);
  
  // Handle record temperature
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
  
  // Handle repacking form operations
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
  
  // Handle repacking as inventory update
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
  
  // Get stats for selected cold room
  const getSelectedRoomStats = () => {
    if (!coldRoomStats) return null;
    return selectedColdRoom === 'coldroom1' ? coldRoomStats.coldroom1 : coldRoomStats.coldroom2;
  };
  
  const selectedRoomStats = getSelectedRoomStats();
  
  // Calculate summary for selected counting records
  const calculateSelectedSummary = () => {
    const selected = countingRecords.filter(record => selectedRecords.has(record.id));
    
    const totalBoxes = selected.reduce((sum, record) => {
      const totals = record.totals || {};
      return sum + (totals.fuerte_4kg_total || 0) + (totals.fuerte_10kg_total || 0) + 
                    (totals.hass_4kg_total || 0) + (totals.hass_10kg_total || 0);
    }, 0);
    
    const totalWeight = selected.reduce((sum, record) => sum + (record.total_counted_weight || 0), 0);
    const totalSuppliers = new Set(selected.map(record => record.supplier_name)).size;
    
    return { totalRecords: selected.length, totalBoxes, totalWeight, totalSuppliers };
  };
  
  const selectedSummary = calculateSelectedSummary();
  
  // Calculate size group summary - UPDATED WITH BALANCE INFORMATION
  const calculateSizeGroupSummary = () => {
    const selectedGroups = sizeGroups.filter(group => group.selectedForLoading && group.loadingQuantity > 0);
    const allGroups = sizeGroups.filter(group => group.remainingQuantity > 0);
    
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
    
    // Calculate overall balance
    const totalAvailable = sizeGroups.reduce((sum, group) => sum + group.remainingQuantity, 0);
    const totalLoaded = sizeGroups.reduce((sum, group) => sum + group.loadedQuantity, 0);
    
    return {
      totalGroups: selectedGroups.length,
      totalBoxes,
      totalWeight,
      coldroom1Boxes,
      coldroom2Boxes,
      totalAvailable,
      totalLoaded,
      remainingGroups: allGroups.length
    };
  };
  
  const sizeGroupSummary = calculateSizeGroupSummary();
  
  // Manual pallet creation functions
  const addBoxToPallet = (box: ColdRoomBox) => {
    const existingBoxIndex = newPallet.boxes.findIndex(b => 
      b.variety === box.variety && 
      b.boxType === box.box_type && 
      b.size === box.size && 
      b.grade === box.grade
    );
    
    if (existingBoxIndex > -1) {
      // Update existing box
      const updatedBoxes = [...newPallet.boxes];
      updatedBoxes[existingBoxIndex].quantity += 1;
      updatedBoxes[existingBoxIndex].availableQuantity = Math.max(0, updatedBoxes[existingBoxIndex].availableQuantity - 1);
      setNewPallet(prev => ({
        ...prev,
        boxes: updatedBoxes,
        totalBoxes: prev.totalBoxes + 1
      }));
    } else {
      // Add new box
      const manualBox: ManualPalletBox = {
        id: box.id,
        variety: box.variety,
        boxType: box.box_type,
        size: box.size,
        grade: box.grade,
        quantity: 1,
        availableQuantity: box.quantity - 1
      };
      
      setNewPallet(prev => ({
        ...prev,
        boxes: [...prev.boxes, manualBox],
        totalBoxes: prev.totalBoxes + 1
      }));
    }
  };
  
  const removeBoxFromPallet = (index: number) => {
    const updatedBoxes = [...newPallet.boxes];
    const removedBox = updatedBoxes[index];
    
    // Restore available quantity
    const originalBox = coldRoomBoxes.find(b => b.id === removedBox.id);
    if (originalBox) {
      // Update available quantity for similar boxes
      const similarBoxes = coldRoomBoxes.filter(b => 
        b.variety === removedBox.variety && 
        b.box_type === removedBox.boxType && 
        b.size === removedBox.size && 
        b.grade === removedBox.grade
      );
      
      const totalAvailable = similarBoxes.reduce((sum, b) => sum + b.quantity, 0);
      
      // Find and update the box in newPallet
      const boxInPallet = newPallet.boxes.find(b => 
        b.variety === removedBox.variety && 
        b.boxType === removedBox.boxType && 
        b.size === removedBox.size && 
        b.grade === removedBox.grade
      );
      
      if (boxInPallet) {
        boxInPallet.availableQuantity = totalAvailable - boxInPallet.quantity;
      }
    }
    
    updatedBoxes.splice(index, 1);
    
    setNewPallet(prev => ({
      ...prev,
      boxes: updatedBoxes,
      totalBoxes: prev.totalBoxes - removedBox.quantity
    }));
  };
  
  const updateBoxQuantity = (index: number, quantity: number) => {
    const updatedBoxes = [...newPallet.boxes];
    const oldQuantity = updatedBoxes[index].quantity;
    const maxAvailable = updatedBoxes[index].availableQuantity + oldQuantity;
    
    if (quantity >= 1 && quantity <= maxAvailable) {
      updatedBoxes[index].quantity = quantity;
      updatedBoxes[index].availableQuantity = maxAvailable - quantity;
      
      setNewPallet(prev => ({
        ...prev,
        boxes: updatedBoxes,
        totalBoxes: prev.totalBoxes - oldQuantity + quantity
      }));
    }
  };
  
  const createManualPallet = async () => {
    if (newPallet.boxes.length === 0) {
      toast({
        title: 'Empty pallet',
        description: 'Please add boxes to the pallet',
        variant: 'destructive',
      });
      return;
    }
    
    if (newPallet.totalBoxes < newPallet.boxesPerPallet) {
      toast({
        title: 'Insufficient boxes',
        description: `A pallet requires ${newPallet.boxesPerPallet} boxes for ${newPallet.boxesPerPallet === 288 ? '4kg' : '10kg'} boxes`,
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Create pallet record
      const palletId = `PAL-MANUAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const response = await fetch('/api/cold-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create-manual-pallet',
          palletId: palletId,
          palletName: newPallet.palletName,
          coldRoomId: newPallet.coldRoomId,
          boxes: newPallet.boxes,
          boxesPerPallet: newPallet.boxesPerPallet,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: '✅ Pallet Created Successfully!',
          description: `Created pallet "${newPallet.palletName}" with ${newPallet.totalBoxes} boxes`,
        });
        
        // Add to manual pallets list
        setManualPallets(prev => [...prev, { ...newPallet }]);
        
        // Reset new pallet
        setNewPallet({
          boxes: [],
          totalBoxes: 0,
          boxesPerPallet: newPallet.boxesPerPallet,
          coldRoomId: newPallet.coldRoomId,
          palletName: `PALLET-${Date.now().toString().slice(-6)}`
        });
        
        // Refresh data
        fetchColdRoomBoxes();
        fetchColdRoomPallets();
        
      } else {
        throw new Error(result.error || 'Failed to create pallet');
      }
    } catch (error: any) {
      console.error('❌ Error creating pallet:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create pallet',
        variant: 'destructive',
      });
    }
  };
  
  // Export CSV functionality for cold_room_boxes
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
              <TabsTrigger value="history">Current Inventory</TabsTrigger>
            </TabsList>
            
            {/* Load Boxes Tab - UPDATED FOR BALANCE TRACKING */}
            <TabsContent value="loading" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Warehouse className="w-5 h-5" />
                    Load Boxes to Cold Room - By Size Groups
                  </CardTitle>
                  <CardDescription>
                    Select counting records and load boxes by size to different cold rooms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Available Counting Records</h3>
                        <p className="text-sm text-muted-foreground">
                          Records with status 'pending_coldroom' are ready to load
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
                                  <TableHead>Submitted</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {countingRecords.map((record) => {
                                  const totals = record.totals || {};
                                  const totalBoxes = (totals.fuerte_4kg_total || 0) + (totals.fuerte_10kg_total || 0) + 
                                                    (totals.hass_4kg_total || 0) + (totals.hass_10kg_total || 0);
                                  const boxTypes = [
                                    totals.fuerte_4kg_total > 0 && 'Fuerte 4kg',
                                    totals.fuerte_10kg_total > 0 && 'Fuerte 10kg',
                                    totals.hass_4kg_total > 0 && 'Hass 4kg',
                                    totals.hass_10kg_total > 0 && 'Hass 10kg'
                                  ].filter(Boolean).join(', ');
                                  
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
                                        <div className="text-xs text-gray-500">Total: {totalBoxes} boxes</div>
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
                                Counting records with status 'pending_coldroom' will appear here
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* Size Groups Table - UPDATED WITH BALANCE COLUMNS */}
                        {selectedRecords.size > 0 && (
                          <div className="mt-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="font-medium">Size Groups from Selected Records</h3>
                                <p className="text-sm text-muted-foreground">
                                  Select sizes and quantities to load to different cold rooms
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant="outline">
                                  {sizeGroups.length} size groups
                                </Badge>
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                  {sizeGroupSummary.totalAvailable.toLocaleString()} boxes available
                                </Badge>
                              </div>
                            </div>
                            
                            {/* Balance Summary Card */}
                            <Card className="mb-4 bg-blue-50 border-blue-200">
                              <CardContent className="py-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Info className="w-5 h-5 text-blue-600" />
                                    <div>
                                      <p className="text-sm font-medium text-blue-800">Balance Tracking</p>
                                      <p className="text-xs text-blue-600">
                                        Track remaining boxes after each load
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-4">
                                    <div className="text-center">
                                      <p className="text-xs text-gray-500">Total Available</p>
                                      <p className="text-lg font-bold text-blue-700">
                                        {sizeGroupSummary.totalAvailable.toLocaleString()}
                                      </p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-xs text-gray-500">Already Loaded</p>
                                      <p className="text-lg font-bold text-green-700">
                                        {sizeGroupSummary.totalLoaded.toLocaleString()}
                                      </p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-xs text-gray-500">Selected to Load</p>
                                      <p className="text-lg font-bold text-orange-700">
                                        {sizeGroupSummary.totalBoxes.toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            
                            <ScrollArea className="h-[400px] border rounded">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-black-50">
                                    <TableHead className="w-12">Load</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead>Variety</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Grade</TableHead>
                                    <TableHead className="text-right">Available</TableHead>
                                    <TableHead className="text-right">Remaining</TableHead>
                                    <TableHead className="text-right">Already Loaded</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Cold Room</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {sizeGroups.map((group, index) => (
                                    <TableRow 
                                      key={`${group.variety}-${group.boxType}-${group.size}-${group.grade}`}
                                      className={group.selectedForLoading ? "bg-black-50" : ""}
                                    >
                                      <TableCell>
                                        <input
                                          type="checkbox"
                                          checked={group.selectedForLoading}
                                          onChange={() => handleToggleSizeGroupSelection(index)}
                                          disabled={group.remainingQuantity === 0}
                                          className="h-4 w-4 rounded border-gray-300 disabled:opacity-50"
                                        />
                                      </TableCell>
                                      <TableCell className="font-medium">
                                        {formatSize(group.size)}
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
                                        <div className={`font-medium ${group.remainingQuantity === 0 ? 'text-red-600' : 'text-green-600'}`}>
                                          {group.remainingQuantity.toLocaleString()}
                                        </div>
                                        {group.remainingQuantity === 0 && (
                                          <div className="text-xs text-red-500">All loaded</div>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className={`font-medium ${group.loadedQuantity > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                                          {group.loadedQuantity.toLocaleString()}
                                        </div>
                                        {group.loadedQuantity > 0 && (
                                          <div className="text-xs text-green-500">
                                            {Math.round((group.loadedQuantity / group.totalQuantity) * 100)}%
                                          </div>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          <Input
                                            type="number"
                                            min="0"
                                            max={group.remainingQuantity}
                                            value={group.loadingQuantity}
                                            onChange={(e) => handleSizeGroupQuantityChange(index, parseInt(e.target.value) || 0)}
                                            disabled={!group.selectedForLoading || group.remainingQuantity === 0}
                                            className="w-24"
                                          />
                                          <div className="text-xs text-gray-500 w-8">
                                            max: {group.remainingQuantity}
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Select
                                          value={group.targetColdRoom}
                                          onValueChange={(value) => handleSizeGroupTargetChange(index, value)}
                                          disabled={!group.selectedForLoading || group.remainingQuantity === 0}
                                        >
                                          <SelectTrigger className="w-32">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="coldroom1">Cold Room 1</SelectItem>
                                            <SelectItem value="coldroom2">Cold Room 2</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </ScrollArea>
                            
                            {/* Size Group Summary - UPDATED WITH BALANCE INFO */}
                            {sizeGroupSummary.totalGroups > 0 && (
                              <Card className="mt-4">
                                <CardHeader className="py-3">
                                  <CardTitle className="text-sm font-medium">Load Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                                          <span className="font-medium text-blue-600">
                                            {sizeGroupSummary.totalBoxes.toLocaleString()}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-sm text-blue-600">Remaining Groups:</span>
                                          <span className="font-medium text-blue-600">
                                            {sizeGroupSummary.remainingGroups}
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
                                          <span className="font-medium">
                                            {safeToFixed(sizeGroupSummary.totalWeight)} kg
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-sm text-green-600">Average per Box:</span>
                                          <span className="font-medium text-green-600">
                                            {safeToFixed(sizeGroupSummary.totalWeight / Math.max(1, sizeGroupSummary.totalBoxes))} kg
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
                                          <span className="font-medium text-purple-600">
                                            {sizeGroupSummary.coldroom1Boxes.toLocaleString()}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-sm text-purple-600">Percentage:</span>
                                          <span className="font-medium text-purple-600">
                                            {Math.round((sizeGroupSummary.coldroom1Boxes / Math.max(1, sizeGroupSummary.totalBoxes)) * 100)}%
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
                                          <span className="font-medium text-orange-600">
                                            {sizeGroupSummary.coldroom2Boxes.toLocaleString()}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-sm text-orange-600">Percentage:</span>
                                          <span className="font-medium text-orange-600">
                                            {Math.round((sizeGroupSummary.coldroom2Boxes / Math.max(1, sizeGroupSummary.totalBoxes)) * 100)}%
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="border rounded p-4 bg-red-50">
                                      <div className="flex items-center gap-2 mb-3">
                                        <AlertCircle className="w-5 h-5 text-red-600" />
                                        <div>
                                          <span className="font-medium">Balance Info</span>
                                          <p className="text-xs text-red-600">After this load</p>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                          <span className="text-sm">Will Remain:</span>
                                          <span className="font-medium">
                                            {(sizeGroupSummary.totalAvailable - sizeGroupSummary.totalBoxes).toLocaleString()}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-sm">Total Loaded:</span>
                                          <span className="font-medium text-green-600">
                                            {(sizeGroupSummary.totalLoaded + sizeGroupSummary.totalBoxes).toLocaleString()}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                            
                            {/* Load Button */}
                            <div className="flex gap-3 mt-4">
                              <Button
                                onClick={handleLoadSizeGroups}
                                className="flex-1"
                                size="lg"
                                disabled={sizeGroupSummary.totalGroups === 0}
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                Load Selected Sizes to Cold Rooms
                                <span className="ml-2">
                                  ({sizeGroupSummary.totalGroups} sizes, {sizeGroupSummary.totalBoxes} boxes)
                                </span>
                              </Button>
                            </div>
                            
                            {/* Loading History Section */}
                            {sizeGroups.some(group => group.loadingHistory.length > 0) && (
                              <Card className="mt-6">
                                <CardHeader className="py-3">
                                  <CardTitle className="text-sm font-medium">Loading History for Selected Records</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <ScrollArea className="h-[200px] border rounded">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Size</TableHead>
                                          <TableHead>Variety</TableHead>
                                          <TableHead>Type</TableHead>
                                          <TableHead>Loaded Qty</TableHead>
                                          <TableHead>Cold Room</TableHead>
                                          <TableHead>Time</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {sizeGroups
                                          .filter(group => group.loadingHistory.length > 0)
                                          .flatMap(group => 
                                            group.loadingHistory.map((history, idx) => (
                                              <TableRow key={`${group.size}-${group.variety}-${idx}`}>
                                                <TableCell>{formatSize(group.size)}</TableCell>
                                                <TableCell className="capitalize">{group.variety}</TableCell>
                                                <TableCell>{group.boxType}</TableCell>
                                                <TableCell className="font-medium">
                                                  {history.quantity.toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                  {history.targetColdRoom === 'coldroom1' ? 'Cold Room 1' : 'Cold Room 2'}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                  {formatDate(history.timestamp)}
                                                </TableCell>
                                              </TableRow>
                                            ))
                                          )}
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
            
            {/* Live Inventory Tab - WITH MANUAL PALLET CREATION */}
            <TabsContent value="inventory" className="space-y-6 mt-6">
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
                              <TableHead>Supplier</TableHead>
                              <TableHead>Variety</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Size</TableHead>
                              <TableHead>Grade</TableHead>
                              <TableHead className="text-right">Quantity</TableHead>
                              <TableHead className="text-right">Date In</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {safeArray(coldRoomBoxes)
                              .filter(box => box.cold_room_id === selectedColdRoom)
                              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                              .map((box) => (
                                <TableRow key={box.id}>
                                  <TableCell className="font-medium">
                                    <div className="max-w-[120px] truncate" title={box.supplier_name}>
                                      {box.supplier_name || 'Unknown'}
                                    </div>
                                  </TableCell>
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
                                  <TableCell className="text-right">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => addBoxToPallet(box)}
                                      disabled={box.quantity <= 0}
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Add to Pallet
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
                
                {/* Manual Pallet Creation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Boxes className="w-5 h-5" /> {/* Using Boxes icon instead of Pallet */}
                      Manual Pallet Creation
                    </CardTitle>
                    <CardDescription>
                      Create custom pallets by mixing different sizes from inventory
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Pallet Configuration */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="palletName">Pallet Name</Label>
                          <Input
                            id="palletName"
                            value={newPallet.palletName}
                            onChange={(e) => setNewPallet(prev => ({ ...prev, palletName: e.target.value }))}
                            placeholder="Enter pallet name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="boxesPerPallet">Boxes per Pallet</Label>
                          <Select
                            value={newPallet.boxesPerPallet.toString()}
                            onValueChange={(value) => setNewPallet(prev => ({ 
                              ...prev, 
                              boxesPerPallet: parseInt(value) 
                            }))}
                          >
                            <SelectTrigger id="boxesPerPallet">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="288">288 boxes (4kg)</SelectItem>
                              <SelectItem value="120">120 crates (10kg)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="palletColdRoom">Cold Room</Label>
                        <Select
                          value={newPallet.coldRoomId}
                          onValueChange={(value) => setNewPallet(prev => ({ 
                            ...prev, 
                            coldRoomId: value 
                          }))}
                        >
                          <SelectTrigger id="palletColdRoom">
                            <SelectValue placeholder="Select cold room" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="coldroom1">Cold Room 1</SelectItem>
                            <SelectItem value="coldroom2">Cold Room 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Current Pallet Contents */}
                      <div className="border rounded p-4">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="font-medium">Pallet Contents</Label>
                          <Badge variant="outline">
                            {newPallet.totalBoxes}/{newPallet.boxesPerPallet} boxes
                          </Badge>
                        </div>
                        
                        {newPallet.boxes.length === 0 ? (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            No boxes added to pallet yet
                          </div>
                        ) : (
                          <ScrollArea className="h-[200px]">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Size</TableHead>
                                  <TableHead>Variety</TableHead>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Grade</TableHead>
                                  <TableHead className="text-right">Quantity</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {newPallet.boxes.map((box, index) => (
                                  <TableRow key={`${box.variety}-${box.boxType}-${box.size}-${box.grade}`}>
                                    <TableCell>{formatSize(box.size)}</TableCell>
                                    <TableCell className="capitalize">{box.variety}</TableCell>
                                    <TableCell>{box.boxType}</TableCell>
                                    <TableCell>
                                      <Badge variant={box.grade === 'class1' ? 'default' : 'secondary'}>
                                        {box.grade === 'class1' ? 'Class 1' : 'Class 2'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => updateBoxQuantity(index, box.quantity - 1)}
                                          disabled={box.quantity <= 1}
                                          className="h-6 w-6 p-0"
                                        >
                                          <Minus className="w-3 h-3" />
                                        </Button>
                                        <span className="font-medium w-8 text-center">{box.quantity}</span>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => updateBoxQuantity(index, box.quantity + 1)}
                                          disabled={box.quantity >= box.availableQuantity + box.quantity}
                                          className="h-6 w-6 p-0"
                                        >
                                          <Plus className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => removeBoxFromPallet(index)}
                                        className="h-6 w-6 p-0 text-red-500"
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </ScrollArea>
                        )}
                        
                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Pallet Progress</span>
                            <span>{newPallet.totalBoxes}/{newPallet.boxesPerPallet} boxes</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${newPallet.totalBoxes >= newPallet.boxesPerPallet ? 'bg-green-500' : 'bg-blue-500'}`}
                              style={{ width: `${Math.min((newPallet.totalBoxes / newPallet.boxesPerPallet) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Create Pallet Button */}
                      <Button
                        onClick={createManualPallet}
                        className="w-full"
                        disabled={newPallet.totalBoxes < newPallet.boxesPerPallet}
                      >
                        <Boxes className="w-4 h-4 mr-2" /> {/* Using Boxes icon */}
                        Create Manual Pallet
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Pallet Conversion Summary */}
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
                  {isLoading.pallets ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4 mx-auto"></div>
                      <p className="text-muted-foreground">Loading pallet data...</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[300px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Pallet Name</TableHead>
                            <TableHead>Variety</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Cold Room</TableHead>
                            <TableHead className="text-right">Pallet Count</TableHead>
                            <TableHead className="text-right">Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {safeArray(coldRoomPallets)
                            .filter(pallet => pallet.cold_room_id === selectedColdRoom)
                            .map((pallet) => (
                              <TableRow key={pallet.id}>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <Boxes className="w-4 h-4" /> {/* Using Boxes icon */}
                                    {pallet.id.substring(0, 12)}...
                                  </div>
                                </TableCell>
                                <TableCell className="capitalize">
                                  {pallet.variety === 'fuerte' ? 'Fuerte' : 'Hass'}
                                </TableCell>
                                <TableCell>{pallet.box_type}</TableCell>
                                <TableCell>
                                  {pallet.cold_room_id === 'coldroom1' ? 'Cold Room 1' : 'Cold Room 2'}
                                </TableCell>
                                <TableCell className="text-right font-bold">
                                  {pallet.pallet_count}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {formatDate(pallet.created_at)}
                                </TableCell>
                              </TableRow>
                            ))}
                          
                          {/* Manual Pallets */}
                          {manualPallets
                            .filter(pallet => pallet.coldRoomId === selectedColdRoom)
                            .map((pallet, index) => (
                              <TableRow key={`manual-${index}`} className="bg-blue-50">
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <Boxes className="w-4 h-4" /> {/* Using Boxes icon */}
                                    {pallet.palletName}
                                    <Badge variant="outline" className="ml-2">Manual</Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="capitalize">
                                  Mixed
                                </TableCell>
                                <TableCell>Mixed</TableCell>
                                <TableCell>
                                  {pallet.coldRoomId === 'coldroom1' ? 'Cold Room 1' : 'Cold Room 2'}
                                </TableCell>
                                <TableCell className="text-right font-bold">
                                  {Math.floor(pallet.totalBoxes / pallet.boxesPerPallet)}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  Manual Creation
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
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
            
            {/* Current Inventory Tab - SHOWING COLD_ROOM_BOXES */}
            <TabsContent value="history" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Current Cold Room Inventory
                  </CardTitle>
                  <CardDescription>
                    Live inventory of boxes currently stored in cold rooms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-gray-500">Current Boxes</div>
                          <Package className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="text-2xl font-bold text-blue-700">
                          {coldRoomBoxes.reduce((sum, box) => sum + (box.quantity || 0), 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {coldRoomBoxes.filter(b => b.cold_room_id === 'coldroom1').length} in CR1, 
                          {coldRoomBoxes.filter(b => b.cold_room_id === 'coldroom2').length} in CR2
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-gray-500">Unique Suppliers</div>
                          <Truck className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="text-2xl font-bold text-green-700">
                          {new Set(coldRoomBoxes.map(box => box.supplier_name).filter(Boolean)).size}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Active suppliers in inventory</div>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-gray-500">Total Weight</div>
                          <Weight className="w-4 h-4 text-purple-500" />
                        </div>
                        <div className="text-2xl font-bold text-purple-700">
                          {safeToFixed(coldRoomBoxes.reduce((sum, box) => {
                            const boxWeight = box.box_type === '4kg' ? 4 : 10;
                            return sum + ((box.quantity || 0) * boxWeight);
                          }, 0))} kg
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Current stored weight</div>
                      </div>
                    </div>
                    
                    {/* Export Button */}
                    <div className="flex justify-end">
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
                        Export Inventory to CSV
                      </Button>
                    </div>
                    
                    {/* Inventory Table */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <Label>Current Inventory ({coldRoomBoxes.length} boxes)</Label>
                        <Badge variant="outline">
                          {new Set(coldRoomBoxes.map(box => {
                            const date = box.created_at || '';
                            return date ? date.split('T')[0] : '';
                          }).filter(Boolean)).size} days of inventory
                        </Badge>
                      </div>
                      
                      {isLoading.boxes ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4 mx-auto"></div>
                          <p className="text-muted-foreground">Loading inventory...</p>
                        </div>
                      ) : coldRoomBoxes.length === 0 ? (
                        <div className="text-center py-8 border rounded">
                          <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                          <p className="text-gray-500 font-medium">No inventory found</p>
                          <p className="text-sm text-gray-400 mt-1">
                            Load boxes to cold rooms to see inventory here
                          </p>
                        </div>
                      ) : (
                        <ScrollArea className="h-[500px] border rounded">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Added Date</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Pallet ID</TableHead>
                                <TableHead>Variety</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>Grade</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead>Cold Room</TableHead>
                                <TableHead>Last Updated</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {[...coldRoomBoxes]
                                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                .map((box) => {
                                  const boxWeight = box.box_type === '4kg' ? 4 : 10;
                                  const totalWeight = (box.quantity || 0) * boxWeight;
                                  
                                  return (
                                    <TableRow key={box.id}>
                                      <TableCell>
                                        <div className="font-medium">{formatDate(box.created_at)}</div>
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
                                        {box.variety === 'fuerte' ? 'Fuerte' : 'Hass'}
                                      </TableCell>
                                      <TableCell>{box.box_type}</TableCell>
                                      <TableCell>{formatSize(box.size)}</TableCell>
                                      <TableCell>
                                        <Badge variant={box.grade === 'class1' ? 'default' : 'secondary'}>
                                          {box.grade === 'class1' ? 'Class 1' : 'Class 2'}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="font-medium">{(box.quantity || 0).toLocaleString()}</div>
                                        <div className="text-xs text-gray-500">
                                          {safeToFixed(totalWeight)} kg total
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-1">
                                          <Snowflake className="w-3 h-3" />
                                          {box.cold_room_id === 'coldroom1' ? 'Cold Room 1' : 'Cold Room 2'}
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