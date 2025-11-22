'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import dynamic from 'next/dynamic';
// // Firebase Functions imports removed - not needed in frontend
// Removed - not needed in frontend
interface ChartData {
  name: string;
  total: number;
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Wrap the chart in a dynamic import to avoid SSR issues
const DynamicChart = dynamic(() => Promise.resolve(ChartComponent), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[350px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Cargando gráfico...</p>
      </div>
    </div>
  )
});

function ChartComponent({ data }: { data: ChartData[] }) {
  const hasData = data.some(item => item.total > 0);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-[350px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Sin datos disponibles</h3>
          <p className="text-sm text-muted-foreground">
            Los datos aparecerán aquí cuando haya pedidos completados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function OverviewChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        // Fetch real order data from Firebase
        const ordersQuery = query(collection(db, 'orders'));
        const ordersSnapshot = await getDocs(ordersQuery);
        
        // Group orders by month
        const monthlyData: { [key: string]: number } = {};
        
        ordersSnapshot.forEach((doc) => {
          const order = doc.data();
          if (order.createdAt) {
            const date = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
            const month = monthNames[date.getMonth()];
            monthlyData[month] = (monthlyData[month] || 0) + 1;
          }
        });

        // Convert to chart format
        const chartData = monthNames.map(month => ({
          name: month,
          total: monthlyData[month] || 0
        }));

        setData(chartData);
      } catch (error) {
        console.error('Error fetching order data:', error);
        // Show empty data on error
        setData(monthNames.map(month => ({ name: month, total: 0 })));
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[350px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return <DynamicChart data={data} />;
}
