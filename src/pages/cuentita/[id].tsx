/* eslint-disable @next/next/no-img-element */
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
import { Copy, LoaderCircle, Trash2, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { requestConfirmation } from "@/lib/request-confirmation";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

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
      <Card className="mx-auto w-full max-w-2xl max-sm:rounded-none max-sm:border-0 sm:mt-10">
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
                <div className="flex items-center gap-1 sm:gap-2">
                  <EditCuentitaDialog />
                  <EditMembersDialog />
                </div>
              </div>

              <Tabs defaultValue="movements">
                <div className="flex items-center justify-between gap-x-2">
                  <TabsList className="h-10">
                    <TabsTrigger value="movements" className="h-8">
                      Movimientos
                    </TabsTrigger>
                    <TabsTrigger value="balances" className="h-8">
                      Balances
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="movements" className="mt-0">
                    <AddGastitoDialog />
                  </TabsContent>
                  <TabsContent value="balances" className="mt-0">
                    <PayDebtDialog />
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
        <Button variant="default" className="max-sm:px-3 max-sm:py-1.5">
          Miembros
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Miembros de la Cuentita</DialogTitle>
          <DialogDescription>
            Utilice el enlace para invitar a más miembros o seleccione abajo
            para eliminar a un miembro ya existente.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1">
            <h3 className="font-semibold">Enlace de Invitación</h3>
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
        <Button variant="outline" className="max-sm:px-3 max-sm:py-1.5">
          Editar
        </Button>
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
            <span className="text-xs text-slate-500">(Próximamente)</span>
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
        <Button variant="outline" className="">
          <span className="hidden sm:inline">+ Agregar gastito</span>
          <span className="sm:hidden">+ gastito</span>
        </Button>
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
                <SelectItem value="deporte">Deporte</SelectItem>
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
                <SelectItem value="unico">Único</SelectItem>
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
          <div className="flex gap-2">
            <Button
              variant={"outline"}
              size={"icon"}
              className="hover:bg-red-50"
              onClick={handleDelete}
            >
              <Trash2 className="h-5 w-5 text-red-500" />
            </Button>
            <ComplaintDialog gastito={gastito} />
          </div>
          <div>
            <DialogClose asChild>
              <Button variant={"outline"}>Cerrar</Button>
            </DialogClose>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ComplaintDialog({ gastito }: { gastito: Gastito }) {
  const session = useSession();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");

  function send() {
    fetch("/api/notifications/send-complaint", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        cuentitaId: gastito.cuentitaId,
        juanfra: session.data?.user.id,
        title: `Nuevo reclamo por '${gastito.name}'`,
        message: `${session.data?.user.name}: ${description}`,
      }),
    });
    setOpen(false);
    toast("Reclamo enviado exitosamente!");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Reclamar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Iniciar reclamo</DialogTitle>
          <DialogDescription>
            Escribí una breve descripción de tu reclamo. Se notificará a todos
            los miembros del grupo.
          </DialogDescription>
        </DialogHeader>
        <div>
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea
            id="descripcion"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant={"outline"}>Cerrar</Button>
          </DialogClose>
          <Button variant={"default"} onClick={send}>
            Enviar
          </Button>
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

  if (isOwner) {
    shareTag = (
      <p className="text-sm text-green-600">
        +
        {numberFormatter.format(
          Number(gastito.amount) - Number(share?.amount || 0),
        )}
      </p>
    );
  } else if (share == undefined) {
    shareTag = <></>;
  } else {
    shareTag = (
      <p className="text-sm text-red-500">
        -{numberFormatter.format(Number(share?.amount))}
      </p>
    );
  }

  const isPago = gastito.category === "pago";

  return (
    <DialogTrigger asChild>
      <button
        key={gastito.id}
        className="flex w-full items-center justify-between px-6 py-3 text-left hover:bg-slate-50"
      >
        <div>
          <h3 className="font-semibold">{gastito.name}</h3>
          <p className="text-sm text-slate-500">
            <span
              className={`inline-flex rounded-full ${isPago ? "bg-indigo-200" : "bg-slate-200"} px-2 text-sm capitalize text-slate-800`}
            >
              {gastito.category}
            </span>{" "}
            - Pagado por {gastito.owner.name}
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
    refetchInterval: 5 * 1000,
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
    refetchInterval: 5 * 1000,
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
              className="flex justify-end self-center justify-self-end whitespace-nowrap rounded bg-red-400 px-2 py-1 text-right text-sm"
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

function PayDebtDialog() {
  const router = useRouter();
  const cuentitaId = router.query.id as string;
  const ownerId = useSession().data?.user.id!;

  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<string>("");
  const [amount, setAmount] = useState(0);
  const [payWithMP, setPayWithMP] = useState(false);
  const [response, setResponse] = useState<CreateResponse>();
  const [MPSimulation, setMPSimulation] = useState(false);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setTarget("");
        setAmount(0);
        setResponse(undefined);
        setPayWithMP(false);
        setMPSimulation(false);
      }, 300);
    }
  }, [open]);

  const ctx = useQueryClient();

  const { data: cuentitaInfo } = useQuery<
    Cuentita & {
      members: User[];
    }
  >({
    queryKey: ["/cuentita/info", cuentitaId],
    enabled: typeof cuentitaId === "string",
  });

  const handleSubmit = () => {
    const category = "pago";
    const repetition = "unico";

    const shares: Shares = {};
    if (target !== "") {
      shares[target] = 1;
    }

    const targetUser = cuentitaInfo?.members.find((user) => user.id === target);
    const name = `Pago a ${targetUser?.name}`;

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
          ctx.invalidateQueries();
          if (!payWithMP) {
            setOpen(false);
          } else {
            setMPSimulation(true);
          }
        }
      });
  };

  // const MPSimulation = response?.success && open //true

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Saldar deuda</Button>
      </DialogTrigger>
      <DialogContent>
        {MPSimulation ? (
          <div className="text-center">
            <img
              className="mx-auto w-36"
              alt="mercadopago"
              src="https://logospng.org/download/mercado-pago/logo-mercado-pago-icone-1024.png"
            />
            <p className="mt-4 text-slate-700">Procesando transacción...</p>
            <LoaderCircle className="mx-auto my-3 h-8 w-8 animate-spin text-slate-700" />
            <Button
              className="mt-8 bg-[#00b5ec] text-[#1e2d6d] hover:bg-[#00b5ec7a]"
              onClick={() => setOpen(false)}
            >
              Confirmar pago
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Saldar deuda</DialogTitle>
              <DialogDescription>
                Marcá a quién le pagaste y cuánto
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1">
              <Label htmlFor="usuario" className="text-right">
                Usuario a pagar
              </Label>
              <Select
                value={target}
                onValueChange={(value) => setTarget(value)}
              >
                <SelectTrigger id="usuario" className="col-span-3">
                  <SelectValue placeholder="Selecciona a quien le pagaste" />
                </SelectTrigger>
                <SelectContent>
                  {cuentitaInfo?.members
                    .filter((user) => {
                      return user.id !== ownerId;
                    })
                    .map((user) => {
                      return (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
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
            <div className="mt-2 flex items-center gap-2">
              <Checkbox
                checked={payWithMP}
                onCheckedChange={(checked) =>
                  checked !== "indeterminate" && setPayWithMP(checked)
                }
              />
              <label>
                Pagar con{""}
                <img
                  className="ml-0.5 inline w-10"
                  alt="mercadopago"
                  src="https://logospng.org/download/mercado-pago/logo-mercado-pago-icone-1024.png"
                />
              </label>
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
              <Button onClick={handleSubmit}>Confirmar</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
