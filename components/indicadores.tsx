"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SectionCardsProps {
  data: {
    entregas?: number;
    atrasos?: number;
    gastosFrete?: number;
    taxaocorrencia?: number;
  };
}

export function SectionCards({ data }: SectionCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
      {/* Card 1: Entregas Concluídas */}
      <Card className="rounded-2xl border border-slate-100 bg-gradient-to-t from-emerald-50/40 to-white p-5 shadow-sm">
        <CardHeader className="flex flex-col gap-2 p-0">
          <CardDescription className="font-body text-sm font-semibold text-slate-500">
            Entregas Concluídas
          </CardDescription>
          <CardTitle className="font-mono text-4xl font-semibold tabular-nums tracking-tight text-emerald-600 sm:text-5xl">
            {data?.entregas ?? 0}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Card 2: Entregas em Atraso */}
      <Card className="rounded-2xl border border-slate-100 bg-gradient-to-t from-red-50/40 to-white p-5 shadow-sm">
        <CardHeader className="flex flex-col gap-2 p-0">
          <CardDescription className="font-body text-sm font-semibold text-slate-500">
            Entregas em Atraso
          </CardDescription>
          <CardTitle className="font-mono text-4xl font-semibold tabular-nums tracking-tight text-red-500 sm:text-5xl">
            {data?.atrasos ?? 0}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Card 3: Gasto Total com Frete */}
      <Card className="rounded-2xl border border-slate-100 bg-gradient-to-t from-blue-50/40 to-white p-5 shadow-sm">
        <CardHeader className="flex flex-col gap-2 p-0">
          <CardDescription className="font-body text-sm font-semibold text-slate-500">
            Gasto Total com Frete
          </CardDescription>
          <CardTitle className="font-mono text-3xl font-semibold tabular-nums tracking-tight text-slate-900 sm:text-4xl">
            {data?.gastosFrete?.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            }) ?? "R$ 0,00"}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Card 4: Taxa de Ocorrências */}
      <Card className="rounded-2xl border border-slate-100 bg-gradient-to-t from-amber-50/40 to-white p-5 shadow-sm">
        <CardHeader className="flex flex-col gap-2 p-0">
          <CardDescription className="font-body text-sm font-semibold text-slate-500">
            Taxa de Ocorrências
          </CardDescription>
          <CardTitle className="font-mono text-4xl font-semibold tabular-nums tracking-tight text-amber-600 sm:text-5xl">
            {((data?.taxaocorrencia ?? 0) * 100).toFixed(1)}%
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}