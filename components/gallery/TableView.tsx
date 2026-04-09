"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import type { DbView } from "@/components/DatabaseViewtabs";
import { useYjsTable } from "@/components/YjsProvider";
import { useOptionalAuth } from "@/components/AuthContext";

import AddPropertyModal from "./AddPropertyModal";
import TableHeaderCell from "./TableHeadercell";
import TableCell from "./TableCell";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import { Plus, Trash2 } from "lucide-react";

type Property = {
  _id: string;
  name: string;
  type: string;
  options?: string[];
};

type Item = {
  _id: string;
  title?: string;
  values?: Record<string, unknown>;
};

function dedupeById<T extends { _id?: string }>(list: T[]): T[] {
  const map = new Map<string, T>();
  list.forEach((item) => {
    const id = String(item?._id || "");
    if (!id) return;
    map.set(id, item);
  });
  return Array.from(map.values());
}

export default function TableView({
  databaseId,
  activeView,
  isDark: isDarkProp,
}: {
  databaseId: string;
  activeView?: DbView;
  isDark?: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = isDarkProp ?? resolvedTheme === "dark";
  const roomName = `${databaseId}-${activeView?.type ?? "all-items"}`;
  const auth = useOptionalAuth();
  const user = auth?.user ?? null;

  const {
    yjsInitialized,
    properties: yjsProperties,
    rows: yjsRows,
    addProperty: addPropertyYjs,
    updateProperty: updatePropertyYjs,
    addRow: addRowYjs,
    updateRow: updateRowYjs,
    deleteRow: deleteRowYjs,
    replaceProperties,
    replaceRows,
    participants,
    setMyActivity,
  } = useYjsTable(`table-room-${roomName}`, {
    currentUser: user
      ? {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      : undefined,
  });

  const [localProperties, setLocalProperties] = useState<Property[]>([]);
  const [localRows, setLocalRows] = useState<Item[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const prevPropertyCount = useRef(0);

  const rawProperties = (yjsInitialized ? yjsProperties : localProperties) as Property[];
  const rawRows = (yjsInitialized ? yjsRows : localRows) as Item[];

  const properties = useMemo(() => dedupeById<Property>(rawProperties), [rawProperties]);
  const rows = useMemo(() => dedupeById<Item>(rawRows), [rawRows]);

  const fetchProperties = async () => {
    const res = await fetch(`/api/properties?databaseId=${databaseId}`);
    const data = await res.json();
    const next = Array.isArray(data) ? data : [];

    if (yjsInitialized) {
      replaceProperties(next);
    } else {
      setLocalProperties(next);
    }
  };

  const fetchRows = async () => {
    const mode = activeView?.type === "my-tasks" ? "&mode=assigned" : "";
    const res = await fetch(`/api/items?databaseId=${databaseId}${mode}`);
    const data = await res.json();
    const next = Array.isArray(data) ? data : [];

    if (yjsInitialized) {
      replaceRows(next);
    } else {
      setLocalRows(next);
    }
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      const mode = activeView?.type === "my-tasks" ? "&mode=assigned" : "";
      const [propRes, rowRes] = await Promise.all([
        fetch(`/api/properties?databaseId=${databaseId}`),
        fetch(`/api/items?databaseId=${databaseId}${mode}`),
      ]);

      const [propData, rowData] = await Promise.all([propRes.json(), rowRes.json()]);

      if (!active) return;

      const nextProperties = dedupeById<Property>(Array.isArray(propData) ? propData : []);
      const nextRows = dedupeById<Item>(Array.isArray(rowData) ? rowData : []);

      if (yjsInitialized) {
        if (yjsProperties.length === 0) {
          replaceProperties(nextProperties);
        }
        if (yjsRows.length === 0) {
          replaceRows(nextRows);
        }
      } else {
        setLocalProperties(nextProperties);
        setLocalRows(nextRows);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [databaseId, activeView?.type, yjsInitialized, yjsProperties.length, yjsRows.length, replaceProperties, replaceRows]);

  useEffect(() => {
    if (!yjsInitialized) return;

    const uniqueProperties = dedupeById<Property>(yjsProperties as Property[]);
    if (uniqueProperties.length !== yjsProperties.length) {
      replaceProperties(uniqueProperties);
    }

    const uniqueRows = dedupeById<Item>(yjsRows as Item[]);
    if (uniqueRows.length !== yjsRows.length) {
      replaceRows(uniqueRows);
    }
  }, [yjsInitialized, yjsProperties, yjsRows, replaceProperties, replaceRows]);

  const addRow = async () => {
    setMyActivity("Adding a row");
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        databaseId,
        values: {
          title: "Untitled",
        },
      }),
    });

    const created = await res.json();
    if (yjsInitialized) {
      addRowYjs(created);
    } else {
      setLocalRows((prev) => [...prev, created]);
    }
    console.log(isDark);
  };

  const deleteRow = async (rowId: string) => {
    setMyActivity("Deleting a row");
    if (yjsInitialized) {
      const rowIndex = rows.findIndex((r) => r._id === rowId);
      if (rowIndex >= 0) {
        deleteRowYjs(rowIndex);
      }
    }

    await fetch(`/api/items/${rowId}`, { method: "DELETE" });

    if (!yjsInitialized) {
      setLocalRows((prev) => prev.filter((r) => r._id !== rowId));
    }
  };

  const handleCellUpdate = (rowId: string, propertyId: string, value: string | number | boolean) => {
    if (!yjsInitialized) return;

    setMyActivity(`Editing ${String(propertyId).slice(0, 10)}`);

    const rowIndex = rows.findIndex((r) => r._id === rowId);
    if (rowIndex < 0) return;

    const current = rows[rowIndex];
    const nextRow: Item = {
      ...current,
      values: {
        ...(current.values || {}),
        [propertyId]: value,
      },
    };

    updateRowYjs(rowIndex, nextRow);
  };

  const handlePropertyUpdate = (
    propertyId: string,
    updates: { name?: string; type?: string; formula?: string }
  ) => {
    if (!yjsInitialized) return;

    setMyActivity("Updating a column");

    const propertyIndex = properties.findIndex((p) => p._id === propertyId);
    if (propertyIndex < 0) return;

    const nextProperty: Property = {
      ...properties[propertyIndex],
      ...updates,
    };

    updatePropertyYjs(propertyIndex, nextProperty);
  };

  const viewLabel = activeView?.type === "my-tasks" ? "My Tasks" : "All Items";
  useEffect(() => {
    const prev = prevPropertyCount.current;
    if (prev > 0 && properties.length > prev && scrollRef.current) {
      scrollRef.current.scrollTo({
        left: scrollRef.current.scrollWidth,
        behavior: "smooth",
      });
    }
    prevPropertyCount.current = properties.length;
  }, [properties.length]);  


  return (
    <Card className={`border-none ${isDark ? "bg-zinc-900" : "bg-transparent"} shadow-sm`}>
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <CardTitle>Table</CardTitle>
          <Badge variant="outline" className="text-xs">{viewLabel}</Badge>
          {participants.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {participants.length} online
            </Badge>
          )}
          {participants.slice(0, 3).map((p) => (
            <Badge key={p.clientId} variant="outline" className="text-xs">
              {p.name}: {p.activity || "Viewing"}
            </Badge>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOpenModal(true)}
          >
            + Property
          </Button>

          <Button size="sm" variant="outline" onClick={addRow}>
            <Plus className="mr-2 h-4 w-4" />
            Row
          </Button>
        </div>
      </CardHeader>

      <Separator />



    
  
      
      {/* <div className="min-w-[1200px]"></div> */}
      {/* Table Grid */}
      <CardContent className="p-0 overflow-x-auto">
        <div ref={scrollRef} className="w-full overflow-x-auto overflow-y-auto  [scrollbar-gutter:stable_both-edges]">
          <div className="min-w-full w-max">
            <hr/>
            {/* Columns */}
            <div className="sticky top-0 z-10 flex border-b bg-muted/60 backdrop-blur">
              <div className="w-[60px] shrink-0 px-3 py-2 text-xs border-l text-muted-foreground border-r">
                #
              </div>

              {properties.map((p) => (
                <TableHeaderCell
                  key={p._id}
                  property={p}
                  refresh={fetchProperties}
                  onPropertyUpdate={handlePropertyUpdate}
                />
              ))}

              <div className="w-14 shrink-0 border-r px-3 py-2 text-xs text-muted-foreground text-center">
                Del
              </div>
            </div>

            {/* Rows */}
            {rows.map((row, index) => (
              <div key={row._id} className="group flex border-b border-l hover:bg-muted/30">
                <div className="w-[60px] shrink-0 px-3 py-2 text-xs text-muted-foreground border-r">
                  {index + 1}
                </div>

                {properties.map((p) => (
                  <TableCell
                    key={p._id}
                    row={row}
                    property={p}
                    properties={properties}
                    refreshRows={fetchRows}
                    onCellUpdate={handleCellUpdate}
                  />
                ))}

                <div className="w-14 shrink-0 border-r px-2 py-2 flex items-center justify-center">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 opacity-60 group-hover:opacity-100"
                    onClick={() => deleteRow(row._id)}
                    title="Delete row"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}

            {rows.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                No rows yet. Click Row to create your first item.
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Footer Add Row */}
        {/* <Button
          variant="ghost"
          className="w-full justify-start rounded-none px-4 py-6 text-muted-foreground"
          onClick={addRow}
        >
          + New
        </Button> */}
      </CardContent>

      {/* Add Property Modal */}
      <AddPropertyModal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        databaseId={databaseId}
        onSaved={fetchProperties}
      />
    </Card>
  );
}
