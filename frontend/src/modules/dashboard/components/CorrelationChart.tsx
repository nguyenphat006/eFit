'use client';

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { CorrelationData } from "../types/mock-api";

const chartConfig = {
  weight: {
    label: "Cân nặng (kg)",
    color: "hsl(var(--chart-1))",
  },
  caloriesIn: {
    label: "Calo thực tế (kcal)",
    color: "hsl(var(--chart-2))",
  },
  targetCalories: {
    label: "Calo mục tiêu (kcal)",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

interface CorrelationChartProps {
  data: CorrelationData[];
}

export default function CorrelationChart({ data }: CorrelationChartProps) {
  return (
    <Card className="flex flex-col border-border shadow-sm h-full bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="text-lg font-display font-black">Tương quan Thể chất & Dinh dưỡng</CardTitle>
        <CardDescription className="text-xs font-medium">Theo dõi biến động cân nặng và calo nạp vào</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <LineChart
            data={data}
            margin={{
              top: 20,
              left: 0,
              right: 10,
              bottom: 0,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.1} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.replace("Ngày ", "")}
              className="text-[10px] font-bold"
            />
            {/* Y Axis Left: Weight */}
            <YAxis 
              yAxisId="left"
              orientation="left"
              domain={['dataMin - 1', 'dataMax + 1']}
              hide
            />
            {/* Y Axis Right: Calories */}
            <YAxis 
              yAxisId="right"
              orientation="right"
              domain={[0, 'dataMax + 500']}
              hide
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Line
              yAxisId="left"
              dataKey="weight"
              type="monotone"
              stroke="var(--color-weight)"
              strokeWidth={3}
              dot={{ r: 4, fill: "var(--color-weight)", strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="right"
              dataKey="caloriesIn"
              type="stepAfter"
              stroke="var(--color-caloriesIn)"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              opacity={0.6}
            />
            <Line
              yAxisId="right"
              dataKey="targetCalories"
              type="monotone"
              stroke="var(--color-targetCalories)"
              strokeWidth={2}
              dot={false}
              opacity={0.3}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
