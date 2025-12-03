// Extend Express Request type to include service info
declare global {
  namespace Express {
    interface Request {
      serviceInfo?: {
        serviceId: string;
        authenticatedAt: Date;
        ipAddress?: string;
      };
    }
  }
}

export {};
