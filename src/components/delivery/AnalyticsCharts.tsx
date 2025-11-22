'use client';

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Lazy load heavy chart components
const LazyBarChart = lazy(() => import('recharts').then(module => ({ default: module.BarChart })));
const LazyLineChart = lazy(() => import('recharts').then(module => ({ default: module.LineChart })));
const LazyPieChart = lazy(() => import('recharts').then(module => ({ default: module.PieChart })));

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6366F1', '#8B5CF6'];

interface AnalyticsChartsProps {
  dailyData: any[];
  statusData: any[];
  revenueData: any[];
}

export default function AnalyticsCharts({ dailyData, statusData, revenueData }: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Daily Orders Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos Diarios</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-64 flex items-center justify-center">Cargando gráfico...</div>}>
            <ResponsiveContainer width="100%" height={300}>
              <LazyBarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" fill="#10B981" />
              </LazyBarChart>
            </ResponsiveContainer>
          </Suspense>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución por Estado</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-64 flex items-center justify-center">Cargando gráfico...</div>}>
            <ResponsiveContainer width="100%" height={300}>
              <LazyPieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </LazyPieChart>
            </ResponsiveContainer>
          </Suspense>
        </CardContent>
      </Card>

      {/* Revenue Trend */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Tendencia de Ingresos</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-64 flex items-center justify-center">Cargando gráfico...</div>}>
            <ResponsiveContainer width="100%" height={300}>
              <LazyLineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} />
              </LazyLineChart>
            </ResponsiveContainer>
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
