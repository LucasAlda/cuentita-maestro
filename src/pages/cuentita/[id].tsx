import { useQuery } from "@tanstack/react-query";
import Head from "next/head";
import { type Cuentita } from "@prisma/client";
import { useRouter } from "next/router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

      <Card className="mx-auto mt-10 w-full max-w-2xl">
        <CardContent className="p-6">
          {data ? (
            <>
              <div className="flex items-center justify-between pb-8">
                <div>
                  <h1 className="text-2xl font-semibold">{data.name}</h1>
                  <p className="text-sm text-slate-600">
                    <span className="capitalize">{data.category}</span> - Creada
                    el {format(new Date(data.createdAt), "dd/MM/yyyy")}
                    {data.inflation ? " - Ajustado por inflación" : null}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary">Editar</Button>
                  <Button>Miembros</Button>
                </div>
              </div>

              <Tabs defaultValue="movements">
                <div className="flex items-center justify-between">
                  <TabsList className="h-10">
                    <TabsTrigger value="movements" className="h-8">
                      Movimientos
                    </TabsTrigger>
                    <TabsTrigger value="balances" className="h-8">
                      Balances
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="movements">
                    <Button variant="outline">+ Agregar gastito</Button>
                  </TabsContent>
                  <TabsContent value="balances">
                    <Button variant="outline">Saldar Deuda</Button>
                  </TabsContent>
                </div>
                <TabsContent value="movements">
                  <MovementsList />
                </TabsContent>
                <TabsContent className="min-h-32" value="balances">
                  <Balances />
                </TabsContent>
              </Tabs>
            </>
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}

function MovementsList() {
  return (
    <div className="flex min-h-32 items-center justify-center text-center italic">
      Movements (Proximamente)
    </div>
  );
}

function Balances() {
  return (
    <div className="flex min-h-32 items-center justify-center text-center italic">
      Balances (Proximamente)
    </div>
  );
}
