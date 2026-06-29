"use client";

import * as React from "react";
import { ThumbsUp, Camera, Star, ChevronDown, X } from "lucide-react";
import { cn, formatDate, getImageUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/ui/rating";
import { UserAvatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import type { Review } from "@/types";

interface ReviewSectionProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  className?: string;
}

type SortOption = "recent" | "helpful" | "highest" | "lowest";

function ReviewSection({ reviews, averageRating, totalReviews, className }: ReviewSectionProps) {
  const [sortBy, setSortBy] = React.useState<SortOption>("recent");
  const [showWriteReview, setShowWriteReview] = React.useState(false);
  const [newRating, setNewRating] = React.useState(0);
  const [hoverRating, setHoverRating] = React.useState(0);
  const [reviewTitle, setReviewTitle] = React.useState("");
  const [reviewComment, setReviewComment] = React.useState("");
  const [reviewImages, setReviewImages] = React.useState<string[]>([]);
  const [helpfulClicked, setHelpfulClicked] = React.useState<Set<string>>(new Set());

  const sortedReviews = React.useMemo(() => {
    const sorted = [...reviews];
    switch (sortBy) {
      case "recent":
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case "helpful":
        return sorted.sort((a, b) => b.helpful - a.helpful);
      case "highest":
        return sorted.sort((a, b) => b.rating - a.rating);
      case "lowest":
        return sorted.sort((a, b) => a.rating - b.rating);
      default:
        return sorted;
    }
  }, [reviews, sortBy]);

  const ratingDistribution = React.useMemo(() => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      dist[r.rating as keyof typeof dist]++;
    });
    return dist;
  }, [reviews]);

  const handleHelpful = (reviewId: string) => {
    setHelpfulClicked((prev) => {
      const next = new Set(prev);
      if (next.has(reviewId)) {
        next.delete(reviewId);
      } else {
        next.add(reviewId);
      }
      return next;
    });
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Review submitted! (Demo only)");
    setShowWriteReview(false);
    setNewRating(0);
    setReviewTitle("");
    setReviewComment("");
    setReviewImages([]);
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Customer Reviews</h2>
        <Button variant="outline" size="sm" onClick={() => setShowWriteReview(!showWriteReview)}>
          {showWriteReview ? "Cancel" : "Write a Review"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-[200px_1fr]">
        {/* Rating Summary */}
        <div className="space-y-3 rounded-lg border p-4">
          <div className="text-center">
            <div className="text-5xl font-bold text-foreground">{averageRating}</div>
            <Rating value={averageRating} size="md" className="mt-2 justify-center" />
            <p className="mt-1 text-sm text-muted-foreground">{totalReviews} ratings</p>
          </div>
          <Separator />
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingDistribution[star as keyof typeof ratingDistribution];
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-8 text-right text-muted-foreground">{star} ★</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-xs text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {/* Sort & Filter Bar */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {sortedReviews.length} reviews
            </p>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none rounded-lg border bg-background px-3 py-1.5 pr-8 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="recent">Most Recent</option>
                <option value="helpful">Most Helpful</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {/* Review Cards */}
          {sortedReviews.map((review) => (
            <div key={review._id} className="rounded-lg border p-4 transition-colors hover:bg-muted/30">
              <div className="flex items-start gap-3">
                <UserAvatar name={review.user.name} src={review.user.avatar} size="sm" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{review.user.name}</span>
                    <Rating value={review.rating} size="sm" />
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
                  <h4 className="font-medium text-foreground">{review.title}</h4>
                  <p className="text-sm leading-relaxed text-muted-foreground">{review.comment}</p>

                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 pt-1">
                      {review.images.map((img, i) => (
                        <img
                          key={i}
                          src={getImageUrl(img)}
                          alt={`Review image ${i + 1}`}
                          className="h-20 w-20 rounded-md object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/placeholder.svg";
                          }}
                        />
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => handleHelpful(review._id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      helpfulClicked.has(review._id)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    Helpful ({review.helpful + (helpfulClicked.has(review._id) ? 1 : 0)})
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Write Review Form */}
      {showWriteReview && (
        <div className="rounded-lg border bg-muted/30 p-6">
          <h3 className="mb-4 text-lg font-bold text-foreground">Write Your Review</h3>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Your Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setNewRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={cn(
                        "h-7 w-7 transition-colors",
                        star <= (hoverRating || newRating)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-muted text-muted-foreground"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Review Title</label>
              <input
                type="text"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="Summarize your experience"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Your Review</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience with this product..."
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Add Photos (optional)</label>
              <div className="flex flex-wrap gap-2">
                {reviewImages.map((img, i) => (
                  <div key={i} className="relative h-20 w-20">
                    <img src={img} alt="" className="h-full w-full rounded-md object-cover" onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/placeholder.svg";
                    }} />
                    <button
                      type="button"
                      onClick={() => setReviewImages((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {reviewImages.length < 5 && (
                  <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed text-muted-foreground hover:border-primary hover:text-primary">
                    <Camera className="h-5 w-5" />
                    <span className="mt-1 text-xs">Add</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = URL.createObjectURL(file);
                          setReviewImages((prev) => [...prev, url]);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={newRating === 0 || !reviewTitle || !reviewComment}>
                Submit Review
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowWriteReview(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export { ReviewSection };
