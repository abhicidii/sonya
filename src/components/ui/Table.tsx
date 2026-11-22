import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { ArrowDown, ArrowUp, CaretUpDown } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

/**
 * Table primitives. Header row sits on bg-canvas, rows are 48–52px with a hairline divider,
 * numbers right-aligned in Geist Mono.
 */
export function Table({ className, children, ...rest }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full border-separate border-spacing-0 text-left", className)} {...rest}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <thead className={cn("[&_th]:bg-canvas [&_th:first-child]:rounded-l-lg [&_th:last-child]:rounded-r-lg", className)}>
      {children}
    </thead>
  );
}

export function Th({
  children,
  className,
  align = "left",
  sort,
  onSort,
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "right" | "center"; sort?: "asc" | "desc" | null; onSort?: () => void }) {
  const content = (
    <span className={cn("inline-flex items-center gap-1", align === "right" && "flex-row-reverse")}>
      {children}
      {sort !== undefined &&
        (sort === "asc" ? <ArrowUp className="size-3" /> : sort === "desc" ? <ArrowDown className="size-3" /> : <CaretUpDown className="size-3 opacity-60" />)}
    </span>
  );
  return (
    <th
      className={cn(
        "h-9 whitespace-nowrap px-3 t-caption font-normal text-ink-2",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
      {...rest}
    >
      {onSort ? (
        <button onClick={onSort} className="inline-flex items-center hover:text-ink">
          {content}
        </button>
      ) : (
        content
      )}
    </th>
  );
}

export function Tr({ className, children, interactive, selected, ...rest }: HTMLAttributes<HTMLTableRowElement> & { interactive?: boolean; selected?: boolean }) {
  return (
    <tr
      className={cn(
        "group [&>td]:border-b [&>td]:border-line last:[&>td]:border-b-0",
        interactive && "cursor-pointer [&>td]:transition-colors hover:[&>td]:bg-canvas",
        selected && "[&>td]:bg-brand-subtle",
        className,
      )}
      {...rest}
    >
      {children}
    </tr>
  );
}

export function Td({ className, align = "left", children, ...rest }: TdHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "right" | "center" }) {
  return (
    <td
      className={cn("h-12 px-3 t-body text-ink", align === "right" && "text-right", align === "center" && "text-center", className)}
      {...rest}
    >
      {children}
    </td>
  );
}

/** Grouped row ("2026-10 · October  • Partial") */
export function GroupRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="h-10 border-b border-line bg-canvas px-3 t-body-medium text-ink">
        {children}
      </td>
    </tr>
  );
}

export function Pagination({ page, pages, onChange, total, label = "rows" }: { page: number; pages: number; onChange: (p: number) => void; total?: number; label?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-3 t-caption text-ink-2">
      <span>
        {total !== undefined ? (
          <>
            <span className="t-num-sm text-ink">{total.toLocaleString()}</span> {label}
          </>
        ) : null}
      </span>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="h-7 rounded-md px-2 t-caption-medium text-ink-2 hover:bg-subtle hover:text-ink disabled:opacity-40"
        >
          Previous
        </button>
        <span className="px-2 t-num-sm">
          {page} / {pages}
        </span>
        <button
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
          className="h-7 rounded-md px-2 t-caption-medium text-ink-2 hover:bg-subtle hover:text-ink disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
