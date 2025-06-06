
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Home, Package, Receipt, BarChart3, CreditCard, TrendingUp, Menu } from "lucide-react";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: Home,
      description: "Kasir & Transaksi"
    },
    {
      title: "Produk",
      href: "/produk",
      icon: Package,
      description: "Kelola Produk"
    },
    {
      title: "Penjualan",
      href: "/penjualan",
      icon: Receipt,
      description: "Kelola Transaksi"
    },
    {
      title: "Hutang",
      href: "/hutang",
      icon: CreditCard,
      description: "Kelola Hutang"
    },
    {
      title: "Analisis",
      href: "/analisis",
      icon: TrendingUp,
      description: "Analisis Penjualan"
    },
    {
      title: "Update Stok",
      href: "/update-stok",
      icon: BarChart3,
      description: "Kelola Stok"
    }
  ];

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={() => mobile && setIsOpen(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            } ${mobile ? 'w-full justify-start' : ''}`}
          >
            <Icon className="h-4 w-4" />
            <span className={mobile ? 'block' : 'hidden lg:block'}>{item.title}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-900">
              Kasir Rokok
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLinks />
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col space-y-2 mt-8">
                  <NavLinks mobile />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
