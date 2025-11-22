'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'; // Asegúrate de que la ruta sea correcta
import { TrendingUp, TrendingDown } from 'lucide-react';

// 1. Define la configuración de tu gráfico.
const chartConfig = {
  ingresos: {
    label: 'Ingresos',
    color: 'hsl(var(--chart-1))', // Usa los colores de tu globals.css
    icon: TrendingUp,
  },
  gastos: {
    label: 'Gastos',
    color: 'hsl(var(--chart-2))',
    icon: TrendingDown,
  },
} satisfies ChartConfig;

// 2. Prepara los datos que quieres mostrar.
const chartData = [
  { month: 'Enero', ingresos: 1860, gastos: 800 },
  { month: 'Febrero', ingresos: 3050, gastos: 1200 },
  { month: 'Marzo', ingresos: 2370, gastos: 950 },
  { month: 'Abril', ingresos: 730, gastos: 1100 },
  { month: 'Mayo', ingresos: 2090, gastos: 1300 },
  { month: 'Junio', ingresos: 2140, gastos: 1400 },
];

export function VentasMensualesChart() {
  return (
    <div className="w-full max-w-2xl rounded-lg border bg-card p-6 shadow-lg">
      <h3 className="text-lg font-semibold">Resumen de Ventas Mensuales</h3>
      <p className="text-sm text-muted-foreground">Ingresos vs. Gastos</p>
      
      <div className="mt-4">
        {/* 3. Usa los componentes para construir el gráfico. */}
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <ChartLegend content={<ChartLegendContent payload={[]} />} />
            <Bar dataKey="ingresos" fill="var(--color-ingresos)" radius={4} />
            <Bar dataKey="gastos" fill="var(--color-gastos)" radius={4} />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}
