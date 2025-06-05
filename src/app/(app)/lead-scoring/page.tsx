import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { mockScoringRules } from '@/data/mock-data';
import type { ScoringRule } from '@/types';
import { LeadScoringForm } from '@/components/lead-scoring-form';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

export default function LeadScoringPage() {
  const rules: ScoringRule[] = mockScoringRules;

  return (
    <>
      <PageHeader
        title="AI Lead Scoring Configuration"
        description="Define rules for automatic lead scoring and test with sample data."
      />
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Scoring Rules</CardTitle>
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Rule
              </Button>
            </div>
            <CardDescription>
              Manage the criteria and weights used to score your leads.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Attribute</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>{rule.customAttributeName || rule.attribute}</TableCell>
                    <TableCell>{rule.condition}</TableCell>
                    <TableCell>{rule.value}</TableCell>
                    <TableCell>{rule.weight}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="mr-2">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <LeadScoringForm />
      </div>
    </>
  );
}
