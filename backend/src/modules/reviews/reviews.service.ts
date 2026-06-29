import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../config/database.config';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findByProduct(productId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId, isApproved: true },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({
        where: { productId, isApproved: true },
      }),
    ]);

    const stats = await this.prisma.review.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const ratingDistribution = await this.prisma.review.groupBy({
      by: ['rating'],
      where: { productId, isApproved: true },
      _count: { rating: true },
      orderBy: { rating: 'desc' },
    });

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        averageRating: stats._avg.rating || 0,
        totalReviews: stats._count.rating,
        distribution: ratingDistribution.map((r) => ({
          rating: r.rating,
          count: r._count.rating,
        })),
      },
    };
  }

  async create(userId: string, dto: CreateReviewDto) {
    const existingReview = await this.prisma.review.findUnique({
      where: { userId_productId: { userId, productId: dto.productId } },
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this product');
    }

    const review = await this.prisma.review.create({
      data: {
        userId,
        productId: dto.productId,
        orderId: dto.orderId || null,
        rating: dto.rating,
        title: dto.title,
        comment: dto.comment,
        images: dto.images || [],
        isVerified: !!dto.orderId,
        isApproved: false,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });

    this.logger.log(`Review created: ${review.id}`);
    return review;
  }

  async update(id: string, userId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id } });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    const updated = await this.prisma.review.update({
      where: { id },
      data: {
        rating: dto.rating,
        title: dto.title,
        comment: dto.comment,
        images: dto.images,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });

    this.logger.log(`Review updated: ${id}`);
    return updated;
  }

  async remove(id: string, userId: string, isAdmin = false) {
    const review = await this.prisma.review.findUnique({ where: { id } });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.prisma.review.delete({ where: { id } });
    this.logger.log(`Review deleted: ${id}`);
    return { message: 'Review deleted successfully' };
  }

  async voteHelpful(reviewId: string, userId: string, isHelpful: boolean) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId === userId) {
      throw new ForbiddenException('You cannot vote on your own review');
    }

    const existingVote = await this.prisma.reviewVote.findUnique({
      where: { reviewId_userId: { reviewId, userId } },
    });

    if (existingVote) {
      if (existingVote.isHelpful === isHelpful) {
        await this.prisma.reviewVote.delete({
          where: { id: existingVote.id },
        });
        await this.prisma.review.update({
          where: { id: reviewId },
          data: {
            helpfulCount: { decrement: 1 },
          },
        });
        return { message: 'Vote removed' };
      }

      await this.prisma.reviewVote.update({
        where: { id: existingVote.id },
        data: { isHelpful },
      });
      return { message: 'Vote updated' };
    }

    await this.prisma.reviewVote.create({
      data: { reviewId, userId, isHelpful },
    });

    if (isHelpful) {
      await this.prisma.review.update({
        where: { id: reviewId },
        data: { helpfulCount: { increment: 1 } },
      });
    }

    return { message: 'Vote recorded' };
  }

  async approve(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const updated = await this.prisma.review.update({
      where: { id },
      data: { isApproved: true },
    });

    this.logger.log(`Review approved: ${id}`);
    return updated;
  }
}
