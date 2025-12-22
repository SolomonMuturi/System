
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { useToast } from '@/hooks/use-toast';
import { employeeData, packagingMaterialData as initialPackagingData, type PackagingMaterial, coldRoomStatusData as initialColdRoomData, type ColdRoomStatus } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Check, Truck, UserCheck, Wallet, Save, Package, Thermometer, PlusCircle } from 'lucide-react';
import { BrandingSettings } from '@/components/dashboard/branding-settings';
import { PackagingMaterialStock } from '@/components/dashboard/packaging-material-stock';
import { ColdRoomSettings } from '@/components/dashboard/cold-room-settings';

const initialPricingTiers = [
  {
    name: 'Starter',
    price: 'KES 4,999',
    period: 'per user / month',
    description: 'For small teams getting started with supply chain management.',
    features: [
      'Shipment Tracking',
      'Basic Traceability',
      'Warehouse Dashboard',
      'Standard Reporting',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Professional',
    price: 'KES 9,999',
    period: 'per user / month',
    description: 'For growing businesses that need more advanced features.',
    features: [
      'Everything in Starter',
      'Advanced Cold Chain Monitoring',
      'Full Financials Suite',
      'User Role Management',
      'Multi-tenant Branding',
    ],
    cta: 'Choose Professional',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Contact Us',
    period: 'for custom pricing',
    description: 'For large organizations with complex operational needs.',
    features: [
      'Everything in Professional',
      'Business Intelligence Suite',
      'AI Anomaly Detection',
      'Dedicated Support & SLA',
      'Custom Integrations',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

const workflowSuggestions = [
    {
        id: 'incoming-shipment',
        icon: Truck,
        title: "Incoming Shipment Processing",
        description: "Automate tasks from pre-registration to final put-away. Notify quality control, assign receiving bays, and trigger labeling upon weight capture."
    },
    {
        id: 'visitor-approval',
        icon: UserCheck,
        title: "Visitor & Host Approval",
        description: "Create multi-step approval chains for high-security visitors. Require host and security manager approval before a QR code is issued."
    },
    {
        id: 'payroll-advance',
        icon: Wallet,
        title: "Payroll & Advance Approval",
        description: "Set rules for automatic approval of small salary advances based on employee tenure, while routing larger requests to management for review."
    }
];

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [pricingTiers, setPricingTiers] = useState(initialPricingTiers);
  const [packagingMaterials, setPackagingMaterials] = useState<PackagingMaterial[]>(initialPackagingData);
  const [coldRooms, setColdRooms] = useState<ColdRoomStatus[]>(initialColdRoomData);

  const handleTierChange = (index: number, field: string, value: string | string[]) => {
      const newTiers = [...pricingTiers];
      if(field === 'features') {
        (newTiers[index] as any)[field] = (value as string).split('\n');
      } else {
        (newTiers[index] as any)[field] = value;
      }
      setPricingTiers(newTiers);
  }

  const handleTierSave = (tierName: string) => {
      toast({
          title: 'Pricing Tier Saved',
          description: `${tierName} tier has been updated.`
      });
  }
  
  const handleConfigureWorkflow = (workflowId: string) => {
    router.push(`/settings/workflows/${workflowId}`);
  };

  const handleColdRoomsSave = (updatedRooms: ColdRoomStatus[]) => {
    setColdRooms(updatedRooms);
    toast({
      title: 'Cold Room Settings Saved',
      description: 'Your cold room configurations have been updated.',
    });
  }

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
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight">
                    Settings
                </h2>
                <p className="text-muted-foreground">
                    Manage application settings and user preferences.
                </p>
            </div>

             <Tabs defaultValue="branding" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="branding">Branding</TabsTrigger>
                <TabsTrigger value="pricing">Pricing Tiers</TabsTrigger>
                <TabsTrigger value="packaging">Packaging</TabsTrigger>
                <TabsTrigger value="cold-rooms">Cold Rooms</TabsTrigger>
                <TabsTrigger value="workflows">Workflows</TabsTrigger>
              </TabsList>
              <TabsContent value="branding" className="mt-6">
                <BrandingSettings />
              </TabsContent>
              <TabsContent value="pricing" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {pricingTiers.map((tier, index) => (
                    <Card key={tier.name} className={`flex flex-col ${tier.popular ? 'border-primary ring-2 ring-primary' : ''}`}>
                        <CardHeader className="relative">
                        {tier.popular && <div className="absolute top-0 -translate-y-1/2 w-full flex justify-center"><div className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">Most Popular</div></div>}
                        <Input 
                            className="text-2xl font-bold border-0 text-foreground p-0 h-auto" 
                            value={tier.name}
                            onChange={(e) => handleTierChange(index, 'name', e.target.value)}
                        />
                        <Input 
                            className="text-sm p-0 h-auto"
                            value={tier.description}
                            onChange={(e) => handleTierChange(index, 'description', e.target.value)}
                        />
                        </CardHeader>
                        <CardContent className="flex-grow space-y-6">
                        <div>
                           <Input 
                                className="text-4xl font-bold p-0 h-auto"
                                value={tier.price}
                                onChange={(e) => handleTierChange(index, 'price', e.target.value)}
                            />
                             <Input 
                                className="text-muted-foreground p-0 h-auto"
                                value={tier.period}
                                onChange={(e) => handleTierChange(index, 'period', e.target.value)}
                            />
                        </div>
                        <Textarea
                            value={tier.features.join('\n')}
                            onChange={(e) => handleTierChange(index, 'features', e.target.value)}
                            className="text-sm leading-6"
                            rows={tier.features.length}
                        />
                        </CardContent>
                        <CardFooter className="flex-col gap-2">
                         <Button className="w-full" variant={tier.popular ? 'default' : 'outline'}>{tier.cta}</Button>
                         <Button className="w-full" variant="secondary" onClick={() => handleTierSave(tier.name)}>
                             <Save className="mr-2"/>
                             Save Changes
                         </Button>
                        </CardFooter>
                    </Card>
                    ))}
                </div>
              </TabsContent>
               <TabsContent value="packaging" className="mt-6">
                 <PackagingMaterialStock materials={packagingMaterials} stockTakeMode={false} setMaterials={setPackagingMaterials}/>
              </TabsContent>
              <TabsContent value="cold-rooms" className="mt-6">
                <ColdRoomSettings initialData={coldRooms} onSave={handleColdRoomsSave} />
              </TabsContent>
              <TabsContent value="workflows" className="mt-6">
                   <Card>
                      <CardHeader>
                        <CardTitle>Workflow Automation</CardTitle>
                        <CardDescription>Define and manage process workflows to automate tasks and improve efficiency.</CardDescription>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {workflowSuggestions.map(flow => (
                             <Card key={flow.title}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <flow.icon className="w-6 h-6 text-primary" />
                                        {flow.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{flow.description}</p>
                                </CardContent>
                                <CardFooter>
                                    <Button variant="outline" className="w-full" onClick={() => handleConfigureWorkflow(flow.id)}>Configure Workflow</Button>
                                </CardFooter>
                             </Card>
                        ))}
                      </CardContent>
                  </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
