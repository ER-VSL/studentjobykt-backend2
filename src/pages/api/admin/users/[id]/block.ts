import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {

  const { id } = req.query;

  const user = await prisma.user.update({
    where: { id: Number(id) },
    data: { banned: true }
  });

  res.json(user);
}