
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
import { ArrowLeft, Printer, Send, Save, Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

const initialLineItems = [
  { description: 'Roses - Pallet', quantity: 10, unitPrice: 44500.00 },
  { description: 'Hass Avocados - Bin', quantity: 5, unitPrice: 21500.00 },
];

export default function NewQuotePage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(true);
  const [lineItems, setLineItems] = useState(initialLineItems);
  const [quoteId, setQuoteId] = useState('');
  const [isQuoteSaved, setIsQuoteSaved] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState('');

  useEffect(() => {
    // Generate quoteId on the client to avoid hydration mismatch
    const newQuoteId = `Q-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    setQuoteId(newQuoteId);
    
    // Generate verificationUrl only on the client side
    if (typeof window !== 'undefined') {
        setVerificationUrl(`${window.location.origin}/verify/quote/${newQuoteId}`);
    }
  }, []);

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
    const originalTitle = document.title;
    document.title = `Quotation ${quoteId}`;
    window.print();
    document.title = originalTitle;
  };
  
  const handleSaveQuote = () => {
    setIsEditing(false);
    setIsQuoteSaved(true);
    toast({
        title: 'Quote Saved',
        description: `Quotation ${quoteId} has been saved as a draft.`
    });
  };
  
  const handleCreateShipment = () => {
      toast({
          title: 'Shipment Created',
          description: `A new shipment has been created for quote ${quoteId} and is now ready for dispatch.`
      });
      router.push('/shipments');
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
                Back to Financials
              </Button>
              <h2 className="text-2xl font-bold tracking-tight">
                New Quotation
              </h2>
              <p className="text-muted-foreground">
                Create a new quote for a customer.
              </p>
            </div>
            <div className="flex gap-2">
               <Button onClick={handleSaveQuote} disabled={!isEditing}>
                <Save className="mr-2" />
                Save Quote
              </Button>
               <Button variant="secondary" onClick={handleCreateShipment} disabled={!isQuoteSaved}>
                <Truck className="mr-2" />
                Create Shipment
              </Button>
              <Button variant="outline" disabled={isEditing}>
                <Send className="mr-2" />
                Send Quote
              </Button>
              <Button onClick={handlePrint}>
                <Printer className="mr-2" />
                Print Quote
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
                        <h2 className="text-2xl font-bold">QUOTATION</h2>
                        <p className="text-muted-foreground font-mono">
                          {quoteId}
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
                    <h4 className="font-semibold mb-2">Quote For:</h4>
                    <Input placeholder="Customer Name" className="mb-1" />
                    <Input placeholder="Customer Address" />
                  </div>
                  <div className="text-right">
                    <h4 className="font-semibold mb-2">Quote Details:</h4>
                     <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Date:{' '}
                      </span>
                      {new Date().toLocaleDateString()}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Valid Until:{' '}
                      </span>
                      {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
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

                <div className="flex justify-end">
                  <div className="w-full max-w-xs space-y-2">
                      <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>{subtotal.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</span>
                      </div>
                       <div className="flex justify-between">
                          <span className="text-muted-foreground">VAT (16%)</span>
                          <span>{tax.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</span>
                      </div>
                       <div className="flex justify-between font-bold text-lg">
                          <span>Quote Total</span>
                          <span>{total.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</span>
                      </div>
                  </div>
                </div>

              </CardContent>
              <CardFooter className="bg-muted/50 p-8">
                  <div className="w-full">
                      <h4 className="font-semibold">Terms & Conditions</h4>
                      <p className="text-xs text-muted-foreground">This quote is valid for 30 days. Prices are subject to change thereafter.</p>
                  </div>
              </CardFooter>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
