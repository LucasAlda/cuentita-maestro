import { calculateBalance } from "@/lib/calculate-balance";
import { getServerAuthSession } from "@/server/auth";
import { db } from "@/server/db";
import { Cuentita, Member, User } from "@prisma/client";
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

  const users = await db.user.findMany({
    where: {
      member: {
        some: {
          cuentitaId: cuentitaId,
        },
      },
    },
  });

  const balances = await Promise.all(
    users.map(async (user) => {
      return { ...user, balance: await calculateBalance(user.id, cuentitaId) };
    }),
  );

  res.json({
    balances,
  });
}
