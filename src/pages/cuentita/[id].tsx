/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Head from "next/head";
import {
  type Gastito,
  type User,
  type Cuentita,
  type Share,
} from "@prisma/client";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import React, { useEffect, useState } from "react";
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
import { Copy, Trash2, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { requestConfirmation } from "@/lib/request-confirmation";
import { toast } from "sonner";

export default function Cuentita() {
  const router = useRouter();
  const id = router.query.id as string;

  const { data, isError } = useQuery<Cuentita>({
    queryKey: ["/cuentita/info", id],
    enabled: typeof id === "string",
  });

  if (isError) {
    return (
      <Card className="mx-auto mt-10 w-full max-w-md">
        <CardHeader>
          <CardTitle>Cuentita no encontrada!</CardTitle>
          <CardDescription>
            Esta cuentita no existe o no eres miembro de ella.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Head>
        <title>Cuentita Maestro</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
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
                  <EditCuentitaDialog />
                  <EditMembersDialog />
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

function EditMembersDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const cuentitaId = router.query.id as string;

  const invitationLink = `${window.location.origin}/invite/${cuentitaId}`;

  function copy() {
    navigator.clipboard.writeText(invitationLink);
    toast("Link copiado al portapapeles!");
  }

  const ctx = useQueryClient();

  const { data: cuentitaInfo } = useQuery<
    Cuentita & {
      members: User[];
    }
  >({
    queryKey: ["/cuentita/info", cuentitaId],
    enabled: typeof cuentitaId === "string",
  });

  async function handleDelete(memberId: string) {
    const confirmation = await requestConfirmation({
      title: "Seguro querés borrar a este miembro?",
      description:
        "Podes mandarle el link de invitación para que vuelva a unirse.",
      action: { variant: "destructive", label: "Borrar" },
    });
    if (!confirmation) {
      return;
    }
    fetch("/api/cuentita/kick/" + memberId, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cuentitaId }),
    })
      .then(async (res) => {
        if (!res.ok) {
          throw await res.json();
        }
        return res.json();
      })
      .then((data: CreateResponse) => {
        if (data?.success) {
          toast("Miembro eliminado exitosamente!");
          ctx.invalidateQueries();
        }
      })
      .catch((error) => {
        toast.error(error.message as string);
      });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Miembros</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Miembros de la Cuentita</DialogTitle>
          <DialogDescription>
            Utilize el enlace para invitar a mas miembros o seleccione abajo
            para eliminar a un miembro ya existente.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1">
            <h3 className="font-semibold">Enlace de Invitacion</h3>
            <div className="flex gap-1">
              <Input id="Link" value={invitationLink} readOnly />
              <Button size={"icon"} variant="outline" onClick={copy}>
                <Copy className="h-4 w-4 text-slate-600" />
              </Button>
            </div>
          </div>
          <div className="pt-4">
            <h3 className="font-semibold">Miembros</h3>
            {cuentitaInfo?.members.map((user) => {
              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-2 rounded-md hover:bg-slate-100"
                >
                  <p className="pl-2 text-sm">{user.name}</p>
                  <Button
                    size={"icon"}
                    variant="ghost"
                    className="hover:bg-red-100"
                    onClick={() => handleDelete(user.id)}
                  >
                    <X className="h-5 w-5 text-red-500" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
        <DialogFooter className="flex pt-2 sm:justify-end">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditCuentitaDialog() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [inflation, setInflation] = useState(false);
  const [response, setResponse] = useState<CreateResponse>();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const cuentitaId = router.query.id as string;

  const ctx = useQueryClient();

  const { data, isError } = useQuery<Cuentita>({
    queryKey: ["/cuentita/info", cuentitaId],
    enabled: typeof cuentitaId === "string",
  });

  useEffect(() => {
    if (open) {
      if (!data || isError) {
        return;
      }
      setName(data?.name);
      setCategory(data?.category);
      setInflation(data?.inflation);
      setResponse(undefined);
    }
  }, [open, data, isError]);

  const handleSubmit = () => {
    fetch("/api/cuentita/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cuentitaId, name, category, inflation }),
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

  async function handleDelete() {
    const confirmation = await requestConfirmation({
      title: "Seguro querés borrar?",
      description:
        "Cuidado que no se puede recuperar, pero podés volver a crearlo",
      action: { variant: "destructive", label: "Borrar" },
    });
    if (!confirmation) {
      return;
    }
    fetch("/api/cuentita/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cuentitaId }),
    })
      .then((res) => res.json())
      .then((data: CreateResponse) => {
        setResponse(data);
        if (data?.success) {
          router.push("/");
          setOpen(false);
          ctx.invalidateQueries();
        }
      });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Editar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Cuentita</DialogTitle>
          <DialogDescription>
            Configure los datos de la cuentita.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              placeholder="Futbol 5 de los domingos"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
                <SelectItem value="evento">Evento</SelectItem>
                <SelectItem value="familia">Familia</SelectItem>
                <SelectItem value="amigos">Amigos</SelectItem>
                <SelectItem value="deporte">Deporte</SelectItem>
                <SelectItem value="hogar">Hogar</SelectItem>
                <SelectItem value="viaje">Viaje</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2 pt-4">
            <Checkbox
              id="terms"
              checked={inflation}
              onCheckedChange={(checked) =>
                checked !== "indeterminate" && setInflation(checked)
              }
            />
            <label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Ajustar por inflación
            </label>
            <span className="text-xs text-slate-500">(Proximamente)</span>
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
        <DialogFooter className="flex pt-2 sm:justify-between">
          <div>
            <Button
              variant={"outline"}
              size={"icon"}
              className="hover:bg-red-50"
              onClick={handleDelete}
            >
              <Trash2 className="h-5 w-5 text-red-500" />
            </Button>
          </div>
          <div className="flex gap-1 ">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSubmit}>Confirmar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Gastito({
  gastito,
}: {
  gastito: Gastito & {
    owner: User;
    shares: Share[];
  };
}) {
  const session = useSession();
  const { data: cuentitaInfo } = useQuery<
    Cuentita & {
      members: User[];
    }
  >({
    queryKey: ["/cuentita/info", gastito.cuentitaId],
  });

  const [open, setOpen] = useState(false);
  const ctx = useQueryClient();

  async function handleDelete() {
    const confirmation = await requestConfirmation({
      title: "Seguro querés borrar?",
      description:
        "Cuidado que no se puede recuperar, pero podés volver a crearlo",
      action: { variant: "destructive", label: "Borrar" },
    });
    if (!confirmation) {
      return;
    }
    fetch("/api/gastito/delete", {
      method: "POST",
      body: JSON.stringify({ gastitoId: gastito.id }),
      headers: { "Content-Type": "application/json" },
    }).then(() => {
      toast("Gastito borrado exitosamente!");
      ctx.invalidateQueries();
      setOpen(false);
    });
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <GastitoTrigger gastito={gastito} />
      <DialogContent className="max-w-sm gap-5">
        <DialogHeader>
          <DialogTitle>{gastito.name}</DialogTitle>
          <DialogDescription>
            <span className="capitalize">{gastito.category}</span> -{" "}
            {format(gastito.createdAt, "dd/MM/yyyy")}
          </DialogDescription>
        </DialogHeader>
        <h3 className="font-bold">Detalle</h3>
        <div className="-mt-3 space-y-0.5 text-sm text-slate-700">
          <p>Monto: {numberFormatter.format(Number(gastito.amount))}</p>
          <p>Pagado por: {gastito.owner.name}</p>
          <p className="capitalize">Recurrencia: {gastito.repetition}</p>
        </div>
        <h3 className=" font-bold">Participantes </h3>
        <div className="-mt-3 space-y-0.5 text-sm text-slate-700">
          {gastito.shares.map((share) => {
            const member = cuentitaInfo?.members.find((member) => {
              return member.id === share.userId;
            });
            return (
              <div
                key={share.id}
                className={
                  "flex justify-between" +
                  (share.userId === session.data?.user.id ? " font-bold" : "")
                }
              >
                <div>{member?.name}</div>
                <div> {numberFormatter.format(Number(share.amount))}</div>
              </div>
            );
          })}
        </div>
        <DialogFooter className="flex pt-2 sm:justify-between">
          <Button
            variant={"outline"}
            size={"icon"}
            className="hover:bg-red-50"
            onClick={handleDelete}
          >
            <Trash2 className="h-5 w-5 text-red-500" />
          </Button>
          <DialogClose asChild>
            <Button variant={"outline"}>Cerrar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GastitoTrigger({
  gastito,
}: {
  gastito: Gastito & {
    owner: User;
    shares: Share[];
  };
}) {
  const session = useSession();
  const share = gastito.shares.find(
    (share) => share.userId === session.data?.user.id,
  );
  const isOwner = gastito.ownerId === session.data?.user.id;

  let shareTag;

  if (share == undefined) {
    shareTag = <></>;
  } else if (isOwner) {
    shareTag = (
      <p className="text-sm text-green-600">
        +
        {numberFormatter.format(Number(gastito.amount) - Number(share?.amount))}
      </p>
    );
  } else {
    shareTag = (
      <p className="text-sm text-red-500">
        -{numberFormatter.format(Number(share?.amount))}
      </p>
    );
  }

  return (
    <DialogTrigger asChild>
      <button
        key={gastito.id}
        className="flex w-full items-center justify-between px-6 py-3 text-left hover:bg-slate-50"
      >
        <div>
          <h3 className="font-semibold">{gastito.name}</h3>
          <p className="text-sm text-slate-500">
            <span className="capitalize">{gastito.category}</span> - Pagado por{" "}
            {gastito.owner.name}
          </p>
        </div>
        <div className="flex flex-col items-end">
          <p>{numberFormatter.format(Number(gastito.amount))}</p>
          {shareTag}
        </div>
      </button>
    </DialogTrigger>
  );
}

function MovementsList() {
  const router = useRouter();
  const cuentitaId = router.query.id as string;

  const { data: gastitos, isError: gastitosIsError } = useQuery<
    (Gastito & {
      owner: User;
      shares: Share[];
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
        <Gastito gastito={gastito} key={gastito.id} />
      ))}
    </div>
  );
}

function Balances() {
  const router = useRouter();
  const cuentitaId = router.query.id as string;
  const { data } = useQuery<
    Cuentita & { users: (User & { balance: number })[] }
  >({
    queryKey: ["/cuentita/info", cuentitaId],
  });

  const maxBalance = data
    ? Math.max(...data.users.map((u) => Math.abs(u.balance))) || 1000
    : 1000;

  return (
    <div className="grid grid-cols-2 gap-y-2">
      {data?.users.map((user) => {
        const percentage = (Math.abs(user.balance) / maxBalance) * 100;

        if (user.balance >= 0) {
          return (
            <React.Fragment key={user.id}>
              <div className="self-center justify-self-end pr-2 text-sm">
                {user.name}
              </div>
              <div
                style={{ width: `${percentage}%` }}
                className={`self-center justify-self-start rounded px-2 py-1 text-sm ${user.balance > 0 ? "bg-green-400" : "bg-slate-300"}`}
              >
                {numberFormatter.format(user.balance)}
              </div>
            </React.Fragment>
          );
        }

        return (
          <React.Fragment key={user.id}>
            <div
              style={{ width: `${percentage}%` }}
              className="flex justify-end self-center justify-self-end rounded bg-red-400 px-2 py-1 text-right text-sm"
            >
              {numberFormatter.format(user.balance)}
            </div>
            <div className="self-center justify-self-start pl-2 text-sm">
              {user.name}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
