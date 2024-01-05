// authMiddleware.ts
import { NextFunction, Request, Response } from "express";

export const hasRole = (req: Request, res: Response, next: NextFunction) => {
  const userRoles: string[] = (req as any).decoded?.roles || [];

  console.log("roles:", userRoles);
  if (userRoles.includes("admin")) {
    next();
  } else {
    res
      .status(403)
      .json({ message: "Permission denied. Admin role required." });
  }
};
