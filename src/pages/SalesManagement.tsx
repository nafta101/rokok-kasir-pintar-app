
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  product_name: string;
  purchase_price: number;
  selling_price: number;
  current_stock: number;
}

interface Sale {
  id: string;
  product_id: string;
  quantity_sold: number;
  sale_timestamp: string;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  payment_status: string;
  customer_id?: string;
  products?: {
    product_name: string;
  };
  customers?: {
    customer_name: string;
  };
}

const SalesManagement = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [formData, setFormData] = useState({
    product_id: '',
    quantity_sold: ''
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, []);

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          products!inner(product_name),
          customers(customer_name)
        `)
        .order('sale_timestamp', { ascending: false });

      if (error) throw error;
      
      // Type assertion to ensure proper typing
      setSales((data || []) as Sale[]);
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast({
        title: "Error",
        description: "Gagal mengambil data penjualan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedProduct = products.find(p => p.id === formData.product_id);
    if (!selectedProduct) {
      toast({
        title: "Error",
        description: "Produk tidak ditemukan!",
        variant: "destructive"
      });
      return;
    }

    const quantity = parseInt(formData.quantity_sold);
    
    if (editingSale) {
      try {
        const oldQuantity = editingSale.quantity_sold;
        const quantityDiff = quantity - oldQuantity;
        
        // Check if there's enough stock for the difference
        if (quantityDiff > selectedProduct.current_stock) {
          toast({
            title: "Error",
            description: `Stok tidak mencukupi! Stok tersisa: ${selectedProduct.current_stock}`,
            variant: "destructive"
          });
          return;
        }

        const totalRevenue = selectedProduct.selling_price * quantity;
        const totalCost = selectedProduct.purchase_price * quantity;
        const totalProfit = totalRevenue - totalCost;

        // Update sale record
        const { error: saleError } = await supabase
          .from('sales')
          .update({
            product_id: formData.product_id,
            quantity_sold: quantity,
            total_revenue: totalRevenue,
            total_cost: totalCost,
            total_profit: totalProfit
          })
          .eq('id', editingSale.id);

        if (saleError) throw saleError;

        // Update product stock
        const newStock = selectedProduct.current_stock - quantityDiff;
        const { error: stockError } = await supabase
          .from('products')
          .update({ current_stock: newStock })
          .eq('id', selectedProduct.id);

        if (stockError) throw stockError;

        toast({
          title: "Transaksi berhasil diperbarui",
          description: `Penjualan ${selectedProduct.product_name} telah diperbarui.`
        });

        // Refresh sales data - CRITICAL FIX for Bug 2
        await fetchSales();
        await fetchProducts();

        resetForm();
        setIsDialogOpen(false);
      } catch (error) {
        console.error('Error updating sale:', error);
        toast({
          title: "Error",
          description: "Gagal memperbarui transaksi",
          variant: "destructive"
        });
      }
    }
  };

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    setFormData({
      product_id: sale.product_id,
      quantity_sold: sale.quantity_sold.toString()
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (saleId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      try {
        const saleToDelete = sales.find(s => s.id === saleId);
        if (!saleToDelete) return;

        // Delete sale record
        const { error: deleteError } = await supabase
          .from('sales')
          .delete()
          .eq('id', saleId);

        if (deleteError) throw deleteError;

        // Return stock to product - use proper Supabase syntax
        const { data: currentProduct, error: fetchError } = await supabase
          .from('products')
          .select('current_stock')
          .eq('id', saleToDelete.product_id)
          .single();

        if (fetchError) throw fetchError;

        const { error: stockError } = await supabase
          .from('products')
          .update({ 
            current_stock: currentProduct.current_stock + saleToDelete.quantity_sold
          })
          .eq('id', saleToDelete.product_id);

        if (stockError) throw stockError;

        toast({
          title: "Transaksi berhasil dihapus",
          description: "Transaksi telah dihapus dan stok dikembalikan."
        });

        // Refresh data - CRITICAL FIX for Bug 2
        await fetchSales();
        await fetchProducts();
      } catch (error) {
        console.error('Error deleting sale:', error);
        toast({
          title: "Error",
          description: "Gagal menghapus transaksi",
          variant: "destructive"
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      quantity_sold: ''
    });
    setEditingSale(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID');
  };

  const getProductName = (productId: string, productName?: string) => {
    if (productName) return productName;
    const product = products.find(p => p.id === productId);
    return product ? product.product_name : 'Produk tidak ditemukan';
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Manajemen Penjualan</h1>
          <p className="text-gray-600">Kelola dan edit catatan transaksi penjualan</p>
        </div>

        {/* Sales Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Transaksi Penjualan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Total Penjualan</TableHead>
                    <TableHead>Keuntungan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{formatDate(sale.sale_timestamp)}</TableCell>
                      <TableCell>{getProductName(sale.product_id, sale.products?.product_name)}</TableCell>
                      <TableCell>{sale.quantity_sold}</TableCell>
                      <TableCell>{formatCurrency(sale.total_revenue)}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {formatCurrency(sale.total_profit)}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-sm ${
                          sale.payment_status === 'Lunas' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {sale.payment_status}
                        </span>
                      </TableCell>
                      <TableCell>{sale.customers?.customer_name || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(sale)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(sale.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {sales.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Belum ada transaksi penjualan.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Sale Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Transaksi Penjualan</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="product_id">Produk</Label>
                <Select value={formData.product_id} onValueChange={(value) => setFormData({...formData, product_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih produk..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.product_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quantity_sold">Jumlah Terjual</Label>
                <Input
                  id="quantity_sold"
                  type="number"
                  value={formData.quantity_sold}
                  onChange={(e) => setFormData({...formData, quantity_sold: e.target.value})}
                  placeholder="Jumlah yang terjual"
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  Perbarui
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Batal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SalesManagement;
