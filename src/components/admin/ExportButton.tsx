"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

export default function ExportButton() {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/export");
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="(.+)"/);
      const filename = match?.[1] || `terrymurray-export-${new Date().toISOString().slice(0, 10)}.json`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleExport} disabled={loading}>
      {loading ? "Exporting..." : "Export All Data"}
    </Button>
  );
}
