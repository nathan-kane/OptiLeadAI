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
      <div className="flex items-center justify-between mb-8">
        <PageHeader
          title="Conversion Analytics"
          description="Track your lead generation performance and campaign effectiveness."
        />
        <Select value={selectedPeriod} onValueChange={(value: TimePeriod) => setSelectedPeriod(value)}>
          <SelectTrigger className="w-[140px] rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-colors">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-2 border-gray-200">
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-8 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="lg:col-span-2 xl:col-span-3 shadow-xl border-0 bg-white rounded-2xl overflow-hidden">
          <CardHeader className="px-6 py-6 bg-gradient-to-r from-blue-50 to-green-50 border-b border-gray-100">
            <CardTitle className="text-2xl font-extrabold text-slate-900">Leads by Priority</CardTitle>
            <CardDescription className="text-base text-slate-600">Distribution of leads across High, Medium, and Low priority categories over time.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <ChartContainer config={{
              High: { label: "High Priority", color: "#dc2626" },
              Medium: { label: "Medium Priority", color: "#2563eb" },
              Low: { label: "Low Priority", color: "#16a34a" },
            }} className="h-[350px] w-full">
              <BarChart data={chartData} margin={{ left: 12, right: 12, top: 5, bottom: 5 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} className="text-slate-600" />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} className="text-slate-600" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="High" fill="var(--color-High)" radius={6} />
                <Bar dataKey="Medium" fill="var(--color-Medium)" radius={6} />
                <Bar dataKey="Low" fill="var(--color-Low)" radius={6} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>



        <Card className="lg:col-span-2 xl:col-span-3 shadow-xl border-0 bg-white rounded-2xl overflow-hidden">
          <CardHeader className="px-6 py-6 bg-gradient-to-r from-blue-50 to-green-50 border-b border-gray-100">
            <CardTitle className="text-2xl font-extrabold text-slate-900">Lead Conversion Funnel</CardTitle>
            <CardDescription className="text-base text-slate-600">Number of leads at each stage of the funnel over time.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <ChartContainer config={{
              New: { label: "New Leads", color: "#64748b" },
              Contacted: { label: "Contacted", color: "#2563eb" },
              Qualified: { label: "Qualified", color: "#16a34a" },
              Converted: { label: "Converted", color: "#059669" },
            }} className="h-[350px] w-full">
              <BarChart data={conversionChartData} margin={{ left: 12, right: 12, top: 5, bottom: 5 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} className="text-slate-600" />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} className="text-slate-600" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="New" fill="var(--color-New)" radius={6} />
                <Bar dataKey="Contacted" fill="var(--color-Contacted)" radius={6} />
                <Bar dataKey="Qualified" fill="var(--color-Qualified)" radius={6} />
                <Bar dataKey="Converted" fill="var(--color-Converted)" radius={6} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

      </div>
    </>
  );
}
