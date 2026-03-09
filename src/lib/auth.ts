import { NextApiRequest } from 'next'
import jwt from 'jsonwebtoken'

export interface TokenPayload {
  userId: string
  email: string
  role: string
}

export function getUserFromRequest(req: NextApiRequest): TokenPayload | null {
  // Пытаемся получить токен из cookie
  let token = req.cookies.token

  // Если нет в cookie, пробуем заголовок Authorization
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
  }

  if (!token) return null

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload
    return decoded
  } catch {
    return null
  }
}