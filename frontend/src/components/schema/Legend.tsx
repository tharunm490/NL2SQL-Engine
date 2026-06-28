import { Key, Link2 } from "lucide-react";

const items = [
  { icon: Key, label: "Primary Key", color: "text-amber-500" },
  { icon: Link2, label: "Foreign Key", color: "text-blue-500" },
];

const relationships = [
  { label: "1 : 1", desc: "One-to-One", color: "#22c55e" },
  { label: "1 : N", desc: "One-to-Many", color: "#3b82f6" },
  { label: "N : M", desc: "Many-to-Many", color: "#f59e0b" },
];

export function Legend() {
  return (
    <div className="flex items-center gap-6 text-xs">
      <span className="font-medium text-muted-foreground">Legend:</span>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <item.icon className={`h-3 w-3 ${item.color}`} />
          <span className="text-muted-foreground">{item.label}</span>
        </div>
      ))}
      <div className="w-px h-4 bg-border" />
      {relationships.map((rel) => (
        <div key={rel.label} className="flex items-center gap-1.5">
          <span
            className="inline-block rounded-full border px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ borderColor: rel.color, color: rel.color }}
          >
            {rel.label}
          </span>
          <span className="text-muted-foreground">{rel.desc}</span>
        </div>
      ))}
    </div>
  );
}
