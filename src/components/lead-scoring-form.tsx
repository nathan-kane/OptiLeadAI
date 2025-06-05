"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { calculateScoreAction, type LeadScoringFormState } from "@/app/(app)/lead-scoring/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Calculating..." : "Calculate Score"}
    </Button>
  );
}

export function LeadScoringForm() {
  const initialState: LeadScoringFormState | undefined = undefined;
  const [state, formAction] = useFormState(calculateScoreAction, initialState);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Lead Score</CardTitle>
          <CardDescription>Enter lead data and scoring rules to get an AI-calculated score.</CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="leadData">Lead Data</Label>
              <Textarea
                id="leadData"
                name="leadData"
                placeholder="E.g., Industry: Tech, Company Size: 500, Job Title: Marketing Manager, Engagement: Visited pricing page..."
                rows={5}
                defaultValue={state?.fields?.leadData}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scoringRules">Scoring Rules</Label>
              <Textarea
                id="scoringRules"
                name="scoringRules"
                placeholder="E.g., If industry is Tech, +10 points. If job title is Manager, +5 points..."
                rows={5}
                defaultValue={state?.fields?.scoringRules}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataValidationResults">Data Validation Results (Optional)</Label>
              <Input
                id="dataValidationResults"
                name="dataValidationResults"
                placeholder="E.g., Email: Valid, Phone: Format OK"
                defaultValue={state?.fields?.dataValidationResults}
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
          <CardTitle>Scoring Result</CardTitle>
          <CardDescription>The AI-generated score and rationale will appear here.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state?.result ? (
            <>
              <Alert variant="default" className="bg-primary/10 border-primary/30">
                <Terminal className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary">Score Calculated!</AlertTitle>
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
              <div>
                <h3 className="font-semibold">Lead Score:</h3>
                <p className="text-2xl font-bold text-primary">{state.result.leadScore}</p>
              </div>
              <div>
                <h3 className="font-semibold">Priority:</h3>
                <p className="text-lg text-accent">{state.result.priority}</p>
              </div>
              <div>
                <h3 className="font-semibold">Rationale:</h3>
                <p className="text-sm text-muted-foreground">{state.result.rationale}</p>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">Submit lead data to see results.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper icon, as AlertTriangle might not be globally available
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

