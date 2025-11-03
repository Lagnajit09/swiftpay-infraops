import { Request, Response } from "express";
import axios from "axios";

type HttpMethod = "get" | "post" | "put" | "delete";

export function proxyRequest(method: HttpMethod, path: string) {
  const AUTH_SERVICE_URL =
    process.env.AUTH_SERVICE_URL || "http://localhost:5001";
  return async (req: Request, res: Response) => {
    try {
      const url = `${AUTH_SERVICE_URL}${path}`;

      // Filter headers - only forward necessary ones
      const headersToForward: any = {
        "content-type": req.headers["content-type"],
        authorization: req.headers["authorization"],
        cookie: req.headers["cookie"],
      };

      // Remove undefined headers
      Object.keys(headersToForward).forEach((key) => {
        if (!headersToForward[key]) {
          delete headersToForward[key];
        }
      });

      const axiosConfig: any = {
        method,
        url,
        headers: headersToForward,
        timeout: 30000,
        validateStatus: () => true,
      };

      // Add params for GET requests
      if (method === "get" && Object.keys(req.query).length > 0) {
        axiosConfig.params = req.query;
      }

      // Add body for POST/PUT/DELETE requests
      if (["post", "put", "delete"].includes(method) && req.body) {
        axiosConfig.data = req.body;
      }

      console.log(`Proxying ${method.toUpperCase()} ${url}`);

      const result = await axios(axiosConfig);

      // Forward response headers (especially cookies)
      if (result.headers["set-cookie"]) {
        res.setHeader("set-cookie", result.headers["set-cookie"]);
      }

      return res.status(result.status).json(result.data);
    } catch (error: any) {
      console.error("Proxy error:", error.message);

      if (error.response) {
        return res.status(error.response.status).json(error.response.data);
      }

      if (error.code === "ECONNREFUSED") {
        return res.status(503).json({
          message: "Auth service unavailable",
          error: "Cannot connect to authentication service",
        });
      }

      if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
        return res.status(504).json({
          message: "Request timeout",
          error: "Auth service took too long to respond",
        });
      }

      return res.status(500).json({
        message: "Proxy error",
        error: error.message,
      });
    }
  };
}
