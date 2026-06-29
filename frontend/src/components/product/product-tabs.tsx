"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Rating } from "@/components/ui/rating";
import { UserAvatar } from "@/components/ui/avatar";
import { formatDate, getImageUrl } from "@/lib/utils";
import type { Review } from "@/types";

interface ProductTabsProps {
  description: string;
  specifications: Record<string, string>;
  faqs: { question: string; answer: string }[];
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  className?: string;
}

function ProductTabs({
  description,
  specifications,
  faqs,
  reviews,
  averageRating,
  totalReviews,
  className,
}: ProductTabsProps) {
  const [activeTab, setActiveTab] = React.useState("description");

  const tabs = [
    { id: "description", label: "Description" },
    { id: "specifications", label: "Specifications" },
    { id: "faq", label: "FAQ" },
    { id: "reviews", label: `Reviews (${totalReviews})` },
  ];

  return (
    <div className={cn("w-full", className)}>
      {/* Tab Navigation */}
      <div className="overflow-x-auto border-b">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative whitespace-nowrap px-6 py-3 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {activeTab === "description" && (
          <div className="prose prose-sm max-w-none text-foreground">
            <p className="whitespace-pre-line leading-relaxed">{description}</p>
          </div>
        )}

        {activeTab === "specifications" && (
          <div className="space-y-0">
            {Object.entries(specifications).map(([key, value], index) => (
              <div
                key={key}
                className={cn(
                  "flex py-3 text-sm",
                  index % 2 === 0 ? "bg-muted/50" : ""
                )}
              >
                <span className="w-1/3 px-4 font-medium text-muted-foreground md:w-1/4">
                  {key}
                </span>
                <span className="flex-1 px-4 text-foreground">{value}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "faq" && (
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left text-sm font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground">{averageRating}</div>
                <Rating value={averageRating} size="sm" className="mt-1" />
                <p className="mt-1 text-xs text-muted-foreground">{totalReviews} reviews</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviews.filter((r) => r.rating === star).length;
                  const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-sm">
                      <span className="w-3 text-right text-muted-foreground">{star}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-amber-400"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-8 text-xs text-muted-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              {reviews.slice(0, 3).map((review) => (
                <div key={review._id} className="rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <UserAvatar name={review.user.name} src={review.user.avatar} size="sm" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{review.user.name}</span>
                        <Rating value={review.rating} size="sm" />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(review.createdAt)}
                      </p>
                      <p className="mt-0.5 text-xs font-medium">{review.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>
                      {review.images && review.images.length > 0 && (
                        <div className="mt-2 flex gap-2">
                          {review.images.map((img, i) => (
                            <img
                              key={i}
                              src={getImageUrl(img)}
                              alt="Review image"
                              className="h-16 w-16 rounded-md object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/images/placeholder.svg";
                              }}
                            />
                          ))}
                        </div>
                      )}
                      <button className="mt-2 text-xs text-muted-foreground hover:text-primary">
                        Helpful ({review.helpful})
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { ProductTabs };
