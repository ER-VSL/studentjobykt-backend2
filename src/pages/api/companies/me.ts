import { NextApiRequest, NextApiResponse } from 'next'
import { getUserFromRequest } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = getUserFromRequest(req)
  if (!user || user.role !== 'EMPLOYER') {
    return res.status(401).json({ error: 'Unauthorized or not an employer' })
  }

  // GET – получение профиля
  if (req.method === 'GET') {
    const company = await prisma.company.findUnique({
      where: { userId: user.userId },
      include: { vacancies: true },
    })
    if (!company) {
      return res.status(404).json({ error: 'Company profile not found' })
    }
    return res.status(200).json(company)
  }

  // PUT – обновление профиля
  if (req.method === 'PUT') {
    const { name, description, industry, contactEmail, phone, website, logo } = req.body
    if (!name) {
      return res.status(400).json({ error: 'Company name is required' })
    }
    const updated = await prisma.company.update({
      where: { userId: user.userId },
      data: { name, description, industry, contactEmail, phone, website, logo },
    })
    return res.status(200).json(updated)
  }

  res.setHeader('Allow', ['GET', 'PUT'])
  res.status(405).json({ error: `Method ${req.method} not allowed` })
}