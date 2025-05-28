export default function CardGrid({
  items,
  emptyState,
  renderCard,
  columns = {
    sm: 1,
    md: 2,
    lg: 3,
  },
}) {
  if (!items || items.length === 0) {
    return (
      emptyState || (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            {emptyState?.icon || <div className="h-8 w-8 text-blue-600" />}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {emptyState?.title || "No hay elementos"}
          </h3>
          <p className="text-gray-500 mb-6">
            {emptyState?.description || "No hay elementos para mostrar"}
          </p>
          {emptyState?.action && (
            <button
              onClick={emptyState.action.onClick}
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-semibold rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {emptyState.action.label}
            </button>
          )}
        </div>
      )
    );
  }

  return (
    <div
      className={`grid grid-cols-1 gap-6 sm:grid-cols-${columns.sm} md:grid-cols-${columns.md} lg:grid-cols-${columns.lg}`}
    >
      {items.map((item, index) => renderCard(item, index))}
    </div>
  );
}
