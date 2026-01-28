'use client';

import { Suspense, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FreshTraceLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, FileText, Banknote, Building, Mail, Phone, Package, Link as LinkIcon, Send, PlusCircle } from 'lucide-react';
import { supplierData, shipmentData as initialShipmentData, supplierAccountsPayableData, type SupplierAccountsPayableEntry, type Shipment } from '@/lib/data';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

// Create a separate component that uses useSearchParams
function SupplierPortalContent() {
  const { toast } = useToast();
  const router = useRouter();
  
  // Use URLSearchParams from window.location instead of useSearchParams
  const [searchParams] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  });
  
  const supplierId = searchParams.get('supplierId');
  const supplier = useMemo(() => supplierData.find(s => s.id === supplierId), [supplierId]);

  const [shipments, setShipments] = useState<Shipment[]>(initialShipmentData);

  const supplierShipments = useMemo(() => {
    if (!supplier) return [];
    // A more robust system would use a supplierID on the shipment.
    // Let's filter by shipments going to the warehouse from the supplier's location.
    return shipments.filter(ship => ship.origin.toLowerCase().includes(supplier.location.toLowerCase()));
  }, [supplier, shipments]);
  
  const supplierPayments = useMemo(() => {
      if (!supplier) return [];
      return supplierAccountsPayableData.filter(p => p.supplierId === supplier.id);
  }, [supplier]);

  const amountPayable = useMemo(() => {
    return supplierPayments.filter(p => p.status !== 'Paid').reduce((acc, p) => acc + p.amount, 0);
  }, [supplierPayments]);

  const openInvoices = useMemo(() => {
    return supplierPayments.filter(p => p.status !== 'Paid').length;
  }, [supplierPayments]);
  
  const recentDocuments = useMemo(() => {
    if (!supplier) return [];
    return supplier.documents.filter(doc => doc.type === 'GRN');
  }, [supplier]);
  
  const handleRegisterShipment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!supplier) return;

    const newShipment: Shipment = {
        id: `ship-${Date.now()}`,
        shipmentId: `SH-${Math.floor(10000 + Math.random() * 90000)}`,
        customer: 'Harir International Warehouse',
        origin: supplier.location, // Use supplier's location as origin
        destination: 'Nairobi HQ',
        status: 'Receiving',
        product: formData.get('product') as string,
        weight: `${formData.get('weight')} kg`,
        tags: 'Pre-registered',
        expectedArrival: new Date(formData.get('expectedArrival') as string).toISOString(),
    };
    
    setShipments(prev => [newShipment, ...prev]);

    toast({
        title: 'Shipment Pre-registered',
        description: `Shipment ${newShipment.shipmentId} for ${newShipment.product} has been successfully logged.`,
    });
    
    (e.target as HTMLFormElement).reset();
  };

  if (!supplier) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/40">
        <div className="text-center">
            <h2 className="text-2xl font-bold">Access Denied</h2>
            <p className="text-muted-foreground">Supplier not found or you do not have permission to view this page.</p>
            <Button onClick={() => router.push('/suppliers/login')} className="mt-4">Go to Login</Button>
        </div>
      </div>
    );
  }
  
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
  
  const paymentStatusVariant = {
    'Paid': 'default',
    'Due': 'secondary',
    'Overdue': 'destructive',
  } as const;

  return (
    <div className="min-h-screen bg-muted/40">
        <header className="bg-background border-b p-4">
            <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <FreshTraceLogo className="w-8 h-8 text-primary" />
                    <h1 className="text-xl font-headline font-bold text-foreground">
                        {supplier.name} - Supplier Portal
                    </h1>
                </div>
                 <Button variant="outline" onClick={() => router.push('/')}>Logout</Button>
            </div>
        </header>
         <main className="container mx-auto p-4 md:p-8 space-y-6">
            <h2 className="text-2xl font-bold">Welcome, {supplier.contactName}</h2>
            
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign />Amount Payable</CardTitle></CardHeader>
                    <CardContent><p className="text-3xl font-bold">KES {amountPayable.toLocaleString()}</p></CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><FileText />Open Invoices</CardTitle></CardHeader>
                    <CardContent><p className="text-3xl font-bold">{openInvoices}</p></CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Pre-register an Incoming Shipment</CardTitle>
                    <CardDescription>Log a new delivery you are sending to Harir International.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRegisterShipment} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="product">Product</Label>
                                <Input id="product" name="product" placeholder="e.g. Hass Avocados" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="weight">Declared Weight (kg)</Label>
                                <Input id="weight" name="weight" type="number" placeholder="e.g. 1200" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="expectedArrival">Expected Arrival</Label>
                                <Input id="expectedArrival" name="expectedArrival" type="datetime-local" required />
                            </div>
                        </div>
                         <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="vehiclePlate">Vehicle Plate</Label>
                                <Input id="vehiclePlate" name="vehiclePlate" placeholder="e.g. KDA 123B" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="driverName">Driver Name</Label>
                                <Input id="driverName" name="driverName" placeholder="e.g. John Doe" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="farmName">Farm Name</Label>
                                <Input id="farmName" name="farmName" placeholder="e.g. Green Valley" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="harvestLocation">Block / Harvest Area</Label>
                                <Input id="harvestLocation" name="harvestLocation" placeholder="e.g. Block 7G" />
                            </div>
                         </div>
                        <div className="flex justify-end">
                            <Button type="submit">
                                <PlusCircle className="mr-2" />
                                Log Shipment
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Payment Status</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice ID</TableHead>
                                <TableHead>GRN ID</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {supplierPayments.map(payment => (
                                <TableRow key={payment.id}>
                                    <TableCell className="font-mono">{payment.invoiceId}</TableCell>
                                    <TableCell className="font-mono">{payment.grnId}</TableCell>
                                    <TableCell className="font-mono">KES {payment.amount.toLocaleString()}</TableCell>
                                    <TableCell>{format(new Date(payment.dueDate), 'PPP')}</TableCell>
                                    <TableCell>
                                        <Badge variant={paymentStatusVariant[payment.status]}>{payment.status}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Package />My Recent Deliveries</CardTitle>
                </CardHeader>
                <CardContent>
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
                                <TableRow key={shipment.id}>
                                    <TableCell className="font-mono">{shipment.shipmentId}</TableCell>
                                    <TableCell>{shipment.product}</TableCell>
                                    <TableCell>{shipment.expectedArrival ? format(new Date(shipment.expectedArrival), 'PPP p') : 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge variant={shipmentStatusVariant[shipment.status]}>{shipment.status}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>My Details</CardTitle></CardHeader>
                    <CardContent className="space-y-4 text-sm">
                         <div className="space-y-2">
                            <h4 className="font-medium flex items-center gap-2"><Building />Company Information</h4>
                            <p><span className="text-muted-foreground">Company:</span> {supplier.name}</p>
                            <p><span className="text-muted-foreground">Location:</span> {supplier.location}</p>
                            <p><span className="text-muted-foreground">KRA PIN:</span> {supplier.kraPin || 'N/A'}</p>
                        </div>
                         <div className="space-y-2">
                            <h4 className="font-medium flex items-center gap-2"><Mail />Contact Information</h4>
                            <p><span className="text-muted-foreground">Name:</span> {supplier.contactName}</p>
                            <p><span className="text-muted-foreground">Email:</span> {supplier.contactEmail}</p>
                            <p><span className="text-muted-foreground">Phone:</span> {supplier.contactPhone}</p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium flex items-center gap-2"><Banknote />Payment Details</h4>
                            <p><span className="text-muted-foreground">Bank:</span> {supplier.bankName || 'N/A'}</p>
                            <p><span className="text-muted-foreground">Account No:</span> {supplier.bankAccountNumber || 'N/A'}</p>
                            <p><span className="text-muted-foreground">M-Pesa Paybill:</span> {supplier.mpesaPaybill || 'N/A'}</p>
                            <p><span className="text-muted-foreground">M-Pesa Acct:</span> {supplier.mpesaAccountNumber || 'N/A'}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Recent Documents</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                         {recentDocuments.map(doc => (
                            <Link key={doc.name} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50">
                                <div className="flex items-center gap-2">
                                    <FileText className="text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">{doc.name}</p>
                                        <p className="text-xs text-muted-foreground">Uploaded: {format(new Date(doc.uploadDate), 'PPP')}</p>
                                    </div>
                                </div>
                                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                            </Link>
                         ))}
                         {recentDocuments.length === 0 && (
                            <p className="text-sm text-muted-foreground">No recent documents found.</p>
                         )}
                    </CardContent>
                </Card>
            </div>
        </main>
    </div>
  );
}

// Main component with Suspense boundary
export default function SupplierPortalPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-muted/40">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Loading Supplier Portal...</h2>
          <p className="text-muted-foreground">Please wait while we load your supplier information.</p>
        </div>
      </div>
    }>
      <SupplierPortalContent />
    </Suspense>
  );
}