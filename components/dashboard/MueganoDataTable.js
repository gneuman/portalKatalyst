import DataTable from "./DataTable";

export default function MueganoDataTable({ instances = [] }) {
  const columns = [
    {
      header: "Nombre Instancia",
      accessor: "nombre_instancia",
      render: (row) => row.nombre_instancia || "-",
    },
    {
      header: "Estado",
      accessor: "status",
      render: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            row.status === "active"
              ? "bg-green-100 text-green-800"
              : row.status === "pending"
              ? "bg-yellow-100 text-yellow-800"
              : row.status === "suspended"
              ? "bg-red-100 text-red-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {row.status === "active"
            ? "Activa"
            : row.status === "pending"
            ? "Pendiente"
            : row.status === "suspended"
            ? "Suspendida"
            : row.status}
        </span>
      ),
    },
    {
      header: "Fecha de creación",
      accessor: "createdAt",
      render: (row) => new Date(row.createdAt).toLocaleString("es-ES"),
    },
    {
      header: "ID WordPress",
      accessor: "wordpressInstanceId",
      render: (row) => row.wordpressInstanceId || "-",
    },
    {
      header: "ID Instancia",
      accessor: "_id",
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={instances}
      keyField="_id"
      emptyState={{
        title: "No hay instancias",
        description: "No hay instancias para mostrar en este momento",
      }}
    />
  );
}
