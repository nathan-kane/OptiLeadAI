"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateSnippetAction, type EmailPersonalizationFormState } from "@/app/(app)/email-personalization/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sparkles, ClipboardCopy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Generating..." : "Generate Snippet"}
    </Button>
  );
}

export function EmailPersonalizationForm() {
  const initialState: EmailPersonalizationFormState | undefined = undefined;
  const [state, formAction] = useFormState(generateSnippetAction, initialState);
  const { toast } = useToast();

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied!", description: "Email snippet copied to clipboard." });
    }).catch(err => {
      toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy text." });
      console.error('Failed to copy text: ', err);
    });
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Personalized Email Snippet</CardTitle>
          <CardDescription>Provide lead and company details to get an AI-crafted email snippet.</CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="leadName">Lead Name</Label>
                <Input id="leadName" name="leadName" placeholder="Jane Doe" defaultValue={state?.fields?.leadName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadCompany">Lead Company</Label>
                <Input id="leadCompany" name="leadCompany" placeholder="Acme Corp" defaultValue={state?.fields?.leadCompany} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="leadIndustry">Lead Industry</Label>
                <Input id="leadIndustry" name="leadIndustry" placeholder="SaaS" defaultValue={state?.fields?.leadIndustry} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadJobTitle">Lead Job Title</Label>
                <Input id="leadJobTitle" name="leadJobTitle" placeholder="Marketing Manager" defaultValue={state?.fields?.leadJobTitle} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="leadWebsiteEngagement">Lead Website Engagement</Label>
              <Textarea
                id="leadWebsiteEngagement"
                name="leadWebsiteEngagement"
                placeholder="Visited pricing page, downloaded e-book on SEO."
                rows={3}
                defaultValue={state?.fields?.leadWebsiteEngagement}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyValueProposition">Your Company Value Proposition</Label>
              <Textarea
                id="companyValueProposition"
                name="companyValueProposition"
                placeholder="We help businesses increase organic traffic by 200% through AI-powered SEO strategies."
                rows={3}
                defaultValue={state?.fields?.companyValueProposition}
              />
            </div>
            {state?.issues && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {state.issues.map((issue) => (<li key={issue}>{issue}</li>))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            {state?.message && !state.result && !state.issues && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{state.message}</AlertDescription>
                </Alert>
            )}
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated Snippet</CardTitle>
          <CardDescription>Your personalized email snippet will appear here.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state?.result?.emailSnippet ? (
            <>
             <Alert variant="default" className="bg-primary/10 border-primary/30">
                <Sparkles className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary">Snippet Generated!</AlertTitle>
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
              <div className="p-4 border rounded-md bg-muted/50 relative">
                <p className="text-sm whitespace-pre-wrap">{state.result.emailSnippet}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={() => handleCopyToClipboard(state.result!.emailSnippet)}
                >
                  <ClipboardCopy className="h-4 w-4" />
                  <span className="sr-only">Copy snippet</span>
                </Button>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">Submit lead data to generate an email snippet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper icon
const AlertTriangle = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);
