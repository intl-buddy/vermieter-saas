"use client";

import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";

export type RentRowData = {
  tenant_id: string;
  name: string;
  total_due: number | null;
  total_paid: number | null;
  balance: number | null;
};

/** Ganze Zeile klickbar → Mieter-Detailseite. */
export function RentRow({ row }: { row: RentRowData }) {
  const router = useRouter();
  const href = `/mieteingang/${row.tenant_id}`;
  const isArrears = (row.balance ?? 0) > 0;

  return (
    <TableRow
      onClick={() => router.push(href)}
      className="cursor-pointer hover:bg-neutral-50"
    >
      <TableCell className="font-medium">
        <span className="block max-w-[220px] truncate text-foreground">
          {row.name}
        </span>
      </TableCell>
      <TableCell className="whitespace-nowrap text-right tabular-nums text-muted-foreground">
        {formatCurrency(row.total_due)}
      </TableCell>
      <TableCell className="whitespace-nowrap text-right tabular-nums text-muted-foreground">
        {formatCurrency(row.total_paid)}
      </TableCell>
      <TableCell className="whitespace-nowrap text-right tabular-nums">
        {isArrears ? (
          <Badge variant="danger">{formatCurrency(row.balance)}</Badge>
        ) : row.balance === 0 ? (
          <Badge variant="gold">Alles bezahlt</Badge>
        ) : (
          <span className="text-success-700">
            {formatCurrency(row.balance)}
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}
