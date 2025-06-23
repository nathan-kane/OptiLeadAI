
'use client';

import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PlusCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  addLeadAction,
  type AddLeadFormState,
} from '@/app/(app)/dashboard/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Adding Lead...' : 'Add Lead'}
    </Button>
  );
}

export function AddLeadForm() {
  const initialState: AddLeadFormState = { message: '', success: false };
  const [state, formAction] = useFormState(addLeadAction, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.success) {
      toast({
        title: 'Success!',
        description: state.message,
      });
      // Here you might want to close the dialog, which requires controlling its open state.
      // For simplicity, we'll let the user close it manually.
    } else if (state.message && !state.success) {
      // This handles server-side errors that are not validation issues.
    }
  }, [state, toast]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
          <DialogDescription>
            Enter the details for the new lead. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Jane Doe"
                defaultValue={state?.fields?.name}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="jane.doe@example.com"
                defaultValue={state?.fields?.email}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                name="company"
                placeholder="Acme Inc."
                defaultValue={state?.fields?.company}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="jobTitle">Job Title (Optional)</Label>
              <Input
                id="jobTitle"
                name="jobTitle"
                placeholder="CEO"
                defaultValue={state?.fields?.jobTitle}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="industry">Industry (Optional)</Label>
              <Input
                id="industry"
                name="industry"
                placeholder="Technology"
                defaultValue={state?.fields?.industry}
              />
            </div>
             {state.issues && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Validation Error</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {state.issues.map((issue) => (<li key={issue}>{issue}</li>))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
             {state.message && !state.success && !state.issues && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{state.message}</AlertDescription>
                </Alert>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
            </DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
