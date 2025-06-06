
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Sale {
  id: string;
  produk_id: string;
  pelanggan_id: string | null;
  jumlahTerjual: number;
  created_at: string;
  totalPendapatan: number;
  totalKeuntungan: number;
  statusPembayaran: string;
  product_name?: string;
  customer_name?: string;
}

const SalesManagement = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSales();
    setupRealtimeSubscriptions();
  }, []);

  const setupRealtimeSubscriptions = () => {
    const channel = supabase
      .channel('sales-management-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Penjualan'
        },
        (payload) => {
          console.log('New sale added:', payload);
          fetchSales(); // Refresh to get complete data with joins
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Penjualan'
        },
        (payload) => {
          console.log('Sale updated:', payload);
          fetchSales(); // Refresh to get complete data with joins
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'Penjualan'
        },
        (payload) => {
          console.log('Sale deleted:', payload);
          setSales(prev => prev.filter(sale => sale.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from('Penjualan')
        .select(`
          id,
          produk_id,
          pelanggan_id,
          jumlahTerjual,
          created_at,
          totalPendapatan,
          totalKeuntungan,
          statusPembayaran,
          Produk (
            namaProduk
          ),
          Pelanggan (
            namaPelanggan
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedSales = data?.map((sale: any) => ({
        id: sale.id,
        produk_id: sale.produk_id,
        pelanggan_id: sale.pelanggan_id,
        jumlahTerjual: sale.jumlahTerjual,
        created_at: sale.created_at,
        totalPendapatan: sale.totalPendapatan,
        totalKeuntungan: sale.totalKeuntungan,
        statusPembayaran: sale.statusPembayaran,
        product_name: sale.Produk?.namaProduk || 'Produk tidak ditemukan',
        customer_name: sale.Pelanggan?.namaPelanggan || null
      })) || [];

      setSales(formattedSales);
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

  const handleDelete = async (saleId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus transaksi ini? Perhatian: Stok produk tidak akan dikembalikan.')) {
      try {
        const { error } = await supabase
          .from('Penjualan')
          .delete()
          .eq('id', saleId);

        if (error) throw error;

        toast({
          title: "Transaksi berhasil dihapus",
          description: "Transaksi telah dihapus dari catatan."
        });
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
          <p className="text-gray-600">Kelola dan lihat catatan transaksi penjualan</p>
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
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Total Penjualan</TableHead>
                    <TableHead>Keuntungan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{formatDate(sale.created_at)}</TableCell>
                      <TableCell>{sale.product_name}</TableCell>
                      <TableCell>{sale.customer_name || '-'}</TableCell>
                      <TableCell>{sale.jumlahTerjual}</TableCell>
                      <TableCell>{formatCurrency(sale.totalPendapatan)}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {formatCurrency(sale.totalKeuntungan)}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          sale.statusPembayaran === 'Lunas' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {sale.statusPembayaran}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(sale.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Hapus
                        </Button>
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
      </div>
    </div>
  );
};

export default SalesManagement;
