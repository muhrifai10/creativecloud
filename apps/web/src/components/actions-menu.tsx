"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, FolderOpen, MoreHorizontal, Pencil, Send, Trash2, Share2 } from "lucide-react";
import type { BrowseItem } from "@/components/explorer";

export function ActionsMenu({
  item,
  onOpen,
  onDownload,
  onRename,
  onDelete,
  onSend,
  onShare,
}: {
  item: BrowseItem;
  onOpen: () => void;
  onDownload: () => void;
  onRename: () => void;
  onDelete: () => void;
  onSend: () => void;
  onShare?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const menuHeight = 220;
      const menuWidth = 190;
      const willOverflowBottom = rect.bottom + menuHeight > window.innerHeight;
      const top = willOverflowBottom
        ? Math.max(8, rect.top - menuHeight - 4)
        : rect.bottom + 4;
      const left = Math.max(8, Math.min(window.innerWidth - menuWidth - 8, rect.right - menuWidth));
      setMenuPos({ top, left });
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onScrollOrResize() {
      setOpen(false);
    }

    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Aksi untuk ${item.name}`}
        onClick={toggleOpen}
        className="rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-ink focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <MoreHorizontal size={18} />
      </button>

      {open &&
        menuPos &&
        mounted &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: "fixed",
              top: menuPos.top,
              left: menuPos.left,
              zIndex: 9999,
            }}
            className="w-48 overflow-hidden rounded-2xl border border-line bg-card py-1.5 shadow-[0_12px_36px_-6px_rgba(20,30,55,0.18)] animate-fade-in-up"
          >
            {item.isFolder && (
              <Item icon={<FolderOpen size={15} />} label="Buka Folder" onClick={() => { setOpen(false); onOpen(); }} />
            )}
            {!item.isFolder && (
              <Item icon={<Download size={15} />} label="Unduh Berkas" onClick={() => { setOpen(false); onDownload(); }} />
            )}
            {!item.isFolder && onShare && (
              <Item icon={<Share2 size={15} />} label="Bagikan Berkas" onClick={() => { setOpen(false); onShare(); }} />
            )}
            {!item.isFolder && (
              <Item icon={<Send size={15} />} label="Kirim ke Cloud" onClick={() => { setOpen(false); onSend(); }} />
            )}
            <Item icon={<Pencil size={15} />} label="Ubah Nama" onClick={() => { setOpen(false); onRename(); }} />
            <div className="my-1 border-t border-line/60" />
            <Item icon={<Trash2 size={15} />} label="Hapus" danger onClick={() => { setOpen(false); onDelete(); }} />
          </div>,
          document.body,
        )}
    </>
  );
}

function Item({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-semibold transition ${
        danger ? "text-rose-600 hover:bg-rose-50" : "text-slate-700 hover:bg-slate-50 hover:text-ink"
      }`}
    >
      <span className={danger ? "text-rose-500" : "text-slate-400"}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
