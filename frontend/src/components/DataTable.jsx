// Generic table renderer.
// columns: [{ key, header, render?(row) }]
// rows:    array of objects
// highlightRow?: (row) => boolean
export default function DataTable({ columns, rows, emptyText = 'No records found.', highlightRow }) {
  if (!rows || rows.length === 0) {
    return <div className="table-empty">{emptyText}</div>;
  }

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const highlighted = typeof highlightRow === 'function' && highlightRow(row);
            return (
              <tr key={row.id ?? row.stock_id ?? i} className={highlighted ? 'row-warning' : ''}>
                {columns.map((c) => (
                  <td key={c.key}>
                    {typeof c.render === 'function' ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}