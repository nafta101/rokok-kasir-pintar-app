
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface ProductSalesData {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_profit: number;
}

const SalesAnalysis = () => {
  const [timeFilter, setTimeFilter] = useState('today');
  const [bestSellers, setBestSellers] = useState<ProductSalesData[]>([]);
  const [mostProfitable, setMostProfitable] = useState<ProductSalesData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalesAnalysis();
  }, [timeFilter]);

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;

    switch (timeFilter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'all':
      default:
        return null; // No filter for all time
    }

    return startDate;
  };

  const fetchSalesAnalysis = async () => {
    try {
      setLoading(true);
      const startDate = getDateRange();
      
      let query = supabase
        .from('sales')
        .select(`
          product_id,
          quantity_sold,
          total_profit,
          products!inner(product_name)
        `);

      if (startDate) {
        query = query.gte('sale_timestamp', startDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Process data for analysis
      const productMap = new Map<string, ProductSalesData>();

      data?.forEach(sale => {
        const productId = sale.product_id;
        const productName = (sale.products as any).product_name;
        
        if (productMap.has(productId)) {
          const existing = productMap.get(productId)!;
          existing.total_quantity += sale.quantity_sold;
          existing.total_profit += Number(sale.total_profit);
        } else {
          productMap.set(productId, {
            product_id: productId,
            product_name: productName,
            total_quantity: sale.quantity_sold,
            total_profit: Number(sale.total_profit)
          });
        }
      });

      const productData = Array.from(productMap.values());

      // Sort by quantity for best sellers
      const sortedByQuantity = [...productData].sort((a, b) => b.total_quantity - a.total_quantity);
      setBestSellers(sortedByQuantity);

      // Sort by profit for most profitable
      const sortedByProfit = [...productData].sort((a, b) => b.total_profit - a.total_profit);
      setMostProfitable(sortedByProfit);

    } catch (error) {
      console.error('Error fetching sales analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case 'today':
        return 'Hari Ini';
      case '7days':
        return '7 Hari Terakhir';
      case 'month':
        return 'Bulan Ini';
      case 'all':
        return 'Semua Waktu';
      default:
        return 'Semua Waktu';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Analisis Penjualan Produk</h1>
          <p className="text-gray-600">Analisis performa produk berdasarkan penjualan dan profitabilitas</p>
        </div>

        {/* Time Filter */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <label htmlFor="timeFilter" className="text-sm font-medium text-gray-700">
              Pilih Periode Waktu:
            </label>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Pilih periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hari Ini</SelectItem>
                <SelectItem value="7days">7 Hari Terakhir</SelectItem>
                <SelectItem value="month">Bulan Ini</SelectItem>
                <SelectItem value="all">Semua Waktu</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Analysis Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Best Sellers Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Produk Paling Laris (Berdasarkan Unit Terjual)
              </CardTitle>
              <p className="text-sm text-gray-600">Periode: {getTimeFilterLabel()}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bestSellers.length > 0 ? (
                  bestSellers.map((product, index) => (
                    <div key={product.product_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{product.product_name}</h3>
                          <p className="text-sm text-gray-600">Total Unit Terjual: {product.total_quantity}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Tidak ada data penjualan untuk periode ini
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Most Profitable Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Produk Paling Menguntungkan (Berdasarkan Total Profit)
              </CardTitle>
              <p className="text-sm text-gray-600">Periode: {getTimeFilterLabel()}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mostProfitable.length > 0 ? (
                  mostProfitable.map((product, index) => (
                    <div key={product.product_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{product.product_name}</h3>
                          <p className="text-sm text-gray-600">Total Keuntungan Dihasilkan: {formatCurrency(product.total_profit)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Tidak ada data penjualan untuk periode ini
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SalesAnalysis;
