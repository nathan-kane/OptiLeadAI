"use client";

import { useState } from 'react';
import type { DripCampaign, DripCampaignStep, EmailTemplate } from '@/types';
import { mockEmailTemplates } from '@/data/mock-data';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DripCampaignFormProps {
  campaign?: DripCampaign;
  onSave: (campaign: DripCampaign) => void;
  triggerButton: React.ReactNode;
}

export function DripCampaignForm({ campaign, onSave, triggerButton }: DripCampaignFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const [name, setName] = useState(campaign?.name || '');
  const [triggerType, setTriggerType] = useState<DripCampaign['triggerType']>(campaign?.triggerType || 'scoreThreshold');
  const [triggerValue, setTriggerValue] = useState(campaign?.triggerValue?.toString() || '');
  const [steps, setSteps] = useState<DripCampaignStep[]>(campaign?.steps || [{ id: Date.now().toString(), emailTemplateId: '', delayDays: 0, order: 1 }]);

  const emailTemplates: EmailTemplate[] = mockEmailTemplates;

  const handleAddStep = () => {
    setSteps([...steps, { id: Date.now().toString(), emailTemplateId: '', delayDays: 1, order: steps.length + 1 }]);
  };

  const handleRemoveStep = (id: string) => {
    setSteps(steps.filter(step => step.id !== id));
  };

  const handleStepChange = (id: string, field: keyof DripCampaignStep, value: string | number) => {
    setSteps(steps.map(step => step.id === id ? { ...step, [field]: field === 'delayDays' ? Number(value) : value } : step));
  };
  
  const handleSubmit = () => {
    if (!name.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Campaign name is required." });
      return;
    }
    // Basic validation for steps
    if (steps.some(step => !step.emailTemplateId)) {
       toast({ variant: "destructive", title: "Error", description: "All steps must have an email template selected." });
      return;
    }

    const newCampaign: DripCampaign = {
      id: campaign?.id || Date.now().toString(),
      name,
      status: campaign?.status || 'Draft',
      triggerType,
      triggerValue: triggerType === 'scoreThreshold' ? Number(triggerValue) : triggerValue,
      steps: steps.map((step, index) => ({ ...step, order: index + 1 })), // Re-order
      totalEmails: steps.length,
      enrollmentCount: campaign?.enrollmentCount || 0,
    };
    onSave(newCampaign);
    toast({ title: "Campaign Saved", description: `Campaign "${name}" has been saved.`});
    setIsOpen(false);
    // Reset form for next time if it's a create form (no initial campaign)
    if (!campaign) {
        setName('');
        setTriggerType('scoreThreshold');
        setTriggerValue('');
        setSteps([{ id: Date.now().toString(), emailTemplateId: '', delayDays: 0, order: 1 }]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{campaign ? 'Edit' : 'Create'} Drip Campaign</DialogTitle>
          <DialogDescription>
            Configure your automated email sequence.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="grid gap-2">
            <Label htmlFor="campaignName">Campaign Name</Label>
            <Input id="campaignName" value={name} onChange={(e) => setName(e.target.value)} placeholder="E.g., Welcome Series" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="triggerType">Trigger Type</Label>
              <Select value={triggerType} onValueChange={(value: DripCampaign['triggerType']) => setTriggerType(value)}>
                <SelectTrigger id="triggerType">
                  <SelectValue placeholder="Select trigger" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scoreThreshold">Score Threshold</SelectItem>
                  <SelectItem value="formSubmission">Form Submission</SelectItem>
                  <SelectItem value="manualAdd">Manual Add</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {triggerType !== 'manualAdd' && (
              <div className="grid gap-2">
                <Label htmlFor="triggerValue">Trigger Value</Label>
                <Input 
                  id="triggerValue" 
                  value={triggerValue} 
                  onChange={(e) => setTriggerValue(e.target.value)} 
                  placeholder={triggerType === 'scoreThreshold' ? "E.g., 80 (for score > 80)" : "E.g., contact-form-id"}
                  type={triggerType === 'scoreThreshold' ? 'number' : 'text'}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Campaign Steps</Label>
            {steps.map((step, index) => (
              <Card key={step.id} className="p-3">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                  <div className="flex-grow space-y-2">
                    <div className="flex items-center justify-between">
                       <p className="text-sm font-medium">Step {index + 1}</p>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveStep(step.id)} className="h-7 w-7">
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                    <Select 
                        value={step.emailTemplateId} 
                        onValueChange={(value) => handleStepChange(step.id, 'emailTemplateId', value)}
                    >
                      <SelectTrigger placeholder="Select email template">
                        <SelectValue placeholder="Select email template" />
                      </SelectTrigger>
                      <SelectContent>
                        {emailTemplates.map(template => (
                          <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                        <Input 
                            type="number"
                            value={step.delayDays}
                            onChange={(e) => handleStepChange(step.id, 'delayDays', e.target.value)}
                            min="0"
                            placeholder="Delay in days"
                        />
                        <span className="text-sm text-muted-foreground">days after previous step</span>
                    </div>
                  </div>
                 
                </div>
              </Card>
            ))}
            <Button variant="outline" size="sm" onClick={handleAddStep} className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Step
            </Button>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit}>Save Campaign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
