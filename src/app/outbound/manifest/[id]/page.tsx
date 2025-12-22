'use client';

import { useState, useEffect, useRef } from 'react';
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
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Send } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { employeeData, coldRoomInventoryData, type OutboundShipmentFormData, type ColdRoomInventory } from '@/lib/data';
import { Separator } from '@/components/ui/separator';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function OutboundManifestPage() {
  const router = useRouter();
  const params = useParams();
  const shipmentId = params.id as string;
  const printRef = useRef<HTMLDivElement>(null);

  const [isClient, setIsClient] = useState(false);
  const [shipment, setShipment] = useState<any>(null);
  const [formData, setFormData] = useState<OutboundShipmentFormData | null>(null);
  const [manifestId, setManifestId] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');
  const [manifestPallets, setManifestPallets] = useState<ColdRoomInventory[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && shipmentId) {
      const fetchData = async () => {
        try {
          // Fetch shipment from API
          const shipmentResponse = await fetch(`/api/shipments/${shipmentId}`);
          if (shipmentResponse.ok) {
            const shipmentData = await shipmentResponse.json();
            setShipment(shipmentData);
          }

          // Get form data from session storage
          const storedFormData = sessionStorage.getItem(`dispatch-${shipmentId}`);
          if (storedFormData) {
            const parsedData = JSON.parse(storedFormData);
            setFormData(parsedData);
          }

          // Generate manifest ID
          const newManifestId = `OM-${new Date().getFullYear()}-${String(shipmentId).slice(-4)}`;
          setManifestId(newManifestId);
          setVerificationUrl(`${window.location.origin}/verify/om/${newManifestId}`);

          // Get pallets from cold room inventory
          if (shipmentData?.product) {
            const pallets = coldRoomInventoryData
              .filter(p => p.product.toLowerCase().includes(shipmentData.product.toLowerCase()))
              .slice(0, 3);
            setManifestPallets(pallets);
          }
        } catch (error) {
          console.error('Error loading manifest data:', error);
        }
      };

      fetchData();
    }
  }, [isClient, shipmentId]);

  const handlePrint = async () => {
    const element = printRef.current;
    if (element) {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const data = canvas.toDataURL('image/jpeg');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(data, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${manifestId}.pdf`);
    }
  };

  const driver = formData ? employeeData.find(e => e.id === formData.driverId) : null;
  
  const generatePalletQrData = (pallet: ColdRoomInventory) => {
    const data = {
      palletId: pallet.location,
      product: pallet.product,
      entryDate: pallet.entryDate,
      shipmentId: shipment?.shipment_id,
    };
    return JSON.stringify(data);
  };

  if (!isClient || !shipment || !formData) {
    return (
      <SidebarProvider>
        <Sidebar><SidebarHeader><FreshTraceLogo /></SidebarHeader><SidebarContent><SidebarNav /></SidebarContent></Sidebar>
        <SidebarInset>
          <Header />
          <main className="p-4 md:p-6 lg:p-8">
            <p>Loading manifest...</p>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const productSummary = manifestPallets.reduce((acc, pallet) => {
    const existing = acc.find(p => p.product === pallet.product);
    if (existing) {
      existing.quantity += pallet.quantity;
      existing.weight += pallet.currentWeight;
    } else {
      acc.push({ 
        product: pallet.product, 
        quantity: pallet.quantity, 
        weight: pallet.currentWeight 
      });
    }
    return acc;
  }, [] as { product: string; quantity: number, weight: number }[]);

  return (
    <SidebarProvider>
      <div className="non-printable">
        <Sidebar><SidebarHeader><FreshTraceLogo /></SidebarHeader><SidebarContent><SidebarNav /></SidebarContent></Sidebar>
      </div>
      <SidebarInset>
        <div className="non-printable"><Header /></div>
        <main className="p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6 non-printable">
            <div>
              <Button
                variant="outline"
                onClick={() => router.push('/outbound')}
                className="mb-4"
              >
                <ArrowLeft className="mr-2" />
                Back to Outbound Dashboard
              </Button>
              <h2 className="text-2xl font-bold tracking-tight">
                Outbound Manifest {manifestId}
              </h2>
              <p className="text-muted-foreground">
                For shipment {shipment.shipment_id}.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Send className="mr-2" />
                Send Manifest
              </Button>
              <Button onClick={handlePrint}>
                <Printer className="mr-2" />
                Print/Download PDF
              </Button>
            </div>
          </div>
          <div className="printable-invoice-area" ref={printRef}>
            <Card className="max-w-4xl mx-auto invoice-card">
              <CardHeader className="p-8">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <FreshTraceLogo className="h-12 w-12 text-primary" />
                    <div>
                      <h3 className="text-xl font-bold">Harir Int.</h3>
                      <p className="text-sm text-muted-foreground">info@harirint.com | www.harirint.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="text-right">
                      <h2 className="text-2xl font-bold">Outbound Manifest</h2>
                      <p className="text-muted-foreground font-mono">{manifestId}</p>
                    </div>
                    {isClient && verificationUrl && (
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(verificationUrl)}`} 
                        alt="QR Code"
                        className="w-20 h-20"
                      />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <Separator className="my-6" />
                <div className="grid grid-cols-3 gap-4 mb-8 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2">Shipment Details</h4>
                    <p><span className="font-medium text-muted-foreground">Shipment ID:</span> {shipment.shipment_id}</p>
                    <p><span className="font-medium text-muted-foreground">Customer:</span> {shipment.customers?.name || 'Unknown'}</p>
                    <p><span className="font-medium text-muted-foreground">Destination:</span> {shipment.destination || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Carrier Details</h4>
                    <p><span className="font-medium text-muted-foreground">Carrier:</span> {formData.carrier}</p>
                    <p><span className="font-medium text-muted-foreground">Driver:</span> {driver?.name || 'Not assigned'}</p>
                    <p><span className="font-medium text-muted-foreground">Temp:</span> {formData.departureTemperature}°C</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Dispatch Details</h4>
                    <p><span className="font-medium text-muted-foreground">Dispatch Date:</span> {format(new Date(), 'MMM d, yyyy')}</p>
                    <p><span className="font-medium text-muted-foreground">Total Weight:</span> {formData.dispatchWeight} kg</p>
                    <p><span className="font-medium text-muted-foreground">Total Pallets:</span> {formData.palletCount}</p>
                  </div>
                </div>
                
                <h4 className="font-semibold mb-2">FIFO Pallet List for Verification</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>QR Code</TableHead>
                      <TableHead>Pallet ID (Location)</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Entry Date</TableHead>
                      <TableHead className="text-right">Weight (kg)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {manifestPallets.map(pallet => (
                      <TableRow key={pallet.id}>
                        <TableCell>
                          <div className="bg-white p-1 w-12 h-12 rounded-sm">
                            {isClient && (
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=50x50&data=${encodeURIComponent(generatePalletQrData(pallet))}`}
                                alt={`QR for ${pallet.location}`}
                                className="w-full h-full object-contain"
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{pallet.location}</TableCell>
                        <TableCell>{pallet.product}</TableCell>
                        <TableCell>{format(new Date(pallet.entryDate), 'PPp')}</TableCell>
                        <TableCell className="text-right font-mono">{pallet.currentWeight.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <h4 className="font-semibold mb-2 mt-6">Product Summary</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Total Boxes/Crates</TableHead>
                      <TableHead className="text-right">Total Weight (kg)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productSummary.map(item => (
                      <TableRow key={item.product}>
                        <TableCell>{item.product}</TableCell>
                        <TableCell className="text-right font-mono">{item.quantity.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono">{item.weight.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-16 space-y-12">
                  <h4 className="font-semibold text-center">Handover Signatures</h4>
                  <div className="grid grid-cols-2 gap-16">
                    <div className="text-center">
                      <div className="border-b-2 border-dashed pb-8"></div>
                      <p className="text-sm mt-2">Dispatch Officer (Harir International)</p>
                      <p className="font-semibold">[Officer Name]</p>
                    </div>
                    <div className="text-center">
                      <div className="border-b-2 border-dashed pb-8"></div>
                      <p className="text-sm mt-2">Driver ({formData.carrier})</p>
                      {driver && (
                        <>
                          <p className="font-semibold">{driver.name}</p>
                        </>
                      )}
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