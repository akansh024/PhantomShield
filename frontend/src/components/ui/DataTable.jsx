import React from 'react';

const DataTable = ({ columns, data, keyField }) => {
  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 text-sm">
        No data available
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/5 bg-black/20 text-xs text-gray-400 uppercase tracking-wider">
            {columns.map((col, i) => (
              <th key={i} className="py-3 px-5 font-semibold">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-sm">
          {data.map((row, i) => (
            <tr key={row[keyField] || i} className="hover:bg-white/5 transition-colors">
              {columns.map((col, j) => (
                <td key={j} className="py-3 px-5 text-gray-300">
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
