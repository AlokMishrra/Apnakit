"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  Navigation,
  Clock,
  Ruler,
  ChevronRight,
  Package,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deliveryService } from "@/services/delivery.service";
import { toast } from "sonner";

export default function RoutePage() {
  const [routeStops, setRouteStops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const res = await deliveryService.getRoute();
        const data = res?.data || res;
        setRouteStops(data?.stops || data?.routeStops || (Array.isArray(data) ? data : []));
      } catch (err: any) {
        toast.error("Failed to load route data");
      } finally {
        setLoading(false);
      }
    };
    fetchRoute();
  }, []);

  const totalDistance = routeStops.reduce(
    (acc, stop) => acc + parseFloat(stop.distance || "0"),
    0
  );
  const estimatedTime = routeStops.reduce(
    (acc, stop) => acc + parseInt(stop.eta || "0"),
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="mt-3 text-sm text-gray-500">Loading route...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Route summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="flex flex-col items-center p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {routeStops.length}
            </p>
            <p className="text-xs text-gray-500">Stops</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <Ruler className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {totalDistance.toFixed(1)}
            </p>
            <p className="text-xs text-gray-500">km Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {estimatedTime}
            </p>
            <p className="text-xs text-gray-500">min Est.</p>
          </CardContent>
        </Card>
      </div>

      {/* Map placeholder */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Route Map</h2>
            <Button variant="outline" size="sm">
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
              Optimize
            </Button>
          </div>
          <div className="flex h-56 items-center justify-center rounded-lg bg-gray-100 border-2 border-dashed border-gray-300">
            <div className="text-center">
              <MapPin className="mx-auto h-10 w-10 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                Interactive map view
              </p>
              <p className="text-xs text-gray-400">
                {routeStops.length} stops • {totalDistance.toFixed(1)} km
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optimized route suggestion */}
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
              <Navigation className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">
                Optimized Route Available
              </p>
              <p className="mt-0.5 text-sm text-gray-600">
                We found a route that saves ~15 minutes and 3.2 km. The stops
                have been reordered for efficiency.
              </p>
              <Button
                size="sm"
                className="mt-2 bg-emerald-600 hover:bg-emerald-700"
              >
                Apply Optimized Route
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Start navigation */}
      <Button
        className="w-full bg-emerald-600 hover:bg-emerald-700"
        size="lg"
        onClick={() =>
          window.open(
            `https://www.google.com/maps/dir/${routeStops
              .map((s) => encodeURIComponent(s.address))
              .join("/")}`,
            "_blank"
          )
        }
      >
        <Navigation className="mr-2 h-4 w-4" />
        Start Navigation ({routeStops.length} stops)
      </Button>

      {/* Stop list */}
      <Card>
        <CardContent className="p-4">
          <h2 className="mb-3 font-semibold text-gray-900">Delivery Stops</h2>
          <div className="space-y-0">
            {routeStops.map((stop, idx) => (
              <div key={stop.order}>
                <div className="flex items-start gap-3">
                  {/* Step indicator */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                        stop.status === "picked_up"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                      )}
                    >
                      {idx + 1}
                    </div>
                    {idx < routeStops.length - 1 && (
                      <div className="h-12 w-0.5 bg-gray-200" />
                    )}
                  </div>

                  {/* Stop details */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">
                        {stop.order}
                      </span>
                      <Badge
                        variant={
                          stop.status === "picked_up" ? "warning" : "default"
                        }
                        className="text-[10px]"
                      >
                        {stop.status === "picked_up"
                          ? "Picked Up"
                          : "To Pick"}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      {stop.customer}
                    </p>
                    <p className="text-xs text-gray-500 truncate max-w-[250px]">
                      {stop.address}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                      <span>{stop.items} items</span>
                      <span>•</span>
                      <span>{stop.distance}</span>
                      <span>•</span>
                      <span>~{stop.eta}</span>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() =>
                          window.open(
                            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.address)}`,
                            "_blank"
                          )
                        }
                      >
                        <Navigation className="mr-1 h-3 w-3" />
                        Navigate
                      </Button>
                    </div>
                  </div>

                  <ChevronRight className="mt-2 h-4 w-4 text-gray-300" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
