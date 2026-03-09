import { NextApiRequest, NextApiResponse } from 'next'
import { getUserFromRequest } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid vacancy ID' })
  }

  // GET – публичный доступ
  if (req.method === 'GET') {
    const vacancy = await prisma.vacancy.findUnique({
      where: { id },
      include: { company: true, category: true },
    })
    if (!vacancy) {
      return res.status(404).json({ error: 'Vacancy not found' })
    }
    return res.status(200).json(vacancy)
  }

  // Для остальных методов нужна аутентификация
  const user = getUserFromRequest(req)
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Найдём вакансию и проверим права
  const vacancy = await prisma.vacancy.findUnique({
    where: { id },
    include: { company: true },
  })
  if (!vacancy) {
    return res.status(404).json({ error: 'Vacancy not found' })
  }

  // Проверка прав: владелец (работодатель) или админ
  const isOwner = user.role === 'EMPLOYER' && vacancy.company.userId === user.userId
  if (!isOwner && user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  // PUT – обновление вакансии
  if (req.method === 'PUT') {
    const { title, description, categoryId, employmentType, salaryFrom, salaryTo, experience, location, isActive } = req.body
    const updated = await prisma.vacancy.update({
      where: { id },
      data: { title, description, categoryId, employmentType, salaryFrom, salaryTo, experience, location, isActive },
    })
    return res.status(200).json(updated)
  }

  // DELETE – удаление вакансии
  if (req.method === 'DELETE') {
    await prisma.vacancy.delete({ where: { id } })
    return res.status(204).end()
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  res.status(405).json({ error: `Method ${req.method} not allowed` })
}