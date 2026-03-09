import { NextApiRequest, NextApiResponse } from 'next'
import { getUserFromRequest } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = getUserFromRequest(req)
  if (!user || user.role !== 'STUDENT') {
    return res.status(401).json({ error: 'Unauthorized or not student' })
  }

  // GET – список избранных вакансий
  if (req.method === 'GET') {
    const favorites = await prisma.favorite.findMany({
      where: { studentId: user.userId },
      include: { vacancy: { include: { company: true } } },
    })
    // Возвращаем только вакансии (без служебных полей)
    return res.status(200).json(favorites.map(f => f.vacancy))
  }

  // POST – добавить вакансию в избранное
  if (req.method === 'POST') {
    const { vacancyId } = req.body
    if (!vacancyId) {
      return res.status(400).json({ error: 'vacancyId required' })
    }

    // Проверяем, существует ли вакансия
    const vacancy = await prisma.vacancy.findUnique({ where: { id: vacancyId } })
    if (!vacancy) {
      return res.status(404).json({ error: 'Vacancy not found' })
    }

    // Проверяем, не добавлена ли уже
    const existing = await prisma.favorite.findUnique({
      where: {
        studentId_vacancyId: { studentId: user.userId, vacancyId },
      },
    })
    if (existing) {
      return res.status(409).json({ error: 'Already in favorites' })
    }

    const favorite = await prisma.favorite.create({
      data: { studentId: user.userId, vacancyId },
    })
    return res.status(201).json(favorite)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).json({ error: `Method ${req.method} not allowed` })
}