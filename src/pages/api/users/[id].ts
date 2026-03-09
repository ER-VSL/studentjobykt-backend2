import { NextApiRequest, NextApiResponse } from 'next'
import { getUserFromRequest } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid user ID' })
  }

  const currentUser = getUserFromRequest(req)
  if (!currentUser) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Проверка прав: только сам пользователь или админ
  if (currentUser.userId !== id && currentUser.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  // GET – получение данных пользователя
  if (req.method === 'GET') {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
      },
    })
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    return res.status(200).json(user)
  }

  // PUT – обновление данных пользователя
  if (req.method === 'PUT') {
    const { firstName, lastName, phone } = req.body
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { firstName, lastName, phone },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
    })
    return res.status(200).json(updatedUser)
  }

  res.setHeader('Allow', ['GET', 'PUT'])
  res.status(405).json({ error: `Method ${req.method} not allowed` })
}