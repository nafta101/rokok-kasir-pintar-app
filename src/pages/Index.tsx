
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, AlertTriangle } from "lucide-react";
import { SalesModal } from "@/components/SalesModal";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  namaProduk: string;
  hargaBeli: number;
  hargaJual: number;
  stokSaatIni: number;
}

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [todayProfit, setTodayProfit] = useState(0);
  const [totalOutstandingDebt, setTotalOutstandingDebt] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    fetchTodayProfit();
    fetchTotalOutstandingDebt();
    setupRealtimeSubscriptions();
  }, []);

  const setupRealtimeSubscriptions = () => {
    // Subscribe to product updates for real-time stock changes
    const productsChannel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Produk'
        },
        (payload) => {
          console.log('Product updated:', payload);
          setProducts(prev => prev.map(product => 
            product.id === payload.new.id 
              ? { ...product, stokSaatIni: payload.new.stokSaatIni }
              : product
          ));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Produk'
        },
        (payload) => {
          console.log('New product added:', payload);
          setProducts(prev => [...prev, payload.new as Product]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'Produk'
        },
        (payload) => {
          console.log('Product deleted:', payload);
          setProducts(prev => prev.filter(product => product.id !== payload.old.id));
        }
      )
      .subscribe();

    // Subscribe to sales changes for real-time profit and debt updates
    const salesChannel = supabase
      .channel('sales-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Penjualan'
        },
        (payload) => {
          console.log('New sale recorded:', payload);
          fetchTodayProfit();
          fetchTotalOutstandingDebt();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Penjualan'
        },
        (payload) => {
          console.log('Sale updated:', payload);
          fetchTodayProfit();
          fetchTotalOutstandingDebt();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(salesChannel);
    };
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('Produk')
        .select('*')
        .order('namaProduk');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayProfit = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const { data, error } = await supabase
        .from('Penjualan')
        .select('totalKeuntungan')
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', endOfDay.toISOString());

      if (error) throw error;

      const profit = data?.reduce((sum, sale) => sum + Number(sale.totalKeuntungan), 0) || 0;
      setTodayProfit(profit);
    } catch (error) {
      console.error('Error fetching today profit:', error);
    }
  };

  const fetchTotalOutstandingDebt = async () => {
    try {
      const { data, error } = await supabase
        .from('Penjualan')
        .select('totalPendapatan')
        .eq('statusPembayaran', 'Hutang');

      if (error) throw error;

      const totalDebt = data?.reduce((sum, sale) => sum + Number(sale.totalPendapatan), 0) || 0;
      setTotalOutstandingDebt(totalDebt);
    } catch (error) {
      console.error('Error fetching total outstanding debt:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleSaleComplete = () => {
    // Real-time subscriptions will automatically update the data
    // No need to manually refresh
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Kasir</h1>
          <p className="text-gray-600">Selamat datang di sistem kasir dan manajemen stok</p>
        </div>

        {/* Financial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Today's Profit Card */}
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Total Keuntungan Hari Ini</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(todayProfit)}</div>
            </CardContent>
          </Card>

          {/* Outstanding Debt Card */}
          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Total Hutang Beredar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(totalOutstandingDebt)}</div>
            </CardContent>
          </Card>
        </div>

        {/* New Sale Button */}
        <div className="mb-6">
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg flex items-center gap-2"
            size="lg"
          >
            <Plus className="h-5 w-5" />
            Catat Penjualan Baru
          </Button>
        </div>

        {/* Products List */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Produk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Card key={product.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{product.namaProduk}</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Harga Jual:</span>
                        <span className="font-medium">{formatCurrency(product.hargaJual)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Stok:</span>
                        <span className={`font-medium flex items-center gap-1 ${
                          product.stokSaatIni < 10 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {product.stokSaatIni < 10 && <AlertTriangle className="h-4 w-4" />}
                          {product.stokSaatIni}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Modal */}
      <SalesModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaleComplete={handleSaleComplete}
      />
    </div>
  );
};

export default Index;
