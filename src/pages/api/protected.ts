import { getServerAuthSession } from "@/server/auth";
import { type NextApiRequest, type NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // if (req.method !== "GET") {
  //   res.status(404).send("No encontrado");
  //   return;
  // }
  const session = await getServerAuthSession({ req, res });

  if (!session?.user) {
    res.status(403).json({ msg: "Ruta privada" });
    return;
  }

  res.json({
    msg: `Sabemos quien sos ${session.user.name}`,
    user: session.user,
  });
}
