import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";

export default function useUserProfile() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!session?.user?.email) {
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      // 1. Obtener usuario de MongoDB
      const res = await fetch(`/api/user/profile?email=${session.user.email}`);
      const user = await res.json();
      // Guardar mongoId en localStorage SIEMPRE
      if (user._id) {
        localStorage.setItem("mongoId", user._id);
      }
      let needsSync = false;
      let name = user.name || "";
      let fotoPerfil = user.fotoPerfil || "";
      let comunidad = user.comunidad || "";
      // 2. Si falta algún dato, obtener de Monday
      if ((!name || !comunidad || !fotoPerfil) && user.personalMondayId) {
        const query = `query { items (ids: [${user.personalMondayId}]) { id name column_values { id text column { title } } } }`;
        const mondayRes = await fetch("/api/monday/item", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
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
      // 3. Si hubo cambios, sincronizar en MongoDB
      if (needsSync) {
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
      }
      setProfile({
        ...user,
        name,
        fotoPerfil,
        comunidad,
        nombreCompleto:
          `${user.firstName || ""} ${user.lastName || ""} ${
            user.secondLastName || ""
          }`.trim() || name,
      });
    } catch (e) {
      setError(e.message || "Error al obtener perfil");
      setProfile(null);
    }
    setLoading(false);
  }, [session?.user?.email]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
}
