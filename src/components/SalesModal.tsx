
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  namaProduk: string;
  hargaBeli: number;
  hargaJual: number;
  stokSaatIni: number;
}

interface Customer {
  id: string;
  namaPelanggan: string;
}

interface SalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleComplete: () => void;
}

export const SalesModal: React.FC<SalesModalProps> = ({
  isOpen,
  onClose,
  onSaleComplete
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedProductID, setSelectedProductID] = useState('');
  const [quantitySold, setQuantitySold] = useState('');
  const [isDebt, setIsDebt] = useState(false);
  const [selectedCustomerID, setSelectedCustomerID] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      fetchCustomers();
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('Produk')
        .select('*')
        .gt('stokSaatIni', 0)
        .order('namaProduk');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('Pelanggan')
        .select('*')
        .order('namaPelanggan');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleAddNewCustomer = async () => {
    if (!newCustomerName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('Pelanggan')
        .insert([{ namaPelanggan: newCustomerName.trim() }])
        .select()
        .single();

      if (error) throw error;

      setCustomers(prev => [...prev, data]);
      setSelectedCustomerID(data.id);
      setNewCustomerName('');
      setShowAddCustomer(false);

      toast({
        title: "Berhasil",
        description: "Pelanggan baru telah ditambahkan"
      });
    } catch (error) {
      console.error('Error adding customer:', error);
      toast({
        title: "Error",
        description: "Gagal menambahkan pelanggan baru",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProductID || !quantitySold) {
      toast({
        title: "Error",
        description: "Harap pilih produk dan masukkan jumlah terjual!",
        variant: "destructive"
      });
      return;
    }

    if (isDebt && !selectedCustomerID) {
      toast({
        title: "Error",
        description: "Harap pilih pelanggan untuk transaksi hutang!",
        variant: "destructive"
      });
      return;
    }

    const selectedProduct = products.find(p => p.id === selectedProductID);
    if (!selectedProduct) {
      toast({
        title: "Error", 
        description: "Produk tidak ditemukan!",
        variant: "destructive"
      });
      return;
    }

    const quantity = parseInt(quantitySold);
    if (quantity <= 0) {
      toast({
        title: "Error",
        description: "Jumlah terjual harus lebih dari 0!",
        variant: "destructive"
      });
      return;
    }

    if (quantity > selectedProduct.stokSaatIni) {
      toast({
        title: "Error",
        description: `Stok tidak mencukupi! Stok tersedia: ${selectedProduct.stokSaatIni}`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Calling handle_new_sale with params:', {
        p_produk_id: selectedProductID,
        p_jumlah_terjual: quantity,
        p_status_pembayaran: isDebt ? 'Hutang' : 'Lunas',
        p_pelanggan_id: isDebt ? selectedCustomerID : null
      });

      // Use the RPC function for atomic transaction
      const { error } = await supabase.rpc('handle_new_sale', {
        p_produk_id: selectedProductID,
        p_jumlah_terjual: quantity,
        p_status_pembayaran: isDebt ? 'Hutang' : 'Lunas',
        p_pelanggan_id: isDebt ? selectedCustomerID : null
      });

      if (error) {
        console.error('RPC Error details:', error);
        throw error;
      }

      toast({
        title: "Transaksi berhasil!",
        description: `Penjualan ${selectedProduct.namaProduk} sebanyak ${quantity} telah dicatat.`
      });

      onSaleComplete();
      resetForm();
      onClose();
    } catch (error: any) {
      console.error('Error saving sale:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan transaksi",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedProductID('');
    setQuantitySold('');
    setIsDebt(false);
    setSelectedCustomerID('');
    setNewCustomerName('');
    setShowAddCustomer(false);
  };

  const selectedProduct = products.find(p => p.id === selectedProductID);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Catat Penjualan Baru</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Status */}
          <div className="flex items-center justify-between">
            <Label htmlFor="payment-status">Status Pembayaran</Label>
            <div className="flex items-center space-x-2">
              <Label htmlFor="payment-switch" className={!isDebt ? 'font-medium' : ''}>
                Lunas
              </Label>
              <Switch
                id="payment-switch"
                checked={isDebt}
                onCheckedChange={setIsDebt}
              />
              <Label htmlFor="payment-switch" className={isDebt ? 'font-medium' : ''}>
                Hutang
              </Label>
            </div>
          </div>

          {/* Customer Selection (only if debt) */}
          {isDebt && (
            <div>
              <Label htmlFor="customer">Pilih Pelanggan</Label>
              {!showAddCustomer ? (
                <div className="space-y-2">
                  <Select value={selectedCustomerID} onValueChange={setSelectedCustomerID}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih pelanggan..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.namaPelanggan}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddCustomer(true)}
                    className="w-full"
                  >
                    + Tambah Pelanggan Baru
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="Nama pelanggan baru..."
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleAddNewCustomer}
                      size="sm"
                      className="flex-1"
                    >
                      Simpan
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddCustomer(false);
                        setNewCustomerName('');
                      }}
                      size="sm"
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Product Selection */}
          <div>
            <Label htmlFor="product">Pilih Produk</Label>
            <Select value={selectedProductID} onValueChange={setSelectedProductID}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih produk yang dijual..." />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.namaProduk} - {formatCurrency(product.hargaJual)} (Stok: {product.stokSaatIni})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Product Info */}
          {selectedProduct && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Harga Jual:</span>
                  <span className="font-medium">{formatCurrency(selectedProduct.hargaJual)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Stok Tersedia:</span>
                  <span className={`font-medium ${selectedProduct.stokSaatIni < 3 ? 'text-red-600' : 'text-green-600'}`}>
                    {selectedProduct.stokSaatIni}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <Label htmlFor="quantity">Jumlah Terjual</Label>
            <Input
              id="quantity"
              type="number"
              value={quantitySold}
              onChange={(e) => setQuantitySold(e.target.value)}
              placeholder="Masukkan jumlah yang terjual..."
              min="1"
              max={selectedProduct?.stokSaatIni || 1}
              required
            />
          </div>

          {/* Sale Summary */}
          {selectedProduct && quantitySold && parseInt(quantitySold) > 0 && (
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Total Penjualan:</span>
                  <span className="font-medium">
                    {formatCurrency(selectedProduct.hargaJual * parseInt(quantitySold))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Keuntungan:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency((selectedProduct.hargaJual - selectedProduct.hargaBeli) * parseInt(quantitySold))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`font-medium ${isDebt ? 'text-orange-600' : 'text-green-600'}`}>
                    {isDebt ? 'Hutang' : 'Lunas'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
