import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback, useRef } from "react";

export default function useUserProfile() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const yaActualizadoRef = useRef(false);

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

    // Resetear la bandera de actualización al inicio de cada fetch
    yaActualizadoRef.current = false;
    console.log(
      "[SYNC] yaActualizadoRef reseteado a false al inicio de fetchProfile"
    );

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
      let nombreCompletoMonday = null;
      let mondayRaw = null;
      let nombreMonday = null;
      let apellidoPaternoMonday = null;
      let apellidoMaternoMonday = null;
      let emailMonday = null;
      let comunidadMonday = null;
      let fotoPerfilMonday = null;
      let nombreCompletoFormula = null;
      let nombreCompleto =
        `${user.firstName || ""} ${user.lastName || ""} ${
          user.secondLastName || ""
        }`.trim() ||
        user.name ||
        "";
      let origenNombreCompleto = "";
      // Siempre consultar Monday.com para obtener 'Nombre Completo'
      if (user.personalMondayId) {
        try {
          const query = `query { items (ids: [${user.personalMondayId}]) { id name board { id } column_values { id text value column { id title id } } } }`;
          const mondayRes = await fetch("/api/monday/item", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
          });
          if (mondayRes.ok) {
            const mondayData = await mondayRes.json();
            mondayRaw = mondayData;
            const item = mondayData?.data?.items?.[0];
            if (item && item.column_values) {
              // Buscar columna 'Nombre Completo' por title
              const nombreCompletoCol = item.column_values.find(
                (col) => col.column?.title === "Nombre Completo"
              );
              if (nombreCompletoCol?.text) {
                nombreCompletoMonday = nombreCompletoCol.text;
                origenNombreCompleto = "columna";
              }
              // Buscar columna por id 'formula_mks9bmyq'
              const formulaCol = item.column_values.find(
                (col) => col.column?.id === "formula_mks9bmyq"
              );
              if (!nombreCompletoMonday && formulaCol?.text) {
                nombreCompletoFormula = formulaCol.text;
                nombreCompletoMonday = formulaCol.text;
                origenNombreCompleto = "formula";
              }
              // Si tampoco, concatenar las columnas de nombre y apellidos
              if (!nombreCompletoMonday) {
                const nombreCol = item.column_values.find(
                  (col) => col.column?.title === "Nombre"
                );
                const apellidoPCol = item.column_values.find(
                  (col) => col.column?.title === "Apellido Paterno"
                );
                const apellidoMCol = item.column_values.find(
                  (col) => col.column?.title === "Apellido Materno"
                );
                nombreMonday = nombreCol?.text || "";
                apellidoPaternoMonday = apellidoPCol?.text || "";
                apellidoMaternoMonday = apellidoMCol?.text || "";
                nombreCompletoMonday =
                  `${nombreMonday} ${apellidoPaternoMonday} ${apellidoMaternoMonday}`.trim();
                origenNombreCompleto = "concatenado";
              }
              // Obtener email y comunidad si existen
              const emailCol = item.column_values.find(
                (col) => col.column?.title?.toLowerCase() === "email"
              );
              emailMonday = emailCol?.text || user.email;
              const comunidadCol = item.column_values.find(
                (col) => col.column?.title === "Comunidad"
              );
              comunidadMonday = comunidadCol?.text || user.comunidad;
              // Foto de perfil
              const fotoCol = item.column_values.find((col) =>
                col.column?.title?.toLowerCase().includes("foto")
              );
              fotoPerfilMonday = fotoCol?.text || user.fotoPerfil;
            }
          }
        } catch (mondayError) {
          // No fallar si Monday no responde
        }
      }
      // Mostrar en consola el resultado crudo de Monday
      if (mondayRaw) {
        console.log("[Monday RAW]", mondayRaw);
      }
      // Mostrar en consola los valores obtenidos
      console.log(
        `[Monday] Nombre Completo: ${nombreCompletoMonday} (origen: ${origenNombreCompleto})`
      );
      console.log("[Monday] Nombre:", nombreMonday);
      console.log("[Monday] Apellido Paterno:", apellidoPaternoMonday);
      console.log("[Monday] Apellido Materno:", apellidoMaternoMonday);
      console.log("[Monday] Email:", emailMonday);

      // Agregar logs detallados para la comparación
      console.log("Nombre (MongoDB):", user.name);
      console.log("Origen del nombre completo:", origenNombreCompleto);
      console.log("Nombre Completo Monday:", nombreCompletoMonday);
      console.log("Nombre (MongoDB):", user.name);
      console.log("¿Son diferentes?", nombreCompletoMonday !== user.name);
      console.log("¿yaActualizadoRef.current?", yaActualizadoRef.current);

      // Si el nombre completo de Monday o el email de Monday es diferente al de MongoDB, actualizar ambos en MongoDB
      const emailParaActualizar = emailMonday || user.email;
      const debeActualizarEmail = emailMonday && emailMonday !== user.email;
      const debeActualizarNombre =
        nombreCompletoMonday && nombreCompletoMonday !== user.name;

      console.log("¿Debe actualizar email?", debeActualizarEmail);
      console.log("¿Debe actualizar nombre?", debeActualizarNombre);

      if (
        !yaActualizadoRef.current &&
        (debeActualizarNombre || debeActualizarEmail)
      ) {
        if (!emailParaActualizar) {
          console.warn(
            "[MongoDB UPDATE] Email vacío o undefined, no se puede actualizar."
          );
        } else {
          try {
            const payload = {
              email: emailParaActualizar,
              name: nombreCompletoMonday || user.name,
            };
            if (debeActualizarEmail) {
              payload.nuevoEmail = emailMonday;
            }
            console.log("[MongoDB UPDATE PAYLOAD]", payload);
            const response = await fetch(`/api/user/profile`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            const data = await response.json();
            console.log("[MongoDB UPDATE RESPONSE]", data);
            // Marcar como actualizado para evitar ciclo infinito durante esta ejecución
            yaActualizadoRef.current = true;
            console.log(
              "[SYNC] Actualización completada, yaActualizadoRef establecido en true"
            );

            // Forzar refetch si la actualización fue exitosa
            if (response.ok) {
              // También actualizar el nombre del item en Monday.com
              if (user.personalMondayId && nombreCompletoMonday) {
                try {
                  // Obtener el boardId desde Monday (ya lo tienes en mondayRaw)
                  let boardId = null;
                  if (
                    mondayRaw &&
                    mondayRaw.data &&
                    mondayRaw.data.items &&
                    mondayRaw.data.items[0]?.board?.id
                  ) {
                    boardId = mondayRaw.data.items[0].board.id;
                  }
                  // Si no se obtuvo el boardId, intentar obtenerlo con otra consulta
                  if (!boardId) {
                    // Consulta rápida para obtener el boardId
                    const queryBoard = `query { items (ids: [${user.personalMondayId}]) { board { id } } }`;
                    const resBoard = await fetch("/api/monday/item", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ query: queryBoard }),
                    });
                    const dataBoard = await resBoard.json();
                    boardId = dataBoard?.data?.items?.[0]?.board?.id;
                  }
                  if (boardId) {
                    const mutation = {
                      query: `mutation { change_simple_column_value(item_id: ${
                        user.personalMondayId
                      }, board_id: ${boardId}, column_id: \"name\", value: \"${nombreCompletoMonday.replace(
                        /"/g,
                        '\\"'
                      )}\") { id } }`,
                    };
                    const mondayUpdateRes = await fetch("/api/monday/item", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(mutation),
                    });
                    const mondayUpdateData = await mondayUpdateRes.json();
                    console.log(
                      "[Monday UPDATE NAME RESPONSE]",
                      mondayUpdateData
                    );
                  }
                } catch (err) {
                  console.warn(
                    "Error al actualizar el nombre del item en Monday:",
                    err
                  );
                }
              }
              setTimeout(() => fetchProfile(), 500);
            }
          } catch (syncError) {
            console.warn(
              "Error al sincronizar nombre completo/email en MongoDB:",
              syncError
            );
          }
        }
      }
      // Mostrar en consola el objeto profile final
      nombreCompleto = nombreCompletoMonday || nombreCompleto;
      const profileObj = {
        ...user,
        name: nombreCompleto,
        fotoPerfil: fotoPerfilMonday || user.fotoPerfil,
        comunidad: comunidadMonday || user.comunidad,
        nombreCompleto,
        nombreCompletoMonday,
        origenNombreCompleto,
        email: emailMonday || user.email,
      };
      console.log("[Profile FINAL]", profileObj);
      setProfile(profileObj);

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
        name,
        fotoPerfil,
        comunidad,
        nombreCompleto,
        nombreCompletoMonday,
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
    // eslint-disable-next-line
  }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
}
