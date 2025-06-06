
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  namaProduk: string;
  hargaBeli: number;
  hargaJual: number;
  stokSaatIni: number;
}

const ProductManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    namaProduk: '',
    hargaBeli: '',
    hargaJual: '',
    stokSaatIni: ''
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
    setupRealtimeSubscriptions();
  }, []);

  const setupRealtimeSubscriptions = () => {
    const channel = supabase
      .channel('products-management-changes')
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
          event: 'UPDATE',
          schema: 'public',
          table: 'Produk'
        },
        (payload) => {
          console.log('Product updated:', payload);
          setProducts(prev => prev.map(product => 
            product.id === payload.new.id ? payload.new as Product : product
          ));
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

    return () => {
      supabase.removeChannel(channel);
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
      toast({
        title: "Error",
        description: "Gagal mengambil data produk",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData = {
      namaProduk: formData.namaProduk,
      hargaBeli: parseFloat(formData.hargaBeli),
      hargaJual: parseFloat(formData.hargaJual),
      stokSaatIni: parseInt(formData.stokSaatIni)
    };

    try {
      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from('Produk')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;

        toast({
          title: "Produk berhasil diperbarui",
          description: `${productData.namaProduk} telah diperbarui.`
        });
      } else {
        // Add new product
        const { error } = await supabase
          .from('Produk')
          .insert([productData]);

        if (error) throw error;

        toast({
          title: "Produk berhasil ditambahkan",
          description: `${productData.namaProduk} telah ditambahkan ke daftar produk.`
        });
      }

      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan produk",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      namaProduk: product.namaProduk,
      hargaBeli: product.hargaBeli.toString(),
      hargaJual: product.hargaJual.toString(),
      stokSaatIni: product.stokSaatIni.toString()
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      try {
        const { error } = await supabase
          .from('Produk')
          .delete()
          .eq('id', productId);

        if (error) throw error;

        toast({
          title: "Produk berhasil dihapus",
          description: "Produk telah dihapus dari daftar."
        });
      } catch (error) {
        console.error('Error deleting product:', error);
        toast({
          title: "Error",
          description: "Gagal menghapus produk",
          variant: "destructive"
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      namaProduk: '',
      hargaBeli: '',
      hargaJual: '',
      stokSaatIni: ''
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Manajemen Produk</h1>
          <p className="text-gray-600">Kelola daftar produk dan informasi harga</p>
        </div>

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
                  <Label htmlFor="namaProduk">Nama Produk</Label>
                  <Input
                    id="namaProduk"
                    value={formData.namaProduk}
                    onChange={(e) => setFormData({...formData, namaProduk: e.target.value})}
                    placeholder="contoh: Gudang Garam Merah 12"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="hargaBeli">Harga Beli</Label>
                  <Input
                    id="hargaBeli"
                    type="number"
                    value={formData.hargaBeli}
                    onChange={(e) => setFormData({...formData, hargaBeli: e.target.value})}
                    placeholder="18000"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="hargaJual">Harga Jual</Label>
                  <Input
                    id="hargaJual"
                    type="number"
                    value={formData.hargaJual}
                    onChange={(e) => setFormData({...formData, hargaJual: e.target.value})}
                    placeholder="20000"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="stokSaatIni">Stok Awal</Label>
                  <Input
                    id="stokSaatIni"
                    type="number"
                    value={formData.stokSaatIni}
                    onChange={(e) => setFormData({...formData, stokSaatIni: e.target.value})}
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
                    <TableHead>Nama Produk</TableHead>
                    <TableHead>Harga Beli</TableHead>
                    <TableHead>Harga Jual</TableHead>
                    <TableHead>Stok Saat Ini</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.namaProduk}</TableCell>
                      <TableCell>{formatCurrency(product.hargaBeli)}</TableCell>
                      <TableCell>{formatCurrency(product.hargaJual)}</TableCell>
                      <TableCell className={product.stokSaatIni < 10 ? 'text-red-600 font-medium' : ''}>
                        {product.stokSaatIni}
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
                            onClick={() => handleDelete(product.id)}
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
