import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { Prisma, EmploymentType } from "@prisma/client";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const { search, category, employmentType, salaryMin, salaryMax } = req.query;

    const where: Prisma.VacancyWhereInput = {
      isActive: true,
    };

    // Поиск
    if (typeof search === "string") {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Фильтр по категории
    if (typeof category === "string") {
      where.categoryId = category;
    }

    // Фильтр по типу занятости
    if (typeof employmentType === "string") {
      where.employmentType = employmentType as EmploymentType;
    }

    // Минимальная зарплата
    if (typeof salaryMin === "string") {
      where.salaryFrom = { gte: Number(salaryMin) };
    }

    // Максимальная зарплата
    if (typeof salaryMax === "string") {
      where.salaryTo = { lte: Number(salaryMax) };
    }

    const vacancies = await prisma.vacancy.findMany({
      where,
      include: {
        company: {
          select: {
            name: true,
            logo: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      data: vacancies,
    });
  } catch (error) {
    console.error("Error fetching vacancies:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}