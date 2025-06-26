import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";

export default function useUserProfile() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    // No hacer nada si la sesión aún está cargando
    if (status === "loading") {
      return;
    }

    // Si no hay sesión, no mostrar error, solo limpiar
    if (!session?.user?.email) {
      setProfile(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Obtener usuario de MongoDB
      const res = await fetch(`/api/user/profile?email=${session.user.email}`);

      if (!res.ok) {
        if (res.status === 404) {
          // Usuario no encontrado, no es un error crítico
          setProfile(null);
          setError(null);
          setLoading(false);
          return;
        }
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      const user = await res.json();

      // Guardar mongoId en localStorage SIEMPRE
      if (user._id) {
        localStorage.setItem("mongoId", user._id);
      }

      let needsSync = false;
      let name = user.name || "";
      let fotoPerfil = user.fotoPerfil || "";
      let comunidad = user.comunidad || "";
      let nombreCompleto = null;
      // Siempre intentar obtener la columna 'Nombre Completo' de Monday
      if (user.personalMondayId) {
        try {
          const query = `query { items (ids: [${user.personalMondayId}]) { id name column_values { id text column { title } } } }`;
          const mondayRes = await fetch("/api/monday/item", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
          });
          if (mondayRes.ok) {
            const mondayData = await mondayRes.json();
            const item = mondayData?.data?.items?.[0];
            if (item && item.column_values) {
              const nombreCompletoCol = item.column_values.find(
                (col) => col.column?.title === "Nombre Completo"
              );
              if (nombreCompletoCol?.text) {
                nombreCompleto = nombreCompletoCol.text;
              }
            }
          }
        } catch (mondayError) {
          // No fallar si Monday no responde
        }
      }
      // Si no se obtuvo de Monday, usar concatenación como respaldo
      if (!nombreCompleto) {
        nombreCompleto =
          `${user.firstName || ""} ${user.lastName || ""} ${
            user.secondLastName || ""
          }`.trim() ||
          user.name ||
          "";
      }

      // 2. Si falta algún dato, obtener de Monday
      if ((!name || !comunidad || !fotoPerfil) && user.personalMondayId) {
        try {
          const query = `query { items (ids: [${user.personalMondayId}]) { id name column_values { id text column { title } } } }`;
          const mondayRes = await fetch("/api/monday/item", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
          });

          if (mondayRes.ok) {
            const mondayData = await mondayRes.json();
            const item = mondayData?.data?.items?.[0];
            if (item) {
              if (!name && item.name) {
                name = item.name;
                needsSync = true;
              }
              if (item.column_values) {
                const comunidadCol = item.column_values.find(
                  (col) => col.column?.title === "Comunidad"
                );
                if (!comunidad && comunidadCol?.text) {
                  comunidad = comunidadCol.text;
                  needsSync = true;
                }
                const fotoCol = item.column_values.find((col) =>
                  col.column?.title?.toLowerCase().includes("foto")
                );
                if (!fotoPerfil && fotoCol?.text) {
                  fotoPerfil = fotoCol.text;
                  needsSync = true;
                }
              }
            }
          }
        } catch (mondayError) {
          console.warn("Error al obtener datos de Monday:", mondayError);
          // No fallar si Monday no responde, continuar con los datos de MongoDB
        }
      }

      // Buscar columna 'Nombre Completo' en Monday
      if (
        (!nombreCompleto || nombreCompleto === name) &&
        user.personalMondayId
      ) {
        try {
          const query = `query { items (ids: [${user.personalMondayId}]) { id name column_values { id text column { title } } } }`;
          const mondayRes = await fetch("/api/monday/item", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
          });
          if (mondayRes.ok) {
            const mondayData = await mondayRes.json();
            const item = mondayData?.data?.items?.[0];
            if (item && item.column_values) {
              const nombreCompletoCol = item.column_values.find(
                (col) => col.column?.title === "Nombre Completo"
              );
              if (nombreCompletoCol?.text) {
                nombreCompleto = nombreCompletoCol.text;
              }
            }
          }
        } catch (mondayError) {
          // No fallar si Monday no responde
        }
      }

      // 3. Si hubo cambios, sincronizar en MongoDB
      if (needsSync) {
        try {
          await fetch(`/api/user/profile`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: session.user.email,
              name,
              fotoPerfil,
              comunidad,
            }),
          });
        } catch (syncError) {
          console.warn("Error al sincronizar con MongoDB:", syncError);
          // No fallar si la sincronización falla
        }
      }

      setProfile({
        ...user,
        name,
        fotoPerfil,
        comunidad,
        nombreCompleto,
      });
    } catch (e) {
      console.error("Error al obtener perfil:", e);
      setError("Error al cargar el perfil");
      setProfile(null);
    }
    setLoading(false);
  }, [session?.user?.email, status]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
}
