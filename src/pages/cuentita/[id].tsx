/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Head from "next/head";
import { type Gastito, type User, type Cuentita } from "@prisma/client";
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "next-auth/react";
import { numberFormatter } from "..";
import { Ellipsis } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";

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
                  <Button
                    variant="secondary"
                    onClick={() => alert("Proximamente...")}
                  >
                    Editar
                  </Button>
                  <Button onClick={() => alert("Proximamente...")}>
                    Miembros
                  </Button>
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
                    <AddGastitoDialog />
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

type CreateResponse =
  | { success: true }
  | { success: false; errors: string[] }
  | undefined;

type Shares = Record<string, number>;

function AddGastitoDialog() {
  const router = useRouter();
  const cuentitaId = router.query.id as string;
  const ownerId = useSession().data?.user.id!;

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState<number>();
  const [response, setResponse] = useState<CreateResponse>();
  const [repetition, setRepetition] = useState("unico");
  const [shares, setShares] = useState<Shares>();

  const ctx = useQueryClient();

  const { data: cuentitaInfo, isLoading } = useQuery<
    Cuentita & {
      members: User[];
    }
  >({
    queryKey: ["/cuentita/info", cuentitaId],
    enabled: typeof cuentitaId === "string",
  });

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const defaultShares: Shares = {};

    cuentitaInfo?.members.forEach(({ id }) => {
      defaultShares[id] = 1;
    });

    setShares(defaultShares);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const handleSubmit = () => {
    fetch("/api/gastito/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cuentitaId,
        name,
        category,
        amount,
        repetition,
        ownerId,
        shares,
      }),
    })
      .then((res) => res.json())
      .then((data: CreateResponse) => {
        setResponse(data);
        if (data?.success) {
          setOpen(false);
          ctx.invalidateQueries();
        }
      });
  };

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setName("");
        setCategory("");
        setAmount(0);
        setResponse(undefined);
      }, 300);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">+ Agregar gastito</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar gastito</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              placeholder="Cancha 24/5"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="monto">Monto</Label>
            <Input
              id="monto"
              value={amount}
              type="number"
              onChange={(e) => setAmount(e.target.valueAsNumber)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="categoria" className="text-right">
              Categoría
            </Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value)}
            >
              <SelectTrigger id="categoria" className="col-span-3">
                <SelectValue placeholder="Selecciona una Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="varios">Varios</SelectItem>
                <SelectItem value="supermercado">Supermercado</SelectItem>
                <SelectItem value="hogar">Hogar</SelectItem>
                <SelectItem value="alquiler">Alquiler</SelectItem>
                <SelectItem value="gasolina">Gasolina</SelectItem>
                <SelectItem value="viaje">Viaje</SelectItem>
                <SelectItem value="salida">Salida</SelectItem>
                <SelectItem value="entretenimiento">Entretenimiento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="categoria" className="text-right">
              Recurrencia
            </Label>
            <Select
              value={repetition}
              onValueChange={(value) => setRepetition(value)}
            >
              <SelectTrigger id="categoria" className="col-span-3">
                <SelectValue placeholder="Recurrencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unico">Unico</SelectItem>
                <SelectItem value="semanal">Semanal</SelectItem>
                <SelectItem value="mensual">Mensual</SelectItem>
                <SelectItem value="trimestral">Trimestral</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="categoria" className="text-right">
              Partes
            </Label>
            <div className="space-y-2">
              {cuentitaInfo?.members.map((user) => {
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={Boolean(shares?.[user.id])}
                        onCheckedChange={(checked) => {
                          setShares((shares) => {
                            const newShares = {
                              ...shares,
                            };
                            if (checked) {
                              newShares[user.id] = 1;
                            } else {
                              delete newShares[user.id];
                            }
                            return newShares;
                          });
                        }}
                      />
                      <p>{user.name}</p>
                    </div>
                    <Input
                      className="h-8 w-24"
                      value={shares?.[user.id] ?? ""}
                      type="number"
                      onChange={(e) => {
                        setShares((shares) => {
                          const newShares = { ...shares };
                          newShares[user.id] = e.target.valueAsNumber;
                          return newShares;
                        });
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {response?.success === false && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm">
            <ul className="list-inside list-disc text-red-600">
              {response.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSubmit}>Crear</Button>
        </DialogFooter>{" "}
      </DialogContent>
    </Dialog>
  );
}

function MovementsList() {
  const router = useRouter();
  const cuentitaId = router.query.id as string;

  const { data: gastitos, isError: gastitosIsError } = useQuery<
    (Gastito & {
      owner: User;
    })[]
  >({
    queryKey: [`/gastito/list?cuentitaId=${cuentitaId}`],
  });

  if (!gastitos || gastitosIsError) {
    return null;
  }

  return (
    <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
      {gastitos.length === 0 && (
        <div className="py-10 text-center text-sm italic text-slate-500">
          No hay movimientos
        </div>
      )}
      {gastitos.map((gastito) => (
        <div
          key={gastito.id}
          className="flex w-full items-center justify-between px-6 py-3 text-left hover:bg-slate-50"
        >
          <div>
            <h3 className="font-semibold">{gastito.name}</h3>
            <p className="text-sm text-slate-500">
              <span className="capitalize">{gastito.category}</span> - Pagado
              por {gastito.owner.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <p>{numberFormatter.format(Number(gastito.amount))}</p>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="ghost" size="icon">
                  <Ellipsis className="h-4 w-4 text-slate-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    alert("Proximamente...");
                  }}
                >
                  Borrar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
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
