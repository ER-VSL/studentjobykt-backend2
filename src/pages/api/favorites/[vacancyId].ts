import { NextApiRequest, NextApiResponse } from 'next'
import { getUserFromRequest } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { vacancyId } = req.query
  if (typeof vacancyId !== 'string') {
    return res.status(400).json({ error: 'Invalid vacancy ID' })
  }

  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }

  const user = getUserFromRequest(req)
  if (!user || user.role !== 'STUDENT') {
    return res.status(401).json({ error: 'Unauthorized or not student' })
  }

  await prisma.favorite.delete({
    where: {
      studentId_vacancyId: {
        studentId: user.userId,
        vacancyId,
      },
    },
  })

  res.status(204).end()
}