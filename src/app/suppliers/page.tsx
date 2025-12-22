'use client';

import { useState, useEffect } from 'react';
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
import type { Supplier, SupplierFormValues } from '@/lib/data';
import { SupplierDataTable } from '@/components/dashboard/supplier-data-table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CreateSupplierForm } from '@/components/dashboard/create-supplier-form';
import { PlusCircle, Grape, FileText, Download, Calendar, FileDown } from 'lucide-react';
import { OverviewCard } from '@/components/dashboard/overview-card';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface DatabaseSupplier {
  id: string;
  name: string;
  location: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  produce_types: string;
  status: string;
  logo_url: string;
  active_contracts: number;
  supplier_code: string;
  kra_pin: string;
  vehicle_number_plate: string;
  driver_name: string;
  driver_id_number: string;
  mpesa_paybill: string;
  mpesa_account_number: string;
  bank_name: string;
  bank_account_number: string;
  password: string;
  created_at: string;
}

// Define date range type
interface DateRange {
  from: Date;
  to: Date;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const { toast } = useToast();

  // Fetch suppliers from database with date filtering
  const fetchSuppliers = async (startDate?: Date, endDate?: Date) => {
    try {
      setIsLoading(true);
      
      let url = '/api/suppliers';
      const params = new URLSearchParams();
      
      const fromDate = startDate || dateRange.from;
      const toDate = endDate || dateRange.to;
      
      params.append('startDate', format(fromDate, 'yyyy-MM-dd'));
      params.append('endDate', format(toDate, 'yyyy-MM-dd'));
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data: DatabaseSupplier[] = await response.json();
        const convertedSuppliers: Supplier[] = data.map(supplier => ({
          id: supplier.id,
          name: supplier.name,
          location: supplier.location,
          contactName: supplier.contact_name,
          contactEmail: supplier.contact_email,
          contactPhone: supplier.contact_phone,
          produceTypes: supplier.produce_types 
            ? (typeof supplier.produce_types === 'string' 
                ? JSON.parse(supplier.produce_types)
                : supplier.produce_types)
            : [],
          status: supplier.status as 'Active' | 'Inactive' | 'Onboarding',
          logoUrl: supplier.logo_url,
          activeContracts: supplier.active_contracts,
          supplierCode: supplier.supplier_code,
          kraPin: supplier.kra_pin,
          vehicleNumberPlate: supplier.vehicle_number_plate,
          driverName: supplier.driver_name,
          driverIdNumber: supplier.driver_id_number,
          mpesaPaybill: supplier.mpesa_paybill,
          mpesaAccountNumber: supplier.mpesa_account_number,
          bankName: supplier.bank_name,
          bankAccountNumber: supplier.bank_account_number,
          createdAt: supplier.created_at,
        }));
        setSuppliers(convertedSuppliers);
      } else {
        throw new Error('Failed to fetch suppliers');
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load suppliers',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and fetch when date range changes
  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      fetchSuppliers(dateRange.from, dateRange.to);
    }
  }, [dateRange]);

  const isEditDialogOpen = !!editingSupplier;

  // Get existing supplier codes for sequential generation
  const existingSupplierCodes = suppliers.map(s => s.supplierCode);

  // Filter suppliers by date range (now done by API)
  const filteredSuppliers = suppliers;

  // Handle download report using the unified API
  const handleDownloadReport = async (formatType: 'csv' | 'pdf') => {
    if (suppliers.length === 0) {
      toast({
        title: 'No Data',
        description: 'No suppliers found for the selected date range.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsGeneratingReport(true);
      
      // Build URL with date range and format
      const params = new URLSearchParams({
        startDate: format(dateRange.from, 'yyyy-MM-dd'),
        endDate: format(dateRange.to, 'yyyy-MM-dd'),
        format: formatType
      });
      
      const url = `/api/suppliers?${params.toString()}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to generate ${formatType.toUpperCase()} report`);
      }
      
      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `suppliers_report_${format(dateRange.from, 'yyyy-MM-dd')}_to_${format(dateRange.to, 'yyyy-MM-dd')}.${formatType}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // Get blob based on content type
      let blob;
      if (formatType === 'pdf') {
        blob = await response.blob();
      } else {
        const text = await response.text();
        blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
      }
      
      // Download the file
      const urlObj = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlObj;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(urlObj);
      
      toast({
        title: 'Report Downloaded',
        description: `${formatType.toUpperCase()} report has been downloaded successfully.`,
      });
    } catch (error: any) {
      console.error(`Error downloading ${formatType} report:`, error);
      toast({
        title: 'Error',
        description: error.message || `Failed to download ${formatType.toUpperCase()} report`,
        variant: 'destructive',
      });
      
      // Fallback to client-side CSV generation
      if (formatType === 'csv' && suppliers.length > 0) {
        generateClientSideCSV();
      }
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Fallback client-side CSV generation
  const generateClientSideCSV = () => {
    const headers = [
      'Supplier Code',
      'Supplier Name',
      'Location',
      'Phone Number',
      'Email Number'
    ];

    const csvData = suppliers.map(supplier => [
      supplier.supplierCode || 'N/A',
      supplier.name || 'N/A',
      supplier.location || 'N/A',
      supplier.contactPhone || 'N/A',
      supplier.contactEmail || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `suppliers_report_${format(dateRange.from, 'yyyy-MM-dd')}_to_${format(dateRange.to, 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle date range change
  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
  };

  // Rest of your existing functions (handleAddSupplier, handleUpdateSupplier, etc.)
  const handleAddSupplier = async (values: SupplierFormValues) => {
    try {
      console.log('🔄 Sending POST request to /api/suppliers with:', values);
      
      const apiData = {
        name: values.name || '',
        location: values.location || '',
        contact_name: values.contactName || '',
        contact_email: values.contactEmail || '',
        contact_phone: values.contactPhone || '',
        produce_types: values.produceTypes || [],
        status: 'Active',
        supplier_code: values.supplierCode || '',
        kra_pin: values.kraPin || '',
        bank_name: values.bankName || '',
        bank_account_number: values.bankAccountNumber || '',
        mpesa_paybill: values.mpesaName || '',
        mpesa_account_number: values.mpesaNumber || '',
        vehicle_number_plate: '',
        driver_name: '',
        driver_id_number: '',
        password: '',
        logo_url: '',
        active_contracts: 0,
      };

      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      const responseData = await response.json();
      console.log('📥 API Response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || 'Failed to create supplier');
      }

      await fetchSuppliers();

      toast({
        title: 'Supplier Created',
        description: `${values.name} has been successfully added.`,
      });
      
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      console.error('❌ Error creating supplier:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create supplier',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateSupplier = async (values: SupplierFormValues) => {
    if (!editingSupplier) return;
    
    try {
      console.log('🔄 Sending PUT request to /api/suppliers with:', values);
      
      const apiData = {
        name: values.name || '',
        location: values.location || '',
        contact_name: values.contactName || '',
        contact_email: editingSupplier.contactEmail || '',
        contact_phone: values.contactPhone || '',
        produce_types: values.produceTypes || [],
        status: 'Active',
        supplier_code: values.supplierCode || '',
        kra_pin: values.kraPin || '',
        bank_name: values.bankName || '',
        bank_account_number: values.bankAccountNumber || '',
        mpesa_paybill: values.mpesaName || '',
        mpesa_account_number: values.mpesaNumber || '',
        vehicle_number_plate: editingSupplier.vehicleNumberPlate || '',
        driver_name: editingSupplier.driverName || '',
        driver_id_number: editingSupplier.driverIdNumber || '',
      };

      const response = await fetch(`/api/suppliers?id=${editingSupplier.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      const responseData = await response.json();
      console.log('📥 API Response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || 'Failed to update supplier');
      }

      await fetchSuppliers();

      toast({
        title: 'Supplier Updated',
        description: `${values.name} has been successfully updated.`,
      });
      
      setEditingSupplier(null);
    } catch (error: any) {
      console.error('❌ Error updating supplier:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update supplier',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier);
  };

  const closeEditDialog = () => {
    setEditingSupplier(null);
  };
  
  const totalSuppliers = suppliers.length;
  const activeContracts = suppliers.reduce((acc, s) => acc + s.activeContracts, 0);

  const kpiData = {
    totalSuppliers: {
      title: 'Total Suppliers',
      value: String(totalSuppliers),
      change: 'in the system',
      changeType: 'increase' as const,
    },
    activeContracts: {
      title: 'Active Contracts',
      value: String(activeContracts),
      change: 'across all suppliers',
      changeType: 'increase' as const,
    },
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
          <Header />
          <main className="p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Supplier Management
                </h2>
                <p className="text-muted-foreground">
                  Loading suppliers...
                </p>
              </div>
              <Button disabled>
                <PlusCircle className="mr-2" />
                Add Supplier
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
              <div className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
            </div>
            <div className="h-64 bg-gray-200 animate-pulse rounded-lg"></div>
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
        <main className="p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Supplier Management
              </h2>
              <p className="text-muted-foreground">
                View, add, and manage your fresh produce suppliers.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Date Range Picker */}
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="ml-auto">
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'dd/MM/yy')} - {format(dateRange.to, 'dd/MM/yy')}
                        </>
                      ) : (
                        format(dateRange.from, 'dd/MM/yy')
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        handleDateRangeChange({ from: range.from, to: range.to });
                        setIsDatePickerOpen(false);
                      }
                    }}
                    numberOfMonths={2}
                  />
                  <div className="p-3 border-t">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newRange = {
                            from: subDays(new Date(), 7),
                            to: new Date(),
                          };
                          handleDateRangeChange(newRange);
                          setIsDatePickerOpen(false);
                        }}
                      >
                        Last 7 days
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newRange = {
                            from: subDays(new Date(), 30),
                            to: new Date(),
                          };
                          handleDateRangeChange(newRange);
                          setIsDatePickerOpen(false);
                        }}
                      >
                        Last 30 days
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Download Report Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={isGeneratingReport}>
                    {isGeneratingReport ? (
                      <>
                        <span className="mr-2">Generating...</span>
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Download Report
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleDownloadReport('csv')}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Download as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownloadReport('pdf')}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Download as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Add Supplier Button */}
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2" />
                    Add Supplier
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Create New Supplier</DialogTitle>
                    <DialogDescription>
                      Fill in the details below to add a new supplier.
                    </DialogDescription>
                  </DialogHeader>
                  <CreateSupplierForm 
                    onSubmit={handleAddSupplier}
                    existingSupplierCodes={existingSupplierCodes}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Report Summary */}
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">Report Summary</h3>
                <p className="text-sm text-muted-foreground">
                  Showing suppliers registered from {format(dateRange.from, 'dd/MM/yyyy')} to {format(dateRange.to, 'dd/MM/yyyy')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {suppliers.length} supplier(s) found
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm">
                  Active: {suppliers.filter(s => s.status === 'Active').length}
                </p>
                <p className="text-sm">
                  Total Contracts: {suppliers.reduce((acc, s) => acc + (s.activeContracts || 0), 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Link href="/suppliers" className="block transition-transform hover:scale-[1.02]">
              <OverviewCard data={kpiData.totalSuppliers} icon={Grape} />
            </Link>
          </div>

          <SupplierDataTable suppliers={suppliers} onEditSupplier={openEditDialog} />
        </main>
      </SidebarInset>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
            <DialogDescription>
              Update the details for {editingSupplier?.name}.
            </DialogDescription>
          </DialogHeader>
          <CreateSupplierForm
            supplier={editingSupplier}
            onSubmit={handleUpdateSupplier}
            existingSupplierCodes={existingSupplierCodes}
          />
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}