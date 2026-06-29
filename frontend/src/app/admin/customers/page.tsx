"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Users,
  UserCheck,
  UserX,
  DollarSign,
  MoreHorizontal,
  Eye,
  Ban,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pagination } from "@/components/ui/pagination";
import { formatCurrency, formatDate } from "@/lib/utils";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getCustomers({ page: 1, limit: 100 });
      const data = res?.data?.data || res?.data || [];
      setCustomers(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) => {
          const name = c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim();
          return (
            name.toLowerCase().includes(query) ||
            c.email.toLowerCase().includes(query) ||
            (c.phone || '').includes(query)
          );
        }
      );
    }

    return result;
  }, [statusFilter, searchQuery, customers]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = {
    total: customers.length,
    active: customers.filter((c) => c.isActive !== false).length,
    blocked: customers.filter((c) => c.isActive === false).length,
    totalRevenue: customers.reduce((sum, c) => sum + (c.totalSpent || c.totalRevenue || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const toggleBlock = async (id: string) => {
    try {
      const customer = customers.find((c) => (c._id || c.id) === id);
      const newStatus = customer?.isActive === false;
      toast.warning("Customer status toggle requires backend support");
    } catch (err) {
      toast.error("Failed to update customer status");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-sm text-gray-500">
          Manage your customer accounts and profiles
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Customers</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <UserCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <UserX className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Blocked</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.blocked}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-gray-500">
          {filteredCustomers.length} customers found
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Customer
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Phone
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Orders
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Total Spent
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Joined
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedCustomers.map((customer) => {
                const id = customer._id || customer.id;
                const name = customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'User';
                const isActive = customer.isActive !== false;
                return (
                <tr
                  key={id}
                  className="transition-colors hover:bg-gray-50/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={name} size="sm" />
                      <span className="font-medium text-gray-900">
                        {name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{customer.email}</td>
                  <td className="px-4 py-3 text-gray-600">{customer.phone || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {customer.ordersCount || customer._count?.orders || 0}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {formatCurrency(customer.totalSpent || customer.totalRevenue || 0)}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatDate(customer.createdAt || customer.joinedDate)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        isActive ? "success" : "destructive"
                      }
                    >
                      {isActive ? "Active" : "Blocked"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/admin/customers/${id}`}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toggleBlock(id)}
                          className="flex items-center gap-2"
                        >
                          {isActive ? (
                            <>
                              <Ban className="h-4 w-4 text-red-500" />
                              <span className="text-red-600">Block</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 text-emerald-500" />
                              <span className="text-emerald-600">Unblock</span>
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
