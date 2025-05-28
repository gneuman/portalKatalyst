export default function DataTable({
  columns,
  data,
  keyField = "id",
  onRowClick,
  emptyState,
}) {
  if (!data || data.length === 0) {
    return (
      emptyState || (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay datos para mostrar</p>
        </div>
      )
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row) => (
            <tr
              key={row[keyField]}
              onClick={() => onRowClick && onRowClick(row)}
              className={onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}
            >
              {columns.map((column, index) => (
                <td key={index} className="px-6 py-4 whitespace-nowrap">
                  {column.render ? column.render(row) : row[column.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
