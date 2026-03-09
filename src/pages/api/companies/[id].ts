import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid company ID' })
  }

  if (req.method === 'GET') {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        vacancies: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!company) {
      return res.status(404).json({ error: 'Company not found' })
    }
    return res.status(200).json(company)
  }

  res.setHeader('Allow', ['GET'])
  res.status(405).json({ error: `Method ${req.method} not allowed` })
}