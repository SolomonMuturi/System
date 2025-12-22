

'use client';

import { useState, useRef, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
import { customerData, accountsReceivableData, type CustomerDocument, shipmentData } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DollarSign, Receipt, TrendingUp, Mail, Phone, Building, Briefcase, FileText, PlusCircle, Paperclip, Send, Loader2, Sparkles, Package, Weight, CheckCircle, Save, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, formatDistanceToNow, differenceInDays, parseISO } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ActivityTimeline } from '@/components/dashboard/activity-timeline';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PrintableContract } from '@/components/dashboard/printable-contract';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, XAxis, YAxis, Tooltip, Bar, ResponsiveContainer, CartesianGrid, Pie, PieChart, Cell } from 'recharts';
import { PrintableCustomerReport } from '@/components/dashboard/printable-customer-report';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';


export default function CustomerDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const customerId = params.id as string;
  
  const contractPrintRef = useRef<HTMLDivElement>(null);
  const customerReportPrintRef = useRef<HTMLDivElement>(null);

  const [selectedDocument, setSelectedDocument] = useState<CustomerDocument | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isLogActivityOpen, setIsLogActivityOpen] = useState(false);
  
  const activeTab = searchParams.get('tab') || 'overview';
  const docToHighlight = searchParams.get('doc');

  const customer = customerData.find((c) => c.id === customerId);
  
  const getInitials = (name: string = '') => {
    return name.split(' ').map(n => n[0]).join('');
  }

  const customerShipments = useMemo(() => {
    if (!customer) return [];
    const customerOrderIds = new Set(customer.orderHistory.map(o => o.shipmentId));
    return shipmentData.filter(s => customerOrderIds.has(s.id));
  }, [customer]);
  
  const analyticsData = useMemo(() => {
    if (!customer) return null;

    const totalOrders = customer.orderHistory.length;
    const fulfilledOrders = customer.orderHistory.filter(o => o.status === 'Delivered').length;
    const totalWeightKg = customerShipments.reduce((acc, s) => {
        const weightMatch = s.weight.match(/(\d+(\.\d+)?)/);
        return acc + (weightMatch ? parseFloat(weightMatch[0]) : 0);
    }, 0);
    const avgOrderValue = totalOrders > 0 ? customer.orderHistory.reduce((acc, o) => acc + o.value, 0) / totalOrders : 0;
    
    const produceCounts = customer.orderHistory.reduce((acc, order) => {
        const product = shipmentData.find(s => s.id === order.shipmentId)?.product || 'Unknown';
        acc[product] = (acc[product] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const produceBreakdown = Object.entries(produceCounts).map(([name, value], i) => ({
      name,
      value,
      fill: `hsl(var(--chart-${(i % 5) + 1}))`
    }));

    const orderStatusCounts = customer.orderHistory.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const orderStatusBreakdown = Object.entries(orderStatusCounts).map(([name, value], i) => ({
        name,
        value,
        fill: name === 'Delivered' ? 'hsl(var(--chart-1))' : name === 'In-Transit' ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-4))'
    }));

    return {
      totalOrders,
      fulfilledOrders,
      totalWeightTonnes: totalWeightKg / 1000,
      avgOrderValue,
      produceBreakdown,
      orderStatusBreakdown,
    };
  }, [customer, customerShipments]);


  const monthlyOrderData = useMemo(() => {
    if (!customer) return [];
    const sortedOrders = [...customer.orderHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sortedOrders.reduce((acc, order) => {
        const month = format(parseISO(order.date), 'MMM yyyy');
        const existing = acc.find(d => d.month === month);
        if (existing) {
            existing.value += order.value;
        } else {
            acc.push({ month, value: order.value });
        }
        return acc;
    }, [] as { month: string; value: number }[]);
  }, [customer]);


  if (!customer || !analyticsData) {
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
            <main className="p-4 md:p-6 lg:p-8">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2" />
                    Back to Customers
                </Button>
                <div className="flex items-center justify-center h-64">
                    <p>Customer not found.</p>
                </div>
            </main>
            </SidebarInset>
      </SidebarProvider>
    );
  }
  
  const customerReceivables = accountsReceivableData.filter(ar => ar.customer === customer.name);

  const ytdSalesOverview = {
    title: 'YTD Sales',
    value: customer.ytdSales.toLocaleString('en-KE', { style: 'currency', currency: 'KES' }),
    change: 'vs. Previous Year',
    changeType: 'increase' as const,
  }

  const outstandingBalance = {
    title: 'Outstanding Balance',
    value: customer.outstandingBalance.toLocaleString('en-KE', { style: 'currency', currency: 'KES' }),
    change: `${customer.openInvoices} open invoices`,
    changeType: 'increase' as const,
  }
  
  const statusVariant = {
    active: 'default',
    new: 'secondary',
    inactive: 'outline',
  } as const;

  const orderStatusVariant = {
    'Delivered': 'default',
    'In-Transit': 'secondary',
    'Processing': 'outline',
  } as const;
  
  const docStatusVariant = {
    'Active': 'default',
    'Expired': 'destructive',
    'Terminated': 'destructive',
  } as const;
  
  const arStatusVariant = {
    'On Time': 'default',
    'At Risk': 'secondary',
    'Late': 'destructive',
  } as const;


  const primaryContact = customer.contacts[0];
  
  const handleSendReminder = (docName: string) => {
    toast({
      title: 'Renewal Reminder Sent',
      description: `A reminder for the ${docName} has been sent to the primary contact.`,
    });
  };

  const handleDownloadPdf = async (doc: CustomerDocument) => {
    setSelectedDocument(doc);
    setIsGeneratingPdf(true);
    
    await new Promise(resolve => setTimeout(resolve, 100));

    const element = contractPrintRef.current;
    if (element) {
        const canvas = await html2canvas(element, { scale: 3, useCORS: true });
        const imgData = canvas.toDataURL('image/jpeg');
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const canvasRatio = canvasHeight / canvasWidth;
        
        let finalWidth = pdfWidth;
        let finalHeight = pdfWidth * canvasRatio;

        if (finalHeight > pdfHeight) {
            finalHeight = pdfHeight;
            finalWidth = pdfHeight / canvasRatio;
        }

        const x = (pdfWidth - finalWidth) / 2;
        const y = 0; // Start from top
        
        pdf.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);
        pdf.save(`${doc.name.replace('.pdf', '')}.pdf`);
    } else {
        toast({
            variant: 'destructive',
            title: 'Generation Failed',
            description: 'Could not find the content to generate the report.',
        });
    }
    
    setIsGeneratingPdf(false);
    setSelectedDocument(null);
  };
  
  const handleLogActivitySubmit = () => {
    setIsLogActivityOpen(false);
    toast({
        title: 'Activity Logged',
        description: 'Your new activity has been added to the timeline.'
    });
  }
  
  const handleSaveReport = () => {
    toast({
        title: 'Report Saved',
        description: 'The manual report summary has been saved.',
    });
  }
  
  const handlePrintCustomerReport = async () => {
    setIsGeneratingPdf(true);
    toast({ title: "Generating Report...", description: "Please wait while the customer report is being generated." });
    
    await new Promise(resolve => setTimeout(resolve, 100));

    const element = customerReportPrintRef.current;
    if (element) {
        const canvas = await html2canvas(element, { scale: 2 });
        const data = canvas.toDataURL('image/jpeg');
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(data, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`customer-report-${customer.name.replace(/\s/g, '_')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } else {
        toast({
            variant: 'destructive',
            title: 'Generation Failed',
            description: 'Could not find the content to generate the report.',
        });
    }
    
    setIsGeneratingPdf(false);
  };

  const otherFinancialDocs = customer.documents.filter(doc => doc.type === 'PO' || doc.type === 'GRN');
  

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
        <main className="p-4 md:p-6 lg:p-8 space-y-6">
            <div>
                 <Button variant="outline" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2" />
                    Back to Customers
                </Button>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={customer.logoUrl} />
                            <AvatarFallback className="text-2xl">{getInitials(customer.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                {customer.name}
                                <Badge variant={statusVariant[customer.status]} className='capitalize text-sm'>{customer.status}</Badge>
                            </h2>
                            <p className="text-muted-foreground">
                                {customer.website}
                            </p>
                        </div>
                    </div>
                     <div className="flex gap-2">
                        <Button variant="outline" onClick={handlePrintCustomerReport} disabled={isGeneratingPdf}>
                            {isGeneratingPdf ? <Loader2 className="mr-2 animate-spin" /> : <Printer className="mr-2" />}
                            Download Report
                        </Button>
                        <Dialog open={isLogActivityOpen} onOpenChange={setIsLogActivityOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <PlusCircle className="mr-2" />
                                    Log Activity
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Log New Activity for {customer.name}</DialogTitle>
                                    <DialogDescription>Record a new interaction or note.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                     <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="activity-type">Activity Type</Label>
                                            <Select>
                                                <SelectTrigger id="activity-type">
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Call">Call</SelectItem>
                                                    <SelectItem value="Email">Email</SelectItem>
                                                    <SelectItem value="Meeting">Meeting</SelectItem>
                                                    <SelectItem value="Note">Note</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="activity-title">Title</Label>
                                        <Input id="activity-title" placeholder="e.g., Follow-up call re: Q3 pricing" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="activity-notes">Notes</Label>
                                        <Textarea id="activity-notes" placeholder="Type your activity note here..." />
                                    </div>
                                </div>
                                <Button onClick={handleLogActivitySubmit}>Log Activity</Button>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <OverviewCard data={ytdSalesOverview} icon={TrendingUp} />
                <OverviewCard data={outstandingBalance} icon={DollarSign} />
            </div>

             <Tabs value={activeTab} onValueChange={(value) => router.push(`/customers/${customerId}?tab=${value}`)}>
                <TabsList className="grid w-full grid-cols-7">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="orders">Orders ({customer.orderHistory.length})</TabsTrigger>
                    <TabsTrigger value="financials">Financials</TabsTrigger>
                    <TabsTrigger value="contacts">Contacts</TabsTrigger>
                    <TabsTrigger value="contracts">Contracts &amp; SLAs</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Customer Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground"><Building /> {customer.name}</div>
                                <div className="flex items-center gap-2 text-muted-foreground"><Briefcase /> Primary Contact: {primaryContact.name} ({primaryContact.role})</div>
                                <div className="flex items-center gap-2 text-muted-foreground"><Mail /> {primaryContact.email}</div>
                                <div className="flex items-center gap-2 text-muted-foreground"><Phone /> {primaryContact.phone}</div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="activity" className="mt-6">
                    <ActivityTimeline activities={customer.activity} />
                </TabsContent>

                <TabsContent value="orders" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Order History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order ID</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Value (KES)</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customer.orderHistory.map(order => (
                                        <TableRow key={order.orderId}>
                                            <TableCell className="font-mono">{order.orderId}</TableCell>
                                            <TableCell>{format(new Date(order.date), 'PPP')}</TableCell>
                                            <TableCell className="font-mono">{order.value.toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Badge variant={orderStatusVariant[order.status]}>{order.status}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="link" className="p-0 h-auto" onClick={() => router.push(`/traceability?shipmentId=${order.shipmentId}`)}>
                                                    Track Shipment
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="financials" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Accounts Receivable History</CardTitle>
                            <CardDescription>A log of all invoices for {customer.name}.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice ID</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Aging Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customerReceivables.map(invoice => (
                                        <TableRow key={invoice.id}>
                                            <TableCell className="font-mono">{invoice.invoiceId}</TableCell>
                                            <TableCell>{format(new Date(invoice.dueDate), 'PPP')}</TableCell>
                                            <TableCell className="font-mono">{invoice.amount.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</TableCell>
                                            <TableCell><Badge variant={arStatusVariant[invoice.agingStatus]}>{invoice.agingStatus}</Badge></TableCell>
                                            <TableCell>
                                                <Button variant="link" className="p-0 h-auto" onClick={() => router.push(`/financials/invoices/${invoice.id}`)}>
                                                    View Invoice
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Attached Documents (POs, GRNs, etc.)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {otherFinancialDocs.map(doc => (
                                <Link
                                    key={doc.name} 
                                    href={doc.url || '#'}
                                    target={doc.url && doc.url.startsWith('http') ? '_blank' : '_self'}
                                    rel={doc.url && doc.url.startsWith('http') ? 'noopener noreferrer' : ''}
                                    passHref
                                    className={cn("flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors", !doc.url && "pointer-events-none opacity-50")}
                                >
                                    <div className="flex items-center gap-3">
                                        <Paperclip className="text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">{doc.name}</p>
                                            <p className="text-xs text-muted-foreground">Uploaded on {format(new Date(doc.uploadDate), 'PPP')}</p>
                                        </div>
                                    </div>
                                     <Badge variant="secondary">{doc.type}</Badge>
                                </Link>
                            ))}
                             {otherFinancialDocs.length === 0 && (
                                <p className="text-sm text-muted-foreground">No purchase orders or other financial documents found.</p>
                             )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="contacts" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Persons</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {customer.contacts.map(contact => (
                                <div key={contact.email} className="flex items-center gap-4">
                                    <Avatar>
                                        <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{contact.name}</p>
                                        <p className="text-sm text-muted-foreground">{contact.role}</p>
                                        <p className="text-xs text-muted-foreground">{contact.email} | {contact.phone}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="contracts" className="mt-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Service Agreements &amp; Contracts</CardTitle>
                            <CardDescription>
                                A central repository for all legal and service-level agreements with {customer.name}.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {customer.documents.filter(doc => doc.type === 'Contract' || doc.type === 'SLA' || doc.type === 'NDA').map(doc => {
                                const daysToExpire = doc.expiryDate ? differenceInDays(new Date(doc.expiryDate), new Date()) : null;
                                const isExpiringSoon = daysToExpire !== null && daysToExpire <= 30 && daysToExpire >= 0;

                                return (
                                    <div 
                                        key={doc.name} 
                                        className={cn(
                                            "p-4 rounded-lg border space-y-2", 
                                            isExpiringSoon ? "bg-destructive/10 border-destructive" : "bg-muted/50",
                                            docToHighlight === doc.name && "ring-2 ring-primary"
                                        )}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-semibold">{doc.name}</p>
                                                <Badge variant="outline" className="text-xs">{doc.type}</Badge>
                                            </div>
                                            <Badge variant={docStatusVariant[doc.status || 'Active']}>{doc.status || 'Active'}</Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            <p>Uploaded: {format(new Date(doc.uploadDate), 'PPP')}</p>
                                            <p>Expires: {doc.expiryDate ? format(new Date(doc.expiryDate), 'PPP') : 'N/A'} {daysToExpire !== null && <span className={cn(isExpiringSoon ? "text-destructive font-semibold" : "")}>({daysToExpire} days left)</span>}</p>
                                        </div>
                                        <div className="flex gap-2 pt-2 border-t border-dashed">
                                            <Button variant="link" className="p-0 h-auto" onClick={() => handleDownloadPdf(doc)} disabled={isGeneratingPdf}>
                                                {isGeneratingPdf && selectedDocument?.name === doc.name ? <Loader2 className="mr-2 animate-spin" /> : null}
                                                View Document
                                            </Button>
                                            {isExpiringSoon && (
                                                <Button variant="secondary" size="sm" onClick={() => handleSendReminder(doc.name)}>
                                                    <Send className="mr-2" />
                                                    Send Reminder
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="analytics" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Link href={`/customers/${customerId}?tab=orders`} className="block transition-transform hover:scale-[1.02]">
                            <OverviewCard data={{ title: 'Total Orders', value: String(analyticsData.totalOrders), change: `${analyticsData.fulfilledOrders} fulfilled`, changeType: 'increase' }} icon={Package} />
                        </Link>
                        <Link href={`/customers/${customerId}?tab=orders`} className="block transition-transform hover:scale-[1.02]">
                            <OverviewCard data={{ title: 'Total Volume', value: `${analyticsData.totalWeightTonnes.toFixed(2)} t`, change: 'shipped YTD', changeType: 'increase' }} icon={Weight} />
                        </Link>
                        <Link href={`/customers/${customerId}?tab=financials`} className="block transition-transform hover:scale-[1.02]">
                            <OverviewCard data={{ title: 'Avg. Order Value', value: analyticsData.avgOrderValue.toLocaleString('en-KE', { style: 'currency', currency: 'KES' }), change: 'across all orders', changeType: 'increase' }} icon={DollarSign} />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <Card className="lg:col-span-3">
                            <CardHeader>
                                <CardTitle>Produce Breakdown by Order</CardTitle>
                                <CardDescription>The most frequently ordered products by this customer.</CardDescription>
                            </CardHeader>
                             <CardContent>
                                <ChartContainer config={{}} className="h-64 w-full">
                                    <ResponsiveContainer>
                                        <BarChart data={analyticsData.produceBreakdown} layout="vertical">
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--foreground))' }} />
                                            <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                                 {analyticsData.produceBreakdown.map((entry) => (
                                                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            </CardContent>
                            <CardFooter>
                                <Button asChild variant="outline" className="w-full">
                                    <Link href={`/customers/${customerId}?tab=orders`}>View Detailed Breakdown</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                         <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Order Status</CardTitle>
                                <CardDescription>Current status of all orders.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={{}} className="h-64 w-full">
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Tooltip content={<ChartTooltipContent hideLabel />} />
                                            <Pie data={analyticsData.orderStatusBreakdown} dataKey="value" nameKey="name" innerRadius={50}>
                                                {analyticsData.orderStatusBreakdown.map((entry) => (
                                                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            </CardContent>
                             <CardFooter>
                                <Button asChild variant="outline" className="w-full">
                                    <Link href={`/customers/${customerId}?tab=orders`}>View Detailed Breakdown</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Customer Report
                            </CardTitle>
                            <CardDescription>
                                Write a manual report for this customer's status.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea placeholder="Manually write a report summary and key highlights here..." rows={5} />
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button variant="secondary" onClick={handleSaveReport}>
                                <Save className="mr-2" />
                                Save Manual Report
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
    
    <div className="hidden">
      <div ref={contractPrintRef} className="bg-white">
        {selectedDocument && <PrintableContract customer={customer} document={selectedDocument} />}
      </div>
      <div ref={customerReportPrintRef}>
        <PrintableCustomerReport customer={customer} receivables={customerReceivables} />
      </div>
    </div>
    </>
  );
}
