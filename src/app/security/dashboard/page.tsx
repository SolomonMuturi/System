

'use client';

import { useState } from 'react';
import Link from 'next/link';
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
import { visitorData, overviewData, shipmentData, type Visitor, type Shipment, employeeData } from '@/lib/data';
import { VisitorDataTable } from '@/components/dashboard/visitor-data-table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CreateVisitorForm, type VisitorFormValues } from '@/components/dashboard/create-visitor-form';
import { PlusCircle, Clock, Truck, Users, QrCode } from 'lucide-react';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { GatePassDialog } from '@/components/dashboard/gate-pass-dialog';
import { VisitorDetailDialog } from '@/components/dashboard/visitor-detail-dialog';
import { CheckInDialog } from '@/components/dashboard/check-in-dialog';
import { useToast } from '@/hooks/use-toast';
import { RegistrationSuccess } from '@/components/dashboard/registration-success';
import { ShipmentDataTable } from '@/components/dashboard/shipment-data-table';
import { useRouter } from 'next/navigation';

export default function SecurityDashboardPage() {
  const [visitors, setVisitors] = useState<Visitor[]>(visitorData);
  const [shipments, setShipments] = useState<Shipment[]>(shipmentData);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);
  const [isGatePassOpen, setIsGatePassOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [newlyRegisteredVisitor, setNewlyRegisteredVisitor] = useState<Visitor | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleAddVisitor = (values: VisitorFormValues) => {
    const newVisitor: Visitor = {
      id: `vis-${Date.now()}`,
      visitorCode: `VIST-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      status: 'Pre-registered',
      name: values.name,
      hostId: values.hostId,
      idNumber: values.idNumber,
      company: values.company,
      email: values.email,
      phone: values.phone,
      expectedCheckInTime: values.expectedCheckInTime,
      vehiclePlate: values.vehiclePlate || 'N/A',
      vehicleType: values.vehicleType || 'N/A',
      cargoDescription: values.cargoDescription,
    };
    setVisitors(prev => [newVisitor, ...prev]);
    setNewlyRegisteredVisitor(newVisitor);

    if (values.logShipment && values.customer && values.origin && values.destination && values.product) {
      const newShipment: Shipment = {
        id: `ship-${Date.now()}`,
        shipmentId: `SH-${Math.floor(Math.random() * 90000) + 10000}`,
        customer: values.customer,
        origin: values.origin,
        destination: values.destination,
        status: 'Receiving',
        product: values.product,
        tags: 'Not tagged',
        weight: 'Not weighed',
        expectedArrival: values.expectedCheckInTime,
      };
      setShipments(prev => [newShipment, ...prev]);
       toast({
        title: 'Visitor & Shipment Registered',
        description: `${newVisitor.name} has been pre-registered and shipment ${newShipment.shipmentId} has been created.`,
      });
    } else {
       toast({
        title: 'Visitor Registered',
        description: `${newVisitor.name} has been pre-registered.`,
      });
    }
  };

  const handleRegistrationDialogClose = (open: boolean) => {
    if (!open) {
      setNewlyRegisteredVisitor(null);
    }
    setIsRegisterDialogOpen(open);
  }

  const handleCheckIn = (visitorId: string) => {
    const visitor = visitors.find(v => v.id === visitorId);
    if (!visitor) return;

    setVisitors(prev => prev.map(v => v.id === visitorId ? { ...v, status: 'Checked-in', checkInTime: new Date().toISOString() } : v));
    setIsCheckInDialogOpen(false);
    
    const host = employeeData.find(e => e.id === visitor.hostId);
    toast({
        title: "Visitor Checked In",
        description: `${visitor.name} has been checked in. ${host ? `Host (${host.name}) has been notified.` : ''}`,
    });
  };

  const handleCheckOut = (visitorId: string, final: boolean = false) => {
    const visitor = visitors.find(v => v.id === visitorId);
    if (!visitor) return;

    if (final) {
        // Final verification step at the gate
        const updatedVisitor = { ...visitor, status: 'Checked-out' as const, checkOutTime: new Date().toISOString() };
        setSelectedVisitor(updatedVisitor);
        setVisitors(prev => prev.map(v => v.id === visitorId ? updatedVisitor : v));
        setIsCheckInDialogOpen(false); // Close the check-in/verification dialog
        toast({
            title: "Visitor Verified for Exit",
            description: `${visitor.name} has been successfully checked out.`,
        });
    } else {
        // Initial checkout action (e.g., by host), sets status to 'Pending Exit'
        const updatedVisitor = { ...visitor, status: 'Pending Exit' as const };
        setSelectedVisitor(updatedVisitor);
        setVisitors(prev => prev.map(v => v.id === visitorId ? updatedVisitor : v));
        
        toast({
            title: "Checkout Initiated",
            description: `${visitor.name} is now pending exit. A gate pass can be generated.`,
        });

        if(visitor.vehiclePlate && visitor.vehiclePlate !== 'N/A') {
            setIsGatePassOpen(true);
        }
    }
  };

  const handleRowClick = (visitor: Visitor) => {
    setSelectedVisitor(visitor);
    setIsDetailDialogOpen(true);
  };
  
  const preRegisteredVisitors = visitors.filter(v => v.status === 'Pre-registered');
  const pendingExitVisitors = visitors.filter(v => v.status === 'Pending Exit');
  const incomingShipments = shipments.filter(s => s.status === 'Receiving' || s.status === 'In-Transit' || s.status === 'Processing');

  const handleRecordWeight = (shipmentId: string) => router.push(`/weight-capture?shipmentId=${shipmentId}`);
  const handleManageTags = (shipmentId: string) => router.push('/tag-management');
  const handleViewDetails = (shipmentId: string) => router.push(`/traceability?shipmentId=${shipmentId}`);

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
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        Security Dashboard
                    </h2>
                    <p className="text-muted-foreground">
                        Manage visitor registration and check-in.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsCheckInDialogOpen(true)}>
                        <QrCode className="mr-2" />
                        Check-in / Verify Exit
                    </Button>
                    <Dialog open={isRegisterDialogOpen} onOpenChange={handleRegistrationDialogClose}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2" />
                                Pre-register Visitor
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                           {!newlyRegisteredVisitor ? (
                              <>
                                <DialogHeader>
                                <DialogTitle>Pre-register New Visitor</DialogTitle>
                                <DialogDescription>
                                    Fill in the details below. You can also log an incoming shipment.
                                </DialogDescription>
                                </DialogHeader>
                                <CreateVisitorForm onSubmit={handleAddVisitor} />
                              </>
                           ) : (
                                <RegistrationSuccess 
                                  visitor={newlyRegisteredVisitor}
                                  onDone={() => handleRegistrationDialogClose(false)}
                                />
                           )}
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Link href="/visitor-management" className="block transition-transform hover:scale-[1.02]">
                    <OverviewCard data={overviewData.visitorsToday} icon={Users} />
                </Link>
                <Link href="/vehicle-management" className="block transition-transform hover:scale-[1.02]">
                    <OverviewCard data={overviewData.vehiclesOnSite} icon={Truck} />
                </Link>
                <Link href="/analytics" className="block transition-transform hover:scale-[1.02]">
                    <OverviewCard data={overviewData.avgVisitDuration} icon={Clock} />
                </Link>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4">Incoming Shipment Notice Board</h3>
                <ShipmentDataTable shipments={incomingShipments} onRecordWeight={handleRecordWeight} onManageTags={handleManageTags} onViewDetails={handleViewDetails} />
            </div>

            <VisitorDataTable visitors={visitors} onCheckIn={() => setIsCheckInDialogOpen(true)} onCheckOut={handleCheckOut} onRowClick={handleRowClick} />
          
            <CheckInDialog
                isOpen={isCheckInDialogOpen}
                onOpenChange={setIsCheckInDialogOpen}
                visitors={preRegisteredVisitors}
                pendingExitVisitors={pendingExitVisitors}
                onCheckIn={handleCheckIn}
                onVerifyExit={(visitorId) => handleCheckOut(visitorId, true)}
            />

            {selectedVisitor && (
                <GatePassDialog 
                    isOpen={isGatePassOpen} 
                    onOpenChange={setIsGatePassOpen} 
                    visitor={selectedVisitor} 
                />
            )}

            {selectedVisitor && (
                <VisitorDetailDialog
                isOpen={isDetailDialogOpen}
                onOpenChange={setIsDetailDialogOpen}
                visitor={selectedVisitor}
                />
            )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
