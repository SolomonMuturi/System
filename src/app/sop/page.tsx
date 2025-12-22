
'use client';

import { useState } from 'react';
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
import { sopData, allSopEmployeeData, type SOP } from '@/lib/sop-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Edit, BookOpen, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUser } from '@/hooks/use-user';

const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('');

const statusConfig = {
    'Completed': { icon: CheckCircle, color: 'text-green-500', label: 'Completed' },
    'In Progress': { icon: Clock, color: 'text-yellow-500', label: 'In Progress' },
    'Not Started': { icon: Circle, color: 'text-muted-foreground', label: 'Not Started' },
};

export default function SOPPage() {
  const { user } = useUser();
  const [sops, setSops] = useState(sopData);
  const [selectedSop, setSelectedSop] = useState<SOP>(sops[0]);

  const handleMarkAsRead = (sopId: string) => {
    // In a real app, this would be tied to the logged-in user.
    const userId = user?.id || 'emp-1'; // Use current user or fallback
    
    // Update the list of all SOPs
    const newSops = sops.map(sop => {
      if (sop.id === sopId && !sop.readBy.includes(userId)) {
        const newReadBy = [...sop.readBy, userId];
        let newStatus: SOP['status'] = 'In Progress';
        if (newReadBy.length === allSopEmployeeData.length) {
          newStatus = 'Completed';
        }
        return { ...sop, readBy: newReadBy, status: newStatus };
      }
      return sop;
    });
    setSops(newSops);

    // Also update the currently selected SOP state if it's the one being changed
    if (selectedSop.id === sopId) {
      const updatedSop = newSops.find(s => s.id === sopId);
      if (updatedSop) {
        setSelectedSop(updatedSop);
      }
    }
  };

  const getReadByAvatars = (readByIds: string[]) => {
    return readByIds.map(id => allSopEmployeeData.find(emp => emp.id === id)).filter(Boolean);
  };
  
  const completionPercentage = (selectedSop.readBy.length / allSopEmployeeData.length) * 100;
  const hasUserRead = user ? selectedSop.readBy.includes(user.id) : false;

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
                        Standard Operating Procedures (SOPs)
                    </h2>
                    <p className="text-muted-foreground">
                        A central knowledge base for all company procedures.
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <div className="col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>All SOPs</CardTitle>
                            </CardHeader>
                            <CardContent className="p-2 space-y-1">
                                {sops.map(sop => {
                                    const StatusIcon = statusConfig[sop.status].icon;
                                    return (
                                        <button 
                                            key={sop.id} 
                                            onClick={() => setSelectedSop(sop)}
                                            className={cn(
                                                "w-full text-left p-3 rounded-md transition-colors",
                                                selectedSop.id === sop.id ? 'bg-muted' : 'hover:bg-muted/50'
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold truncate pr-2">{sop.title}</p>
                                                <StatusIcon className={cn("w-4 h-4 flex-shrink-0", statusConfig[sop.status].color)} />
                                            </div>
                                            <p className="text-xs text-muted-foreground">{statusConfig[sop.status].label}</p>
                                        </button>
                                    )
                                })}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="col-span-1 md:col-span-2 lg:col-span-3">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl flex items-center gap-2">
                                            <BookOpen />
                                            {selectedSop.title}
                                        </CardTitle>
                                        <CardDescription className="mt-1">
                                            Last Modified: {formatDistanceToNow(new Date(selectedSop.lastModified), { addSuffix: true })}
                                        </CardDescription>
                                    </div>
                                    <Button variant="outline"><Edit className="mr-2" /> Edit</Button>
                                </div>
                            </CardHeader>
                            <CardContent className="prose prose-sm max-w-none text-foreground dark:prose-invert">
                                <p className="lead">{selectedSop.objective}</p>
                                {selectedSop.sections.map((section, index) => (
                                    <div key={index} className="mt-6">
                                        <h3>{section.title}</h3>
                                        <ul className="list-disc pl-5 space-y-2">
                                            {section.steps.map((step, stepIndex) => (
                                                <li key={stepIndex}>
                                                    <strong>{step.action}:</strong> {step.detail}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </CardContent>
                            <CardFooter className="flex flex-col items-start gap-4 border-t pt-6">
                                 <div className="w-full">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-semibold flex items-center gap-2"><Users /> Readership</h4>
                                        <span className="text-sm text-muted-foreground">{selectedSop.readBy.length} of {allSopEmployeeData.length} employees</span>
                                    </div>
                                    <Progress value={completionPercentage} />
                                    <TooltipProvider>
                                      <div className="flex items-center gap-2 mt-2">
                                          <div className="flex -space-x-2">
                                              {getReadByAvatars(selectedSop.readBy).slice(0, 7).map(emp => (
                                                emp && <Tooltip key={emp.id}>
                                                  <TooltipTrigger>
                                                    <Avatar className="h-8 w-8 border-2 border-background">
                                                        <AvatarImage src={emp?.image} />
                                                        <AvatarFallback>{getInitials(emp?.name || '')}</AvatarFallback>
                                                    </Avatar>
                                                  </TooltipTrigger>
                                                  <TooltipContent>
                                                    <p>{emp?.name} - Read</p>
                                                  </TooltipContent>
                                                </Tooltip>
                                              ))}
                                          </div>
                                          {selectedSop.readBy.length > 7 && (
                                              <span className="text-xs text-muted-foreground">+{selectedSop.readBy.length - 7} more</span>
                                          )}
                                      </div>
                                    </TooltipProvider>
                                </div>
                                <Button onClick={() => handleMarkAsRead(selectedSop.id)} disabled={hasUserRead}>
                                    <CheckCircle className="mr-2"/>
                                    {hasUserRead ? 'Read' : 'Mark as Read'}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
