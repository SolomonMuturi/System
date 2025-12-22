'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
import { shipmentData, type Supplier, type Shipment } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DollarSign, FileText, Package, Mail, Phone, Building, Briefcase, PlusCircle, Eye, Truck, CreditCard, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface DatabaseSupplier {
  id: string;
  name: string;
  location: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  produce_types: string;
  status: string;
  logo_url: string;
  active_contracts: number;
  supplier_code: string;
  kra_pin: string;
  vehicle_number_plate: string;
  driver_name: string;
  driver_id_number: string;
  mpesa_paybill: string;
  mpesa_account_number: string;
  bank_name: string;
  bank_account_number: string;
  password: string;
  created_at: string;
}

export default function SupplierDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const supplierId = params.id as string;
  const activeTab = searchParams.get('tab') || 'overview';
  
  const [isLogActivityOpen, setIsLogActivityOpen] = useState(false);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch supplier from database
  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/suppliers/${supplierId}`);
        if (response.ok) {
          const data: DatabaseSupplier = await response.json();
          
          // Convert database format to your app's Supplier format
          const convertedSupplier: Supplier = {
            id: data.id,
            name: data.name,
            location: data.location,
            contactName: data.contact_name,
            contactEmail: data.contact_email,
            contactPhone: data.contact_phone,
            produceTypes: data.produce_types ? JSON.parse(data.produce_types) : [],
            status: data.status as 'Active' | 'Inactive' | 'Onboarding',
            logoUrl: data.logo_url,
            activeContracts: data.active_contracts,
            supplierCode: data.supplier_code,
            kraPin: data.kra_pin,
            vehicleNumberPlate: data.vehicle_number_plate,
            driverName: data.driver_name,
            driverIdNumber: data.driver_id_number,
            mpesaPaybill: data.mpesa_paybill,
            mpesaAccountNumber: data.mpesa_account_number,
            bankName: data.bank_name,
            bankAccountNumber: data.bank_account_number
          };
          
          setSupplier(convertedSupplier);
        } else {
          throw new Error('Failed to fetch supplier');
        }
      } catch (error) {
        console.error('Error fetching supplier:', error);
        toast({
          title: 'Error',
          description: 'Failed to load supplier details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (supplierId) {
      fetchSupplier();
    }
  }, [supplierId, toast]);

  const supplierShipments = useMemo(() => {
    if (!supplier) return [];
    // A more robust system would use a supplierID on the shipment.
    // For this mock data, we'll assume the origin contains the supplier's name.
    return shipmentData.filter(ship => ship.origin.toLowerCase().includes(supplier.name.toLowerCase().split(' ')[0]));
  }, [supplier]);

  if (isLoading) {
    return (
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <FreshTraceLogo className="w-8 h-8 text-primary" />
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
            <Button variant="outline" onClick={() => router.back()} className="mb-4">
              <ArrowLeft className="mr-2" />
              Back to Suppliers
            </Button>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-gray-200 animate-pulse rounded-full"></div>
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 animate-pulse rounded w-48"></div>
                <div className="h-4 bg-gray-200 animate-pulse rounded w-32"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
              <div className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
            </div>
            <div className="h-64 bg-gray-200 animate-pulse rounded-lg"></div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!supplier) {
    return (
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <FreshTraceLogo className="w-8 h-8 text-primary" />
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
            <Button variant="outline" onClick={() => router.back()} className="mb-4">
              <ArrowLeft className="mr-2" />
              Back to Suppliers
            </Button>
            <p>Supplier not found.</p>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const getInitials = (name: string = '') => name.split(' ').map(n => n[0]).join('');

  const statusVariant = {
    Active: 'default',
    Inactive: 'destructive',
    Onboarding: 'secondary',
  } as const;
  
  const shipmentStatusVariant = {
    'Delivered': 'default',
    'In-Transit': 'secondary',
    'Awaiting QC': 'outline',
    'Processing': 'outline',
    'Receiving': 'secondary',
    'Ready for Dispatch': 'default',
    'Preparing for Dispatch': 'default',
    'Delayed': 'destructive',
  } as const;

  const ytdPurchases = {
    title: 'YTD Purchases',
    value: 'KES 8.2M',
    change: 'vs. Previous Year',
    changeType: 'increase' as const,
  };

  const amountPayable = {
    title: 'Amount Payable',
    value: 'KES 1.1M',
    change: 'for 3 open invoices',
    changeType: 'increase' as const,
  };
  
  const handleLogActivitySubmit = () => {
    setIsLogActivityOpen(false);
    toast({
        title: 'Activity Logged',
        description: 'Your new activity has been added to the timeline.'
    });
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <FreshTraceLogo className="w-8 h-8 text-primary" />
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
                    Back to Suppliers
                </Button>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={supplier.logoUrl} />
                            <AvatarFallback className="text-2xl">{getInitials(supplier.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                {supplier.name}
                                <Badge variant={statusVariant[supplier.status]} className='capitalize text-sm'>{supplier.status}</Badge>
                            </h2>
                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                              <p className="text-muted-foreground">
                                  {supplier.location}
                              </p>
                              <div className="hidden md:block text-muted-foreground">•</div>
                              <p className="text-muted-foreground">
                                  Code: {supplier.supplierCode || 'N/A'}
                              </p>
                            </div>
                        </div>
                    </div>
                     <div className="flex gap-2">
                        <Button asChild variant="secondary">
                            <Link href={`/suppliers/portal?supplierId=${supplierId}`}>
                                <Eye className="mr-2" />
                                View Supplier Portal
                            </Link>
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
                                    <DialogTitle>Log New Activity for {supplier.name}</DialogTitle>
                                    <DialogDescription>Record a new interaction or note.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <Textarea placeholder="Type your activity note here..." />
                                </div>
                                <Button onClick={handleLogActivitySubmit}>Log Activity</Button>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <OverviewCard data={ytdPurchases} icon={DollarSign} />
                <OverviewCard data={amountPayable} icon={FileText} />
            </div>

             <Tabs value={activeTab} onValueChange={(value) => router.push(`/suppliers/${supplierId}?tab=${value}`)}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <span className="hidden sm:inline">Overview</span>
                    </TabsTrigger>
                    <TabsTrigger value="deliveries" className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      <span className="hidden sm:inline">Deliveries</span>
                    </TabsTrigger>
                    <TabsTrigger value="financials" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span className="hidden sm:inline">Financials</span>
                    </TabsTrigger>
                    <TabsTrigger value="contacts" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="hidden sm:inline">Contacts</span>
                    </TabsTrigger>
                </TabsList>
                
                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Supplier Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Supplier Information</h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Building className="h-4 w-4 text-muted-foreground" />
                                                <span>{supplier.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                                                <span>Code: {supplier.supplierCode || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Package className="h-4 w-4 text-muted-foreground" />
                                                <span>Produce: {supplier.produceTypes.join(', ') || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Contact Information</h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                                                <span>Contact: {supplier.contactName || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <span>{supplier.contactEmail || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <span>{supplier.contactPhone || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Additional Info */}
                            <div className="space-y-4 pt-4 border-t">
                                <h4 className="font-medium">Additional Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">KRA PIN</p>
                                        <p className="font-medium">{supplier.kraPin || 'Not provided'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Driver</p>
                                        <p className="font-medium">{supplier.driverName || 'Not provided'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Vehicle</p>
                                        <p className="font-medium">{supplier.vehicleNumberPlate || 'Not provided'}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                {/* Deliveries Tab */}
                <TabsContent value="deliveries" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Delivery History</CardTitle>
                            <CardDescription>Recent shipments from this supplier</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {supplierShipments.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Shipment ID</TableHead>
                                            <TableHead>Product</TableHead>
                                            <TableHead>Expected Arrival</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {supplierShipments.map(shipment => (
                                            <TableRow key={shipment.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/traceability?shipmentId=${shipment.shipmentId}`)}>
                                                <TableCell className="font-mono font-medium">{shipment.shipmentId}</TableCell>
                                                <TableCell>{shipment.product}</TableCell>
                                                <TableCell>{shipment.expectedArrival ? format(new Date(shipment.expectedArrival), 'PPP p') : 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Badge variant={shipmentStatusVariant[shipment.status]}>{shipment.status}</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center py-8">
                                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">No delivery history found for this supplier</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                
                {/* Financials Tab */}
                <TabsContent value="financials" className="mt-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Payment & Financial Details</CardTitle>
                            <CardDescription>Bank and payment information for this supplier</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="font-medium text-lg mb-4 flex items-center gap-2">
                                            <CreditCard className="h-5 w-5" />
                                            Bank Details
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Bank Name</p>
                                                <p className="font-medium">{supplier.bankName || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Account Number</p>
                                                <p className="font-medium">{supplier.bankAccountNumber || 'Not provided'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="font-medium text-lg mb-4 flex items-center gap-2">
                                            <DollarSign className="h-5 w-5" />
                                            M-Pesa Details
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Paybill Number</p>
                                                <p className="font-medium">{supplier.mpesaPaybill || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Account Number</p>
                                                <p className="font-medium">{supplier.mpesaAccountNumber || 'Not provided'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 border-t">
                                        <h4 className="font-medium text-lg mb-4">Tax Information</h4>
                                        <div>
                                            <p className="text-sm text-muted-foreground">KRA PIN</p>
                                            <p className="font-medium">{supplier.kraPin || 'Not provided'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                {/* Contacts Tab */}
                <TabsContent value="contacts" className="mt-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Contact Persons</CardTitle>
                            <CardDescription>Primary and secondary contacts for this supplier</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div className="p-4 border rounded-lg">
                                    <div className="flex items-start gap-4">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Users className="h-6 w-6 text-primary" />
                                        </div>
                                        <div className="space-y-2 flex-1">
                                            <div>
                                                <h4 className="font-medium">{supplier.contactName || 'Primary Contact'}</h4>
                                                <p className="text-sm text-muted-foreground">Primary Contact</p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Email</p>
                                                    <p className="font-medium">{supplier.contactEmail || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Phone</p>
                                                    <p className="font-medium">{supplier.contactPhone || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Additional contacts can be added here */}
                                <div className="text-center py-4">
                                    <Button variant="outline" onClick={() => setIsLogActivityOpen(true)}>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add Additional Contact
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}