'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '../ui/button';
import Link from 'next/link';
import { Zap, Droplet, Fuel, Save, Clock, Play, StopCircle } from 'lucide-react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UtilityMonitorsProps {
    onSaveSuccess?: () => void;
}

export function UtilityMonitors({ onSaveSuccess }: UtilityMonitorsProps) {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [shift, setShift] = useState('Morning');
    const [recordedBy, setRecordedBy] = useState('');
    
    const [powerOpening, setPowerOpening] = useState('');
    const [powerClosing, setPowerClosing] = useState('');
    const [waterOpening, setWaterOpening] = useState('');
    const [waterClosing, setWaterClosing] = useState('');
    const [generatorStart, setGeneratorStart] = useState('08:00');
    const [generatorStop, setGeneratorStop] = useState('10:30');
    const [dieselRefill, setDieselRefill] = useState('');
    const [notes, setNotes] = useState('');

    // Fetch last readings on mount
    useEffect(() => {
        const fetchLastReadings = async () => {
            try {
                const response = await fetch('/api/utility-readings?limit=1');
                if (response.ok) {
                    const data = await response.json();
                    if (data.readings && data.readings.length > 0) {
                        const lastReading = data.readings[0];
                        setPowerOpening(lastReading.powerClosing.toString());
                        setWaterOpening(lastReading.waterClosing.toString());
                    }
                }
            } catch (error) {
                console.error('Error fetching last readings:', error);
            }
        };
        
        fetchLastReadings();
        
        // Set default recordedBy from localStorage or browser
        const savedName = localStorage.getItem('recordedBy') || '';
        if (savedName) {
            setRecordedBy(savedName);
        }
    }, []);

    // Calculate derived values for display only
    const calculateValues = () => {
        const powerOpeningNum = Number(powerOpening) || 0;
        const powerClosingNum = Number(powerClosing) || 0;
        const waterOpeningNum = Number(waterOpening) || 0;
        const waterClosingNum = Number(waterClosing) || 0;
        
        const powerConsumed = Math.max(powerClosingNum - powerOpeningNum, 0);
        const waterConsumed = Math.max(waterClosingNum - waterOpeningNum, 0);
        
        // Calculate time difference
        const [startHour, startMin] = generatorStart.split(':').map(Number);
        const [stopHour, stopMin] = generatorStop.split(':').map(Number);
        
        let totalMinutes = (stopHour * 60 + stopMin) - (startHour * 60 + startMin);
        if (totalMinutes < 0) totalMinutes += 24 * 60;
        
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const totalHours = totalMinutes / 60;
        const dieselConsumed = totalHours * 7;
        
        const formatTimeDisplay = () => {
            if (hours === 0 && minutes === 0) return '0 hours';
            const parts = [];
            if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
            if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
            return parts.join(' ');
        };
        
        return {
            powerConsumed,
            waterConsumed,
            timeConsumed: formatTimeDisplay(),
            dieselConsumed,
            hours,
            minutes,
            totalHours
        };
    };
    
    const { 
        powerConsumed, 
        waterConsumed, 
        timeConsumed, 
        dieselConsumed,
        hours,
        minutes 
    } = calculateValues();

    const handleSaveChanges = async () => {
        // Validate inputs
        if (!powerOpening || !powerClosing) {
            toast({
                title: 'Validation Error',
                description: 'Please enter both power opening and closing readings',
                variant: 'destructive',
            });
            return;
        }
        
        if (!waterOpening || !waterClosing) {
            toast({
                title: 'Validation Error',
                description: 'Please enter both water opening and closing readings',
                variant: 'destructive',
            });
            return;
        }
        
        if (!recordedBy) {
            toast({
                title: 'Validation Error',
                description: 'Please enter your name',
                variant: 'destructive',
            });
            return;
        }

        // Validate power readings
        if (Number(powerClosing) < Number(powerOpening)) {
            toast({
                title: 'Validation Error',
                description: 'Power closing reading must be greater than opening reading',
                variant: 'destructive',
            });
            return;
        }

        // Validate water readings
        if (Number(waterClosing) < Number(waterOpening)) {
            toast({
                title: 'Validation Error',
                description: 'Water closing reading must be greater than opening reading',
                variant: 'destructive',
            });
            return;
        }

        // Validate generator times
        if (!generatorStart || !generatorStop) {
            toast({
                title: 'Validation Error',
                description: 'Please enter both generator start and stop times',
                variant: 'destructive',
            });
            return;
        }

        setIsSaving(true);

        try {
            // Only send raw input data, not calculated values
            // Send empty string for optional fields instead of null
            const readingData = {
                powerOpening,
                powerClosing,
                waterOpening,
                waterClosing,
                generatorStart,
                generatorStop,
                dieselRefill: dieselRefill || '', // Send empty string instead of null
                recordedBy,
                shift: shift || '', // Send empty string instead of null
                notes: notes || '', // Send empty string instead of null
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
                // Save name to localStorage for future use
                localStorage.setItem('recordedBy', recordedBy);
                
                toast({
                    title: 'Readings Saved',
                    description: 'Utility readings have been saved to database successfully.',
                });
                
                // Reset closing readings for next entry
                setPowerOpening(powerClosing.toString());
                setWaterOpening(waterClosing.toString());
                setPowerClosing('');
                setWaterClosing('');
                setDieselRefill('');
                setNotes('');
                
                // Trigger refresh in parent component if callback exists
                if (onSaveSuccess) {
                    onSaveSuccess();
                }
                
            } else {
                // Show detailed validation errors if available
                if (result.details) {
                    const errorMessage = result.details.map((err: any) => 
                        `${err.field}: ${err.message}`
                    ).join(', ');
                    toast({
                        title: 'Validation Failed',
                        description: errorMessage,
                        variant: 'destructive',
                    });
                } else {
                    toast({
                        title: 'Save Failed',
                        description: result.error || 'Failed to save readings',
                        variant: 'destructive',
                    });
                }
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

    return (
        <>
            <Card className="md:col-span-3">
                <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center justify-center gap-2">
                        Manual Utility Meter Readings
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Power */}
                    <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="font-medium flex items-center gap-2 text-yellow-500"><Zap /> Power Usage</h3>
                        <div className="space-y-2">
                            <Label htmlFor="power-opening">Opening Reading (kWh)</Label>
                            <Input 
                                id="power-opening" 
                                type="number" 
                                step="0.01"
                                value={powerOpening} 
                                onChange={(e) => setPowerOpening(e.target.value)}
                                placeholder="Previous closing reading"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="power-closing">Closing Reading (kWh)</Label>
                            <Input 
                                id="power-closing" 
                                type="number" 
                                step="0.01"
                                value={powerClosing} 
                                onChange={(e) => setPowerClosing(e.target.value)}
                                placeholder="Current reading"
                            />
                        </div>
                        <div className="text-center bg-muted p-2 rounded-md">
                            <p className="text-xs text-muted-foreground">Consumed Today</p>
                            <p className="text-xl font-bold">{powerConsumed.toFixed(2)} kWh</p>
                        </div>
                    </div>
                    
                    {/* Water */}
                    <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="font-medium flex items-center gap-2 text-blue-500"><Droplet /> Water Usage</h3>
                        <div className="space-y-2">
                            <Label htmlFor="water-opening">Opening Reading (m³)</Label>
                            <Input 
                                id="water-opening" 
                                type="number" 
                                step="0.01"
                                value={waterOpening} 
                                onChange={(e) => setWaterOpening(e.target.value)}
                                placeholder="Previous closing reading"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="water-closing">Closing Reading (m³)</Label>
                            <Input 
                                id="water-closing" 
                                type="number" 
                                step="0.01"
                                value={waterClosing} 
                                onChange={(e) => setWaterClosing(e.target.value)}
                                placeholder="Current reading"
                            />
                        </div>
                        <div className="text-center bg-muted p-2 rounded-md">
                            <p className="text-xs text-muted-foreground">Consumed Today</p>
                            <p className="text-xl font-bold">{waterConsumed.toFixed(2)} m³</p>
                        </div>
                    </div>
                    
                    {/* Diesel */}
                    <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="font-medium flex items-center gap-2 text-orange-500"><Fuel /> Generator Diesel</h3>
                        
                        {/* Generator Runtime */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <Label>Generator Runtime (Engine consumes 7L/hr)</Label>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Play className="h-4 w-4 text-green-500" />
                                        <Label htmlFor="generator-start" className="text-xs font-medium">Start Time</Label>
                                    </div>
                                    <Input 
                                        id="generator-start" 
                                        type="time"
                                        value={generatorStart}
                                        onChange={(e) => setGeneratorStart(e.target.value)}
                                        className="text-center"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <StopCircle className="h-4 w-4 text-red-500" />
                                        <Label htmlFor="generator-stop" className="text-xs font-medium">Stop Time</Label>
                                    </div>
                                    <Input 
                                        id="generator-stop" 
                                        type="time"
                                        value={generatorStop}
                                        onChange={(e) => setGeneratorStop(e.target.value)}
                                        className="text-center"
                                    />
                                </div>
                            </div>
                            
                            {/* Time Consumed Display */}
                            <div className="text-center bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border">
                                <p className="text-xs text-muted-foreground">Time Consumed</p>
                                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                    {timeConsumed}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {generatorStart} → {generatorStop}
                                </p>
                            </div>
                        </div>
                        
                        {/* Diesel Consumption Calculation */}
                        <div className="text-center bg-orange-50 dark:bg-orange-900/20 p-3 rounded-md border space-y-1">
                            <p className="text-xs text-muted-foreground">Diesel Consumed Today</p>
                            <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                                {dieselConsumed.toFixed(2)} L
                            </p>
                            <p className="text-xs text-muted-foreground">
                                @ 7L/hour consumption rate
                            </p>
                        </div>
                        
                        {/* Last Refill Amount */}
                        <div className="space-y-2">
                            <Label htmlFor="diesel-refill">Last Refill Amount (L)</Label>
                            <Input 
                                id="diesel-refill" 
                                type="number" 
                                step="0.01"
                                placeholder="e.g., 500" 
                                value={dieselRefill} 
                                onChange={(e) => setDieselRefill(e.target.value)} 
                            />
                        </div>
                        
                        {/* Detailed Breakdown Link */}
                        <div className="text-center bg-muted p-2 rounded-md">
                            <Link href="/utility/diesel-analytics" className="w-full">
                                <Button variant="link">View Detailed Breakdown</Button>
                            </Link>
                        </div>
                    </div>
                </CardContent>
                
                {/* Metadata Section */}
                <div className="p-6 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="recorded-by">Recorded By</Label>
                            <Input 
                                id="recorded-by" 
                                placeholder="Your name" 
                                value={recordedBy}
                                onChange={(e) => setRecordedBy(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="shift">Shift</Label>
                            <Select value={shift} onValueChange={setShift}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select shift" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Morning">Morning</SelectItem>
                                    <SelectItem value="Evening">Evening</SelectItem>
                                    <SelectItem value="Night">Night</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Input 
                                id="notes" 
                                placeholder="Any additional notes..." 
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                
                <CardFooter className="justify-end">
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        <Save className="mr-2" />
                        {isSaving ? 'Saving...' : 'Save All Readings'}
                    </Button>
                </CardFooter>
            </Card>
        </>
    );
}