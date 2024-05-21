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
      Member: {
        some: {
          userId: session?.user?.id,
        },
      },
    },
  });

  res.json(
    cuentitas.map((cuentita) => ({
      ...cuentita,
      balance: Math.random() * 1000 - 500,
    })),
  );
}
