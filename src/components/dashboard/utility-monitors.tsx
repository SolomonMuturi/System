'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, Droplet, Fuel, Save, Clock, Wifi, Building, Cpu, Snowflake, Activity, AlertCircle, Bell } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UtilityMonitorsProps {
  onSaveSuccess?: () => void;
}

export function UtilityMonitors({ onSaveSuccess }: UtilityMonitorsProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('power');
  const [recordedBy, setRecordedBy] = useState('');
  const [shift, setShift] = useState('Morning');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Power States
  const [powerReadings, setPowerReadings] = useState({
    office: { opening: '', closing: '' },
    machine: { opening: '', closing: '' },
    coldroom1: { opening: '', closing: '' },
    coldroom2: { opening: '', closing: '' },
    other: { opening: '', closing: '' },
  });
  const [otherActivity, setOtherActivity] = useState('');
  
  // Water States
  const [waterReadings, setWaterReadings] = useState({
    meter1: { opening: '', closing: '' },
    meter2: { opening: '', closing: '' },
  });
  
  // Internet States
  const [internetCosts, setInternetCosts] = useState({
    safaricom: '',
    internet5G: '',
    syokinet: '',
  });
  const [internetBillingCycle, setInternetBillingCycle] = useState('');
  
  // Generator States
  const [generatorStart, setGeneratorStart] = useState('08:00');
  const [generatorStop, setGeneratorStop] = useState('10:30');
  const [dieselRefill, setDieselRefill] = useState('');
  const [dieselConsumed, setDieselConsumed] = useState('');
  const [notes, setNotes] = useState('');

  // Notification States
  const [notificationTime, setNotificationTime] = useState('09:00');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check and request notification permission
  const checkAndRequestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      toast({
        title: 'Notifications not supported',
        description: 'Your browser does not support desktop notifications.',
        variant: 'destructive',
      });
      return false;
    }

    if (Notification.permission === 'granted') {
      setHasNotificationPermission(true);
      return true;
    }

    if (Notification.permission === 'denied') {
      toast({
        title: 'Notifications blocked',
        description: 'Please enable notifications in your browser settings.',
        variant: 'destructive',
      });
      setHasNotificationPermission(false);
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setHasNotificationPermission(granted);
      
      if (granted) {
        toast({
          title: 'Notifications enabled',
          description: 'You will receive daily reminders.',
        });
      } else {
        toast({
          title: 'Notifications not allowed',
          description: 'You can enable them later in browser settings.',
        });
      }
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  // Calculate milliseconds until notification time
  const getTimeUntilNotification = (targetTime: string): number => {
    const now = new Date();
    const [hours, minutes] = targetTime.split(':').map(Number);
    
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }
    
    return target.getTime() - now.getTime();
  };

  // Schedule daily notification
  const scheduleDailyNotification = async (time: string) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    const hasPermission = await checkAndRequestNotificationPermission();
    if (!hasPermission) {
      setNotificationsEnabled(false);
      localStorage.setItem('notificationsEnabled', 'false');
      return;
    }

    const timeUntilNotification = getTimeUntilNotification(time);
    
    console.log(`Scheduling notification in ${Math.round(timeUntilNotification / 60000)} minutes`);
    
    notificationTimeoutRef.current = setTimeout(() => {
      showNotification();
      
      setTimeout(() => scheduleDailyNotification(time), 24 * 60 * 60 * 1000);
    }, timeUntilNotification);
  };

  // Show the actual notification
  const showNotification = () => {
    if (!hasNotificationPermission) return;

    const today = new Date().toISOString().split('T')[0];
    const lastFilledDate = localStorage.getItem('lastFilledDate');
    
    let notificationBody = '⏰ Time to fill in today\'s utility readings!';
    
    if (lastFilledDate === today) {
      notificationBody = '✅ Great! You\'ve already filled today\'s readings.';
    }

    const notification = new Notification('Utility Tracking Reminder', {
      body: notificationBody,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'daily-utility-reminder',
      requireInteraction: true,
      silent: false,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  };

  // Test notification function
  const testNotification = async () => {
    const hasPermission = await checkAndRequestNotificationPermission();
    if (hasPermission) {
      new Notification('Test Notification', {
        body: '🔔 This is a test notification from Utility Tracker',
        icon: '/favicon.ico',
        requireInteraction: true,
      });
    }
  };

  // Initialize notifications on component mount
  useEffect(() => {
    const savedName = localStorage.getItem('recordedBy') || '';
    const savedTime = localStorage.getItem('notificationTime') || '09:00';
    const notifications = localStorage.getItem('notificationsEnabled') === 'true';
    
    if (savedName) setRecordedBy(savedName);
    setNotificationTime(savedTime);
    setNotificationsEnabled(notifications);
    
    if ('Notification' in window) {
      setHasNotificationPermission(Notification.permission === 'granted');
    }
    
    if (notifications) {
      scheduleDailyNotification(savedTime);
    }
    
    // Fetch last readings
    const fetchLastReadings = async () => {
      try {
        const response = await fetch('/api/utility-readings?limit=1');
        if (response.ok) {
          const data = await response.json();
          if (data.readings && data.readings.length > 0) {
            const lastReading = data.readings[0];
            const metadata = lastReading.metadata || {};
            
            setPowerReadings({
              office: { 
                opening: metadata.powerOfficeClosing?.toString() || '', 
                closing: '' 
              },
              machine: { 
                opening: metadata.powerMachineClosing?.toString() || '', 
                closing: '' 
              },
              coldroom1: { 
                opening: metadata.powerColdroom1Closing?.toString() || '', 
                closing: '' 
              },
              coldroom2: { 
                opening: metadata.powerColdroom2Closing?.toString() || '', 
                closing: '' 
              },
              other: { 
                opening: metadata.powerOtherClosing?.toString() || '', 
                closing: '' 
              },
            });
            
            setWaterReadings({
              meter1: { 
                opening: metadata.waterMeter1Closing?.toString() || '', 
                closing: '' 
              },
              meter2: { 
                opening: metadata.waterMeter2Closing?.toString() || '', 
                closing: '' 
              },
            });
            
            setOtherActivity(metadata.powerOtherActivity || '');
          }
        }
      } catch (error) {
        console.error('Error fetching last readings:', error);
      }
    };
    
    fetchLastReadings();
    
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // Handle notification toggle
  const handleNotificationToggle = async () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      localStorage.setItem('notificationsEnabled', 'false');
      
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
        notificationTimeoutRef.current = null;
      }
      
      toast({
        title: 'Notifications Disabled',
        description: 'Daily reminders turned off',
      });
    } else {
      const hasPermission = await checkAndRequestNotificationPermission();
      if (hasPermission) {
        setNotificationsEnabled(true);
        localStorage.setItem('notificationsEnabled', 'true');
        localStorage.setItem('notificationTime', notificationTime);
        
        scheduleDailyNotification(notificationTime);
        
        toast({
          title: 'Notifications Enabled',
          description: `Daily reminders set for ${notificationTime}`,
        });
      } else {
        setNotificationsEnabled(false);
      }
    }
  };

  // Handle notification time change
  const handleNotificationTimeChange = (newTime: string) => {
    setNotificationTime(newTime);
    localStorage.setItem('notificationTime', newTime);
    
    if (notificationsEnabled) {
      scheduleDailyNotification(newTime);
      toast({
        title: 'Notification Time Updated',
        description: `Reminders will now show at ${newTime}`,
      });
    }
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

  // Calculate generator runtime and diesel
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

  // Validate all inputs
  const validateInputs = () => {
    const errors: string[] = [];
    
    Object.entries(powerReadings).forEach(([area, readings]) => {
      if (readings.closing && Number(readings.closing) < Number(readings.opening)) {
        errors.push(`${area} closing reading must be greater than opening`);
      }
    });
    
    if (Number(waterReadings.meter1.closing) < Number(waterReadings.meter1.opening)) {
      errors.push('Water Meter 1 closing reading must be greater than opening');
    }
    if (Number(waterReadings.meter2.closing) < Number(waterReadings.meter2.opening)) {
      errors.push('Water Meter 2 closing reading must be greater than opening');
    }
    
    if (!recordedBy) errors.push('Please enter your name');
    if (!date) errors.push('Please select a date');
    
    return errors;
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    const errors = validateInputs();
    if (errors.length > 0) {
      toast({
        title: 'Validation Errors',
        description: errors.join(', '),
        variant: 'destructive',
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      const generatorData = calculateGeneratorData();
      const powerConsumption = calculatePowerConsumption();
      const waterConsumption = calculateWaterConsumption();
      
      const readingData = {
        powerOfficeOpening: powerReadings.office.opening,
        powerOfficeClosing: powerReadings.office.closing,
        powerMachineOpening: powerReadings.machine.opening,
        powerMachineClosing: powerReadings.machine.closing,
        powerColdroom1Opening: powerReadings.coldroom1.opening,
        powerColdroom1Closing: powerReadings.coldroom1.closing,
        powerColdroom2Opening: powerReadings.coldroom2.opening,
        powerColdroom2Closing: powerReadings.coldroom2.closing,
        powerOtherOpening: powerReadings.other.opening,
        powerOtherClosing: powerReadings.other.closing,
        powerOtherActivity: otherActivity,
        
        waterMeter1Opening: waterReadings.meter1.opening,
        waterMeter1Closing: waterReadings.meter1.closing,
        waterMeter2Opening: waterReadings.meter2.opening,
        waterMeter2Closing: waterReadings.meter2.closing,
        
        internetSafaricom: internetCosts.safaricom || null,
        internet5G: internetCosts.internet5G || null,
        internetSyokinet: internetCosts.syokinet || null,
        internetBillingCycle: internetBillingCycle || null,
        
        generatorStart,
        generatorStop,
        dieselRefill: dieselRefill || null,
        dieselConsumed: dieselConsumed || generatorData.diesel.toString(),
        
        recordedBy,
        shift,
        date,
        notes: notes || null,
      };
      
      const response = await fetch('/api/utility-readings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(readingData),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        localStorage.setItem('recordedBy', recordedBy);
        localStorage.setItem('lastFilledDate', new Date().toISOString().split('T')[0]);
        
        toast({
          title: 'Success',
          description: 'All utility readings saved successfully!',
        });
        
        setPowerReadings({
          office: { opening: powerReadings.office.closing, closing: '' },
          machine: { opening: powerReadings.machine.closing, closing: '' },
          coldroom1: { opening: powerReadings.coldroom1.closing, closing: '' },
          coldroom2: { opening: powerReadings.coldroom2.closing, closing: '' },
          other: { opening: powerReadings.other.closing, closing: '' },
        });
        
        setWaterReadings({
          meter1: { opening: waterReadings.meter1.closing, closing: '' },
          meter2: { opening: waterReadings.meter2.closing, closing: '' },
        });
        
        setDieselRefill('');
        setDieselConsumed('');
        setNotes('');
        
        if (onSaveSuccess) onSaveSuccess();
        
      } else {
        toast({
          title: 'Save Failed',
          description: result.error || 'Failed to save readings',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving readings:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while saving readings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate totals for display
  const powerTotals = calculatePowerConsumption();
  const waterTotals = calculateWaterConsumption();
  const generatorTotals = calculateGeneratorData();
  
  const totalPower = Object.values(powerTotals).reduce((a, b) => a + b, 0);
  const totalWater = Object.values(waterTotals).reduce((a, b) => a + b, 0);

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800">
<CardHeader>
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
    <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
      Daily Utility Tracking
    </CardTitle>
    
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
      {/* Date Picker */}
      <div className="flex items-center gap-2">
        <Label htmlFor="reading-date" className="text-sm text-gray-400">Date</Label>
        <Input
          id="reading-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-gray-800 border-gray-700"
        />
      </div>
      
      {/* Notification Settings */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <Input
            type="time"
            value={notificationTime}
            onChange={(e) => handleNotificationTimeChange(e.target.value)}
            className="w-32 bg-gray-800 border-gray-700"
            disabled={!notificationsEnabled}
          />
        </div>
        
        <Button
          variant={notificationsEnabled ? "default" : "outline"}
          size="sm"
          onClick={handleNotificationToggle}
          className={notificationsEnabled ? "bg-green-600 hover:bg-green-700" : ""}
        >
          {notificationsEnabled ? 'On' : 'Off'}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={testNotification}
          className="bg-blue-900/30 border-blue-700 text-blue-400 hover:bg-blue-800 hover:text-white"
          title="Test notification immediately"
        >
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
</CardHeader>      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-5 bg-gray-800 border border-gray-700">
            <TabsTrigger value="power" className="data-[state=active]:bg-blue-900">
              <Zap className="h-4 w-4 mr-2" />
              Power
            </TabsTrigger>
            <TabsTrigger value="water" className="data-[state=active]:bg-cyan-900">
              <Droplet className="h-4 w-4 mr-2" />
              Water
            </TabsTrigger>
            <TabsTrigger value="internet" className="data-[state=active]:bg-purple-900">
              <Wifi className="h-4 w-4 mr-2" />
              Internet
            </TabsTrigger>
            <TabsTrigger value="generator" className="data-[state=active]:bg-orange-900">
              <Fuel className="h-4 w-4 mr-2" />
              Generator
            </TabsTrigger>
            <TabsTrigger value="summary" className="data-[state=active]:bg-green-900">
              <Activity className="h-4 w-4 mr-2" />
              Summary
            </TabsTrigger>
          </TabsList>
          
          {/* Power Tab */}
          <TabsContent value="power" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Office Power */}
              <div className="space-y-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <h3 className="font-medium flex items-center gap-2 text-blue-400">
                  <Building className="h-4 w-4" /> Office
                </h3>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Opening (kWh)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={powerReadings.office.opening}
                    onChange={(e) => setPowerReadings(prev => ({
                      ...prev,
                      office: { ...prev.office, opening: e.target.value }
                    }))}
                    className="bg-gray-900 border-gray-700"
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
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
                <div className="text-center bg-gray-900 p-3 rounded-md border border-gray-700">
                  <p className="text-xs text-gray-400">Consumed</p>
                  <p className="text-xl font-bold text-blue-400">{powerTotals.office.toFixed(2)} kWh</p>
                </div>
              </div>
              
              {/* Machine Power */}
              <div className="space-y-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <h3 className="font-medium flex items-center gap-2 text-green-400">
                  <Cpu className="h-4 w-4" /> Machine
                </h3>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Opening (kWh)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={powerReadings.machine.opening}
                    onChange={(e) => setPowerReadings(prev => ({
                      ...prev,
                      machine: { ...prev.machine, opening: e.target.value }
                    }))}
                    className="bg-gray-900 border-gray-700"
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
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
                <div className="text-center bg-gray-900 p-3 rounded-md border border-gray-700">
                  <p className="text-xs text-gray-400">Consumed</p>
                  <p className="text-xl font-bold text-green-400">{powerTotals.machine.toFixed(2)} kWh</p>
                </div>
              </div>
              
              {/* Coldroom 1 */}
              <div className="space-y-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <h3 className="font-medium flex items-center gap-2 text-cyan-400">
                  <Snowflake className="h-4 w-4" /> Coldroom 1
                </h3>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Opening (kWh)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={powerReadings.coldroom1.opening}
                    onChange={(e) => setPowerReadings(prev => ({
                      ...prev,
                      coldroom1: { ...prev.coldroom1, opening: e.target.value }
                    }))}
                    className="bg-gray-900 border-gray-700"
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
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
                <div className="text-center bg-gray-900 p-3 rounded-md border border-gray-700">
                  <p className="text-xs text-gray-400">Consumed</p>
                  <p className="text-xl font-bold text-cyan-400">{powerTotals.coldroom1.toFixed(2)} kWh</p>
                </div>
              </div>
              
              {/* Coldroom 2 */}
              <div className="space-y-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <h3 className="font-medium flex items-center gap-2 text-blue-300">
                  <Snowflake className="h-4 w-4" /> Coldroom 2
                </h3>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Opening (kWh)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={powerReadings.coldroom2.opening}
                    onChange={(e) => setPowerReadings(prev => ({
                      ...prev,
                      coldroom2: { ...prev.coldroom2, opening: e.target.value }
                    }))}
                    className="bg-gray-900 border-gray-700"
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
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
                <div className="text-center bg-gray-900 p-3 rounded-md border border-gray-700">
                  <p className="text-xs text-gray-400">Consumed</p>
                  <p className="text-xl font-bold text-blue-300">{powerTotals.coldroom2.toFixed(2)} kWh</p>
                </div>
              </div>
              
              {/* Other Activities */}
              <div className="space-y-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <h3 className="font-medium flex items-center gap-2 text-purple-400">
                  <Activity className="h-4 w-4" /> Other Activities
                </h3>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Activity Type</Label>
                  <Input 
                    placeholder="e.g., Welding, Maintenance"
                    value={otherActivity}
                    onChange={(e) => setOtherActivity(e.target.value)}
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Opening (kWh)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={powerReadings.other.opening}
                    onChange={(e) => setPowerReadings(prev => ({
                      ...prev,
                      other: { ...prev.other, opening: e.target.value }
                    }))}
                    className="bg-gray-900 border-gray-700"
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
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
                <div className="text-center bg-gray-900 p-3 rounded-md border border-gray-700">
                  <p className="text-xs text-gray-400">Consumed</p>
                  <p className="text-xl font-bold text-purple-400">{powerTotals.other.toFixed(2)} kWh</p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Water Tab */}
          <TabsContent value="water" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Water Meter 1 */}
              <div className="space-y-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <h3 className="font-medium flex items-center gap-2 text-cyan-400">
                  <Droplet className="h-4 w-4" /> Water Meter 1
                </h3>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Opening (m³)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={waterReadings.meter1.opening}
                    onChange={(e) => setWaterReadings(prev => ({
                      ...prev,
                      meter1: { ...prev.meter1, opening: e.target.value }
                    }))}
                    className="bg-gray-900 border-gray-700"
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
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
                <div className="text-center bg-gray-900 p-3 rounded-md border border-gray-700">
                  <p className="text-xs text-gray-400">Consumed</p>
                  <p className="text-xl font-bold text-cyan-400">{waterTotals.meter1.toFixed(2)} m³</p>
                </div>
              </div>
              
              {/* Water Meter 2 */}
              <div className="space-y-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <h3 className="font-medium flex items-center gap-2 text-blue-400">
                  <Droplet className="h-4 w-4" /> Water Meter 2
                </h3>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Opening (m³)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={waterReadings.meter2.opening}
                    onChange={(e) => setWaterReadings(prev => ({
                      ...prev,
                      meter2: { ...prev.meter2, opening: e.target.value }
                    }))}
                    className="bg-gray-900 border-gray-700"
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
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
                <div className="text-center bg-gray-900 p-3 rounded-md border border-gray-700">
                  <p className="text-xs text-gray-400">Consumed</p>
                  <p className="text-xl font-bold text-blue-400">{waterTotals.meter2.toFixed(2)} m³</p>
                </div>
              </div>
            </div>
            
            {/* Water Total Summary */}
            <div className="p-4 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-800/50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-400">Meter 1 Consumption</p>
                  <p className="text-2xl font-bold text-cyan-400">{waterTotals.meter1.toFixed(2)} m³</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">Meter 2 Consumption</p>
                  <p className="text-2xl font-bold text-blue-400">{waterTotals.meter2.toFixed(2)} m³</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">Total Water Consumed</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    {totalWater.toFixed(2)} m³
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Internet Tab */}
          <TabsContent value="internet" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Safaricom */}
              <div className="space-y-4 p-4 bg-gray-800/50 border border-purple-700/50 rounded-lg">
                <h3 className="font-medium flex items-center gap-2 text-purple-400">
                  <Wifi className="h-4 w-4" /> Safaricom
                </h3>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Monthly Cost (KES)</Label>
                  <Input 
                    type="number"
                    placeholder="0.00"
                    value={internetCosts.safaricom}
                    onChange={(e) => setInternetCosts(prev => ({
                      ...prev,
                      safaricom: e.target.value
                    }))}
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
                <div className="text-center bg-gray-900 p-3 rounded-md border border-gray-700">
                  <p className="text-xs text-gray-400">Weekly Cost</p>
                  <p className="text-xl font-bold text-purple-400">
                    KES {((Number(internetCosts.safaricom) || 0) / 4.33).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Daily: KES {((Number(internetCosts.safaricom) || 0) / 30).toFixed(2)}</p>
                </div>
              </div>
              
              {/* 5G Internet */}
              <div className="space-y-4 p-4 bg-gray-800/50 border border-blue-700/50 rounded-lg">
                <h3 className="font-medium flex items-center gap-2 text-blue-400">
                  <Wifi className="h-4 w-4" /> 5G Internet
                </h3>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Monthly Cost (KES)</Label>
                  <Input 
                    type="number"
                    placeholder="0.00"
                    value={internetCosts.internet5G}
                    onChange={(e) => setInternetCosts(prev => ({
                      ...prev,
                      internet5G: e.target.value
                    }))}
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
                <div className="text-center bg-gray-900 p-3 rounded-md border border-gray-700">
                  <p className="text-xs text-gray-400">Weekly Cost</p>
                  <p className="text-xl font-bold text-blue-400">
                    KES {((Number(internetCosts.internet5G) || 0) / 4.33).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Daily: KES {((Number(internetCosts.internet5G) || 0) / 30).toFixed(2)}</p>
                </div>
              </div>
              
              {/* Syokinet */}
              <div className="space-y-4 p-4 bg-gray-800/50 border border-green-700/50 rounded-lg">
                <h3 className="font-medium flex items-center gap-2 text-green-400">
                  <Wifi className="h-4 w-4" /> Syokinet
                </h3>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Monthly Cost (KES)</Label>
                  <Input 
                    type="number"
                    placeholder="0.00"
                    value={internetCosts.syokinet}
                    onChange={(e) => setInternetCosts(prev => ({
                      ...prev,
                      syokinet: e.target.value
                    }))}
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
                <div className="text-center bg-gray-900 p-3 rounded-md border border-gray-700">
                  <p className="text-xs text-gray-400">Weekly Cost</p>
                  <p className="text-xl font-bold text-green-400">
                    KES {((Number(internetCosts.syokinet) || 0) / 4.33).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Daily: KES {((Number(internetCosts.syokinet) || 0) / 30).toFixed(2)}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-gray-400">Billing Cycle (e.g., 1st-30th)</Label>
                <Input 
                  placeholder="Monthly billing cycle"
                  value={internetBillingCycle}
                  onChange={(e) => setInternetBillingCycle(e.target.value)}
                  className="bg-gray-900 border-gray-700"
                />
              </div>
              
              {/* Internet Total Summary */}
              <div className="p-4 bg-gradient-to-r from-purple-900/20 to-green-900/20 border border-purple-800/50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Safaricom</p>
                    <p className="text-lg font-bold text-purple-400">
                      KES {(Number(internetCosts.safaricom) || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">5G Internet</p>
                    <p className="text-lg font-bold text-blue-400">
                      KES {(Number(internetCosts.internet5G) || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Syokinet</p>
                    <p className="text-lg font-bold text-green-400">
                      KES {(Number(internetCosts.syokinet) || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Total Monthly</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">
                      KES {(
                        (Number(internetCosts.safaricom) || 0) + 
                        (Number(internetCosts.internet5G) || 0) + 
                        (Number(internetCosts.syokinet) || 0)
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Generator Tab */}
          <TabsContent value="generator" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Generator Runtime */}
              <div className="space-y-4 p-4 bg-gray-800/50 border border-orange-700/50 rounded-lg">
                <h3 className="font-medium flex items-center gap-2 text-orange-400">
                  <Clock className="h-4 w-4" /> Generator Runtime
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Start Time</Label>
                    <Input 
                      type="time"
                      value={generatorStart}
                      onChange={(e) => setGeneratorStart(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-center"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Stop Time</Label>
                    <Input 
                      type="time"
                      value={generatorStop}
                      onChange={(e) => setGeneratorStop(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-center"
                    />
                  </div>
                </div>
                <div className="text-center bg-gray-900 p-3 rounded-md border border-gray-700">
                  <p className="text-xs text-gray-400">Total Runtime</p>
                  <p className="text-xl font-bold text-orange-400">
                    {generatorTotals.hours}h {generatorTotals.minutes}m
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {generatorStart} → {generatorStop}
                  </p>
                </div>
              </div>
              
              {/* Diesel Tracking */}
              <div className="space-y-4 p-4 bg-gray-800/50 border border-red-700/50 rounded-lg">
                <h3 className="font-medium flex items-center gap-2 text-red-400">
                  <Fuel className="h-4 w-4" /> Diesel Tracking
                </h3>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Diesel Consumed (L)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    placeholder="Auto-calculated from runtime"
                    value={dieselConsumed}
                    onChange={(e) => setDieselConsumed(e.target.value)}
                    className="bg-gray-900 border-gray-700"
                  />
                  <p className="text-xs text-gray-400">
                    Auto calculation: {generatorTotals.diesel.toFixed(2)} L (7L/hour)
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
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Power Summary */}
              <div className="space-y-4 p-4 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg">
                <h3 className="font-medium flex items-center gap-2 text-blue-400">
                  <Zap className="h-4 w-4" /> Power Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Office:</span>
                    <span className="text-blue-400">{powerTotals.office.toFixed(2)} kWh</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Machine:</span>
                    <span className="text-green-400">{powerTotals.machine.toFixed(2)} kWh</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Coldroom 1:</span>
                    <span className="text-cyan-400">{powerTotals.coldroom1.toFixed(2)} kWh</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Coldroom 2:</span>
                    <span className="text-blue-300">{powerTotals.coldroom2.toFixed(2)} kWh</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Other:</span>
                    <span className="text-purple-400">{powerTotals.other.toFixed(2)} kWh</span>
                  </div>
                  <div className="border-t border-gray-700 pt-2 mt-2">
                    <div className="flex justify-between font-bold">
                      <span>Total Power:</span>
                      <span className="text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        {totalPower.toFixed(2)} kWh
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Water Summary */}
              <div className="space-y-4 p-4 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg">
                <h3 className="font-medium flex items-center gap-2 text-cyan-400">
                  <Droplet className="h-4 w-4" /> Water Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Meter 1:</span>
                    <span className="text-cyan-400">{waterTotals.meter1.toFixed(2)} m³</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Meter 2:</span>
                    <span className="text-blue-400">{waterTotals.meter2.toFixed(2)} m³</span>
                  </div>
                  <div className="border-t border-gray-700 pt-2 mt-2">
                    <div className="flex justify-between font-bold">
                      <span>Total Water:</span>
                      <span className="text-xl bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        {totalWater.toFixed(2)} m³
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Generator & Internet Summary */}
              <div className="space-y-4 p-4 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg">
                <h3 className="font-medium flex items-center gap-2 text-orange-400">
                  <Activity className="h-4 w-4" /> Other Summary
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400">Generator Runtime</p>
                    <p className="text-lg font-bold text-orange-400">
                      {generatorTotals.hours}h {generatorTotals.minutes}m
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Diesel Consumed</p>
                    <p className="text-lg font-bold text-red-400">
                      {generatorTotals.diesel.toFixed(2)} L
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Internet Cost</p>
                    <p className="text-lg font-bold text-purple-400">
                      KES {(
                        (Number(internetCosts.safaricom) || 0) + 
                        (Number(internetCosts.internet5G) || 0) + 
                        (Number(internetCosts.syokinet) || 0)
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Final Summary Card */}
            <div className="p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/50 rounded-lg">
              <h3 className="font-medium text-lg mb-4 text-center">Daily Totals Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-400">Total Power Consumed</p>
                  <p className="text-3xl font-bold text-blue-400">{totalPower.toFixed(2)} kWh</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">Total Water Consumed</p>
                  <p className="text-3xl font-bold text-cyan-400">{totalWater.toFixed(2)} m³</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">Diesel Consumed</p>
                  <p className="text-3xl font-bold text-orange-400">{generatorTotals.diesel.toFixed(2)} L</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Record Information */}
        <div className="mt-6 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
          <h3 className="font-medium mb-4 text-gray-300">Record Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-gray-400">Recorded By</Label>
              <Input 
                placeholder="Your name"
                value={recordedBy}
                onChange={(e) => setRecordedBy(e.target.value)}
                className="bg-gray-900 border-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-gray-400">Shift</Label>
              <Select value={shift} onValueChange={setShift}>
                <SelectTrigger className="bg-gray-900 border-gray-700">
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
              <Label className="text-sm text-gray-400">Selected Date</Label>
              <Input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-gray-900 border-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-gray-400">Notes (Optional)</Label>
              <Input 
                placeholder="Additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-gray-900 border-gray-700"
              />
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="justify-between border-t border-gray-800 pt-6">
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <AlertCircle className="h-4 w-4" />
            {notificationsEnabled ? (
              <span>Daily reminders set for {notificationTime}</span>
            ) : (
              <span>Enable notifications for daily reminders</span>
            )}
          </div>
          {!hasNotificationPermission && notificationsEnabled && (
            <div className="text-xs text-yellow-400">
              Notifications are blocked. Click the "On" button to enable.
            </div>
          )}
        </div>
        <Button 
          onClick={handleSaveChanges} 
          disabled={isSaving}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          size="lg"
        >
          <Save className="mr-2" />
          {isSaving ? 'Saving...' : 'Save All Readings'}
        </Button>
      </CardFooter>
    </Card>
  );
}