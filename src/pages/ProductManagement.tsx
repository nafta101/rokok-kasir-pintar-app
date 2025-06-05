
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Product {
  productID: string;
  productName: string;
  purchasePrice: number;
  sellingPrice: number;
  initialStock: number;
  currentStock: number;
}

const ProductManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    productID: '',
    productName: '',
    purchasePrice: '',
    sellingPrice: '',
    initialStock: ''
  });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newProduct: Product = {
      productID: formData.productID,
      productName: formData.productName,
      purchasePrice: parseFloat(formData.purchasePrice),
      sellingPrice: parseFloat(formData.sellingPrice),
      initialStock: parseInt(formData.initialStock),
      currentStock: editingProduct ? editingProduct.currentStock : parseInt(formData.initialStock)
    };

    if (editingProduct) {
      // Update existing product
      const updatedProducts = products.map(p => 
        p.productID === editingProduct.productID ? newProduct : p
      );
      saveProducts(updatedProducts);
      toast({
        title: "Produk berhasil diperbarui",
        description: `${newProduct.productName} telah diperbarui.`
      });
    } else {
      // Add new product
      if (products.some(p => p.productID === newProduct.productID)) {
        toast({
          title: "Error",
          description: "ID Produk sudah ada!",
          variant: "destructive"
        });
        return;
      }
      saveProducts([...products, newProduct]);
      toast({
        title: "Produk berhasil ditambahkan",
        description: `${newProduct.productName} telah ditambahkan ke daftar produk.`
      });
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      productID: product.productID,
      productName: product.productName,
      purchasePrice: product.purchasePrice.toString(),
      sellingPrice: product.sellingPrice.toString(),
      initialStock: product.initialStock.toString()
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (productID: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      const updatedProducts = products.filter(p => p.productID !== productID);
      saveProducts(updatedProducts);
      toast({
        title: "Produk berhasil dihapus",
        description: "Produk telah dihapus dari daftar."
      });
    }
  };

  const resetForm = () => {
    setFormData({
      productID: '',
      productName: '',
      purchasePrice: '',
      sellingPrice: '',
      initialStock: ''
    });
    setEditingProduct(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Daftar Produk</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Product Button */}
        <div className="mb-6">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={resetForm}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Tambah Produk Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="productID">ID Produk</Label>
                  <Input
                    id="productID"
                    value={formData.productID}
                    onChange={(e) => setFormData({...formData, productID: e.target.value})}
                    placeholder="contoh: GGM01"
                    required
                    disabled={!!editingProduct}
                  />
                </div>
                <div>
                  <Label htmlFor="productName">Nama Produk</Label>
                  <Input
                    id="productName"
                    value={formData.productName}
                    onChange={(e) => setFormData({...formData, productName: e.target.value})}
                    placeholder="contoh: Gudang Garam Merah 12"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="purchasePrice">Harga Beli</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({...formData, purchasePrice: e.target.value})}
                    placeholder="18000"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sellingPrice">Harga Jual</Label>
                  <Input
                    id="sellingPrice"
                    type="number"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})}
                    placeholder="20000"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="initialStock">Stok Awal</Label>
                  <Input
                    id="initialStock"
                    type="number"
                    value={formData.initialStock}
                    onChange={(e) => setFormData({...formData, initialStock: e.target.value})}
                    placeholder="50"
                    required
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingProduct ? 'Perbarui' : 'Simpan'}
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

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Produk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Produk</TableHead>
                    <TableHead>Nama Produk</TableHead>
                    <TableHead>Harga Beli</TableHead>
                    <TableHead>Harga Jual</TableHead>
                    <TableHead>Stok Awal</TableHead>
                    <TableHead>Stok Saat Ini</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.productID}>
                      <TableCell className="font-medium">{product.productID}</TableCell>
                      <TableCell>{product.productName}</TableCell>
                      <TableCell>{formatCurrency(product.purchasePrice)}</TableCell>
                      <TableCell>{formatCurrency(product.sellingPrice)}</TableCell>
                      <TableCell>{product.initialStock}</TableCell>
                      <TableCell className={product.currentStock < 10 ? 'text-red-600 font-medium' : ''}>
                        {product.currentStock}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(product.productID)}
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
            {products.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Belum ada produk. Tambahkan produk pertama Anda!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductManagement;
