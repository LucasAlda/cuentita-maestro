import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import { useEffect, useState } from "react";

export default function Home() {
  return (
    <>
      <Head>
        <title>Cuentita Maestro</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex grow flex-col items-center justify-center gap-10">
        <Reclamo />
        <FetchProtected />
        <Notifications />
      </main>
    </>
  );
}

function FetchProtected() {
  const [response, setResponse] = useState("");

  async function fetchProtected() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = await fetch("/api/protected").then((res) => res.json());
    setResponse(JSON.stringify(data, null, 2));
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
              {response}
            </code>
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

function Reclamo() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    console.log("El dialog se abrio o cerro");
  }, [open]);

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
        <Textarea></Textarea>
        <DialogFooter>
          <DialogClose>Cancelar</DialogClose>
          <Button>Enviar</Button>
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
