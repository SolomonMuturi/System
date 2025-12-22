

'use client';

import { useState, useEffect } from 'react';
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Printer, Send, Pencil, Save } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { accountsReceivableData } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

const initialLineItems = [
  { description: 'Roses - Pallet', quantity: 10, unitPrice: 45000.00 },
  { description: 'Hass Avocados - Bin', quantity: 5, unitPrice: 22000.00 },
];

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const invoice = accountsReceivableData.find((inv) => inv.id === invoiceId);
  
  const [isEditing, setIsEditing] = useState(false);
  const [lineItems, setLineItems] = useState(initialLineItems);
  const [verificationUrl, setVerificationUrl] = useState('');

  useEffect(() => {
    // Generate verificationUrl only on the client side to prevent hydration errors
    if (invoice && typeof window !== 'undefined') {
      setVerificationUrl(`${window.location.origin}/verify/invoice/${invoice.invoiceId}`);
    }
  }, [invoice]);


  const statusVariant = {
    'On Time': 'default',
    'At Risk': 'secondary',
    Late: 'destructive',
  } as const;

  const handleLineItemChange = (index: number, field: string, value: string | number) => {
    const updatedItems = [...lineItems];
    const item = updatedItems[index];
    if(field === 'quantity' || field === 'unitPrice') {
        (item as any)[field] = Number(value);
    } else {
        (item as any)[field] = value;
    }
    setLineItems(updatedItems);
  };

  const subtotal = lineItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  const handlePrint = () => {
    if (invoice) {
      const originalTitle = document.title;
      document.title = `Invoice ${invoice.invoiceId}`;
      window.print();
      document.title = originalTitle;
    }
  };

  if (!invoice) {
    return (
      <SidebarProvider>
        <div className="non-printable">
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
        </div>
        <SidebarInset>
          <div className="non-printable">
            <Header />
          </div>
          <main className="p-4 md:p-6 lg:p-8">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2" />
              Back to Invoices
            </Button>
            <div className="flex items-center justify-center h-64">
              <p>Invoice not found.</p>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="non-printable">
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
      </div>
      <SidebarInset>
        <div className="non-printable">
         <Header />
        </div>
        <main className="p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6 non-printable">
            <div>
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="mb-4"
              >
                <ArrowLeft className="mr-2" />
                Back to Invoices
              </Button>
              <h2 className="text-2xl font-bold tracking-tight">
                Invoice {invoice.invoiceId}
              </h2>
              <p className="text-muted-foreground">
                Details for invoice sent to {invoice.customer}.
              </p>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <Button onClick={() => setIsEditing(false)}>
                  <Save className="mr-2" />
                  Save Changes
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Pencil className="mr-2" />
                  Edit Invoice
                </Button>
              )}
              <Button variant="outline">
                <Send className="mr-2" />
                Send Invoice
              </Button>
              <Button onClick={handlePrint}>
                <Printer className="mr-2" />
                Print Invoice
              </Button>
            </div>
          </div>

          <div className="printable-invoice-area">
            <Card className="max-w-4xl mx-auto invoice-card">
              <CardHeader className="p-8">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <FreshTraceLogo className="h-12 w-12 text-primary" />
                    <div>
                      <h3 className="text-xl font-bold">Harir Int.</h3>
                      <p className="text-sm text-muted-foreground">
                        info@harirint.com | www.harirint.com
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                     <div className="text-right">
                        <h2 className="text-2xl font-bold">INVOICE</h2>
                        <p className="text-muted-foreground font-mono">
                          {invoice.invoiceId}
                        </p>
                      </div>
                       <div className="flex flex-col items-center gap-2">
                           <a href={verificationUrl} target="_blank" rel="noopener noreferrer" className="block p-1 bg-white rounded-md w-20 h-20 shadow-md hover:shadow-lg transition-shadow">
                              {verificationUrl && <img 
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`} 
                                  alt="QR Code for verification"
                                  className="w-full h-full object-contain"
                              />}
                           </a>
                          <p className="text-xs text-muted-foreground font-mono text-center">Scan to verify</p>
                      </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <Separator className="my-6" />
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div>
                    <h4 className="font-semibold mb-2">Billed To:</h4>
                    <p className="text-muted-foreground">{invoice.customer}</p>
                    <p className="text-muted-foreground">
                      123 Produce Lane, Nairobi, Kenya
                    </p>
                  </div>
                  <div className="text-right">
                    <h4 className="font-semibold mb-2">Invoice Details:</h4>
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Due Date:{' '}
                      </span>
                      {invoice.dueDate}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Status:{' '}
                      </span>
                      <Badge
                        variant={statusVariant[invoice.agingStatus]}
                        className="capitalize"
                      >
                        {invoice.agingStatus}
                      </Badge>
                    </p>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead className="text-right">Unit Price (KES)</TableHead>
                      <TableHead className="text-right">Total (KES)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {lineItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={item.description}
                              onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                            />
                          ) : (
                            item.description
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                              className="w-20 text-center"
                            />
                          ) : (
                            item.quantity
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={item.unitPrice.toFixed(2)}
                              onChange={(e) => handleLineItemChange(index, 'unitPrice', e.target.value)}
                              className="w-32 text-right"
                            />
                          ) : (
                             item.unitPrice.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                           {(item.quantity * item.unitPrice).toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <Separator className="my-6" />

                <div className="grid grid-cols-2 items-start">
                    <div>
                        <h4 className="font-semibold">Thank you for your business!</h4>
                        <p className="text-xs text-muted-foreground">Please pay by the due date to avoid late fees.</p>
                    </div>
                    <div className="w-full max-w-xs space-y-2 ml-auto">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>{subtotal.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">VAT (16%)</span>
                            <span>{tax.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total Amount Due</span>
                            <span>{total.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</span>
                        </div>
                    </div>
                </div>

              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
