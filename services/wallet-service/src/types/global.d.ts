// src/types/global.d.ts
import express from "express";

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email?: string;
        number?: string;
        role?: string;
        walletID?: string;
        isAuthenticated?: true;
      };
      serviceAuth?: {
        serviceId: string;
      };
    }
  }
}

export {};
