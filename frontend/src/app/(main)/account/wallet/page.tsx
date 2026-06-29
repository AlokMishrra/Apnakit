"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  CreditCard,
  Banknote,
  Loader2,
  TrendingUp,
  Gift,
  ShoppingBag,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { walletService } from "@/services/wallet.service";
import { getSafeErrorMessage, isAuthError } from "@/lib/safe-error";
import { toast } from "sonner";

interface Transaction {
  id: string;
  type: "credit" | "debit" | "refund" | "cashback";
  amount: number;
  description: string;
  date: string;
  status: "completed" | "pending" | "failed";
  reference?: string;
}

function TransactionSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

export default function WalletPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [addingMoney, setAddingMoney] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const fetchWallet = useCallback(async () => {
    try {
      setLoading(true);
      const res = await walletService.getWallet();
      const data = res?.data?.data || res?.data || res;
      setBalance(Number(data?.balance || 0));
      const txns = data?.transactions || data?.walletTransactions || [];
      setTransactions(Array.isArray(txns) ? txns : []);
    } catch (err: any) {
      if (isAuthError(err)) {
        toast.error("Please login to view wallet");
        router.push("/login");
        return;
      }
      toast.error("Failed to load wallet", { description: getSafeErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const handleAddMoney = async () => {
    const amount = Number(addAmount);
    if (!amount || amount < 1) {
      toast.error("Please enter a valid amount (min ₹1)");
      return;
    }
    if (amount > 50000) {
      toast.error("Maximum amount is ₹50,000");
      return;
    }
    try {
      setAddingMoney(true);
      await walletService.addToWallet(amount);
      toast.success(`₹${amount.toLocaleString("en-IN")} added to wallet!`, {
        description: "Your wallet balance has been updated",
      });
      setAddAmount("");
      setShowAddDialog(false);
      fetchWallet();
    } catch (err: any) {
      toast.error("Failed to add money", { description: getSafeErrorMessage(err) });
    } finally {
      setAddingMoney(false);
    }
  };

  const totalCredit = transactions
    .filter((t) => t.type === "credit" || t.type === "refund" || t.type === "cashback")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalDebit = transactions
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-100">Available Balance</p>
              <p className="mt-1 text-3xl font-bold">{formatCurrency(balance)}</p>
              <p className="mt-1 text-xs text-indigo-200">ApnaKit Wallet</p>
            </div>
            <div className="rounded-full bg-white/20 p-3">
              <Wallet className="h-8 w-8" />
            </div>
          </div>
          <Button
            className="mt-4 w-full bg-white text-indigo-600 hover:bg-indigo-50"
            onClick={() => setShowAddDialog(!showAddDialog)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Money
          </Button>
        </CardContent>
      </Card>

      {showAddDialog && (
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Add Money to Wallet</h3>
            <div className="flex gap-2">
              <input
                type="number"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                placeholder="Enter amount"
                min="1"
                max="50000"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <Button
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={handleAddMoney}
                disabled={addingMoney}
              >
                {addingMoney ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {[500, 1000, 2000, 5000].map((amt) => (
                <Button key={amt} variant="outline" size="sm" onClick={() => setAddAmount(String(amt))}>
                  ₹{amt.toLocaleString("en-IN")}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-100 p-2">
                <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Added</p>
                <p className="text-sm font-semibold text-foreground">{formatCurrency(totalCredit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-rose-100 p-2">
                <ArrowUpRight className="h-4 w-4 text-rose-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Spent</p>
                <p className="text-sm font-semibold text-foreground">{formatCurrency(totalDebit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Recent Transactions</h3>
            <Button variant="ghost" size="sm" onClick={fetchWallet}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          {transactions.length === 0 ? (
            <div className="py-8 text-center">
              <Banknote className="mx-auto mb-2 h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((txn) => {
                const isCredit = txn.type === "credit" || txn.type === "refund" || txn.type === "cashback";
                return (
                  <div key={txn.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full p-2 ${isCredit ? "bg-emerald-100" : "bg-rose-100"}`}>
                        {isCredit ? (
                          <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-rose-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{txn.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(txn.date, "MMM dd, yyyy 'at' hh:mm a")}</p>
                        {txn.reference && (
                          <p className="text-xs text-muted-foreground">Ref: {txn.reference}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${isCredit ? "text-emerald-600" : "text-rose-600"}`}>
                        {isCredit ? "+" : "−"}{formatCurrency(Math.abs(txn.amount))}
                      </p>
                      {txn.status === "PENDING" && <p className="text-xs text-amber-600">Pending</p>}
                      {txn.status === "FAILED" && <p className="text-xs text-red-600">Failed</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
