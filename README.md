# Cuentita Maestro - Posible template

## Iniciar el proyecto

1. Clonar el repositorio
2. Instalar las dependencias con `npm install`
3. Copiar el archivo `.env.example` a `.env` y completar las variables de entorno.

   a. Elegir donde almacenar los uploaded-files (en produccion se recomienda tenerlo fuera de la carpeta proyecto con otra url con un reverse proxy)

   b. Obtener las claves de OAuth de Google y Facebook para el login social

   c. Correr `npm run vapid` para generar los datos necesarios para las notificaciones push

4. Correr el proyecto con `npm run db:push` para crear la base de datos (`./prisma/db.sqlite`)
5. Correr `npm run dev` para correr el proyecto en modo desarrollo
6. Listo! Se va a abrir en `http://localhost:3000`

## Tecnologias

- ### React: como libreria de front-end (https://react.dev/)
  Maneja el estado y componentes con los que se hace la web
- ### Next.js (Pages Router): como framework de React (https://nextjs.org/)
  Maneja el enrutamiento de react y hace de servidor tanto para la web como para backend (mas abajo lo explico)
- ### TailwindCSS: como libreria de estilos (https://tailwindcss.com/)
  Tiene una clase casi 1 a 1 con cada estilo de css haciendo mas rapido y facil de usar (ademas de buenos defaults)
- ### Prisma: como ORM (https://www.prisma.io/)

  Hace de puente entre la base de datos y el backend, genera types de TypeScript para que sea facil de integrar

  La base puede ser postgres en docker, pero para empezar es un sqlite que se guarda en un archivo

- ### Shadcn/ui: como libreria de componentes (https://shadcn/ui)
  Tiene componentes que se usan en la web, como botones, inputs, etc. Estan copiados en el proyecto en la carpeta `src/components/ui`

## Archivos de configuracion del proyecto importantes

- `package.json`: es el archivo donde se dice que dependencias tiene el proyecto y que comandos se pueden correr con `npm run`. No se deberia tener que tocar demasiado

- `.env`: es el archivo donde se guardan las variables de entorno, como la url de la base de datos, el puerto del servidor, etc. En el `.env.example` hay una guia de que tiene que tener. para usarlo en el codigo vamos a ver mas adelante que archivo se usa.

- `prisma/schema.prisma`: es el archivo donde se define la base de datos, las tablas, los campos, las relaciones, etc. Prisma se encarga de generar la base de datos a partir de este archivo. Se puede ver la documentacion de prisma para ver como se hace. Se ve que es una version simplificada de CREATE TABLE en SQL.

- `prisma/db.sqlite`: es el archivo donde se guarda la base de datos. Se puede abrir un explorador con el comando `npm run db:studio`. Se genera y se levanta la db sola cuando se corre el proyecto.

- `/public`: es la carpeta donde se guardan los archivos estaticos, como imagenes, fuentes, etc. Se puede acceder a ellos desde la web con `/nombre-del-archivo`

El resto son para configurar el linter, typescript, tailwind y next, no se deberian tocar.

## Carpeta `src`

El proyecto propiamente dicho vive todo acaparado en la carpeta `src`, para importar el codigo se tiene como referencia `@/` a esta carpeta. Aca se encuentran las carpetas:

- `@/components`: aca se guardan los componentes de React que se usan en la web y se van a reutilizar entre mas de una pagina, un ejemplo seria `gastito-card.tsx` donde exporta un componente que muestra un gasto con su nombre, monto, fecha, etc.

- `@/components/ui`: aca se guardan los componentes de la libreria `shadcn/ui` que se usan en la web, como botones, inputs, etc. Son componentes mas bien genericos que no se van a modificar y se usan para armar todo lo demas. La documentacion de su uso es muy buena y se puede ver en su pagina.

- `@/hooks`: aca se guardan los hooks de React que se usan en la web, como podria ser `use-notifications.tsx` que exporta un hook que se usa para mostrar notificaciones en la web.

- `@/lib`: aca se guardan las funciones que se usan en varias partes de la web, como podria ser un `format-date.ts` que exporta una funcion que formatea una fecha a un string legible.

- `@/server`: es igual que lib pero para el backend, aca se guardan las funciones que se usan en el backend, como podria ser `send-email.ts` o `db.ts` que exporta una funcion que envia un email.

- `@/styles`: no se va a usar, tiene un solo archivo que es para configurar tailwind.

- `@/env.js`: es un archivo que valida y exporta una variable `env` que tiene las variables de entorno del `.env`, siempre que se vaya a usar una importarla de aca (`env.VARIABLE_DE_ENTORNO`).

## Ahora si, `@/pages`

Aca es donde mas entra la "magia" de next.js, cada archivo que se cree en esta carpeta va a ser una pagina de la web, por ejemplo:

- `index.tsx` va a ser `https://dominio.com/`
- `gastos.tsx` va a ser `https://dominio.com/gastos`
- `/carpeta/sub-carpeta/test.tsx` va a ser`https://dominio.com//carpeta/sub-carpeta/test`
- y asi.

Cada uno de estos archivos tiene que exportar default un componente React que va a ser la pagina, por ejemplo:

```tsx
import { Button } from "@/components/ui/button";

export default function Page() {
  const [counter, setCounter] = useState(0);
  return (
    <div>
      <h1> Hola mundo</h1>
      <Button>{counter}</Button>
      <Component />
    </div>
  );
}

function Component() {
  return <p> Soy un componente</p>;
}
```

### `@/pages/api`

Dentro de la carpeta pages, la subcarpeta `api` tiene un comportamiento distinto, es el backend de la web, cada archivo que se cree aca va a ser una ruta de la api que exporte una funcion con las siguientes props:

#### Req: NextApiRequest

Es un objeto que tiene toda la informacion de la peticion HTTP:

- `req.body`: es el cuerpo de la peticion, si es un POST o PUT
- `req.query`: son los query params de la peticion (?param1=valor1&param2=valor2)
- `req.method`: es el metodo de la peticion (GET, POST, PUT, DELETE, etc)

#### Res: NextApiResponse

Es un objeto que tiene los metodos para responder a la peticion HTTP:

- `res.status(number)`: es para setear el status code de la respuesta
- `res.json(object)`: es para enviar un objeto como respuesta

```tsx
import { db } from "@/server/db";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { name, amount, date } = req.body;

  const newGasto = db.gasto.create({
    data: {
      name,
      amount,
      date,
    },
  });

  return res.json(newGasto);
}
```

## Comandos

- `npm run dev`: corre el proyecto en modo desarrollo, se va a abrir en `http://localhost:3000`

- `npm run db:studio`: abre un explorador de la base de datos, se va a abrir en `http://localhost:5555`

## Otras cosas a saber usar

### React Query

Maneja todas las requests para hacer gets de datos facilmente.

Uso: es un hook `useQuery` que recibe como parametro un objeto con las configuraciones, las principales son:

- `queryKey`: es un array que tiene los strings que va a usar para formar la url a la que hacer el GET y usa ReactQuery internamente como key para el cache y cosas que no van al caso
  Ej: `queryKey: ['groups', 'list']` es una request a `http://localhost:3000/api/groups/list` (la formula seria ENDPOINT + '/api/' + queryKey[0] + '/' + queryKey[1] + '/' + ... + queryKey[n])
- `refetchInterval`: intervalo en milisegundos para hacer un refetch al endpoint
- `enabled`: es un booleano para poder hacer que no haga el fetch hasta que no se cumpla cierta condicion necesaria para el request
  Ej: `enabled: typeof session.user !== "undefined"` si el query va a pasarle el id del usuario algo

### Tailwind

Define los estilos CSS por medio de clases pre definidas que son 1 a 1 con los estilos de css (w-10 le da width: 40px, p-4 le da padding: 16px, etc)

Uso: <div className="w-40 h-10 p-4 bg-white rounded-lg">

### Prisma

En el `prisma/schema.prisma` se definen las tablas con un schema definido por prisma (bastante comprensible) que despues este usa para dos cosas:

1. Generar la base de datos con ese schema (en nuestro caso un sqlite en `prisma/db.sqlite` que es una base sql en formato de archivo asi que no necesitamos docker, ni instalar nada)
2. Generar los tipos de Typescript para facilmente poder acceder a sus keys y demas sin tener que definir el tipo (similar a un struct de rust) a mano

Para ver la base de datos y su contenido, se corre `npm run db:studio` en otra pestaña de la consola y eso te corre el studio en http://localhost:5555
Para acceder a los tipos generados se importan de `@prisma/client`, el tipo de la tabla `Post` se importa como `import  { Post } from "@prisma/client"`
