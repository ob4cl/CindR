/**
 * Filesystem bridge for Tauri desktop + Capacitor mobile.
 *
 * When running inside Tauri (desktop), uses native file dialogs
 * via @tauri-apps/plugin-fs and @tauri-apps/plugin-dialog.
 *
 * When running in browser (web/PWA), falls back to Blob download
 * and file input picker — zero dependencies required.
 */

import { exportData, importData } from "./db";

/* ------------------------------------------------------------------ */
/*  Detect platform                                                    */
/* ------------------------------------------------------------------ */

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/* ------------------------------------------------------------------ */
/*  Export (desktop: native Save dialog, web: Blob download)           */
/* ------------------------------------------------------------------ */

export async function exportToFile(): Promise<boolean> {
  const json = await exportData();
  if (!json) return false;

  if (isTauri()) {
    try {
      const { writeTextFile } = await import("@tauri-apps/plugin-fs");
      const { save } = await import("@tauri-apps/plugin-dialog");
      const path = await save({
        defaultPath: `cindr-export-${new Date().toISOString().slice(0, 10)}.json`,
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (path) {
        await writeTextFile(path, json);
        return true;
      }
      return false;
    } catch {
      // Tauri plugin not available — fall through to browser
    }
  }

  // Browser fallback: Blob download
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cindr-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}

/* ------------------------------------------------------------------ */
/*  Import (desktop: native Open dialog, web: file input)              */
/* ------------------------------------------------------------------ */

export async function importFromFile(): Promise<number | null> {
  let json: string | null = null;

  if (isTauri()) {
    try {
      const { readTextFile } = await import("@tauri-apps/plugin-fs");
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        filters: [{ name: "JSON", extensions: ["json"] }],
        multiple: false,
      });
      if (selected) {
        json = await readTextFile(selected as string);
      }
    } catch {
      // Tauri plugin not available — fall through to browser
    }
  }

  if (!json) {
    // Browser fallback: file input picker
    json = await new Promise<string | null>((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return resolve(null);
        resolve(await file.text());
      };
      input.oncancel = () => resolve(null);
      input.click();
    });
  }

  if (!json) return null;
  return importData(json);
}

/* ------------------------------------------------------------------ */
/*  CSV Export (desktop only)                                          */
/* ------------------------------------------------------------------ */

export async function exportToCSV(): Promise<boolean> {
  const { listSubscriptions } = await import("./db");
  const subs = await listSubscriptions();

  const headers = [
    "Name",
    "Amount",
    "Currency",
    "Billing Cycle",
    "Category",
    "Next Renewal",
    "Status",
    "Notes",
  ];
  const rows = subs.map((s) => [
    `"${s.name.replace(/"/g, '""')}"`,
    s.amount,
    s.currency,
    s.billingCycle,
    `"${s.category}"`,
    s.nextRenewal.slice(0, 10),
    s.cancelled ? "Cancelled" : "Active",
    s.notes ? `"${s.notes.replace(/"/g, '""')}"` : "",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const filename = `cindr-export-${new Date().toISOString().slice(0, 10)}.csv`;

  if (isTauri()) {
    try {
      const { writeTextFile } = await import("@tauri-apps/plugin-fs");
      const { save } = await import("@tauri-apps/plugin-dialog");
      const path = await save({
        defaultPath: filename,
        filters: [{ name: "CSV", extensions: ["csv"] }],
      });
      if (path) {
        await writeTextFile(path, csv);
        return true;
      }
      return false;
    } catch {
      // Fall through
    }
  }

  // Browser fallback
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}
