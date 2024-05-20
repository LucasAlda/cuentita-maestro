import { getServerAuthSession } from "@/server/auth";
import { db } from "@/server/db";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    const { id } = req.query;
    const session = await getServerAuthSession({ req, res });
    if (!session) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const cuentita = await db.cuentita.findUnique({
        where: { id: id },
    });
    console.log(`Viewing invitation ${id}`);
    res.status(200).json({ id });
}