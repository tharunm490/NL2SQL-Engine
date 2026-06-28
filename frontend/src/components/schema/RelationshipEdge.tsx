import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
  type Edge,
} from "@xyflow/react";
import type { Relationship } from "@/types";

export type RelationshipEdgeData = {
  relationship: Relationship;
};

type RelationshipEdgeType = Edge<RelationshipEdgeData>;

const REL_LABELS: Record<string, string> = {
  ONE_TO_ONE: "1 : 1",
  ONE_TO_MANY: "1 : N",
  MANY_TO_ONE: "N : 1",
  MANY_TO_MANY: "N : M",
};

const REL_COLORS: Record<string, string> = {
  ONE_TO_ONE: "#22c55e",
  ONE_TO_MANY: "#3b82f6",
  MANY_TO_ONE: "#a855f7",
  MANY_TO_MANY: "#f59e0b",
};

function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<RelationshipEdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const relType = data?.relationship?.relationship ?? "ONE_TO_MANY";
  const label = REL_LABELS[relType] ?? "1:N";
  const color = REL_COLORS[relType] ?? "#3b82f6";

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? "#2563eb" : color,
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: relType === "MANY_TO_MANY" ? "4 2" : "none",
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="absolute flex items-center justify-center pointer-events-none"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
        >
          <span
            className="rounded-full border-2 px-2 py-0.5 text-[10px] font-semibold shadow-sm"
            style={{
              backgroundColor: "var(--color-background)",
              borderColor: color,
              color,
            }}
          >
            {label}
          </span>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(RelationshipEdge);
