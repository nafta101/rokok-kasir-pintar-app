
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronRight, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Customer {
  id: string;
  namaPelanggan: string;
  total_debt: number;
}

interface DebtTransaction {
  id: string;
  produk_id: string;
  jumlahTerjual: number;
  totalPendapatan: number;
  created_at: string;
  product_name?: string;
}

const DebtManagement = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [debtTransactions, setDebtTransactions] = useState<DebtTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomersWithDebt();
    setupRealtimeSubscriptions();
  }, []);

  const setupRealtimeSubscriptions = () => {
    const channel = supabase
      .channel('debt-management-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Penjualan'
        },
        (payload) => {
          console.log('Sales data changed, refreshing debt data:', payload);
          fetchCustomersWithDebt();
          if (expandedCustomer) {
            fetchCustomerDebtTransactions(expandedCustomer);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchCustomersWithDebt = async () => {
    try {
      const { data: salesData, error } = await supabase
        .from('Penjualan')
        .select(`
          pelanggan_id,
          totalPendapatan,
          Pelanggan (
            id,
            namaPelanggan
          )
        `)
        .eq('statusPembayaran', 'Hutang')
        .not('pelanggan_id', 'is', null);

      if (error) throw error;

      // Group by customer and calculate total debt
      const customerDebtMap = new Map<string, Customer>();
      
      salesData?.forEach((sale: any) => {
        if (sale.Pelanggan) {
          const customerId = sale.pelanggan_id;
          if (customerDebtMap.has(customerId)) {
            const existing = customerDebtMap.get(customerId)!;
            existing.total_debt += Number(sale.totalPendapatan);
          } else {
            customerDebtMap.set(customerId, {
              id: customerId,
              namaPelanggan: sale.Pelanggan.namaPelanggan,
              total_debt: Number(sale.totalPendapatan)
            });
          }
        }
      });

      setCustomers(Array.from(customerDebtMap.values()));
    } catch (error) {
      console.error('Error fetching customers with debt:', error);
      toast({
        title: "Error",
        description: "Gagal memuat daftar hutang pelanggan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDebtTransactions = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('Penjualan')
        .select(`
          id,
          produk_id,
          jumlahTerjual,
          totalPendapatan,
          created_at,
          Produk (
            namaProduk
          )
        `)
        .eq('pelanggan_id', customerId)
        .eq('statusPembayaran', 'Hutang')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transactions = data?.map((sale: any) => ({
        id: sale.id,
        produk_id: sale.produk_id,
        jumlahTerjual: sale.jumlahTerjual,
        totalPendapatan: sale.totalPendapatan,
        created_at: sale.created_at,
        product_name: sale.Produk?.namaProduk || 'Produk tidak ditemukan'
      })) || [];

      setDebtTransactions(transactions);
    } catch (error) {
      console.error('Error fetching debt transactions:', error);
      toast({
        title: "Error",
        description: "Gagal memuat transaksi hutang",
        variant: "destructive"
      });
    }
  };

  const handleCustomerClick = async (customerId: string) => {
    if (expandedCustomer === customerId) {
      setExpandedCustomer(null);
      setDebtTransactions([]);
    } else {
      setExpandedCustomer(customerId);
      await fetchCustomerDebtTransactions(customerId);
    }
  };

  const markAsPaid = async (transactionId: string, customerId: string) => {
    try {
      const { error } = await supabase
        .from('Penjualan')
        .update({ statusPembayaran: 'Lunas' })
        .eq('id', transactionId);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Transaksi telah ditandai sebagai lunas"
      });

      // Real-time subscriptions will automatically refresh the data
    } catch (error) {
      console.error('Error marking transaction as paid:', error);
      toast({
        title: "Error",
        description: "Gagal menandai transaksi sebagai lunas",
        variant: "destructive"
      });
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Daftar Hutang Pelanggan</h1>
          <p className="text-gray-600">Kelola dan pantau hutang pelanggan</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pelanggan dengan Hutang</CardTitle>
          </CardHeader>
          <CardContent>
            {customers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Tidak ada pelanggan dengan hutang saat ini.
              </div>
            ) : (
              <div className="space-y-4">
                {customers.map((customer) => (
                  <div key={customer.id} className="border rounded-lg">
                    <div 
                      className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                      onClick={() => handleCustomerClick(customer.id)}
                    >
                      <div className="flex items-center gap-3">
                        {expandedCustomer === customer.id ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                        <div>
                          <h3 className="font-semibold">{customer.namaPelanggan}</h3>
                          <p className="text-sm text-gray-600">Total Hutang: {formatCurrency(customer.total_debt)}</p>
                        </div>
                      </div>
                    </div>

                    {expandedCustomer === customer.id && (
                      <div className="border-t bg-gray-50">
                        <div className="p-4">
                          <h4 className="font-medium mb-3">Transaksi Belum Lunas</h4>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Tanggal</TableHead>
                                  <TableHead>Produk</TableHead>
                                  <TableHead>Jumlah</TableHead>
                                  <TableHead>Total</TableHead>
                                  <TableHead>Aksi</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {debtTransactions.map((transaction) => (
                                  <TableRow key={transaction.id}>
                                    <TableCell>{formatDate(transaction.created_at)}</TableCell>
                                    <TableCell>{transaction.product_name}</TableCell>
                                    <TableCell>{transaction.jumlahTerjual}</TableCell>
                                    <TableCell>{formatCurrency(transaction.totalPendapatan)}</TableCell>
                                    <TableCell>
                                      <Button
                                        size="sm"
                                        onClick={() => markAsPaid(transaction.id, customer.id)}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                      >
                                        <CreditCard className="h-4 w-4 mr-1" />
                                        Tandai Lunas
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DebtManagement;
