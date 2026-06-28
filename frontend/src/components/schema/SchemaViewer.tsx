import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  MiniMap,
  Controls,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, X, Download, ZoomIn, ZoomOut, Maximize, RotateCw, AlertCircle } from "lucide-react";
import SchemaNode from "./SchemaNode";
import RelationshipEdge from "./RelationshipEdge";
import { Legend } from "./Legend";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getSchemaVisualizationApi } from "@/api/connections.api";
import type { SchemaVisualization, VisTable } from "@/types";

const NODE_TYPES: NodeTypes = { schemaNode: SchemaNode };
const EDGE_TYPES: EdgeTypes = { relationshipEdge: RelationshipEdge };

const TABLE_SPACING_X = 320;
const TABLE_SPACING_Y = 280;

function layoutTables(tables: VisTable[]): Node[] {
  const cols = Math.ceil(Math.sqrt(tables.length));
  return tables.map((table, i) => ({
    id: table.name,
    type: "schemaNode",
    position: {
      x: (i % cols) * TABLE_SPACING_X + 40,
      y: Math.floor(i / cols) * TABLE_SPACING_Y + 40,
    },
    data: { table, isSelected: false },
    draggable: true,
  }));
}

function buildEdges(schema: SchemaVisualization): Edge[] {
  return schema.relationships.map((rel, i) => ({
    id: `rel-${i}`,
    source: rel.from_table,
    target: rel.to_table,
    sourceHandle: null,
    targetHandle: null,
    type: "relationshipEdge",
    data: { relationship: rel },
    animated: false,
    markerEnd: { type: MarkerType.ArrowClosed, color: "#3b82f6" },
  }));
}

interface SchemaViewerProps {
  connectionId: string;
  connectionName: string;
}

function Canvas({
  schema,
  connectionName,
  searchQuery,
  onClose,
}: {
  schema: SchemaVisualization;
  connectionName: string;
  searchQuery: string;
  onClose: () => void;
}) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView, zoomIn, zoomOut, setCenter } = useReactFlow();

  const initialNodes = useMemo(() => layoutTables(schema.tables), [schema.tables]);
  const initialEdges = useMemo(() => buildEdges(schema), [schema]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  useEffect(() => {
    if (!searchQuery) {
      setNodes((nds) =>
        nds.map((n) => ({ ...n, data: { ...n.data, isSelected: false } })),
      );
      return;
    }
    const match = schema.tables.find((t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    if (match) {
      setSelectedTable(match.name);
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: { ...n.data, isSelected: n.id === match.name },
        })),
      );
      const node = initialNodes.find((n) => n.id === match.name);
      if (node) {
        setCenter(node.position.x + 120, node.position.y + 60, { zoom: 1.5, duration: 500 });
      }
    }
  }, [searchQuery, schema.tables, initialNodes, setNodes, setCenter]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedTable(node.id);
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: { ...n.data, isSelected: n.id === node.id },
        })),
      );
    },
    [setNodes],
  );

  const handlePaneClick = useCallback(() => {
    setSelectedTable(null);
    setNodes((nds) =>
      nds.map((n) => ({ ...n, data: { ...n.data, isSelected: false } })),
    );
  }, [setNodes]);

  const handleExport = useCallback(async (format: "png" | "svg") => {
    const { toPng, toSvg } = await import("html-to-image");
    const el = reactFlowWrapper.current?.querySelector(".react-flow__viewport");
    if (!el) return;
    try {
      const exporter = format === "png" ? toPng : toSvg;
      const dataUrl = await exporter(el as HTMLElement, { backgroundColor: "transparent" });
      const link = document.createElement("a");
      link.download = `${connectionName.replace(/\s+/g, "_")}_schema.${format}`;
      link.href = dataUrl;
      link.click();
      toast.success(`Schema exported as ${format.toUpperCase()}`);
    } catch {
      toast.error("Failed to export schema");
    }
  }, [connectionName]);

  const connectedEdges = useMemo(() => {
    if (!selectedTable) return new Set<string>();
    return new Set(
      edges
        .filter((e) => e.source === selectedTable || e.target === selectedTable)
        .map((e) => e.id),
    );
  }, [edges, selectedTable]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{connectionName}</h2>
          <span className="text-xs text-muted-foreground">
            {schema.tables.length} tables · {schema.relationships.length} relationships
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleExport("png")} title="Export PNG">
            <Download className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">PNG</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleExport("svg")} title="Export SVG">
            <Download className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">SVG</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => fitView({ duration: 300 })} title="Fit View">
            <Maximize className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} title="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges.map((e) => ({
            ...e,
            style: {
              ...e.style,
              stroke: selectedTable && connectedEdges.has(e.id) ? "#2563eb" : e.style?.stroke,
              strokeWidth: selectedTable && connectedEdges.has(e.id) ? 3 : 2,
            },
          }))}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          fitView
          attributionPosition="bottom-left"
          minZoom={0.1}
          maxZoom={4}
          deleteKeyCode={null}
          multiSelectionKeyCode={null}
        >
          <Background gap={20} size={1} color="var(--color-border)" />
          <MiniMap
            nodeStrokeColor="var(--color-primary)"
            nodeColor="var(--color-muted)"
            maskColor="rgba(0,0,0,0.1)"
            style={{ border: "1px solid var(--color-border)" }}
          />
          <Controls
            showInteractive={false}
            className="!bg-card !border-border"
          />
        </ReactFlow>
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-card shrink-0">
        <Legend />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Drag to move · Scroll to zoom</span>
        </div>
      </div>
    </div>
  );
}

export function SchemaViewer({ connectionId, connectionName }: SchemaViewerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: schema, isLoading, isError, refetch } = useQuery({
    queryKey: ["schema-visualization", connectionId],
    queryFn: () => getSchemaVisualizationApi(connectionId),
    enabled: open,
    retry: 1,
  });

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} title="View Schema">
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <line x1="10" y1="6.5" x2="14" y2="6.5" />
          <line x1="6.5" y1="10" x2="6.5" y2="14" />
          <line x1="10" y1="17.5" x2="14" y2="17.5" />
        </svg>
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          {isLoading ? (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-4 p-6 auto-rows-max">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-lg" />
                ))}
              </div>
            </div>
          ) : isError ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                <p className="text-lg font-medium">Unable to load schema</p>
                <p className="text-sm text-muted-foreground">Please verify the database connection.</p>
                <Button onClick={() => refetch()} variant="outline">
                  <RotateCw className="h-4 w-4 mr-2" /> Retry
                </Button>
                <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
              </div>
            </div>
          ) : schema ? (
            <>
              <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card shrink-0">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tables..."
                    className="pl-8 h-8 text-sm"
                  />
                </div>
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setSearchQuery("")}
                    title="Clear search"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <ReactFlowProvider>
                <Canvas
                  schema={schema}
                  connectionName={connectionName}
                  searchQuery={searchQuery}
                  onClose={() => setOpen(false)}
                />
              </ReactFlowProvider>
            </>
          ) : null}
        </div>
      )}
    </>
  );
}
