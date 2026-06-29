import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../config/database.config';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId, balance: 0 },
      });
    }

    return wallet;
  }

  async addFunds(userId: string, amount: number, description?: string, reference?: string) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const wallet = await this.getWallet(userId);

    const [updatedWallet, transaction] = await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      }),
      this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: 'CREDIT',
          reference,
          description: description || `Added ₹${amount} to wallet`,
        },
      }),
    ]);

    this.logger.log(`₹${amount} added to wallet for user ${userId}`);

    try {
      await this.notificationsService.create(
        userId,
        'Money Added to Wallet 💰',
        `₹${amount} has been added to your wallet. New balance: ₹${updatedWallet.balance}`,
        'WALLET',
        { link: '/account/wallet', transactionId: transaction.id },
      );
    } catch (e) {
      this.logger.warn('Failed to create wallet notification', e as any);
    }

    return {
      wallet: updatedWallet,
      transaction,
    };
  }

  async deductFunds(userId: string, amount: number, description?: string, reference?: string) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const wallet = await this.getWallet(userId);

    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const [updatedWallet, transaction] = await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      }),
      this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: 'DEBIT',
          reference,
          description: description || `Deducted ₹${amount} from wallet`,
        },
      }),
    ]);

    this.logger.log(`₹${amount} deducted from wallet for user ${userId}`);

    return {
      wallet: updatedWallet,
      transaction,
    };
  }

  async getTransactions(userId: string, page = 1, limit = 20) {
    const wallet = await this.getWallet(userId);
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.walletTransaction.count({
        where: { walletId: wallet.id },
      }),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
