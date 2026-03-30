import { NotificationChannel } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function notifyUser(userId: string, title: string, message: string, channel: NotificationChannel = "IN_APP", metaJson?: unknown) {
  return prisma.notification.create({
    data: { userId, title, message, channel, sentAt: new Date(), metaJson: metaJson as never },
  });
}
