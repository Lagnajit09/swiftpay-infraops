import prisma from "../lib/db";

// Security event logger
export const logSecurityEvent = async (data: {
  userId?: string;
  email?: string;
  eventType: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}) => {
  try {
    await prisma.securityLog.create({
      data: {
        ...data,
        eventType: data.eventType as any,
      },
    });
  } catch (error) {
    console.error("Failed to log security event:", error);
  }
};
