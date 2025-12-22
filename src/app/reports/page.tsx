'use client';

import * as React from 'react';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  FileText,
  Download,
  Users,
  Truck,
  Thermometer,
  ShieldAlert,
  BarChart,
  Warehouse,
  ListChecks,
  Weight,
  Boxes,
  Calendar as CalendarIcon,
  HandCoins,
  Wallet,
  FileSpreadsheet,
  Zap,
  Droplet,
  Factory,
  UserCheck,
  Clock // New icon for attendance
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { 
    visitorData, 
    timeAttendanceData, 
    employeeData, 
    shipmentData, 
    coldRoomInventoryData, 
    packagingMaterialData,
    weightData,
    type Visitor, 
    type TimeAttendance, 
    type Employee, 
    type Shipment, 
    type ColdRoomInventory,
    type PackagingMaterial,
    type WeightEntry,
    coldRoomStatusData,
    dwellTimeData,
    anomalyData,
    operationalComplianceData,
    incidentTrendData,
    detailedIncidentData,
    accountsReceivableData,
    generalLedgerData,
    pettyCashData,
    type PettyCashTransaction,
    type AdvanceRequest,
    advanceRequestsData,
    type AccountsReceivableEntry,
    type GeneralLedgerEntry,
    energyConsumptionData,
    energyBreakdownData,
    waterConsumptionData,
    waterBreakdownData,
    waterQualityData,
    productionReportData,
    type EnergyConsumptionEntry,
    type WaterConsumptionEntry,
} from '@/lib/data';
import { PrintableVisitorReport } from '@/components/dashboard/printable-visitor-report';
import { PrintableShipmentReport } from '@/components/dashboard/printable-shipment-report';
import { PrintableColdRoomReport } from '@/components/dashboard/printable-cold-room-report';
import { PrintableInventoryReport } from '@/components/dashboard/printable-inventory-report';
import { PrintableQualityReport } from '@/components/dashboard/printable-quality-report';
import { PrintableIncidentReport } from '@/components/dashboard/printable-incident-report';
import { PrintablePackagingReport } from '@/components/dashboard/printable-packaging-report';
import { PrintableWeightReport } from '@/components/dashboard/printable-weight-report';
import { PrintableFinancialReport } from '@/components/dashboard/printable-financial-report';
import { PrintablePayrollReport } from '@/components/dashboard/printable-payroll-report';
import { PrintablePettyCashReport } from '@/components/dashboard/printable-petty-cash-report';
import { PrintableEnergyReport } from '@/components/dashboard/printable-energy-report';
import { PrintableWaterReport } from '@/components/dashboard/printable-water-report';
import { PrintableProductionReport } from '@/components/dashboard/printable-production-report';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';
import { Loader2 } from 'lucide-react';

const pdfReportTypes = [
  { id: 'visitorManifest', label: 'Visitor Manifest', icon: Users, href: '/visitor-management' },
  { id: 'shipmentManifest', label: 'Shipment Manifest', icon: Truck, href: '/shipments' },
  { id: 'productionReport', label: 'Production Report', icon: Factory, href: '/reports' },
  { id: 'inventoryReport', label: 'Inventory Report', icon: Warehouse, href: '/inventory' },
  { id: 'packagingReport', label: 'Packaging Inventory', icon: Boxes, href: '/inventory' },
  { id: 'weightReconciliation', label: 'Weight Reconciliation', icon: Weight, href: '/weight-capture' },
  { id: 'coldChainReport', label: 'Cold Chain Compliance', icon: Thermometer, href: '/cold-room' },
  { id: 'energyReport', label: 'Energy Usage Summary', icon: Zap, href: '/utility' },
  { id: 'waterReport', label: 'Water Usage & Quality', icon: Droplet, href: '/utility' },
  { id: 'qualityReport', label: 'Quality Control Summary', icon: ListChecks, href: '/analytics' },
  { id: 'incidentReport', label: 'High-Risk Incident Report', icon: ShieldAlert, isHighRisk: true, href: '/bi-features' },
  { id: 'financialSummary', label: 'Financial Summary', icon: FileSpreadsheet, href: '/financials' },
  { id: 'payrollReport', label: 'Payroll Report', icon: Wallet, href: '/payroll' },
  { id: 'pettyCashReport', label: 'Petty Cash Report', icon: HandCoins, href: '/financials/petty-cash' },
];

const csvReportTypes = [
  { id: 'supplierReport', label: 'Supplier Report', icon: UserCheck },
  { id: 'employeeAttendanceLog', label: 'Full Employee Attendance Log', icon: Clock }, // Updated with icon
  { id: 'visitorEntryLog', label: 'Visitor & Vehicle Entry Log' },
  { id: 'shipmentData', label: 'Complete Shipment Data' },
  { id: 'inventoryData', label: 'Full Inventory Data' },
  { id: 'packagingData', label: 'Packaging Stock Data' },
  { id: 'energyData', label: 'Full Energy Consumption Data' },
  { id: 'waterData', label: 'Full Water Consumption Data' },
  { id: 'invoiceLog', label: 'Full Invoice Log' },
  { id: 'generalLedger', label: 'General Ledger Entries' },
  { id: 'pettyCashTransactions', label: 'Petty Cash Transactions' },
];

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

// Helper function to convert an array of objects to a CSV string
const convertToCsv = (data: any[], headers: string[]): string => {
    const headerRow = headers.map(escapeCsvField).join(',');
    const dataRows = data.map(row => 
        headers.map(header => {
            // Handle nested object properties
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

// Supplier data type
interface Supplier {
  id: string;
  name: string;
  location: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  supplier_code: string;
  status: string;
  kra_pin: string;
  bank_name: string;
  bank_account_number: string;
  mpesa_paybill: string;
  mpesa_account_number: string;
  created_at: string;
}

// Employee Attendance data type
interface EmployeeAttendance {
  id: string;
  employeeId: string;
  employee_name: string;
  id_number: string;
  phone: string;
  designation: string;
  date: string;
  status: string;
  clock_in_time: string;
  clock_out_time: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const [selectedPdfReport, setSelectedPdfReport] = useState<string>('');
  const [selectedCsvReport, setSelectedCsvReport] = useState<string>('supplierReport');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [supplierData, setSupplierData] = useState<Supplier[]>([]);
  const [employeeAttendanceData, setEmployeeAttendanceData] = useState<EmployeeAttendance[]>([]);

  // Fetch supplier data on component mount
  React.useEffect(() => {
    fetchSupplierData();
    fetchEmployeeAttendanceData();
  }, []);

  const fetchSupplierData = async () => {
    try {
      const response = await fetch('/api/suppliers');
      if (response.ok) {
        const data = await response.json();
        setSupplierData(data);
      } else {
        console.error('Failed to fetch supplier data');
      }
    } catch (error) {
      console.error('Error fetching supplier data:', error);
    }
  };

  const fetchEmployeeAttendanceData = async () => {
    try {
      const response = await fetch('/api/attendance?format=csv');
      if (response.ok) {
        const data = await response.json();
        setEmployeeAttendanceData(data);
      } else {
        console.error('Failed to fetch employee attendance data');
      }
    } catch (error) {
      console.error('Error fetching employee attendance data:', error);
    }
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
        setIsDatePickerOpen(false);
    }
  };

  const generateAndDownloadPdf = async (reportType: { id: string, label: string }) => {
    const element = printRef.current;
    if (element) {
        const canvas = await html2canvas(element, { scale: 2 });
        const data = canvas.toDataURL('image/jpeg');
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(data, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`report-${reportType.id}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } else {
        toast({
            variant: 'destructive',
            title: 'Generation Failed',
            description: 'Could not find the content to generate the report.',
        });
    }
  };

  const handleGeneratePdf = async () => {
    if (!selectedPdfReport) {
      toast({ variant: 'destructive', title: 'No Report Selected', description: 'Please select a PDF report to generate.' });
      return;
    }
    
    const reportType = pdfReportTypes.find(r => r.id === selectedPdfReport);
    if (!reportType) return;
    
    setIsGenerating(true);
    toast({ title: 'Generating PDF Report...', description: `Please wait while we generate the ${reportType.label} report.` });

    // A short delay to allow the correct printable component to render with new data before capturing
    await new Promise(resolve => setTimeout(resolve, 500));
    await generateAndDownloadPdf(reportType);
    setIsGenerating(false);
  };

  const handleGenerateCsv = async () => {
    const report = csvReportTypes.find(r => r.id === selectedCsvReport);
    if (!report) return;

    setIsGenerating(true);
    toast({ 
      title: 'Generating CSV Report...', 
      description: `Please wait while we generate the ${report.label} report.` 
    });

    try {
      let csvContent = '';
      let headers: string[] = [];
      let data: any[] = [];
      let filename = '';
      
      switch (report.id) {
        case 'supplierReport':
          if (!dateRange?.from || !dateRange?.to) {
            toast({
              variant: 'destructive',
              title: 'Date Range Required',
              description: 'Please select a date range to generate the Supplier Report.',
            });
            setIsGenerating(false);
            return;
          }

          const startDateStr = format(dateRange.from, 'yyyy-MM-dd');
          const endDateStr = format(dateRange.to, 'yyyy-MM-dd');
          
          try {
            const response = await fetch(`/api/suppliers?startDate=${startDateStr}&endDate=${endDateStr}&format=csv`);
            
            if (!response.ok) {
              throw new Error(`Failed to fetch supplier data: ${response.statusText}`);
            }

            // Directly use the CSV content from the API
            csvContent = await response.text();
            
            // Extract filename from Content-Disposition header or create one
            const contentDisposition = response.headers.get('Content-Disposition');
            if (contentDisposition) {
              const match = contentDisposition.match(/filename="(.+)"/);
              if (match) {
                filename = match[1];
              }
            }
            
            if (!filename) {
              filename = `suppliers_${startDateStr}_to_${endDateStr}.csv`;
            }

            // Download the CSV file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast({
              title: 'CSV Export Complete',
              description: `Supplier report for ${startDateStr} to ${endDateStr} has been downloaded.`,
            });
            setIsGenerating(false);
            return;
            
          } catch (error) {
            console.error('Error generating supplier CSV:', error);
            toast({
              variant: 'destructive',
              title: 'Export Failed',
              description: 'Failed to generate supplier report. Please try again.',
            });
            setIsGenerating(false);
            return;
          }
          
        case 'employeeAttendanceLog':
          if (!dateRange?.from || !dateRange?.to) {
            toast({
              variant: 'destructive',
              title: 'Date Range Required',
              description: 'Please select a date range to generate the Employee Attendance Log.',
            });
            setIsGenerating(false);
            return;
          }

          const attendanceStartDateStr = format(dateRange.from, 'yyyy-MM-dd');
          const attendanceEndDateStr = format(dateRange.to, 'yyyy-MM-dd');
          
          try {
            const response = await fetch(`/api/attendance?startDate=${attendanceStartDateStr}&endDate=${attendanceEndDateStr}&format=csv`);
            
            if (!response.ok) {
              throw new Error(`Failed to fetch attendance data: ${response.statusText}`);
            }

            // Directly use the CSV content from the API
            csvContent = await response.text();
            
            // Extract filename from Content-Disposition header or create one
            const contentDisposition = response.headers.get('Content-Disposition');
            if (contentDisposition) {
              const match = contentDisposition.match(/filename="(.+)"/);
              if (match) {
                filename = match[1];
              }
            }
            
            if (!filename) {
              filename = `employee_attendance_${attendanceStartDateStr}_to_${attendanceEndDateStr}.csv`;
            }

            // Download the CSV file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast({
              title: 'CSV Export Complete',
              description: `Employee attendance report for ${attendanceStartDateStr} to ${attendanceEndDateStr} has been downloaded.`,
            });
            setIsGenerating(false);
            return;
            
          } catch (error) {
            console.error('Error generating attendance CSV:', error);
            // Fallback to using local data
            console.log('Falling back to local data...');
            
            // Use the locally fetched attendance data
            const filteredData = employeeAttendanceData.filter(item => {
              if (!dateRange?.from || !dateRange?.to) return true;
              const itemDate = parseISO(item.date);
              return isWithinInterval(itemDate, { 
                start: dateRange.from, 
                end: dateRange.to 
              });
            });

            if (filteredData.length === 0) {
              toast({
                variant: 'destructive',
                title: 'No Data Found',
                description: 'No attendance records found for the selected date range.',
              });
              setIsGenerating(false);
              return;
            }

            // Use specific headers for attendance data
            headers = ['Employee ID', 'Employee Name', 'ID Number', 'Phone', 'Designation', 'Date', 'Status', 'Check In Time', 'Check Out Time'];
            
            data = filteredData.map(item => ({
              'Employee ID': item.employeeId,
              'Employee Name': item.employee_name,
              'ID Number': item.id_number,
              'Phone': item.phone,
              'Designation': item.designation,
              'Date': format(parseISO(item.date), 'yyyy-MM-dd'),
              'Status': item.status,
              'Check In Time': item.clock_in_time ? format(parseISO(item.clock_in_time), 'HH:mm:ss') : '',
              'Check Out Time': item.clock_out_time ? format(parseISO(item.clock_out_time), 'HH:mm:ss') : ''
            }));

            filename = `employee_attendance_${attendanceStartDateStr}_to_${attendanceEndDateStr}.csv`;
            
            // Continue with CSV generation below
            csvContent = convertToCsv(data, headers);
          }
          break;
          
        case 'visitorEntryLog':
          headers = ['ID', 'Name', 'Company', 'VehiclePlate', 'Status', 'CheckInTime', 'CheckOutTime'];
          data = visitorData.map(v => ({
            ...v, 
            CheckInTime: v.checkInTime ? format(new Date(v.checkInTime), 'Pp') : '', 
            CheckOutTime: v.checkOutTime ? format(new Date(v.checkOutTime), 'Pp') : ''
          }));
          filename = `${report.id}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          break;
          
        case 'shipmentData':
          headers = ['ShipmentID', 'Customer', 'Origin', 'Destination', 'Status', 'Product', 'Weight', 'ExpectedArrival'];
          data = shipmentData.map(s => ({
            ...s, 
            ExpectedArrival: s.expectedArrival ? format(new Date(s.expectedArrival), 'Pp') : ''
          }));
          filename = `${report.id}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          break;
          
        case 'inventoryData':
          headers = ['ID', 'Product', 'Category', 'Quantity', 'Unit', 'Location', 'EntryDate'];
          data = coldRoomInventoryData.map(i => ({
            ...i, 
            EntryDate: format(new Date(i.entryDate), 'Pp')
          }));
          filename = `${report.id}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          break;
          
        case 'packagingData':
          headers = ['ID', 'Name', 'CurrentStock', 'Unit', 'ReorderLevel', 'Dimensions'];
          data = packagingMaterialData;
          filename = `${report.id}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          break;
          
        case 'energyData':
          headers = ['Time', 'Usage (kWh)'];
          data = energyConsumptionData.map(d => ({
            Time: d.hour, 
            'Usage (kWh)': d.usage
          }));
          filename = `${report.id}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          break;
          
        case 'waterData':
          headers = ['Date', 'Consumption (m³)', 'pH', 'Turbidity (NTU)', 'Conductivity (µS/cm)', 'Status'];
          // Combining water consumption and quality data for a comprehensive export
          const combinedWaterData = waterConsumptionData.map((cons, index) => {
              const quality = waterQualityData[index] || {};
              return {
                  Date: cons.date,
                  'Consumption (m³)': cons.consumption,
                  pH: quality.pH,
                  'Turbidity (NTU)': quality.turbidity,
                  'Conductivity (µS/cm)': quality.conductivity,
                  Status: quality.status,
              };
          });
          data = combinedWaterData;
          filename = `${report.id}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          break;
          
        case 'invoiceLog':
          headers = ['ID', 'Customer', 'InvoiceID', 'Amount', 'DueDate', 'AgingStatus'];
          data = accountsReceivableData;
          filename = `${report.id}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          break;
          
        case 'generalLedger':
          headers = ['ID', 'Date', 'Account', 'Debit', 'Credit', 'Description'];
          data = generalLedgerData;
          filename = `${report.id}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          break;
          
        case 'pettyCashTransactions':
          headers = ['ID', 'Type', 'Amount', 'Description', 'Timestamp', 'Recipient', 'Phone'];
          data = pettyCashData;
          filename = `${report.id}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          break;
          
        default:
          csvContent = 'Header1,Header2\nValue1,Value2';
          filename = `${report.id}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      }

      // Generate CSV for non-API-based reports
      if (data.length > 0 && !['supplierReport', 'employeeAttendanceLog'].includes(report.id)) {
        csvContent = convertToCsv(data, headers);

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: 'CSV Export Complete',
          description: `Your data export for "${report.label}" has been downloaded.`,
        });
      }

    } catch (error) {
      console.error('Error generating CSV:', error);
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'Failed to generate CSV report. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const filterByDateRange = (items: any[], dateKey: string) => {
    if (!dateRange?.from) return items;
    return items.filter(item => {
        const itemDate = parseISO(item[dateKey]);
        const endOfToDate = dateRange.to ? new Date(dateRange.to.setHours(23, 59, 59, 999)) : dateRange.from;
        return isWithinInterval(itemDate, { start: dateRange.from!, end: endOfToDate });
    });
  };

  const filteredAccountsReceivable = filterByDateRange(accountsReceivableData, 'dueDate');
  const filteredGeneralLedger = filterByDateRange(generalLedgerData, 'date');
  
  const simplifiedPayrollKpis = {
      totalPayroll: { title: 'Total Payroll', value: 'KES 475,000' },
      advancesPaid: { title: 'Advances Paid', value: 'KES 15,500' },
      netPay: { title: 'Net Pay (Est.)', value: 'KES 387,250' }
  };


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
          <Header />
          <main className="p-4 md:p-6 lg:p-8 space-y-6">

            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
                 <p className="text-muted-foreground">Generate custom PDF reports or export raw data as CSV.</p>
            </div>
             <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                <Label className="font-semibold">Global Date Filter:</Label>
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
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
                          <span>Pick a date range</span>
                      )}
                      </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={handleDateSelect}
                      numberOfMonths={2}
                      />
                  </PopoverContent>
                </Popover>
                <p className="text-sm text-muted-foreground">
                  Applies to all generated reports and exports. Required for Supplier and Employee Attendance reports.
                </p>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText />
                    PDF Reports
                  </CardTitle>
                  <CardDescription>
                    Select a report to generate a downloadable, formatted PDF document.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h3 className="text-sm font-medium">Report Type</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {pdfReportTypes.map((report) => (
                      <div key={report.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={report.id}
                          checked={selectedPdfReport === report.id}
                          onCheckedChange={() => {
                            setSelectedPdfReport(report.id)
                          }}
                        />
                        <Label
                          htmlFor={report.id}
                          className={cn(
                            'flex items-center gap-2 font-normal',
                            report.isHighRisk && 'text-destructive'
                          )}
                        >
                          <report.icon className="w-4 h-4" />
                          {report.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full mt-4" onClick={handleGeneratePdf} disabled={!selectedPdfReport || isGenerating}>
                    {isGenerating ? <Loader2 className="mr-2 animate-spin" /> : <Download className="mr-2" />}
                    {isGenerating ? 'Generating...' : 'Generate PDF Report'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart />
                    Data Exports (CSV)
                  </CardTitle>
                  <CardDescription>
                    Generate CSV exports for general operational data.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h3 className="text-sm font-medium">Report Type</h3>
                  <div className="space-y-3">
                    {csvReportTypes.map((report) => (
                      <div key={report.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`csv-${report.id}`}
                          checked={selectedCsvReport === report.id}
                          onCheckedChange={() => setSelectedCsvReport(report.id)}
                        />
                        <Label htmlFor={`csv-${report.id}`} className="font-normal">
                          {report.icon && <report.icon className="w-4 h-4 mr-2 inline" />}
                          {report.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    onClick={handleGenerateCsv} 
                    disabled={isGenerating}
                  >
                    {isGenerating ? <Loader2 className="mr-2 animate-spin" /> : <Download className="mr-2" />}
                    {isGenerating ? 'Generating...' : 'Generate & Download CSV'}
                  </Button>
                  {selectedCsvReport === 'employeeAttendanceLog' && dateRange?.from && dateRange?.to && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Generating employee attendance report for: {format(dateRange.from, 'MMM dd, yyyy')} to {format(dateRange.to, 'MMM dd, yyyy')}
                    </p>
                  )}
                  {selectedCsvReport === 'supplierReport' && dateRange?.from && dateRange?.to && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Generating supplier report for: {format(dateRange.from, 'MMM dd, yyyy')} to {format(dateRange.to, 'MMM dd, yyyy')}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
      <div className="hidden">
        <div ref={printRef}>
          {selectedPdfReport === 'visitorManifest' && <PrintableVisitorReport visitors={visitorData} employees={employeeData} attendance={timeAttendanceData} />}
          {selectedPdfReport === 'shipmentManifest' && <PrintableShipmentReport shipments={shipmentData} />}
          {selectedPdfReport === 'productionReport' && <PrintableProductionReport reportData={productionReportData} />}
          {selectedPdfReport === 'inventoryReport' && <PrintableInventoryReport inventory={coldRoomInventoryData} />}
          {selectedPdfReport === 'packagingReport' && <PrintablePackagingReport materials={packagingMaterialData} />}
          {selectedPdfReport === 'weightReconciliation' && <PrintableWeightReport weights={weightData} />}
          {selectedPdfReport === 'coldChainReport' && <PrintableColdRoomReport rooms={coldRoomStatusData} inventory={dwellTimeData} alerts={anomalyData} />}
          {selectedPdfReport === 'energyReport' && <PrintableEnergyReport consumptionData={energyConsumptionData} breakdownData={energyBreakdownData} />}
          {selectedPdfReport === 'waterReport' && <PrintableWaterReport consumptionData={waterConsumptionData} breakdownData={waterBreakdownData} qualityData={waterQualityData} />}
          {selectedPdfReport === 'qualityReport' && <PrintableQualityReport qcData={operationalComplianceData} />}
          {selectedPdfReport === 'incidentReport' && <PrintableIncidentReport incidentTrendData={incidentTrendData} detailedIncidentData={detailedIncidentData} />}
          {selectedPdfReport === 'financialSummary' && <PrintableFinancialReport accountsReceivableData={filteredAccountsReceivable} generalLedgerData={filteredGeneralLedger} />}
          {selectedPdfReport === 'payrollReport' && <PrintablePayrollReport employees={employeeData} requests={advanceRequestsData} kpis={simplifiedPayrollKpis} />}
          {selectedPdfReport === 'pettyCashReport' && <PrintablePettyCashReport transactions={pettyCashData} />}
        </div>
      </div>
    </>
  );
}