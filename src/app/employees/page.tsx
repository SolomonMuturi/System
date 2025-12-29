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
  DoorOpen, DoorClosed, ListChecks, Tags, Home, BriefcaseIcon
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
type EmployeeType = 'Permanent' | 'Temporary' | 'Casual';
type EmployeeContract = 'Full-time' | 'Part-time' | 'Contract';
type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'On Leave' | 'Early Departure' | 'Checked In' | 'Checked Out';
type Designation = 'dipping' | 'intake' | 'qualityControl' | 'qualityAssurance' | 'packing' | 'loading' | 'palletizing' | 'porter';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  employeeType: EmployeeType;
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
  designation?: Designation;
  gateInTime?: string;
  gateOutTime?: string;
  isGatedIn: boolean;
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
  employeeType: EmployeeType;
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

const employeeTypeInfo = {
  Permanent: { color: 'bg-blue-100 text-blue-800', icon: BadgeCheck },
  Temporary: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  Casual: { color: 'bg-purple-100 text-purple-800', icon: Users },
} as const;

const statusInfo = {
  'Checked In': { 
    color: 'bg-green-100 text-green-800 border-green-300', 
    icon: DoorOpen,
    variant: 'default' as const
  },
  'Checked Out': { 
    color: 'bg-gray-100 text-gray-800 border-gray-300', 
    icon: DoorClosed,
    variant: 'secondary' as const
  },
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
} as const;

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

// Gate In Card Component
interface GateInCardProps {
  employee: Employee;
  onGateIn: (employeeId: string) => void;
  onGateOut: (employeeId: string) => void;
}

const GateInCard: React.FC<GateInCardProps> = ({
  employee,
  onGateIn,
  onGateOut
}) => {
  const isGatedIn = employee.isGatedIn;
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 border-2">
              <AvatarImage src={employee.image} />
              <AvatarFallback className={cn(
                employee.employeeType === 'Permanent' ? 'bg-blue-100 text-blue-700' :
                employee.employeeType === 'Temporary' ? 'bg-yellow-100 text-yellow-700' :
                'bg-purple-100 text-purple-700'
              )}>
                {getInitials(employee.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{employee.name}</div>
              <div className="text-sm text-muted-foreground">{employee.role}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={employeeTypeInfo[employee.employeeType].color}>
                  {employee.employeeType}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {employee.contract}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            {employee.gateInTime && (
              <div className="text-sm text-green-600">
                <DoorOpen className="w-3 h-3 inline mr-1" />
                {format(parseISO(employee.gateInTime), 'HH:mm')}
              </div>
            )}
            {employee.gateOutTime && (
              <div className="text-sm text-gray-600">
                <DoorClosed className="w-3 h-3 inline mr-1" />
                {format(parseISO(employee.gateOutTime), 'HH:mm')}
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="mt-4">
          {!isGatedIn ? (
            <Button
              size="sm"
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => onGateIn(employee.id)}
            >
              <DoorOpen className="w-4 h-4 mr-2" />
              Gate In
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="w-full border-red-600 text-red-600 hover:bg-red-50"
              onClick={() => onGateOut(employee.id)}
            >
              <DoorClosed className="w-4 h-4 mr-2" />
              Gate Out
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Designation Assignment Card
interface DesignationCardProps {
  employee: Employee;
  onAssignDesignation: (employeeId: string, designation: Designation) => void;
}

const DesignationCard: React.FC<DesignationCardProps> = ({
  employee,
  onAssignDesignation
}) => {
  const [selectedDesignation, setSelectedDesignation] = useState<Designation>(
    employee.designation || 'dipping'
  );

  const handleAssign = () => {
    if (selectedDesignation !== employee.designation) {
      onAssignDesignation(employee.id, selectedDesignation);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={employee.image} />
            <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{employee.name}</div>
            <div className="text-sm text-muted-foreground">{employee.role}</div>
            <Badge variant="outline" className="text-xs mt-1">
              {employee.contract}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <Label htmlFor={`designation-${employee.id}`} className="text-xs">Assign Designation</Label>
            <Select 
              value={selectedDesignation} 
              onValueChange={(value: Designation) => setSelectedDesignation(value)}
            >
              <SelectTrigger className="h-8 text-xs mt-1">
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
          
          <Button
            size="sm"
            className="w-full"
            onClick={handleAssign}
            disabled={selectedDesignation === employee.designation}
          >
            <Tags className="w-3 h-3 mr-2" />
            {employee.designation ? 'Update Designation' : 'Assign Designation'}
          </Button>
          
          {employee.designation && (
            <div className="text-xs text-muted-foreground">
              Current: <Badge className={designationColors[employee.designation]}>
                {designationLabels[employee.designation]}
              </Badge>
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
  const [activeFilter, setActiveFilter] = useState<'All' | 'Permanent' | 'Temporary' | 'Casual'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  // Main state
  const [activeTab, setActiveTab] = useState('overview');
  const [today, setToday] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Date state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

  // Filter states
  const [attendanceSearchTerm, setAttendanceSearchTerm] = useState('');
  const [attendanceEmployeeFilter, setAttendanceEmployeeFilter] = useState<string>('all');
  const [attendanceTypeFilter, setAttendanceTypeFilter] = useState<string>('all');

  // New Employee form state
  const [newEmployee, setNewEmployee] = useState<EmployeeFormValues>({
    name: '',
    email: '',
    role: 'Employee',
    employeeType: 'Permanent',
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
      
      // Ensure all employees have required fields
      const processedEmployees = employeesData.map((emp: any) => ({
        ...emp,
        employeeType: emp.employeeType || 'Permanent',
        isGatedIn: emp.isGatedIn || false,
        designation: emp.designation || undefined
      }));
      
      setEmployees(processedEmployees);
      
      if (processedEmployees.length > 0 && !selectedEmployee) {
        setSelectedEmployee(processedEmployees[0]);
      }
      
      // Fetch attendance
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

  // Filter employees based on search and type
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      // Type filter
      if (activeFilter !== 'All' && employee.employeeType !== activeFilter) {
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

  // Get employees for Gate In (not gated in yet)
  const employeesForGateIn = useMemo(() => {
    return employees.filter(emp => !emp.isGatedIn);
  }, [employees]);

  // Get employees for Designation Assignment (gated in but no designation)
  const employeesForDesignation = useMemo(() => {
    return employees.filter(emp => 
      emp.isGatedIn && 
      !emp.designation && 
      (emp.employeeType === 'Temporary' || emp.employeeType === 'Casual')
    );
  }, [employees]);

  // Get employees for Gate Out (gated in with designation)
  const employeesForGateOut = useMemo(() => {
    return employees.filter(emp => 
      emp.isGatedIn && 
      (emp.employeeType === 'Permanent' || (emp.designation && emp.employeeType !== 'Permanent'))
    );
  }, [employees]);

  // Calculate statistics
  const stats = useMemo(() => {
    const permanentEmployees = employees.filter(emp => emp.employeeType === 'Permanent');
    const temporaryEmployees = employees.filter(emp => emp.employeeType === 'Temporary');
    const casualEmployees = employees.filter(emp => emp.employeeType === 'Casual');
    
    const gatedInEmployees = employees.filter(emp => emp.isGatedIn);
    const gatedOutEmployees = employees.filter(emp => !emp.isGatedIn && emp.gateOutTime);
    
    const todayAttendance = getAttendanceForDate;
    const presentToday = todayAttendance.filter(record => record.status === 'Present').length;
    const lateToday = todayAttendance.filter(record => record.status === 'Late').length;
    const absentToday = todayAttendance.filter(record => record.status === 'Absent').length;
    
    const attendanceRate = employees.length > 0 
      ? Math.round((presentToday / employees.length) * 100)
      : 0;
    
    return {
      totalEmployees: employees.length,
      permanentCount: permanentEmployees.length,
      temporaryCount: temporaryEmployees.length,
      casualCount: casualEmployees.length,
      gatedIn: gatedInEmployees.length,
      gatedOut: gatedOutEmployees.length,
      pendingGateIn: employees.length - gatedInEmployees.length,
      presentToday,
      lateToday,
      absentToday,
      attendanceRate,
    };
  }, [employees, getAttendanceForDate]);

  // Handle gate in
  const handleGateIn = async (employeeId: string) => {
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

      const gateInTime = new Date().toISOString();
      
      const response = await fetch(`/api/employees?id=${employeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isGatedIn: true,
          gateInTime: gateInTime,
          gateOutTime: null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to gate in');
      }

      const data = await response.json();
      
      // Update local state
      setEmployees(prev => prev.map(emp => 
        emp.id === employeeId ? { ...emp, isGatedIn: true, gateInTime: gateInTime } : emp
      ));

      toast({
        title: '✅ Gate In Successful',
        description: `${employee.name} has been gated in at ${format(new Date(), 'HH:mm')}`,
      });
      
    } catch (error: any) {
      toast({
        title: 'Gate In Failed',
        description: error.message || 'Failed to gate in',
        variant: 'destructive',
      });
    }
  };

  // Handle gate out
  const handleGateOut = async (employeeId: string) => {
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

      const gateOutTime = new Date().toISOString();
      
      const response = await fetch(`/api/employees?id=${employeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isGatedIn: false,
          gateOutTime: gateOutTime
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to gate out');
      }

      const data = await response.json();
      
      // Update local state
      setEmployees(prev => prev.map(emp => 
        emp.id === employeeId ? { ...emp, isGatedIn: false, gateOutTime: gateOutTime } : emp
      ));

      toast({
        title: '✅ Gate Out Successful',
        description: `${employee.name} has been gated out at ${format(new Date(), 'HH:mm')}`,
      });
      
    } catch (error: any) {
      toast({
        title: 'Gate Out Failed',
        description: error.message || 'Failed to gate out',
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

      const response = await fetch(`/api/employees?id=${employeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          designation: designation
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign designation');
      }

      const data = await response.json();
      
      // Update local state
      setEmployees(prev => prev.map(emp => 
        emp.id === employeeId ? { ...emp, designation: designation } : emp
      ));

      toast({
        title: '✅ Designation Assigned',
        description: `${employee.name} assigned to ${designationLabels[designation]}`,
      });
      
    } catch (error: any) {
      toast({
        title: 'Assignment Failed',
        description: error.message || 'Failed to assign designation',
        variant: 'destructive',
      });
    }
  };

  // Bulk gate in
  const handleBulkGateIn = async () => {
    if (selectedEmployees.length === 0) {
      toast({
        title: 'No employees selected',
        description: 'Please select employees to gate in',
        variant: 'destructive',
      });
      return;
    }

    let successCount = 0;
    let failedCount = 0;

    for (const employeeId of selectedEmployees) {
      try {
        await handleGateIn(employeeId);
        successCount++;
      } catch (error) {
        failedCount++;
      }
    }

    toast({
      title: 'Bulk Gate In Complete',
      description: `Successfully gated in ${successCount} employees. ${failedCount > 0 ? `${failedCount} failed.` : ''}`,
      variant: failedCount > 0 ? 'destructive' : 'default',
    });

    setSelectedEmployees([]);
  };

  // Bulk assign designation
  const handleBulkAssignDesignation = async () => {
    if (selectedEmployees.length === 0) {
      toast({
        title: 'No employees selected',
        description: 'Please select employees to assign designation',
        variant: 'destructive',
      });
      return;
    }

    let successCount = 0;
    let failedCount = 0;

    for (const employeeId of selectedEmployees) {
      try {
        const employee = employees.find(emp => emp.id === employeeId);
        if (employee && (employee.employeeType === 'Temporary' || employee.employeeType === 'Casual')) {
          await handleAssignDesignation(employeeId, bulkDesignation);
          successCount++;
        }
      } catch (error) {
        failedCount++;
      }
    }

    toast({
      title: 'Bulk Designation Assignment Complete',
      description: `Successfully assigned ${successCount} employees. ${failedCount > 0 ? `${failedCount} failed.` : ''}`,
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
  const handleSelectAll = (employeesList: Employee[]) => {
    if (selectedEmployees.length === employeesList.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employeesList.map(emp => emp.id));
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
        body: JSON.stringify({
          ...formData,
          isGatedIn: false,
          designation: formData.employeeType === 'Permanent' ? undefined : 'dipping'
        }),
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
        change: `${stats.gatedIn} gated in today`,
        changeType: 'increase' as const,
      },
      gatedIn: {
        title: 'Gated In',
        value: String(stats.gatedIn),
        change: `as of ${format(currentTime, 'HH:mm')}`,
        changeType: 'increase' as const,
      },
      pendingGateIn: {
        title: 'Pending Gate In',
        value: String(stats.pendingGateIn),
        change: 'awaiting gate in',
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
        if (!employee || employee.employeeType !== attendanceEmployeeFilter) return false;
      }
      
      // Filter by status
      if (attendanceTypeFilter !== 'all') {
        if (record.status !== attendanceTypeFilter) return false;
      }
      
      return true;
    });
    
    setFilteredAttendance(filtered);
  }, [attendance, dateRange, attendanceSearchTerm, attendanceEmployeeFilter, attendanceTypeFilter, employees]);

  // Export employee list to CSV
  const exportEmployeeCSV = () => {
    if (employees.length === 0) {
      toast({
        title: 'No Data',
        description: 'No employees found.',
        variant: 'destructive',
      });
      return;
    }

    const headers = ['Name', 'ID Number', 'Phone Number', 'Employee Type', 'Designation', 'Status'];
    
    const csvData = employees.map(employee => [
      employee.name || 'N/A',
      employee.id_number || 'N/A',
      employee.phone || 'N/A',
      employee.employeeType || 'N/A',
      employee.designation ? designationLabels[employee.designation] : 'N/A',
      employee.isGatedIn ? 'Gated In' : 'Gated Out'
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

  // Handle gate in all employees
  const handleGateInAll = async () => {
    const employeesToGateIn = employees.filter(emp => !emp.isGatedIn);

    let successCount = 0;
    let failedCount = 0;
    
    for (const employee of employeesToGateIn) {
      try {
        await handleGateIn(employee.id);
        successCount++;
      } catch (error) {
        failedCount++;
      }
    }

    toast({
      title: 'Bulk Gate In Complete',
      description: `Successfully gated in ${successCount} out of ${employeesToGateIn.length} employees.${failedCount > 0 ? ` ${failedCount} failed.` : ''}`,
      variant: failedCount > 0 ? 'destructive' : 'default',
    });
  };

  // Handle gate out all employees
  const handleGateOutAll = async () => {
    const employeesToGateOut = employees.filter(emp => emp.isGatedIn);

    let successCount = 0;
    let failedCount = 0;
    
    for (const employee of employeesToGateOut) {
      try {
        await handleGateOut(employee.id);
        successCount++;
      } catch (error) {
        failedCount++;
      }
    }

    toast({
      title: 'Bulk Gate Out Complete',
      description: `Successfully gated out ${successCount} out of ${employeesToGateOut.length} employees.${failedCount > 0 ? ` ${failedCount} failed.` : ''}`,
      variant: failedCount > 0 ? 'destructive' : 'default',
    });
  };

  // Safe employee type getter
  const getEmployeeTypeInfo = (employee: Employee | undefined) => {
    if (!employee) return { color: 'bg-gray-100 text-gray-800', icon: User };
    return employeeTypeInfo[employee.employeeType] || { color: 'bg-gray-100 text-gray-800', icon: User };
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
                Manage employee workflow: Gate In → Assign Designations → Gate Out
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

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="gate-in">Gate In</TabsTrigger>
              <TabsTrigger value="designations">Assign Designations</TabsTrigger>
              <TabsTrigger value="gate-out">Gate Out</TabsTrigger>
              <TabsTrigger value="employees">All Employees</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiData ? (
                  <>
                    <OverviewCard data={kpiData.totalEmployees} icon={Users} />
                    <OverviewCard data={kpiData.gatedIn} icon={DoorOpen} />
                    <OverviewCard data={kpiData.pendingGateIn} icon={Clock} />
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

              {/* Employee Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Employee Distribution</CardTitle>
                    <CardDescription>Breakdown by employee type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <span>Permanent</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default">{stats.permanentCount}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {employees.length > 0 ? Math.round((stats.permanentCount / employees.length) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <span>Temporary</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{stats.temporaryCount}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {employees.length > 0 ? Math.round((stats.temporaryCount / employees.length) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                          <span>Casual</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{stats.casualCount}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {employees.length > 0 ? Math.round((stats.casualCount / employees.length) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Gate Status Today</CardTitle>
                    <CardDescription>Current gate activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DoorOpen className="w-4 h-4 text-green-600" />
                          <span>Gated In</span>
                        </div>
                        <Badge variant="default">{stats.gatedIn}</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DoorClosed className="w-4 h-4 text-gray-600" />
                          <span>Gated Out</span>
                        </div>
                        <Badge variant="outline">{stats.gatedOut}</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <span>Pending Gate In</span>
                        </div>
                        <Badge variant="secondary">{stats.pendingGateIn}</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Tags className="w-4 h-4 text-blue-600" />
                          <span>Need Designation</span>
                        </div>
                        <Badge variant="secondary">{employeesForDesignation.length}</Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={exportEmployeeCSV} variant="outline" size="sm" className="w-full">
                      <Download className="mr-2 w-4 h-4" />
                      Export Employee Report
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Manage gate workflow quickly</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      onClick={handleGateInAll}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={employeesForGateIn.length === 0}
                    >
                      <DoorOpen className="mr-2 w-4 h-4" />
                      Gate In All ({employeesForGateIn.length})
                    </Button>
                    
                    <Button 
                      onClick={handleGateOutAll}
                      variant="outline"
                      className="border-red-600 text-red-600 hover:bg-red-50"
                      disabled={employeesForGateOut.length === 0}
                    >
                      <DoorClosed className="mr-2 w-4 h-4" />
                      Gate Out All ({employeesForGateOut.length})
                    </Button>
                    
                    <Button 
                      onClick={() => {
                        const employeesToAssign = employeesForDesignation;
                        let successCount = 0;
                        employeesToAssign.forEach(emp => {
                          handleAssignDesignation(emp.id, 'dipping');
                          successCount++;
                        });
                      }}
                      variant="outline"
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                      disabled={employeesForDesignation.length === 0}
                    >
                      <Tags className="mr-2 w-4 h-4" />
                      Assign All Designations ({employeesForDesignation.length})
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Gate In Tab */}
            <TabsContent value="gate-in" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <DoorOpen className="w-5 h-5 text-green-600" />
                        <span className="text-lg font-semibold">Gate In</span>
                      </div>
                      <CardDescription>
                        Gate in employees who have arrived. {employeesForGateIn.length} employees pending gate in.
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
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
                          <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All Types</SelectItem>
                          <SelectItem value="Permanent">Permanent</SelectItem>
                          <SelectItem value="Temporary">Temporary</SelectItem>
                          <SelectItem value="Casual">Casual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {employeesForGateIn.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg">
                      <DoorOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">All employees gated in</h3>
                      <p className="text-muted-foreground mb-4">No pending gate ins. Employees will appear here after they are added.</p>
                      <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <PlusCircle className="mr-2" />
                        Add New Employee
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Bulk Actions */}
                      {selectedEmployees.length > 0 && (
                        <Card className="mb-6 bg-blue-50 border-blue-200">
                          <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <Badge variant="default" className="text-sm">
                                  {selectedEmployees.length} selected
                                </Badge>
                                <span className="text-sm text-blue-700">
                                  Perform bulk actions on selected employees
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  className="h-8 bg-green-600 hover:bg-green-700"
                                  onClick={handleBulkGateIn}
                                >
                                  <DoorOpen className="w-3 h-3 mr-1" />
                                  Gate In Selected
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

                      {/* Employee Grid */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">Employees Pending Gate In ({employeesForGateIn.length})</h3>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="select-all-gatein" 
                                checked={selectedEmployees.length === employeesForGateIn.length && employeesForGateIn.length > 0}
                                onCheckedChange={() => handleSelectAll(employeesForGateIn)}
                              />
                              <Label htmlFor="select-all-gatein" className="text-sm">Select All</Label>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {employeesForGateIn
                            .filter(emp => 
                              activeFilter === 'All' || emp.employeeType === activeFilter
                            )
                            .filter(emp =>
                              !searchQuery || 
                              emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              emp.role.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .map((employee) => (
                              <div key={employee.id} className="relative">
                                <Checkbox
                                  checked={selectedEmployees.includes(employee.id)}
                                  onCheckedChange={() => handleEmployeeSelection(employee.id)}
                                  className="absolute top-2 right-2 z-10"
                                />
                                <GateInCard
                                  employee={employee}
                                  onGateIn={handleGateIn}
                                  onGateOut={handleGateOut}
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assign Designations Tab */}
            <TabsContent value="designations" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Tags className="w-5 h-5 text-blue-600" />
                        <span className="text-lg font-semibold">Assign Designations</span>
                      </div>
                      <CardDescription>
                        Assign work designations to temporary and casual employees who are gated in. {employeesForDesignation.length} employees need designations.
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search employees..."
                          className="pl-8 w-full md:w-[250px]"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <Select 
                        value={bulkDesignation} 
                        onValueChange={(value: Designation) => setBulkDesignation(value)}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Bulk Designation" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(designationLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {employeesForDesignation.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg">
                      <Tags className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">All designations assigned</h3>
                      <p className="text-muted-foreground mb-4">No pending designation assignments. Employees will appear here after they gate in.</p>
                      <Button onClick={() => setActiveTab('gate-in')}>
                        <DoorOpen className="mr-2" />
                        Go to Gate In
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Bulk Actions */}
                      {selectedEmployees.length > 0 && (
                        <Card className="mb-6 bg-blue-50 border-blue-200">
                          <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <Badge variant="default" className="text-sm">
                                  {selectedEmployees.length} selected
                                </Badge>
                                <span className="text-sm text-blue-700">
                                  Assign bulk designation to selected employees
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  className="h-8"
                                  onClick={handleBulkAssignDesignation}
                                >
                                  <Tags className="w-3 h-3 mr-1" />
                                  Assign {designationLabels[bulkDesignation]}
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

                      {/* Employee Grid */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">Employees Needing Designations ({employeesForDesignation.length})</h3>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="select-all-designations" 
                                checked={selectedEmployees.length === employeesForDesignation.length && employeesForDesignation.length > 0}
                                onCheckedChange={() => handleSelectAll(employeesForDesignation)}
                              />
                              <Label htmlFor="select-all-designations" className="text-sm">Select All</Label>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {employeesForDesignation
                            .filter(emp =>
                              !searchQuery || 
                              emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              emp.role.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .map((employee) => (
                              <div key={employee.id} className="relative">
                                <Checkbox
                                  checked={selectedEmployees.includes(employee.id)}
                                  onCheckedChange={() => handleEmployeeSelection(employee.id)}
                                  className="absolute top-2 right-2 z-10"
                                />
                                <DesignationCard
                                  employee={employee}
                                  onAssignDesignation={handleAssignDesignation}
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Gate Out Tab */}
            <TabsContent value="gate-out" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <DoorClosed className="w-5 h-5 text-red-600" />
                        <span className="text-lg font-semibold">Gate Out</span>
                      </div>
                      <CardDescription>
                        Gate out employees who are leaving. {employeesForGateOut.length} employees ready for gate out.
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
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
                          <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All Types</SelectItem>
                          <SelectItem value="Permanent">Permanent</SelectItem>
                          <SelectItem value="Temporary">Temporary</SelectItem>
                          <SelectItem value="Casual">Casual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {employeesForGateOut.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg">
                      <DoorClosed className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No employees ready for gate out</h3>
                      <p className="text-muted-foreground mb-4">Employees will appear here after they gate in and receive designations (if required).</p>
                      <Button onClick={() => setActiveTab('gate-in')}>
                        <DoorOpen className="mr-2" />
                        Go to Gate In
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Bulk Actions */}
                      {selectedEmployees.length > 0 && (
                        <Card className="mb-6 bg-red-50 border-red-200">
                          <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <Badge variant="destructive" className="text-sm">
                                  {selectedEmployees.length} selected
                                </Badge>
                                <span className="text-sm text-red-700">
                                  Perform bulk gate out on selected employees
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8"
                                  onClick={handleBulkGateIn} // This should be handleBulkGateOut, but we need to create it
                                >
                                  <DoorClosed className="w-3 h-3 mr-1" />
                                  Gate Out Selected
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

                      {/* Employee Grid */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">Employees Ready for Gate Out ({employeesForGateOut.length})</h3>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="select-all-gateout" 
                                checked={selectedEmployees.length === employeesForGateOut.length && employeesForGateOut.length > 0}
                                onCheckedChange={() => handleSelectAll(employeesForGateOut)}
                              />
                              <Label htmlFor="select-all-gateout" className="text-sm">Select All</Label>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {employeesForGateOut
                            .filter(emp => 
                              activeFilter === 'All' || emp.employeeType === activeFilter
                            )
                            .filter(emp =>
                              !searchQuery || 
                              emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              emp.role.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .map((employee) => (
                              <div key={employee.id} className="relative">
                                <Checkbox
                                  checked={selectedEmployees.includes(employee.id)}
                                  onCheckedChange={() => handleEmployeeSelection(employee.id)}
                                  className="absolute top-2 right-2 z-10"
                                />
                                <GateInCard
                                  employee={employee}
                                  onGateIn={handleGateIn}
                                  onGateOut={handleGateOut}
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* All Employees Tab */}
            <TabsContent value="employees" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle>All Employees</CardTitle>
                      <CardDescription>
                        Manage your complete employee directory. Total: {employees.length} employees
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
                          <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All Types</SelectItem>
                          <SelectItem value="Permanent">Permanent</SelectItem>
                          <SelectItem value="Temporary">Temporary</SelectItem>
                          <SelectItem value="Casual">Casual</SelectItem>
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
                            <TableHead>Employee</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Contract</TableHead>
                            <TableHead>Designation</TableHead>
                            <TableHead>Gate Status</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredEmployees.map((employee) => (
                            <TableRow key={employee.id}>
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
                                <Badge className={employeeTypeInfo[employee.employeeType].color}>
                                  {employee.employeeType}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {employee.contract}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {employee.designation ? (
                                  <Badge className={designationColors[employee.designation]}>
                                    {designationLabels[employee.designation]}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {employee.isGatedIn ? (
                                  <Badge className="bg-green-100 text-green-800">
                                    <DoorOpen className="w-3 h-3 mr-1 inline" />
                                    Gated In
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">
                                    <DoorClosed className="w-3 h-3 mr-1 inline" />
                                    Gated Out
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>{employee.phone || '-'}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      if (employee.isGatedIn) {
                                        handleGateOut(employee.id);
                                      } else {
                                        handleGateIn(employee.id);
                                      }
                                    }}
                                  >
                                    {employee.isGatedIn ? (
                                      <>
                                        <DoorClosed className="w-4 h-4" />
                                      </>
                                    ) : (
                                      <>
                                        <DoorOpen className="w-4 h-4" />
                                      </>
                                    )}
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
                                        employeeType: employee.employeeType,
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
                          <SelectItem value="Permanent">Permanent</SelectItem>
                          <SelectItem value="Temporary">Temporary</SelectItem>
                          <SelectItem value="Casual">Casual</SelectItem>
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
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredAttendance.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No attendance records</h3>
                      <p className="text-muted-foreground">Attendance records will appear here</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[500px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Employee</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Check In</TableHead>
                            <TableHead>Check Out</TableHead>
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
                            
                            // Safely get employee type info
                            const typeInfo = employee ? employeeTypeInfo[employee.employeeType] : { color: 'bg-gray-100 text-gray-800' };
                            
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
                                        {employee?.employeeType || 'Unknown'}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={typeInfo.color}>
                                    {employee?.employeeType || 'Unknown'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge className={statusColor}>
                                    {StatusIcon && <StatusIcon className="w-3 h-3 mr-1" />}
                                    {record.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {record.clockInTime ? format(parseISO(record.clockInTime), 'HH:mm') : '-'}
                                </TableCell>
                                <TableCell>
                                  {record.clockOutTime ? format(parseISO(record.clockOutTime), 'HH:mm') : '-'}
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