import { PrismaClient } from '@prisma/client';
import { SocketServer } from '../realtime/SocketServer.js';

export class NotificationService {
  constructor(private readonly _prisma: PrismaClient) {}

  async sendNotification(userId: string, title: string, body: string, data?: any) {
    // 1. Save to database
    const notification = await this._prisma.notification.create({
      data: {
        userId,
        title,
        body,
        data: data || {}
      }
    });

    // 2. Emit realtime socket event
    SocketServer.emitToUser(userId, 'notification', notification);

    // 3. (In future) Send Firebase FCM Push Notification
  }
}
