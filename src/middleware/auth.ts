import jwt from "jsonwebtoken";

export function requireAuth(req: any) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new Error("Unauthorized");
  }

  const token = authHeader.split(" ")[1];

  const user = jwt.verify(token, process.env.JWT_SECRET as string);

  return user;
}