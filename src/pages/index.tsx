import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { useNotification } from "@/hooks/use-notification";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useState } from "react";

export default function Home() {
  return (
    <>
      <Head>
        <title>Cuentita Maestro</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex grow flex-col items-center justify-center gap-10">
        <Reclaim />
        <FetchProtected />
        <Notifications />
      </main>
    </>
  );
}

import { useQuery } from "@tanstack/react-query";

function FetchProtected() {
  const { data: response, refetch } = useQuery({
    queryKey: ["protected"],
    refetchInterval: 1000 * 5,
  });

  async function fetchProtected() {
    refetch();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Peticion a un endpoint privado</CardTitle>
          <Button onClick={() => fetchProtected()}>Fetch Protected</Button>
        </div>
      </CardHeader>
      <CardContent>
        <h3>Response:</h3>
        <div className="min-h-96 w-screen max-w-xl rounded-lg border bg-slate-50 p-4">
          <pre>
            <code className="whitespace-break-spaces break-words">
              {JSON.stringify(response, null, 2)}
            </code>
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

function Reclaim() {
  const session = useSession();
  const [open, setOpen] = useState(false);
  const [reclaim, setReclaim] = useState("Escriba su reclamo");

  function selfReclaim() {
    const user = session.data?.user;
    if (!user) return;
    fetch(
      `/api/notifications/notify?id=${user.id}&title=Reclamo por ${user.name}&message=${reclaim}`,
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Reclamar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Iniciar Reclamo</DialogTitle>
          <DialogDescription>
            Sos un gede, hablalo por wpp, son amigos en teoria
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={reclaim}
          onChange={(e) => setReclaim(e.target.value)}
        ></Textarea>
        <DialogFooter>
          <DialogClose>Cancelar</DialogClose>
          <Button onClick={selfReclaim}>Enviar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Notifications() {
  const session = useSession();
  const notification = useNotification();

  function notify() {
    fetch(
      `/api/notifications/notify?id=${session.data?.user.id}&title=Notificacion de Prueba&message=Esto fue enviado desde el home`,
    );
  }

  return (
    <div className="">
      {notification.subscribed ? (
        <Button onClick={notify}>Notificarme</Button>
      ) : (
        <Button onClick={notification.subscribe}>Subscribir</Button>
      )}
    </div>
  );
}
