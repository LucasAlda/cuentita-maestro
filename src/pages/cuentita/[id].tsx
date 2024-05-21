import { useQuery } from "@tanstack/react-query";
import Head from "next/head";
import { type Cuentita } from "@prisma/client";
import { useRouter } from "next/router";

export default function Cuentita() {
  const router = useRouter();
  const id = router.query.id as string;

  const { data, isError } = useQuery<Cuentita>({
    queryKey: ["/cuentita/info", id],
    enabled: typeof id === "string",
  });
  if (!data || isError) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Cuentita Maestro</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="mx-auto w-full max-w-xl space-y-4 py-10">
        {data.name}
      </main>
    </>
  );
}
