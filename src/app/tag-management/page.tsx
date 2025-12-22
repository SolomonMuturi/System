
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { tagBatchData, shipmentData, type TagBatch, type Shipment, type TagFormValues } from '@/lib/data';
import { GenerateTagsForm } from '@/components/dashboard/generate-tags-form';
import { TagBatchTable } from '@/components/dashboard/tag-batch-table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { QrCode, Printer, Copy } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { customerData } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

export default function TagManagementPage() {
  const [tagBatches, setTagBatches] = useState<TagBatch[]>(tagBatchData);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const searchParams = useSearchParams();
  const [editingBatch, setEditingBatch] = useState<TagBatch | null>(null);
  const [previewingBatch, setPreviewingBatch] = useState<TagBatch | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const shipmentIdFromUrl = searchParams.get('shipmentId');
    if (shipmentIdFromUrl) {
      const shipment = shipmentData.find(s => s.id === shipmentIdFromUrl) || null;
      setSelectedShipment(shipment);
    }
  }, [searchParams]);

  const handleGenerateOrUpdateTags = (values: TagFormValues, shipment?: Shipment | null) => {
    if (editingBatch) {
      // Update existing batch
      const updatedBatch: TagBatch = {
        ...editingBatch,
        ...values,
        shipmentId: shipment?.shipmentId,
        client: shipment?.customer,
      };
      setTagBatches(prev => prev.map(b => b.id === editingBatch.id ? updatedBatch : b));
      setEditingBatch(null);
      toast({ title: 'Batch Updated', description: `Batch ${updatedBatch.batchId} has been updated.` });
    } else {
      // Generate new batch for preview
      const newBatch: TagBatch = {
        ...values,
        id: `tag-${Date.now()}`,
        batchId: `B-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        generatedAt: new Date().toISOString(),
        status: 'active',
        shipmentId: shipment?.shipmentId,
        client: shipment?.customer,
      };
      setPreviewingBatch(newBatch);
    }
  };

  const handleSaveBatch = () => {
    if (previewingBatch) {
      setTagBatches(prev => [previewingBatch, ...prev]);
      setPreviewingBatch(null);
      toast({ title: 'Batch Saved', description: `Batch ${previewingBatch.batchId} has been saved.` });
    }
  };

  const handleEdit = (batch: TagBatch) => {
    setEditingBatch(batch);
    const shipment = batch.shipmentId ? shipmentData.find(s => s.shipmentId === batch.shipmentId) : null;
    setSelectedShipment(shipment);
  };
  
  const handleCancelEdit = () => {
    setEditingBatch(null);
    setSelectedShipment(null);
  }

  const generateQrData = (batch: TagBatch, index: number) => {
    const data = {
      tagId: `${batch.batchId}-${String(index + 1).padStart(4, '0')}`,
      batchId: batch.batchId,
      shipmentId: batch.shipmentId,
      client: batch.client,
      assetName: batch.product,
    };
    return JSON.stringify(data);
  };

  const handlePrint = () => {
    const printableArea = document.querySelector('.printable-qr-area');
    if (printableArea) {
      document.body.classList.add('printing-active');
      window.print();
      document.body.classList.remove('printing-active');
    }
  };

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
        <main className="p-4 md:p-6 lg:p-8 grid gap-6 md:gap-8 grid-cols-12">
          <div className="col-span-12">
            <h2 className="text-2xl font-bold tracking-tight">
              Tag &amp; Asset Management
            </h2>
            <p className="text-muted-foreground">
              Generate and manage QR code tags for products, equipment, and other assets.
            </p>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  {editingBatch ? `Editing Batch ${editingBatch.batchId}` : 'Generate New Batch'}
                </CardTitle>
                <CardDescription>
                  {editingBatch ? 'Modify the details and save your changes.' : 'Select a shipment to pre-fill details or enter them manually for any asset.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GenerateTagsForm 
                    key={editingBatch?.id || 'new'}
                    onSubmit={handleGenerateOrUpdateTags} 
                    shipment={selectedShipment} 
                    editingBatch={editingBatch}
                    onCancelEdit={handleCancelEdit}
                />
              </CardContent>
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-8">
            <TagBatchTable tagBatches={tagBatches} onEdit={handleEdit} />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>

    <Dialog open={!!previewingBatch} onOpenChange={(open) => !open && setPreviewingBatch(null)}>
        {previewingBatch && (
            <DialogContent className="sm:max-w-2xl non-printable">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <QrCode className="w-5 h-5" />
                        Preview QR Codes for Batch {previewingBatch.batchId}
                    </DialogTitle>
                    <DialogDescription>
                        Confirm the details below. Save the batch to add it to the main list.
                    </DialogDescription>
                </DialogHeader>
                <div className="relative flex flex-col items-center justify-center gap-4 rounded-lg border bg-muted/50 p-8">
                    <div className="absolute top-2 right-2 flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {}}>
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">Copy</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrint}>
                            <Printer className="h-4 w-4" />
                            <span className="sr-only">Print</span>
                        </Button>
                    </div>
                     <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                        {Array.from({ length: Math.min(previewingBatch.quantity, 1) }).map((_, i) => (
                            <div key={i} className="bg-white p-2 rounded-md col-start-3 sm:col-start-5 col-span-1">
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(generateQrData(previewingBatch, i))}`}
                                    alt={`QR Code ${i+1}`}
                                    className="w-full h-full object-contain"
                                />
                             </div>
                        ))}
                    </div>
                    <div className="text-center">
                        <p className="font-semibold">{previewingBatch.product}</p>
                        <p className="text-sm text-muted-foreground">{previewingBatch.client}</p>
                        <p className="text-xs font-mono text-muted-foreground">{previewingBatch.batchId}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(previewingBatch.generatedAt), 'PPP p')}</p>
                    </div>
                     {previewingBatch.quantity > 1 && <p className="text-xs text-muted-foreground text-center mt-2">Showing 1 of {previewingBatch.quantity} unique QR codes. Use "Print" to get the full sheet.</p>}
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setPreviewingBatch(null)}>Cancel</Button>
                    <Button variant="secondary" onClick={handlePrint}>
                        <Printer className="mr-2" />
                        Print Codes
                    </Button>
                    <Button onClick={handleSaveBatch}>Save Batch</Button>
                </div>
            </DialogContent>
        )}
      </Dialog>

      {previewingBatch && (
         <div className="printable-area hidden">
            <div className="printable-qr-area">
                <h2 className='text-xl font-bold mb-4'>QR Codes for Batch {previewingBatch.batchId}</h2>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {Array.from({ length: previewingBatch.quantity }).map((_, i) => (
                        <div key={i} className="bg-white p-1 rounded-sm break-inside-avoid">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(generateQrData(previewingBatch, i))}`}
                                alt={`QR Code ${i+1}`}
                                className="w-full h-full object-contain"
                            />
                        </div>
                    ))}
                </div>
            </div>
         </div>
      )}
    </>
  );
}
