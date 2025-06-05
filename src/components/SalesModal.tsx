
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface SalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSaleComplete: (updatedProducts: Product[], newSale: Sale) => void;
}

export const SalesModal: React.FC<SalesModalProps> = ({
  isOpen,
  onClose,
  products,
  onSaleComplete
}) => {
  const [selectedProductID, setSelectedProductID] = useState('');
  const [quantitySold, setQuantitySold] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProductID || !quantitySold) {
      toast({
        title: "Error",
        description: "Harap pilih produk dan masukkan jumlah terjual!",
        variant: "destructive"
      });
      return;
    }

    const selectedProduct = products.find(p => p.productID === selectedProductID);
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

    if (quantity > selectedProduct.currentStock) {
      toast({
        title: "Error",
        description: `Stok tidak mencukupi! Stok tersisa: ${selectedProduct.currentStock}`,
        variant: "destructive"
      });
      return;
    }

    // Calculate sale details
    const totalRevenue = selectedProduct.sellingPrice * quantity;
    const totalCost = selectedProduct.purchasePrice * quantity;
    const totalProfit = totalRevenue - totalCost;

    // Create new sale record
    const newSale: Sale = {
      saleID: `SALE_${Date.now()}`,
      productID_ref: selectedProductID,
      quantitySold: quantity,
      saleTimestamp: new Date().toISOString(),
      totalRevenue,
      totalCost,
      totalProfit
    };

    // Update product stock
    const updatedProducts = products.map(product => 
      product.productID === selectedProductID
        ? { ...product, currentStock: product.currentStock - quantity }
        : product
    );

    onSaleComplete(updatedProducts, newSale);
    
    toast({
      title: "Transaksi berhasil!",
      description: `Penjualan ${selectedProduct.productName} sebanyak ${quantity} telah dicatat.`
    });

    // Reset form
    setSelectedProductID('');
    setQuantitySold('');
  };

  const selectedProduct = products.find(p => p.productID === selectedProductID);

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
          <div>
            <Label htmlFor="product">Pilih Produk</Label>
            <Select value={selectedProductID} onValueChange={setSelectedProductID}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih produk yang dijual..." />
              </SelectTrigger>
              <SelectContent>
                {products
                  .filter(product => product.currentStock > 0)
                  .map((product) => (
                  <SelectItem key={product.productID} value={product.productID}>
                    {product.productName} - {formatCurrency(product.sellingPrice)} (Stok: {product.currentStock})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProduct && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Harga Jual:</span>
                  <span className="font-medium">{formatCurrency(selectedProduct.sellingPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Stok Tersedia:</span>
                  <span className="font-medium">{selectedProduct.currentStock}</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="quantity">Jumlah Terjual</Label>
            <Input
              id="quantity"
              type="number"
              value={quantitySold}
              onChange={(e) => setQuantitySold(e.target.value)}
              placeholder="Masukkan jumlah yang terjual..."
              min="1"
              max={selectedProduct?.currentStock || 1}
              required
            />
          </div>

          {selectedProduct && quantitySold && parseInt(quantitySold) > 0 && (
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Total Penjualan:</span>
                  <span className="font-medium">
                    {formatCurrency(selectedProduct.sellingPrice * parseInt(quantitySold))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Keuntungan:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency((selectedProduct.sellingPrice - selectedProduct.purchasePrice) * parseInt(quantitySold))}
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
