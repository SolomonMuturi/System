
'use client';

import { useState } from 'react';
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
import { EmployeePerformanceChart } from '@/components/dashboard/employee-performance-chart';
import { employeePerformanceData } from '@/lib/data';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { Award, UserCheck, ShieldAlert } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmployeePerformanceOverviewChart } from '@/components/dashboard/employee-performance-overview-chart';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const kpiData = {
  topPerformer: {
    title: 'Top Performer',
    value: 'John Omondi',
    change: '98% rating',
    changeType: 'increase' as const,
  },
  attendanceRate: {
    title: 'Team Attendance Rate',
    value: '96%',
    change: 'this month',
    changeType: 'increase' as const,
  },
  safetyIncidents: {
    title: 'Safety Incidents (YTD)',
    value: '7',
    change: '-2 from last year',
    changeType: 'decrease' as const,
  },
};

const guardPerformanceData = [
    { name: 'Patrols', score: 28, other: 12 },
    { name: 'Reports', score: 35, other: 15 },
    { name: 'Incidents', score: 10, other: 5 },
    { name: 'Compliance', score: 38, other: 2 },
];

const performanceLogData = [
    { id: 'log-1', employee: 'John Omondi', date: '2024-07-28', event: 'Completed Advanced Cold Chain SOP', type: 'Training' },
    { id: 'log-2', employee: 'Jane Wanjiku', date: '2024-07-25', event: 'Received customer commendation', type: 'Positive Feedback' },
    { id: 'log-3', employee: 'Chris Mwangi', date: '2024-07-22', event: 'Minor safety violation (no PPE)', type: 'Disciplinary' },
    { id: 'log-4', employee: 'Emily Adhiambo', date: '2024-07-20', event: 'Led successful process optimization', type: 'Achievement' },
];

export default function PerformanceManagementPage() {
    const eventTypeVariant = {
        'Training': 'default',
        'Positive Feedback': 'secondary',
        'Disciplinary': 'destructive',
        'Achievement': 'outline',
    } as const;

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
            <div>
                <h2 className="text-2xl font-bold tracking-tight">
                Employee Performance Management
                </h2>
                <p className="text-muted-foreground">
                Track and analyze employee performance metrics.
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <OverviewCard data={kpiData.topPerformer} icon={Award} />
                <OverviewCard data={kpiData.attendanceRate} icon={UserCheck} />
                <OverviewCard data={kpiData.safetyIncidents} icon={ShieldAlert} />
            </div>

            <Tabs defaultValue="overview">
                <TabsList>
                    <TabsTrigger value="overview">Team Overview</TabsTrigger>
                    <TabsTrigger value="details">Detailed View</TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                    <EmployeePerformanceChart data={employeePerformanceData} />
                </TabsContent>
                <TabsContent value="details" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1">
                            <EmployeePerformanceOverviewChart data={guardPerformanceData} />
                        </div>
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Performance Log</CardTitle>
                                    <CardDescription>A log of notable employee performance events.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Employee</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Event</TableHead>
                                                <TableHead>Type</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {performanceLogData.map(log => (
                                                <TableRow key={log.id}>
                                                    <TableCell>{log.employee}</TableCell>
                                                    <TableCell>{format(new Date(log.date), 'PPP')}</TableCell>
                                                    <TableCell>{log.event}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={eventTypeVariant[log.type as keyof typeof eventTypeVariant]}>{log.type}</Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}



    