import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Key, Link2, UnfoldVertical, FoldVertical } from "lucide-react";
import type { VisTable, VisColumn } from "@/types";
import { cn } from "@/utils/cn";

export type SchemaNodeData = {
  table: VisTable;
  isSelected: boolean;
};

function ColumnRow({ col, isPk, isFk }: { col: VisColumn; isPk: boolean; isFk: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1 text-xs border-b border-border/40 last:border-0",
        isPk && "bg-primary/5 dark:bg-primary/10",
        isFk && "bg-blue-50 dark:bg-blue-950/20",
      )}
    >
      {isPk && <Key className="h-3 w-3 shrink-0 text-amber-500" />}
      {isFk && !isPk && <Link2 className="h-3 w-3 shrink-0 text-blue-500" />}
      {!isPk && !isFk && <div className="h-3 w-3 shrink-0" />}
      <span className={cn("font-mono", isPk && "font-semibold text-amber-600 dark:text-amber-400")}>
        {col.name}
      </span>
      <span className="ml-auto text-[10px] text-muted-foreground">{col.type}</span>
    </div>
  );
}

function SchemaNode({ data }: NodeProps<SchemaNodeData>) {
  const { table } = data;
  const [collapsed, setCollapsed] = useState(false);
  const pkCount = table.columns.filter((c) => c.primary_key).length;
  const fkCount = table.columns.filter((c) => c.foreign_key).length;

  return (
    <div
      className={cn(
        "rounded-lg border-2 bg-card text-card-foreground shadow-lg transition-shadow min-w-52",
        data.isSelected
          ? "border-primary shadow-primary/20"
          : "border-border hover:border-primary/50",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between px-3 py-2 rounded-t-lg cursor-pointer",
          "bg-muted/50 border-b border-border",
        )}
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <span className="text-sm font-semibold">{table.name}</span>
        </div>
        <div className="flex items-center gap-1">
          {pkCount > 0 && (
            <span className="text-[10px] text-muted-foreground" title={`${pkCount} primary keys`}>
              PK:{pkCount}
            </span>
          )}
          {fkCount > 0 && (
            <span className="text-[10px] text-muted-foreground ml-1" title={`${fkCount} foreign keys`}>
              FK:{fkCount}
            </span>
          )}
          <button
            className="ml-1 p-0.5 rounded hover:bg-muted-foreground/20 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed); }}
          >
            {collapsed ? <UnfoldVertical className="h-3 w-3" /> : <FoldVertical className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="divide-y-0">
          {table.columns.map((col) => (
            <ColumnRow
              key={`${table.name}-${col.name}`}
              col={col}
              isPk={col.primary_key}
              isFk={col.foreign_key}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border/40 text-[10px] text-muted-foreground">
        <span>{table.columns.length} columns</span>
        <span>{table.row_count.toLocaleString()} rows</span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-2 !h-2" />
      <Handle type="target" position={Position.Top} className="!bg-primary !w-2 !h-2" />
    </div>
  );
}

export default memo(SchemaNode);
