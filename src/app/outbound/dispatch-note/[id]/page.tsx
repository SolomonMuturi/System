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
import { employeeData, type OutboundShipmentFormData } from '@/lib/data';
import { Separator } from '@/components/ui/separator';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';

export default function DispatchNotePage() {
  const router = useRouter();
  const params = useParams();
  const shipmentId = params.id as string;
  const printRef = useRef<HTMLDivElement>(null);

  const [isClient, setIsClient] = useState(false);
  const [shipment, setShipment] = useState<any>(null);
  const [formData, setFormData] = useState<OutboundShipmentFormData | null>(null);
  const [noteId, setNoteId] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');

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
          } else {
            // Create default form data
            setFormData({
              shipmentId,
              carrier: 'SpeedyLogistics',
              departureTemperature: 3.5,
              driverId: employeeData.find(e => e.role === 'Driver')?.id || '',
              finalChecks: {
                sealIntegrity: 'pass',
                documentation: 'pass',
                loading: 'pass',
              },
              palletCount: 10,
              boxCount: 500,
              dispatchWeight: 3000,
            });
          }

          // Generate note ID
          const newNoteId = `DN-${new Date().getFullYear()}-${String(shipmentId).slice(-4)}`;
          setNoteId(newNoteId);
          setVerificationUrl(`${window.location.origin}/verify/dn/${newNoteId}`);
        } catch (error) {
          console.error('Error loading dispatch note data:', error);
        }
      };

      fetchData();
    }
  }, [isClient, shipmentId]);

  const handlePrint = async () => {
    const element = printRef.current;
    if (element) {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
      });
      const data = canvas.toDataURL('image/jpeg');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(data, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${noteId}.pdf`);
    }
  };

  const driver = formData ? employeeData.find(e => e.id === formData.driverId) : null;
  
  if (!isClient || !shipment || !formData) {
    return (
      <SidebarProvider>
        <Sidebar><SidebarHeader><FreshTraceLogo /></SidebarHeader><SidebarContent><SidebarNav /></SidebarContent></Sidebar>
        <SidebarInset>
          <div className="non-printable"><Header /></div>
          <main className="p-4 md:p-6 lg:p-8">
            <p>Loading dispatch note...</p>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

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
                Dispatch Note {noteId}
              </h2>
              <p className="text-muted-foreground">
                For shipment {shipment.shipment_id}.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Send className="mr-2" />
                Send Note
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
                      <h2 className="text-2xl font-bold">Dispatch Note</h2>
                      <p className="text-muted-foreground font-mono">{noteId}</p>
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
                    <p><span className="font-medium text-muted-foreground">ID:</span> {shipment.shipment_id}</p>
                    <p><span className="font-medium text-muted-foreground">From:</span> {shipment.origin || 'N/A'}</p>
                    <p><span className="font-medium text-muted-foreground">To:</span> {shipment.destination || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Customer</h4>
                    <p>{shipment.customers?.name || 'Unknown Customer'}</p>
                    <p>{shipment.product || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Dispatch Details</h4>
                    <p><span className="font-medium text-muted-foreground">Date:</span> {format(new Date(), 'MMM d, yyyy, h:mm a')}</p>
                    <p><span className="font-medium text-muted-foreground">Carrier:</span> {formData.carrier}</p>
                    <p><span className="font-medium text-muted-foreground">Temp:</span> {formData.departureTemperature}°C</p>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold mb-2">Cargo Details</h4>
                    <div className="border rounded-lg p-4 space-y-2 text-sm">
                      <div className="flex justify-between"><span>Pallet Count:</span> <span>{formData.palletCount}</span></div>
                      <div className="flex justify-between"><span>Total Box Count:</span> <span>{formData.boxCount}</span></div>
                      <Separator />
                      <div className="flex justify-between font-bold"><span>Total Weight:</span> <span>{formData.dispatchWeight} kg</span></div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Pre-Departure Checks</h4>
                    <div className="border rounded-lg p-4 space-y-2 text-sm">
                      {Object.entries(formData.finalChecks).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                          <span className={`font-medium ${value === 'pass' ? 'text-green-600' : 'text-red-600'}`}>
                            {value.charAt(0).toUpperCase() + value.slice(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="mt-16 space-y-12">
                  <h4 className="font-semibold text-center">Signatures</h4>
                  <div className="grid grid-cols-2 gap-16">
                    <div className="text-center">
                      <div className="border-b-2 border-dashed pb-8"></div>
                      <p className="text-sm mt-2">Dispatch Officer</p>
                      <p className="font-semibold">[Officer Name]</p>
                    </div>
                    <div className="text-center">
                      <div className="border-b-2 border-dashed pb-8"></div>
                      <p className="text-sm mt-2">Driver</p>
                      {driver && (
                        <>
                          <p className="font-semibold">{driver.name}</p>
                          <p className="text-xs text-muted-foreground">ID: {driver.idNumber} | Phone: {driver.phone}</p>
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