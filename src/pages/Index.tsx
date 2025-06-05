
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, AlertTriangle } from "lucide-react";
import { SalesModal } from "@/components/SalesModal";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  product_name: string;
  purchase_price: number;
  selling_price: number;
  initial_stock: number;
  current_stock: number;
}

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [todayProfit, setTodayProfit] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    fetchTodayProfit();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('product_name');

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
        .from('sales')
        .select('total_profit')
        .gte('sale_timestamp', startOfDay.toISOString())
        .lt('sale_timestamp', endOfDay.toISOString());

      if (error) throw error;

      const profit = data?.reduce((sum, sale) => sum + Number(sale.total_profit), 0) || 0;
      setTodayProfit(profit);
    } catch (error) {
      console.error('Error fetching today profit:', error);
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
    fetchProducts();
    fetchTodayProfit();
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

        {/* Profit Card */}
        <Card className="mb-8 bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Total Keuntungan Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(todayProfit)}</div>
          </CardContent>
        </Card>

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
                    <h3 className="font-semibold text-lg mb-2">{product.product_name}</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Harga Jual:</span>
                        <span className="font-medium">{formatCurrency(product.selling_price)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Stok:</span>
                        <span className={`font-medium flex items-center gap-1 ${
                          product.current_stock < 10 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {product.current_stock < 10 && <AlertTriangle className="h-4 w-4" />}
                          {product.current_stock}
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
