"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const BADGE = {
  warn: "bg-warn-soft text-warn-ink",
  brand: "bg-brand-soft text-brand-ink",
  gap: "bg-gap-soft text-gap-ink",
};

/**
 * columns: [{ id, title }]
 * cards: [{ id, col, title, sub?, badge?: { text, tone } }]
 * onMove(cardId, toColId, fromColId)
 * Mouse: drag a card onto a column. Touch: press and hold a card, then drag it onto a column. Touch / keyboard: tap
 * (or Enter) a card to pick it up, then tap a column.
 * renderCard(card, { dragging }) (optional) renders the card body yourself (links, buttons, menus); the card is then
 * a draggable wrapper only, and tap-to-pick-up is left to your own controls.
 */
export default function KanbanBoard({ columns, cards, onMove, renderCard, className }) {
  const [picked, setPicked] = useState(null);
  const [over, setOver] = useState(null);
  const [touching, setTouching] = useState(null);
  const live = useRef({ cards, onMove });
  live.current = { cards, onMove };
  const root = useRef(null);

  // Touch drag: hold a card for 300 ms, then drag it over a column and lift. Scroll stays free until the hold fires.
  useEffect(() => {
    const el = root.current;
    if (!el || !renderCard) return;
    let timer = 0;
    let id = null;
    let sx = 0;
    let sy = 0;
    let active = false;
    const colAt = (t) => document.elementFromPoint(t.clientX, t.clientY)?.closest("[data-kanban-col]")?.dataset.kanbanCol ?? null;
    const reset = () => {
      clearTimeout(timer);
      id = null;
      active = false;
      setTouching(null);
      setOver(null);
    };
    const start = (e) => {
      const card = e.target.closest?.("[data-kanban-card]");
      if (!card || e.touches.length !== 1 || e.target.closest("button, input, [role=menuitem]")) return;
      id = card.dataset.kanbanCard;
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
      timer = window.setTimeout(() => {
        active = true;
        setTouching(id);
        navigator.vibrate?.(8);
      }, 300);
    };
    const mv = (e) => {
      const t = e.touches[0];
      if (!active) {
        if (Math.hypot(t.clientX - sx, t.clientY - sy) > 8) clearTimeout(timer);
        return;
      }
      e.preventDefault();
      setOver(colAt(t));
    };
    const end = (e) => {
      if (active) {
        if (e.cancelable) e.preventDefault(); // no link tap after a drag
        const to = colAt(e.changedTouches[0]);
        const c = live.current.cards.find((x) => x.id === id);
        if (to && c && c.col !== to) live.current.onMove?.(id, to, c.col);
      }
      reset();
    };
    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchmove", mv, { passive: false });
    el.addEventListener("touchend", end);
    el.addEventListener("touchcancel", reset);
    return () => {
      clearTimeout(timer);
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", mv);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", reset);
    };
  }, [renderCard]);

  const move = (id, to) => {
    const c = cards.find((x) => x.id === id);
    if (c && c.col !== to) onMove?.(id, to, c.col);
    setPicked(null);
    setOver(null);
  };

  return (
    <div ref={root} className={cn("flex snap-x gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:overflow-visible", className)}>
      {columns.map((col) => {
        const items = cards.filter((c) => c.col === col.id);
        const canDrop = picked && cards.find((c) => c.id === picked)?.col !== col.id;
        return (
          <section
            key={col.id}
            data-kanban-col={col.id}
            aria-label={col.title}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(col.id);
            }}
            onDragLeave={() => setOver((o) => (o === col.id ? null : o))}
            onDrop={(e) => {
              e.preventDefault();
              move(e.dataTransfer.getData("text/plain"), col.id);
            }}
            className={cn(
              "min-h-40 w-[78%] shrink-0 snap-start rounded-[18px] bg-soft p-3 transition-colors duration-200 md:w-auto",
              over === col.id && "bg-brand-soft ring-2 ring-brand",
            )}
          >
            <h4 className="mb-2 px-1 font-doc text-base normal-case tracking-normal text-muted">{col.title}</h4>
            <div className="space-y-2">
              {items.map((c) =>
                renderCard ? (
                  <div
                    key={c.id}
                    data-kanban-card={c.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", c.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    className={cn(
                      "select-none rounded-[14px] bg-panel px-3.5 py-3 shadow-card transition-all duration-200 [-webkit-touch-callout:none] md:cursor-grab",
                      touching === c.id && "-translate-y-0.5 scale-[1.02] ring-2 ring-brand",
                    )}
                  >
                    {renderCard(c, { dragging: touching === c.id })}
                  </div>
                ) : (
                <div
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  draggable
                  aria-pressed={picked === c.id}
                  aria-label={`${c.title}${c.sub ? `, ${c.sub}` : ""}. press enter to pick up`}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", c.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onClick={() => setPicked((p) => (p === c.id ? null : c.id))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setPicked((p) => (p === c.id ? null : c.id));
                    }
                    if (e.key === "Escape") setPicked(null);
                  }}
                  className={cn(
                    "cursor-grab touch-manipulation rounded-[14px] bg-panel px-3.5 py-3 shadow-card transition-all duration-200 active:cursor-grabbing",
                    picked === c.id && "-translate-y-0.5 ring-2 ring-brand",
                  )}
                >
                  <p className="font-doc text-base text-text">{c.title}</p>
                  {c.sub && <p className="font-doc text-sm text-muted">{c.sub}</p>}
                  {c.badge && (
                    <span className={cn("mt-2 inline-block rounded-[9px] px-2.5 py-1 font-doc text-sm", BADGE[c.badge.tone] || BADGE.warn)}>
                      {c.badge.text}
                    </span>
                  )}
                </div>
                ),
              )}
              {canDrop && (
                <button
                  type="button"
                  onClick={() => move(picked, col.id)}
                  className="fade-up w-full rounded-[14px] border border-dashed border-brand py-3 text-sm text-brand-ink hover:bg-brand-soft"
                >
                  move here
                </button>
              )}
              {!items.length && !canDrop && <p className="px-1 py-3 text-sm text-muted">nothing here</p>}
            </div>
          </section>
        );
      })}
    </div>
  );
}
