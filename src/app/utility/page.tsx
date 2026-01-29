'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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

import { 
  DollarSign, 
  Thermometer, 
  Bolt, 
  Zap, 
  Droplet, 
  Fuel, 
  Clock, 
  AlertTriangle, 
  Download, 
  Filter, 
  Wifi, 
  Building,
  Cpu,
  Snowflake,
  Activity,
  Bell,
  Calendar,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  Eye,
  BarChart3,
  CalendarDays,
  FileText,
  Users,
  Save,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  BarChart,
  PieChart,
  Printer,
  FileSpreadsheet,
  Plus,
  Minus,
  Search,
  Upload,
  X,
  Play,
  StopCircle,
  ArrowLeft,
  ShieldAlert,
  Settings,
  MoreVertical,
  Edit,
  Trash2,
  Eye as EyeIcon
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Define utility rates
const UTILITY_RATES = {
  electricity: 25, // KES per kWh
  water: 130,      // KES per m³
  diesel: 74       // KES per liter
} as const;

// Types
interface UtilityReading {
  id: string;
  date: string;
  powerOpening: string;
  powerClosing: string;
  powerConsumed: string;
  waterOpening: string;
  waterClosing: string;
  waterConsumed: string;
  generatorStart: string;
  generatorStop: string;
  timeConsumed: string;
  dieselConsumed: string;
  dieselRefill: string | null;
  recordedBy: string;
  shift: string | null;
  notes: string | null;
  metadata?: any;
}

interface OverviewCardData {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: any;
  color: string;
  bgColor: string;
}

interface AreaBreakdown {
  office: number;
  machine: number;
  coldroom1: number;
  coldroom2: number;
  other: number;
}

interface NotificationSettings {
  enabled: boolean;
  time: string;
}

// Initialize overview data
const initialOverviewCards = {
  energy: [
    { title: 'Total Power', value: '0 kWh', change: 'No data', changeType: 'neutral' as const, icon: Zap, color: 'text-blue-400', bgColor: 'from-blue-900/30 to-blue-900/10' },
    { title: 'Monthly Cost', value: 'KES 0', change: `KES ${UTILITY_RATES.electricity}/kWh`, changeType: 'neutral' as const, icon: DollarSign, color: 'text-emerald-400', bgColor: 'from-emerald-900/30 to-emerald-900/10' },
    { title: 'Peak Demand', value: '0 kW', change: 'No data', changeType: 'neutral' as const, icon: Bolt, color: 'text-amber-400', bgColor: 'from-amber-900/30 to-amber-900/10' },
    { title: 'Efficiency', value: '0.00', change: 'No data', changeType: 'neutral' as const, icon: TrendingUp, color: 'text-purple-400', bgColor: 'from-purple-900/30 to-purple-900/10' },
  ],
  water: [
    { title: 'Total Water', value: '0 m³', change: 'No data', changeType: 'neutral' as const, icon: Droplet, color: 'text-cyan-400', bgColor: 'from-cyan-900/30 to-cyan-900/10' },
    { title: 'Water Cost', value: 'KES 0', change: `KES ${UTILITY_RATES.water}/m³`, changeType: 'neutral' as const, icon: DollarSign, color: 'text-blue-400', bgColor: 'from-blue-900/30 to-blue-900/10' },
    { title: 'Water Quality', value: 'Good', change: 'Monitoring', changeType: 'neutral' as const, icon: Thermometer, color: 'text-emerald-400', bgColor: 'from-emerald-900/30 to-emerald-900/10' },
    { title: 'Savings', value: '0%', change: 'Recycling rate', changeType: 'neutral' as const, icon: Activity, color: 'text-teal-400', bgColor: 'from-teal-900/30 to-teal-900/10' },
  ],
  diesel: [
    { title: 'Diesel Today', value: '0 L', change: 'Generator runtime', changeType: 'neutral' as const, icon: Fuel, color: 'text-orange-400', bgColor: 'from-orange-900/30 to-orange-900/10' },
    { title: 'Avg Daily', value: '0 L', change: 'Last 7 days', changeType: 'neutral' as const, icon: BarChart3, color: 'text-rose-400', bgColor: 'from-rose-900/30 to-rose-900/10' },
    { title: 'Monthly Cost', value: 'KES 0', change: `KES ${UTILITY_RATES.diesel}/L`, changeType: 'neutral' as const, icon: DollarSign, color: 'text-amber-400', bgColor: 'from-amber-900/30 to-amber-900/10' },
    { title: 'Runtime', value: '0 hrs', change: 'Estimated hours', changeType: 'neutral' as const, icon: Clock, color: 'text-violet-400', bgColor: 'from-violet-900/30 to-violet-900/10' },
  ],
  internet: [
    { title: 'Total Internet', value: 'KES 0', change: 'Monthly cost', changeType: 'neutral' as const, icon: Wifi, color: 'text-violet-400', bgColor: 'from-violet-900/30 to-violet-900/10' },
    { title: 'Safaricom', value: 'KES 0', change: 'Per month', changeType: 'neutral' as const, icon: Wifi, color: 'text-blue-400', bgColor: 'from-blue-900/30 to-blue-900/10' },
    { title: '5G Internet', value: 'KES 0', change: 'Per month', changeType: 'neutral' as const, icon: Wifi, color: 'text-emerald-400', bgColor: 'from-emerald-900/30 to-emerald-900/10' },
    { title: 'Syokinet', value: 'KES 0', change: 'Per month', changeType: 'neutral' as const, icon: Wifi, color: 'text-cyan-400', bgColor: 'from-cyan-900/30 to-cyan-900/10' },
  ]
};

// StatCard Component
function StatCard({ data }: { data: OverviewCardData }) {
  const { title, value, change, changeType, icon: Icon, color, bgColor } = data;
  
  const getChangeColor = () => {
    switch (changeType) {
      case 'increase':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'decrease':
        return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'neutral':
        return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
      default:
        return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'increase':
        return '↗';
      case 'decrease':
        return '↘';
      case 'neutral':
        return '→';
      default:
        return '→';
    }
  };

  return (
    <div className={`bg-gradient-to-br ${bgColor} border border-gray-800 rounded-xl p-5 transition-all duration-300 hover:border-gray-700 hover:shadow-xl`}>
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <div className="flex items-baseline gap-3">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getChangeColor()}`}>
              {getChangeIcon()} {change}
            </span>
          </div>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg bg-gray-800/50`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        )}
      </div>
    </div>
  );
}

// UtilitySection Component
function UtilitySection({
  title,
  icon: Icon,
  color,
  children,
  onSave,
  isSaving,
  isOpen = false,
  onToggle,
  totalConsumed,
  totalCost,
  badgeColor = "blue"
}: {
  title: string;
  icon: any;
  color: string;
  children: React.ReactNode;
  onSave: () => void;
  isSaving: boolean;
  isOpen: boolean;
  onToggle: () => void;
  totalConsumed?: string;
  totalCost?: string;
  badgeColor?: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div 
        className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-800/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${color.replace('text-', 'bg-').replace('400', '900')}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-200">{title}</h3>
            <p className="text-sm text-gray-500">
              {isOpen ? 'Click to collapse section' : 'Click to expand section'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {(totalConsumed || totalCost) && (
            <div className="flex items-center gap-2">
              {totalConsumed && (
                <Badge variant="outline" className="bg-gray-800 border-gray-700">
                  {totalConsumed}
                </Badge>
              )}
              {totalCost && (
                <Badge className={`bg-${badgeColor}-900/50 text-${badgeColor}-400 border-${badgeColor}-800`}>
                  {totalCost}
                </Badge>
              )}
            </div>
          )}
          
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSave();
            }}
            disabled={isSaving}
            className={`bg-gradient-to-r ${color.replace('text-', 'from-').replace('400', '600')} to-${badgeColor}-600 hover:from-${badgeColor}-700 hover:to-${badgeColor}-800`}
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-3 w-3 mr-2" />
                Save
              </>
            )}
          </Button>
          
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>
      
      {isOpen && (
        <div className="px-6 pb-6 pt-2 border-t border-gray-800">
          {children}
        </div>
      )}
    </div>
  );
}

// DateRangePicker Component
function DateRangePicker({ 
  onDateRangeChange, 
  dateFilter, 
  setDateFilter 
}: { 
  onDateRangeChange: (start: string, end: string) => void;
  dateFilter: 'today' | 'week' | 'month' | 'custom';
  setDateFilter: (filter: 'today' | 'week' | 'month' | 'custom') => void;
}) {
  const [customRange, setCustomRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const handleQuickSelect = (days: number) => {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - days);
    
    setCustomRange({
      start: start.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    });
    
    setDateFilter('custom');
    onDateRangeChange(start.toISOString().split('T')[0], today.toISOString().split('T')[0]);
  };

  const handleApplyCustomRange = () => {
    if (customRange.start && customRange.end) {
      onDateRangeChange(customRange.start, customRange.end);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="border-gray-700 bg-gray-800 hover:bg-gray-700">
          <Calendar className="mr-2 h-4 w-4" />
          {dateFilter === 'today' ? 'Today' : 
           dateFilter === 'week' ? 'Last 7 Days' : 
           dateFilter === 'month' ? 'Last 30 Days' : 
           `${new Date(customRange.start).toLocaleDateString()} - ${new Date(customRange.end).toLocaleDateString()}`}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-gray-900 border-gray-700">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-gray-200">Quick Select</h4>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant={dateFilter === 'today' ? 'default' : 'outline'}
                onClick={() => handleQuickSelect(0)}
                className={dateFilter === 'today' ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-700'}
              >
                Today
              </Button>
              <Button 
                size="sm" 
                variant={dateFilter === 'week' ? 'default' : 'outline'}
                onClick={() => handleQuickSelect(7)}
                className={dateFilter === 'week' ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-700'}
              >
                Last 7 Days
              </Button>
              <Button 
                size="sm" 
                variant={dateFilter === 'month' ? 'default' : 'outline'}
                onClick={() => handleQuickSelect(30)}
                className={dateFilter === 'month' ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-700'}
              >
                Last 30 Days
              </Button>
            </div>
          </div>
          
          <Separator className="bg-gray-700" />
          
          <div className="space-y-2">
            <h4 className="font-medium text-gray-200">Custom Range</h4>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-sm text-gray-400">Start Date</Label>
                  <Input
                    type="date"
                    value={customRange.start}
                    onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-gray-400">End Date</Label>
                  <Input
                    type="date"
                    value={customRange.end}
                    onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
              </div>
              <Button 
                size="sm" 
                onClick={handleApplyCustomRange}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Apply Custom Range
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Main Dashboard Component
export default function UtilityManagementPage() {
  const { toast } = useToast();
  
  // State for overview cards
  const [overviewCards, setOverviewCards] = useState(initialOverviewCards);
  
  // Main state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPower, setTotalPower] = useState(0);
  const [totalWater, setTotalWater] = useState(0);
  const [totalDiesel, setTotalDiesel] = useState(0);
  const [totalInternet, setTotalInternet] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string>('Never');
  const [todayReadingsFilled, setTodayReadingsFilled] = useState(false);
  
  // Breakdown data
  const [powerBreakdown, setPowerBreakdown] = useState<AreaBreakdown>({
    office: 0,
    machine: 0,
    coldroom1: 0,
    coldroom2: 0,
    other: 0
  });
  
  const [waterBreakdown, setWaterBreakdown] = useState({
    meter1: 0,
    meter2: 0
  });

  // Data states
  const [readings, setReadings] = useState<UtilityReading[]>([]);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Utility entry states
  const [recordedBy, setRecordedBy] = useState('');
  const [shift, setShift] = useState('Morning');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Section toggle states
  const [openSections, setOpenSections] = useState({
    power: false,
    water: false,
    internet: false,
    generator: false,
  });

  // Power States
  const [powerReadings, setPowerReadings] = useState({
    office: { opening: '', closing: '', disabled: true },
    machine: { opening: '', closing: '', disabled: true },
    coldroom1: { opening: '', closing: '', disabled: true },
    coldroom2: { opening: '', closing: '', disabled: true },
    other: { opening: '', closing: '', disabled: true },
  });
  const [otherActivity, setOtherActivity] = useState('');
  const [isSavingPower, setIsSavingPower] = useState(false);

  // Water States
  const [waterReadings, setWaterReadings] = useState({
    meter1: { opening: '', closing: '', disabled: true },
    meter2: { opening: '', closing: '', disabled: true },
  });
  const [isSavingWater, setIsSavingWater] = useState(false);

  // Internet States
  const [internetCosts, setInternetCosts] = useState({
    safaricom: '',
    internet5G: '',
    syokinet: '',
  });
  const [internetBillingCycle, setInternetBillingCycle] = useState('');
  const [isSavingInternet, setIsSavingInternet] = useState(false);

  // Generator States
  const [generatorStart, setGeneratorStart] = useState('08:00');
  const [generatorStop, setGeneratorStop] = useState('10:30');
  const [dieselRefill, setDieselRefill] = useState('');
  const [dieselConsumed, setDieselConsumed] = useState('');
  const [isSavingGenerator, setIsSavingGenerator] = useState(false);

  // Check if today's readings are filled
  const checkTodayReadings = useCallback((): boolean => {
    const lastFilledDate = localStorage.getItem('lastFilledDate');
    const today = new Date().toISOString().split('T')[0];
    return lastFilledDate === today;
  }, []);

  // Fetch utility data
  const fetchUtilityData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let url = '/api/utility-readings?limit=100';
      if (dateFilter !== 'custom') {
        url += `&period=${dateFilter}`;
      } else {
        url += `&startDate=${dateRange.start}&endDate=${dateRange.end}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      
      const data = await response.json();
      setReadings(data.readings || []);
      
      // Check if today's readings are filled
      const todayFilled = checkTodayReadings();
      setTodayReadingsFilled(todayFilled);
      
      // Calculate totals
      let powerTotal = 0;
      let waterTotal = 0;
      let dieselTotal = 0;
      let internetTotal = 0;
      
      const powerBreakdown: AreaBreakdown = {
        office: 0,
        machine: 0,
        coldroom1: 0,
        coldroom2: 0,
        other: 0
      };
      
      const waterBreakdown = {
        meter1: 0,
        meter2: 0
      };
      
      data.readings.forEach((reading: UtilityReading) => {
        const metadata = reading.metadata || {};
        
        // Power breakdown
        powerBreakdown.office += metadata.powerOfficeConsumed || 0;
        powerBreakdown.machine += metadata.powerMachineConsumed || 0;
        powerBreakdown.coldroom1 += metadata.powerColdroom1Consumed || 0;
        powerBreakdown.coldroom2 += metadata.powerColdroom2Consumed || 0;
        powerBreakdown.other += metadata.powerOtherConsumed || 0;
        
        // Water breakdown
        waterBreakdown.meter1 += metadata.waterMeter1Consumed || 0;
        waterBreakdown.meter2 += metadata.waterMeter2Consumed || 0;
        
        // Internet costs
        internetTotal += (metadata.internetSafaricom || 0) + 
                        (metadata.internet5G || 0) + 
                        (metadata.internetSyokinet || 0);
        
        // Totals
        powerTotal += parseFloat(reading.powerConsumed) || 0;
        waterTotal += parseFloat(reading.waterConsumed) || 0;
        dieselTotal += parseFloat(reading.dieselConsumed) || 0;
      });
      
      setTotalPower(powerTotal);
      setTotalWater(waterTotal);
      setTotalDiesel(dieselTotal);
      setTotalInternet(internetTotal);
      setPowerBreakdown(powerBreakdown);
      setWaterBreakdown(waterBreakdown);
      
      // Calculate monthly costs
      const daysInPeriod = dateFilter === 'today' ? 1 : dateFilter === 'week' ? 7 : dateFilter === 'month' ? 30 : 
        Math.ceil((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24)) || 30;
      
      const powerCost = powerTotal * UTILITY_RATES.electricity * (30 / daysInPeriod);
      const waterCost = waterTotal * UTILITY_RATES.water * (30 / daysInPeriod);
      const dieselCost = dieselTotal * UTILITY_RATES.diesel * (30 / daysInPeriod);
      
      // Update overview cards
      setOverviewCards({
        energy: [
          { 
            title: 'Total Power', 
            value: `${powerTotal.toFixed(0)} kWh`, 
            change: '+2% vs yesterday', 
            changeType: 'increase' as const,
            icon: Zap,
            color: 'text-blue-400',
            bgColor: 'from-blue-900/30 to-blue-900/10'
          },
          { 
            title: 'Monthly Cost', 
            value: `KES ${powerCost.toLocaleString()}`, 
            change: `KES ${UTILITY_RATES.electricity}/kWh`, 
            changeType: 'increase' as const,
            icon: DollarSign,
            color: 'text-emerald-400',
            bgColor: 'from-emerald-900/30 to-emerald-900/10'
          },
          { 
            title: 'Peak Demand', 
            value: `${(powerTotal / 24).toFixed(1)} kW`, 
            change: 'Within limits', 
            changeType: 'increase' as const,
            icon: Bolt,
            color: 'text-amber-400',
            bgColor: 'from-amber-900/30 to-amber-900/10'
          },
          { 
            title: 'Efficiency', 
            value: '0.92', 
            change: 'Optimal', 
            changeType: 'increase' as const,
            icon: TrendingUp,
            color: 'text-purple-400',
            bgColor: 'from-purple-900/30 to-purple-900/10'
          },
        ],
        water: [
          { 
            title: 'Total Water', 
            value: `${waterTotal.toFixed(0)} m³`, 
            change: '-1.3% vs yesterday', 
            changeType: 'decrease' as const,
            icon: Droplet,
            color: 'text-cyan-400',
            bgColor: 'from-cyan-900/30 to-cyan-900/10'
          },
          { 
            title: 'Water Cost', 
            value: `KES ${waterCost.toLocaleString()}`, 
            change: `KES ${UTILITY_RATES.water}/m³`, 
            changeType: 'increase' as const,
            icon: DollarSign,
            color: 'text-blue-400',
            bgColor: 'from-blue-900/30 to-blue-900/10'
          },
          { 
            title: 'Water Quality', 
            value: 'Good', 
            change: 'Monitoring', 
            changeType: 'increase' as const,
            icon: Thermometer,
            color: 'text-emerald-400',
            bgColor: 'from-emerald-900/30 to-emerald-900/10'
          },
          { 
            title: 'Savings', 
            value: '15%', 
            change: 'Recycling rate', 
            changeType: 'increase' as const,
            icon: Activity,
            color: 'text-teal-400',
            bgColor: 'from-teal-900/30 to-teal-900/10'
          },
        ],
        diesel: [
          { 
            title: 'Diesel Today', 
            value: `${dieselTotal.toFixed(1)} L`, 
            change: 'Generator runtime', 
            changeType: 'increase' as const,
            icon: Fuel,
            color: 'text-orange-400',
            bgColor: 'from-orange-900/30 to-orange-900/10'
          },
          { 
            title: 'Avg Daily', 
            value: `${(dieselTotal / daysInPeriod).toFixed(1)} L`, 
            change: 'Last 7 days', 
            changeType: 'increase' as const,
            icon: BarChart3,
            color: 'text-rose-400',
            bgColor: 'from-rose-900/30 to-rose-900/10'
          },
          { 
            title: 'Monthly Cost', 
            value: `KES ${dieselCost.toLocaleString()}`, 
            change: `KES ${UTILITY_RATES.diesel}/L`, 
            changeType: 'increase' as const,
            icon: DollarSign,
            color: 'text-amber-400',
            bgColor: 'from-amber-900/30 to-amber-900/10'
          },
          { 
            title: 'Runtime', 
            value: `${(dieselTotal / 7).toFixed(0)} hrs`, 
            change: 'Estimated hours', 
            changeType: 'increase' as const,
            icon: Clock,
            color: 'text-violet-400',
            bgColor: 'from-violet-900/30 to-violet-900/10'
          },
        ],
        internet: [
          { 
            title: 'Total Internet', 
            value: `KES ${internetTotal.toLocaleString()}`, 
            change: 'Monthly cost', 
            changeType: 'increase' as const,
            icon: Wifi,
            color: 'text-violet-400',
            bgColor: 'from-violet-900/30 to-violet-900/10'
          },
          { 
            title: 'Safaricom', 
            value: `KES ${(data.readings[0]?.metadata?.internetSafaricom || 0).toLocaleString()}`, 
            change: 'Per month', 
            changeType: 'neutral' as const,
            icon: Wifi,
            color: 'text-blue-400',
            bgColor: 'from-blue-900/30 to-blue-900/10'
          },
          { 
            title: '5G Internet', 
            value: `KES ${(data.readings[0]?.metadata?.internet5G || 0).toLocaleString()}`, 
            change: 'Per month', 
            changeType: 'neutral' as const,
            icon: Wifi,
            color: 'text-emerald-400',
            bgColor: 'from-emerald-900/30 to-emerald-900/10'
          },
          { 
            title: 'Syokinet', 
            value: `KES ${(data.readings[0]?.metadata?.internetSyokinet || 0).toLocaleString()}`, 
            change: 'Per month', 
            changeType: 'neutral' as const,
            icon: Wifi,
            color: 'text-cyan-400',
            bgColor: 'from-cyan-900/30 to-cyan-900/10'
          },
        ]
      });

      // Update last updated timestamp
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      
    } catch (error) {
      console.error('Error fetching utility data:', error);
      setError('Failed to load utility data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load last readings for opening values
  const loadLastReadings = async () => {
    try {
      const response = await fetch('/api/utility-readings?limit=1');
      if (response.ok) {
        const data = await response.json();
        if (data.readings && data.readings.length > 0) {
          const lastReading = data.readings[0];
          const metadata = lastReading.metadata || {};
          
          // Set power opening readings (disabled)
          setPowerReadings({
            office: { 
              opening: metadata.powerOfficeClosing?.toString() || '0', 
              closing: '', 
              disabled: true 
            },
            machine: { 
              opening: metadata.powerMachineClosing?.toString() || '0', 
              closing: '', 
              disabled: true 
            },
            coldroom1: { 
              opening: metadata.powerColdroom1Closing?.toString() || '0', 
              closing: '', 
              disabled: true 
            },
            coldroom2: { 
              opening: metadata.powerColdroom2Closing?.toString() || '0', 
              closing: '', 
              disabled: true 
            },
            other: { 
              opening: metadata.powerOtherClosing?.toString() || '0', 
              closing: '', 
              disabled: true 
            },
          });
          
          // Set water opening readings (disabled)
          setWaterReadings({
            meter1: { 
              opening: metadata.waterMeter1Closing?.toString() || '0', 
              closing: '', 
              disabled: true 
            },
            meter2: { 
              opening: metadata.waterMeter2Closing?.toString() || '0', 
              closing: '', 
              disabled: true 
            },
          });
          
          setOtherActivity(metadata.powerOtherActivity || '');
        }
      }
    } catch (error) {
      console.error('Error fetching last readings:', error);
    }
  };

  // Handle section toggle
  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Calculate power consumption
  const calculatePowerConsumption = () => {
    const calculate = (opening: string, closing: string) => {
      const openingNum = Number(opening) || 0;
      const closingNum = Number(closing) || 0;
      return closingNum > openingNum ? closingNum - openingNum : 0;
    };

    return {
      office: calculate(powerReadings.office.opening, powerReadings.office.closing),
      machine: calculate(powerReadings.machine.opening, powerReadings.machine.closing),
      coldroom1: calculate(powerReadings.coldroom1.opening, powerReadings.coldroom1.closing),
      coldroom2: calculate(powerReadings.coldroom2.opening, powerReadings.coldroom2.closing),
      other: calculate(powerReadings.other.opening, powerReadings.other.closing),
    };
  };

  // Calculate water consumption
  const calculateWaterConsumption = () => {
    const calculate = (opening: string, closing: string) => {
      const openingNum = Number(opening) || 0;
      const closingNum = Number(closing) || 0;
      return closingNum > openingNum ? closingNum - openingNum : 0;
    };

    return {
      meter1: calculate(waterReadings.meter1.opening, waterReadings.meter1.closing),
      meter2: calculate(waterReadings.meter2.opening, waterReadings.meter2.closing),
    };
  };

  // Calculate generator data
  const calculateGeneratorData = () => {
    const [startHour, startMin] = generatorStart.split(':').map(Number);
    const [stopHour, stopMin] = generatorStop.split(':').map(Number);
    
    let totalMinutes = (stopHour * 60 + stopMin) - (startHour * 60 + startMin);
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const totalHours = totalMinutes / 60;
    
    const calculatedDiesel = totalHours * 7;
    
    return {
      hours,
      minutes,
      totalHours,
      diesel: dieselConsumed ? Number(dieselConsumed) : calculatedDiesel,
    };
  };

  // Handle save power readings
  const handleSavePower = async () => {
    if (!recordedBy) {
      toast({
        title: 'Validation Error',
        description: 'Please enter your name',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingPower(true);
    
    try {
      const powerConsumption = calculatePowerConsumption();
      const totalPowerConsumed = Object.values(powerConsumption).reduce((a, b) => a + b, 0);
      
      const response = await fetch('/api/utility-readings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          powerOfficeOpening: powerReadings.office.opening || '0',
          powerOfficeClosing: powerReadings.office.closing || '0',
          powerMachineOpening: powerReadings.machine.opening || '0',
          powerMachineClosing: powerReadings.machine.closing || '0',
          powerColdroom1Opening: powerReadings.coldroom1.opening || '0',
          powerColdroom1Closing: powerReadings.coldroom1.closing || '0',
          powerColdroom2Opening: powerReadings.coldroom2.opening || '0',
          powerColdroom2Closing: powerReadings.coldroom2.closing || '0',
          powerOtherOpening: powerReadings.other.opening || '0',
          powerOtherClosing: powerReadings.other.closing || '0',
          powerOtherActivity: otherActivity,
          recordedBy,
          shift,
          date,
          notes,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Power readings saved successfully',
        });
        
        localStorage.setItem('recordedBy', recordedBy);
        localStorage.setItem('lastFilledDate', new Date().toISOString().split('T')[0]);
        
        // Reset closing readings
        setPowerReadings(prev => ({
          office: { ...prev.office, closing: '', disabled: true },
          machine: { ...prev.machine, closing: '', disabled: true },
          coldroom1: { ...prev.coldroom1, closing: '', disabled: true },
          coldroom2: { ...prev.coldroom2, closing: '', disabled: true },
          other: { ...prev.other, closing: '', disabled: true },
        }));
        
        setOtherActivity('');
        fetchUtilityData();
        loadLastReadings();
      } else {
        throw new Error('Failed to save power readings');
      }
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save power readings',
        variant: 'destructive',
      });
    } finally {
      setIsSavingPower(false);
    }
  };

  // Handle save water readings
  const handleSaveWater = async () => {
    if (!recordedBy) {
      toast({
        title: 'Validation Error',
        description: 'Please enter your name',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingWater(true);
    
    try {
      const waterConsumption = calculateWaterConsumption();
      const totalWaterConsumed = Object.values(waterConsumption).reduce((a, b) => a + b, 0);
      
      const response = await fetch('/api/utility-readings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          waterMeter1Opening: waterReadings.meter1.opening || '0',
          waterMeter1Closing: waterReadings.meter1.closing || '0',
          waterMeter2Opening: waterReadings.meter2.opening || '0',
          waterMeter2Closing: waterReadings.meter2.closing || '0',
          recordedBy,
          shift,
          date,
          notes,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Water readings saved successfully',
        });
        
        localStorage.setItem('recordedBy', recordedBy);
        localStorage.setItem('lastFilledDate', new Date().toISOString().split('T')[0]);
        
        // Reset closing readings
        setWaterReadings(prev => ({
          meter1: { ...prev.meter1, closing: '', disabled: true },
          meter2: { ...prev.meter2, closing: '', disabled: true },
        }));
        
        fetchUtilityData();
        loadLastReadings();
      } else {
        throw new Error('Failed to save water readings');
      }
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save water readings',
        variant: 'destructive',
      });
    } finally {
      setIsSavingWater(false);
    }
  };

  // Handle save internet costs
  const handleSaveInternet = async () => {
    if (!recordedBy) {
      toast({
        title: 'Validation Error',
        description: 'Please enter your name',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingInternet(true);
    
    try {
      const totalInternetCost = (Number(internetCosts.safaricom) || 0) + 
                               (Number(internetCosts.internet5G) || 0) + 
                               (Number(internetCosts.syokinet) || 0);
      
      const response = await fetch('/api/utility-readings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          internetSafaricom: internetCosts.safaricom || '0',
          internet5G: internetCosts.internet5G || '0',
          internetSyokinet: internetCosts.syokinet || '0',
          internetBillingCycle,
          recordedBy,
          shift,
          date,
          notes,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Internet costs saved successfully',
        });
        
        localStorage.setItem('recordedBy', recordedBy);
        localStorage.setItem('lastFilledDate', new Date().toISOString().split('T')[0]);
        
        setInternetCosts({
          safaricom: '',
          internet5G: '',
          syokinet: '',
        });
        setInternetBillingCycle('');
        
        fetchUtilityData();
      } else {
        throw new Error('Failed to save internet costs');
      }
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save internet costs',
        variant: 'destructive',
      });
    } finally {
      setIsSavingInternet(false);
    }
  };

  // Handle save generator readings
  const handleSaveGenerator = async () => {
    if (!recordedBy) {
      toast({
        title: 'Validation Error',
        description: 'Please enter your name',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingGenerator(true);
    
    try {
      const generatorData = calculateGeneratorData();
      
      const response = await fetch('/api/utility-readings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          generatorStart,
          generatorStop,
          dieselRefill: dieselRefill || '0',
          dieselConsumed: dieselConsumed || generatorData.diesel.toString(),
          recordedBy,
          shift,
          date,
          notes,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Generator readings saved successfully',
        });
        
        localStorage.setItem('recordedBy', recordedBy);
        localStorage.setItem('lastFilledDate', new Date().toISOString().split('T')[0]);
        
        setDieselRefill('');
        setDieselConsumed('');
        
        fetchUtilityData();
      } else {
        throw new Error('Failed to save generator readings');
      }
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save generator readings',
        variant: 'destructive',
      });
    } finally {
      setIsSavingGenerator(false);
    }
  };

  // Handle export to CSV
  const handleExportCSV = async () => {
    try {
      let url = '/api/utility-readings/export';
      
      if (dateFilter === 'custom') {
        url += `?startDate=${dateRange.start}&endDate=${dateRange.end}`;
      } else {
        const today = new Date();
        let startDate = new Date();
        
        switch (dateFilter) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(today.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(today.getMonth() - 1);
            break;
        }
        
        url += `?startDate=${startDate.toISOString().split('T')[0]}&endDate=${today.toISOString().split('T')[0]}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to export data');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `utility-readings-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: 'Export Successful',
        description: 'Data exported to CSV file',
      });
      
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export data',
        variant: 'destructive',
      });
    }
  };

  // Handle date range change
  const handleDateRangeChange = (start: string, end: string) => {
    setDateRange({ start, end });
    setDateFilter('custom');
  };

  // Initialize on component mount
  useEffect(() => {
    fetchUtilityData();
    loadLastReadings();
    
    // Load recorded by from localStorage
    const savedName = localStorage.getItem('recordedBy') || '';
    if (savedName) setRecordedBy(savedName);
  }, []);

  // Fetch data when date filter changes
  useEffect(() => {
    fetchUtilityData();
  }, [dateFilter, dateRange]);

  const powerConsumption = calculatePowerConsumption();
  const totalPowerConsumed = Object.values(powerConsumption).reduce((a, b) => a + b, 0);
  const waterConsumption = calculateWaterConsumption();
  const totalWaterConsumed = Object.values(waterConsumption).reduce((a, b) => a + b, 0);
  const generatorData = calculateGeneratorData();

  return (
    <SidebarProvider>
      <Sidebar className="bg-gray-900 border-r border-gray-800">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-4">
            <FreshTraceLogo className="w-8 h-8 text-blue-400" />
            <h1 className="text-xl font-bold text-white">
              Harir International
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="bg-gray-950">
        <Header />
        <main className="p-4 md:p-6 lg:p-8 space-y-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Utility Management Dashboard
              </h1>
              <p className="text-gray-400 mt-1">
                Monitor and manage energy, water, diesel, and internet consumption
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={fetchUtilityData} 
                variant="outline" 
                className="border-gray-700 bg-gray-900 hover:bg-gray-800"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={handleExportCSV}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {overviewCards.energy.map((card, index) => (
              <StatCard key={`energy-${index}`} data={card} />
            ))}
          </div>

          {/* Today's Status Alert */}
          {!todayReadingsFilled && !isLoading && (
            <div className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border border-yellow-800/50 rounded-xl p-5">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-900/50 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-yellow-300">Daily Utility Reading Required</h3>
                    <p className="text-yellow-200/80 text-sm mt-1">
                      Today's utility readings have not been recorded yet.
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    const firstSection = document.getElementById('record-info');
                    if (firstSection) {
                      firstSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Fill Today's Readings
                </Button>
              </div>
            </div>
          )}

          {/* Filters and Date Range */}
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Date Range:  </Label>
                    <DateRangePicker 
                      onDateRangeChange={handleDateRangeChange}
                      dateFilter={dateFilter}
                      setDateFilter={setDateFilter}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">View</Label>
                    <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                      <SelectTrigger className="w-[150px] bg-gray-800 border-gray-700">
                        <SelectValue placeholder="Select view" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        <SelectItem value="today" className="hover:bg-gray-800">Today</SelectItem>
                        <SelectItem value="week" className="hover:bg-gray-800">Last 7 Days</SelectItem>
                        <SelectItem value="month" className="hover:bg-gray-800">Last 30 Days</SelectItem>
                        <SelectItem value="custom" className="hover:bg-gray-800">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-gray-700 text-gray-400">
                    {readings.length} records
                  </Badge>
                  <Badge className={todayReadingsFilled ? 'bg-emerald-900/50 text-emerald-400 border-emerald-800' : 'bg-yellow-900/50 text-yellow-400 border-yellow-800'}>
                    {todayReadingsFilled ? '✓ Today filled' : '⚠ Today pending'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Record Information */}
          <Card className="bg-gray-900 border-gray-800" id="record-info">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-200">
                <Users className="h-5 w-5" />
                Record Information
              </CardTitle>
              <CardDescription className="text-gray-400">
                Basic information for today's readings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-400">Recorded By</Label>
                  <Input
                    placeholder="Your name"
                    value={recordedBy}
                    onChange={(e) => setRecordedBy(e.target.value)}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-400">Shift</Label>
                  <Select value={shift} onValueChange={setShift}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="Morning" className="hover:bg-gray-800">Morning</SelectItem>
                      <SelectItem value="Evening" className="hover:bg-gray-800">Evening</SelectItem>
                      <SelectItem value="Night" className="hover:bg-gray-800">Night</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-400">Date</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label className="text-gray-400">Notes</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-gray-800 border-gray-700 min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Utility Sections */}
          <div className="space-y-4">
            {/* Power Consumption Section */}
            <UtilitySection
              title="Power Consumption"
              icon={Zap}
              color="text-blue-400"
              isOpen={openSections.power}
              onToggle={() => toggleSection('power')}
              onSave={handleSavePower}
              isSaving={isSavingPower}
              totalConsumed={`${totalPowerConsumed.toFixed(2)} kWh`}
              totalCost={`KES ${(totalPowerConsumed * UTILITY_RATES.electricity).toFixed(2)}`}
              badgeColor="blue"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Office */}
                <div className="space-y-3">
                  <Label className="font-medium text-gray-300">Office</Label>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Opening (kWh)</Label>
                    <Input
                      value={powerReadings.office.opening}
                      disabled
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Closing (kWh)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={powerReadings.office.closing}
                      onChange={(e) => setPowerReadings(prev => ({
                        ...prev,
                        office: { ...prev.office, closing: e.target.value }
                      }))}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="text-center p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-400">Consumed</p>
                    <p className="text-lg font-bold text-blue-400">
                      {powerConsumption.office.toFixed(2)} kWh
                    </p>
                  </div>
                </div>

                {/* Machine */}
                <div className="space-y-3">
                  <Label className="font-medium text-gray-300">Machine</Label>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Opening (kWh)</Label>
                    <Input
                      value={powerReadings.machine.opening}
                      disabled
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Closing (kWh)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={powerReadings.machine.closing}
                      onChange={(e) => setPowerReadings(prev => ({
                        ...prev,
                        machine: { ...prev.machine, closing: e.target.value }
                      }))}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="text-center p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-400">Consumed</p>
                    <p className="text-lg font-bold text-emerald-400">
                      {powerConsumption.machine.toFixed(2)} kWh
                    </p>
                  </div>
                </div>

                {/* Coldroom 1 */}
                <div className="space-y-3">
                  <Label className="font-medium text-gray-300">Coldroom 1</Label>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Opening (kWh)</Label>
                    <Input
                      value={powerReadings.coldroom1.opening}
                      disabled
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Closing (kWh)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={powerReadings.coldroom1.closing}
                      onChange={(e) => setPowerReadings(prev => ({
                        ...prev,
                        coldroom1: { ...prev.coldroom1, closing: e.target.value }
                      }))}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="text-center p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-400">Consumed</p>
                    <p className="text-lg font-bold text-cyan-400">
                      {powerConsumption.coldroom1.toFixed(2)} kWh
                    </p>
                  </div>
                </div>

                {/* Coldroom 2 */}
                <div className="space-y-3">
                  <Label className="font-medium text-gray-300">Coldroom 2</Label>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Opening (kWh)</Label>
                    <Input
                      value={powerReadings.coldroom2.opening}
                      disabled
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Closing (kWh)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={powerReadings.coldroom2.closing}
                      onChange={(e) => setPowerReadings(prev => ({
                        ...prev,
                        coldroom2: { ...prev.coldroom2, closing: e.target.value }
                      }))}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="text-center p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-400">Consumed</p>
                    <p className="text-lg font-bold text-blue-300">
                      {powerConsumption.coldroom2.toFixed(2)} kWh
                    </p>
                  </div>
                </div>

                {/* Other */}
                <div className="space-y-3">
                  <Label className="font-medium text-gray-300">Other Activities</Label>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Activity Type</Label>
                    <Input
                      placeholder="e.g., Welding"
                      value={otherActivity}
                      onChange={(e) => setOtherActivity(e.target.value)}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Opening (kWh)</Label>
                    <Input
                      value={powerReadings.other.opening}
                      disabled
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Closing (kWh)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={powerReadings.other.closing}
                      onChange={(e) => setPowerReadings(prev => ({
                        ...prev,
                        other: { ...prev.other, closing: e.target.value }
                      }))}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="text-center p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-400">Consumed</p>
                    <p className="text-lg font-bold text-purple-400">
                      {powerConsumption.other.toFixed(2)} kWh
                    </p>
                  </div>
                </div>
              </div>
            </UtilitySection>

            {/* Water Consumption Section */}
            <UtilitySection
              title="Water Consumption"
              icon={Droplet}
              color="text-cyan-400"
              isOpen={openSections.water}
              onToggle={() => toggleSection('water')}
              onSave={handleSaveWater}
              isSaving={isSavingWater}
              totalConsumed={`${totalWaterConsumed.toFixed(2)} m³`}
              totalCost={`KES ${(totalWaterConsumed * UTILITY_RATES.water).toFixed(2)}`}
              badgeColor="cyan"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Meter 1 */}
                <div className="space-y-4">
                  <Label className="font-medium text-lg text-gray-300">Water Meter 1</Label>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Opening (m³)</Label>
                    <Input
                      value={waterReadings.meter1.opening}
                      disabled
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Closing (m³)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={waterReadings.meter1.closing}
                      onChange={(e) => setWaterReadings(prev => ({
                        ...prev,
                        meter1: { ...prev.meter1, closing: e.target.value }
                      }))}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-400">Consumed</p>
                    <p className="text-xl font-bold text-cyan-400">
                      {waterConsumption.meter1.toFixed(2)} m³
                    </p>
                  </div>
                </div>

                {/* Meter 2 */}
                <div className="space-y-4">
                  <Label className="font-medium text-lg text-gray-300">Water Meter 2</Label>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Opening (m³)</Label>
                    <Input
                      value={waterReadings.meter2.opening}
                      disabled
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Closing (m³)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={waterReadings.meter2.closing}
                      onChange={(e) => setWaterReadings(prev => ({
                        ...prev,
                        meter2: { ...prev.meter2, closing: e.target.value }
                      }))}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-400">Consumed</p>
                    <p className="text-xl font-bold text-blue-400">
                      {waterConsumption.meter2.toFixed(2)} m³
                    </p>
                  </div>
                </div>
              </div>
            </UtilitySection>

            {/* Internet Costs Section */}
            <UtilitySection
              title="Internet Costs"
              icon={Wifi}
              color="text-violet-400"
              isOpen={openSections.internet}
              onToggle={() => toggleSection('internet')}
              onSave={handleSaveInternet}
              isSaving={isSavingInternet}
              totalCost={`KES ${(
                (Number(internetCosts.safaricom) || 0) + 
                (Number(internetCosts.internet5G) || 0) + 
                (Number(internetCosts.syokinet) || 0)
              ).toFixed(2)}`}
              badgeColor="violet"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Safaricom (KES)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={internetCosts.safaricom}
                      onChange={(e) => setInternetCosts(prev => ({
                        ...prev,
                        safaricom: e.target.value
                      }))}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">5G Internet (KES)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={internetCosts.internet5G}
                      onChange={(e) => setInternetCosts(prev => ({
                        ...prev,
                        internet5G: e.target.value
                      }))}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Syokinet (KES)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={internetCosts.syokinet}
                      onChange={(e) => setInternetCosts(prev => ({
                        ...prev,
                        syokinet: e.target.value
                      }))}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-gray-300">Billing Cycle</Label>
                  <Input
                    placeholder="e.g., 1st-30th"
                    value={internetBillingCycle}
                    onChange={(e) => setInternetBillingCycle(e.target.value)}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
              </div>
            </UtilitySection>

            {/* Generator Section */}
            <UtilitySection
              title="Generator & Diesel"
              icon={Fuel}
              color="text-orange-400"
              isOpen={openSections.generator}
              onToggle={() => toggleSection('generator')}
              onSave={handleSaveGenerator}
              isSaving={isSavingGenerator}
              totalConsumed={`${generatorData.diesel.toFixed(2)} L`}
              totalCost={`KES ${(generatorData.diesel * UTILITY_RATES.diesel).toFixed(2)}`}
              badgeColor="orange"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <Label className="font-medium text-lg text-gray-300">Generator Runtime</Label>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Start Time</Label>
                    <Input
                      type="time"
                      value={generatorStart}
                      onChange={(e) => setGeneratorStart(e.target.value)}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Stop Time</Label>
                    <Input
                      type="time"
                      value={generatorStop}
                      onChange={(e) => setGeneratorStop(e.target.value)}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-400">Runtime</p>
                    <p className="text-xl font-bold text-orange-400">
                      {generatorData.hours}h {generatorData.minutes}m
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="font-medium text-lg text-gray-300">Diesel Tracking</Label>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Diesel Consumed (L)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Auto-calculated"
                      value={dieselConsumed}
                      onChange={(e) => setDieselConsumed(e.target.value)}
                      className="bg-gray-800 border-gray-700"
                    />
                    <p className="text-xs text-gray-500">
                      Auto calculation: {generatorData.diesel.toFixed(2)} L (7L/hour)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Diesel Refill (L)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g., 500"
                      value={dieselRefill}
                      onChange={(e) => setDieselRefill(e.target.value)}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="font-medium text-lg text-gray-300">Cost Summary</Label>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Diesel Cost</span>
                      <span className="font-semibold text-gray-300">
                        KES {(generatorData.diesel * UTILITY_RATES.diesel).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Power Cost</span>
                      <span className="font-semibold text-gray-300">
                        KES {(totalPowerConsumed * UTILITY_RATES.electricity).toFixed(2)}
                      </span>
                    </div>
                    <Separator className="bg-gray-700" />
                    <div className="flex justify-between font-bold">
                      <span className="text-gray-300">Total Estimated</span>
                      <span className="text-emerald-400">
                        KES {((generatorData.diesel * UTILITY_RATES.diesel) + (totalPowerConsumed * UTILITY_RATES.electricity)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </UtilitySection>
          </div>

          {/* Recent Readings Table */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-200">Recent Readings</CardTitle>
              <CardDescription className="text-gray-400">
                {readings.length} utility readings found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full bg-gray-800" />
                  ))}
                </div>
              ) : readings.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-gray-600" />
                  <h3 className="mt-4 text-lg font-semibold text-gray-300">
                    No readings found
                  </h3>
                  <p className="mt-2 text-gray-500">
                    Start by adding your first utility reading.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-gray-800 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-800">
                      <TableRow>
                        <TableHead className="text-gray-300">Date</TableHead>
                        <TableHead className="text-gray-300">Recorded By</TableHead>
                        <TableHead className="text-gray-300">Power (kWh)</TableHead>
                        <TableHead className="text-gray-300">Water (m³)</TableHead>
                        <TableHead className="text-gray-300">Diesel (L)</TableHead>
                        <TableHead className="text-gray-300">Generator</TableHead>
                        <TableHead className="text-gray-300 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {readings.slice(0, 10).map((reading) => (
                        <TableRow key={reading.id} className="border-gray-800 hover:bg-gray-800/50">
                          <TableCell className="text-gray-300">
                            {new Date(reading.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-gray-300">{reading.recordedBy}</TableCell>
                          <TableCell>
                            <span className="font-medium text-blue-400">
                              {Number(reading.powerConsumed).toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-cyan-400">
                              {Number(reading.waterConsumed).toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-orange-400">
                              {Number(reading.dieselConsumed).toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-400">
                              {reading.generatorStart} - {reading.generatorStop}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            {readings.length > 10 && (
              <CardFooter className="justify-center border-t border-gray-800 pt-6">
                <Button variant="outline" className="border-gray-700 hover:bg-gray-800">
                  View All Readings ({readings.length})
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Footer Status */}
          <div className="pt-6 border-t border-gray-800">
            <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-400">
              <div className="flex items-center gap-3 mb-4 md:mb-0">
                {isLoading ? (
                  <>
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    <span>Loading utility data...</span>
                  </>
                ) : error ? (
                  <>
                    <div className="h-2 w-2 rounded-full bg-rose-500" />
                    <span className="text-rose-400">{error}</span>
                  </>
                ) : (
                  <>
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>Data loaded successfully</span>
                  </>
                )}
                <span className="text-gray-600">•</span>
                <span>Last updated: {lastUpdated}</span>
                <span className="text-gray-600">•</span>
                <span>{readings.length} total readings</span>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchUtilityData}
                  disabled={isLoading}
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                >
                  <RefreshCw className={`h-3 w-3 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh Data
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <ArrowLeft className="h-3 w-3 mr-2" />
                  Back to Top
                </Button>
              </div>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}