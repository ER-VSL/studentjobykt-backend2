import { NextApiRequest, NextApiResponse } from 'next'
import { getUserFromRequest } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid application ID' })
  }

  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }

  const user = getUserFromRequest(req)
  if (!user || user.role !== 'EMPLOYER') {
    return res.status(401).json({ error: 'Unauthorized or not employer' })
  }

  const application = await prisma.application.findUnique({
    where: { id },
    include: { vacancy: { include: { company: true } } },
  })
  if (!application) {
    return res.status(404).json({ error: 'Application not found' })
  }

  // Проверяем, что вакансия принадлежит компании этого работодателя
  if (application.vacancy.company.userId !== user.userId) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { status } = req.body
  if (!['PENDING', 'INVITED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' })
  }

  const updated = await prisma.application.update({
    where: { id },
    data: { status },
  })
  res.status(200).json(updated)
}