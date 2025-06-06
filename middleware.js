import { NextResponse } from "next/server";

export function middleware(request) {
  console.log("=== INICIO DEL MIDDLEWARE ===");
  console.log("URL actual:", request.nextUrl.toString());

  // Obtener la URL actual
  const url = request.nextUrl.clone();

  // Si la ruta es /api/auth/register y no tiene el parámetro email
  if (url.pathname === "/api/auth/register") {
    if (!url.searchParams.has("email")) {
      console.log(
        "Redireccionando a /api/auth/signin - No se encontró el parámetro email"
      );
      url.pathname = "/api/auth/signin";
      return NextResponse.redirect(url);
    }

    // Si tiene email, mostrar en los logs
    const email = url.searchParams.get("email");
    console.log("Email del usuario:", email);

    // Obtener la estructura del board para encontrar el ID de la columna de imagen
    console.log("Obteniendo estructura del board...");
    fetch("/api/monday/board/structure", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    })
      .then((res) => res.json())
      .then((data) => {
        const imageColumn = data?.data?.boards?.[0]?.columns?.find(
          (col) =>
            col.type === "file" ||
            col.title.toLowerCase().includes("foto") ||
            col.title.toLowerCase().includes("imagen")
        );
        if (imageColumn) {
          console.log("ID de columna de imagen encontrado:", imageColumn.id);
          // Guardar el ID en la URL para usarlo en el registro
          url.searchParams.set("imageColumnId", imageColumn.id);
        }
      })
      .catch((error) => {
        console.error("Error al obtener estructura del board:", error);
      });
  }

  console.log("=== FIN DEL MIDDLEWARE ===");
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/register"],
};
