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
import { VisitorDataTable } from '@/components/dashboard/visitor-data-table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CreateVisitorForm, type VisitorFormValues } from '@/components/dashboard/create-visitor-form';
import { User, QrCode, Printer, DoorOpen, Loader2, RefreshCw, CheckCircle, Clock, Calendar, CheckCheck, Users, Download, ChevronDown, ChevronUp, FileSpreadsheet } from 'lucide-react';
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
import { GatePassDialog } from '@/components/dashboard/gate-pass-dialog';
import { VisitorDetailDialog } from '@/components/dashboard/visitor-detail-dialog';
import { PrintableVehicleReport } from '@/components/dashboard/printable-vehicle-report';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Visitor type
interface Visitor {
  id: string;
  visitorCode: string;
  name: string;
  idNumber: string;
  phone: string;
  vehiclePlate: string;
  visitorType: 'visitor';
  status: 'Pre-registered' | 'Checked-in' | 'Pending Exit' | 'Checked-out';
  checkInTime?: string;
  checkOutTime?: string;
  expectedCheckInTime: string;
  hostId: string;
  hostName: string;
  department: string;
  purpose?: string;
}

type DateRange = {
  from: Date;
  to: Date;
};

export default function VisitorManagementPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [isGatePassOpen, setIsGatePassOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [newlyRegisteredVisitor, setNewlyRegisteredVisitor] = useState<Visitor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('preregistered');
  const [apiError, setApiError] = useState<string | null>(null);
  const [historyDateRange, setHistoryDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch visitors from database
  useEffect(() => {
    fetchVisitors();
  }, []);

  const fetchVisitors = async () => {
    try {
      setIsLoading(true);
      setApiError(null);
      
      const response = await fetch('/api/visitors');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch visitors: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Convert API data to frontend Visitor type
      const convertedVisitors: Visitor[] = data.map((visitor: any) => ({
        id: visitor.id,
        visitorCode: visitor.visitor_code || `VIS-${visitor.id}`,
        name: visitor.name || '',
        idNumber: visitor.id_number || '',
        phone: visitor.phone || '',
        vehiclePlate: visitor.vehicle_plate || '',
        visitorType: 'visitor',
        status: (visitor.status || 'Pre-registered') as Visitor['status'],
        checkInTime: visitor.check_in_time,
        checkOutTime: visitor.check_out_time,
        expectedCheckInTime: visitor.expected_check_in_time || visitor.date || new Date().toISOString(),
        hostId: visitor.host_id || '',
        hostName: visitor.host_name || 'Database Host',
        department: visitor.department || '',
        purpose: visitor.purpose || '',
      }));
      
      setVisitors(convertedVisitors);
      
    } catch (error: any) {
      console.error('Error fetching visitors:', error);
      setApiError(error.message || 'Could not connect to database');
      
      toast({
        title: 'Database Warning',
        description: 'Could not load visitor data from database.',
        variant: 'destructive',
      });
      
      setVisitors([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAllData = async () => {
    setIsRefreshing(true);
    setApiError(null);
    try {
      await fetchVisitors();
      toast({
        title: 'Data Refreshed',
        description: 'Latest visitor data has been loaded.',
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

  const handleAddVisitor = async (values: VisitorFormValues) => {
    try {
      const visitorData = {
        name: values.visitorName,
        id_number: values.idNumber,
        phone: values.phoneNumber,
        vehicle_plate: values.vehicleRegNo || '',
        email: values.email || '',
        company: values.company || '',
        visitor_type: 'visitor',
        status: 'Pre-registered',
        expected_check_in_time: `${values.date}T${values.signInTime}:00`,
        department: values.department,
        purpose: values.purpose || '',
      };

      console.log('📤 Sending to API:', visitorData);

      const response = await fetch('/api/visitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(visitorData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API error response:', errorData);
        throw new Error(errorData.error || 'Failed to create visitor');
      }

      const savedVisitor = await response.json();
      console.log('✅ API success response:', savedVisitor);
      
      const newVisitor: Visitor = {
        id: savedVisitor.id,
        visitorCode: savedVisitor.visitor_code || `VIS-${savedVisitor.id}`,
        name: savedVisitor.name,
        idNumber: savedVisitor.id_number || '',
        phone: savedVisitor.phone || '',
        vehiclePlate: savedVisitor.vehicle_plate || '',
        visitorType: savedVisitor.visitor_type || 'visitor',
        status: savedVisitor.status,
        checkInTime: savedVisitor.check_in_time,
        checkOutTime: savedVisitor.check_out_time,
        expectedCheckInTime: savedVisitor.expected_check_in_time || savedVisitor.created_at || new Date().toISOString(),
        hostId: savedVisitor.host_id || '',
        hostName: savedVisitor.host_name || 'Database Host',
        department: savedVisitor.department || '',
        purpose: savedVisitor.purpose || '',
      };
      
      setVisitors(prev => [newVisitor, ...prev]);
      setNewlyRegisteredVisitor(newVisitor);
      
      toast({
        title: 'Visitor Registered',
        description: `${newVisitor.name} has been successfully registered.`,
      });
      
    } catch (error: any) {
      console.error('❌ Error registering visitor:', error);
      
      toast({
        title: 'Registration Failed',
        description: error.message || 'Failed to register visitor',
        variant: 'destructive',
      });
    }
  };

  const handleRegistrationDialogClose = (open: boolean) => {
    if (!open) {
      setNewlyRegisteredVisitor(null);
    }
    setIsRegisterDialogOpen(open);
  };

  const handleCheckIn = async (visitorId?: string) => {
    const visitorIdToCheckIn = visitorId || selectedVisitor?.id;
    
    if (!visitorIdToCheckIn) {
      toast({
        title: 'No Visitor Selected',
        description: 'Please select a visitor to check in.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const visitor = visitors.find(v => v.id === visitorIdToCheckIn);
      if (!visitor) return;

      // Don't allow checking in non-pre-registered visitors
      if (visitor.status !== 'Pre-registered') {
        toast({
          title: 'Cannot Check In',
          description: `Visitor ${visitor.name} is already ${visitor.status.toLowerCase()}.`,
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch(`/api/visitors?id=${visitorIdToCheckIn}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'Checked-in',
          check_in_time: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to check in visitor');
      }

      const updatedVisitorData = await response.json();
      const updatedVisitor: Visitor = {
        ...visitor,
        status: 'Checked-in',
        checkInTime: updatedVisitorData.check_in_time,
      };

      setVisitors(prev => prev.map(v => v.id === visitorIdToCheckIn ? updatedVisitor : v));
      
      // Clear selection after successful check-in
      setSelectedVisitor(null);
      
      toast({
        title: "Visitor Checked In",
        description: `${visitor.name} has been successfully checked in.`,
      });

      setSelectedVisitor(updatedVisitor);
      setIsGatePassOpen(true);
      
    } catch (error: any) {
      console.error('Error checking in visitor:', error);
      toast({
        title: 'Check-in Failed',
        description: error.message || 'Failed to check in visitor',
        variant: 'destructive',
      });
    }
  };

  const handleCheckOut = async (visitorId: string, final: boolean = false) => {
    try {
      const visitor = visitors.find(v => v.id === visitorId);
      if (!visitor) return;

      if (final) {
        const response = await fetch(`/api/visitors?id=${visitorId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'Checked-out',
            check_out_time: new Date().toISOString(),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to check out visitor');
        }

        const updatedVisitorData = await response.json();
        const updatedVisitor = { 
          ...visitor, 
          status: 'Checked-out', 
          checkOutTime: updatedVisitorData.check_out_time,
        };

        setSelectedVisitor(updatedVisitor);
        setVisitors(prev => prev.map(v => v.id === visitorId ? updatedVisitor : v));
        
        toast({
          title: "Visitor Verified for Exit",
          description: `${visitor.name} has been successfully checked out.`,
        });
      } else {
        const response = await fetch(`/api/visitors?id=${visitorId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'Pending Exit',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to initiate checkout');
        }

        const updatedVisitorData = await response.json();
        const updatedVisitor = { 
          ...visitor, 
          status: 'Pending Exit',
        };

        setSelectedVisitor(updatedVisitor);
        setVisitors(prev => prev.map(v => v.id === visitorId ? updatedVisitor : v));
        
        toast({
          title: "Checkout Initiated",
          description: `${visitor.name} is now pending exit.`,
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

  const handleRowClick = (visitor: Visitor) => {
    setSelectedVisitor(visitor);
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
        pdf.save(`visitor-report-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`);
        
        toast({
          title: 'Report Generated',
          description: 'Visitor report has been downloaded as PDF.',
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

  // Calculate filtered history visitors based on date range
  const historyVisitors = visitors.filter(v => v.status === 'Checked-out');
  
  const filteredHistoryVisitors = historyVisitors.filter(visitor => {
    if (!visitor.checkOutTime) return false;
    const checkOutDate = parseISO(visitor.checkOutTime);
    return isWithinInterval(checkOutDate, {
      start: startOfDay(historyDateRange.from),
      end: endOfDay(historyDateRange.to)
    });
  });

  // Calculate statistics
  const visitorsOnSite = visitors.filter(v => 
    (v.status === 'Checked-in' || v.status === 'Pending Exit')
  ).length;

  const pendingExitVisitors = visitors.filter(v => v.status === 'Pending Exit');
  const preRegisteredVisitors = visitors.filter(v => v.status === 'Pre-registered');
  const currentVisitors = visitors.filter(v => v.status === 'Checked-in' || v.status === 'Pending Exit');

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

  // Export filtered history to CSV
  const exportHistoryToCSV = async () => {
    if (filteredHistoryVisitors.length === 0) {
      toast({
        title: 'No Data',
        description: 'No visitor history found for the selected date range.',
        variant: 'destructive',
      });
      return;
    }

    setIsExportingCSV(true);
    try {
      // Prepare data for CSV
      const headers = [
        'Visitor ID',
        'Name',
        'ID Number',
        'Phone',
        'Vehicle Plate',
        'Department',
        'Purpose',
        'Check-in Time',
        'Check-out Time',
        'Status',
        'Expected Check-in Time',
        'Visitor Type'
      ];
      
      const data = filteredHistoryVisitors.map(visitor => ({
        'Visitor ID': visitor.visitorCode,
        'Name': visitor.name,
        'ID Number': visitor.idNumber,
        'Phone': visitor.phone,
        'Vehicle Plate': visitor.vehiclePlate || 'None',
        'Department': visitor.department,
        'Purpose': visitor.purpose || '',
        'Check-in Time': visitor.checkInTime ? format(parseISO(visitor.checkInTime), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
        'Check-out Time': visitor.checkOutTime ? format(parseISO(visitor.checkOutTime), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
        'Status': visitor.status,
        'Expected Check-in Time': visitor.expectedCheckInTime ? format(parseISO(visitor.expectedCheckInTime), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
        'Visitor Type': visitor.visitorType
      }));

      const csvContent = convertToCsv(data, headers);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      const filename = `visitor_history_${format(historyDateRange.from, 'yyyy-MM-dd')}_to_${format(historyDateRange.to, 'yyyy-MM-dd')}.csv`;
      
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'CSV Export Complete',
        description: `Visitor history (${filteredHistoryVisitors.length} records) has been downloaded.`,
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

  // Export all visitors to CSV (for Reports page integration)
  const exportAllVisitorsToCSV = async () => {
    if (visitors.length === 0) {
      toast({
        title: 'No Data',
        description: 'No visitors found to export.',
        variant: 'destructive',
      });
      return;
    }

    setIsExportingCSV(true);
    try {
      const headers = [
        'Visitor ID',
        'Name',
        'ID Number',
        'Phone',
        'Vehicle Plate',
        'Status',
        'Check-in Time',
        'Check-out Time',
        'Expected Check-in Time',
        'Department',
        'Purpose',
        'Visitor Type',
        'Host Name'
      ];
      
      const data = visitors.map(visitor => ({
        'Visitor ID': visitor.visitorCode,
        'Name': visitor.name,
        'ID Number': visitor.idNumber,
        'Phone': visitor.phone,
        'Vehicle Plate': visitor.vehiclePlate || 'None',
        'Status': visitor.status,
        'Check-in Time': visitor.checkInTime ? format(parseISO(visitor.checkInTime), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
        'Check-out Time': visitor.checkOutTime ? format(parseISO(visitor.checkOutTime), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
        'Expected Check-in Time': visitor.expectedCheckInTime ? format(parseISO(visitor.expectedCheckInTime), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
        'Department': visitor.department,
        'Purpose': visitor.purpose || '',
        'Visitor Type': visitor.visitorType,
        'Host Name': visitor.hostName
      }));

      const csvContent = convertToCsv(data, headers);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      const filename = `all_visitors_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'CSV Export Complete',
        description: `All visitors (${visitors.length} records) have been downloaded.`,
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
                  Visitor Management
                </h2>
                <p className="text-muted-foreground">
                  Loading visitor data...
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
                <AlertTitle>Database Warning</AlertTitle>
                <AlertDescription>
                  {apiError}. You can still manage visitors locally.
                </AlertDescription>
              </Alert>
            )}

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-400">
                  Visitor Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Track and manage all visitor entries and exits in real-time
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
                  onClick={exportAllVisitorsToCSV}
                  disabled={visitors.length === 0 || isExportingCSV}
                  className="gap-2"
                >
                  {isExportingCSV ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Export All Visitors CSV
                </Button>
                <Button 
                  variant="default"
                  onClick={() => handleCheckIn(selectedVisitor?.id)}
                  disabled={!selectedVisitor || selectedVisitor.status !== 'Pre-registered'}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCheck className="h-4 w-4" />
                  Check In Visitor
                </Button>
                <Button 
                  variant="default"
                  onClick={() => selectedVisitor && handleCheckOut(selectedVisitor.id, false)}
                  disabled={!selectedVisitor || selectedVisitor.status !== 'Checked-in'}
                  className="gap-2 bg-amber-600 hover:bg-amber-700"
                >
                  <DoorOpen className="h-4 w-4" />
                  Check Out Now
                </Button>
                <Button 
                  variant="default"
                  onClick={() => selectedVisitor && handleCheckOut(selectedVisitor.id, true)}
                  disabled={!selectedVisitor || selectedVisitor.status !== 'Pending Exit'}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  Verify Exit
                </Button>
                <Dialog open={isRegisterDialogOpen} onOpenChange={handleRegistrationDialogClose}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 bg-primary hover:bg-primary/90">
                      <User className="h-4 w-4" />
                      Register Visitor
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    {!newlyRegisteredVisitor ? (
                      <>
                        <DialogHeader>
                          <DialogTitle className="text-2xl">Register New Visitor</DialogTitle>
                          <DialogDescription>
                            Enter visitor details to register them in the system
                          </DialogDescription>
                        </DialogHeader>
                        <CreateVisitorForm onSubmit={handleAddVisitor} />
                      </>
                    ) : (
                      <RegistrationSuccess 
                        visitor={newlyRegisteredVisitor}
                        onDone={() => handleRegistrationDialogClose(false)}
                      />
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Selection Info Banner */}
            {selectedVisitor && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-800">
                        Selected Visitor: {selectedVisitor.name}
                      </p>
                      <div className="text-sm text-blue-950">
                        ID: {selectedVisitor.idNumber} • Vehicle: {selectedVisitor.vehiclePlate || 'None'} • Status: 
                        <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-200">
                          {selectedVisitor.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedVisitor(null)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Clear Selection
                  </Button>
                </div>
                {selectedVisitor.status === 'Pre-registered' && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="text-sm text-blue-700">
                      <CheckCheck className="inline h-4 w-4 mr-1" />
                      Ready to check in. Click "Check In Visitor" button above.
                    </div>
                  </div>
                )}
                {selectedVisitor.status === 'Checked-in' && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="text-sm text-amber-700">
                      <DoorOpen className="inline h-4 w-4 mr-1" />
                      Ready to check out. Click "Check Out Now" button above.
                    </div>
                  </div>
                )}
                {selectedVisitor.status === 'Pending Exit' && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="text-sm text-green-700">
                      <CheckCircle className="inline h-4 w-4 mr-1" />
                      Ready to verify exit. Click "Verify Exit" button above.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Stats Cards - Clean Design like Vehicle Management */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Visitors On Site</p>
                      <h3 className="text-3xl font-bold mt-2 text-white-900">{visitorsOnSite}</h3>
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                        <span>Currently checked in</span>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-full">
                      <Users className="h-8 w-8 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Pending Exit</p>
                      <h3 className="text-3xl font-bold mt-2 text-white-900">{pendingExitVisitors.length}</h3>
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <DoorOpen className="h-4 w-4 mr-1 text-amber-500" />
                        <span>Awaiting verification</span>
                      </div>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-full">
                      <DoorOpen className="h-8 w-8 text-amber-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Pre-registered</p>
                      <h3 className="text-3xl font-bold mt-2 text-white-900">{preRegisteredVisitors.length}</h3>
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1 text-green-500" />
                        <span>Scheduled for today</span>
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-full">
                      <Calendar className="h-8 w-8 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs - Clean Design */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Visitor Logs</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Total: {visitors.length}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Today: {visitors.filter(v => 
                        new Date(v.expectedCheckInTime).toDateString() === new Date().toDateString()
                      ).length}
                    </Badge>
                  </div>
                </div>
                <Separator className="my-4" />
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="current" className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Currently On Site
                      {currentVisitors.length > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {currentVisitors.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="preregistered" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Pre-registered
                      {preRegisteredVisitors.length > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {preRegisteredVisitors.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      History
                      {filteredHistoryVisitors.length > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {filteredHistoryVisitors.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="current" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">Currently On Site</h3>
                          <p className="text-sm text-gray-500">
                            Visitors who are currently checked in or pending exit
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Count: {currentVisitors.length}
                          </Badge>
                        </div>
                      </div>
                      {currentVisitors.length === 0 ? (
                        <Card>
                          <CardContent className="p-8 text-center">
                            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Visitors On Site</h3>
                            <p className="text-gray-500 mb-4">
                              There are no visitors currently on site.
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        <VisitorDataTable 
                          visitors={currentVisitors} 
                          selectedVisitorId={selectedVisitor?.id}
                          onCheckOut={handleCheckOut}
                          onRowClick={handleRowClick} 
                        />
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="preregistered" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">Pre-registered Visitors</h3>
                          <p className="text-sm text-gray-500">
                            Visitors scheduled to arrive today - Click to select, then check in
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Count: {preRegisteredVisitors.length}
                          </Badge>
                        </div>
                      </div>
                      {preRegisteredVisitors.length === 0 ? (
                        <Card>
                          <CardContent className="p-8 text-center">
                            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Pre-registered Visitors</h3>
                            <p className="text-gray-500 mb-4">
                              No visitors are pre-registered for today.
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-4">
                          <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Click on a visitor to select them, then use the action buttons above.
                            </div>
                          </div>
                          <VisitorDataTable 
                            visitors={preRegisteredVisitors} 
                            selectedVisitorId={selectedVisitor?.id}
                            onRowClick={handleRowClick} 
                          />
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="history" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">Visitor History</h3>
                          <p className="text-sm text-gray-500">
                            Complete history of all visitor entries and exits
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {filteredHistoryVisitors.length} Records
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={exportHistoryToCSV}
                            disabled={filteredHistoryVisitors.length === 0 || isExportingCSV}
                            className="gap-2"
                          >
                            {isExportingCSV ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                            Export CSV
                          </Button>
                        </div>
                      </div>

                      {/* Date Range Picker for History */}
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
                                Showing visitors who checked out between {format(historyDateRange.from, 'MMM dd, yyyy')} and {format(historyDateRange.to, 'MMM dd, yyyy')}
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

                      {filteredHistoryVisitors.length === 0 ? (
                        <Card>
                          <CardContent className="p-8 text-center">
                            <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Visitor History</h3>
                            <p className="text-gray-500 mb-4">
                              No visitor history found for the selected date range.
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
                              Show All History
                            </Button>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card className="bg-blue-50 border-blue-100">
                              <CardContent className="p-4">
                                <p className="text-sm text-blue-700 font-medium">Total Records</p>
                                <p className="text-2xl font-bold text-blue-900">{filteredHistoryVisitors.length}</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-green-50 border-green-100">
                              <CardContent className="p-4">
                                <p className="text-sm text-green-700 font-medium">Date Range</p>
                                <p className="text-lg font-bold text-green-900">
                                  {format(historyDateRange.from, 'MMM dd')} - {format(historyDateRange.to, 'MMM dd')}
                                </p>
                              </CardContent>
                            </Card>
                            <Card className="bg-amber-50 border-amber-100">
                              <CardContent className="p-4">
                                <p className="text-sm text-amber-700 font-medium">Earliest Check-out</p>
                                <p className="text-lg font-bold text-amber-900">
                                  {filteredHistoryVisitors.length > 0 
                                    ? format(parseISO(filteredHistoryVisitors[filteredHistoryVisitors.length - 1].checkOutTime || ''), 'MMM dd')
                                    : 'N/A'
                                  }
                                </p>
                              </CardContent>
                            </Card>
                            <Card className="bg-purple-50 border-purple-100">
                              <CardContent className="p-4">
                                <p className="text-sm text-purple-700 font-medium">Latest Check-out</p>
                                <p className="text-lg font-bold text-purple-900">
                                  {filteredHistoryVisitors.length > 0 
                                    ? format(parseISO(filteredHistoryVisitors[0].checkOutTime || ''), 'MMM dd')
                                    : 'N/A'
                                  }
                                </p>
                              </CardContent>
                            </Card>
                          </div>
                          <VisitorDataTable 
                            visitors={filteredHistoryVisitors} 
                            selectedVisitorId={selectedVisitor?.id}
                            onRowClick={handleRowClick} 
                          />
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardHeader>
            </Card>

            {/* Dialogs */}
            <GatePassDialog 
              isOpen={isGatePassOpen} 
              onOpenChange={setIsGatePassOpen} 
              visitor={selectedVisitor} 
            />

            {selectedVisitor && (
              <VisitorDetailDialog
                isOpen={isDetailDialogOpen}
                onOpenChange={setIsDetailDialogOpen}
                visitor={selectedVisitor}
              />
            )}
          </main>
        </SidebarInset>
      </SidebarProvider>
      
      {/* Hidden printable report */}
      <div className="hidden">
        <div ref={printRef}>
          <PrintableVehicleReport visitors={visitors} shipments={[]} />
        </div>
      </div>
    </>
  );
}