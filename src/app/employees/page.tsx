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
  ChevronLeft, ChevronRight, DownloadCloud, UploadCloud, BarChart,
  DoorOpen, DoorClosed, MapPin, ListChecks
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
import { format, parseISO, addDays, differenceInHours, startOfDay, endOfDay, isToday, isSameDay, eachDayOfInterval, differenceInDays } from 'date-fns';
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

// Employee Check Card for Gate In Tab
interface EmployeeCheckCardProps {
  employee: Employee;
  todayRecord?: Attendance;
  onCheckIn: (employeeId: string, isLate?: boolean) => void;
  onMarkAbsent: (employeeId: string) => void;
  onMarkOnLeave: (employeeId: string) => void;
  showActions?: boolean;
}

const EmployeeCheckCard: React.FC<EmployeeCheckCardProps> = ({
  employee,
  todayRecord,
  onCheckIn,
  onMarkAbsent,
  onMarkOnLeave,
  showActions = true
}) => {
  const isPresent = todayRecord?.status === 'Present' || todayRecord?.status === 'Late';
  const isAbsent = todayRecord?.status === 'Absent';
  const isOnLeave = todayRecord?.status === 'On Leave';
  const isCheckedIn = !!todayRecord?.clockInTime;
  
  const StatusIcon = todayRecord ? statusInfo[todayRecord.status as keyof typeof statusInfo]?.icon : Clock;
  const statusColor = todayRecord ? statusInfo[todayRecord.status as keyof typeof statusInfo]?.color : 'bg-gray-100 text-gray-800';
  
  const currentTime = new Date();
  const isMorning = currentTime.getHours() < 12;
  const isAfternoon = currentTime.getHours() >= 12 && currentTime.getHours() < 17;
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12 border">
              <AvatarImage src={employee.image} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(employee.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-base">{employee.name}</div>
              <div className="text-sm text-muted-foreground">{employee.role}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {employee.contract}
                </Badge>
                {todayRecord && (
                  <Badge className={`${statusColor} text-xs font-medium`}>
                    {StatusIcon && <StatusIcon className="w-3 h-3 mr-1" />}
                    {todayRecord.status}
                  </Badge>
                )}
                {employee.contract === 'Contract' && todayRecord?.designation && (
                  <Badge variant="secondary" className="text-xs">
                    <MapPin className="w-3 h-3 mr-1" />
                    {designationLabels[todayRecord.designation]}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            {todayRecord?.clockInTime && (
              <div className="text-sm text-green-600 font-medium">
                <CheckCircle className="w-3 h-3 inline mr-1" />
                {format(parseISO(todayRecord.clockInTime), 'HH:mm')}
              </div>
            )}
            {!todayRecord && (
              <div className="text-sm text-gray-400">
                <Clock className="w-3 h-3 inline mr-1" />
                Not checked in
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        {showActions && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {!todayRecord || (!isPresent && !isAbsent && !isOnLeave) ? (
              <>
                <Button
                  size="sm"
                  className="h-9 text-sm bg-green-600 hover:bg-green-700"
                  onClick={() => onCheckIn(employee.id, false)}
                >
                  <DoorOpen className="w-4 h-4 mr-1" />
                  Check In
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 text-sm"
                  onClick={() => onMarkAbsent(employee.id)}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Absent
                </Button>
              </>
            ) : isPresent && !isCheckedIn ? (
              <div className="col-span-2 text-center text-sm text-green-600 font-medium">
                <CheckCircle className="w-4 h-4 inline mr-1" />
                Already checked in for today
              </div>
            ) : isAbsent ? (
              <>
                <Button
                  size="sm"
                  className="h-9 text-sm bg-green-600 hover:bg-green-700"
                  onClick={() => onCheckIn(employee.id, isAfternoon)}
                >
                  <LogIn className="w-4 h-4 mr-1" />
                  {isAfternoon ? 'Check In Late' : 'Check In'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 text-sm"
                  onClick={() => onMarkOnLeave(employee.id)}
                >
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  On Leave
                </Button>
              </>
            ) : isOnLeave ? (
              <>
                <Button
                  size="sm"
                  className="h-9 text-sm bg-green-600 hover:bg-green-700"
                  onClick={() => onCheckIn(employee.id, isAfternoon)}
                >
                  <LogIn className="w-4 h-4 mr-1" />
                  {isAfternoon ? 'Check In Late' : 'Check In'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 text-sm"
                  onClick={() => onMarkAbsent(employee.id)}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Absent
                </Button>
              </>
            ) : (
              <div className="col-span-2 text-center text-sm text-muted-foreground">
                Already checked out for today
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Designation Card for Assign Designation Tab
interface DesignationCardProps {
  employee: Employee;
  todayRecord?: Attendance;
  designation?: Designation;
  onDesignationChange: (designation: Designation) => void;
  disabled?: boolean;
}

const DesignationCard: React.FC<DesignationCardProps> = ({
  employee,
  todayRecord,
  designation = 'dipping',
  onDesignationChange,
  disabled = false
}) => {
  const isPresent = todayRecord?.status === 'Present' || todayRecord?.status === 'Late';
  const hasCheckedIn = !!todayRecord?.clockInTime;
  
  return (
    <Card className={cn(
      "overflow-hidden transition-all",
      disabled && "opacity-60",
      !hasCheckedIn && "border-amber-200"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12 border">
              <AvatarImage src={employee.image} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(employee.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-base">{employee.name}</div>
              <div className="text-sm text-muted-foreground">{employee.role}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {employee.contract}
                </Badge>
                {todayRecord && (
                  <Badge className={cn(
                    "text-xs font-medium",
                    isPresent ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  )}>
                    {isPresent ? 'Present' : todayRecord.status}
                  </Badge>
                )}
                {hasCheckedIn ? (
                  <Badge variant="default" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Checked In
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Not Checked In
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            {todayRecord?.clockInTime && (
              <div className="text-sm text-green-600 font-medium">
                {format(parseISO(todayRecord.clockInTime), 'HH:mm')}
              </div>
            )}
          </div>
        </div>
        
        {/* Designation Selector */}
        <div className="mt-4">
          <Label className="text-sm font-medium mb-2 block">Assign Designation</Label>
          <Select 
            value={designation} 
            onValueChange={(value: Designation) => onDesignationChange(value)}
            disabled={disabled || !hasCheckedIn}
          >
            <SelectTrigger className={cn(
              "h-10",
              !hasCheckedIn && "border-amber-300 text-amber-600"
            )}>
              <SelectValue placeholder="Select designation" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(designationLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      value === 'dipping' && "bg-blue-500",
                      value === 'intake' && "bg-green-500",
                      value === 'qualityControl' && "bg-yellow-500",
                      value === 'qualityAssurance' && "bg-purple-500",
                      value === 'packing' && "bg-pink-500",
                      value === 'loading' && "bg-indigo-500",
                      value === 'palletizing' && "bg-orange-500",
                      value === 'porter' && "bg-cyan-500"
                    )} />
                    {label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!hasCheckedIn && (
            <p className="text-xs text-amber-600 mt-2">
              Employee must check in first before assigning designation
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Gate Out Card for Gate Out Tab
interface GateOutCardProps {
  employee: Employee;
  todayRecord?: Attendance;
  onCheckOut: (employeeId: string) => void;
  disabled?: boolean;
}

const GateOutCard: React.FC<GateOutCardProps> = ({
  employee,
  todayRecord,
  onCheckOut,
  disabled = false
}) => {
  const hasCheckedIn = !!todayRecord?.clockInTime;
  const hasCheckedOut = !!todayRecord?.clockOutTime;
  const hasDesignation = !!todayRecord?.designation;
  
  // Only contract employees require designation
  const requiresDesignation = employee.contract === 'Contract';
  const canCheckOut = hasCheckedIn && !hasCheckedOut && (!requiresDesignation || hasDesignation);
  
  return (
    <Card className={cn(
      "overflow-hidden transition-all",
      disabled && "opacity-60",
      !hasCheckedIn && "border-amber-200",
      requiresDesignation && !hasDesignation && hasCheckedIn && "border-orange-200"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12 border">
              <AvatarImage src={employee.image} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(employee.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-base">{employee.name}</div>
              <div className="text-sm text-muted-foreground">{employee.role}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {employee.contract}
                </Badge>
                {hasDesignation && todayRecord?.designation && (
                  <Badge className={cn(
                    "text-xs font-medium",
                    designationColors[todayRecord.designation]
                  )}>
                    <MapPin className="w-3 h-3 mr-1" />
                    {designationLabels[todayRecord.designation]}
                  </Badge>
                )}
                {hasCheckedIn ? (
                  hasCheckedOut ? (
                    <Badge variant="default" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Checked Out
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      <LogIn className="w-3 h-3 mr-1" />
                      Checked In
                    </Badge>
                  )
                ) : (
                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Not Checked In
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-right space-y-1">
            {todayRecord?.clockInTime && (
              <div className="text-sm text-green-600 font-medium">
                In: {format(parseISO(todayRecord.clockInTime), 'HH:mm')}
              </div>
            )}
            {todayRecord?.clockOutTime && (
              <div className="text-sm text-red-600 font-medium">
                Out: {format(parseISO(todayRecord.clockOutTime), 'HH:mm')}
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="mt-4">
          {hasCheckedIn && !hasCheckedOut ? (
            <Button
              size="sm"
              className="h-10 w-full text-sm bg-red-600 hover:bg-red-700"
              onClick={() => onCheckOut(employee.id)}
              disabled={disabled || (requiresDesignation && !hasDesignation)}
            >
              <DoorClosed className="w-4 h-4 mr-2" />
              {requiresDesignation && !hasDesignation ? "Assign Designation First" : "Check Out"}
            </Button>
          ) : hasCheckedOut ? (
            <div className="text-center text-sm text-green-600 font-medium p-2 border border-green-200 rounded-md bg-green-50">
              <CheckCircle className="w-4 h-4 inline mr-1" />
              Already checked out for today
            </div>
          ) : (
            <div className="text-center text-sm text-amber-600 font-medium p-2 border border-amber-200 rounded-md bg-amber-50">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              Check in first to enable gate out
            </div>
          )}
          
          {requiresDesignation && !hasDesignation && hasCheckedIn && (
            <p className="text-xs text-orange-600 mt-2 text-center">
              Designation must be assigned before checking out
            </p>
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

// Helper function to determine shift type based on hours worked
const getShiftType = (clockInTime?: string, clockOutTime?: string): string => {
  if (!clockInTime || !clockOutTime) return 'N/A';
  
  const inTime = parseISO(clockInTime);
  const outTime = parseISO(clockOutTime);
  const hoursWorked = differenceInHours(outTime, inTime);
  
  if (hoursWorked >= 8) return 'Full';
  if (hoursWorked >= 4) return 'Half';
  return 'Short';
};

// Helper function to calculate number of days in date range
const getNumberOfDays = (from: Date, to: Date): number => {
  return differenceInDays(to, from) + 1;
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

  // Tab state
  const [activeTab, setActiveTab] = useState('overview');
  const [today, setToday] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Gate In/Out state
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

  // Filter employees for Gate In (not checked in yet)
  const gateInEmployees = useMemo(() => {
    return filteredEmployees.filter(employee => {
      const todayRecord = getAttendanceForDate.find(r => r.employeeId === employee.id);
      return !todayRecord || !todayRecord.clockInTime;
    });
  }, [filteredEmployees, getAttendanceForDate]);

  // Filter employees for Assign Designation (checked in but no designation for contract employees)
  const assignDesignationEmployees = useMemo(() => {
    return filteredEmployees.filter(employee => {
      const todayRecord = getAttendanceForDate.find(r => r.employeeId === employee.id);
      const hasCheckedIn = todayRecord?.clockInTime;
      const hasDesignation = todayRecord?.designation;
      
      // Only show contract employees who have checked in but don't have a designation
      return employee.contract === 'Contract' && hasCheckedIn && !hasDesignation;
    });
  }, [filteredEmployees, getAttendanceForDate]);

  // Filter employees for Gate Out (checked in, have designation if contract, not checked out)
  const gateOutEmployees = useMemo(() => {
    return filteredEmployees.filter(employee => {
      const todayRecord = getAttendanceForDate.find(r => r.employeeId === employee.id);
      const hasCheckedIn = todayRecord?.clockInTime;
      const hasCheckedOut = todayRecord?.clockOutTime;
      const hasDesignation = todayRecord?.designation;
      
      // For contract employees: must have checked in, have designation, and not checked out
      // For permanent employees (Full-time, Part-time): just need to be checked in and not checked out
      const requiresDesignation = employee.contract === 'Contract';
      
      if (requiresDesignation) {
        return hasCheckedIn && hasDesignation && !hasCheckedOut;
      } else {
        return hasCheckedIn && !hasCheckedOut;
      }
    });
  }, [filteredEmployees, getAttendanceForDate]);

  // Calculate statistics
  const stats = useMemo(() => {
    const fullTimeEmployees = employees.filter(emp => emp.contract === 'Full-time');
    const partTimeEmployees = employees.filter(emp => emp.contract === 'Part-time');
    const contractEmployees = employees.filter(emp => emp.contract === 'Contract');
    
    const todayAttendance = getAttendanceForDate;
    const presentToday = todayAttendance.filter(record => record.status === 'Present' || record.status === 'Late').length;
    const lateToday = todayAttendance.filter(record => record.status === 'Late').length;
    const absentToday = todayAttendance.filter(record => record.status === 'Absent').length;
    const onLeaveToday = todayAttendance.filter(record => record.status === 'On Leave').length;
    const checkedOutToday = todayAttendance.filter(record => record.clockOutTime).length;
    const checkedInToday = todayAttendance.filter(record => record.clockInTime && !record.clockOutTime).length;
    const pendingDesignation = todayAttendance.filter(record => 
      record.clockInTime && 
      !record.clockOutTime && 
      record.employee && 
      record.employee.contract === 'Contract' && 
      !record.designation
    ).length;
    
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
      pendingDesignation,
      attendanceRate,
      pendingCheckIn: employees.length - (presentToday + absentToday + onLeaveToday)
    };
  }, [employees, getAttendanceForDate]);

  // Handle check in
  const handleCheckIn = async (employeeId: string, isLate: boolean = false) => {
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
            clockInTime: checkInTime
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

  // Handle assign designation
  const handleAssignDesignation = async (employeeId: string, designation: Designation) => {
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
      
      // Find existing attendance record
      const existingRecord = getAttendanceForDate.find(record => 
        record.employeeId === employeeId && record.date === dateStr
      );
      
      if (!existingRecord) {
        toast({
          title: 'Error',
          description: 'No attendance record found for today',
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
          clockInTime: existingRecord.clockInTime,
          designation: designation
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign designation');
      }

      const data = await response.json();
      
      // Update local state
      setAttendance(prev => prev.map(record => 
        record.id === existingRecord.id ? data : record
      ));

      toast({
        title: 'Designation Assigned',
        description: `${employee.name} assigned to ${designationLabels[designation]}`,
      });
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign designation',
        variant: 'destructive',
      });
    }
  };

  // Bulk check-in for all pending
  const handleBulkCheckInAll = async () => {
    const employeesToCheckIn = gateInEmployees;
    
    if (employeesToCheckIn.length === 0) {
      toast({
        title: 'No employees to check in',
        description: 'All employees are already checked in for today',
        variant: 'default',
      });
      return;
    }

    const currentHour = new Date().getHours();
    const isLate = currentHour >= 9; // Late if after 9 AM
    
    let successCount = 0;
    let failedCount = 0;

    for (const employee of employeesToCheckIn) {
      try {
        await handleCheckIn(employee.id, isLate);
        successCount++;
      } catch (error) {
        failedCount++;
      }
    }

    toast({
      title: 'Bulk Check-in Complete',
      description: `Successfully checked in ${successCount} employees. ${failedCount > 0 ? `${failedCount} failed.` : ''}`,
      variant: failedCount > 0 ? 'destructive' : 'default',
    });
  };

  // Bulk check-out for all ready
  const handleBulkCheckOutAll = async () => {
    const employeesToCheckOut = gateOutEmployees;
    
    if (employeesToCheckOut.length === 0) {
      toast({
        title: 'No employees to check out',
        description: 'No employees are ready for check out',
        variant: 'default',
      });
      return;
    }

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
      description: `Successfully checked out ${successCount} employees. ${failedCount > 0 ? `${failedCount} failed.` : ''}`,
      variant: failedCount > 0 ? 'destructive' : 'default',
    });
  };

  // Bulk assign designation
  const handleBulkAssignDesignation = async () => {
    const employeesToAssign = assignDesignationEmployees;
    
    if (employeesToAssign.length === 0) {
      toast({
        title: 'No employees need designation',
        description: 'All contract employees already have designations assigned',
        variant: 'default',
      });
      return;
    }

    let successCount = 0;
    let failedCount = 0;

    for (const employee of employeesToAssign) {
      try {
        const designation = designationForEmployee[employee.id] || bulkDesignation;
        await handleAssignDesignation(employee.id, designation);
        successCount++;
      } catch (error) {
        failedCount++;
      }
    }

    toast({
      title: 'Bulk Designation Complete',
      description: `Successfully assigned designations to ${successCount} employees. ${failedCount > 0 ? `${failedCount} failed.` : ''}`,
      variant: failedCount > 0 ? 'destructive' : 'default',
    });
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
      checkedInToday: {
        title: 'Checked In',
        value: String(stats.checkedInToday),
        change: `${stats.checkedOutToday} checked out`,
        changeType: 'increase' as const,
      },
      pendingActions: {
        title: 'Pending Actions',
        value: String(stats.pendingCheckIn + stats.pendingDesignation),
        change: `${stats.pendingCheckIn} check-in, ${stats.pendingDesignation} designation`,
        changeType: 'decrease' as const,
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

  // Export attendance to CSV with enhanced headers
  const exportToCSV = () => {
    if (filteredAttendance.length === 0) {
      toast({
        title: 'No Data',
        description: 'No attendance records found for the selected filter.',
        variant: 'destructive',
      });
      return;
    }

    // Calculate number of days in the date range
    const numberOfDays = getNumberOfDays(dateRange.from, dateRange.to);
    
    // Create the header row
    const headers = [
      'From Date',
      'To Date',
      'Name', 
      'ID Number', 
      'Tel Number', 
      'Designation', 
      'Shift(Full/Half)', 
      'Number of days'
    ];
    
    // Group attendance by employee for the date range
    const employeeAttendanceMap = new Map<string, any[]>();
    
    filteredAttendance.forEach(record => {
      const employee = employees.find(emp => emp.id === record.employeeId);
      if (!employee) return;
      
      if (!employeeAttendanceMap.has(employee.id)) {
        employeeAttendanceMap.set(employee.id, []);
      }
      
      employeeAttendanceMap.get(employee.id)?.push({
        date: record.date,
        shift: getShiftType(record.clockInTime, record.clockOutTime),
        designation: record.designation ? designationLabels[record.designation] : 'N/A'
      });
    });
    
    // Create CSV data rows
    const csvData = Array.from(employeeAttendanceMap.entries()).map(([employeeId, records]) => {
      const employee = employees.find(emp => emp.id === employeeId);
      if (!employee) return null;
      
      // Get unique designations for this employee in the date range
      const designations = [...new Set(records.map(r => r.designation))].filter(d => d !== 'N/A');
      const designation = designations.length > 0 ? designations.join(', ') : 'N/A';
      
      // Get most common shift type
      const shiftCounts = records.reduce((acc, record) => {
        acc[record.shift] = (acc[record.shift] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const mostCommonShift = Object.entries(shiftCounts).sort((a, b) => b[1] - a[1])[0];
      const shift = mostCommonShift ? `${mostCommonShift[0]} (${mostCommonShift[1]} days)` : 'N/A';
      
      return [
        format(dateRange.from, 'yyyy-MM-dd'),
        format(dateRange.to, 'yyyy-MM-dd'),
        employee?.name || 'Unknown',
        employee?.id_number || 'N/A',
        employee?.phone || 'N/A',
        designation,
        shift,
        numberOfDays.toString()
      ];
    }).filter(row => row !== null);
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row!.map(cell => escapeCsvField(cell)).join(','))
    ].join('\n');

    // Download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${format(dateRange.from, 'yyyy-MM-dd')}_to_${format(dateRange.to, 'yyyy-MM-dd')}.csv`;
    a.click();
    
    toast({
      title: 'CSV Exported',
      description: 'Attendance report has been downloaded.',
    });
  };

  // Export employee list to CSV with enhanced headers
  const exportEmployeeCSV = () => {
    if (employees.length === 0) {
      toast({
        title: 'No Data',
        description: 'No employees found.',
        variant: 'destructive',
      });
      return;
    }

    // Get current date for the report
    const reportDate = new Date();
    
    // Create the header row
    const headers = [
      'Report Date',
      'Name', 
      'ID Number', 
      'Tel Number', 
      'Designation', 
      'Shift(Full/Half)', 
      'Contract Type',
      'Status'
    ];
    
    // Create CSV data rows
    const csvData = employees.map(employee => {
      // Determine shift based on contract type
      const shift = employee.contract === 'Full-time' ? 'Full' : 
                   employee.contract === 'Part-time' ? 'Half' : 'Varies';
      
      return [
        format(reportDate, 'yyyy-MM-dd'),
        employee.name || 'N/A',
        employee.id_number || 'N/A',
        employee.phone || 'N/A',
        employee.role || 'N/A',
        shift,
        employee.contract,
        employee.status
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
    a.download = `employee_directory_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    
    toast({
      title: 'CSV Exported',
      description: 'Employee directory has been downloaded.',
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
                Manage employee attendance, designations, and daily operations.
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
                    <UserPlus className="mr-2" />
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

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart className="w-4 h-4" />
                <span className="hidden md:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="gate-in" className="flex items-center gap-2">
                <DoorOpen className="w-4 h-4" />
                <span className="hidden md:inline">Gate In</span>
              </TabsTrigger>
              <TabsTrigger value="assign-designation" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="hidden md:inline">Assign Designation</span>
              </TabsTrigger>
              <TabsTrigger value="gate-out" className="flex items-center gap-2">
                <DoorClosed className="w-4 h-4" />
                <span className="hidden md:inline">Gate Out</span>
              </TabsTrigger>
              <TabsTrigger value="employees" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden md:inline">Employees</span>
              </TabsTrigger>
              <TabsTrigger value="attendance" className="flex items-center gap-2">
                <ListChecks className="w-4 h-4" />
                <span className="hidden md:inline">Attendance Log</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiData ? (
                  <>
                    <OverviewCard data={kpiData.totalEmployees} icon={Users} />
                    <OverviewCard data={kpiData.presentToday} icon={CheckCircle} />
                    <OverviewCard data={kpiData.checkedInToday} icon={LogIn} />
                    <OverviewCard data={kpiData.pendingActions} icon={AlertCircle} />
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

              {/* Quick Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Today's Status</CardTitle>
                    <CardDescription>
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Present</span>
                          <Badge variant="default">{stats.presentToday}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Absent</span>
                          <Badge variant="destructive">{stats.absentToday}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">On Leave</span>
                          <Badge variant="secondary">{stats.onLeaveToday}</Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Checked In</span>
                          <Badge variant="default">{stats.checkedInToday}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Checked Out</span>
                          <Badge variant="outline">{stats.checkedOutToday}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Late</span>
                          <Badge variant="secondary">{stats.lateToday}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Employee Distribution</CardTitle>
                    <CardDescription>
                      Breakdown by contract type
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Full-time</span>
                          <span className="text-sm text-muted-foreground">{stats.fullTimeCount}</span>
                        </div>
                        <Progress value={(stats.fullTimeCount / stats.totalEmployees) * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Part-time</span>
                          <span className="text-sm text-muted-foreground">{stats.partTimeCount}</span>
                        </div>
                        <Progress value={(stats.partTimeCount / stats.totalEmployees) * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Contract</span>
                          <span className="text-sm text-muted-foreground">{stats.contractCount}</span>
                        </div>
                        <Progress value={(stats.contractCount / stats.totalEmployees) * 100} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Perform bulk operations for today
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      onClick={handleBulkCheckInAll}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={gateInEmployees.length === 0}
                    >
                      <DoorOpen className="mr-2 w-4 h-4" />
                      Check In All ({gateInEmployees.length})
                    </Button>
                    
                    <Button 
                      onClick={handleBulkAssignDesignation}
                      variant="outline"
                      disabled={assignDesignationEmployees.length === 0}
                    >
                      <MapPin className="mr-2 w-4 h-4" />
                      Assign Designations ({assignDesignationEmployees.length})
                    </Button>
                    
                    <Button 
                      onClick={handleBulkCheckOutAll}
                      variant="destructive"
                      disabled={gateOutEmployees.length === 0}
                    >
                      <DoorClosed className="mr-2 w-4 h-4" />
                      Check Out All ({gateOutEmployees.length})
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Gate In Tab */}
            <TabsContent value="gate-in" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <DoorOpen className="w-5 h-5" />
                        Gate In - Daily Check In
                      </CardTitle>
                      <CardDescription>
                        Check in employees for today. Employees can be marked as Present, Late, Absent, or On Leave.
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
                      
                      <Button
                        onClick={handleBulkCheckInAll}
                        disabled={gateInEmployees.length === 0}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <DoorOpen className="mr-2 w-4 h-4" />
                        Check In All
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
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
                          <div className="text-2xl font-bold text-amber-600">
                            {gateInEmployees.length}
                          </div>
                          <div className="text-sm text-muted-foreground">Pending Check-in</div>
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
                          <div className="text-2xl font-bold text-blue-600">
                            {stats.onLeaveToday}
                          </div>
                          <div className="text-sm text-muted-foreground">On Leave</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Employee Grid */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Employees Pending Check-in ({gateInEmployees.length})</h3>
                        <Badge variant="outline">
                          {format(selectedDate, 'MMM d, yyyy')}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
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
                            placeholder="Search employees..."
                            className="pl-8 h-8 text-sm w-[150px]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {gateInEmployees.length === 0 ? (
                      <div className="text-center py-12 border rounded-lg">
                        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                        <h3 className="text-lg font-semibold mb-2">All employees checked in!</h3>
                        <p className="text-muted-foreground">All employees have been checked in for today.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {gateInEmployees.map((employee) => {
                          const todayRecord = getAttendanceForDate.find(r => r.employeeId === employee.id);
                          
                          return (
                            <EmployeeCheckCard
                              key={employee.id}
                              employee={employee}
                              todayRecord={todayRecord}
                              onCheckIn={handleCheckIn}
                              onMarkAbsent={handleMarkAbsent}
                              onMarkOnLeave={handleMarkOnLeave}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assign Designation Tab */}
            <TabsContent value="assign-designation" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Assign Designation
                      </CardTitle>
                      <CardDescription>
                        Assign work areas to contract employees who have checked in. Designation is required before gate out.
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
                        
                        <Button
                          variant="outline"
                          className="w-[200px] justify-start text-left font-normal"
                          disabled
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(selectedDate, "EEEE, MMMM d, yyyy")}
                        </Button>
                        
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
                        onClick={handleBulkAssignDesignation}
                        disabled={assignDesignationEmployees.length === 0}
                        size="sm"
                      >
                        <MapPin className="mr-2 w-4 h-4" />
                        Assign All
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Date Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {assignDesignationEmployees.length}
                          </div>
                          <div className="text-sm text-muted-foreground">Need Designation</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {stats.contractCount - assignDesignationEmployees.length}
                          </div>
                          <div className="text-sm text-muted-foreground">Assigned</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-amber-600">
                            {stats.contractCount}
                          </div>
                          <div className="text-sm text-muted-foreground">Total Contract</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Designation Legend */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Designation Legend</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(designationLabels).map(([key, label]) => (
                        <Badge key={key} className={designationColors[key as Designation]}>
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Employee Grid */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Contract Employees Needing Designation ({assignDesignationEmployees.length})</h3>
                        <Badge variant="outline">
                          {format(selectedDate, 'MMM d, yyyy')}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Select value={bulkDesignation} onValueChange={(value: Designation) => setBulkDesignation(value)}>
                          <SelectTrigger className="w-[150px] h-8 text-xs">
                            <SelectValue placeholder="Bulk Designation" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(designationLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value} className="text-xs">
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                          <Input
                            placeholder="Search employees..."
                            className="pl-8 h-8 text-sm w-[150px]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {assignDesignationEmployees.length === 0 ? (
                      <div className="text-center py-12 border rounded-lg">
                        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                        <h3 className="text-lg font-semibold mb-2">All designations assigned!</h3>
                        <p className="text-muted-foreground">All contract employees have been assigned work areas for today.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {assignDesignationEmployees.map((employee) => {
                          const todayRecord = getAttendanceForDate.find(r => r.employeeId === employee.id);
                          const designation = designationForEmployee[employee.id] || bulkDesignation;
                          
                          return (
                            <DesignationCard
                              key={employee.id}
                              employee={employee}
                              todayRecord={todayRecord}
                              designation={designation}
                              onDesignationChange={(newDesignation) => {
                                setDesignationForEmployee(prev => ({
                                  ...prev,
                                  [employee.id]: newDesignation
                                }));
                                handleAssignDesignation(employee.id, newDesignation);
                              }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Gate Out Tab */}
            <TabsContent value="gate-out" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <DoorClosed className="w-5 h-5" />
                        Gate Out - Daily Check Out
                      </CardTitle>
                      <CardDescription>
                        Check out employees who have completed their work for the day. Contract employees must have designation assigned. Permanent employees (Full-time/Part-time) can check out without designation.
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
                        
                        <Button
                          variant="outline"
                          className="w-[200px] justify-start text-left font-normal"
                          disabled
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(selectedDate, "EEEE, MMMM d, yyyy")}
                        </Button>
                        
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
                        onClick={handleBulkCheckOutAll}
                        disabled={gateOutEmployees.length === 0}
                        size="sm"
                        variant="destructive"
                      >
                        <DoorClosed className="mr-2 w-4 h-4" />
                        Check Out All
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Date Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {gateOutEmployees.length}
                          </div>
                          <div className="text-sm text-muted-foreground">Ready to Check Out</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {stats.checkedOutToday}
                          </div>
                          <div className="text-sm text-muted-foreground">Already Checked Out</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-amber-600">
                            {assignDesignationEmployees.length}
                          </div>
                          <div className="text-sm text-muted-foreground">Need Designation</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {gateInEmployees.length}
                          </div>
                          <div className="text-sm text-muted-foreground">Not Checked In</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Employee Grid */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Employees Ready for Check Out ({gateOutEmployees.length})</h3>
                        <Badge variant="outline">
                          {format(selectedDate, 'MMM d, yyyy')}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
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
                            placeholder="Search employees..."
                            className="pl-8 h-8 text-sm w-[150px]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {gateOutEmployees.length === 0 ? (
                      <div className="text-center py-12 border rounded-lg">
                        <Clock className="w-12 h-12 mx-auto mb-4 text-amber-500" />
                        <h3 className="text-lg font-semibold mb-2">No employees ready for check out</h3>
                        <p className="text-muted-foreground">
                          Employees need to check in first. Contract employees also need designation assigned.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {gateOutEmployees.map((employee) => {
                          const todayRecord = getAttendanceForDate.find(r => r.employeeId === employee.id);
                          
                          return (
                            <GateOutCard
                              key={employee.id}
                              employee={employee}
                              todayRecord={todayRecord}
                              onCheckOut={handleCheckOut}
                            />
                          );
                        })}
                      </div>
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

            {/* Attendance Log Tab */}
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
                            <TableHead>Shift</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAttendance.map((record) => {
                            const employee = employees.find(emp => emp.id === record.employeeId);
                            let hoursWorked = 'N/A';
                            let shift = 'N/A';
                            
                            if (record.clockInTime && record.clockOutTime) {
                              const inTime = parseISO(record.clockInTime);
                              const outTime = parseISO(record.clockOutTime);
                              const hours = differenceInHours(outTime, inTime);
                              hoursWorked = `${hours} hours`;
                              shift = getShiftType(record.clockInTime, record.clockOutTime);
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
                                <TableCell>
                                  <Badge variant={shift === 'Full' ? 'default' : shift === 'Half' ? 'secondary' : 'outline'}>
                                    {shift}
                                  </Badge>
                                </TableCell>
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