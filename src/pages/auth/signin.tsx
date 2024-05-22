import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";

export default function SignIn() {
  const router = useRouter();
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <a
            href="https://www.tiktok.com/@barstoolsports/video/7184872097053756715"
            target="_blank"
            title="Ver TikTok"
            className="hover:cursor-pointer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Logo"
              className="mx-auto my-6 w-28 rounded-2xl "
            />
          </a>
          <CardTitle className="text-2xl font-bold">Cuentita Maestro</CardTitle>
          <CardDescription>Iniciar Sesión con redes sociales</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 py-6 pb-12">
          <Button
            variant="outline"
            size="lg"
            className="flex items-center justify-center gap-2"
            onClick={() =>
              signIn("google", {
                callbackUrl: router.query.callbackUrl?.toString(),
              })
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Google"
              src="https://rotulosmatesanz.com/wp-content/uploads/2017/09/2000px-Google_G_Logo.svg_.png"
              className="w-5"
            />
            Iniciar con Google
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="flex items-center justify-center gap-2"
            onClick={() =>
              signIn("facebook", {
                callbackUrl: router.query.callbackUrl?.toString(),
              })
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Facebook"
              src="https://upload.wikimedia.org/wikipedia/commons/b/b9/2023_Facebook_icon.svg"
              className="w-5"
            />
            Iniciar con Facebook
          </Button>
          {router.query.error && (
            <div className="px-4 py-1 text-center text-sm text-red-500">
              {router.query.error === "OAuthAccountNotLinked"
                ? "Este email ya tiene una cuenta asociada con otra red social"
                : "Error al iniciar sesión"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
