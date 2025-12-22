'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Truck, PackageCheck, Clock, RefreshCw, Printer, Download, FileText, BarChart3, Layers, Users, Calendar, Grid, Plus, Trash2, Save, Loader2, ChevronDown, CheckCircle, XCircle, AlertCircle, FileSpreadsheet, Container, ArrowRight, History, Search, Play, StopCircle, MapPin, CalendarDays, FileDown, Filter, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShipmentDataTable } from '@/components/dashboard/shipment-data-table';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

// Define types based on your database schema
interface DatabaseShipment {
  id: string;
  shipment_id: string;
  customer_id?: string | null;
  origin?: string | null;
  destination?: string | null;
  status: string;
  product?: string | null;
  tags?: string | null;
  weight?: string | null;
  carrier?: string | null;
  expected_arrival?: string | null;
  created_at: string;
  customers?: {
    id: string;
    name: string;
    location?: string | null;
  } | null;
}

interface Shipment {
  id: string;
  shipmentId: string;
  customer: string;
  origin: string;
  destination: string;
  status: string;
  product: string;
  weight: string;
  temperature: string;
  humidity: string;
  tags: string;
  expectedArrival: string;
  driver: string;
  carrier: string;
  priority: string;
  notes: string;
}

// Loading Sheet Types
interface LoadingSheetData {
  id?: string;
  exporter: string;
  client: string;
  shippingLine: string;
  billNumber: string;
  container: string;
  seal1: string;
  seal2: string;
  truck: string;
  vessel: string;
  etaMSA: string;
  etdMSA: string;
  port: string;
  etaPort: string;
  tempRec1: string;
  tempRec2: string;
  loadingDate: string;
  loadedBy?: string;
  checkedBy?: string;
  remarks?: string;
  pallets: {
    palletNo: number;
    temp: string;
    traceCode: string;
    sizes: {
      size12: number;
      size14: number;
      size16: number;
      size18: number;
      size20: number;
      size22: number;
      size24: number;
      size26: number;
      size28: number;
      size30: number;
    };
    total: number;
  }[];
}

// Database Loading Sheet Types
interface DatabaseLoadingSheet {
  id: string;
  exporter: string;
  client: string;
  shipping_line: string;
  bill_number: string;
  container: string;
  seal1: string;
  seal2: string;
  truck: string;
  vessel: string;
  eta_msa: string | null;
  etd_msa: string | null;
  port: string;
  eta_port: string | null;
  temp_rec1: string;
  temp_rec2: string;
  loading_date: string;
  loaded_by: string | null;
  checked_by: string | null;
  remarks: string | null;
  created_at: string;
  loading_pallets: {
    id: string;
    pallet_no: number;
    temp: string;
    trace_code: string;
    size12: number;
    size14: number;
    size16: number;
    size18: number;
    size20: number;
    size22: number;
    size24: number;
    size26: number;
    size28: number;
    size30: number;
    total: number;
  }[];
  assigned_carrier_id?: string | null;
}

// Carrier Types
interface Carrier {
  id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  rating: number;
  status: string;
  id_number: string | null;
  vehicle_registration: string | null;
  created_at: string;
  _count?: {
    carrier_assignments: number;
  };
}

// Assignment Types
interface Assignment {
  id: string;
  carrier_id: string;
  loading_sheet_id: string;
  assigned_at: string;
  assigned_by: string;
  status: 'assigned' | 'in_transit' | 'completed' | 'cancelled';
  notes?: string | null;
  carrier?: Carrier;
  loading_sheet?: DatabaseLoadingSheet;
  transit_started_at?: string | null;
  transit_completed_at?: string | null;
  transit_days?: number | null;
}

// Transit History Types
interface TransitHistory {
  id: string;
  assignment_id: string;
  action: 'start_transit' | 'end_transit' | 'delivered';
  timestamp: string;
  notes?: string | null;
  location?: string | null;
  assignment?: Assignment;
}

// Helper function to convert database status to display format
function convertDbStatusToDisplay(dbStatus: string): string {
  const statusMap: Record<string, string> = {
    'Awaiting_QC': 'Awaiting QC',
    'Processing': 'Processing',
    'Receiving': 'Receiving',
    'Preparing_for_Dispatch': 'Preparing for Dispatch',
    'Ready_for_Dispatch': 'Ready for Dispatch',
    'In_Transit': 'In-Transit',
    'Delayed': 'Delayed',
    'Delivered': 'Delivered'
  };
  
  return statusMap[dbStatus] || 'Awaiting QC';
}

// Helper function to format date
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Helper function to calculate days between dates
function calculateDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Loading Sheet Component
function LoadingSheet() {
  const defaultData: LoadingSheetData = {
    exporter: 'HARIR INTERNATIONAL LTD',
    client: '',
    shippingLine: '',
    billNumber: '',
    container: '',
    seal1: '',
    seal2: '',
    truck: '',
    vessel: '',
    etaMSA: '',
    etdMSA: '',
    port: '',
    etaPort: '',
    tempRec1: '',
    tempRec2: '',
    loadingDate: new Date().toISOString().split('T')[0],
    pallets: Array.from({ length: 20 }, (_, i) => ({
      palletNo: i + 1,
      temp: '',
      traceCode: '',
      sizes: {
        size12: 0,
        size14: 0,
        size16: 0,
        size18: 0,
        size20: 0,
        size22: 0,
        size24: 0,
        size26: 0,
        size28: 0,
        size30: 0,
      },
      total: 0,
    })),
  };

  const [sheetData, setSheetData] = useState<LoadingSheetData>(defaultData);
  const [saving, setSaving] = useState(false);
  const [existingSheets, setExistingSheets] = useState<DatabaseLoadingSheet[]>([]);
  const [loadingSheets, setLoadingSheets] = useState(true);

  // Fetch existing loading sheets from database
  const fetchLoadingSheets = useCallback(async () => {
    try {
      setLoadingSheets(true);
      
      const response = await fetch('/api/loading-sheets?limit=50');
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.data) {
          setExistingSheets(result.data);
          console.log('📋 Loaded', result.data.length, 'loading sheets from database');
        } else {
          console.error('Error loading sheets:', result.error);
          alert(`Failed to load loading sheets: ${result.error}`);
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
    } catch (error) {
      console.error('Error fetching loading sheets:', error);
      alert('Failed to fetch loading sheets. Please check your connection.');
    } finally {
      setLoadingSheets(false);
    }
  }, []);

  useEffect(() => {
    fetchLoadingSheets();
  }, [fetchLoadingSheets]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const text = generateCSV();
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', `loading-sheet-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Get form values
      const loadedByInput = document.querySelector('input[placeholder="Loader\'s name & signature"]') as HTMLInputElement;
      const checkedByInput = document.querySelector('input[placeholder="Supervisor\'s name & signature"]') as HTMLInputElement;
      const remarksInput = document.querySelector('textarea[placeholder="Special instructions or notes"]') as HTMLTextAreaElement;

      // Prepare the data for saving
      const saveData = {
        exporter: sheetData.exporter,
        client: sheetData.client,
        shippingLine: sheetData.shippingLine,
        billNumber: sheetData.billNumber,
        container: sheetData.container,
        seal1: sheetData.seal1,
        seal2: sheetData.seal2,
        truck: sheetData.truck,
        vessel: sheetData.vessel,
        etaMSA: sheetData.etaMSA || undefined,
        etdMSA: sheetData.etdMSA || undefined,
        port: sheetData.port,
        etaPort: sheetData.etaPort || undefined,
        tempRec1: sheetData.tempRec1,
        tempRec2: sheetData.tempRec2,
        loadingDate: sheetData.loadingDate,
        loadedBy: loadedByInput?.value || '',
        checkedBy: checkedByInput?.value || '',
        remarks: remarksInput?.value || '',
        pallets: sheetData.pallets.map(pallet => ({
          palletNo: pallet.palletNo,
          temp: pallet.temp,
          traceCode: pallet.traceCode,
          sizes: pallet.sizes,
          total: pallet.total
        }))
      };

      console.log('📤 Saving loading sheet to database...', saveData);

      const response = await fetch('/api/loading-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData)
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ Loading sheet saved successfully!\nBill Number: ${sheetData.billNumber || 'Not specified'}`);
        // Refresh the list of existing sheets
        await fetchLoadingSheets();
        // Clear form for new entry
        handleNewSheet();
      } else {
        throw new Error(result.error || 'Failed to save loading sheet');
      }

    } catch (error: any) {
      console.error('❌ Error saving loading sheet:', error);
      alert(`❌ Failed to save loading sheet: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleLoadSheet = (sheetId: string) => {
    const selectedSheet = existingSheets.find(sheet => sheet.id === sheetId);
    if (selectedSheet) {
      // Convert database format to component format
      const convertedSheet: LoadingSheetData = {
        id: selectedSheet.id,
        exporter: selectedSheet.exporter,
        client: selectedSheet.client,
        shippingLine: selectedSheet.shipping_line || '',
        billNumber: selectedSheet.bill_number || '',
        container: selectedSheet.container || '',
        seal1: selectedSheet.seal1 || '',
        seal2: selectedSheet.seal2 || '',
        truck: selectedSheet.truck || '',
        vessel: selectedSheet.vessel || '',
        etaMSA: selectedSheet.eta_msa ? new Date(selectedSheet.eta_msa).toLocaleDateString('en-GB') : '',
        etdMSA: selectedSheet.etd_msa ? new Date(selectedSheet.etd_msa).toLocaleDateString('en-GB') : '',
        port: selectedSheet.port || '',
        etaPort: selectedSheet.eta_port ? new Date(selectedSheet.eta_port).toLocaleDateString('en-GB') : '',
        tempRec1: selectedSheet.temp_rec1 || '',
        tempRec2: selectedSheet.temp_rec2 || '',
        loadingDate: selectedSheet.loading_date ? 
          new Date(selectedSheet.loading_date).toISOString().split('T')[0] : 
          new Date().toISOString().split('T')[0],
        loadedBy: selectedSheet.loaded_by || '',
        checkedBy: selectedSheet.checked_by || '',
        remarks: selectedSheet.remarks || '',
        pallets: selectedSheet.loading_pallets?.map(pallet => ({
          palletNo: pallet.pallet_no,
          temp: pallet.temp || '',
          traceCode: pallet.trace_code || '',
          sizes: {
            size12: pallet.size12,
            size14: pallet.size14,
            size16: pallet.size16,
            size18: pallet.size18,
            size20: pallet.size20,
            size22: pallet.size22,
            size24: pallet.size24,
            size26: pallet.size26,
            size28: pallet.size28,
            size30: pallet.size30
          },
          total: pallet.total
        })) || defaultData.pallets.slice(0, 20)
      };
      
      setSheetData(convertedSheet);
      
      // Fill in the signature fields
      setTimeout(() => {
        const loadedByInput = document.querySelector('input[placeholder="Loader\'s name & signature"]') as HTMLInputElement;
        const checkedByInput = document.querySelector('input[placeholder="Supervisor\'s name & signature"]') as HTMLInputElement;
        const remarksInput = document.querySelector('textarea[placeholder="Special instructions or notes"]') as HTMLTextAreaElement;
        
        if (loadedByInput) loadedByInput.value = selectedSheet.loaded_by || '';
        if (checkedByInput) checkedByInput.value = selectedSheet.checked_by || '';
        if (remarksInput) remarksInput.value = selectedSheet.remarks || '';
      }, 100);
    }
  };

  const handleNewSheet = () => {
    if (!sheetData.id || window.confirm('Create a new loading sheet? Current unsaved changes will be lost.')) {
      setSheetData({
        ...defaultData,
        loadingDate: new Date().toISOString().split('T')[0],
      });
      
      // Clear signature fields
      setTimeout(() => {
        const loadedByInput = document.querySelector('input[placeholder="Loader\'s name & signature"]') as HTMLInputElement;
        const checkedByInput = document.querySelector('input[placeholder="Supervisor\'s name & signature"]') as HTMLInputElement;
        const remarksInput = document.querySelector('textarea[placeholder="Special instructions or notes"]') as HTMLTextAreaElement;
        
        if (loadedByInput) loadedByInput.value = '';
        if (checkedByInput) checkedByInput.value = '';
        if (remarksInput) remarksInput.value = '';
      }, 100);
    }
  };

  const generateCSV = () => {
    const headers = ['LOADING SHEET\n\n'];
    headers.push(`EXPORTER,${sheetData.exporter},LOADING DATE,${sheetData.loadingDate}`);
    headers.push(`CLIENT,${sheetData.client},VESSEL,${sheetData.vessel}`);
    headers.push(`SHIPPING LINE,${sheetData.shippingLine},ETA MSA,${sheetData.etaMSA}`);
    headers.push(`BILL NUMBER,${sheetData.billNumber},ETD MSA,${sheetData.etdMSA}`);
    headers.push(`CONTAINER,${sheetData.container},PORT,${sheetData.port}`);
    headers.push(`SEAL 1,${sheetData.seal1},ETA PORT,${sheetData.etaPort}`);
    headers.push(`SEAL 2,${sheetData.seal2},TEMP REC 1,${sheetData.tempRec1}`);
    headers.push(`TRUCK,${sheetData.truck},TEMP REC 2,${sheetData.tempRec2}\n`);
    
    const tableHeaders = ['PALLET NO', 'TEMP', 'TRACE CODE', '12', '14', '16', '18', '20', '22', '24', '26', '28', '30', 'Total'];
    headers.push(tableHeaders.join(','));
    
    const rows = sheetData.pallets.map(pallet => [
      pallet.palletNo,
      pallet.temp,
      pallet.traceCode,
      pallet.sizes.size12,
      pallet.sizes.size14,
      pallet.sizes.size16,
      pallet.sizes.size18,
      pallet.sizes.size20,
      pallet.sizes.size22,
      pallet.sizes.size24,
      pallet.sizes.size26,
      pallet.sizes.size28,
      pallet.sizes.size30,
      pallet.total,
    ].join(','));
    
    headers.push(...rows);
    
    const totals = sheetData.pallets.reduce(
      (acc, pallet) => {
        acc.size12 += pallet.sizes.size12;
        acc.size14 += pallet.sizes.size14;
        acc.size16 += pallet.sizes.size16;
        acc.size18 += pallet.sizes.size18;
        acc.size20 += pallet.sizes.size20;
        acc.size22 += pallet.sizes.size22;
        acc.size24 += pallet.sizes.size24;
        acc.size26 += pallet.sizes.size26;
        acc.size28 += pallet.sizes.size28;
        acc.size30 += pallet.sizes.size30;
        acc.grandTotal += pallet.total;
        return acc;
      },
      { 
        size12: 0, size14: 0, size16: 0, size18: 0, size20: 0, 
        size22: 0, size24: 0, size26: 0, size28: 0, size30: 0,
        grandTotal: 0 
      }
    );
    
    headers.push(`TOTAL,,,,${totals.size12},${totals.size14},${totals.size16},${totals.size18},${totals.size20},${totals.size22},${totals.size24},${totals.size26},${totals.size28},${totals.size30},${totals.grandTotal}\n`);
    headers.push('SUMMARY');
    headers.push(`12,${totals.size12}`);
    headers.push(`14,${totals.size14},Loaded by,`);
    headers.push(`16,${totals.size16}`);
    headers.push(`18,${totals.size18}`);
    headers.push(`20,${totals.size20}`);
    headers.push(`22,${totals.size22}`);
    headers.push(`24,${totals.size24}`);
    headers.push(`26,${totals.size26}`);
    headers.push(`28,${totals.size28}`);
    headers.push(`30,${totals.size30}`);
    
    return headers.join('\n');
  };

  const calculatePalletTotal = (sizes: LoadingSheetData['pallets'][0]['sizes']) => {
    return Object.values(sizes).reduce((sum, value) => sum + value, 0);
  };

  const updatePalletData = (palletIndex: number, field: keyof LoadingSheetData['pallets'][0], value: any) => {
    const newPallets = [...sheetData.pallets];
    
    if (field === 'sizes') {
      newPallets[palletIndex].sizes = { ...newPallets[palletIndex].sizes, ...value };
      newPallets[palletIndex].total = calculatePalletTotal(newPallets[palletIndex].sizes);
    } else {
      (newPallets[palletIndex] as any)[field] = value;
    }
    
    setSheetData({ ...sheetData, pallets: newPallets });
  };

  const updateField = (field: keyof LoadingSheetData, value: string) => {
    setSheetData({ ...sheetData, [field]: value });
  };

  const addPallet = () => {
    const newPalletNo = sheetData.pallets.length + 1;
    setSheetData({
      ...sheetData,
      pallets: [
        ...sheetData.pallets,
        {
          palletNo: newPalletNo,
          temp: '',
          traceCode: '',
          sizes: {
            size12: 0,
            size14: 0,
            size16: 0,
            size18: 0,
            size20: 0,
            size22: 0,
            size24: 0,
            size26: 0,
            size28: 0,
            size30: 0,
          },
          total: 0,
        }
      ]
    });
  };

  const removePallet = (index: number) => {
    if (sheetData.pallets.length <= 1) return;
    const newPallets = sheetData.pallets.filter((_, i) => i !== index);
    const renumberedPallets = newPallets.map((pallet, i) => ({
      ...pallet,
      palletNo: i + 1
    }));
    setSheetData({ ...sheetData, pallets: renumberedPallets });
  };

  const clearPallet = (index: number) => {
    const newPallets = [...sheetData.pallets];
    newPallets[index] = {
      palletNo: newPallets[index].palletNo,
      temp: '',
      traceCode: '',
      sizes: {
        size12: 0,
        size14: 0,
        size16: 0,
        size18: 0,
        size20: 0,
        size22: 0,
        size24: 0,
        size26: 0,
        size28: 0,
        size30: 0,
      },
      total: 0,
    };
    setSheetData({ ...sheetData, pallets: newPallets });
  };

  const totals = sheetData.pallets.reduce(
    (acc, pallet) => {
      acc.size12 += pallet.sizes.size12;
      acc.size14 += pallet.sizes.size14;
      acc.size16 += pallet.sizes.size16;
      acc.size18 += pallet.sizes.size18;
      acc.size20 += pallet.sizes.size20;
      acc.size22 += pallet.sizes.size22;
      acc.size24 += pallet.sizes.size24;
      acc.size26 += pallet.sizes.size26;
      acc.size28 += pallet.sizes.size28;
      acc.size30 += pallet.sizes.size30;
      acc.grandTotal += pallet.total;
      return acc;
    },
    { 
      size12: 0, size14: 0, size16: 0, size18: 0, size20: 0, 
      size22: 0, size24: 0, size26: 0, size28: 0, size30: 0,
      grandTotal: 0 
    }
  );

  return (
    <Card className="print:p-0 print:border-0 print:shadow-none">
      <CardHeader className="print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Grid className="h-6 w-6 text-primary" />
              Loading Sheet Generator
              {sheetData.id && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  (Editing: {sheetData.id.substring(0, 8)}...)
                </span>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Complete loading sheet with pallet tracking and size breakdown
            </p>
            
            {/* Loading sheet selector */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Label htmlFor="sheet-selector" className="text-xs font-medium">Load existing:</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    {loadingSheets ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-2" />
                        Select sheet ({existingSheets.length})
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuLabel>Saved Loading Sheets</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {existingSheets.length === 0 ? (
                    <DropdownMenuItem disabled>
                      No saved sheets found
                    </DropdownMenuItem>
                  ) : (
                    existingSheets.slice(0, 10).map(sheet => (
                      <DropdownMenuItem 
                        key={sheet.id} 
                        onClick={() => handleLoadSheet(sheet.id)}
                        className="flex flex-col items-start"
                      >
                        <div className="font-medium">{sheet.bill_number || 'No Bill'}</div>
                        <div className="text-xs text-muted-foreground">
                          {sheet.client || 'No Client'} • {new Date(sheet.loading_date).toLocaleDateString()}
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                  {existingSheets.length > 10 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem disabled>
                        +{existingSheets.length - 10} more sheets
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNewSheet}
            >
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="default" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 print:p-0">
        <div className="loading-sheet print:p-4">
          {/* Header */}
          <div className="text-center mb-6 print:mb-4">
            <h1 className="text-3xl font-bold uppercase tracking-wider mb-1 print:text-2xl">
              LOADING SHEET
            </h1>
            <div className="w-24 h-0.5 bg-black mx-auto"></div>
          </div>
          
          {/* TWO-COLUMN HEADER INFORMATION */}
          <div className="grid grid-cols-2 gap-6 mb-8 print:mb-6">
            {/* Left Column */}
            <div className="space-y-3">
              {/* Row 1: EXPORTER + LOADING DATE */}
              <div className="flex items-center border-b pb-1">
                <div className="w-1/3 font-bold text-sm uppercase tracking-wide">EXPORTER</div>
                <div className="w-2/3">
                  <Input
                    value={sheetData.exporter}
                    onChange={(e) => updateField('exporter', e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-medium text-sm print:border-0 print:p-0"
                  />
                </div>
              </div>
              
              {/* Row 2: CLIENT + VESSEL */}
              <div className="flex items-center border-b pb-1">
                <div className="w-1/3 font-bold text-sm uppercase tracking-wide">CLIENT</div>
                <div className="w-2/3">
                  <Input
                    value={sheetData.client}
                    onChange={(e) => updateField('client', e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm print:border-0 print:p-0"
                    placeholder="Client name"
                  />
                </div>
              </div>
              
              {/* Row 3: SHIPPING LINE + ETA MSA */}
              <div className="flex items-center border-b pb-1">
                <div className="w-1/3 font-bold text-sm uppercase tracking-wide">SHIPPING LINE</div>
                <div className="w-2/3">
                  <Input
                    value={sheetData.shippingLine}
                    onChange={(e) => updateField('shippingLine', e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm print:border-0 print:p-0"
                    placeholder="Shipping line"
                  />
                </div>
              </div>
              
              {/* Row 4: BILL NUMBER + ETD MSA */}
              <div className="flex items-center border-b pb-1">
                <div className="w-1/3 font-bold text-sm uppercase tracking-wide">BILL NUMBER</div>
                <div className="w-2/3">
                  <Input
                    value={sheetData.billNumber}
                    onChange={(e) => updateField('billNumber', e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm print:border-0 print:p-0"
                    placeholder="Bill number"
                  />
                </div>
              </div>
              
              {/* Row 5: CONTAINER + PORT */}
              <div className="flex items-center border-b pb-1">
                <div className="w-1/3 font-bold text-sm uppercase tracking-wide">CONTAINER</div>
                <div className="w-2/3">
                  <Input
                    value={sheetData.container}
                    onChange={(e) => updateField('container', e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm print:border-0 print:p-0"
                    placeholder="Container number"
                  />
                </div>
              </div>
              
              {/* Row 6: SEAL 1 + ETA PORT */}
              <div className="flex items-center border-b pb-1">
                <div className="w-1/3 font-bold text-sm uppercase tracking-wide">SEAL 1</div>
                <div className="w-2/3">
                  <Input
                    value={sheetData.seal1}
                    onChange={(e) => updateField('seal1', e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm print:border-0 print:p-0"
                    placeholder="Seal number"
                  />
                </div>
              </div>
              
              {/* Row 7: SEAL 2 + TEMP REC 1 */}
              <div className="flex items-center border-b pb-1">
                <div className="w-1/3 font-bold text-sm uppercase tracking-wide">SEAL 2</div>
                <div className="w-2/3">
                  <Input
                    value={sheetData.seal2}
                    onChange={(e) => updateField('seal2', e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm print:border-0 print:p-0"
                    placeholder="Second seal"
                  />
                </div>
              </div>
              
              {/* Row 8: TRUCK + TEMP REC 2 */}
              <div className="flex items-center border-b pb-1">
                <div className="w-1/3 font-bold text-sm uppercase tracking-wide">TRUCK</div>
                <div className="w-2/3">
                  <Input
                    value={sheetData.truck}
                    onChange={(e) => updateField('truck', e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm print:border-0 print:p-0"
                    placeholder="Truck registration"
                  />
                </div>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="space-y-3">
              {/* Row 1: LOADING DATE */}
              <div className="flex items-center border-b pb-1">
                <div className="w-1/3 font-bold text-sm uppercase tracking-wide">LOADING DATE</div>
                <div className="w-2/3">
                  <Input
                    type="date"
                    value={sheetData.loadingDate}
                    onChange={(e) => updateField('loadingDate', e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm print:border-0 print:p-0"
                  />
                </div>
              </div>
              
              {/* Row 2: VESSEL */}
              <div className="flex items-center border-b pb-1">
                <div className="w-1/3 font-bold text-sm uppercase tracking-wide">VESSEL</div>
                <div className="w-2/3">
                  <Input
                    value={sheetData.vessel}
                    onChange={(e) => updateField('vessel', e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm print:border-0 print:p-0"
                    placeholder="Vessel name"
                  />
                </div>
              </div>
              
              {/* Row 3: ETA MSA */}
              <div className="flex items-center border-b pb-1">
                <div className="w-1/3 font-bold text-sm uppercase tracking-wide">ETA MSA</div>
                <div className="w-2/3">
                  <Input
                    value={sheetData.etaMSA}
                    onChange={(e) => updateField('etaMSA', e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm print:border-0 print:p-0"
                    placeholder="ETA at MSA"
                  />
                </div>
              </div>
              
              {/* Row 4: ETD MSA */}
              <div className="flex items-center border-b pb-1">
                <div className="w-1/3 font-bold text-sm uppercase tracking-wide">ETD MSA</div>
                <div className="w-2/3">
                  <Input
                    value={sheetData.etdMSA}
                    onChange={(e) => updateField('etdMSA', e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm print:border-0 print:p-0"
                    placeholder="ETD from MSA"
                  />
                </div>
              </div>
              
              {/* Row 5: PORT */}
              <div className="flex items-center border-b pb-1">
                <div className="w-1/3 font-bold text-sm uppercase tracking-wide">PORT</div>
                <div className="w-2/3">
                  <Input
                    value={sheetData.port}
                    onChange={(e) => updateField('port', e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm print:border-0 print:p-0"
                    placeholder="Destination port"
                  />
                </div>
              </div>
              
              {/* Row 6: ETA PORT */}
              <div className="flex items-center border-b pb-1">
                <div className="w-1/3 font-bold text-sm uppercase tracking-wide">ETA PORT</div>
                <div className="w-2/3">
                  <Input
                    value={sheetData.etaPort}
                    onChange={(e) => updateField('etaPort', e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm print:border-0 print:p-0"
                    placeholder="ETA at port"
                  />
                </div>
              </div>
              
              {/* Row 7: TEMP REC 1 */}
              <div className="flex items-center border-b pb-1">
                <div className="w-1/3 font-bold text-sm uppercase tracking-wide">TEMP REC 1</div>
                <div className="w-2/3">
                  <Input
                    value={sheetData.tempRec1}
                    onChange={(e) => updateField('tempRec1', e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm print:border-0 print:p-0"
                    placeholder="Temperature record 1"
                  />
                </div>
              </div>
              
              {/* Row 8: TEMP REC 2 */}
              <div className="flex items-center border-b pb-1">
                <div className="w-1/3 font-bold text-sm uppercase tracking-wide">TEMP REC 2</div>
                <div className="w-2/3">
                  <Input
                    value={sheetData.tempRec2}
                    onChange={(e) => updateField('tempRec2', e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm print:border-0 print:p-0"
                    placeholder="Temperature record 2"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Pallet Management Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 print:hidden">
            <div>
              <h3 className="text-lg font-semibold">Pallet Details</h3>
              <p className="text-sm text-muted-foreground">Temperature, trace codes, and quantity per size</p>
            </div>
            <Button variant="outline" size="sm" onClick={addPallet}>
              <Plus className="h-4 w-4 mr-2" />
              Add Pallet
            </Button>
          </div>
          
          {/* Pallet Table */}
          <div className="overflow-x-auto mb-6 print:mb-4">
            <table className="w-full border border-gray-300">
              <thead>
                <tr className="bg-black-100">
                  <th className="border border-gray-300 p-2 text-left font-bold text-sm uppercase">PALLET NO</th>
                  <th className="border border-gray-300 p-2 text-left font-bold text-sm uppercase">TEMP</th>
                  <th className="border border-gray-300 p-2 text-left font-bold text-sm uppercase">TRACE CODE</th>
                  {[12, 14, 16, 18, 20, 22, 24, 26, 28, 30].map((size) => (
                    <th key={size} className="border border-gray-300 p-2 text-center font-bold text-sm uppercase">{size}</th>
                  ))}
                  <th className="border border-gray-300 p-2 text-center font-bold text-sm uppercase">TOTAL</th>
                  <th className="border border-gray-300 p-2 text-center font-bold text-sm uppercase print:hidden">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {sheetData.pallets.slice(0, 20).map((pallet, index) => (
                  <tr key={pallet.palletNo} className="hover:bg-black-50">
                    <td className="border border-gray-300 p-2 text-center font-medium">{pallet.palletNo}</td>
                    <td className="border border-gray-300 p-1">
                      <Input
                        type="text"
                        value={pallet.temp}
                        onChange={(e) => updatePalletData(index, 'temp', e.target.value)}
                        className="w-full border-0 p-1 focus-visible:ring-0 focus-visible:ring-offset-0 text-center text-sm print:border-0 print:p-0"
                        placeholder="0.0"
                      />
                    </td>
                    <td className="border border-gray-300 p-1">
                      <Input
                        type="text"
                        value={pallet.traceCode}
                        onChange={(e) => updatePalletData(index, 'traceCode', e.target.value)}
                        className="w-full border-0 p-1 focus-visible:ring-0 focus-visible:ring-offset-0 text-center text-sm print:border-0 print:p-0"
                        placeholder="TRACE-001"
                      />
                    </td>
                    {[12, 14, 16, 18, 20, 22, 24, 26, 28, 30].map((size) => (
                      <td key={size} className="border border-gray-300 p-1">
                        <Input
                          type="number"
                          min="0"
                          value={pallet.sizes[`size${size}` as keyof typeof pallet.sizes]}
                          onChange={(e) => updatePalletData(index, 'sizes', {
                            ...pallet.sizes,
                            [`size${size}`]: parseInt(e.target.value) || 0,
                          })}
                          className="w-full border-0 p-1 focus-visible:ring-0 focus-visible:ring-offset-0 text-center text-sm print:border-0 print:p-0"
                        />
                      </td>
                    ))}
                    <td className="border border-gray-300 p-2 text-center font-bold bg-black-50">
                      {pallet.total}
                    </td>
                    <td className="border border-gray-300 p-1 print:hidden">
                      <div className="flex justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => clearPallet(index)}
                          className="h-6 w-6 p-0 text-xs"
                          title="Clear"
                        >
                          ×
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePallet(index)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          title="Delete"
                          disabled={sheetData.pallets.length <= 1}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {/* Totals Row */}
                <tr className="bg-black-100 font-bold">
                  <td colSpan={3} className="border border-gray-300 p-2 text-right pr-4">TOTAL</td>
                  {[12, 14, 16, 18, 20, 22, 24, 26, 28, 30].map((size) => (
                    <td key={size} className="border border-gray-300 p-2 text-center">
                      {totals[`size${size}` as keyof typeof totals]}
                    </td>
                  ))}
                  <td className="border border-gray-300 p-2 text-center bg-black-200">
                    {totals.grandTotal}
                  </td>
                  <td className="print:hidden"></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-300 p-4">
              <h3 className="font-bold text-lg mb-3 border-b pb-2">SUMMARY</h3>
              <div className="grid grid-cols-2 gap-2">
                {[12, 14, 16, 18, 20, 22, 24, 26, 28, 30].map((size) => (
                  <div key={size} className="flex justify-between border-b pb-1">
                    <span className="font-medium">Size {size}</span>
                    <span className="font-bold">{totals[`size${size}` as keyof typeof totals]}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="border border-gray-300 p-4">
              <h3 className="font-bold text-lg mb-3 border-b pb-2">LOADING DETAILS</h3>
              <div className="space-y-3">
                <div>
                  <div className="font-medium mb-1">Loaded by:</div>
                  <Input 
                    defaultValue={sheetData.loadedBy || ''}
                    className="border-0 p-2 focus-visible:ring-0 focus-visible:ring-offset-0 border-b print:border-0" 
                    placeholder="Loader's name & signature" 
                  />
                </div>
                <div>
                  <div className="font-medium mb-1">Checked by:</div>
                  <Input 
                    defaultValue={sheetData.checkedBy || ''}
                    className="border-0 p-2 focus-visible:ring-0 focus-visible:ring-offset-0 border-b print:border-0" 
                    placeholder="Supervisor's name & signature" 
                  />
                </div>
                <div>
                  <div className="font-medium mb-1">Remarks:</div>
                  <textarea 
                    defaultValue={sheetData.remarks || ''}
                    className="w-full border border-black p-2 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm resize-none bg-white text-black placeholder:text-gray-500 print:border-black" 
                    rows={2}
                    placeholder="Special instructions or notes"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="mt-6 pt-3 border-t text-center text-xs text-gray-500 print:mt-4">
            <p>Generated by Harir International Logistics System • Document ID: {sheetData.id || `NEW-LS-${new Date().getTime().toString().slice(-6)}`}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Carrier Assignment Form Component
function CarrierAssignmentForm() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loadingSheets, setLoadingSheets] = useState<DatabaseLoadingSheet[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [selectedCarrierId, setSelectedCarrierId] = useState<string | null>(null);
  const [selectedLoadingSheetId, setSelectedLoadingSheetId] = useState<string | null>(null);
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [assignmentStatus, setAssignmentStatus] = useState<'assigned' | 'in_transit' | 'completed'>('assigned');
  
  // Fetch data from database
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch carriers
      const carriersResponse = await fetch('/api/carriers');
      if (carriersResponse.ok) {
        const carriersData = await carriersResponse.json();
        if (carriersData.success) {
          setCarriers(carriersData.data || []);
        }
      }
      
      // Fetch loading sheets
      const sheetsResponse = await fetch('/api/loading-sheets?limit=50');
      if (sheetsResponse.ok) {
        const sheetsData = await sheetsResponse.json();
        if (sheetsData.success) {
          setLoadingSheets(sheetsData.data || []);
        }
      }
      
      // Fetch assignments
      const assignmentsResponse = await fetch('/api/carrier-assignments');
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        if (assignmentsData.success) {
          setAssignments(assignmentsData.data || []);
        }
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssignCarrier = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCarrierId || !selectedLoadingSheetId) {
      alert('Please select both a carrier and a loading sheet');
      return;
    }
    
    try {
      setAssigning(true);
      
      // Find selected carrier and loading sheet
      const selectedCarrier = carriers.find(c => c.id === selectedCarrierId);
      const selectedLoadingSheet = loadingSheets.find(ls => ls.id === selectedLoadingSheetId);
      
      if (!selectedCarrier || !selectedLoadingSheet) {
        throw new Error('Selected carrier or loading sheet not found');
      }

      // Save to database
      const response = await fetch('/api/carrier-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          carrierId: selectedCarrierId,
          loadingSheetId: selectedLoadingSheetId,
          status: assignmentStatus,
          notes: assignmentNotes
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ Successfully assigned carrier "${selectedCarrier.name}" to loading sheet "${selectedLoadingSheet.bill_number || selectedLoadingSheet.id}"`);
        
        // Refresh assignments
        await fetchData();
        
        // Reset form
        setSelectedCarrierId(null);
        setSelectedLoadingSheetId(null);
        setAssignmentNotes('');
        setAssignmentStatus('assigned');
      } else {
        throw new Error(result.error || 'Failed to assign carrier');
      }
      
    } catch (error: any) {
      console.error('Error assigning carrier:', error);
      alert(`❌ Failed to assign carrier: ${error.message}`);
    } finally {
      setAssigning(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Delivered</Badge>;
      case 'in_transit':
        return <Badge className="bg-blue-100 text-blue-800">In Transit</Badge>;
      case 'assigned':
        return <Badge className="bg-yellow-100 text-yellow-800">Assigned</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Filter loading sheets based on search
  const filteredLoadingSheets = loadingSheets.filter(sheet =>
    sheet.bill_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sheet.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sheet.container?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sheet.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{carriers.length}</div>
            <div className="text-sm text-muted-foreground">Available Carriers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{loadingSheets.length}</div>
            <div className="text-sm text-muted-foreground">Saved Loading Sheets</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{assignments.length}</div>
            <div className="text-sm text-muted-foreground">Total Assignments</div>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-6 w-6 text-primary" />
            Assign Carrier to Loading Sheet
          </CardTitle>
          <CardDescription>
            Select a carrier and assign it to a saved loading sheet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAssignCarrier} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Carrier Selection */}
              <div className="space-y-2">
                <Label htmlFor="carrier-select">Select Carrier *</Label>
                <Select
                  value={selectedCarrierId || undefined}
                  onValueChange={setSelectedCarrierId}
                  required
                >
                  <SelectTrigger id="carrier-select">
                    <SelectValue placeholder="Choose a carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    {carriers.map(carrier => (
                      <SelectItem key={carrier.id} value={carrier.id}>
                        <div className="flex items-center justify-between">
                          <span>{carrier.name}</span>
                          <Badge 
                            variant={carrier.status === 'Active' ? 'default' : 'secondary'}
                            className="ml-2"
                          >
                            {carrier.status}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCarrierId && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Selected: {carriers.find(c => c.id === selectedCarrierId)?.name}
                  </div>
                )}
              </div>

              {/* Loading Sheet Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="loading-sheet-select">Select Loading Sheet *</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search loading sheets..."
                      className="pl-8 w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <Select
                  value={selectedLoadingSheetId || undefined}
                  onValueChange={setSelectedLoadingSheetId}
                  required
                >
                  <SelectTrigger id="loading-sheet-select">
                    <SelectValue placeholder="Choose a loading sheet" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredLoadingSheets.map(sheet => (
                      <SelectItem key={sheet.id} value={sheet.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{sheet.bill_number || 'No Bill Number'}</span>
                          <span className="text-xs text-muted-foreground">
                            Client: {sheet.client || 'N/A'} • Container: {sheet.container || 'N/A'}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedLoadingSheetId && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Selected: {loadingSheets.find(ls => ls.id === selectedLoadingSheetId)?.bill_number || 'No Bill'}
                  </div>
                )}
              </div>

              {/* Assignment Status */}
              <div className="space-y-2">
                <Label htmlFor="assignment-status">Assignment Status</Label>
                <Select
                  value={assignmentStatus}
                  onValueChange={(value: 'assigned' | 'in_transit' | 'completed') => setAssignmentStatus(value)}
                >
                  <SelectTrigger id="assignment-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="completed">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assignment Notes */}
              <div className="space-y-2">
                <Label htmlFor="assignment-notes">Assignment Notes</Label>
                <textarea
                  id="assignment-notes"
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  className="w-full min-h-[80px] p-2 border rounded-md resize-none"
                  placeholder="Enter any notes about this assignment..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-2 pt-2">
              <Button 
                type="submit" 
                disabled={assigning || !selectedCarrierId || !selectedLoadingSheetId}
              >
                {assigning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Assign Carrier to Loading Sheet
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setSelectedCarrierId(null);
                  setSelectedLoadingSheetId(null);
                  setAssignmentNotes('');
                  setAssignmentStatus('assigned');
                }}
              >
                Clear Form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Assignment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            Assignment History
          </CardTitle>
          <CardDescription>
            Recent carrier assignments to loading sheets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Loading Sheet</TableHead>
                  <TableHead>Container</TableHead>
                  <TableHead>Assigned By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      {new Date(assignment.assigned_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{assignment.carrier?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {assignment.carrier?.id_number}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{assignment.loading_sheet?.bill_number || assignment.loading_sheet_id}</div>
                      <div className="text-sm text-muted-foreground">
                        {assignment.loading_sheet?.client || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {assignment.loading_sheet?.container || 'N/A'}
                    </TableCell>
                    <TableCell>{assignment.assigned_by}</TableCell>
                    <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {assignment.notes || 'No notes'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Empty State */}
          {assignments.length === 0 && (
            <div className="text-center py-8">
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No assignment history found</h3>
              <p className="text-muted-foreground mb-4">
                Assignment history will appear here once you start assigning carriers to loading sheets
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Transit Management Component
function TransitManagement() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [transitHistory, setTransitHistory] = useState<TransitHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Modal states
  const [showStartTransitModal, setShowStartTransitModal] = useState(false);
  const [showEndTransitModal, setShowEndTransitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [transitNotes, setTransitNotes] = useState('');
  const [transitLocation, setTransitLocation] = useState('');

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch assignments
      const assignmentsResponse = await fetch('/api/carrier-assignments');
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        if (assignmentsData.success) {
          setAssignments(assignmentsData.data || []);
        }
      }
      
      // Fetch transit history
      const historyResponse = await fetch('/api/transit-history');
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        if (historyData.success) {
          setTransitHistory(historyData.data || []);
        }
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStartTransit = async () => {
    if (!selectedAssignment) return;
    
    try {
      setActionLoading('start_transit');
      
      const response = await fetch('/api/transit-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentId: selectedAssignment.id,
          action: 'start_transit',
          notes: transitNotes,
          location: transitLocation
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Transit started successfully!');
        
        // Update assignment status
        const updateResponse = await fetch(`/api/carrier-assignments/${selectedAssignment.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'in_transit',
            transit_started_at: new Date().toISOString()
          })
        });
        
        if (updateResponse.ok) {
          await fetchData();
        }
        
        setShowStartTransitModal(false);
        setSelectedAssignment(null);
        setTransitNotes('');
        setTransitLocation('');
      } else {
        throw new Error(result.error || 'Failed to start transit');
      }
      
    } catch (error: any) {
      console.error('Error starting transit:', error);
      toast.error(`Failed to start transit: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEndTransit = async () => {
    if (!selectedAssignment) return;
    
    try {
      setActionLoading('end_transit');
      
      const response = await fetch('/api/transit-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentId: selectedAssignment.id,
          action: 'end_transit',
          notes: transitNotes,
          location: transitLocation
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Transit completed successfully!');
        
        // Update assignment status
        const updateResponse = await fetch(`/api/carrier-assignments/${selectedAssignment.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'completed',
            transit_completed_at: new Date().toISOString()
          })
        });
        
        if (updateResponse.ok) {
          await fetchData();
        }
        
        setShowEndTransitModal(false);
        setSelectedAssignment(null);
        setTransitNotes('');
        setTransitLocation('');
      } else {
        throw new Error(result.error || 'Failed to end transit');
      }
      
    } catch (error: any) {
      console.error('Error ending transit:', error);
      toast.error(`Failed to end transit: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkDelivered = async (assignmentId: string) => {
    try {
      setActionLoading(`delivered_${assignmentId}`);
      
      const response = await fetch('/api/transit-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentId,
          action: 'delivered',
          notes: 'Marked as delivered',
          location: 'Destination'
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Marked as delivered successfully!');
        
        // Update assignment status if not already completed
        const assignment = assignments.find(a => a.id === assignmentId);
        if (assignment && assignment.status !== 'completed') {
          const updateResponse = await fetch(`/api/carrier-assignments/${assignmentId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: 'completed',
              transit_completed_at: new Date().toISOString()
            })
          });
          
          if (updateResponse.ok) {
            await fetchData();
          }
        } else {
          await fetchData();
        }
      } else {
        throw new Error(result.error || 'Failed to mark as delivered');
      }
      
    } catch (error: any) {
      console.error('Error marking as delivered:', error);
      toast.error(`Failed to mark as delivered: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Delivered</Badge>;
      case 'in_transit':
        return <Badge className="bg-blue-100 text-blue-800">In Transit</Badge>;
      case 'assigned':
        return <Badge className="bg-yellow-100 text-yellow-800">Assigned</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTransitDays = (assignment: Assignment) => {
    if (!assignment.transit_started_at) return '-';
    
    const startDate = new Date(assignment.transit_started_at);
    const endDate = assignment.transit_completed_at 
      ? new Date(assignment.transit_completed_at)
      : new Date();
    
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatTransitTime = (assignment: Assignment) => {
    if (!assignment.transit_started_at) return 'Not started';
    
    const startDate = new Date(assignment.transit_started_at);
    const startStr = startDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    
    if (assignment.transit_completed_at) {
      const endDate = new Date(assignment.transit_completed_at);
      const endStr = endDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      return `${startStr} - ${endStr}`;
    }
    
    return `${startStr} - Ongoing`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading transit data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {assignments.filter(a => a.status === 'assigned').length}
            </div>
            <div className="text-sm text-muted-foreground">Assigned</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {assignments.filter(a => a.status === 'in_transit').length}
            </div>
            <div className="text-sm text-muted-foreground">In Transit</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {assignments.filter(a => a.status === 'completed').length}
            </div>
            <div className="text-sm text-muted-foreground">Delivered</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {transitHistory.length}
            </div>
            <div className="text-sm text-muted-foreground">Transit Events</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            Active Assignments
          </CardTitle>
          <CardDescription>
            Manage transit status for carrier assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Loading Sheet</TableHead>
                  <TableHead>Container</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Transit Period</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div className="font-medium">{assignment.carrier?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {assignment.carrier?.vehicle_registration || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{assignment.loading_sheet?.bill_number || 'No Bill'}</div>
                      <div className="text-sm text-muted-foreground">
                        Client: {assignment.loading_sheet?.client || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {assignment.loading_sheet?.container || 'N/A'}
                    </TableCell>
                    <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                    <TableCell>
                      {formatTransitTime(assignment)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{getTransitDays(assignment)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {assignment.status === 'assigned' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setShowStartTransitModal(true);
                            }}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Start Transit
                          </Button>
                        )}
                        
                        {assignment.status === 'in_transit' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setShowEndTransitModal(true);
                            }}
                          >
                            <StopCircle className="h-4 w-4 mr-1" />
                            End Transit
                          </Button>
                        )}
                        
                        {assignment.status !== 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkDelivered(assignment.id)}
                            disabled={actionLoading === `delivered_${assignment.id}`}
                          >
                            {actionLoading === `delivered_${assignment.id}` ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Empty State */}
          {assignments.length === 0 && (
            <div className="text-center py-8">
              <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No assignments found</h3>
              <p className="text-muted-foreground mb-4">
                Assign carriers to loading sheets first to manage transit
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transit History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            Transit History
          </CardTitle>
          <CardDescription>
            Complete history of transit events for all assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transitHistory.map((history) => (
              <div key={history.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className={`p-2 rounded-full ${
                  history.action === 'start_transit' ? 'bg-blue-100 text-blue-600' :
                  history.action === 'end_transit' ? 'bg-green-100 text-green-600' :
                  'bg-purple-100 text-purple-600'
                }`}>
                  {history.action === 'start_transit' ? (
                    <Play className="h-5 w-5" />
                  ) : history.action === 'end_transit' ? (
                    <StopCircle className="h-5 w-5" />
                  ) : (
                    <CheckCircle className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">
                        {history.action === 'start_transit' ? 'Transit Started' :
                         history.action === 'end_transit' ? 'Transit Ended' : 'Delivered'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(history.timestamp)}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {history.assignment?.loading_sheet?.bill_number || 'No Bill'}
                    </Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium">Carrier</p>
                      <p className="text-sm">{history.assignment?.carrier?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {history.location || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Notes</p>
                      <p className="text-sm">{history.notes || 'No notes'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {transitHistory.length === 0 && (
            <div className="text-center py-8">
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No transit history found</h3>
              <p className="text-muted-foreground mb-4">
                Transit history will appear here once you start managing transit for assignments
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {/* Start Transit Modal */}
      {showStartTransitModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-black rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Start Transit</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="location">Current Location</Label>
                <Input
                  id="location"
                  value={transitLocation}
                  onChange={(e) => setTransitLocation(e.target.value)}
                  placeholder="Enter current location"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  value={transitNotes}
                  onChange={(e) => setTransitNotes(e.target.value)}
                  placeholder="Enter any notes about transit start"
                  className="w-full bg-black min-h-[80px] p-2 border rounded-md resize-none mt-1"
                />
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowStartTransitModal(false);
                    setSelectedAssignment(null);
                    setTransitNotes('');
                    setTransitLocation('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStartTransit}
                  disabled={actionLoading === 'start_transit'}
                >
                  {actionLoading === 'start_transit' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Transit
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* End Transit Modal */}
      {showEndTransitModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-black rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">End Transit / Mark as Delivered</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="location-end">Delivery Location</Label>
                <Input
                  id="location-end"
                  value={transitLocation}
                  onChange={(e) => setTransitLocation(e.target.value)}
                  placeholder="Enter delivery location"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="notes-end">Delivery Notes</Label>
                <textarea
                  id="notes-end"
                  value={transitNotes}
                  onChange={(e) => setTransitNotes(e.target.value)}
                  placeholder="Enter any delivery notes or observations"
                  className="w-full bg-black min-h-[80px] p-2 border rounded-md resize-none mt-1"
                />
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEndTransitModal(false);
                    setSelectedAssignment(null);
                    setTransitNotes('');
                    setTransitLocation('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEndTransit}
                  disabled={actionLoading === 'end_transit'}
                >
                  {actionLoading === 'end_transit' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Delivered
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// History Component for downloading lists
function HistoryDownload() {
  const [loadingSheets, setLoadingSheets] = useState<DatabaseLoadingSheet[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'assigned' | 'in_transit' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch loading sheets
      const sheetsResponse = await fetch('/api/loading-sheets?limit=100');
      if (sheetsResponse.ok) {
        const sheetsData = await sheetsResponse.json();
        if (sheetsData.success) {
          setLoadingSheets(sheetsData.data || []);
        }
      }
      
      // Fetch assignments
      const assignmentsResponse = await fetch('/api/carrier-assignments');
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        if (assignmentsData.success) {
          setAssignments(assignmentsData.data || []);
        }
      }
      
    } catch (error) {
      console.error('Error fetching history data:', error);
      toast.error('Failed to fetch history data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter loading sheets
  const filteredLoadingSheets = loadingSheets.filter(sheet => {
    // Apply date filter
    if (dateFilter !== 'all') {
      const sheetDate = new Date(sheet.created_at);
      const now = new Date();
      const timeDiff = now.getTime() - sheetDate.getTime();
      
      switch (dateFilter) {
        case 'today':
          const startOfDay = new Date();
          startOfDay.setHours(0, 0, 0, 0);
          if (sheetDate < startOfDay) return false;
          break;
        case 'week':
          if (timeDiff > 7 * 24 * 60 * 60 * 1000) return false;
          break;
        case 'month':
          if (timeDiff > 30 * 24 * 60 * 60 * 1000) return false;
          break;
      }
    }
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        (sheet.bill_number?.toLowerCase().includes(searchLower) || false) ||
        sheet.client?.toLowerCase().includes(searchLower) ||
        sheet.container?.toLowerCase().includes(searchLower) ||
        sheet.exporter?.toLowerCase().includes(searchLower) ||
        sheet.shipping_line?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  // Filter assignments
  const filteredAssignments = assignments.filter(assignment => {
    // Apply status filter
    if (statusFilter !== 'all' && assignment.status !== statusFilter) {
      return false;
    }
    
    // Apply date filter
    if (dateFilter !== 'all') {
      const assignedDate = new Date(assignment.assigned_at);
      const now = new Date();
      const timeDiff = now.getTime() - assignedDate.getTime();
      
      switch (dateFilter) {
        case 'today':
          const startOfDay = new Date();
          startOfDay.setHours(0, 0, 0, 0);
          if (assignedDate < startOfDay) return false;
          break;
        case 'week':
          if (timeDiff > 7 * 24 * 60 * 60 * 1000) return false;
          break;
        case 'month':
          if (timeDiff > 30 * 24 * 60 * 60 * 1000) return false;
          break;
      }
    }
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const carrierName = assignment.carrier?.name?.toLowerCase() || '';
      const sheetBill = assignment.loading_sheet?.bill_number?.toLowerCase() || '';
      const sheetClient = assignment.loading_sheet?.client?.toLowerCase() || '';
      
      return (
        carrierName.includes(searchLower) ||
        sheetBill.includes(searchLower) ||
        sheetClient.includes(searchLower) ||
        assignment.assigned_by.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  // Download loading sheets as CSV
  const downloadLoadingSheetsCSV = () => {
    const headers = ['ID', 'Created At', 'Exporter', 'Client', 'Shipping Line', 'Bill Number', 'Container', 'Seal 1', 'Seal 2', 'Truck', 'Vessel', 'Port', 'Loading Date', 'Loaded By', 'Checked By', 'Remarks'];
    
    const rows = filteredLoadingSheets.map(sheet => [
      sheet.id,
      new Date(sheet.created_at).toLocaleDateString(),
      sheet.exporter,
      sheet.client,
      sheet.shipping_line || '',
      sheet.bill_number || '',
      sheet.container || '',
      sheet.seal1 || '',
      sheet.seal2 || '',
      sheet.truck || '',
      sheet.vessel || '',
      sheet.port || '',
      new Date(sheet.loading_date).toLocaleDateString(),
      sheet.loaded_by || '',
      sheet.checked_by || '',
      sheet.remarks || ''
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loading-sheets-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Download assignments as CSV
  const downloadAssignmentsCSV = () => {
    const headers = ['ID', 'Assigned At', 'Carrier Name', 'Carrier ID', 'Carrier Vehicle', 'Loading Sheet Bill', 'Client', 'Container', 'Assigned By', 'Status', 'Transit Started', 'Transit Completed', 'Notes'];
    
    const rows = filteredAssignments.map(assignment => [
      assignment.id,
      new Date(assignment.assigned_at).toLocaleDateString(),
      assignment.carrier?.name || '',
      assignment.carrier?.id_number || '',
      assignment.carrier?.vehicle_registration || '',
      assignment.loading_sheet?.bill_number || '',
      assignment.loading_sheet?.client || '',
      assignment.loading_sheet?.container || '',
      assignment.assigned_by,
      assignment.status,
      assignment.transit_started_at ? new Date(assignment.transit_started_at).toLocaleDateString() : '',
      assignment.transit_completed_at ? new Date(assignment.transit_completed_at).toLocaleDateString() : '',
      assignment.notes || ''
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carrier-assignments-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Delivered</Badge>;
      case 'in_transit':
        return <Badge className="bg-blue-100 text-blue-800">In Transit</Badge>;
      case 'assigned':
        return <Badge className="bg-yellow-100 text-yellow-800">Assigned</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading history data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{loadingSheets.length}</div>
            <div className="text-sm text-muted-foreground">Total Loading Sheets</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{assignments.length}</div>
            <div className="text-sm text-muted-foreground">Total Assignments</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {loadingSheets.filter(ls => !assignments.some(a => a.loading_sheet_id === ls.id)).length}
            </div>
            <div className="text-sm text-muted-foreground">Unassigned Sheets</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Download Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-6 w-6 text-primary" />
            Filters & Downloads
          </CardTitle>
          <CardDescription>
            Filter and download loading sheets and carrier assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    type="search"
                    placeholder="Search by bill number, client, carrier..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="date-filter">Date Range</Label>
                <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                  <SelectTrigger id="date-filter">
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status-filter">Assignment Status</Label>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="completed">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Download Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button onClick={downloadLoadingSheetsCSV} className="w-full">
                <FileDown className="h-4 w-4 mr-2" />
                Download Loading Sheets ({filteredLoadingSheets.length})
              </Button>
              <Button onClick={downloadAssignmentsCSV} className="w-full">
                <FileDown className="h-4 w-4 mr-2" />
                Download Carrier Assignments ({filteredAssignments.length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading Sheets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Loading Sheets</CardTitle>
          <CardDescription>
            List of all saved loading sheets ({filteredLoadingSheets.length} found)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Created</TableHead>
                  <TableHead>Bill Number</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Container</TableHead>
                  <TableHead>Vessel</TableHead>
                  <TableHead>Loading Date</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLoadingSheets.slice(0, 10).map((sheet) => {
                  const isAssigned = assignments.some(a => a.loading_sheet_id === sheet.id);
                  return (
                    <TableRow key={sheet.id}>
                      <TableCell>
                        {new Date(sheet.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{sheet.bill_number || 'No Bill'}</div>
                      </TableCell>
                      <TableCell>{sheet.client || 'N/A'}</TableCell>
                      <TableCell>{sheet.container || 'N/A'}</TableCell>
                      <TableCell>{sheet.vessel || 'N/A'}</TableCell>
                      <TableCell>
                        {sheet.loading_date ? new Date(sheet.loading_date).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {isAssigned ? (
                          <Badge className="bg-green-100 text-green-800">Assigned</Badge>
                        ) : (
                          <Badge variant="outline">Unassigned</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <a href={`/api/loading-sheets/${sheet.id}/download`} target="_blank">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {filteredLoadingSheets.length === 0 && (
            <div className="text-center py-8">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No loading sheets found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Create loading sheets to see them here'}
              </p>
            </div>
          )}
          {filteredLoadingSheets.length > 10 && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Showing 10 of {filteredLoadingSheets.length} loading sheets
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Carrier Assignments</CardTitle>
          <CardDescription>
            List of all carrier assignments ({filteredAssignments.length} found)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Loading Sheet</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned By</TableHead>
                  <TableHead>Transit Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.slice(0, 10).map((assignment) => {
                  const transitDays = assignment.transit_started_at && assignment.transit_completed_at 
                    ? calculateDaysBetween(assignment.transit_started_at, assignment.transit_completed_at)
                    : assignment.transit_started_at 
                    ? calculateDaysBetween(assignment.transit_started_at, new Date().toISOString())
                    : null;

                  return (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        {new Date(assignment.assigned_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{assignment.carrier?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {assignment.carrier?.vehicle_registration || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{assignment.loading_sheet?.bill_number || 'No Bill'}</div>
                      </TableCell>
                      <TableCell>{assignment.loading_sheet?.client || 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                      <TableCell>{assignment.assigned_by}</TableCell>
                      <TableCell>
                        {transitDays !== null ? `${transitDays} days` : 'Not started'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {filteredAssignments.length === 0 && (
            <div className="text-center py-8">
              <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No assignments found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Create assignments to see them here'}
              </p>
            </div>
          )}
          {filteredAssignments.length > 10 && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Showing 10 of {filteredAssignments.length} assignments
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function OutboundPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const router = useRouter();

  // Statistics state
  const [stats, setStats] = useState({
    totalLoadingSheets: 0,
    containersLoaded: 0,
    activeCarriers: 0,
    totalAssignments: 0,
    pendingAssignments: 0,
    completedAssignments: 0,
    totalShipments: 0,
    activeShipments: 0,
    delayedShipments: 0,
    deliveredShipments: 0,
    uniqueCustomers: 0,
    statusDistribution: {} as Record<string, number>
  });

  // Fetch all data
  const fetchAllStats = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch loading sheets data
      const loadingSheetsResponse = await fetch('/api/loading-sheets?limit=100');
      const loadingSheetsData = loadingSheetsResponse.ok 
        ? await loadingSheetsResponse.json() 
        : { success: false, data: [] };
      
      // Fetch carriers data
      const carriersResponse = await fetch('/api/carriers');
      const carriersData = carriersResponse.ok 
        ? await carriersResponse.json() 
        : { success: false, data: [] };
      
      // Fetch assignments data
      const assignmentsResponse = await fetch('/api/carrier-assignments');
      const assignmentsData = assignmentsResponse.ok 
        ? await assignmentsResponse.json() 
        : { success: false, data: [] };
      
      // Fetch shipments data for status distribution
      const shipmentsResponse = await fetch('/api/outbound-shipments');
      const shipmentsData = shipmentsResponse.ok 
        ? await shipmentsResponse.json() 
        : { success: false, data: [] };
      
      // Calculate stats from loaded data
      const loadingSheets = loadingSheetsData.success ? loadingSheetsData.data : [];
      const carriers = carriersData.success ? carriersData.data : [];
      const assignments = assignmentsData.success ? assignmentsData.data : [];
      const shipments = shipmentsData.success ? shipmentsData.data : [];
      
      // Calculate status distribution
      const statusDistribution: Record<string, number> = {};
      shipments.forEach((shipment: DatabaseShipment) => {
        const displayStatus = convertDbStatusToDisplay(shipment.status);
        statusDistribution[displayStatus] = (statusDistribution[displayStatus] || 0) + 1;
      });
      
      // Calculate pending assignments (loading sheets without assignments)
      const assignedLoadingSheetIds = new Set(
        assignments.map((assignment: Assignment) => assignment.loading_sheet_id)
      );
      const pendingAssignments = loadingSheets.filter(
        (sheet: DatabaseLoadingSheet) => !assignedLoadingSheetIds.has(sheet.id)
      ).length;
      
      // Calculate completed assignments
      const completedAssignments = assignments.filter(
        (assignment: Assignment) => assignment.status === 'completed'
      ).length;
      
      // Calculate active carriers (carriers with status 'Active')
      const activeCarriers = carriers.filter(
        (carrier: Carrier) => carrier.status === 'Active'
      ).length;
      
      // Set stats
      setStats({
        totalLoadingSheets: loadingSheets.length,
        containersLoaded: assignments.length,
        activeCarriers: activeCarriers,
        totalAssignments: assignments.length,
        pendingAssignments: pendingAssignments,
        completedAssignments: completedAssignments,
        totalShipments: shipments.length,
        activeShipments: shipments.filter((s: DatabaseShipment) => 
          s.status === 'Preparing_for_Dispatch' || s.status === 'Ready_for_Dispatch' || s.status === 'In_Transit'
        ).length,
        delayedShipments: shipments.filter((s: DatabaseShipment) => s.status === 'Delayed').length,
        deliveredShipments: shipments.filter((s: DatabaseShipment) => s.status === 'Delivered').length,
        uniqueCustomers: Array.from(new Set(shipments.map((s: DatabaseShipment) => s.customers?.id).filter(Boolean))).length,
        statusDistribution: statusDistribution
      });
      
      // Transform and set shipment data
      if (shipmentsData.success && shipmentsData.data) {
        const transformedData = shipmentsData.data.map((shipment: DatabaseShipment) => ({
          id: shipment.id,
          shipmentId: shipment.shipment_id,
          customer: shipment.customers?.name || 'Unknown Customer',
          origin: shipment.origin || 'N/A',
          destination: shipment.destination || 'N/A',
          status: convertDbStatusToDisplay(shipment.status),
          product: shipment.product || 'N/A',
          weight: `${parseFloat(shipment.weight || '0').toFixed(0)} kg`,
          temperature: 'N/A',
          humidity: 'N/A',
          tags: shipment.tags || 'Not tagged',
          expectedArrival: shipment.expected_arrival 
            ? new Date(shipment.expected_arrival).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
            : 'N/A',
          driver: 'Not assigned',
          carrier: shipment.carrier || 'N/A',
          priority: 'Medium',
          notes: ''
        }));
        setShipments(transformedData);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllStats();
  }, [fetchAllStats]);

  // Filter shipments for outbound processing
  const shipmentsForOutbound = shipments.filter(
    s => s.status === 'Preparing for Dispatch' || s.status === 'Ready for Dispatch'
  );
  
  const handleRecordWeight = (shipmentId: string) => router.push(`/weight-capture?shipmentId=${shipmentId}`);
  const handleManageTags = (shipmentId: string) => router.push(`/tag-management?shipmentId=${shipmentId}`);
  const handleViewDetails = (shipmentId: string) => router.push(`/traceability?shipmentId=${shipmentId}`);
  const handleViewNote = (shipmentId: string) => router.push(`/outbound/dispatch-note/${shipmentId}`);
  const handleViewManifest = (shipmentId: string) => router.push(`/outbound/manifest/${shipmentId}`);

  const handleRefresh = () => {
    console.log('🔄 Refreshing outbound data...');
    fetchAllStats();
  };

  // Calculate completion rate
  const completionRate = stats.totalAssignments > 0 
    ? Math.round((stats.completedAssignments / stats.totalAssignments) * 100) 
    : 0;

  if (loading) {
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
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading outbound operations...</p>
              </div>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Truck />
                Outbound Operations Dashboard
              </h2>
              <p className="text-muted-foreground">
                Manage loading sheets, carrier assignments, transit, and outgoing shipments
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="mr-2" />
              Refresh
            </Button>
          </div>

          {/* Tabs Navigation - Added History tab */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
              <TabsTrigger value="dashboard">
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="loading-sheet">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Loading Sheet
              </TabsTrigger>
              <TabsTrigger value="carrier-assignment">
                <ArrowRight className="h-4 w-4 mr-2" />
                Carrier Assignment
              </TabsTrigger>
              <TabsTrigger value="transit-management">
                <Truck className="h-4 w-4 mr-2" />
                Transit Management
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="h-4 w-4 mr-2" />
                History & Reports
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Outbound Operations Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Total Loading Sheets
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalLoadingSheets}</div>
                    <p className="text-xs text-muted-foreground">Created loading sheets</p>
                    <div className="mt-2">
                      <div className="flex items-center text-sm">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: '100%' }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Container className="h-4 w-4" />
                      Containers Loaded
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.containersLoaded}</div>
                    <p className="text-xs text-muted-foreground">Total containers assigned</p>
                    <div className="mt-2">
                      <div className="flex items-center text-sm">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(stats.containersLoaded / Math.max(stats.totalLoadingSheets, 1)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Active Carriers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.activeCarriers}</div>
                    <p className="text-xs text-muted-foreground">Available for assignments</p>
                    <div className="mt-2">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Active
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <PackageCheck className="h-4 w-4" />
                      Total Assignments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalAssignments}</div>
                    <p className="text-xs text-muted-foreground">Carrier-sheet assignments</p>
                    <div className="mt-2 text-sm">
                      <span className="text-blue-600">{stats.completedAssignments} delivered</span>
                      <span className="text-amber-600 ml-2">• {stats.pendingAssignments} pending</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Pending Assignments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.pendingAssignments}</div>
                    <p className="text-xs text-muted-foreground">Sheets without carrier</p>
                    <div className="mt-2">
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                        <Clock className="mr-1 h-3 w-3" />
                        Pending
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Completion Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {completionRate}%
                    </div>
                    <p className="text-xs text-muted-foreground">Delivery success rate</p>
                    <div className="mt-2">
                      <div className="flex items-center text-sm">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${completionRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Shipment Status Distribution</CardTitle>
                  <CardDescription>Overview of all shipment statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(stats.statusDistribution || {}).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            status === 'Preparing for Dispatch' ? 'bg-yellow-500' :
                            status === 'Ready for Dispatch' ? 'bg-green-500' :
                            status === 'In-Transit' ? 'bg-blue-500' :
                            status === 'Delayed' ? 'bg-red-500' :
                            'bg-gray-500'
                          }`}></div>
                          <span className="font-medium">{status}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold">{count}</span>
                          <div className="w-48 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                status === 'Preparing for Dispatch' ? 'bg-yellow-500' :
                                status === 'Ready for Dispatch' ? 'bg-green-500' :
                                status === 'In-Transit' ? 'bg-blue-500' :
                                status === 'Delayed' ? 'bg-red-500' :
                                'bg-gray-500'
                              }`}
                              style={{ width: `${(count / Math.max(stats.totalShipments, 1)) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-muted-foreground w-12 text-right">
                            {stats.totalShipments > 0 ? Math.round((count / stats.totalShipments) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Shipments</CardTitle>
                  <CardDescription>Latest outbound shipments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {shipments.slice(0, 5).map((shipment) => (
                      <div key={shipment.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div>
                          <div className="font-medium">{shipment.shipmentId}</div>
                          <div className="text-sm text-muted-foreground">{shipment.customer}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            shipment.status === 'Ready for Dispatch' ? 'bg-green-100 text-green-800' :
                            shipment.status === 'Preparing for Dispatch' ? 'bg-yellow-100 text-yellow-800' :
                            shipment.status === 'In-Transit' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {shipment.status}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => router.push(`/outbound/manifest/${shipment.id}`)}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Loading Sheet Tab */}
            <TabsContent value="loading-sheet">
              <LoadingSheet />
            </TabsContent>

            {/* Carrier Assignment Tab */}
            <TabsContent value="carrier-assignment">
              <CarrierAssignmentForm />
            </TabsContent>

            {/* Transit Management Tab */}
            <TabsContent value="transit-management">
              <TransitManagement />
            </TabsContent>

            {/* NEW: History & Reports Tab */}
            <TabsContent value="history">
              <HistoryDownload />
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}