"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Assuming Select is used for dropdowns
import { PageHeader } from "@/components/page-header";
import { toast } from "@/components/ui/use-toast"; // Assuming toast is used here
import { useToast } from "@/hooks/use-toast";

const leadSearchFormSchema = z.object({
  geographicArea: z.string().min(1, {
    message: "Geographic area is required.",
  }),
  timeframe: z.string().min(1, {
    message: "Timeframe is required.",
  }),
  listingStatuses: z.array(z.string()).optional(),
  minDaysOnMarket: z.preprocess((val) => Number(val), z.number().min(0).optional()),
  priceReductionHistory: z.boolean().default(false).optional(), // Added missing comma
  buyerDataSources: z.array(z.string()).optional(), // New field for buyer data sources
  favoriteScore: z.preprocess((val) => Number(val), z.number().min(0).optional()), // New field for favorite score weight
  inquiryScore: z.preprocess((val) => Number(val), z.number().min(0).optional()), // New field for inquiry score weight
  returnVisitScore: z.preprocess((val) => Number(val), z.number().min(0).optional()), // New field for return visit score weight
  mortgageCalculatorScore: z.preprocess((val) => Number(val), z.number().min(0).optional()), // New field for mortgage calculator score weight
  recencyPriority: z.preprocess((val) => Number(val), z.number().min(0).optional()), // New field for recency priority
  prequalificationStatuses: z.array(z.string()).optional(), // New field for prequalification statuses

  fsboDataSources: z.array(z.string()).optional(), // New field for FSBO data sources
  minDaysOnMarketFSBO: z.preprocess((val) => Number(val), z.number().min(0).optional()), // New field for min days on market for FSBO
  fsboPriceReductions: z.boolean().default(false).optional(), // New field for FSBO price reductions

  minDaysOnMarketMLS: z.preprocess((val) => Number(val), z.number().min(0).optional()), // New field for min days on market for MLS (Investor)
  minPriceDropPercentage: z.preprocess((val) => Number(val), z.number().min(0).optional()), // New field for min price drop percentage (Investor)
  ownerTypes: z.array(z.string()).optional(), // New field for owner types (Investor)
  propertyStatuses: z.array(z.string()).optional(), // New field for property statuses (Investor)
  zoningPotential: z.string().optional(), // New field for zoning/potential (Investor)

  minYearsSinceLastSale: z.preprocess((val) => Number(val), z.number().min(0).optional()), // New field for min years since last sale (Turnover)
  absenteeOwnership: z.boolean().default(false).optional(), // New field for absentee ownership (Turnover)
  ownerAgeRange: z.object({ min: z.preprocess((val) => Number(val), z.number().min(0).optional()), max: z.preprocess((val) => Number(val), z.number().min(0).optional()) }).optional(), // New field for owner age range (Turnover)

  // Add more parameters later
});

type LeadSearchFormValues = z.infer<typeof leadSearchFormSchema>;

const defaultValues: LeadSearchFormValues = {
  geographicArea: "",
  timeframe: "",
  listingStatuses: [],
  minDaysOnMarket: undefined,
  priceReductionHistory: false,
  buyerDataSources: [], // Default value for new field
  favoriteScore: undefined, // Default value for new field
  inquiryScore: undefined, // Default value for new field
  returnVisitScore: undefined, // Default value for new field
  mortgageCalculatorScore: undefined, // Default value for new field
  recencyPriority: undefined, // Default value for new field
  fsboDataSources: [], // Default value for new field
  minDaysOnMarketFSBO: undefined, // Default value for new field
  fsboPriceReductions: false, // Default value for new field
  minDaysOnMarketMLS: undefined, // Default value for new field
  minPriceDropPercentage: undefined, // Default value for new field
  ownerTypes: [], // Default value for new field
  propertyStatuses: [], // Default value for new field
  zoningPotential: undefined, // Default value for new field
  minYearsSinceLastSale: undefined, // Default value for new field
  absenteeOwnership: false, // Default value for new field
  ownerAgeRange: { min: undefined, max: undefined }, // Default value for new field
};

export default function LeadSearchPage() {
  const { toast } = useToast();

  const form = useForm<LeadSearchFormValues>({
    resolver: zodResolver(leadSearchFormSchema),
    defaultValues,
    mode: "onChange",
  });

  function onSubmit(data: LeadSearchFormValues) {
    // Handle form submission - will implement lead search logic later
    console.log("Search Parameters:", data);
    toast({
      title: "Search initiated",
      description: "Processing your search parameters...",
    });
  }

  return (
    <div className="container flex flex-col gap-4">
      <PageHeader
        title="Lead Search Parameters"
        description="Define criteria to find potential leads."
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="geographicArea"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Geographic Area</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 90210, Los Angeles, CA" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="timeframe"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timeframe</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a timeframe" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="6-12-months">Past 6-12 Months</SelectItem>
                    <SelectItem value="90-days">Past 90 Days</SelectItem>
                    <SelectItem value="30-days">Past 30 Days</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem> {/* Add custom range logic later */}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Accordion type="multiple" className="w-full">
            <AccordionItem value="expired-withdrawn">
              <AccordionTrigger>Expired & Withdrawn Listings Scanner</AccordionTrigger>
              <AccordionContent className="space-y-4 p-4 border rounded-md mt-2">
                <FormField
                  control={form.control}
                  name="listingStatuses"
                  render={() => (
                    <FormItem>
                      <FormLabel>Listing Statuses</FormLabel>
                      <div className="flex items-center space-x-4">
                        {['Expired', 'Withdrawn', 'Canceled'].map((status) => (
                          <FormField
                            key={status}
                            control={form.control}
                            name="listingStatuses"
                            render={({ field }) => {
                              return (
                                <FormItem key={status} className="flex flex-row items-start space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(status)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), status])
                                          : field.onChange(field.value?.filter((value) => value !== status));
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">{status}</FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="minDaysOnMarket"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Days on Market (before expiration)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 90" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="high-intent-buyer">
              <AccordionTrigger>High-Intent Buyer Detection</AccordionTrigger>
              <AccordionContent className="space-y-4 p-4 border rounded-md mt-2">
                <FormField
                  control={form.control}
                  name="buyerDataSources"
                  render={() => (
                    <FormItem>
                      <FormLabel>Buyer Data Sources</FormLabel>
                      <div className="flex items-center space-x-4">
                        {['CRM', 'Realtor.com'].map((source) => ( // Example sources
                          <FormField
                            key={source}
                            control={form.control}
                            name="buyerDataSources"
                            render={({ field }) => {
                              return (
                                <FormItem key={source} className="flex flex-row items-start space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(source)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), source])
                                          : field.onChange(field.value?.filter((value) => value !== source));
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">{source}</FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="favoriteScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Score per Favorite</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 1" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="inquiryScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Score per Inquiry</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 3" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="returnVisitScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Score per Return Visit</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 2" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                 </div> {/* Added closing div tag */}
                 <FormField
                    control={form.control}
                    name="recencyPriority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recency Priority (Higher = More Recent)</FormLabel>
                        {/* This could be a slider component, using input[type=number] for simplicity for now */}
                        <FormControl>
                          <Input type="number" placeholder="e.g., 10" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                  control={form.control}
                  name="prequalificationStatuses"
                  render={() => (
                    <FormItem>
                      <FormLabel>Prequalification Statuses</FormLabel>
                      <div className="flex items-center space-x-4">
                        {['Not Started', 'In Progress', 'Prequalified'].map((status) => ( // Example statuses
                          <FormField
                            key={status}
                            control={form.control}
                            name="prequalificationStatuses"
                            render={({ field }) => {
                              return (
                                <FormItem key={status} className="flex flex-row items-start space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(status)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), status])
                                          : field.onChange(field.value?.filter((value) => value !== status));
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">{status}</FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="fsbo-opportunity-finder">
              <AccordionTrigger>FSBO Opportunity Finder</AccordionTrigger>
              <AccordionContent className="space-y-4 p-4 border rounded-md mt-2">
                <FormField
                  control={form.control}
                  name="fsboDataSources"
                  render={() => (
                    <FormItem>
                      <FormLabel>FSBO Data Sources</FormLabel>
                      <div className="flex items-center space-x-4">
                    {['Realtor.com', 'Zillow', 'RedX'].map((source) => ( // Example sources including RedX
                          <FormField
                            key={source}
                            control={form.control}
                            name="fsboDataSources"
                            render={({ field }) => {
                              return (
                                <FormItem key={source} className="flex flex-row items-start space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(source)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), source])
                                          : field.onChange(field.value?.filter((value) => value !== source));
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">{source}</FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="minDaysOnMarketFSBO"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Days on Market (FSBO)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 30" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="fsboPriceReductions"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                         Include FSBO listings with price reductions
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="property-investor">
              <AccordionTrigger>Property Investor Algorithm</AccordionTrigger>
              <AccordionContent className="space-y-4 p-4 border rounded-md mt-2">
                 <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minDaysOnMarketMLS"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Days on Market (MLS)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 90" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="minPriceDropPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Price Drop Percentage</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 5" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                 </div>
                <FormField
                  control={form.control}
                  name="ownerTypes"
                  render={() => (
                    <FormItem>
                      <FormLabel>Investor Owner Types</FormLabel>
                      <div className="flex items-center space-x-4">
                        {['Absentee', 'Owner-Occupied'].map((type) => ( // Example owner types
                          <FormField
                            key={type}
                            control={form.control}
                            name="ownerTypes"
                            render={({ field }) => {
                              return (
                                <FormItem key={type} className="flex flex-row items-start space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(type)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), type])
                                          : field.onChange(field.value?.filter((value) => value !== type));
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">{type}</FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="propertyStatuses"
                  render={() => (
                    <FormItem>
                      <FormLabel>Property Statuses</FormLabel>
                      <div className="flex items-center space-x-4">
                        {['Vacant'].map((status) => ( // Example statuses
                          <FormField
                            key={status}
                            control={form.control}
                            name="propertyStatuses"
                            render={({ field }) => {
                              return (
                                <FormItem key={status} className="flex flex-row items-start space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(status)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), status])
                                          : field.onChange(field.value?.filter((value) => value !== status));
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">{status}</FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="zoningPotential"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zoning or ADU Potential</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., R-2, ADU Potential" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="local-turnover-prediction">
              <AccordionTrigger>Local Turnover Prediction (Geo-farming)</AccordionTrigger>
              <AccordionContent className="space-y-4 p-4 border rounded-md mt-2">
                <FormField
                  control={form.control}
                  name="minYearsSinceLastSale"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Years Since Last Sale</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 7" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 {/* Absentee Ownership, Owner Age Range, and Nearby Development fields */}
                 {/* Absentee Ownership: Checkbox or Switch */}
                 {/* Owner Age Range: Two number inputs for min/max or a slider */}
                 {/* Nearby Development: Checkbox or Switch - might require additional data sources/complexity */}

              </AccordionContent>
            </AccordionItem>

          </Accordion>

          <Button type="submit">Search for Leads</Button>
        </form>
      </Form>
    </div>
  );
}