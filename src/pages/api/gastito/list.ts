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

  const cuentitaId = req.query.cuentitaId as string;
  const cuentitas = await db.gastito.findMany({
    where: {
      cuentitaId,
    },
    include: {
      owner: true,
      shares: true,
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(
    cuentitas.map((cuentita) => ({
      ...cuentita,
      balance: Math.random() * 1000 - 500,
    })),
  );
}
