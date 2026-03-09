import { NextApiRequest, NextApiResponse } from 'next'
import { getUserFromRequest } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = getUserFromRequest(req)
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // GET – получение списка откликов
  if (req.method === 'GET') {
    if (user.role === 'STUDENT') {
      const applications = await prisma.application.findMany({
        where: { studentId: user.userId },
        include: { vacancy: { include: { company: true } } },
        orderBy: { createdAt: 'desc' },
      })
      return res.status(200).json(applications)
    }

    if (user.role === 'EMPLOYER') {
      const company = await prisma.company.findUnique({ where: { userId: user.userId } })
      if (!company) {
        return res.status(400).json({ error: 'Company not found' })
      }
      const applications = await prisma.application.findMany({
        where: { vacancy: { companyId: company.id } },
        include: { student: { select: { id: true, firstName: true, lastName: true, email: true } }, vacancy: true },
        orderBy: { createdAt: 'desc' },
      })
      return res.status(200).json(applications)
    }

    return res.status(403).json({ error: 'Forbidden' })
  }

  // POST – создание отклика (только студент)
  if (req.method === 'POST') {
    if (user.role !== 'STUDENT') {
      return res.status(403).json({ error: 'Only students can apply' })
    }

    const { vacancyId, coverLetter } = req.body
    if (!vacancyId) {
      return res.status(400).json({ error: 'vacancyId required' })
    }

    // Проверяем, не откликался ли уже
    const existing = await prisma.application.findFirst({
      where: { studentId: user.userId, vacancyId },
    })
    if (existing) {
      return res.status(409).json({ error: 'Already applied' })
    }

    const application = await prisma.application.create({
      data: {
        studentId: user.userId,
        vacancyId,
        coverLetter,
      },
    })
    return res.status(201).json(application)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).json({ error: `Method ${req.method} not allowed` })
}