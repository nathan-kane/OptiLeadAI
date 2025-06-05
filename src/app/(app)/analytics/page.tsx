"use client";

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, Pie, PieChart, Cell } from "recharts";
import { mockAnalyticsData } from '@/data/mock-data';
import type { AnalyticsData } from '@/types';
import { TrendingUp } from 'lucide-react';

const chartConfigLeadsGenerated = {
  leads: {
    label: "Leads Generated",
    color: "hsl(var(--chart-1))",
  },
};

const chartConfigQualified = {
  qualified: { label: "Qualified", color: "hsl(var(--chart-1))" },
  unqualified: { label: "Unqualified", color: "hsl(var(--chart-2))" },
};

const chartConfigConversion = {
  new: { label: "New", color: "hsl(var(--chart-1))" },
  contacted: { label: "Contacted", color: "hsl(var(--chart-2))" },
  qualified: { label: "Qualified", color: "hsl(var(--chart-3))" },
  converted: { label: "Converted", color: "hsl(var(--chart-4))" },
};

const PIE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];


export default function AnalyticsPage() {
  const analyticsData: AnalyticsData = mockAnalyticsData;

  return (
    <>
      <PageHeader
        title="Conversion Analytics"
        description="Track your lead generation performance and campaign effectiveness."
      />
      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Leads Generated Over Time</CardTitle>
            <CardDescription>Daily count of new leads acquired in the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfigLeadsGenerated} className="h-[300px] w-full">
              <LineChart data={analyticsData.leadsGenerated} margin={{ left: 12, right: 12, top: 5, bottom: 5 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line dataKey="count" type="monotone" stroke="var(--color-leads)" strokeWidth={2} dot={true} name="Leads" />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Qualification Ratio</CardTitle>
            <CardDescription>Proportion of qualified vs. unqualified leads.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
             <ChartContainer config={chartConfigQualified} className="h-[300px] w-full max-w-[300px]">
                <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                    <Pie 
                        data={[
                            { name: 'Qualified', value: analyticsData.leadsQualified.qualified, fill: PIE_COLORS[0] },
                            { name: 'Unqualified', value: analyticsData.leadsQualified.unqualified, fill: PIE_COLORS[1] }
                        ]} 
                        dataKey="value" 
                        nameKey="name" 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={100}
                        labelLine={false}
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
                            const RADIAN = Math.PI / 180;
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                            return (
                            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12px">
                                {`${name} (${(percent * 100).toFixed(0)}%)`}
                            </text>
                            );
                        }}
                    >
                         { [analyticsData.leadsQualified.qualified, analyticsData.leadsQualified.unqualified].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                         ))}
                    </Pie>
                     <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 xl:col-span-3">
          <CardHeader>
            <CardTitle>Lead Conversion Funnel</CardTitle>
            <CardDescription>Number of leads at each stage of the funnel.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfigConversion} className="h-[300px] w-full">
              <BarChart data={analyticsData.conversionRate} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis dataKey="stage" type="category" tickLine={false} axisLine={false} width={80} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="count" fill="var(--color-new)" radius={4} name="Leads" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2 xl:col-span-3">
          <CardHeader>
            <CardTitle>Email Campaign Performance</CardTitle>
            <CardDescription>Open rates and click-through rates for active campaigns.</CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={{
                openRate: { label: "Open Rate (%)", color: "hsl(var(--chart-1))" },
                ctr: { label: "CTR (%)", color: "hsl(var(--chart-2))" },
            }} className="h-[300px] w-full">
              <BarChart data={analyticsData.emailCampaignPerformance}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="campaignName" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="openRate" fill="var(--color-openRate)" radius={4} />
                <Bar dataKey="ctr" fill="var(--color-ctr)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

      </div>
    </>
  );
}
