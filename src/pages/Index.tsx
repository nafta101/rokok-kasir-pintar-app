import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, AlertTriangle } from "lucide-react";
import { SalesModal } from "@/components/SalesModal";

interface Product {
  productID: string;
  productName: string;
  purchasePrice: number;
  sellingPrice: number;
  initialStock: number;
  currentStock: number;
}

interface Sale {
  saleID: string;
  productID_ref: string;
  quantitySold: number;
  saleTimestamp: string;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
}

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [todayProfit, setTodayProfit] = useState(0);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedProducts = localStorage.getItem('products');
    const savedSales = localStorage.getItem('sales');
    
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    } else {
      // Initialize with sample data
      const sampleProducts: Product[] = [
        {
          productID: "GGM01",
          productName: "Gudang Garam Merah 12",
          purchasePrice: 18000,
          sellingPrice: 20000,
          initialStock: 50,
          currentStock: 50
        },
        {
          productID: "KRT01", 
          productName: "Kretek 234 16",
          purchasePrice: 22000,
          sellingPrice: 25000,
          initialStock: 30,
          currentStock: 30
        },
        {
          productID: "SMW01",
          productName: "Sampoerna Mild 16", 
          purchasePrice: 25000,
          sellingPrice: 28000,
          initialStock: 40,
          currentStock: 40
        }
      ];
      setProducts(sampleProducts);
      localStorage.setItem('products', JSON.stringify(sampleProducts));
    }
    
    if (savedSales) {
      setSales(JSON.parse(savedSales));
    }
  }, []);

  // Calculate today's profit
  useEffect(() => {
    const today = new Date().toDateString();
    const todaySales = sales.filter(sale => 
      new Date(sale.saleTimestamp).toDateString() === today
    );
    const profit = todaySales.reduce((sum, sale) => sum + sale.totalProfit, 0);
    setTodayProfit(profit);
  }, [sales]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleSaleComplete = (updatedProducts: Product[], newSale: Sale) => {
    setProducts(updatedProducts);
    setSales(prev => [...prev, newSale]);
    localStorage.setItem('products', JSON.stringify(updatedProducts));
    localStorage.setItem('sales', JSON.stringify([...sales, newSale]));
    setIsModalOpen(false);
  };

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
                <Card key={product.productID} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{product.productName}</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Harga Jual:</span>
                        <span className="font-medium">{formatCurrency(product.sellingPrice)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Stok:</span>
                        <span className={`font-medium flex items-center gap-1 ${
                          product.currentStock < 10 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {product.currentStock < 10 && <AlertTriangle className="h-4 w-4" />}
                          {product.currentStock}
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
        products={products}
        onSaleComplete={handleSaleComplete}
      />
    </div>
  );
};

export default Index;
