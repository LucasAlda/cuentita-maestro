import { calculateBalance } from "@/lib/calculate-balance";
import { getServerAuthSession } from "@/server/auth";
import { db } from "@/server/db";
import { type NextApiRequest, type NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerAuthSession({ req, res });
  if (!session) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const cuentitaId = req.body.cuentitaId as string;

  const balance = await calculateBalance(req.query.id as string, cuentitaId);
  if (balance !== 0) {
    res.status(400).json({ message: "No se puede sacar a alguien con saldo" });
    return;
  }

  await db.member.deleteMany({
    where: { userId: req.query.id as string, cuentitaId: cuentitaId },
  });

  const memberCount = await db.member.count({
    where: { cuentitaId: cuentitaId },
  });

  if (memberCount === 0) {
    await db.cuentita.delete({ where: { id: cuentitaId } });
  }

  res.json({ success: true });
}
