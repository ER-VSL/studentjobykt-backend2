import { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password, firstName, lastName, role } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return res.status(409).json({ error: 'User already exists' })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashedPassword,
      firstName,
      lastName,
      role: role || 'STUDENT',
    },
  })

  // Если работодатель – создаём пустую запись компании
  if (role === 'EMPLOYER') {
    await prisma.company.create({
      data: { userId: user.id, name: '' },
    })
  }

  // Не возвращаем пароль
  const { passwordHash, ...userWithoutPassword } = user
  res.status(201).json(userWithoutPassword)
}