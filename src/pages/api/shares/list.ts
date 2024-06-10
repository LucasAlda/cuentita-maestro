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

  const shares = await db.share.findMany({
    where: {
      userId: session?.user?.id,
      gastito: {
        NOT: {
          category: "pago",
        },
      },
    },
    include: {
      gastito: true,
    },
    orderBy: {
      gastito: { createdAt: "desc" },
    },
  });

  res.json(
    await Promise.all(
      shares.map(async (share) => {
        const cuentita = await db.cuentita.findUnique({
          where: {
            id: share.gastito?.cuentitaId,
          },
        });

        const gastito_shares = await db.share.findMany({
          where: { gastitoId: share.gastitoId },
        });

        return {
          ...share,
          name: cuentita?.name,
          shares: gastito_shares,
        };
      }),
    ),
  );
}
