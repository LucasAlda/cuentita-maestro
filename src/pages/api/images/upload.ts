import { env } from "@/env";
import { getServerAuthSession } from "@/server/auth";
import { db } from "@/server/db";
import { randomUUID } from "crypto";
import { rename } from "fs/promises";
import { formidable } from "formidable";
import { type NextApiRequest, type NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  const session = await getServerAuthSession({ req, res });
  if (!session) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const form = formidable({
    uploadDir: env.UPLOAD_DIR,
    filename: () => randomUUID(),
  });

  form.parse(req, (_err, fields, files) => {
    const file = files.file![0];
    const extension = file.originalFilename?.split(".").pop();

    const filename = extension
      ? `${file.newFilename}.${extension}`
      : file.newFilename;

    if (extension) {
      rename(file.filepath, file.filepath + "." + extension);
    }

    const url = env.UPLOAD_URL + "/" + filename;

    db.gastito
      .update({
        data: {
          imageUrl: url,
        },
        where: {
          id: fields.gastitoId?.[0],
        },
      })
      .then(() => {
        res.status(200).json({ url });
      });
  });
}
