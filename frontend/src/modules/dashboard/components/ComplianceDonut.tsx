'use client';

import { TrendingUp } from "lucide-react";
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { ComplianceStats } from "../types/mock-api";

const chartConfig = {
  score: {
    label: "Kỷ luật",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

interface ComplianceDonutProps {
  stats: ComplianceStats;
}

export default function ComplianceDonut({ stats }: ComplianceDonutProps) {
  const chartData = [
    { name: "compliance", score: stats.overallTodayScore, fill: "var(--color-score)" },
  ];

  return (
    <Card className="flex flex-col border-border shadow-sm bg-card text-card-foreground">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-lg font-display font-black">Điểm Kỷ luật</CardTitle>
        <CardDescription className="text-xs font-medium">Chỉ số tuân thủ mục tiêu hôm nay</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={90}
            endAngle={90 + (360 * stats.overallTodayScore / 100)}
            innerRadius={80}
            outerRadius={110}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[86, 74]}
            />
            <RadialBar dataKey="score" background cornerRadius={10} />
            <PolarRadiusAxis type="number" domain={[0, 100]} tick={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-4xl font-black font-display"
                        >
                          {stats.overallTodayScore.toLocaleString()}%
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-[10px] font-bold uppercase tracking-widest"
                        >
                          Kỷ luật
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm pt-0">
        <div className="flex items-center gap-2 font-bold text-foreground leading-none">
          {stats.todayWorkoutCompleted ? "Tập luyện: Hoàn thành" : "Chưa tập luyện"} <TrendingUp className="h-4 w-4 text-emerald-500" />
        </div>
        <div className="leading-none text-muted-foreground text-xs font-medium">
          Dinh dưỡng đạt {stats.todayNutritionScore}% mục tiêu macros
        </div>
      </CardFooter>
    </Card>
  );
}
