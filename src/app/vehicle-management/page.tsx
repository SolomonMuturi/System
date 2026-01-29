'use client';

import { useState, useRef, useEffect } from 'react';
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
import { VehicleDataTable } from '@/components/dashboard/vehicle-data-table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CreateSupplierGateForm, type SupplierFormValues } from '@/components/dashboard/create-supplier-gate-form';
import { Truck, QrCode, Printer, DoorOpen, Loader2, RefreshCw, CheckCircle, Clock, Calendar, CheckCheck, Package, Fuel, Gauge, AlertCircle, Download, Search, X } from 'lucide-react';
import { GatePassDialog } from '@/components/dashboard/gate-pass-dialog';
import { useToast } from '@/hooks/use-toast';
import { RegistrationSuccess } from '@/components/dashboard/registration-success';
import { format, parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PrintableVehicleReport } from '@/components/dashboard/printable-vehicle-report';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

// Supplier Vehicle type definition
interface SupplierVehicle {
  id: string;
  vehicleCode: string;
  driverName: string;
  idNumber: string;
  company: string;
  email: string;
  phone: string;
  vehiclePlate: string;
  vehicleType: string;
  cargoDescription: string;
  vehicleTypeCategory: 'supplier';
  status: 'Pre-registered' | 'Checked-in' | 'Pending Exit' | 'Checked-out';
  checkInTime?: string;
  checkOutTime?: string;
  expectedCheckInTime: string;
  hostId: string;
  hostName: string;
  department: string;
}

type DateRange = {
  from: Date;
  to: Date;
};

export default function VehicleManagementPage() {
  const [vehicles, setVehicles] = useState<SupplierVehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<SupplierVehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [isGatePassOpen, setIsGatePassOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<SupplierVehicle | null>(null);
  const [newlyRegisteredVehicle, setNewlyRegisteredVehicle] = useState<SupplierVehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [apiError, setApiError] = useState<string | null>(null);
  const [historyDateRange, setHistoryDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch vehicles from SUPPLIERS database
  useEffect(() => {
    fetchSupplierVehicles();
  }, []);

  // Update filtered vehicles when vehicles or search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredVehicles(vehicles);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = vehicles.filter(vehicle => 
        vehicle.driverName.toLowerCase().includes(query) ||
        vehicle.company.toLowerCase().includes(query) ||
        vehicle.vehiclePlate.toLowerCase().includes(query) ||
        vehicle.vehicleCode.toLowerCase().includes(query) ||
        vehicle.phone.toLowerCase().includes(query) ||
        vehicle.status.toLowerCase().includes(query) ||
        vehicle.vehicleType.toLowerCase().includes(query)
      );
      setFilteredVehicles(filtered);
    }
  }, [vehicles, searchQuery]);

  const fetchSupplierVehicles = async () => {
    try {
      setIsLoading(true);
      setApiError(null);
      console.log('🔄 Fetching supplier vehicles...');
      
      const response = await fetch('/api/suppliers');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch suppliers: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ Found ${data.length} suppliers`);
      
      // Filter suppliers that have vehicle information
      const vehiclesData = data.filter((supplier: any) => 
        supplier.vehicle_number_plate && supplier.vehicle_number_plate.trim() !== ''
      );
      
      console.log(`📊 Found ${vehiclesData.length} suppliers with vehicles`);
      
      // Convert to SupplierVehicle type with proper status mapping
      const convertedVehicles: SupplierVehicle[] = vehiclesData.map((supplier: any) => ({
        id: supplier.id,
        vehicleCode: supplier.supplier_code || `VEH-${supplier.id}`,
        driverName: supplier.driver_name || supplier.contact_name || 'Unknown Driver',
        idNumber: supplier.driver_id_number || '',
        company: supplier.name || 'Unknown Company',
        email: supplier.contact_email || '',
        phone: supplier.contact_phone || '',
        vehiclePlate: supplier.vehicle_number_plate || '',
        vehicleType: supplier.vehicle_type || 'Truck',
        cargoDescription: supplier.produce_types ? 
          (Array.isArray(supplier.produce_types) ? 
            supplier.produce_types.join(', ') : 
            (typeof supplier.produce_types === 'string' ? 
              JSON.parse(supplier.produce_types || '[]').join(', ') : '')) : '',
        vehicleTypeCategory: 'supplier',
        status: (supplier.vehicle_status as 'Pre-registered' | 'Checked-in' | 'Pending Exit' | 'Checked-out') || 'Pre-registered',
        checkInTime: supplier.vehicle_check_in_time || undefined,
        checkOutTime: supplier.vehicle_check_out_time || undefined,
        expectedCheckInTime: supplier.created_at || new Date().toISOString(),
        hostId: supplier.id,
        hostName: supplier.name || 'Supplier',
        department: supplier.location || '',
      }));
      
      console.log(`🚚 Converted ${convertedVehicles.length} supplier vehicles`);
      setVehicles(convertedVehicles);
      setFilteredVehicles(convertedVehicles);
      
    } catch (error: any) {
      console.error('❌ Error fetching supplier vehicles:', error);
      setApiError(error.message || 'Could not connect to database');
      
      toast({
        title: 'Database Warning',
        description: 'Could not load supplier vehicles from database.',
        variant: 'destructive',
      });
      
      setVehicles([]);
      setFilteredVehicles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAllData = async () => {
    setIsRefreshing(true);
    setApiError(null);
    try {
      await fetchSupplierVehicles();
      toast({
        title: 'Data Refreshed',
        description: 'Latest supplier vehicle data has been loaded.',
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: 'Refresh Failed',
        description: 'Could not refresh data from server.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Handle form submission - saves to SUPPLIERS database
  const handleAddVehicle = async (values: SupplierFormValues) => {
    try {
      console.log('🔄 Registering new supplier vehicle with data:', values);
      
      // Generate a unique vehicle code
      const vehicleCode = `SUP-VEH-${Date.now().toString().slice(-6)}`;
      
      // Prepare data for API based on your supplier form fields
      const vehicleData = {
        name: values.company || `${values.driverName}`,
        contact_name: values.driverName,
        contact_phone: values.phoneNumber,
        supplier_code: vehicleCode,
        location: 'Gate Registration',
        produce_types: ['Avocado Delivery'],
        status: 'Active',
        vehicle_number_plate: values.vehicleRegNo,
        vehicle_type: values.vehicleType,
        driver_name: values.driverName,
        driver_id_number: values.idNumber,
        vehicle_status: 'Pre-registered',
      };

      console.log('📤 Sending to suppliers API:', vehicleData);

      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehicleData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        
        let errorMessage = 'Failed to register supplier vehicle';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const savedSupplier = await response.json();
      console.log('✅ Supplier vehicle saved:', savedSupplier);
      
      // Create the new vehicle object
      const newVehicle: SupplierVehicle = {
        id: savedSupplier.id,
        vehicleCode: savedSupplier.supplier_code || vehicleCode,
        driverName: savedSupplier.driver_name || values.driverName,
        idNumber: savedSupplier.driver_id_number || values.idNumber,
        company: savedSupplier.name || values.company || `${values.driverName}`,
        email: savedSupplier.contact_email || '',
        phone: savedSupplier.contact_phone || values.phoneNumber,
        vehiclePlate: savedSupplier.vehicle_number_plate || values.vehicleRegNo,
        vehicleType: savedSupplier.vehicle_type || values.vehicleType,
        cargoDescription: 'Avocado Delivery',
        vehicleTypeCategory: 'supplier',
        status: 'Pre-registered',
        expectedCheckInTime: savedSupplier.created_at || new Date().toISOString(),
        hostId: savedSupplier.id,
        hostName: savedSupplier.name || 'Supplier',
        department: savedSupplier.location || '',
      };
      
      setVehicles(prev => [newVehicle, ...prev]);
      setFilteredVehicles(prev => [newVehicle, ...prev]);
      setNewlyRegisteredVehicle(newVehicle);
      
      toast({
        title: 'Supplier Vehicle Registered',
        description: `${newVehicle.driverName} (${newVehicle.vehiclePlate}) has been successfully registered.`,
      });
      
    } catch (error: any) {
      console.error('❌ Error registering supplier vehicle:', error);
      
      toast({
        title: 'Registration Failed',
        description: error.message || 'Failed to register supplier vehicle',
        variant: 'destructive',
      });
    }
  };

  const handleRegistrationDialogClose = (open: boolean) => {
    if (!open) {
      setNewlyRegisteredVehicle(null);
    }
    setIsRegisterDialogOpen(open);
  };

  const handleCheckIn = async (vehicleId?: string) => {
    if (!vehicleId) {
      toast({
        title: 'No Vehicle Selected',
        description: 'Please select a vehicle to check in.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (!vehicle) return;

      // Allow re-checking in for vehicles that are checked out
      // Vehicles can be checked in if they are: Pre-registered OR Checked-out
      const allowedStatuses = ['Pre-registered', 'Checked-out'];
      if (!allowedStatuses.includes(vehicle.status)) {
        toast({
          title: 'Cannot Check In',
          description: `Vehicle ${vehicle.driverName} is currently ${vehicle.status.toLowerCase()}. Can only check in when status is Pre-registered or Checked-out.`,
          variant: 'destructive',
        });
        return;
      }

      // Update vehicle status in database
      const checkInTime = new Date().toISOString();
      const response = await fetch(`/api/suppliers?id=${vehicleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicle_status: 'Checked-in',
          vehicle_check_in_time: checkInTime,
          vehicle_check_out_time: null, // Clear check-out time when checking in again
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to check in vehicle in database');
      }

      const updatedSupplier = await response.json();
      
      // Update local state
      const updatedVehicle: SupplierVehicle = {
        ...vehicle,
        status: 'Checked-in',
        checkInTime: checkInTime,
        checkOutTime: undefined, // Clear check-out time
      };

      setVehicles(prev => prev.map(v => v.id === vehicleId ? updatedVehicle : v));
      setFilteredVehicles(prev => prev.map(v => v.id === vehicleId ? updatedVehicle : v));
      setSelectedVehicle(updatedVehicle);
      
      toast({
        title: "Vehicle Checked In",
        description: `${vehicle.driverName} has been successfully checked in.`,
      });

      setIsGatePassOpen(true);
      
    } catch (error: any) {
      console.error('Error checking in vehicle:', error);
      
      toast({
        title: 'Check-in Failed',
        description: error.message || 'Failed to check in vehicle',
        variant: 'destructive',
      });
    }
  };

  const handleCheckOut = async (vehicleId: string, final: boolean = false) => {
    try {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (!vehicle) return;

      if (final) {
        // Update to checked out in database
        const checkOutTime = new Date().toISOString();
        const response = await fetch(`/api/suppliers?id=${vehicleId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vehicle_status: 'Checked-out',
            vehicle_check_out_time: checkOutTime,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to check out vehicle from database');
        }

        await response.json();
        
        // Update local state
        const updatedVehicle = { 
          ...vehicle, 
          status: 'Checked-out', 
          checkOutTime: checkOutTime,
        };

        setVehicles(prev => prev.map(v => v.id === vehicleId ? updatedVehicle : v));
        setFilteredVehicles(prev => prev.map(v => v.id === vehicleId ? updatedVehicle : v));
        setSelectedVehicle(null);
        
        toast({
          title: "Vehicle Verified for Exit",
          description: `${vehicle.driverName} has been successfully checked out.`,
        });
      } else {
        // Set to pending exit in database
        const response = await fetch(`/api/suppliers?id=${vehicleId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vehicle_status: 'Pending Exit',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update vehicle status in database');
        }

        await response.json();
        
        // Update local state
        const updatedVehicle = { 
          ...vehicle, 
          status: 'Pending Exit',
        };

        setVehicles(prev => prev.map(v => v.id === vehicleId ? updatedVehicle : v));
        setFilteredVehicles(prev => prev.map(v => v.id === vehicleId ? updatedVehicle : v));
        setSelectedVehicle(updatedVehicle);
        
        toast({
          title: "Checkout Initiated",
          description: `${vehicle.driverName} is now pending exit. A gate pass has been generated.`,
        });

        setIsGatePassOpen(true);
      }
    } catch (error: any) {
      console.error('Error during checkout:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to process checkout',
        variant: 'destructive',
      });
    }
  };

  const handleRowClick = (vehicle: SupplierVehicle) => {
    setSelectedVehicle(vehicle);
  };

  const handlePrintReport = async () => {
    const element = printRef.current;
    if (element) {
      try {
        const canvas = await html2canvas(element, { 
          scale: 2,
          useCORS: true,
          logging: false
        });
        const data = canvas.toDataURL('image/jpeg', 0.95);
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(data, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`supplier-vehicle-report-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`);
        
        toast({
          title: 'Report Generated',
          description: 'Supplier vehicle report has been downloaded as PDF.',
        });
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast({
          title: 'PDF Generation Failed',
          description: 'Could not generate PDF report.',
          variant: 'destructive',
        });
      }
    }
  };

  // Calculate filtered completed vehicles based on date range
  const checkedOutVehicles = vehicles.filter(v => v.status === 'Checked-out');
  
  const filteredCompletedVehicles = checkedOutVehicles.filter(vehicle => {
    if (!vehicle.checkOutTime) return false;
    const checkOutDate = parseISO(vehicle.checkOutTime);
    return isWithinInterval(checkOutDate, {
      start: startOfDay(historyDateRange.from),
      end: endOfDay(historyDateRange.to)
    });
  });

  // Calculate statistics
  const vehiclesOnSite = vehicles.filter(v => 
    v.status === 'Checked-in' || v.status === 'Pending Exit'
  ).length;

  const pendingExitVehicles = vehicles.filter(v => v.status === 'Pending Exit');
  const preRegisteredVehicles = vehicles.filter(v => v.status === 'Pre-registered');

  // Helper function to escape CSV fields
  const escapeCsvField = (field: any): string => {
    if (field === null || field === undefined) {
      return '';
    }
    const stringField = String(field);
    if (/[",\n]/.test(stringField)) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  };

  // Convert to CSV
  const convertToCsv = (data: any[], headers: string[]): string => {
    const headerRow = headers.map(escapeCsvField).join(',');
    const dataRows = data.map(row => 
      headers.map(header => {
        const headerKey = header.toLowerCase().replace(/\s+/g, '_');
        return escapeCsvField(
          row[headerKey as keyof typeof row] ?? 
          (row as any)[header] ?? 
          (row as any)[header.toLowerCase()] ?? 
          ''
        );
      }).join(',')
    );
    return [headerRow, ...dataRows].join('\n');
  };

  // Export filtered completed vehicles to CSV
  const exportCompletedToCSV = async () => {
    if (filteredCompletedVehicles.length === 0) {
      toast({
        title: 'No Data',
        description: 'No completed deliveries found for the selected date range.',
        variant: 'destructive',
      });
      return;
    }

    setIsExportingCSV(true);
    try {
      // Prepare data for CSV
      const headers = [
        'Vehicle Code',
        'Driver Name',
        'ID Number',
        'Phone',
        'Vehicle Plate',
        'Vehicle Type',
        'Cargo Description',
        'Check-in Time',
        'Check-out Time',
        'Status',
        'Department'
      ];
      
      const data = filteredCompletedVehicles.map(vehicle => ({
        'Vehicle Code': vehicle.vehicleCode,
        'Driver Name': vehicle.driverName,
        'ID Number': vehicle.idNumber,
        'Phone': vehicle.phone,
        'Vehicle Plate': vehicle.vehiclePlate || 'None',
        'Vehicle Type': vehicle.vehicleType,
        'Cargo Description': 'Avocado Delivery',
        'Check-in Time': vehicle.checkInTime ? format(parseISO(vehicle.checkInTime), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
        'Check-out Time': vehicle.checkOutTime ? format(parseISO(vehicle.checkOutTime), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
        'Status': vehicle.status,
        'Department': vehicle.department || ''
      }));

      const csvContent = convertToCsv(data, headers);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      const filename = `supplier_vehicles_completed_${format(historyDateRange.from, 'yyyy-MM-dd')}_to_${format(historyDateRange.to, 'yyyy-MM-dd')}.csv`;
      
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'CSV Export Complete',
        description: `Completed supplier vehicles (${filteredCompletedVehicles.length} records) has been downloaded.`,
      });
      
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'Failed to generate CSV file. Please try again.',
      });
    } finally {
      setIsExportingCSV(false);
    }
  };

  // Export all supplier vehicles to CSV
  const exportAllVehiclesToCSV = async () => {
    if (vehicles.length === 0) {
      toast({
        title: 'No Data',
        description: 'No supplier vehicles found to export.',
        variant: 'destructive',
      });
      return;
    }

    setIsExportingCSV(true);
    try {
      const headers = [
        'Vehicle Code',
        'Driver Name',
        'ID Number',
        'Phone',
        'Vehicle Plate',
        'Vehicle Type',
        'Cargo Description',
        'Status',
        'Check-in Time',
        'Check-out Time',
        'Department'
      ];
      
      const data = vehicles.map(vehicle => ({
        'Vehicle Code': vehicle.vehicleCode,
        'Driver Name': vehicle.driverName,
        'ID Number': vehicle.idNumber,
        'Phone': vehicle.phone,
        'Vehicle Plate': vehicle.vehiclePlate || 'None',
        'Vehicle Type': vehicle.vehicleType,
        'Cargo Description': 'Avocado Delivery',
        'Status': vehicle.status,
        'Check-in Time': vehicle.checkInTime ? format(parseISO(vehicle.checkInTime), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
        'Check-out Time': vehicle.checkOutTime ? format(parseISO(vehicle.checkOutTime), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
        'Department': vehicle.department || ''
      }));

      const csvContent = convertToCsv(data, headers);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      const filename = `all_supplier_vehicles_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'CSV Export Complete',
        description: `All supplier vehicles (${vehicles.length} records) have been downloaded.`,
      });
      
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'Failed to generate CSV file. Please try again.',
      });
    } finally {
      setIsExportingCSV(false);
    }
  };

  if (isLoading) {
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
          <div className='non-printable'>
            <Header />
          </div>
          <main className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Supplier Vehicle Management
                </h2>
                <p className="text-muted-foreground">
                  Loading supplier vehicle data...
                </p>
              </div>
              <Button disabled>
                <Loader2 className="mr-2 animate-spin" />
                Loading...
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="h-32 bg-gray-100 animate-pulse rounded-lg"></div>
              <div className="h-32 bg-gray-100 animate-pulse rounded-lg"></div>
              <div className="h-32 bg-gray-100 animate-pulse rounded-lg"></div>
            </div>
            <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <>
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
          <div className='non-printable'>
            <Header />
          </div>
          <main className="p-6 space-y-6">
            {apiError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Database Warning</AlertTitle>
                <AlertDescription>
                  {apiError}. You can still manage supplier vehicles locally.
                </AlertDescription>
              </Alert>
            )}

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-400">
                  Supplier Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Track and manage supplier vehicles and deliveries
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  onClick={refreshAllData}
                  disabled={isRefreshing}
                  className="gap-2"
                >
                  {isRefreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handlePrintReport} 
                  className="gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Download PDF Report
                </Button>
                <Button 
                  variant="outline"
                  onClick={exportAllVehiclesToCSV}
                  disabled={vehicles.length === 0 || isExportingCSV}
                  className="gap-2"
                >
                  {isExportingCSV ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Export All CSV ({vehicles.length})
                </Button>
                <Button 
                  variant="default"
                  onClick={() => selectedVehicle && handleCheckIn(selectedVehicle.id)}
                  disabled={!selectedVehicle || !['Pre-registered', 'Checked-out'].includes(selectedVehicle.status)}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCheck className="h-4 w-4" />
                  {selectedVehicle?.status === 'Checked-out' ? 'Re-check In' : 'Check In Selected'}
                </Button>
                <Button 
                  variant="default"
                  onClick={() => selectedVehicle && handleCheckOut(selectedVehicle.id, false)}
                  disabled={!selectedVehicle || selectedVehicle.status !== 'Checked-in'}
                  className="gap-2 bg-amber-600 hover:bg-amber-700"
                >
                  <DoorOpen className="h-4 w-4" />
                  Check Out Now
                </Button>
                <Button 
                  variant="default"
                  onClick={() => selectedVehicle && handleCheckOut(selectedVehicle.id, true)}
                  disabled={!selectedVehicle || selectedVehicle.status !== 'Pending Exit'}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  Verify Exit
                </Button>
                <Dialog open={isRegisterDialogOpen} onOpenChange={handleRegistrationDialogClose}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 bg-primary hover:bg-primary/90">
                      <Truck className="h-4 w-4" />
                      New Supplier Vehicle
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    {!newlyRegisteredVehicle ? (
                      <>
                        <DialogHeader>
                          <DialogTitle className="text-2xl">Register Supplier Vehicle</DialogTitle>
                          <DialogDescription>
                            Register a new supplier vehicle entry at the gate
                          </DialogDescription>
                        </DialogHeader>
                        <CreateSupplierGateForm onSubmit={handleAddVehicle} />
                      </>
                    ) : (
                      <RegistrationSuccess 
                        visitor={newlyRegisteredVehicle}
                        onDone={() => handleRegistrationDialogClose(false)}
                      />
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Selection Info Banner */}
            {selectedVehicle && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-800">
                        Selected Vehicle: {selectedVehicle.driverName} ({selectedVehicle.company})
                      </p>
                      <div className="text-sm text-blue-950">
                        Plate: {selectedVehicle.vehiclePlate} • Type: {selectedVehicle.vehicleType} • Status: 
                        <Badge variant="outline" className={`ml-2 ${selectedVehicle.status === 'Checked-out' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                          selectedVehicle.status === 'Checked-in' ? 'bg-green-50 text-green-700 border-green-200' : 
                          selectedVehicle.status === 'Pending Exit' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                          'bg-red-50 text-red-700 border-red-200'}`}>
                          {selectedVehicle.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedVehicle(null)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Clear Selection
                  </Button>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  {selectedVehicle.status === 'Pre-registered' && (
                    <div className="text-sm text-blue-700">
                      <CheckCheck className="inline h-4 w-4 mr-1" />
                      Ready to check in. Click "Check In Selected" button above.
                    </div>
                  )}
                  {selectedVehicle.status === 'Checked-out' && (
                    <div className="text-sm text-purple-700">
                      <Truck className="inline h-4 w-4 mr-1" />
                      Vehicle has checked out. Can be checked in again. Click "Re-check In" button above.
                    </div>
                  )}
                  {selectedVehicle.status === 'Checked-in' && (
                    <div className="text-sm text-amber-700">
                      <DoorOpen className="inline h-4 w-4 mr-1" />
                      Ready to check out. Click "Check Out Now" button above.
                    </div>
                  )}
                  {selectedVehicle.status === 'Pending Exit' && (
                    <div className="text-sm text-green-700">
                      <CheckCircle className="inline h-4 w-4 mr-1" />
                      Ready to verify exit. Click "Verify Exit" button above.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-gray-500">Total Vehicles</p>
                    <h3 className="text-2xl font-bold mt-1 text-white-900">{vehicles.length}</h3>
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <Truck className="h-4 w-4 mr-1 text-blue-500" />
                      <span>Registered</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-gray-500">On Site</p>
                    <h3 className="text-2xl font-bold mt-1 text-white-900">{vehiclesOnSite}</h3>
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                      <span>Active</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-gray-500">Pre-registered</p>
                    <h3 className="text-2xl font-bold mt-1 text-white-900">{preRegisteredVehicles.length}</h3>
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1 text-amber-500" />
                      <span>Scheduled</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-gray-500">Checked Out</p>
                    <h3 className="text-2xl font-bold mt-1 text-white-900">{checkedOutVehicles.length}</h3>
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <Truck className="h-4 w-4 mr-1 text-purple-500" />
                      <span>Available for re-check in</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Supplier Vehicle Logs</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Total: {vehicles.length}
                    </Badge>
                    <div className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                      CSV Export: {vehicles.length} vehicles
                    </div>
                  </div>
                </div>
                <Separator className="my-4" />
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                      <Gauge className="h-4 w-4" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="active" className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      On Site
                      {vehicles.filter(v => v.status === 'Checked-in').length > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {vehicles.filter(v => v.status === 'Checked-in').length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Pending Exit
                      {pendingExitVehicles.length > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {pendingExitVehicles.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Completed
                      {filteredCompletedVehicles.length > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {filteredCompletedVehicles.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold">All Supplier Vehicles</h3>
                          <p className="text-sm text-gray-500">
                            Complete list of all supplier vehicles in the system
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {filteredVehicles.length} Vehicles
                          </Badge>
                          <div className="text-xs text-gray-500 px-2 py-1 bg-blue-50 rounded">
                            Showing {filteredVehicles.length} of {vehicles.length} records
                          </div>
                        </div>
                      </div>

                      {/* Search Bar */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search suppliers by driver name, company, vehicle plate, phone, or status..."
                          value={searchQuery}
                          onChange={handleSearch}
                          className="pl-10 pr-10"
                        />
                        {searchQuery && (
                          <button
                            onClick={clearSearch}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {searchQuery && filteredVehicles.length === 0 && (
                        <div className="bg-gray-50 p-4 rounded-lg border text-center">
                          <p className="text-gray-600">
                            No supplier vehicles found matching "{searchQuery}"
                          </p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={clearSearch}
                            className="mt-2"
                          >
                            Clear search
                          </Button>
                        </div>
                      )}

                      {searchQuery && filteredVehicles.length > 0 && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <div className="text-sm text-blue-700">
                            <Search className="inline h-4 w-4 mr-1" />
                            Found {filteredVehicles.length} vehicles matching "{searchQuery}"
                          </div>
                        </div>
                      )}

                      {filteredVehicles.length === 0 && vehicles.length === 0 ? (
                        <Card>
                          <CardContent className="p-8 text-center">
                            <Truck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Supplier Vehicles</h3>
                            <p className="text-gray-500 mb-4">
                              No supplier vehicles found in the database.
                            </p>
                            <Button onClick={() => setIsRegisterDialogOpen(true)}>
                              <Truck className="mr-2 h-4 w-4" />
                              Register First Vehicle
                            </Button>
                          </CardContent>
                        </Card>
                      ) : filteredVehicles.length === 0 ? (
                        <Card>
                          <CardContent className="p-8 text-center">
                            <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Matching Vehicles</h3>
                            <p className="text-gray-500 mb-4">
                              No supplier vehicles match your search criteria.
                            </p>
                            <Button 
                              variant="outline" 
                              onClick={clearSearch}
                            >
                              Clear Search
                            </Button>
                          </CardContent>
                        </Card>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="bg-blue-50 border-blue-100">
                              <CardContent className="p-4">
                                <p className="text-sm text-blue-700 font-medium">Showing</p>
                                <p className="text-2xl font-bold text-blue-900">{filteredVehicles.length}</p>
                                <p className="text-xs text-blue-600 mt-1">
                                  of {vehicles.length} total vehicles
                                </p>
                              </CardContent>
                            </Card>
                            <Card className="bg-green-50 border-green-100">
                              <CardContent className="p-4">
                                <p className="text-sm text-green-700 font-medium">Status Breakdown</p>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-xs text-green-700">Checked-in:</span>
                                  <Badge variant="outline" className="text-xs text-green-700 bg-green-100">
                                    {filteredVehicles.filter(v => v.status === 'Checked-in').length}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-xs text-green-700">Pre-registered:</span>
                                  <Badge variant="outline" className="text-xs text-green-700 bg-amber-100">
                                    {filteredVehicles.filter(v => v.status === 'Pre-registered').length}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text- text-green-700">Checked-out:</span>
                                  <Badge variant="outline" className="text- text-green-700 bg-purple-100">
                                    {filteredVehicles.filter(v => v.status === 'Checked-out').length}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                            <Card className="bg-amber-50 border-amber-100">
                              <CardContent className="p-4">
                                <p className="text-sm text-amber-700 font-medium">Search Help</p>
                                <p className="text-xs text-amber-600 mt-1">
                                  Search by: driver name, company, vehicle plate, phone, status, or vehicle type
                                </p>
                                <div className="flex items-center gap-1 mt-2">
                                  <Badge variant="outline" className="text-xs cursor-pointer text-amber-700 hover:bg-amber-100" onClick={() => setSearchQuery('Truck')}>
                                    Probox
                                  </Badge>
                                  <Badge variant="outline" className="text-xs cursor-pointer text-amber-700 hover:bg-amber-100" onClick={() => setSearchQuery('Checked')}>
                                    Checked
                                  </Badge>
                                  <Badge variant="outline" className="text-xs cursor-pointer text-amber-700 hover:bg-amber-100" onClick={() => setSearchQuery('Pending')}>
                                    Pending
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                            <Card className="bg-purple-50 border-purple-100">
                              <CardContent className="p-4">
                                <p className="text-sm text-purple-700 font-medium">Quick Actions</p>
                                <div className="flex flex-col gap-2 mt-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={clearSearch}
                                    className="text-xs"
                                  >
                                    Clear Search
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setSearchQuery('Checked-out')}
                                    className="text-xs"
                                  >
                                    Show Checked-out
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                          
                          <VehicleDataTable 
                            vehicles={filteredVehicles}
                            onCheckIn={handleCheckIn}
                            onCheckOut={handleCheckOut}
                            onRowClick={handleRowClick}
                            selectedVehicleId={selectedVehicle?.id}
                          />
                        </>
                      )}
                    </div>
                  </TabsContent>

                  {/* Active Vehicles Tab */}
                  <TabsContent value="active" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">Vehicles Currently On Site</h3>
                          <p className="text-sm text-gray-500">
                            Supplier vehicles that are checked in and making deliveries
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {vehicles.filter(v => v.status === 'Checked-in').length} Active
                          </Badge>
                          <div className="text-xs text-gray-500 px-2 py-1 bg-green-50 rounded">
                            In Export: {vehicles.filter(v => v.status === 'Checked-in').length} records
                          </div>
                        </div>
                      </div>
                      {vehicles.filter(v => v.status === 'Checked-in').length === 0 ? (
                        <Card>
                          <CardContent className="p-8 text-center">
                            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Active Vehicles</h3>
                            <p className="text-gray-500 mb-4">
                              No supplier vehicles are currently on site.
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        <>
                          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                            <div className="text-sm text-green-700">
                              <CheckCircle className="inline h-4 w-4 mr-1" />
                              {vehicles.filter(v => v.status === 'Checked-in').length} active vehicles will be included in CSV export
                            </div>
                          </div>
                          <VehicleDataTable 
                            vehicles={vehicles.filter(v => v.status === 'Checked-in')}
                            onCheckIn={handleCheckIn}
                            onCheckOut={handleCheckOut}
                            onRowClick={handleRowClick}
                            selectedVehicleId={selectedVehicle?.id}
                          />
                        </>
                      )}
                    </div>
                  </TabsContent>

                  {/* Pending Exit Tab */}
                  <TabsContent value="pending" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">Vehicles Pending Exit</h3>
                          <p className="text-sm text-gray-500">
                            Supplier vehicles awaiting exit verification
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {pendingExitVehicles.length} Pending
                          </Badge>
                          <div className="text-xs text-gray-500 px-2 py-1 bg-amber-50 rounded">
                            In Export: {pendingExitVehicles.length} records
                          </div>
                        </div>
                      </div>
                      {pendingExitVehicles.length === 0 ? (
                        <Card>
                          <CardContent className="p-8 text-center">
                            <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Pending Exits</h3>
                            <p className="text-gray-500 mb-4">
                              No supplier vehicles are pending exit.
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        <>
                          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                            <div className="text-sm text-amber-700">
                              <Clock className="inline h-4 w-4 mr-1" />
                              {pendingExitVehicles.length} pending vehicles will be included in CSV export
                            </div>
                          </div>
                          <VehicleDataTable 
                            vehicles={pendingExitVehicles}
                            onCheckIn={handleCheckIn}
                            onCheckOut={handleCheckOut}
                            onRowClick={handleRowClick}
                            selectedVehicleId={selectedVehicle?.id}
                          />
                        </>
                      )}
                    </div>
                  </TabsContent>

                  {/* Completed Tab */}
                  <TabsContent value="completed" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">Completed Deliveries</h3>
                          <p className="text-sm text-gray-500">
                            Supplier vehicles that have completed their deliveries and checked out
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {filteredCompletedVehicles.length} Completed
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={exportCompletedToCSV}
                            disabled={filteredCompletedVehicles.length === 0 || isExportingCSV}
                            className="gap-2"
                          >
                            {isExportingCSV ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                            CSV ({filteredCompletedVehicles.length})
                          </Button>
                        </div>
                      </div>

                      {/* Date Range Picker for Completed Vehicles */}
                      <Card className="border">
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <div className="flex-1">
                              <Label htmlFor="date-range" className="text-sm font-medium mb-2 block">
                                Filter by Check-out Date
                              </Label>
                              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                                <PopoverTrigger asChild>
                                  <Button
                                    id="date-range"
                                    variant="outline"
                                    className="w-full justify-start text-left font-normal"
                                  >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {historyDateRange.from ? (
                                      historyDateRange.to ? (
                                        <>
                                          {format(historyDateRange.from, "LLL dd, y")} -{" "}
                                          {format(historyDateRange.to, "LLL dd, y")}
                                        </>
                                      ) : (
                                        format(historyDateRange.from, "LLL dd, y")
                                      )
                                    ) : (
                                      <span>Select date range</span>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <CalendarComponent
                                    initialFocus
                                    mode="range"
                                    defaultMonth={historyDateRange.from}
                                    selected={{
                                      from: historyDateRange.from,
                                      to: historyDateRange.to,
                                    }}
                                    onSelect={(range) => {
                                      if (range?.from && range?.to) {
                                        setHistoryDateRange({
                                          from: range.from,
                                          to: range.to,
                                        });
                                        setIsDatePickerOpen(false);
                                      }
                                    }}
                                    numberOfMonths={2}
                                  />
                                </PopoverContent>
                              </Popover>
                              <p className="text-xs text-gray-500 mt-2">
                                Showing {filteredCompletedVehicles.length} vehicles that checked out between {format(historyDateRange.from, 'MMM dd, yyyy')} and {format(historyDateRange.to, 'MMM dd, yyyy')}
                              </p>
                            </div>
                            <div className="flex items-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  const today = new Date();
                                  setHistoryDateRange({
                                    from: new Date(today.getFullYear(), today.getMonth(), 1),
                                    to: today
                                  });
                                }}
                              >
                                This Month
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  const today = new Date();
                                  setHistoryDateRange({
                                    from: new Date(today.setDate(today.getDate() - 7)),
                                    to: new Date()
                                  });
                                }}
                              >
                                Last 7 Days
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  const today = new Date();
                                  setHistoryDateRange({
                                    from: today,
                                    to: today
                                  });
                                }}
                              >
                                Today
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {filteredCompletedVehicles.length === 0 ? (
                        <Card>
                          <CardContent className="p-8 text-center">
                            <CheckCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Completed Deliveries</h3>
                            <p className="text-gray-500 mb-4">
                              No completed deliveries found for the selected date range.
                            </p>
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                const today = new Date();
                                setHistoryDateRange({
                                  from: new Date(today.getFullYear(), 0, 1),
                                  to: today
                                });
                              }}
                            >
                              Show All Completed Deliveries
                            </Button>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card className="bg-blue-50 border-blue-100">
                              <CardContent className="p-4">
                                <p className="text-sm text-blue-700 font-medium">Total Records</p>
                                <p className="text-2xl font-bold text-blue-900">{filteredCompletedVehicles.length}</p>
                                <p className="text-xs text-blue-600 mt-1">
                                  Will be exported to CSV
                                </p>
                              </CardContent>
                            </Card>
                            <Card className="bg-green-50 border-green-100">
                              <CardContent className="p-4">
                                <p className="text-sm text-green-700 font-medium">Date Range</p>
                                <p className="text-lg font-bold text-green-900">
                                  {format(historyDateRange.from, 'MMM dd')} - {format(historyDateRange.to, 'MMM dd')}
                                </p>
                                <p className="text-xs text-green-600 mt-1">
                                  Filter applied
                                </p>
                              </CardContent>
                            </Card>
                            <Card className="bg-amber-50 border-amber-100">
                              <CardContent className="p-4">
                                <p className="text-sm text-amber-700 font-medium">Earliest Check-out</p>
                                <p className="text-lg font-bold text-amber-900">
                                  {filteredCompletedVehicles.length > 0 
                                    ? format(parseISO(filteredCompletedVehicles[filteredCompletedVehicles.length - 1].checkOutTime || ''), 'MMM dd')
                                    : 'N/A'
                                  }
                                </p>
                                <p className="text-xs text-amber-600 mt-1">
                                  First completion
                                </p>
                              </CardContent>
                            </Card>
                            <Card className="bg-purple-50 border-purple-100">
                              <CardContent className="p-4">
                                <p className="text-sm text-purple-700 font-medium">Latest Check-out</p>
                                <p className="text-lg font-bold text-purple-900">
                                  {filteredCompletedVehicles.length > 0 
                                    ? format(parseISO(filteredCompletedVehicles[0].checkOutTime || ''), 'MMM dd')
                                    : 'N/A'
                                  }
                                </p>
                                <p className="text-xs text-purple-600 mt-1">
                                  Most recent
                                </p>
                              </CardContent>
                            </Card>
                          </div>

                          <VehicleDataTable 
                            vehicles={filteredCompletedVehicles}
                            onCheckIn={handleCheckIn}
                            onCheckOut={handleCheckOut}
                            onRowClick={handleRowClick}
                            selectedVehicleId={selectedVehicle?.id}
                          />
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardHeader>
            </Card>

            {/* Gate Pass Dialog */}
            {selectedVehicle && (
              <GatePassDialog 
                isOpen={isGatePassOpen} 
                onOpenChange={setIsGatePassOpen} 
                visitor={selectedVehicle} 
              />
            )}
          </main>
        </SidebarInset>
      </SidebarProvider>
      
      {/* Hidden printable report */}
      <div className="hidden">
        <div ref={printRef}>
          <PrintableVehicleReport visitors={vehicles} shipments={[]} />
        </div>
      </div>
    </>
  );
}