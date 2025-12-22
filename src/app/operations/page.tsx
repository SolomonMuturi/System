

'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// --- Traceability Content ---
import { traceabilityData, shipmentData } from '@/lib/data';
import { ShipmentTimeline } from '@/components/dashboard/shipment-timeline';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// --- SOP Content ---
import { sopData, type SOP } from '@/lib/sop-data';
import { CheckCircle, Circle, Edit, BookOpen, Clock, Users, FileSignature, AlertCircle as AlertCircleIcon, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, isSameDay, parseISO } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUser } from '@/hooks/use-user';
import { allSopEmployeeData } from '@/lib/sop-data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Bar, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { SopComplianceDialog } from '@/components/dashboard/sop-compliance-dialog';

// --- Contracts Content ---
import { customerData, type CustomerDocument, overviewData } from '@/lib/data';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { AlertTriangle, Truck } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { ContractsDataTable } from '@/components/dashboard/contracts-data-table';
import Link from 'next/link';
import { useRouter } from 'next/navigation';


// --- SOP Helpers ---
const getSopInitials = (name: string) => name.split(' ').map((n) => n[0]).join('');

const sopStatusConfig = {
    'Completed': { icon: CheckCircle, color: 'text-green-500', label: 'Completed' },
    'In Progress': { icon: Clock, color: 'text-yellow-500', label: 'In Progress' },
    'Not Started': { icon: Circle, color: 'text-muted-foreground', label: 'Not Started' },
};

// --- Contracts Helpers ---
type ContractWithCustomer = CustomerDocument & {
  customer: {
    id: string;
    name: string;
  };
};


export default function OperationsPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  // --- Traceability State ---
  const ShipmentMap = useMemo(
    () =>
      dynamic(() => import('@/components/dashboard/shipment-map'), {
        ssr: false,
        loading: () => <Skeleton className="h-full w-full" />,
      }),
    []
  );
  const originCoords: [number, number] = [0.2827, 36.0712]; // Nakuru, Kenya
  const destCoords: [number, number] = [-1.286389, 36.817223]; // Nairobi, Kenya
  const route: [number, number][] = [originCoords, destCoords];

  // --- SOP State ---
  const { user } = useUser();
  const [sops, setSops] = useState(sopData);
  const [selectedSop, setSelectedSop] = useState(sops[0]);
  const [sopLastModifiedText, setSopLastModifiedText] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState({ isOpen: false, sopTitle: '', department: '', employees: [], readBy: [] });

  // --- Contracts State ---
  const [allContracts, setAllContracts] = useState<ContractWithCustomer[]>([]);
  const [kpiData, setKpiData] = useState<any | null>(null);
  const [operationKpis, setOperationKpis] = useState<any | null>(null);
  
  // --- SOP Analytics State ---
  const sopAnalyticsData = useMemo(() => {
    const totalSops = sops.length;
    const completed = sops.filter(s => s.status === 'Completed').length;
    const inProgress = sops.filter(s => s.status === 'In Progress').length;
    const notStarted = sops.filter(s => s.status === 'Not Started').length;
    
    const overview = [
        { name: 'Completed', value: completed, fill: 'hsl(var(--chart-1))' },
        { name: 'In Progress', value: inProgress, fill: 'hsl(var(--chart-2))' },
        { name: 'Not Started', value: notStarted, fill: 'hsl(var(--chart-5))' },
    ];
    
    const departments = ['Admin', 'Manager', 'Warehouse', 'Driver', 'Security'];
    const complianceByDept = sops.map(sop => {
        const row: { sop: string; [key: string]: string | number } = { sop: sop.title };
        departments.forEach(dept => {
            const deptEmployees = allSopEmployeeData.filter(e => e.role === dept);
            if (deptEmployees.length === 0) {
                row[dept] = 0;
                return;
            }
            const readCount = sop.readBy.filter(empId => deptEmployees.some(e => e.id === empId)).length;
            row[dept] = (readCount / deptEmployees.length) * 100;
        });
        return row;
    });

    return { overview, complianceByDept };
  }, [sops]);


  useEffect(() => {
    setIsClient(true);
    
    // --- SOP Logic ---
    if (selectedSop) {
      setSopLastModifiedText(formatDistanceToNow(new Date(selectedSop.lastModified), { addSuffix: true }));
    }

    // --- Contracts Logic ---
    const contracts: ContractWithCustomer[] = customerData.flatMap(customer =>
      customer.documents
        .filter(doc => doc.type === 'Contract' || doc.type === 'SLA')
        .map(doc => ({
          ...doc,
          customer: { id: customer.id, name: customer.name },
        }))
    );
    setAllContracts(contracts);

    const expiring = contracts.filter(c => {
      if (c.status !== 'Active' || !c.expiryDate) return false;
      const daysLeft = differenceInDays(new Date(c.expiryDate), new Date());
      return daysLeft >= 0 && daysLeft <= 30;
    }).length;

    const active = contracts.filter(c => c.status === 'Active').length;

    const newKpiData = {
      activeContracts: {
        title: 'Active Contracts & SLAs',
        value: String(active),
        change: 'across all clients',
        changeType: 'increase' as const,
      },
      expiringSoon: {
        title: 'Expiring Soon (30 days)',
        value: String(expiring),
        change: 'require attention',
        changeType: 'increase' as const,
      },
    };
    setKpiData(newKpiData);

    const newOperationKpis = {
      activeShipments: {
          title: 'Active Shipments',
          value: String(shipmentData.filter(s => s.status === 'In-Transit' || s.status === 'Processing').length),
          change: 'currently being tracked',
          changeType: 'increase' as const,
      },
      sopsToReview: {
          title: 'SOPs Requiring Review',
          value: String(sops.filter(s => s.status !== 'Completed').length),
          change: 'across all departments',
          changeType: 'increase' as const,
      },
      expiringContracts: {
          title: 'Expiring Contracts',
          value: String(expiring),
          change: 'in the next 30 days',
          changeType: 'increase' as const,
      },
    };
    setOperationKpis(newOperationKpis);

  }, [selectedSop, sops]);


  const handleMarkAsRead = (sopId: string) => {
    const userId = user?.id || 'emp-1';
    const newSops = sops.map(sop => {
      if (sop.id === sopId && !sop.readBy.includes(userId)) {
        const newReadBy = [...sop.readBy, userId];
        let newStatus: SOP['status'] = 'In Progress';
        if (newReadBy.length === allSopEmployeeData.length) {
          newStatus = 'Completed';
        }
        return { ...sop, readBy: newReadBy, status: newStatus };
      }
      return sop;
    });
    setSops(newSops);
    if (selectedSop.id === sopId) {
      const updatedSop = newSops.find(s => s.id === sopId);
      if (updatedSop) setSelectedSop(updatedSop);
    }
  };

  const getReadByAvatars = (readByIds: string[]) => {
    return readByIds.map(id => allSopEmployeeData.find(emp => emp.id === id)).filter(Boolean);
  };

  const handleCellClick = (sop: { sop: string, [key: string]: string | number }, department: string) => {
    const clickedSop = sops.find(s => s.title === sop.sop);
    if (!clickedSop) return;

    const departmentEmployees = allSopEmployeeData.filter(e => e.role === department);

    setDialogState({
      isOpen: true,
      sopTitle: clickedSop.title,
      department: department,
      employees: departmentEmployees,
      readBy: clickedSop.readBy
    });
  };
  
  const completionPercentage = (selectedSop?.readBy.length / allSopEmployeeData.length) * 100;
  const hasUserRead = user && selectedSop ? selectedSop.readBy.includes(user.id) : false;
  
  return (
    <>
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
        <main className="p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Operations Center</h2>
              <p className="text-muted-foreground">
                Manage traceability, standard procedures, and client contracts.
              </p>
            </div>
            <Button asChild variant="outline">
                <Link href="/reports">
                    <FileText className="mr-2"/>
                    Go to Reports
                </Link>
            </Button>
          </div>
          
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {!operationKpis ? (
                  <>
                    <Skeleton className="h-[98px]" />
                    <Skeleton className="h-[98px]" />
                    <Skeleton className="h-[98px]" />
                  </>
                ) : (
                  <>
                    <Link href="/shipments" className="block transition-transform hover:scale-[1.02]">
                        <OverviewCard data={operationKpis.activeShipments} icon={Truck} />
                    </Link>
                    <Link href="/operations?tab=sops" className="block transition-transform hover:scale-[1.02]">
                        <OverviewCard data={operationKpis.sopsToReview} icon={FileSignature} />
                    </Link>
                    <Link href="/operations?tab=contracts" className="block transition-transform hover:scale-[1.02]">
                        <OverviewCard data={operationKpis.expiringContracts} icon={AlertCircleIcon} />
                    </Link>
                  </>
                )}
            </div>

          <Tabs defaultValue="traceability">
            <TabsList className="mb-6 grid w-full grid-cols-3">
              <TabsTrigger value="traceability">Traceability</TabsTrigger>
              <TabsTrigger value="sops">SOPs</TabsTrigger>
              <TabsTrigger value="contracts">Contracts & SLAs</TabsTrigger>
            </TabsList>
            <TabsContent value="traceability">
              <div className="grid gap-6 md:gap-8 grid-cols-12">
                  <div className="col-span-12 lg:col-span-4">
                      <ShipmentTimeline shipment={traceabilityData} />
                  </div>
                  <div className="col-span-12 lg:col-span-8">
                      <Card className="h-full">
                      <CardHeader>
                          <CardTitle>Route Overview</CardTitle>
                          <CardDescription>
                          From{' '}
                          <span className="font-medium text-primary">{traceabilityData.origin}</span>{' '}
                          to{' '}
                          <span className="font-medium text-primary">
                              {traceabilityData.destination}
                          </span>
                          </CardDescription>
                      </CardHeader>
                      <CardContent>
                          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg">
                          <ShipmentMap
                              origin={originCoords}
                              destination={destCoords}
                              route={route}
                          />
                          </div>
                      </CardContent>
                      </Card>
                  </div>
              </div>
            </TabsContent>
            <TabsContent value="sops">
                <Tabs defaultValue="viewer">
                    <TabsList>
                        <TabsTrigger value="viewer">SOP Viewer</TabsTrigger>
                        <TabsTrigger value="analytics">SOP Analytics</TabsTrigger>
                    </TabsList>
                    <TabsContent value="viewer" className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            <div className="col-span-1">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>All SOPs</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-2 space-y-1">
                                        {sops.map(sop => {
                                            const StatusIcon = sopStatusConfig[sop.status].icon;
                                            return (
                                                <button 
                                                    key={sop.id} 
                                                    onClick={() => setSelectedSop(sop)}
                                                    className={cn(
                                                        "w-full text-left p-3 rounded-md transition-colors",
                                                        selectedSop?.id === sop.id ? 'bg-muted' : 'hover:bg-muted/50'
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <p className="font-semibold truncate pr-2">{sop.title}</p>
                                                        <StatusIcon className={cn("w-4 h-4 flex-shrink-0", sopStatusConfig[sop.status].color)} />
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">{sopStatusConfig[sop.status].label}</p>
                                                </button>
                                            )
                                        })}
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="col-span-1 md:col-span-2 lg:col-span-3">
                                {!selectedSop ? <Skeleton className="h-[500px] w-full" /> :
                                <Card>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-xl flex items-center gap-2">
                                                    <BookOpen />
                                                    {selectedSop.title}
                                                </CardTitle>
                                                <CardDescription className="mt-1">
                                                    {isClient && sopLastModifiedText ? `Last Modified: ${sopLastModifiedText}` : <Skeleton className="h-4 w-32" />}
                                                </CardDescription>
                                            </div>
                                            <Button variant="outline"><Edit className="mr-2" /> Edit</Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="prose prose-sm max-w-none text-foreground dark:prose-invert">
                                        <p className="lead">{selectedSop.objective}</p>
                                        {selectedSop.sections.map((section, index) => (
                                            <div key={index} className="mt-6">
                                                <h3>{section.title}</h3>
                                                <ul className="list-disc pl-5 space-y-2">
                                                    {section.steps.map((step, stepIndex) => (
                                                        <li key={stepIndex}>
                                                            <strong>{step.action}:</strong> {step.detail}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </CardContent>
                                    <CardFooter className="flex flex-col items-start gap-4 border-t pt-6">
                                        <div className="w-full">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="font-semibold flex items-center gap-2"><Users /> Readership</h4>
                                                <span className="text-sm text-muted-foreground">{selectedSop.readBy.length} of {allSopEmployeeData.length} employees</span>
                                            </div>
                                            <Progress value={completionPercentage} />
                                            <TooltipProvider>
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="flex -space-x-2">
                                                    {getReadByAvatars(selectedSop.readBy).slice(0, 7).map(emp => (
                                                        emp && <Tooltip key={emp.id}>
                                                        <TooltipTrigger asChild>
                                                            <button onClick={() => router.push(`/employees?tab=overview&employeeId=${emp.id}`)} className="transition-transform hover:scale-110">
                                                                <Avatar className="h-8 w-8 border-2 border-background">
                                                                    <AvatarImage src={emp?.image} />
                                                                    <AvatarFallback>{getSopInitials(emp?.name || '')}</AvatarFallback>
                                                                </Avatar>
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{emp?.name} - Read</p>
                                                        </TooltipContent>
                                                        </Tooltip>
                                                    ))}
                                                </div>
                                                {selectedSop.readBy.length > 7 && (
                                                    <span className="text-xs text-muted-foreground">+{selectedSop.readBy.length - 7} more</span>
                                                )}
                                            </div>
                                            </TooltipProvider>
                                        </div>
                                        <Button onClick={() => handleMarkAsRead(selectedSop.id)} disabled={hasUserRead}>
                                            <CheckCircle className="mr-2"/>
                                            {hasUserRead ? 'Read' : 'Mark as Read'}
                                        </Button>
                                    </CardFooter>
                                </Card>
                                }
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="analytics" className="mt-6 space-y-6">
                         <Card>
                            <CardHeader>
                                <CardTitle>SOP Compliance Overview</CardTitle>
                                <CardDescription>A breakdown of the completion status for all SOPs.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={{}} className="h-64 w-full">
                                    <ResponsiveContainer>
                                        <BarChart data={sopAnalyticsData.overview} layout="vertical">
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--foreground))' }} />
                                            <ChartTooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                                {sopAnalyticsData.overview.map((entry) => (
                                                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>SOP Read Rate by Department</CardTitle>
                                <CardDescription>Percentage of employees in each department who have read each SOP. Click a cell for details.</CardDescription>
                            </CardHeader>
                             <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>SOP</TableHead>
                                            <TableHead className="text-right">Admin</TableHead>
                                            <TableHead className="text-right">Manager</TableHead>
                                            <TableHead className="text-right">Warehouse</TableHead>
                                            <TableHead className="text-right">Driver</TableHead>
                                            <TableHead className="text-right">Security</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sopAnalyticsData.complianceByDept.map((row) => (
                                            <TableRow key={row.sop}>
                                                <TableCell className="font-medium">{row.sop.split(':')[0]}</TableCell>
                                                {['Admin', 'Manager', 'Warehouse', 'Driver', 'Security'].map(dept => (
                                                    <TableCell 
                                                        key={dept} 
                                                        className="text-right font-mono cursor-pointer hover:bg-muted/50"
                                                        onClick={() => handleCellClick(row, dept)}
                                                    >
                                                        {(row[dept] as number).toFixed(0)}%
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </TabsContent>
            <TabsContent value="contracts">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {!kpiData ? (
                    <>
                      <Skeleton className="h-[98px]" />
                      <Skeleton className="h-[98px]" />
                    </>
                  ) : (
                    <>
                      <OverviewCard data={kpiData.activeContracts} icon={FileText} />
                      <OverviewCard data={kpiData.expiringSoon} icon={AlertTriangle} />
                    </>
                  )}
                </div>
                <ContractsDataTable contracts={allContracts} />
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
    <SopComplianceDialog 
        isOpen={dialogState.isOpen}
        onOpenChange={(open) => setDialogState(prev => ({...prev, isOpen: open}))}
        sopTitle={dialogState.sopTitle}
        department={dialogState.department}
        employees={dialogState.employees}
        readBy={dialogState.readBy}
    />
    </>
  );
}
