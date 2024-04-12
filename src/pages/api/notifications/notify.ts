import { sendNotification } from "@/server/notify";
import { type NextApiRequest, type NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.end();
    return;
  }
  const { id, ...msg } = req.query as {
    id: string;
    title: string;
    message: string;
  };

  const sucess = await sendNotification(id, msg);

  if (sucess) {
    res.json({ success: true });
  } else {
    res.status(500).json({ success: false });
  }
}
