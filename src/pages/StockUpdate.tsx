
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Minus, RotateCcw, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Product {
  productID: string;
  productName: string;
  purchasePrice: number;
  sellingPrice: number;
  initialStock: number;
  currentStock: number;
}

const StockUpdate = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [updateType, setUpdateType] = useState<'add' | 'subtract' | 'reset'>('add');
  const [quantity, setQuantity] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    }
  }, []);

  const saveProducts = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    localStorage.setItem('products', JSON.stringify(updatedProducts));
  };

  const handleStockUpdate = (product: Product, type: 'add' | 'subtract' | 'reset') => {
    setSelectedProduct(product);
    setUpdateType(type);
    setQuantity('');
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct) return;

    let newStock = selectedProduct.currentStock;
    const qty = parseInt(quantity);

    switch (updateType) {
      case 'add':
        newStock = selectedProduct.currentStock + qty;
        break;
      case 'subtract':
        newStock = Math.max(0, selectedProduct.currentStock - qty);
        break;
      case 'reset':
        newStock = qty;
        break;
    }

    const updatedProducts = products.map(p => 
      p.productID === selectedProduct.productID 
        ? { ...p, currentStock: newStock }
        : p
    );

    saveProducts(updatedProducts);

    let actionText = '';
    switch (updateType) {
      case 'add':
        actionText = `ditambah ${qty}`;
        break;
      case 'subtract':
        actionText = `dikurangi ${qty}`;
        break;
      case 'reset':
        actionText = `direset ke ${qty}`;
        break;
    }

    toast({
      title: "Stok berhasil diperbarui",
      description: `Stok ${selectedProduct.productName} ${actionText}.`
    });

    setIsDialogOpen(false);
    setSelectedProduct(null);
    setQuantity('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStockStatus = (currentStock: number) => {
    if (currentStock === 0) return { text: 'Habis', color: 'text-red-600', bg: 'bg-red-100' };
    if (currentStock < 10) return { text: 'Rendah', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { text: 'Normal', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const getDialogTitle = () => {
    switch (updateType) {
      case 'add':
        return 'Tambah Stok';
      case 'subtract':
        return 'Kurangi Stok';
      case 'reset':
        return 'Reset Stok';
      default:
        return 'Update Stok';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Update Stok Produk</h1>
          <p className="text-gray-600">Kelola dan perbarui stok produk</p>
        </div>

        {/* Stock Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Produk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Stok Rendah</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {products.filter(p => p.currentStock < 10 && p.currentStock > 0).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Stok Habis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {products.filter(p => p.currentStock === 0).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Produk & Stok</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead>Harga Jual</TableHead>
                    <TableHead>Stok Saat Ini</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const status = getStockStatus(product.currentStock);
                    return (
                      <TableRow key={product.productID}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.productName}</div>
                            <div className="text-sm text-gray-500">{product.productID}</div>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(product.sellingPrice)}</TableCell>
                        <TableCell className="font-medium">{product.currentStock}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                            {status.text === 'Rendah' && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {status.text}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStockUpdate(product, 'add')}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStockUpdate(product, 'subtract')}
                              className="text-orange-600 hover:text-orange-700"
                              disabled={product.currentStock === 0}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStockUpdate(product, 'reset')}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {products.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Belum ada produk. Tambahkan produk terlebih dahulu.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Update Stock Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{getDialogTitle()}</DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm space-y-1">
                    <div className="font-medium">{selectedProduct.productName}</div>
                    <div className="text-gray-600">Stok saat ini: {selectedProduct.currentStock}</div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="quantity">
                    {updateType === 'add' && 'Jumlah yang ditambah'}
                    {updateType === 'subtract' && 'Jumlah yang dikurangi'}
                    {updateType === 'reset' && 'Stok baru'}
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Masukkan jumlah..."
                    min="0"
                    max={updateType === 'subtract' ? selectedProduct.currentStock : undefined}
                    required
                  />
                </div>

                {quantity && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm">
                      <strong>Hasil:</strong> Stok akan menjadi{' '}
                      <span className="font-bold">
                        {updateType === 'add' && selectedProduct.currentStock + parseInt(quantity)}
                        {updateType === 'subtract' && Math.max(0, selectedProduct.currentStock - parseInt(quantity))}
                        {updateType === 'reset' && parseInt(quantity)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    Update Stok
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default StockUpdate;
