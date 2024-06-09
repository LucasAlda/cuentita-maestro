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

  const cuentitas = await db.cuentita.findMany({
    where: {
      member: {
        some: {
          userId: session?.user?.id,
        },
      },
    },
  });

  res.json(
    await Promise.all(
      cuentitas.map(async (cuentita) => {
        const shares = await db.share.findMany({
          where: {
            gastito: {
              cuentitaId: cuentita.id,
            },
            userId: session.user.id,
          },
        });
        const ownedGastitos = await db.gastito.aggregate({
          where: {
            ownerId: session.user.id,
            cuentitaId: cuentita.id,
          },
          _sum: {
            amount: true,
          },
        });
        const ownedAmount = Number(ownedGastitos._sum.amount ?? 0);
        const sharesAmount = shares.reduce(
          (balance: number, share) => balance + Number(share.amount),
          0,
        );

        const users = await db.user.findMany({
          where: {
            member: {
              some: {
                cuentitaId: cuentita.id,
              },
            },
          },
        });

        return {
          ...cuentita,
          users: users,
          balance: ownedAmount - sharesAmount,
        };
      }),
    ),
  );
}
