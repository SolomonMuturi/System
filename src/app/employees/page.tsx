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
  Shield, FileText, Download, Filter, MoreVertical, UserPlus
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
import { format, parseISO, addDays, differenceInHours } from 'date-fns';
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
  const [checkInOutEmployeeId, setCheckInOutEmployeeId] = useState('');
  const [designation, setDesignation] = useState<Designation>('dipping');

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
    company: 'FreshTrace'
  });

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

  // Get today's attendance
  const todaysAttendance = useMemo(() => {
    return attendance.filter(record => record.date === today);
  }, [attendance, today]);

  // Calculate statistics
  const stats = useMemo(() => {
    const fullTimeEmployees = employees.filter(emp => emp.contract === 'Full-time');
    const partTimeEmployees = employees.filter(emp => emp.contract === 'Part-time');
    const contractEmployees = employees.filter(emp => emp.contract === 'Contract');
    
    const presentToday = todaysAttendance.filter(record => record.status === 'Present').length;
    const lateToday = todaysAttendance.filter(record => record.status === 'Late').length;
    const absentToday = todaysAttendance.filter(record => record.status === 'Absent').length;
    const onLeaveToday = todaysAttendance.filter(record => record.status === 'On Leave').length;
    const checkedOutToday = todaysAttendance.filter(record => record.clockOutTime).length;
    const checkedInToday = todaysAttendance.filter(record => record.clockInTime && !record.clockOutTime).length;
    
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
  }, [employees, todaysAttendance]);

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
      
      // For contract employees, use the selected designation
      const designationForRecord = employee.contract === 'Contract' ? designation : undefined;
      
      // Check if attendance record already exists for today
      const existingRecord = todaysAttendance.find(record => record.employeeId === employeeId);
      
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
            designation: designationForRecord
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
            date: today,
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
        // Remove existing record for this employee today
        const filtered = prev.filter(record => !(record.employeeId === employeeId && record.date === today));
        return [...filtered, data];
      });

      toast({
        title: '✅ Checked In',
        description: `${employee.name} has been checked in${isLate ? ' (Late)' : ''} at ${format(new Date(), 'HH:mm')}`,
      });
      
      setCheckInOutEmployeeId('');
      setDesignation('dipping');
      
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
      
      // Find existing attendance record
      const existingRecord = todaysAttendance.find(record => 
        record.employeeId === employeeId && record.date === today
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
      
      setCheckInOutEmployeeId('');
      
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

      // Check if attendance record already exists for today
      const existingRecord = todaysAttendance.find(record => record.employeeId === employeeId);
      
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
            clockOutTime: null
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
            date: today,
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
        const filtered = prev.filter(record => !(record.employeeId === employeeId && record.date === today));
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

      // Check if attendance record already exists for today
      const existingRecord = todaysAttendance.find(record => record.employeeId === employeeId);
      
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
            clockOutTime: null
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
            date: today,
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
        const filtered = prev.filter(record => !(record.employeeId === employeeId && record.date === today));
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

  // Export attendance to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Employee Name', 'Employee ID', 'Contract Type', 'Check In', 'Check Out', 'Status', 'Designation', 'Hours Worked'];
    
    const csvData = filteredAttendance.map(record => {
      const employee = employees.find(emp => emp.id === record.employeeId);
      let hoursWorked = 'N/A';
      
      if (record.clockInTime && record.clockOutTime) {
        const inTime = parseISO(record.clockInTime);
        const outTime = parseISO(record.clockOutTime);
        const hours = differenceInHours(outTime, inTime);
        hoursWorked = `${hours} hours`;
      }
      
      return [
        record.date,
        employee?.name || 'Unknown',
        employee?.employeeId || record.employeeId,
        employee?.contract || 'Unknown',
        record.clockInTime ? format(parseISO(record.clockInTime), 'HH:mm') : '',
        record.clockOutTime ? format(parseISO(record.clockOutTime), 'HH:mm') : '',
        record.status,
        record.designation ? designationLabels[record.designation] : '',
        hoursWorked
      ];
    });

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${format(dateRange.from, 'yyyy-MM-dd')}_to_${format(dateRange.to, 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  // Handle check-in all employees
  const handleCheckInAll = async () => {
    try {
      const employeesToCheckIn = employees.filter(emp => {
        const att = todaysAttendance.find(a => a.employeeId === emp.id);
        return !att || (att.status !== 'Present' && att.status !== 'Late');
      });

      let successCount = 0;
      let failedCount = 0;
      
      for (const employee of employeesToCheckIn) {
        try {
          await handleCheckIn(employee.id);
          successCount++;
        } catch (error) {
          console.error(`Failed to check in ${employee.name}:`, error);
          failedCount++;
        }
      }

      toast({
        title: 'Bulk Check-in Complete',
        description: `Successfully checked in ${successCount} out of ${employeesToCheckIn.length} employees.${failedCount > 0 ? ` ${failedCount} failed.` : ''}`,
        variant: failedCount > 0 ? 'destructive' : 'default',
      });
    } catch (error: any) {
      console.error('❌ Error in bulk check-in:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to check in all employees',
        variant: 'destructive',
      });
    }
  };

  // Handle check-out all present employees
  const handleCheckOutAll = async () => {
    try {
      const employeesToCheckOut = employees.filter(emp => {
        const att = todaysAttendance.find(a => a.employeeId === emp.id);
        return att?.status === 'Present' && !att.clockOutTime;
      });

      let successCount = 0;
      let failedCount = 0;
      
      for (const employee of employeesToCheckOut) {
        try {
          await handleCheckOut(employee.id);
          successCount++;
        } catch (error) {
          console.error(`Failed to check out ${employee.name}:`, error);
          failedCount++;
        }
      }

      toast({
        title: 'Bulk Check-out Complete',
        description: `Successfully checked out ${successCount} out of ${employeesToCheckOut.length} employees.${failedCount > 0 ? ` ${failedCount} failed.` : ''}`,
        variant: failedCount > 0 ? 'destructive' : 'default',
      });
    } catch (error: any) {
      console.error('❌ Error in bulk check-out:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to check out all employees',
        variant: 'destructive',
      });
    }
  };

  if (!isClient || isLoading) {
    return (
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <FreshViewLogo className="w-8 h-8 text-primary" />
              <h1 className="text-xl font-headline font-bold text-sidebar-foreground">
                FreshTrace
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
              FreshTrace
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

          {/* Main Tabs */}
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
                          const todayRecord = todaysAttendance.find(r => r.employeeId === emp.id);
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5" />
                      <span>Today's Roll Call - {format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Current Time: {format(currentTime, 'HH:mm:ss')}
                    </div>
                  </div>
                  <CardDescription>
                    Manage check-in and check-out for all employees
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Check In Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-600">
                          <LogIn className="w-5 h-5" />
                          Check In
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="checkInEmployee">Select Employee</Label>
                          <Select 
                            value={checkInOutEmployeeId} 
                            onValueChange={(value) => {
                              setCheckInOutEmployeeId(value);
                              const employee = employees.find(emp => emp.id === value);
                              if (employee?.contract === 'Contract') {
                                setDesignation('dipping');
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select employee to check in" />
                            </SelectTrigger>
                            <SelectContent>
                              <ScrollArea className="h-60">
                                {employees.map(emp => {
                                  const todayRecord = todaysAttendance.find(r => r.employeeId === emp.id);
                                  const isPresent = todayRecord?.status === 'Present';
                                  const isLate = todayRecord?.status === 'Late';
                                  const isCheckedOut = !!todayRecord?.clockOutTime;
                                  const isAbsent = todayRecord?.status === 'Absent';
                                  const isOnLeave = todayRecord?.status === 'On Leave';
                                  
                                  return (
                                    <SelectItem key={emp.id} value={emp.id}>
                                      <div className="flex items-center justify-between">
                                        <span>{emp.name}</span>
                                        <div className="flex items-center gap-1">
                                          <Badge variant="outline" className="ml-2">
                                            {emp.contract}
                                          </Badge>
                                          {todayRecord && (
                                            <Badge variant={
                                              isPresent && !isCheckedOut ? 'default' :
                                              isLate ? 'secondary' :
                                              isAbsent ? 'destructive' :
                                              isOnLeave ? 'secondary' :
                                              isCheckedOut ? 'outline' : 'secondary'
                                            } className="ml-1">
                                              {isCheckedOut ? 'Checked Out' : todayRecord.status}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </ScrollArea>
                            </SelectContent>
                          </Select>
                        </div>

                        {checkInOutEmployeeId && employees.find(emp => 
                          emp.id === checkInOutEmployeeId && emp.contract === 'Contract'
                        ) && (
                          <div className="space-y-2">
                            <Label>Designation (Contract Employees)</Label>
                            <Select value={designation} onValueChange={(value: Designation) => setDesignation(value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select designation" />
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
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            onClick={() => handleCheckIn(checkInOutEmployeeId, false)}
                            disabled={!checkInOutEmployeeId}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <LogIn className="w-4 h-4 mr-2" />
                            Check In
                          </Button>
                          <Button 
                            onClick={() => handleCheckIn(checkInOutEmployeeId, true)}
                            disabled={!checkInOutEmployeeId}
                            variant="outline"
                            className="border-amber-500 text-amber-600 hover:bg-amber-50"
                          >
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Check In Late
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Check Out Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600">
                          <LogOut className="w-5 h-5" />
                          Check Out
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="checkOutEmployee">Select Employee</Label>
                          <Select value={checkInOutEmployeeId} onValueChange={setCheckInOutEmployeeId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select employee to check out" />
                            </SelectTrigger>
                            <SelectContent>
                              <ScrollArea className="h-60">
                                {employees.map(emp => {
                                  const todayRecord = todaysAttendance.find(r => r.employeeId === emp.id);
                                  const isPresent = todayRecord?.status === 'Present';
                                  const hasCheckedOut = !!todayRecord?.clockOutTime;
                                  
                                  return (
                                    <SelectItem key={emp.id} value={emp.id}>
                                      <div className="flex items-center justify-between">
                                        <span>{emp.name}</span>
                                        <div className="flex items-center gap-1">
                                          <Badge variant="outline" className="ml-2">
                                            {emp.contract}
                                          </Badge>
                                          {todayRecord && (
                                            <Badge variant={
                                              isPresent && !hasCheckedOut ? 'default' :
                                              hasCheckedOut ? 'outline' :
                                              'secondary'
                                            } className="ml-1">
                                              {hasCheckedOut ? 'Checked Out' : todayRecord.status}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </ScrollArea>
                            </SelectContent>
                          </Select>
                        </div>

                        <Button 
                          onClick={() => handleCheckOut(checkInOutEmployeeId)}
                          disabled={!checkInOutEmployeeId}
                          variant="destructive"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Check Out
                        </Button>
                      </CardContent>
                    </Card>
                    {/* Today's Summary */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Today's Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">
                                {stats.checkedInToday}
                              </div>
                              <div className="text-sm text-green-800">Checked In</div>
                            </div>
                            <div className="text-center p-4 bg-red-50 rounded-lg">
                              <div className="text-2xl font-bold text-red-600">
                                {stats.pendingCheckIn}
                              </div>
                              <div className="text-sm text-red-800">Not Checked In</div>
                            </div>
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600">
                                {stats.checkedOutToday}
                              </div>
                              <div className="text-sm text-blue-800">Checked Out</div>
                            </div>
                            <div className="text-center p-4 bg-amber-50 rounded-lg">
                              <div className="text-2xl font-bold text-amber-600">
                                {stats.lateToday}
                              </div>
                              <div className="text-sm text-amber-800">Late</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Today's Attendance Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Today's Attendance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Employee</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Check In</TableHead>
                              <TableHead>Check Out</TableHead>
                              <TableHead>Designation</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {employees.map(employee => {
                              const todayRecord = todaysAttendance.find(r => r.employeeId === employee.id);
                              const StatusIcon = statusInfo[todayRecord?.status as keyof typeof statusInfo]?.icon || Clock;
                              const statusColor = statusInfo[todayRecord?.status as keyof typeof statusInfo]?.color || 'bg-gray-100 text-gray-800';
                              
                              return (
                                <TableRow key={employee.id}>
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <Avatar>
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
                                    {todayRecord?.clockInTime ? (
                                      <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                        {format(parseISO(todayRecord.clockInTime), 'HH:mm')}
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {todayRecord?.clockOutTime ? (
                                      <div className="flex items-center gap-2">
                                        <LogOut className="w-4 h-4 text-red-600" />
                                        {format(parseISO(todayRecord.clockOutTime), 'HH:mm')}
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {todayRecord?.designation ? (
                                      <Badge className={designationColors[todayRecord.designation]}>
                                        {designationLabels[todayRecord.designation]}
                                      </Badge>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={statusColor}>
                                      <StatusIcon className="w-3 h-3 mr-1" />
                                      {todayRecord?.status || 'No Record'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-2">
                                      {(!todayRecord || todayRecord.status === 'Absent' || todayRecord.status === 'On Leave') ? (
                                        <>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleCheckIn(employee.id)}
                                          >
                                            <LogIn className="w-3 h-3 mr-1" />
                                            Check In
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleMarkAbsent(employee.id)}
                                          >
                                            <XCircle className="w-3 h-3 mr-1" />
                                            Absent
                                          </Button>
                                        </>
                                      ) : todayRecord.status === 'Present' && !todayRecord.clockOutTime ? (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleCheckOut(employee.id)}
                                        >
                                          <LogOut className="w-3 h-3 mr-1" />
                                          Check Out
                                        </Button>
                                      ) : null}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>
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
                                        company: employee.company || 'FreshTrace'
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