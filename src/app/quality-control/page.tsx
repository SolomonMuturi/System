'use client';

import { useState, useEffect } from 'react';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FlaskConical, CheckCircle, XCircle, ThumbsUp, ThumbsDown, History } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface QualityCheck {
  id: string;
  weight_entry_id: string;
  pallet_id: string;
  supplier_name: string;
  driver_name: string;
  vehicle_plate: string;
  total_weight: number;
  overall_status: 'approved' | 'rejected';
  notes: string;
  processed_by: string;
  processed_at: string;
  fuerte_class1: number;
  fuerte_class2: number;
  fuerte_overall: number;
  hass_class1: number;
  hass_class2: number;
  hass_overall: number;
}

export default function QualityControlPage() {
  const { toast } = useToast();
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'accepted' | 'declined' | 'history'>('accepted');

  // Load quality checks from database
  const loadQualityChecks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/quality-control');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch quality checks: ${response.status}`);
      }
      
      const qualityChecksData = await response.json();
      
      // Transform quality checks data
      const transformedChecks: QualityCheck[] = qualityChecksData.map((qc: any) => ({
        id: qc.id,
        weight_entry_id: qc.weight_entry_id,
        pallet_id: qc.pallet_id || `WE-${qc.weight_entry_id}`,
        supplier_name: qc.supplier_name || 'Unknown Supplier',
        driver_name: qc.driver_name || '',
        vehicle_plate: qc.vehicle_plate || '',
        total_weight: qc.net_weight || 0,
        overall_status: qc.overall_status as 'approved' | 'rejected',
        notes: qc.notes || '',
        processed_by: qc.processed_by || 'QC Officer',
        processed_at: qc.processed_at || new Date().toISOString(),
        fuerte_class1: qc.fuerte_class1 || 0,
        fuerte_class2: qc.fuerte_class2 || 0,
        fuerte_overall: qc.fuerte_overall || 0,
        hass_class1: qc.hass_class1 || 0,
        hass_class2: qc.hass_class2 || 0,
        hass_overall: qc.hass_overall || 0
      }));
      
      setQualityChecks(transformedChecks);
      
    } catch (error) {
      console.error('Error fetching quality checks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load quality check history.',
        variant: 'destructive',
      });
      setQualityChecks([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on initial render
  useEffect(() => {
    loadQualityChecks();
  }, [toast]);

  // Use quality checks for Accepted/Declined tabs
  const acceptedQualityChecks = qualityChecks.filter(qc => qc.overall_status === 'approved');
  const declinedQualityChecks = qualityChecks.filter(qc => qc.overall_status === 'rejected');

  // Helper function to render packability details
  const renderPackability = (qc: QualityCheck) => (
    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
      {(qc.fuerte_overall > 0 || qc.hass_overall > 0) && (
        <>
          {qc.fuerte_overall > 0 && (
            <div className="bg-black p-2 rounded border text-sm">
              <div className="font-medium">Avocado Fuerte</div>
              <div className="grid grid-cols-3 gap-1 mt-1 text-xs">
                <div>
                  <div className="text-gray-500">Class 1</div>
                  <div className="font-semibold">{qc.fuerte_class1}%</div>
                </div>
                <div>
                  <div className="text-gray-500">Class 2</div>
                  <div className="font-semibold">{qc.fuerte_class2}%</div>
                </div>
                <div>
                  <div className="text-gray-500">Overall</div>
                  <div className={`font-bold ${qc.overall_status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                    {qc.fuerte_overall}%
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {qc.hass_overall > 0 && (
            <div className="bg-black p-2 rounded border text-sm">
              <div className="font-medium">Avocado Hass</div>
              <div className="grid grid-cols-3 gap-1 mt-1 text-xs">
                <div>
                  <div className="text-gray-500">Class 1</div>
                  <div className="font-semibold">{qc.hass_class1}%</div>
                </div>
                <div>
                  <div className="text-gray-500">Class 2</div>
                  <div className="font-semibold">{qc.hass_class2}%</div>
                </div>
                <div>
                  <div className="text-gray-500">Overall</div>
                  <div className={`font-bold ${qc.overall_status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                    {qc.hass_overall}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

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
        <main className="p-4 md:p-6 lg:p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FlaskConical />
              Supplier Quality Control
            </h2>
            <p className="text-muted-foreground">
              View and manage quality control assessments
            </p>
          </div>

          {/* Tabs for viewing QC History - Only 3 tabs now */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="accepted" className="flex items-center gap-2">
                <ThumbsUp className="w-4 h-4" />
                Accepted ({acceptedQualityChecks.length})
              </TabsTrigger>
              <TabsTrigger value="declined" className="flex items-center gap-2">
                <ThumbsDown className="w-4 h-4" />
                Declined ({declinedQualityChecks.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                QC History ({qualityChecks.length})
              </TabsTrigger>
            </TabsList>

            {/* Accepted Suppliers Tab */}
            <TabsContent value="accepted" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4" />
                    Accepted Suppliers
                  </CardTitle>
                  <CardDescription>
                    {acceptedQualityChecks.length} suppliers accepted after QC assessment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="text-gray-500 mt-2">Loading quality checks...</p>
                    </div>
                  ) : acceptedQualityChecks.length === 0 ? (
                    <div className="text-center py-8">
                      <ThumbsUp className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">No accepted suppliers yet</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Accepted suppliers will appear here after QC assessment
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {acceptedQualityChecks.map((qc) => (
                        <div key={qc.id} className="border rounded-lg p-4 bg-black-50">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-semibold flex items-center gap-2">
                                {qc.supplier_name}
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Accepted
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600 flex items-center gap-4 mt-1">
                                <span>Pallet: {qc.pallet_id}</span>
                                <span>Vehicle: {qc.vehicle_plate}</span>
                                <span>Driver: {qc.driver_name}</span>
                                <span>QC Date: {qc.processed_at ? format(new Date(qc.processed_at), 'MMM dd, yyyy HH:mm') : 'N/A'}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-500">Total Weight</div>
                              <div className="font-bold">{qc.total_weight} kg</div>
                            </div>
                          </div>
                          
                          {renderPackability(qc)}
                          
                          {qc.notes && (
                            <div className="mt-3 p-2 bg-black rounded text-sm">
                              <span className="text-gray-500">Notes:</span> {qc.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Declined Suppliers Tab */}
            <TabsContent value="declined" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ThumbsDown className="w-4 h-4" />
                    Declined Suppliers
                  </CardTitle>
                  <CardDescription>
                    {declinedQualityChecks.length} suppliers declined after QC assessment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="text-gray-500 mt-2">Loading quality checks...</p>
                    </div>
                  ) : declinedQualityChecks.length === 0 ? (
                    <div className="text-center py-8">
                      <ThumbsDown className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">No declined suppliers yet</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Declined suppliers will appear here after QC assessment
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {declinedQualityChecks.map((qc) => (
                        <div key={qc.id} className="border rounded-lg p-4 bg-black-50">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-semibold flex items-center gap-2">
                                {qc.supplier_name}
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Declined
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600 flex items-center gap-4 mt-1">
                                <span>Pallet: {qc.pallet_id}</span>
                                <span>Vehicle: {qc.vehicle_plate}</span>
                                <span>Driver: {qc.driver_name}</span>
                                <span>QC Date: {qc.processed_at ? format(new Date(qc.processed_at), 'MMM dd, yyyy HH:mm') : 'N/A'}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-500">Total Weight</div>
                              <div className="font-bold">{qc.total_weight} kg</div>
                            </div>
                          </div>
                          
                          {renderPackability(qc)}
                          
                          {qc.notes && (
                            <div className="mt-3 p-2 bg-black rounded text-sm">
                              <span className="text-gray-500">Notes:</span> {qc.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* QC History Tab - Simple view */}
            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-4 h-4" />
                    QC History
                  </CardTitle>
                  <CardDescription>
                    Complete history of all QC assessments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="text-gray-500 mt-2">Loading quality checks...</p>
                    </div>
                  ) : qualityChecks.length === 0 ? (
                    <div className="text-center py-8">
                      <History className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">No QC history available</p>
                      <p className="text-sm text-gray-400 mt-1">
                        QC assessments will appear here after they are submitted
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {qualityChecks.map((qc) => (
                        <div key={qc.id} className="border rounded-lg p-3 bg-black-50">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-semibold">{qc.supplier_name}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                Pallet: {qc.pallet_id} • {qc.overall_status === 'approved' ? 'Accepted' : 'Declined'} • {qc.processed_at ? format(new Date(qc.processed_at), 'MMM dd, yyyy') : 'N/A'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-500">Weight</div>
                              <div className="font-bold">{qc.total_weight} kg</div>
                            </div>
                          </div>
                          
                          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                            {qc.fuerte_overall > 0 && (
                              <div>
                                <span className="text-gray-500">Fuerte:</span> {qc.fuerte_overall}%
                              </div>
                            )}
                            {qc.hass_overall > 0 && (
                              <div>
                                <span className="text-gray-500">Hass:</span> {qc.hass_overall}%
                              </div>
                            )}
                          </div>
                          
                          {qc.notes && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="text-gray-500">Note:</span> {qc.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}