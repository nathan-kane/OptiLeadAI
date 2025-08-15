"use client";

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, Pie, PieChart, Cell } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockAnalyticsData } from '@/data/mock-data';
import type { AnalyticsData } from '@/types';
import { TrendingUp } from 'lucide-react';



const chartConfigQualified = {
  qualified: { label: "Qualified", color: "hsl(var(--chart-1))" },
  unqualified: { label: "Unqualified", color: "hsl(var(--chart-2))" },
};

const chartConfigConversion = {
  New: { label: "New Leads", color: "hsl(var(--chart-1))" },
  Contacted: { label: "Contacted", color: "hsl(var(--chart-2))" },
  Qualified: { label: "Qualified", color: "hsl(var(--chart-3))" },
  Converted: { label: "Converted", color: "hsl(var(--chart-4))" },
};

const PIE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];


type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export default function AnalyticsPage() {
  const analyticsData: AnalyticsData = mockAnalyticsData;
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('weekly');

  // Transform data based on selected period
  const getChartData = () => {
    const data = analyticsData.leadsByPriority[selectedPeriod];
    return data.map(item => {
      let periodLabel: string;
      if (selectedPeriod === 'daily') {
        periodLabel = (item as { date: string }).date;
      } else if (selectedPeriod === 'weekly') {
        periodLabel = (item as { week: string }).week;
      } else if (selectedPeriod === 'monthly') {
        periodLabel = (item as { month: string }).month;
      } else {
        periodLabel = (item as { year: string }).year;
      }
      
      return {
        period: periodLabel,
        High: item.high,
        Medium: item.medium,
        Low: item.low
      };
    });
  };

  // Transform conversion funnel data based on selected period
  const getConversionChartData = () => {
    const data = analyticsData.conversionRate[selectedPeriod];
    return data.map(item => {
      let periodLabel: string;
      if (selectedPeriod === 'daily') {
        periodLabel = (item as { date: string }).date;
      } else if (selectedPeriod === 'weekly') {
        periodLabel = (item as { week: string }).week;
      } else if (selectedPeriod === 'monthly') {
        periodLabel = (item as { month: string }).month;
      } else {
        periodLabel = (item as { year: string }).year;
      }
      
      return {
        period: periodLabel,
        New: item.new,
        Contacted: item.contacted,
        Qualified: item.qualified,
        Converted: item.converted
      };
    });
  };

  const chartData = getChartData();
  const conversionChartData = getConversionChartData();

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="Conversion Analytics"
          description="Track your lead generation performance and campaign effectiveness."
        />
        <Select value={selectedPeriod} onValueChange={(value: TimePeriod) => setSelectedPeriod(value)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="lg:col-span-2 xl:col-span-3">
          <CardHeader>
            <CardTitle>Leads by Priority</CardTitle>
            <CardDescription>Distribution of leads across High, Medium, and Low priority categories over time.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              High: { label: "High Priority", color: "hsl(var(--chart-1))" },
              Medium: { label: "Medium Priority", color: "hsl(var(--chart-2))" },
              Low: { label: "Low Priority", color: "hsl(var(--chart-3))" },
            }} className="h-[300px] w-full">
              <BarChart data={chartData} margin={{ left: 12, right: 12, top: 5, bottom: 5 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="High" fill="var(--color-High)" radius={4} />
                <Bar dataKey="Medium" fill="var(--color-Medium)" radius={4} />
                <Bar dataKey="Low" fill="var(--color-Low)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>



        <Card className="lg:col-span-2 xl:col-span-3">
          <CardHeader>
            <CardTitle>Lead Conversion Funnel</CardTitle>
            <CardDescription>Number of leads at each stage of the funnel over time.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfigConversion} className="h-[300px] w-full">
              <BarChart data={conversionChartData} margin={{ left: 12, right: 12, top: 5, bottom: 5 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="New" fill="var(--color-New)" radius={4} />
                <Bar dataKey="Contacted" fill="var(--color-Contacted)" radius={4} />
                <Bar dataKey="Qualified" fill="var(--color-Qualified)" radius={4} />
                <Bar dataKey="Converted" fill="var(--color-Converted)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

      </div>
    </>
  );
}
