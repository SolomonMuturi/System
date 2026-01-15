'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
import { employeeData, vmsIotData } from '@/lib/data';
import type { Shipment, ShipmentFormData, ShipmentStatus } from '@/lib/data';
import { ShipmentDataTable } from '@/components/dashboard/shipment-data-table';
import { Button } from '@/components/ui/button';
import { GoodsReceivedNoteDialog } from '@/components/dashboard/goods-received-note-dialog';
import { 
  PlusCircle, Printer, Calendar as CalendarIcon, PackageX, Truck, 
  PackageCheck, AlertCircle, RefreshCw, Check, Shield, ClipboardCheck, 
  Scale, Users, TrendingUp, BarChart3, FileText, Box, Weight 
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { PrintableShipmentReport } from '@/components/dashboard/printable-shipment-report';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Define API response type matching your Prisma schema
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

// Updated filter buttons for fresh produce workflow
const filterButtons = [
  { display: 'All', dbValue: null },
  { display: 'Gate In', dbValue: 'Gate_In' },
  { display: 'Intake', dbValue: 'Intake' },
  { display: 'Quality Control', dbValue: 'Quality_Control' },
  { display: 'Counting', dbValue: 'Counting' },
  { display: 'Completed', dbValue: 'Completed' },
];

// Valid database status values for fresh produce workflow
const VALID_DB_STATUSES = [
  'Gate_In',
  'Intake',
  'Quality_Control',
  'Counting',
  'Completed'
];

// Statistics interface
interface SystemStats {
  shipments: {
    total: number;
    gateIn: number;
    intake: number;
    qualityControl: number;
    counting: number;
    completed: number;
  };
  counting: {
    totalProcessed: number;
    pendingRejections: number;
    totalSuppliers: number;
    fuerte4kg: number;
    fuerte10kg: number;
    hass4kg: number;
    hass10kg: number;
  };
  qualityControl: {
    totalChecks: number;
    pendingQC: number;
    completedQC: number;
    approved: number;
    rejected: number;
  };
  suppliers: {
    checkedIn: number;
    activeSuppliers: number;
  };
  weights: {
    totalEntries: number;
    totalWeight: number;
    averageWeight: number;
  };
}

// Helper function to convert database status to display format
function convertDbStatusToDisplay(dbStatus: string): ShipmentStatus {
  const statusMap: Record<string, ShipmentStatus> = {
    'Gate_In': 'Gate In',
    'Intake': 'Intake',
    'Quality_Control': 'Quality Control',
    'Counting': 'Counting',
    'Completed': 'Completed'
  };
  
  return statusMap[dbStatus] || 'Gate In';
}

// Helper function to convert display status to database format
function convertDisplayStatusToDb(displayStatus: ShipmentStatus): string | null {
  const statusMap: Record<ShipmentStatus, string> = {
    'Gate In': 'Gate_In',
    'Intake': 'Intake',
    'Quality Control': 'Quality_Control',
    'Counting': 'Counting',
    'Completed': 'Completed'
  };
  
  return statusMap[displayStatus] || null;
}

export default function FreshProduceShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState({
    shipments: true,
    stats: true
  });
  const [isGrnOpen, setIsGrnOpen] = useState(false);
  const [selectedShipmentForNote, setSelectedShipmentForNote] = useState<
    (Shipment & { formData?: ShipmentFormData }) | null
  >(null);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const productFilterFromUrl = searchParams.get('product');
  const printRef = useRef<HTMLDivElement>(null);

  const [activeFilter, setActiveFilter] = useState<ShipmentStatus | 'All'>('All');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Fetch all statistics from APIs
  const fetchAllStats = useCallback(async () => {
    try {
      console.log('📊 Fetching all system statistics...');
      
      // Fetch data from all APIs in parallel
      const [
        shipmentsRes,
        countingStatsRes,
        qualityChecksRes,
        checkedInSuppliersRes,
        weightEntriesRes
      ] = await Promise.all([
        fetch('/api/shipments'),
        fetch('/api/counting?action=stats'),
        fetch('/api/quality-control'),
        fetch('/api/checked-in-suppliers'),
        fetch('/api/weights?limit=1000')
      ]);

      // Calculate shipments statistics
      const shipmentsData: DatabaseShipment[] = await shipmentsRes.json();
      const shipmentStats = {
        total: shipmentsData.length,
        gateIn: shipmentsData.filter(s => s.status === 'Gate_In').length,
        intake: shipmentsData.filter(s => s.status === 'Intake').length,
        qualityControl: shipmentsData.filter(s => s.status === 'Quality_Control').length,
        counting: shipmentsData.filter(s => s.status === 'Counting').length,
        completed: shipmentsData.filter(s => s.status === 'Completed').length,
      };

      // Counting statistics
      const countingStats = await countingStatsRes.json();
      const countingData = {
        totalProcessed: countingStats.total_processed || 0,
        pendingRejections: countingStats.pending_rejections || 0,
        totalSuppliers: countingStats.total_suppliers || 0,
        fuerte4kg: countingStats.fuerte_4kg || 0,
        fuerte10kg: countingStats.fuerte_10kg || 0,
        hass4kg: countingStats.hass_4kg || 0,
        hass10kg: countingStats.hass_10kg || 0,
      };

      // Quality control statistics
      const qualityChecksData = await qualityChecksRes.json();
      const qcStats = {
        totalChecks: qualityChecksData.length,
        pendingQC: qualityChecksData.filter((qc: any) => qc.status === 'pending_qc').length,
        completedQC: qualityChecksData.filter((qc: any) => qc.status === 'qc_completed').length,
        approved: qualityChecksData.filter((qc: any) => qc.overall_status === 'approved').length,
        rejected: qualityChecksData.filter((qc: any) => qc.overall_status === 'rejected').length,
      };

      // Checked-in suppliers statistics
      const checkedInSuppliersData = await checkedInSuppliersRes.json();
      const supplierStats = {
        checkedIn: checkedInSuppliersData.length,
        activeSuppliers: countingStats.total_suppliers || 0,
      };

      // Weight entries statistics
      const weightEntriesData = await weightEntriesRes.json();
      const totalWeight = weightEntriesData.reduce((sum: number, entry: any) => 
        sum + (entry.netWeight || 0), 0
      );
      const weightStats = {
        totalEntries: weightEntriesData.length,
        totalWeight: totalWeight,
        averageWeight: weightEntriesData.length > 0 ? totalWeight / weightEntriesData.length : 0,
      };

      // Combine all statistics
      const allStats: SystemStats = {
        shipments: shipmentStats,
        counting: countingData,
        qualityControl: qcStats,
        suppliers: supplierStats,
        weights: weightStats,
      };

      setSystemStats(allStats);
      setLoading(prev => ({ ...prev, stats: false }));
      
      console.log('✅ Statistics loaded successfully');

    } catch (error) {
      console.error('❌ Error fetching statistics:', error);
      setLoading(prev => ({ ...prev, stats: false }));
    }
  }, []);

  // Fetch shipments from API - REAL DATA FETCH
  const fetchShipments = useCallback(async () => {
    try {
      console.log('📡 Fetching shipments from database...');
      setLoading(prev => ({ ...prev, shipments: true }));
      
      const params = new URLSearchParams();
      
      // Handle status filter - ONLY add if it's a specific status (not 'All')
      if (activeFilter !== 'All') {
        const dbStatus = convertDisplayStatusToDb(activeFilter);
        if (dbStatus && dbStatus.trim() && VALID_DB_STATUSES.includes(dbStatus)) {
          params.append('status', dbStatus);
          console.log('🔍 Adding status filter:', dbStatus);
        } else {
          console.log('⚠️ Skipping invalid status filter:', dbStatus);
        }
      }
      
      // Handle product filter
      if (productFilterFromUrl && productFilterFromUrl.trim() !== '') {
        params.append('product', productFilterFromUrl.trim());
        console.log('🔍 Adding product filter:', productFilterFromUrl);
      }
      
      // Handle date filters
      if (dateRange?.from) {
        params.append('fromDate', dateRange.from.toISOString());
        console.log('🔍 Adding fromDate:', dateRange.from.toISOString());
      }
      
      if (dateRange?.to) {
        params.append('toDate', dateRange.to.toISOString());
        console.log('🔍 Adding toDate:', dateRange.to.toISOString());
      }
      
      // Log the final URL
      const apiUrl = `/api/shipments${params.toString() ? '?' + params.toString() : ''}`;
      console.log('🌐 API URL:', apiUrl);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Failed to fetch shipments: ${response.status}`);
      }
      
      const data: DatabaseShipment[] = await response.json();
      console.log('✅ API returned', data.length, 'shipments');
      
      // Transform database data to match your existing Shipment type
      const transformedData: Shipment[] = data.map(shipment => {
        // Convert database status to display format
        const displayStatus = convertDbStatusToDisplay(shipment.status);
        
        return {
          id: shipment.id,
          shipmentId: shipment.shipment_id,
          customer: shipment.customers?.name || 'Supplier',
          origin: shipment.origin || 'Farm',
          destination: 'Warehouse', // Always warehouse for fresh produce intake
          status: displayStatus,
          product: shipment.product || 'Fresh Produce',
          weight: shipment.weight || 'Not weighed',
          temperature: 'N/A',
          humidity: 'N/A',
          tags: shipment.tags || 'Not tagged',
          expectedArrival: shipment.expected_arrival 
            ? format(new Date(shipment.expected_arrival), 'yyyy-MM-dd HH:mm')
            : format(new Date(shipment.created_at), 'yyyy-MM-dd HH:mm'),
          driver: 'Supplier Driver',
          carrier: shipment.carrier || 'Supplier Vehicle',
          priority: 'Standard',
          notes: ''
        };
      });
      
      setShipments(transformedData);
      setLoading(prev => ({ ...prev, shipments: false }));
    } catch (error) {
      console.error('❌ Error fetching shipments:', error);
      // Show empty state
      setShipments([]);
      setLoading(prev => ({ ...prev, shipments: false }));
    }
  }, [activeFilter, productFilterFromUrl, dateRange]);

  // Initial fetch and refetch when filters change
  useEffect(() => {
    fetchShipments();
    fetchAllStats();
  }, [fetchShipments, fetchAllStats]);

  // Handle URL parameter changes
  useEffect(() => {
    if (productFilterFromUrl) {
      setActiveFilter('All');
    }
  }, [productFilterFromUrl]);

  const handleRecordWeight = (shipmentId: string) => {
    router.push(`/weight-capture?shipmentId=${shipmentId}`);
  };

  const handleQualityCheck = (shipmentId: string) => {
    router.push(`/quality-control?shipmentId=${shipmentId}`);
  };

  const handleStartCounting = (shipmentId: string) => {
    router.push(`/counting?shipmentId=${shipmentId}`);
  };

  const handleViewDetails = (shipmentId: string) => {
    router.push(`/shipments/${shipmentId}/details`);
  };
  
  const handleViewNote = async (shipmentId: string) => {
    try {
      console.log('📡 Fetching shipment details for GRN:', shipmentId);
      const response = await fetch(`/api/shipments/${shipmentId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch shipment details');
      }
      
      const shipment: DatabaseShipment = await response.json();
      
      const displayStatus = convertDbStatusToDisplay(shipment.status);
      
      const mockFormData: ShipmentFormData = {
        customer: shipment.customers?.name || 'Supplier',
        origin: shipment.origin || 'Farm',
        destination: 'Warehouse',
        status: displayStatus,
        product: shipment.product || 'Fresh Produce',
        qualityChecks: {
          packaging: { status: 'pending' },
          freshness: { status: 'pending' },
          seals: { status: 'pending' },
        },
        declaredWeight: parseFloat(shipment.weight || '0') || 0,
        netWeight: parseFloat(shipment.weight || '0') || 0,
        arrivalTemperature: 4,
        driverId: '',
        truckId: '',
      };
      
      const transformedShipment: Shipment = {
        id: shipment.id,
        shipmentId: shipment.shipment_id,
        customer: shipment.customers?.name || 'Supplier',
        origin: shipment.origin || 'Farm',
        destination: 'Warehouse',
        status: displayStatus,
        product: shipment.product || 'Fresh Produce',
        weight: shipment.weight || 'Not weighed',
        temperature: 'N/A',
        humidity: 'N/A',
        tags: shipment.tags || 'Not tagged',
        expectedArrival: shipment.expected_arrival 
          ? format(new Date(shipment.expected_arrival), 'yyyy-MM-dd HH:mm')
          : format(new Date(shipment.created_at), 'yyyy-MM-dd HH:mm'),
        driver: 'Supplier Driver',
        carrier: shipment.carrier || 'Supplier Vehicle',
        priority: 'Standard',
        notes: ''
      };
      
      setSelectedShipmentForNote({ ...transformedShipment, formData: mockFormData });
      setIsGrnOpen(true);
    } catch (error) {
      console.error('Error fetching shipment for GRN:', error);
      // Fallback to finding in local state
      const shipment = shipments.find(s => s.id === shipmentId);
      if (shipment) {
        const mockFormData: ShipmentFormData = {
          customer: shipment.customer,
          origin: shipment.origin,
          destination: shipment.destination,
          status: shipment.status,
          product: shipment.product,
          qualityChecks: {
            packaging: { status: 'pending' },
            freshness: { status: 'pending' },
            seals: { status: 'pending' },
          },
          declaredWeight: parseFloat(shipment.weight) || 0,
          netWeight: parseFloat(shipment.weight) || 0,
          arrivalTemperature: 4,
          driverId: '',
          truckId: '',
        };
        setSelectedShipmentForNote({ ...shipment, formData: mockFormData });
        setIsGrnOpen(true);
      }
    }
  };

  const handlePrintReport = async () => {
    const element = printRef.current;
    if (element) {
      const canvas = await html2canvas(element, { scale: 2 });
      const data = canvas.toDataURL('image/jpeg');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`fresh-produce-intake-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    }
  };

  const handleRefresh = () => {
    console.log('🔄 Refreshing all data...');
    setLoading({ shipments: true, stats: true });
    fetchShipments();
    fetchAllStats();
  };

  // Get shipments that are in process (not completed)
  const inProcessShipments = shipments.filter(s => 
    s.status !== 'Completed'
  );

  const filteredShipments = shipments;

  if (loading.shipments || loading.stats) {
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
          <div className="non-printable">
            <Header />
          </div>
          <main className="p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading system data...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Fetching real-time data from all systems
                </p>
              </div>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading shipments...</div>}>
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
          <div className="non-printable">
            <Header />
          </div>
          <main className="p-4 md:p-6 lg:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Fresh Produce Intake Center
                </h2>
                <p className="text-muted-foreground">
                  Real-time overview of warehouse operations
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Last updated: {format(new Date(), 'yyyy-MM-dd HH:mm:ss')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleRefresh} disabled={loading.shipments}>
                  <RefreshCw className={cn("mr-2", loading.shipments && "animate-spin")} />
                  Refresh All
                </Button>
                <Button variant="outline" onClick={handlePrintReport}>
                  <Printer className="mr-2" />
                  Print Report
                </Button>
              </div>
            </div>
            
            {/* Comprehensive Statistics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Shipment Statistics */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-blue-700">
                    <Truck className="w-4 h-4" />
                    Shipments Pipeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-600">Total</span>
                      <span className="font-bold text-lg">{systemStats?.shipments.total || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-blue-500">Gate In</span>
                      <span className="font-medium text-blue-500">{systemStats?.shipments.gateIn || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-blue-500">Intake</span>
                      <span className="font-medium text-blue-500">{systemStats?.shipments.intake || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-blue-500">QC</span>
                      <span className="font-medium text-blue-500">{systemStats?.shipments.qualityControl || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-blue-500">Counting</span>
                      <span className="font-medium text-blue-500">{systemStats?.shipments.counting || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Counting Statistics */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-green-700">
                    <ClipboardCheck className="w-4 h-4" />
                    Counting System
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-700">Total Processed</span>
                      <span className="font-bold text-lg text-green-700">{systemStats?.counting.totalProcessed || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-green-700">Pending</span>
                      <span className="font-medium text-green-700">{systemStats?.counting.pendingRejections || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-green-700">Suppliers</span>
                      <span className="font-medium text-green-700">{systemStats?.counting.totalSuppliers || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-green-700">Fuerte (4kg)</span>
                      <span className="font-medium text-green-700">{systemStats?.counting.fuerte4kg || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-green-700">Hass (4kg)</span>
                      <span className="font-medium text-green-700">{systemStats?.counting.hass4kg || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quality Control Statistics */}
              <Card className="border-purple-200 bg-purple-50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-purple-700">
                    <Shield className="w-4 h-4" />
                    Quality Control
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Checks</span>
                      <span className="font-bold text-lg text-gray-600">{systemStats?.qualityControl.totalChecks || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Pending QC</span>
                      <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                        {systemStats?.qualityControl.pendingQC || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Approved</span>
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        {systemStats?.qualityControl.approved || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Rejected</span>
                      <Badge variant="outline" className="text-red-600 border-red-300">
                        {systemStats?.qualityControl.rejected || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Completion</span>
                      <span className="font-medium text-blue-600">
                        {systemStats?.qualityControl.totalChecks > 0 
                          ? `${Math.round((systemStats.qualityControl.completedQC / systemStats.qualityControl.totalChecks) * 100)}%`
                          : '0%'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Suppliers & Weights Statistics */}
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-amber-700">
                    <Users className="w-4 h-4" />
                    Suppliers & Weights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Checked In</span>
                      <span className="font-bold text-lg text-amber-700">{systemStats?.suppliers.checkedIn || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Active Suppliers</span>
                      <span className="font-medium text-amber-700">{systemStats?.suppliers.activeSuppliers || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Weight Entries</span>
                      <span className="font-medium text-amber-700">{systemStats?.weights.totalEntries || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Total Weight</span>
                      <span className="font-medium text-amber-700">{(systemStats?.weights.totalWeight || 0).toFixed(1)} kg</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Avg Weight</span>
                      <span className="font-medium text-amber-700">{(systemStats?.weights.averageWeight || 0).toFixed(1)} kg</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Active Intake Pipeline</h3>
                <p className="text-sm text-muted-foreground">
                  {inProcessShipments.length} shipment(s) in process
                </p>
              </div>
              {inProcessShipments.length > 0 ? (
                <ShipmentDataTable
                  shipments={inProcessShipments}
                  onRecordWeight={handleRecordWeight}
                  onManageTags={handleQualityCheck}
                  onViewDetails={handleViewDetails}
                  onViewNote={handleViewNote}
                  onViewManifest={handleStartCounting}
                  actionLabels={{
                    recordWeight: 'Record Weight',
                    manageTags: 'Quality Check',
                    viewManifest: 'Start Counting'
                  }}
                />
              ) : (
                <div className="text-center py-8 border rounded-lg">
                  <Check className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <p className="text-muted-foreground">No active shipments in the pipeline</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    All shipments are either completed or not yet received at gate
                  </p>
                </div>
              )}
            </div>
            
            <Separator />

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  All Fresh Produce Shipments
                  {productFilterFromUrl && (
                    <span className="text-base text-muted-foreground"> (Product: {productFilterFromUrl})</span>
                  )}
                </h3>
                <div className="flex items-center gap-4">
                  <p className="text-sm text-muted-foreground">
                    {filteredShipments.length} shipment(s) total
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => window.open('/api/shipments', '_blank')}
                      title="View shipments API"
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => window.open('/api/counting?action=stats', '_blank')}
                      title="View counting statistics"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => window.open('/api/quality-control', '_blank')}
                      title="View quality checks"
                    >
                      <Shield className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {filterButtons.map(({ display, dbValue }) => {
                  const isActive = activeFilter === display;
                  return (
                    <Button
                      key={display}
                      variant={isActive ? 'default' : 'outline'}
                      onClick={() => {
                        setActiveFilter(display as ShipmentStatus | 'All');
                        const currentUrl = new URL(window.location.href);
                        if (currentUrl.searchParams.has('product')) {
                          currentUrl.searchParams.delete('product');
                          window.history.replaceState({}, '', currentUrl.toString());
                        }
                      }}
                      className={cn(
                        'min-w-[120px]',
                        display === 'Gate In' && isActive && 'bg-black-600 hover:bg-black-700',
                        display === 'Intake' && isActive && 'bg-black-600 hover:bg-black-700',
                        display === 'Quality Control' && isActive && 'bg-purple-600 hover:bg-black-700',
                        display === 'Counting' && isActive && 'bg-black-600 hover:bg-black-700',
                        display === 'Completed' && isActive && 'bg-black-600 hover:bg-black-700'
                      )}
                    >
                      {display}
                    </Button>
                  );
                })}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "w-[300px] justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Filter by arrival date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {filteredShipments.length > 0 ? (
                <ShipmentDataTable
                  shipments={filteredShipments}
                  onRecordWeight={handleRecordWeight}
                  onManageTags={handleQualityCheck}
                  onViewDetails={handleViewDetails}
                  onViewNote={handleViewNote}
                  onViewManifest={handleStartCounting}
                  actionLabels={{
                    recordWeight: 'Record Weight',
                    manageTags: 'Quality Check',
                    viewManifest: 'Start Counting'
                  }}
                />
              ) : (
                <div className="text-center py-8 border rounded-lg">
                  <PackageX className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No shipments found in database</p>
                  <p className="text-sm text-muted-foreground mt-2 mb-4">
                    Your database might be empty. Check your API endpoint or seed the database.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setActiveFilter('All');
                        setDateRange(undefined);
                      }}
                    >
                      Clear filters
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => window.open('/api/shipments', '_blank')}
                    >
                      Check API
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleRefresh}
                    >
                      Refresh Data
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </main>
        </SidebarInset>

        {selectedShipmentForNote && (
          <GoodsReceivedNoteDialog
            isOpen={isGrnOpen}
            onOpenChange={setIsGrnOpen}
            shipment={selectedShipmentForNote}
          />
        )}
      </SidebarProvider>
    </Suspense>
  );
}