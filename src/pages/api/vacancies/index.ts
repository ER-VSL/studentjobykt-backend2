import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { Prisma } from '@prisma/client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Разрешаем только GET-запросы
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }

  try {
    const { search, category, employmentType, salaryMin, salaryMax } = req.query

    // Строим объект фильтрации с правильным типом
    const where: Prisma.VacancyWhereInput = { isActive: true }

    if (search && typeof search === 'string') {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (category && typeof category === 'string') {
      where.categoryId = category
    }

    if (employmentType && typeof employmentType === 'string') {
      // Приводим к ожидаемому типу enum
      where.employmentType = employmentType as Prisma.EnumEmploymentTypeFilter
    }

    if (salaryMin && typeof salaryMin === 'string') {
      where.salaryFrom = { gte: parseInt(salaryMin) }
    }

    if (salaryMax && typeof salaryMax === 'string') {
      where.salaryTo = { lte: parseInt(salaryMax) }
    }

    const vacancies = await prisma.vacancy.findMany({
      where,
      include: {
        company: { select: { name: true, logo: true } },
        category: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return res.status(200).json({ data: vacancies })
  } catch (error) {
    console.error('Error fetching vacancies:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}