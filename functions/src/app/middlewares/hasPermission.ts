import { NextFunction, Request, Response } from "express";

export const hasPermission = (permission: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRoles = (req as any).decoded.roles;

    if (
      userRoles.some((role: string) => permission.includes(role.toLowerCase()))
    ) {
      return next();
    } else {
      return res.status(401).send("Unauthorized");
    }
  };
};
