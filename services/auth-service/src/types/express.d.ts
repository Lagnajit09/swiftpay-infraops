import express from "express";

declare global {
  namespace Express {
    interface Request {
      serviceInfo?: {
        serviceId: string;
        authenticatedAt: Date;
        ipAddress?: string | undefined;
      };
      user?: {
        id: string;
        email: string;
        number: string;
        role: string;
        walletID: string;
      };
    }
  }
}

export {};
