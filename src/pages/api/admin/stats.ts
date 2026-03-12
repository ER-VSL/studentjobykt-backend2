import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  const users = await prisma.user.count();
  const vacancies = await prisma.vacancy.count();
  const applications = await prisma.application.count();

  res.status(200).json({
    users,
    vacancies,
    applications
  });
}