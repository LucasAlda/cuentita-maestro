import { useQuery } from "@tanstack/react-query";
import Head from "next/head";
import { type Cuentita } from "@prisma/client";
import { useRouter } from "next/router";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Cuentita() {
  const router = useRouter();
  const id = router.query.id as string;

  const { data, isError } = useQuery<Cuentita>({
    queryKey: ["/cuentita/info", id],
    enabled: typeof id === "string",
  });

  return (
    <>
      <Head>
        <title>Cuentita Maestro</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="mx-auto w-full max-w-xl space-y-4 py-10">
        {isError ? (
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Cuentita no encontrada!</CardTitle>
              <CardDescription>
                Esta cuentita no existe o no eres miembro de ella.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}
        {data ? <>{data.name}</> : null}
      </main>
    </>
  );
}
