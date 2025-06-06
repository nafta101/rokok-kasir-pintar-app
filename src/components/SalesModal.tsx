
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
  product_name: string;
  purchase_price: number;
  selling_price: number;
  current_stock: number;
}

interface Customer {
  id: string;
  customer_name: string;
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
        .from('products')
        .select('*')
        .gt('current_stock', 0)
        .order('product_name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('customer_name');

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
        .from('customers')
        .insert([{ customer_name: newCustomerName.trim() }])
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

    if (quantity > selectedProduct.current_stock) {
      toast({
        title: "Error",
        description: `Stok tidak mencukupi! Stok tersisa: ${selectedProduct.current_stock}`,
        variant: "destructive"
      });
      return;
    }

    try {
      // Calculate sale details
      const totalRevenue = selectedProduct.selling_price * quantity;
      const totalCost = selectedProduct.purchase_price * quantity;
      const totalProfit = totalRevenue - totalCost;

      // Create sale record
      const saleData = {
        product_id: selectedProductID,
        quantity_sold: quantity,
        total_revenue: totalRevenue,
        total_cost: totalCost,
        total_profit: totalProfit,
        payment_status: isDebt ? 'Hutang' : 'Lunas',
        customer_id: isDebt ? selectedCustomerID : null
      };

      const { error: saleError } = await supabase
        .from('sales')
        .insert([saleData]);

      if (saleError) throw saleError;

      // Update product stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ current_stock: selectedProduct.current_stock - quantity })
        .eq('id', selectedProductID);

      if (updateError) throw updateError;

      toast({
        title: "Transaksi berhasil!",
        description: `Penjualan ${selectedProduct.product_name} sebanyak ${quantity} telah dicatat.`
      });

      onSaleComplete();
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error saving sale:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan transaksi",
        variant: "destructive"
      });
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
                          {customer.customer_name}
                        </SelectItem>
                      ))}
                      <SelectItem value="add_new" onSelect={() => setShowAddCustomer(true)}>
                        + Tambah Pelanggan Baru
                      </SelectItem>
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
                    {product.product_name} - {formatCurrency(product.selling_price)} (Stok: {product.current_stock})
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
                  <span className="font-medium">{formatCurrency(selectedProduct.selling_price)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Stok Tersedia:</span>
                  <span className="font-medium">{selectedProduct.current_stock}</span>
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
              max={selectedProduct?.current_stock || 1}
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
                    {formatCurrency(selectedProduct.selling_price * parseInt(quantitySold))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Keuntungan:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency((selectedProduct.selling_price - selectedProduct.purchase_price) * parseInt(quantitySold))}
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
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
              Simpan Transaksi
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
