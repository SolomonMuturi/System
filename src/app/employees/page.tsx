'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { EmployeeDataTable } from '@/components/dashboard/employee-data-table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { CreateEmployeeForm } from '@/components/dashboard/create-employee-form';
import {
  PlusCircle, Users, CheckCircle, LogOut, TrendingUp, Printer, LogIn,
  Settings, XCircle, Clock, ChevronDown, ChevronUp, Calendar as CalendarIcon,
  AlertCircle, Search, RefreshCw, Eye, Edit, Trash2, User, Briefcase,
  Phone, Mail, Building, BadgeCheck, Award, DollarSign, CalendarDays,
  Shield, FileText, Download, Filter, MoreVertical, UserPlus,
  ChevronLeft, ChevronRight, DownloadCloud, UploadCloud, BarChart
} from 'lucide-react';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { useToast } from '@/hooks/use-toast';
import { EmployeeDetailCard } from '@/components/dashboard/employee-detail-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { format, parseISO, addDays, differenceInHours, startOfDay, endOfDay, isToday, isSameDay } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';

// Types
type EmployeeContract = 'Full-time' | 'Part-time' | 'Contract';
type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'On Leave' | 'Early Departure';
type Designation = 'dipping' | 'intake' | 'qualityControl' | 'qualityAssurance' | 'packing' | 'loading' | 'palletizing' | 'porter';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  performance?: string;
  rating?: number;
  contract: EmployeeContract;
  salary?: string;
  image?: string;
  id_number?: string;
  phone?: string;
  issue_date?: string;
  expiry_date?: string;
  company?: string;
  created_at: string;
  updated_at: string;
  employeeId?: string;
}

interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  clockInTime?: string;
  clockOutTime?: string;
  designation?: Designation;
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
}

interface EmployeeFormValues {
  name: string;
  email: string;
  role: string;
  contract: EmployeeContract;
  idNumber: string;
  phone: string;
  status: string;
  performance?: string;
  rating?: number;
  salary?: string;
  image?: string;
  issueDate?: string;
  expiryDate?: string;
  company?: string;
}

const getInitials = (name: string) => (name || '').split(' ').map((n) => n[0]).join('').toUpperCase();

const statusInfo = {
  Present: { 
    color: 'bg-green-100 text-green-800 border-green-300', 
    icon: CheckCircle,
    variant: 'default' as const
  },
  Absent: { 
    color: 'bg-red-100 text-red-800 border-red-300', 
    icon: XCircle,
    variant: 'destructive' as const
  },
  Late: { 
    color: 'bg-amber-100 text-amber-800 border-amber-300', 
    icon: AlertCircle,
    variant: 'secondary' as const
  },
  'On Leave': { 
    color: 'bg-blue-100 text-blue-800 border-blue-300', 
    icon: CalendarIcon,
    variant: 'secondary' as const
  },
  'Early Departure': { 
    color: 'bg-purple-100 text-purple-800 border-purple-300', 
    icon: LogOut,
    variant: 'secondary' as const
  },
};

const designationLabels: Record<Designation, string> = {
  dipping: 'Dipping',
  intake: 'Intake',
  qualityControl: 'Quality Control',
  qualityAssurance: 'Quality Assurance',
  packing: 'Packing',
  loading: 'Loading',
  palletizing: 'Palletizing',
  porter: 'Porter'
};

const designationColors: Record<Designation, string> = {
  dipping: 'bg-blue-50 text-blue-700 border-blue-200',
  intake: 'bg-green-50 text-green-700 border-green-200',
  qualityControl: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  qualityAssurance: 'bg-purple-50 text-purple-700 border-purple-200',
  packing: 'bg-pink-50 text-pink-700 border-pink-200',
  loading: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  palletizing: 'bg-orange-50 text-orange-700 border-orange-200',
  porter: 'bg-cyan-50 text-cyan-700 border-cyan-200'
};

// Enhanced Employee Card Component for Check In/Out
interface EmployeeCheckCardProps {
  employee: Employee;
  todayRecord?: Attendance;
  onCheckIn: (employeeId: string, isLate?: boolean, designation?: Designation) => void;
  onCheckOut: (employeeId: string) => void;
  onMarkAbsent: (employeeId: string) => void;
  onMarkOnLeave: (employeeId: string) => void;
  showDesignation?: boolean;
  designation?: Designation;
  onDesignationChange?: (designation: Designation) => void;
}

const EmployeeCheckCard: React.FC<EmployeeCheckCardProps> = ({
  employee,
  todayRecord,
  onCheckIn,
  onCheckOut,
  onMarkAbsent,
  onMarkOnLeave,
  showDesignation = false,
  designation = 'dipping',
  onDesignationChange
}) => {
  const isPresent = todayRecord?.status === 'Present';
  const isLate = todayRecord?.status === 'Late';
  const isAbsent = todayRecord?.status === 'Absent';
  const isOnLeave = todayRecord?.status === 'On Leave';
  const isCheckedOut = !!todayRecord?.clockOutTime;
  const isCheckedIn = !!todayRecord?.clockInTime;
  
  const StatusIcon = todayRecord ? statusInfo[todayRecord.status as keyof typeof statusInfo]?.icon : Clock;
  const statusColor = todayRecord ? statusInfo[todayRecord.status as keyof typeof statusInfo]?.color : 'bg-gray-100 text-gray-800';
  
  const currentTime = new Date();
  const isMorning = currentTime.getHours() < 12;
  const isAfternoon = currentTime.getHours() >= 12 && currentTime.getHours() < 17;
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={employee.image} />
              <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{employee.name}</div>
              <div className="text-sm text-muted-foreground">{employee.role}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {employee.contract}
                </Badge>
                {todayRecord && (
                  <Badge className={`${statusColor} text-xs`}>
                    {StatusIcon && <StatusIcon className="w-3 h-3 mr-1" />}
                    {todayRecord.status}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            {todayRecord?.clockInTime && (
              <div className="text-sm text-green-600">
                <CheckCircle className="w-3 h-3 inline mr-1" />
                {format(parseISO(todayRecord.clockInTime), 'HH:mm')}
              </div>
            )}
            {todayRecord?.clockOutTime && (
              <div className="text-sm text-red-600">
                <LogOut className="w-3 h-3 inline mr-1" />
                {format(parseISO(todayRecord.clockOutTime), 'HH:mm')}
              </div>
            )}
          </div>
        </div>
        
        {/* Designation Selector for Contract Employees */}
        {showDesignation && employee.contract === 'Contract' && (
          <div className="mt-3">
            <Label htmlFor={`designation-${employee.id}`} className="text-xs">Designation</Label>
            <Select 
              value={designation} 
              onValueChange={(value: Designation) => onDesignationChange?.(value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select designation" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(designationLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {!todayRecord || (!isPresent && !isLate && !isAbsent && !isOnLeave) ? (
            <>
              <Button
                size="sm"
                className="h-8 text-xs bg-green-600 hover:bg-green-700"
                onClick={() => onCheckIn(employee.id, false, showDesignation && employee.contract === 'Contract' ? designation : undefined)}
              >
                <LogIn className="w-3 h-3 mr-1" />
                Check In
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => onMarkAbsent(employee.id)}
              >
                <XCircle className="w-3 h-3 mr-1" />
                Absent
              </Button>
            </>
          ) : (isPresent || isLate) && !isCheckedOut ? (
            <>
              <Button
                size="sm"
                variant="destructive"
                className="h-8 text-xs"
                onClick={() => onCheckOut(employee.id)}
              >
                <LogOut className="w-3 h-3 mr-1" />
                Check Out
              </Button>
              {isMorning && !isLate && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-amber-500 text-amber-600"
                  onClick={() => onCheckIn(employee.id, true, showDesignation && employee.contract === 'Contract' ? designation : undefined)}
                >
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Mark Late
                </Button>
              )}
            </>
          ) : isAbsent ? (
            <>
              <Button
                size="sm"
                className="h-8 text-xs bg-green-600 hover:bg-green-700"
                onClick={() => onCheckIn(employee.id, isAfternoon, showDesignation && employee.contract === 'Contract' ? designation : undefined)}
              >
                <LogIn className="w-3 h-3 mr-1" />
                {isAfternoon ? 'Check In Late' : 'Check In'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => onMarkOnLeave(employee.id)}
              >
                <CalendarIcon className="w-3 h-3 mr-1" />
                On Leave
              </Button>
            </>
          ) : isOnLeave ? (
            <>
              <Button
                size="sm"
                className="h-8 text-xs bg-green-600 hover:bg-green-700"
                onClick={() => onCheckIn(employee.id, isAfternoon, showDesignation && employee.contract === 'Contract' ? designation : undefined)}
              >
                <LogIn className="w-3 h-3 mr-1" />
                {isAfternoon ? 'Check In Late' : 'Check In'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => onMarkAbsent(employee.id)}
              >
                <XCircle className="w-3 h-3 mr-1" />
                Absent
              </Button>
            </>
          ) : (
            <div className="col-span-2 text-center text-sm text-muted-foreground">
              Already checked out for today
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

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

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [filteredAttendance, setFilteredAttendance] = useState<Attendance[]>([]);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Full-time' | 'Part-time' | 'Contract'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  // Roll Call state
  const [activeTab, setActiveTab] = useState('overview');
  const [today, setToday] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check In/Out state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [designationForEmployee, setDesignationForEmployee] = useState<Record<string, Designation>>({});

  // Attendance History state
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  const [attendanceSearchTerm, setAttendanceSearchTerm] = useState('');
  const [attendanceEmployeeFilter, setAttendanceEmployeeFilter] = useState<string>('all');
  const [attendanceTypeFilter, setAttendanceTypeFilter] = useState<string>('all');

  // New Employee form state
  const [newEmployee, setNewEmployee] = useState<EmployeeFormValues>({
    name: '',
    email: '',
    role: 'Employee',
    contract: 'Full-time',
    idNumber: '',
    phone: '',
    status: 'active',
    performance: 'Meets_Expectations',
    rating: 3,
    salary: '',
    image: '',
    issueDate: '',
    expiryDate: '',
    company: 'Harir International'
  });

  // Bulk actions state
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [bulkDesignation, setBulkDesignation] = useState<Designation>('dipping');

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Fetch employees and attendance
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      
      // Fetch employees
      const employeesResponse = await fetch('/api/employees');
      
      if (!employeesResponse.ok) {
        const errorData = await employeesResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch employees: ${employeesResponse.status}`);
      }
      
      const employeesData = await employeesResponse.json();
      console.log(`✅ Loaded ${employeesData.length} employees`);
      setEmployees(employeesData);
      
      if (employeesData.length > 0 && !selectedEmployee) {
        setSelectedEmployee(employeesData[0]);
      }
      
      // Fetch attendance (all records for history)
      try {
        const attendanceResponse = await fetch('/api/attendance');
        
        if (attendanceResponse.ok) {
          const attendanceData = await attendanceResponse.json();
          console.log(`✅ Loaded ${attendanceData.length} attendance records`);
          setAttendance(attendanceData);
        } else {
          console.warn('⚠️ Could not fetch attendance:', attendanceResponse.status);
          setAttendance([]);
        }
      } catch (attendanceError) {
        console.warn('⚠️ Attendance fetch failed:', attendanceError);
        setAttendance([]);
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching data:', error);
      
      const errorMessage = error.message || 'Failed to load employee data';
      setFetchError(errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      setEmployees([]);
      setAttendance([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setIsClient(true);
    setToday(format(new Date(), 'yyyy-MM-dd'));
  }, []);

  // Handle refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchData();
      toast({
        title: 'Data Refreshed',
        description: 'Latest data has been loaded.',
      });
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get attendance for selected date
  const getAttendanceForDate = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return attendance.filter(record => record.date === dateStr);
  }, [attendance, selectedDate]);

  // Filter employees based on search and contract type
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      // Contract filter
      if (activeFilter !== 'All' && employee.contract !== activeFilter) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          employee.name.toLowerCase().includes(query) ||
          employee.email.toLowerCase().includes(query) ||
          employee.role.toLowerCase().includes(query) ||
          (employee.id_number && employee.id_number.toLowerCase().includes(query)) ||
          (employee.phone && employee.phone.toLowerCase().includes(query)) ||
          (employee.company && employee.company.toLowerCase().includes(query))
        );
      }
      
      return true;
    });
  }, [employees, activeFilter, searchQuery]);

  // Calculate statistics
  const stats = useMemo(() => {
    const fullTimeEmployees = employees.filter(emp => emp.contract === 'Full-time');
    const partTimeEmployees = employees.filter(emp => emp.contract === 'Part-time');
    const contractEmployees = employees.filter(emp => emp.contract === 'Contract');
    
    const todayAttendance = getAttendanceForDate;
    const presentToday = todayAttendance.filter(record => record.status === 'Present').length;
    const lateToday = todayAttendance.filter(record => record.status === 'Late').length;
    const absentToday = todayAttendance.filter(record => record.status === 'Absent').length;
    const onLeaveToday = todayAttendance.filter(record => record.status === 'On Leave').length;
    const checkedOutToday = todayAttendance.filter(record => record.clockOutTime).length;
    const checkedInToday = todayAttendance.filter(record => record.clockInTime && !record.clockOutTime).length;
    
    const attendanceRate = employees.length > 0 
      ? Math.round((presentToday / employees.length) * 100)
      : 0;
    
    return {
      totalEmployees: employees.length,
      fullTimeCount: fullTimeEmployees.length,
      partTimeCount: partTimeEmployees.length,
      contractCount: contractEmployees.length,
      presentToday,
      lateToday,
      absentToday,
      onLeaveToday,
      checkedOutToday,
      checkedInToday,
      attendanceRate,
      pendingCheckIn: employees.length - (presentToday + absentToday + onLeaveToday)
    };
  }, [employees, getAttendanceForDate]);

  // Handle check in
  const handleCheckIn = async (employeeId: string, isLate: boolean = false, designation?: Designation) => {
    try {
      const employee = employees.find(emp => emp.id === employeeId);
      if (!employee) {
        toast({
          title: 'Error',
          description: 'Employee not found',
          variant: 'destructive',
        });
        return;
      }

      const checkInTime = new Date().toISOString();
      const status: AttendanceStatus = isLate ? 'Late' : 'Present';
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // For contract employees, use the provided designation or default
      const designationForRecord = employee.contract === 'Contract' ? (designation || 'dipping') : undefined;
      
      // Check if attendance record already exists for today
      const existingRecord = getAttendanceForDate.find(record => record.employeeId === employeeId);
      
      let response;
      if (existingRecord) {
        // Update existing record
        response = await fetch(`/api/attendance?id=${existingRecord.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status,
            clockInTime: checkInTime,
            designation: designationForRecord,
            date: dateStr
          }),
        });
      } else {
        // Create new record
        response = await fetch('/api/attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            employeeId,
            date: dateStr,
            status,
            clockInTime: checkInTime,
            designation: designationForRecord
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save check-in');
      }

      const data = await response.json();
      
      // Update local state
      setAttendance(prev => {
        // Remove existing record for this employee on this date
        const filtered = prev.filter(record => 
          !(record.employeeId === employeeId && record.date === dateStr)
        );
        return [...filtered, data];
      });

      toast({
        title: '✅ Checked In',
        description: `${employee.name} has been checked in${isLate ? ' (Late)' : ''} at ${format(new Date(), 'HH:mm')}`,
      });
      
    } catch (error: any) {
      toast({
        title: 'Check-in Failed',
        description: error.message || 'Failed to check in',
        variant: 'destructive',
      });
    }
  };

  // Handle check out
  const handleCheckOut = async (employeeId: string) => {
    try {
      const employee = employees.find(emp => emp.id === employeeId);
      if (!employee) {
        toast({
          title: 'Error',
          description: 'Employee not found',
          variant: 'destructive',
        });
        return;
      }

      const checkOutTime = new Date().toISOString();
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Find existing attendance record
      const existingRecord = getAttendanceForDate.find(record => 
        record.employeeId === employeeId && record.date === dateStr
      );
      
      if (!existingRecord) {
        toast({
          title: 'Error',
          description: 'No check-in record found for today',
          variant: 'destructive',
        });
        return;
      }
      
      const response = await fetch(`/api/attendance?id=${existingRecord.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: existingRecord.status,
          clockOutTime: checkOutTime,
          designation: existingRecord.designation
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save check-out');
      }

      const data = await response.json();
      
      // Update local state
      setAttendance(prev => prev.map(record => 
        record.id === existingRecord.id ? data : record
      ));

      toast({
        title: '✅ Checked Out',
        description: `${employee.name} has been checked out at ${format(new Date(), 'HH:mm')}`,
      });
      
    } catch (error: any) {
      toast({
        title: 'Check-out Failed',
        description: error.message || 'Failed to check out',
        variant: 'destructive',
      });
    }
  };

  // Handle mark as absent
  const handleMarkAbsent = async (employeeId: string) => {
    try {
      const employee = employees.find(emp => emp.id === employeeId);
      if (!employee) {
        toast({
          title: 'Error',
          description: 'Employee not found',
          variant: 'destructive',
        });
        return;
      }

      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Check if attendance record already exists for today
      const existingRecord = getAttendanceForDate.find(record => record.employeeId === employeeId);
      
      let response;
      if (existingRecord) {
        // Update existing record
        response = await fetch(`/api/attendance?id=${existingRecord.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'Absent',
            clockInTime: null,
            clockOutTime: null,
            date: dateStr
          }),
        });
      } else {
        // Create new record
        response = await fetch('/api/attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            employeeId,
            date: dateStr,
            status: 'Absent'
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark as absent');
      }

      const data = await response.json();
      
      // Update local state
      setAttendance(prev => {
        // Remove existing record for this employee today
        const filtered = prev.filter(record => 
          !(record.employeeId === employeeId && record.date === dateStr)
        );
        return [...filtered, data];
      });

      toast({
        title: 'Marked Absent',
        description: `${employee.name} has been marked as absent`,
      });
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark as absent',
        variant: 'destructive',
      });
    }
  };

  // Handle mark as on leave
  const handleMarkOnLeave = async (employeeId: string) => {
    try {
      const employee = employees.find(emp => emp.id === employeeId);
      if (!employee) {
        toast({
          title: 'Error',
          description: 'Employee not found',
          variant: 'destructive',
        });
        return;
      }

      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Check if attendance record already exists for today
      const existingRecord = getAttendanceForDate.find(record => record.employeeId === employeeId);
      
      let response;
      if (existingRecord) {
        // Update existing record
        response = await fetch(`/api/attendance?id=${existingRecord.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'On Leave',
            clockInTime: null,
            clockOutTime: null,
            date: dateStr
          }),
        });
      } else {
        // Create new record
        response = await fetch('/api/attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            employeeId,
            date: dateStr,
            status: 'On Leave'
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark as on leave');
      }

      const data = await response.json();
      
      // Update local state
      setAttendance(prev => {
        // Remove existing record for this employee today
        const filtered = prev.filter(record => 
          !(record.employeeId === employeeId && record.date === dateStr)
        );
        return [...filtered, data];
      });

      toast({
        title: 'Marked On Leave',
        description: `${employee.name} has been marked as on leave`,
      });
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark as on leave',
        variant: 'destructive',
      });
    }
  };

  // Bulk check-in for selected employees
  const handleBulkCheckIn = async () => {
    if (selectedEmployees.length === 0) {
      toast({
        title: 'No employees selected',
        description: 'Please select employees to check in',
        variant: 'destructive',
      });
      return;
    }

    const currentHour = new Date().getHours();
    const isLate = currentHour >= 9; // Late if after 9 AM
    
    let successCount = 0;
    let failedCount = 0;

    for (const employeeId of selectedEmployees) {
      try {
        const employee = employees.find(emp => emp.id === employeeId);
        if (employee) {
          const designation = employee.contract === 'Contract' ? 
            (designationForEmployee[employeeId] || bulkDesignation) : 
            undefined;
          
          await handleCheckIn(employeeId, isLate, designation);
          successCount++;
        }
      } catch (error) {
        failedCount++;
      }
    }

    toast({
      title: 'Bulk Check-in Complete',
      description: `Successfully checked in ${successCount} employees. ${failedCount > 0 ? `${failedCount} failed.` : ''}`,
      variant: failedCount > 0 ? 'destructive' : 'default',
    });

    setSelectedEmployees([]);
  };

  // Bulk check-out for selected employees
  const handleBulkCheckOut = async () => {
    if (selectedEmployees.length === 0) {
      toast({
        title: 'No employees selected',
        description: 'Please select employees to check out',
        variant: 'destructive',
      });
      return;
    }

    let successCount = 0;
    let failedCount = 0;

    for (const employeeId of selectedEmployees) {
      try {
        await handleCheckOut(employeeId);
        successCount++;
      } catch (error) {
        failedCount++;
      }
    }

    toast({
      title: 'Bulk Check-out Complete',
      description: `Successfully checked out ${successCount} employees. ${failedCount > 0 ? `${failedCount} failed.` : ''}`,
      variant: failedCount > 0 ? 'destructive' : 'default',
    });

    setSelectedEmployees([]);
  };

  // Bulk mark as absent
  const handleBulkMarkAbsent = async () => {
    if (selectedEmployees.length === 0) {
      toast({
        title: 'No employees selected',
        description: 'Please select employees to mark as absent',
        variant: 'destructive',
      });
      return;
    }

    let successCount = 0;
    let failedCount = 0;

    for (const employeeId of selectedEmployees) {
      try {
        await handleMarkAbsent(employeeId);
        successCount++;
      } catch (error) {
        failedCount++;
      }
    }

    toast({
      title: 'Bulk Mark Absent Complete',
      description: `Successfully marked ${successCount} employees as absent. ${failedCount > 0 ? `${failedCount} failed.` : ''}`,
      variant: failedCount > 0 ? 'destructive' : 'default',
    });

    setSelectedEmployees([]);
  };

  // Handle employee selection
  const handleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  // Select all employees
  const handleSelectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map(emp => emp.id));
    }
  };

  // Handle create employee
  const handleCreateEmployee = async (formData: EmployeeFormValues) => {
    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create employee');
      }

      await fetchData();
      
      toast({
        title: 'Employee Created',
        description: `${formData.name} has been successfully added.`,
      });
      
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create employee',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Handle update employee
  const handleUpdateEmployee = async (formData: EmployeeFormValues) => {
    if (!editingEmployee) return;
    
    try {
      const response = await fetch(`/api/employees?id=${editingEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update employee');
      }

      await fetchData();
      
      toast({
        title: 'Employee Updated',
        description: `${formData.name} has been successfully updated.`,
      });
      
      setIsEditDialogOpen(false);
      setEditingEmployee(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update employee',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Handle delete employee
  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) return;
    
    try {
      const response = await fetch(`/api/employees?id=${employeeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete employee');
      }

      await fetchData();
      
      toast({
        title: 'Employee Deleted',
        description: 'Employee has been successfully deleted.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete employee',
        variant: 'destructive',
      });
    }
  };

  // Calculate KPI data
  const kpiData = useMemo(() => {
    if (!isClient || isLoading) return null;
    
    return {
      totalEmployees: {
        title: 'Total Employees',
        value: String(stats.totalEmployees),
        change: `${stats.presentToday} present today`,
        changeType: 'increase' as const,
      },
      presentToday: {
        title: 'Present Today',
        value: String(stats.presentToday),
        change: `as of ${format(currentTime, 'HH:mm')}`,
        changeType: 'increase' as const,
      },
      onLeave: {
        title: 'On Leave',
        value: String(stats.onLeaveToday),
        change: 'scheduled today',
        changeType: 'decrease' as const,
      },
      attendanceRate: {
        title: 'Attendance Rate',
        value: `${stats.attendanceRate}%`,
        change: 'Today',
        changeType: stats.attendanceRate > 85 ? 'increase' : 'decrease' as const,
      },
    };
  }, [isClient, isLoading, stats, currentTime]);

  // Filter attendance for history
  useEffect(() => {
    if (!attendance.length) {
      setFilteredAttendance([]);
      return;
    }

    const filtered = attendance.filter(record => {
      const recordDate = parseISO(record.date);
      const withinDateRange = recordDate >= dateRange.from && recordDate <= dateRange.to;
      
      if (!withinDateRange) return false;
      
      // Filter by employee name/search term
      if (attendanceSearchTerm) {
        const employee = employees.find(emp => emp.id === record.employeeId);
        const matchesSearch = employee?.name.toLowerCase().includes(attendanceSearchTerm.toLowerCase()) ||
                             (employee?.employeeId && employee.employeeId.includes(attendanceSearchTerm));
        if (!matchesSearch) return false;
      }
      
      // Filter by employee type
      if (attendanceEmployeeFilter !== 'all') {
        const employee = employees.find(emp => emp.id === record.employeeId);
        if (!employee || employee.contract !== attendanceEmployeeFilter) return false;
      }
      
      // Filter by status
      if (attendanceTypeFilter !== 'all') {
        if (record.status !== attendanceTypeFilter) return false;
      }
      
      return true;
    });
    
    setFilteredAttendance(filtered);
  }, [attendance, dateRange, attendanceSearchTerm, attendanceEmployeeFilter, attendanceTypeFilter, employees]);

  // Export attendance to CSV - Only Name, ID Number, Phone Number, Designation
  const exportToCSV = () => {
    if (filteredAttendance.length === 0) {
      toast({
        title: 'No Data',
        description: 'No attendance records found for the selected filter.',
        variant: 'destructive',
      });
      return;
    }

    // Only include the 4 columns specified
    const headers = ['Name', 'ID Number', 'Phone Number', 'Designation'];
    
    const csvData = filteredAttendance.map(record => {
      const employee = employees.find(emp => emp.id === record.employeeId);
      
      return [
        employee?.name || 'Unknown',
        employee?.id_number || 'N/A',
        employee?.phone || 'N/A',
        record.designation ? designationLabels[record.designation] : 'N/A'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => escapeCsvField(cell)).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${format(dateRange.from, 'yyyy-MM-dd')}_to_${format(dateRange.to, 'yyyy-MM-dd')}.csv`;
    a.click();
    
    toast({
      title: 'CSV Exported',
      description: 'Attendance data has been downloaded.',
    });
  };

  // Export employee list to CSV - Only Name, ID Number, Phone Number, Designation
  const exportEmployeeCSV = () => {
    if (employees.length === 0) {
      toast({
        title: 'No Data',
        description: 'No employees found.',
        variant: 'destructive',
      });
      return;
    }

    // Only include the 4 columns specified
    const headers = ['Name', 'ID Number', 'Phone Number', 'Designation'];
    
    const csvData = employees.map(employee => [
      employee.name || 'N/A',
      employee.id_number || 'N/A',
      employee.phone || 'N/A',
      employee.role || 'N/A' // Using role as "Designation"
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => escapeCsvField(cell)).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    
    toast({
      title: 'CSV Exported',
      description: 'Employee list has been downloaded.',
    });
  };

  // Handle check-in all employees for today
  const handleCheckInAll = async () => {
    const employeesToCheckIn = employees.filter(emp => {
      const att = getAttendanceForDate.find(a => a.employeeId === emp.id);
      return !att || (att.status !== 'Present' && att.status !== 'Late');
    });

    const currentHour = new Date().getHours();
    const isLate = currentHour >= 9;

    let successCount = 0;
    let failedCount = 0;
    
    for (const employee of employeesToCheckIn) {
      try {
        const designation = employee.contract === 'Contract' ? 
          (designationForEmployee[employee.id] || 'dipping') : 
          undefined;
        
        await handleCheckIn(employee.id, isLate, designation);
        successCount++;
      } catch (error) {
        failedCount++;
      }
    }

    toast({
      title: 'Bulk Check-in Complete',
      description: `Successfully checked in ${successCount} out of ${employeesToCheckIn.length} employees.${failedCount > 0 ? ` ${failedCount} failed.` : ''}`,
      variant: failedCount > 0 ? 'destructive' : 'default',
    });
  };

  // Handle check-out all present employees
  const handleCheckOutAll = async () => {
    const employeesToCheckOut = employees.filter(emp => {
      const att = getAttendanceForDate.find(a => a.employeeId === emp.id);
      return (att?.status === 'Present' || att?.status === 'Late') && !att.clockOutTime;
    });

    let successCount = 0;
    let failedCount = 0;
    
    for (const employee of employeesToCheckOut) {
      try {
        await handleCheckOut(employee.id);
        successCount++;
      } catch (error) {
        failedCount++;
      }
    }

    toast({
      title: 'Bulk Check-out Complete',
      description: `Successfully checked out ${successCount} out of ${employeesToCheckOut.length} employees.${failedCount > 0 ? ` ${failedCount} failed.` : ''}`,
      variant: failedCount > 0 ? 'destructive' : 'default',
    });
  };

  if (!isClient || isLoading) {
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
            <Skeleton className="h-12 w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Skeleton className="h-[98px] w-full" />
              <Skeleton className="h-[98px] w-full" />
              <Skeleton className="h-[98px] w-full" />
              <Skeleton className="h-[98px] w-full" />
            </div>
            <Skeleton className="h-[500px] w-full" />
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
          {/* Error Display */}
          {fetchError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Database Error</AlertTitle>
              <AlertDescription>
                {fetchError}. Click "Refresh" to try again.
              </AlertDescription>
            </Alert>
          )}

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Employee Management</h2>
              <p className="text-muted-foreground">
                View, add, and manage employee records, attendance, and performance.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`mr-2 w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2" />
                    Add Employee
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Employee</DialogTitle>
                    <DialogDescription>
                      Fill in the details below to add a new employee to the system.
                    </DialogDescription>
                  </DialogHeader>
                  <CreateEmployeeForm onCreate={handleCreateEmployee} />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Main Tabs - REMOVED Data Exports tab */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="roll-call">Roll Call</TabsTrigger>
              <TabsTrigger value="employees">Employees</TabsTrigger>
              <TabsTrigger value="attendance">Attendance Log</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiData ? (
                  <>
                    <OverviewCard data={kpiData.totalEmployees} icon={Users} />
                    <OverviewCard data={kpiData.presentToday} icon={CheckCircle} />
                    <OverviewCard data={kpiData.onLeave} icon={CalendarIcon} />
                    <OverviewCard data={kpiData.attendanceRate} icon={TrendingUp} />
                  </>
                ) : (
                  <>
                    <Skeleton className="h-[98px]" />
                    <Skeleton className="h-[98px]" />
                    <Skeleton className="h-[98px]" />
                    <Skeleton className="h-[98px]" />
                  </>
                )}
              </div>

              {/* Employee Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Employee Distribution</CardTitle>
                  <CardDescription>
                    Breakdown by contract type and status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-medium mb-4">By Contract Type</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Full-time</span>
                          <Badge variant="default">{stats.fullTimeCount}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Part-time</span>
                          <Badge variant="secondary">{stats.partTimeCount}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Contract</span>
                          <Badge variant="outline">{stats.contractCount}</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-4">Today's Attendance</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-600">Present</span>
                          <Badge variant="default">{stats.presentToday}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-red-600">Absent</span>
                          <Badge variant="destructive">{stats.absentToday}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-amber-600">Late</span>
                          <Badge variant="secondary">{stats.lateToday}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-600">On Leave</span>
                          <Badge variant="secondary">{stats.onLeaveToday}</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-4">Check In/Out Status</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Checked In</span>
                          <Badge variant="default">{stats.checkedInToday}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Checked Out</span>
                          <Badge variant="outline">{stats.checkedOutToday}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Pending Check-in</span>
                          <Badge variant="secondary">{stats.pendingCheckIn}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={exportEmployeeCSV} variant="outline" size="sm">
                    <Download className="mr-2 w-4 h-4" />
                    Export Employee List (CSV)
                  </Button>
                </CardFooter>
              </Card>

              {/* Quick Employee Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Employee Actions</CardTitle>
                  <CardDescription>
                    Manage today's attendance quickly
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      onClick={handleCheckInAll}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <LogIn className="mr-2 w-4 h-4" />
                      Check In All Employees
                    </Button>
                    
                    <Button 
                      onClick={handleCheckOutAll}
                      variant="outline"
                      className="border-amber-600 text-amber-600 hover:bg-amber-50"
                    >
                      <LogOut className="mr-2 w-4 h-4" />
                      Check Out All Present
                    </Button>
                    
                    <Button 
                      onClick={() => {
                        employees.forEach(emp => {
                          const todayRecord = getAttendanceForDate.find(r => r.employeeId === emp.id);
                          if (!todayRecord) {
                            handleMarkAbsent(emp.id);
                          }
                        });
                      }}
                      variant="outline"
                      className="border-red-600 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="mr-2 w-4 h-4" />
                      Mark All Absent
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Roll Call Tab */}
            <TabsContent value="roll-call" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5" />
                        <span className="text-lg font-semibold">Daily Roll Call</span>
                      </div>
                      <CardDescription>
                        Manage check-in and check-out for all employees on a daily basis
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-[240px] justify-start text-left font-normal",
                                !selectedDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {format(selectedDate, "EEEE, MMMM d, yyyy")}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={(date) => date && setSelectedDate(date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                          disabled={isToday(selectedDate)}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDate(new Date())}
                      >
                        Today
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Bulk Actions Bar */}
                  {selectedEmployees.length > 0 && (
                    <Card className="mb-6 bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="text-sm">
                              {selectedEmployees.length} selected
                            </Badge>
                            <span className="text-sm text-blue-700">
                              Select actions to perform on all selected employees
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Select 
                              value={bulkDesignation} 
                              onValueChange={(value: Designation) => setBulkDesignation(value)}
                            >
                              <SelectTrigger className="w-[140px] h-8 text-xs">
                                <SelectValue placeholder="Designation" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(designationLabels).map(([value, label]) => (
                                  <SelectItem key={value} value={value} className="text-xs">
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            <Button
                              size="sm"
                              className="h-8 bg-green-600 hover:bg-green-700"
                              onClick={handleBulkCheckIn}
                            >
                              <LogIn className="w-3 h-3 mr-1" />
                              Check In Selected
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8"
                              onClick={handleBulkCheckOut}
                            >
                              <LogOut className="w-3 h-3 mr-1" />
                              Check Out Selected
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8"
                              onClick={handleBulkMarkAbsent}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Mark Absent
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8"
                              onClick={() => setSelectedEmployees([])}
                            >
                              Clear Selection
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Date Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {stats.checkedInToday}
                          </div>
                          <div className="text-sm text-muted-foreground">Checked In</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {stats.absentToday}
                          </div>
                          <div className="text-sm text-muted-foreground">Absent</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-amber-600">
                            {stats.lateToday}
                          </div>
                          <div className="text-sm text-muted-foreground">Late</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {stats.checkedOutToday}
                          </div>
                          <div className="text-sm text-muted-foreground">Checked Out</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Employee Grid */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">All Employees ({employees.length})</h3>
                        <Badge variant="outline">
                          {format(selectedDate, 'MMM d, yyyy')}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="select-all" 
                            checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                          <Label htmlFor="select-all" className="text-sm">Select All</Label>
                        </div>
                        
                        <Select value={activeFilter} onValueChange={(value) => setActiveFilter(value as any)}>
                          <SelectTrigger className="w-[150px] h-8 text-xs">
                            <SelectValue placeholder="Filter by contract" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All">All Contracts</SelectItem>
                            <SelectItem value="Full-time">Full-time</SelectItem>
                            <SelectItem value="Part-time">Part-time</SelectItem>
                            <SelectItem value="Contract">Contract</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                          <Input
                            placeholder="Search..."
                            className="pl-8 h-8 text-sm w-[150px]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {employees.length === 0 ? (
                      <div className="text-center py-12 border rounded-lg">
                        <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">No employees found</h3>
                        <p className="text-muted-foreground mb-4">Add employees to manage attendance</p>
                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                          <PlusCircle className="mr-2" />
                          Add Employee
                        </Button>
                      </div>
                    ) : (
                      <>
                        {/* Mobile/Grid View */}
                        <div className="md:hidden space-y-4">
                          {filteredEmployees.map((employee) => {
                            const todayRecord = getAttendanceForDate.find(r => r.employeeId === employee.id);
                            const isSelected = selectedEmployees.includes(employee.id);
                            
                            return (
                              <div key={employee.id} className="relative">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => handleEmployeeSelection(employee.id)}
                                  className="absolute top-2 right-2 z-10"
                                />
                                <EmployeeCheckCard
                                  employee={employee}
                                  todayRecord={todayRecord}
                                  onCheckIn={handleCheckIn}
                                  onCheckOut={handleCheckOut}
                                  onMarkAbsent={handleMarkAbsent}
                                  onMarkOnLeave={handleMarkOnLeave}
                                  showDesignation={true}
                                  designation={designationForEmployee[employee.id] || 'dipping'}
                                  onDesignationChange={(designation) => 
                                    setDesignationForEmployee(prev => ({
                                      ...prev,
                                      [employee.id]: designation
                                    }))
                                  }
                                />
                              </div>
                            );
                          })}
                        </div>

                        {/* Desktop/Table View */}
                        <div className="hidden md:block">
                          <ScrollArea className="h-[500px]">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[50px]">
                                    <Checkbox 
                                      checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                                      onCheckedChange={handleSelectAll}
                                    />
                                  </TableHead>
                                  <TableHead>Employee</TableHead>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Designation</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Check In</TableHead>
                                  <TableHead>Check Out</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredEmployees.map((employee) => {
                                  const todayRecord = getAttendanceForDate.find(r => r.employeeId === employee.id);
                                  const isSelected = selectedEmployees.includes(employee.id);
                                  const StatusIcon = todayRecord ? statusInfo[todayRecord.status as keyof typeof statusInfo]?.icon : Clock;
                                  const statusColor = todayRecord ? statusInfo[todayRecord.status as keyof typeof statusInfo]?.color : 'bg-gray-100 text-gray-800';
                                  
                                  return (
                                    <TableRow key={employee.id} className={isSelected ? 'bg-blue-50' : ''}>
                                      <TableCell>
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={() => handleEmployeeSelection(employee.id)}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-3">
                                          <Avatar className="h-8 w-8">
                                            <AvatarImage src={employee.image} />
                                            <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <div className="font-medium">{employee.name}</div>
                                            <div className="text-sm text-muted-foreground">{employee.role}</div>
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="outline">{employee.contract}</Badge>
                                      </TableCell>
                                      <TableCell>
                                        {employee.contract === 'Contract' ? (
                                          <Select 
                                            value={designationForEmployee[employee.id] || 'dipping'} 
                                            onValueChange={(value: Designation) => 
                                              setDesignationForEmployee(prev => ({
                                                ...prev,
                                                [employee.id]: value
                                              }))
                                            }
                                          >
                                            <SelectTrigger className="h-8 w-[140px] text-xs">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {Object.entries(designationLabels).map(([value, label]) => (
                                                <SelectItem key={value} value={value} className="text-xs">
                                                  {label}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        ) : (
                                          <span className="text-muted-foreground">-</span>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {todayRecord ? (
                                          <Badge className={statusColor}>
                                            {StatusIcon && <StatusIcon className="w-3 h-3 mr-1" />}
                                            {todayRecord.status}
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline">No Record</Badge>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {todayRecord?.clockInTime ? (
                                          <div className="text-green-600 text-sm">
                                            {format(parseISO(todayRecord.clockInTime), 'HH:mm')}
                                          </div>
                                        ) : (
                                          <span className="text-muted-foreground text-sm">-</span>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {todayRecord?.clockOutTime ? (
                                          <div className="text-red-600 text-sm">
                                            {format(parseISO(todayRecord.clockOutTime), 'HH:mm')}
                                          </div>
                                        ) : (
                                          <span className="text-muted-foreground text-sm">-</span>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex gap-2">
                                          {(!todayRecord || todayRecord.status === 'Absent' || todayRecord.status === 'On Leave') ? (
                                            <>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-xs"
                                                onClick={() => {
                                                  const designation = employee.contract === 'Contract' ? 
                                                    (designationForEmployee[employee.id] || 'dipping') : 
                                                    undefined;
                                                  handleCheckIn(employee.id, false, designation);
                                                }}
                                              >
                                                <LogIn className="w-3 h-3 mr-1" />
                                                Check In
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-xs"
                                                onClick={() => handleMarkAbsent(employee.id)}
                                              >
                                                <XCircle className="w-3 h-3 mr-1" />
                                                Absent
                                              </Button>
                                            </>
                                          ) : (todayRecord.status === 'Present' || todayRecord.status === 'Late') && !todayRecord.clockOutTime ? (
                                            <Button
                                              size="sm"
                                              variant="destructive"
                                              className="h-8 text-xs"
                                              onClick={() => handleCheckOut(employee.id)}
                                            >
                                              <LogOut className="w-3 h-3 mr-1" />
                                              Check Out
                                            </Button>
                                          ) : (
                                            <span className="text-muted-foreground text-sm">Completed</span>
                                          )}
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </ScrollArea>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Employees Tab */}
            <TabsContent value="employees" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle>All Employees</CardTitle>
                      <CardDescription>
                        Manage your employee directory. Total: {employees.length} employees
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search employees..."
                          className="pl-8 w-full md:w-[250px]"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <Select value={activeFilter} onValueChange={(value) => setActiveFilter(value as any)}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Filter by contract" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All Contracts</SelectItem>
                          <SelectItem value="Full-time">Full-time</SelectItem>
                          <SelectItem value="Part-time">Part-time</SelectItem>
                          <SelectItem value="Contract">Contract</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={exportEmployeeCSV} variant="outline">
                        <Download className="mr-2 w-4 h-4" />
                        Export CSV
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {employees.length > 0 ? (
                    <ScrollArea className="h-[500px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employee ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredEmployees.map((employee) => (
                            <TableRow key={employee.id}>
                              <TableCell className="font-medium">
                                {employee.employeeId || 'N/A'}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={employee.image} />
                                    <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                                  </Avatar>
                                  <span>{employee.name}</span>
                                </div>
                              </TableCell>
                              <TableCell>{employee.email}</TableCell>
                              <TableCell>
                                <Badge variant={
                                  employee.contract === 'Full-time' ? 'default' :
                                  employee.contract === 'Part-time' ? 'secondary' : 'outline'
                                }>
                                  {employee.contract}
                                </Badge>
                              </TableCell>
                              <TableCell>{employee.role}</TableCell>
                              <TableCell>
                                <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                                  {employee.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{employee.phone || '-'}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedEmployee(employee);
                                      setActiveTab('overview');
                                    }}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingEmployee(employee);
                                      setNewEmployee({
                                        name: employee.name,
                                        email: employee.email,
                                        role: employee.role,
                                        contract: employee.contract,
                                        idNumber: employee.id_number || '',
                                        phone: employee.phone || '',
                                        status: employee.status,
                                        performance: employee.performance,
                                        rating: employee.rating,
                                        salary: employee.salary || '',
                                        image: employee.image || '',
                                        issueDate: employee.issue_date || '',
                                        expiryDate: employee.expiry_date || '',
                                        company: employee.company || 'Harir International'
                                      });
                                      setIsEditDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteEmployee(employee.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No employees found</h3>
                      <p className="text-muted-foreground mb-4">Add your first employee to get started</p>
                      <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <PlusCircle className="mr-2" />
                        Add Employee
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Attendance History Tab */}
            <TabsContent value="attendance" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance History</CardTitle>
                  <CardDescription>
                    View and filter attendance records. Download reports as CSV.
                  </CardDescription>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !dateRange.from && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.from ? (
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
                            defaultMonth={dateRange.from}
                            selected={{
                              from: dateRange.from,
                              to: dateRange.to,
                            }}
                            onSelect={(range) => {
                              if (range?.from) {
                                setDateRange({
                                  from: range.from,
                                  to: range.to || range.from,
                                });
                              }
                            }}
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name..."
                          value={attendanceSearchTerm}
                          onChange={(e) => setAttendanceSearchTerm(e.target.value)}
                          className="pl-8 w-full md:w-[200px]"
                        />
                      </div>
                      
                      <Select value={attendanceEmployeeFilter} onValueChange={setAttendanceEmployeeFilter}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Employee Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="Full-time">Full-time</SelectItem>
                          <SelectItem value="Part-time">Part-time</SelectItem>
                          <SelectItem value="Contract">Contract</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select value={attendanceTypeFilter} onValueChange={setAttendanceTypeFilter}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="Present">Present</SelectItem>
                          <SelectItem value="Absent">Absent</SelectItem>
                          <SelectItem value="Late">Late</SelectItem>
                          <SelectItem value="On Leave">On Leave</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button onClick={exportToCSV}>
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredAttendance.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No attendance records</h3>
                      <p className="text-muted-foreground">Attendance records will appear here after check-ins</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[500px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Employee</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Check In</TableHead>
                            <TableHead>Check Out</TableHead>
                            <TableHead>Designation</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Hours</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAttendance.map((record) => {
                            const employee = employees.find(emp => emp.id === record.employeeId);
                            let hoursWorked = 'N/A';
                            
                            if (record.clockInTime && record.clockOutTime) {
                              const inTime = parseISO(record.clockInTime);
                              const outTime = parseISO(record.clockOutTime);
                              const hours = differenceInHours(outTime, inTime);
                              hoursWorked = `${hours} hours`;
                            }
                            
                            const StatusIcon = statusInfo[record.status as keyof typeof statusInfo]?.icon || Clock;
                            const statusColor = statusInfo[record.status as keyof typeof statusInfo]?.color || 'bg-gray-100 text-gray-800';
                            
                            return (
                              <TableRow key={record.id}>
                                <TableCell className="font-medium">
                                  {format(parseISO(record.date), 'MMM dd, yyyy')}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={employee?.image} />
                                      <AvatarFallback>{getInitials(employee?.name || '')}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium">{employee?.name || 'Unknown'}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {employee?.employeeId || record.employeeId}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {employee?.contract || 'Unknown'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {record.clockInTime ? format(parseISO(record.clockInTime), 'HH:mm') : '-'}
                                </TableCell>
                                <TableCell>
                                  {record.clockOutTime ? format(parseISO(record.clockOutTime), 'HH:mm') : '-'}
                                </TableCell>
                                <TableCell>
                                  {record.designation ? (
                                    <Badge className={designationColors[record.designation]}>
                                      {designationLabels[record.designation]}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge className={statusColor}>
                                    <StatusIcon className="w-3 h-3 mr-1" />
                                    {record.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>{hoursWorked}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Edit Employee Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Employee</DialogTitle>
                <DialogDescription>
                  Update the details for {editingEmployee?.name}.
                </DialogDescription>
              </DialogHeader>
              <CreateEmployeeForm 
                employee={editingEmployee} 
                onUpdate={handleUpdateEmployee} 
              />
            </DialogContent>
          </Dialog>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}