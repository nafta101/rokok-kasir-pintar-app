
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus } from "lucide-react";
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

export const SalesModal: React.FC<SalesModalProps> = ({ isOpen, onClose, onSaleComplete }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Lunas');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [showNewCustomerInput, setShowNewCustomerInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      fetchCustomers();
      resetForm();
    }
  }, [isOpen]);

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
      toast({
        title: "Error",
        description: "Gagal mengambil data produk",
        variant: "destructive"
      });
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

  const resetForm = () => {
    setSelectedProduct('');
    setQuantity('');
    setPaymentStatus('Lunas');
    setSelectedCustomer('');
    setNewCustomerName('');
    setShowNewCustomerInput(false);
  };

  const handleCustomerChange = (value: string) => {
    if (value === 'new_customer') {
      setShowNewCustomerInput(true);
      setSelectedCustomer('');
    } else {
      setShowNewCustomerInput(false);
      setSelectedCustomer(value);
    }
  };

  const createNewCustomer = async (customerName: string) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{ customer_name: customerName }])
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct || !quantity) {
      toast({
        title: "Error",
        description: "Pilih produk dan masukkan jumlah",
        variant: "destructive"
      });
      return;
    }

    if (paymentStatus === 'Hutang' && !selectedCustomer && !newCustomerName) {
      toast({
        title: "Error",
        description: "Pilih pelanggan atau tambah pelanggan baru untuk transaksi hutang",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const product = products.find(p => p.id === selectedProduct);
      if (!product) {
        throw new Error('Produk tidak ditemukan');
      }

      const quantityNum = parseInt(quantity);
      if (quantityNum > product.current_stock) {
        toast({
          title: "Error",
          description: `Stok tidak mencukupi! Stok tersisa: ${product.current_stock}`,
          variant: "destructive"
        });
        return;
      }

      let customerId = selectedCustomer;

      // Create new customer if needed
      if (paymentStatus === 'Hutang' && newCustomerName && !selectedCustomer) {
        customerId = await createNewCustomer(newCustomerName);
        toast({
          title: "Pelanggan baru berhasil ditambahkan",
          description: `${newCustomerName} telah ditambahkan ke daftar pelanggan.`
        });
      }

      const totalRevenue = product.selling_price * quantityNum;
      const totalCost = product.purchase_price * quantityNum;
      const totalProfit = totalRevenue - totalCost;

      // Create sale record
      const saleData = {
        product_id: selectedProduct,
        quantity_sold: quantityNum,
        total_revenue: totalRevenue,
        total_cost: totalCost,
        total_profit: totalProfit,
        payment_status: paymentStatus,
        customer_id: paymentStatus === 'Hutang' ? customerId : null
      };

      const { error: saleError } = await supabase
        .from('sales')
        .insert([saleData]);

      if (saleError) throw saleError;

      // Update product stock - CRITICAL FIX
      const newStock = product.current_stock - quantityNum;
      const { error: stockError } = await supabase
        .from('products')
        .update({ current_stock: newStock })
        .eq('id', selectedProduct);

      if (stockError) throw stockError;

      toast({
        title: "Transaksi berhasil disimpan",
        description: `Penjualan ${product.product_name} sebanyak ${quantityNum} unit telah dicatat.`
      });

      resetForm();
      onClose();
      onSaleComplete(); // This will refresh the parent component data
    } catch (error) {
      console.error('Error saving sale:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan transaksi",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedProductData = products.find(p => p.id === selectedProduct);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Catat Penjualan Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Status */}
          <div>
            <Label>Status Pembayaran</Label>
            <RadioGroup value={paymentStatus} onValueChange={setPaymentStatus} className="flex gap-4 mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Lunas" id="lunas" />
                <Label htmlFor="lunas">Lunas</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Hutang" id="hutang" />
                <Label htmlFor="hutang">Hutang</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Customer Selection - Only show if payment status is Hutang */}
          {paymentStatus === 'Hutang' && (
            <div>
              <Label htmlFor="customer">Pilih Pelanggan</Label>
              <Select onValueChange={handleCustomerChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih pelanggan..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_customer">+ Tambah Pelanggan Baru</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.customer_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* New Customer Input */}
              {showNewCustomerInput && (
                <div className="mt-2">
                  <Input
                    placeholder="Nama pelanggan baru..."
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Product Selection */}
          <div>
            <Label htmlFor="product">Produk</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih produk..." />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.product_name} (Stok: {product.current_stock})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div>
            <Label htmlFor="quantity">Jumlah</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={selectedProductData?.current_stock || 999}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Jumlah yang dijual"
              required
            />
          </div>

          {/* Total Calculation */}
          {selectedProductData && quantity && (
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Harga Satuan:</span>
                    <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(selectedProductData.selling_price)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(selectedProductData.selling_price * parseInt(quantity || '0'))}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
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
