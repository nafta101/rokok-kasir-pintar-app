
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

const SalesManagement = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [formData, setFormData] = useState({
    productID_ref: '',
    quantitySold: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    const savedSales = localStorage.getItem('sales');
    const savedProducts = localStorage.getItem('products');
    
    if (savedSales) {
      setSales(JSON.parse(savedSales));
    }
    
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    }
  }, []);

  const saveSales = (updatedSales: Sale[]) => {
    setSales(updatedSales);
    localStorage.setItem('sales', JSON.stringify(updatedSales));
  };

  const saveProducts = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    localStorage.setItem('products', JSON.stringify(updatedProducts));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedProduct = products.find(p => p.productID === formData.productID_ref);
    if (!selectedProduct) {
      toast({
        title: "Error",
        description: "Produk tidak ditemukan!",
        variant: "destructive"
      });
      return;
    }

    const quantity = parseInt(formData.quantitySold);
    
    if (editingSale) {
      // Update existing sale
      const oldQuantity = editingSale.quantitySold;
      const quantityDiff = quantity - oldQuantity;
      
      // Check if there's enough stock for the difference
      if (quantityDiff > selectedProduct.currentStock) {
        toast({
          title: "Error",
          description: `Stok tidak mencukupi! Stok tersisa: ${selectedProduct.currentStock}`,
          variant: "destructive"
        });
        return;
      }

      const totalRevenue = selectedProduct.sellingPrice * quantity;
      const totalCost = selectedProduct.purchasePrice * quantity;
      const totalProfit = totalRevenue - totalCost;

      const updatedSale: Sale = {
        ...editingSale,
        productID_ref: formData.productID_ref,
        quantitySold: quantity,
        totalRevenue,
        totalCost,
        totalProfit
      };

      const updatedSales = sales.map(s => 
        s.saleID === editingSale.saleID ? updatedSale : s
      );
      saveSales(updatedSales);

      // Update product stock
      const updatedProducts = products.map(p => 
        p.productID === selectedProduct.productID 
          ? { ...p, currentStock: p.currentStock - quantityDiff }
          : p
      );
      saveProducts(updatedProducts);

      toast({
        title: "Transaksi berhasil diperbarui",
        description: `Penjualan ${selectedProduct.productName} telah diperbarui.`
      });
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    setFormData({
      productID_ref: sale.productID_ref,
      quantitySold: sale.quantitySold.toString()
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (saleID: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      const saleToDelete = sales.find(s => s.saleID === saleID);
      if (saleToDelete) {
        // Return stock to product
        const updatedProducts = products.map(p => 
          p.productID === saleToDelete.productID_ref 
            ? { ...p, currentStock: p.currentStock + saleToDelete.quantitySold }
            : p
        );
        saveProducts(updatedProducts);

        const updatedSales = sales.filter(s => s.saleID !== saleID);
        saveSales(updatedSales);

        toast({
          title: "Transaksi berhasil dihapus",
          description: "Transaksi telah dihapus dan stok dikembalikan."
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      productID_ref: '',
      quantitySold: ''
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

  const getProductName = (productID: string) => {
    const product = products.find(p => p.productID === productID);
    return product ? product.productName : 'Produk tidak ditemukan';
  };

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
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.saleID}>
                      <TableCell>{formatDate(sale.saleTimestamp)}</TableCell>
                      <TableCell>{getProductName(sale.productID_ref)}</TableCell>
                      <TableCell>{sale.quantitySold}</TableCell>
                      <TableCell>{formatCurrency(sale.totalRevenue)}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {formatCurrency(sale.totalProfit)}
                      </TableCell>
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
                            onClick={() => handleDelete(sale.saleID)}
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
                <Label htmlFor="productID_ref">Produk</Label>
                <Select value={formData.productID_ref} onValueChange={(value) => setFormData({...formData, productID_ref: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih produk..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.productID} value={product.productID}>
                        {product.productName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quantitySold">Jumlah Terjual</Label>
                <Input
                  id="quantitySold"
                  type="number"
                  value={formData.quantitySold}
                  onChange={(e) => setFormData({...formData, quantitySold: e.target.value})}
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
