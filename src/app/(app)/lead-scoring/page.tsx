"use client";

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { ScoringRule } from '@/types'; // Ensure ScoringRule is imported
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState, useEffect } from 'react'
import { addScoringRule, getScoringRules, deleteScoringRule } from './actions'
import { updateScoringRule, addDefaultScoringRules } from './actions' // Import updateScoringRule and addDefaultScoringRules
import { useToast } from '@/hooks/use-toast';

export default function LeadScoringPage() {
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRule, setNewRule] = useState<Partial<ScoringRule>>({});
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewRule(prevRule => ({
      ...prevRule as Partial<ScoringRule>,
      [id]: value,
    }));
  };
  const handleSelectChange = (id: string, value: string) => {
    setNewRule(prevRule => ({
      ...prevRule,
      [id]: value as ScoringRule[keyof ScoringRule], // Type assertion for safety
    }));
  };

  const handleSaveRule = async () => {
    if (!newRule.attribute || !newRule.condition || !newRule.value || newRule.weight === undefined) {
      toast({
        title: "Missing Information",
        description: "Please fill out all fields for the scoring rule.",
        variant: "destructive",
      });
      return;
    }

    const ruleToSave: Partial<ScoringRule> = {
      attribute: newRule.attribute as ScoringRule['attribute'],
      condition: newRule.condition as ScoringRule['condition'],
      value: newRule.value, // Needs proper type handling
      weight: Number(newRule.weight), // Needs proper type handling
    };

    if (newRule.attribute === 'custom' && newRule.customAttributeName) {
      ruleToSave.customAttributeName = newRule.customAttributeName;
    }

    try {
 if (newRule.id) {
        // If newRule has an id, it's an update
 await updateScoringRule(newRule.id, ruleToSave as Omit<ScoringRule, 'id'>);
 toast({
 title: "Rule Updated",
 description: "The scoring rule has been updated.",
 duration: 3000,
 });
      } else {
        // If newRule does not have an id, it's a new rule
        await addScoringRule({
 ...ruleToSave as Omit<ScoringRule, 'id'>
        });
 toast({
 title: "Rule Added",
 description: "The scoring rule has been saved.",
 duration: 3000,
        });
      }
      setNewRule({}); // Clear the form
      setIsModalOpen(false); // Close the modal
    } catch (error) {
      console.error("Error saving scoring rule:", error);
      toast({
        title: "Error",
        description: "There was an error saving the scoring rule.",
        variant: "destructive",
      });
    } finally {
      fetchScoringRules(); // Refresh the list after saving
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    const confirmed = confirm("Are you sure you want to delete this scoring rule?");

    if (confirmed) {
      try {
        await deleteScoringRule(ruleId);
        toast({
          title: "Rule Deleted",
          description: "The scoring rule has been removed.",
          duration: 3000,
        });
      } catch (error) {
        console.error("Error deleting scoring rule:", error);
        toast({
          title: "Error",
          description: "There was an error deleting the scoring rule.",
          variant: "destructive",
        });
      } finally {
        fetchScoringRules(); // Refresh the list after deleting
      }
    }
  };

  const handleEditRule = (rule: ScoringRule) => {
    setNewRule(rule);
    setIsModalOpen(true);
  };

  const fetchScoringRules = async () => {
    console.log("Fetching scoring rules...");
    try {
      const rules = await getScoringRules();
      setScoringRules(rules);
    } catch (error) {
      console.error("Error fetching scoring rules:", error);
      toast({
        title: "Error",
        description: "There was an error fetching scoring rules.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchScoringRules();
    addDefaultScoringRules();
  }, []); // Fetch rules on component mount

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
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => setIsModalOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Rule
                  </Button>
 </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Scoring Rule</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="attribute" className="text-right">Attribute</Label>
                      {/* Consider using a Select for predefined attributes */}
                      {/* Adding a basic input for attribute for now */}
                      {/* Need to update to a Select with predefined options later */}
                      <Input id="attribute" className="col-span-3" onChange={handleInputChange} value={newRule.attribute || ''} />
                    </div>
                    {newRule.attribute === 'custom' && (
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="customAttributeName" className="text-right">Custom Attribute Name</Label>
                        <Input id="customAttributeName" className="col-span-3" onChange={handleInputChange} value={newRule.customAttributeName || ''} placeholder="Enter custom attribute name" />
                      </div>
                    )}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="condition" className="text-right">Condition</Label>
                      {/* Consider using a Select for predefined conditions */}
                      <Input id="condition" className="col-span-3" onChange={handleInputChange} value={newRule.condition || ''} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="value" className="text-right">Value</Label>
                      <Input id="value" className="col-span-3" onChange={handleInputChange} value={newRule.value?.toString() || ''} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="weight" className="text-right">Weight</Label>
                      <Input id="weight" type="number" className="col-span-3" onChange={handleInputChange} value={newRule.weight?.toString() || ''} />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
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
                {/* This should map over fetched rules, not mock data */}
                {scoringRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>{rule.customAttributeName || rule.attribute}</TableCell>
                    <TableCell>{rule.condition}</TableCell>
                    <TableCell>{rule.value?.toString()}</TableCell>
                    <TableCell>{rule.weight}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="mr-2">
 <Edit className="h-4 w-4" onClick={() => handleEditRule(rule)} />
                      </Button> {/* Add onClick handler here */}
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

      </div>
    </>
  )
}
