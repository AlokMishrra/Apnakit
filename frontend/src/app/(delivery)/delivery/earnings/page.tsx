"use client";

import { useState, useEffect } from "react";
import {
  IndianRupee,
  TrendingUp,
  Calendar,
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  Download,
  ChevronDown,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deliveryService } from "@/services/delivery.service";
import { toast } from "sonner";

export default function EarningsPage() {
  const [activeTab, setActiveTab] = useState<"daily" | "weekly">("daily");
  const [earningsSummary, setEarningsSummary] = useState<any>({});
  const [dailyEarnings, setDailyEarnings] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const res = await deliveryService.getEarnings();
        const data = res?.data || res;
        setEarningsSummary(data?.summary || data || {});
        setDailyEarnings(data?.daily || data?.dailyEarnings || []);
        setTransactions(data?.transactions || []);
        setPaymentHistory(data?.paymentHistory || data?.payments || []);
      } catch (err: any) {
        toast.error("Failed to load earnings data");
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, []);

  const handleWithdraw = () => {
    toast.success("Withdrawal request submitted successfully");
  };

  const maxEarning = dailyEarnings.length > 0 ? Math.max(...dailyEarnings.map((d: any) => d.amount || 0)) : 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="mt-3 text-sm text-gray-500">Loading earnings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 opacity-80" />
              <span className="text-sm opacity-80">Today</span>
            </div>
            <p className="mt-2 text-2xl font-bold">
              {formatCurrency(earningsSummary.today)}
            </p>
            <div className="mt-1 flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3" />
              <span className="opacity-90">+12% vs yesterday</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 opacity-80" />
              <span className="text-sm opacity-80">This Week</span>
            </div>
            <p className="mt-2 text-2xl font-bold">
              {formatCurrency(earningsSummary.week)}
            </p>
            <div className="mt-1 flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3" />
              <span className="opacity-90">+8% vs last week</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-gray-500">This Month</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {formatCurrency(earningsSummary.month)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-600" />
              <span className="text-sm text-gray-500">All Time</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {formatCurrency(earningsSummary.allTime)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings chart */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Earnings Overview</h2>
            <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
              <button
                onClick={() => setActiveTab("daily")}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  activeTab === "daily"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500"
                )}
              >
                Daily
              </button>
              <button
                onClick={() => setActiveTab("weekly")}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  activeTab === "weekly"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500"
                )}
              >
                Weekly
              </button>
            </div>
          </div>

          {/* Bar chart */}
          <div className="flex items-end justify-between gap-2 h-48">
            {dailyEarnings.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] font-medium text-gray-600">
                  {formatCurrency(d.amount)}
                </span>
                <div
                  className="w-full rounded-t-md bg-emerald-500 transition-all"
                  style={{
                    height: `${(d.amount / maxEarning) * 140}px`,
                  }}
                />
                <span className="text-xs text-gray-500">{d.day}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Withdraw */}
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">
                Available for withdrawal
              </p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(earningsSummary.today)}
              </p>
            </div>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleWithdraw}>
              <Download className="mr-2 h-4 w-4" />
              Withdraw
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardContent className="p-4">
          <h2 className="mb-3 font-semibold text-gray-900">Transactions</h2>
          <div className="space-y-3">
            {transactions.map((txn) => (
              <div
                key={txn.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full",
                      txn.type === "delivery_fee"
                        ? "bg-emerald-100"
                        : txn.type === "bonus"
                        ? "bg-blue-100"
                        : "bg-red-100"
                    )}
                  >
                    {txn.type === "delivery_fee" ? (
                      <IndianRupee className="h-4 w-4 text-emerald-600" />
                    ) : txn.type === "bonus" ? (
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {txn.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {txn.time} {txn.orderId && `• ${txn.orderId}`}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold",
                    txn.amount >= 0 ? "text-emerald-600" : "text-red-600"
                  )}
                >
                  {txn.amount >= 0 ? "+" : ""}
                  {formatCurrency(Math.abs(txn.amount))}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment history */}
      <Card>
        <CardContent className="p-4">
          <h2 className="mb-3 font-semibold text-gray-900">Payment History</h2>
          <div className="space-y-2">
            {paymentHistory.map((payment, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                    <IndianRupee className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Weekly Payment
                    </p>
                    <p className="text-xs text-gray-500">{payment.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(payment.amount)}
                  </p>
                  <Badge variant="success" className="text-[10px]">
                    {payment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
