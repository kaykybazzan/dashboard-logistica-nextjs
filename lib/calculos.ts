import { dataParaISO, gerarChave } from "@/lib/normalizacao";

// ---------------------------------------------------------------------------
// Classificação de entrega baseada em DATA, não em texto de Status.
// Status é digitado por gente e pode ficar desatualizado; Previsão/Entrega
// são fatos. O Status só é usado para os estados terminais que uma data
// sozinha não explica (cancelado, devolvido, extraviado).
// ---------------------------------------------------------------------------

export type ClasseEntrega =
    | "no_prazo" 
    | "atrasado_entregue"
    | "atrasado_pendente"
    | "em_andamento" 
    | "excluido";

const STATUS_EXCLUIDOS_DO_SLA = new Set(["Cancelado", "Devolvido", "Extraviado"]);

export function classificarEntrega(linha: any, hojeISO: string): ClasseEntrega {
    if (STATUS_EXCLUIDOS_DO_SLA.has(linha.Status)) return "excluido";

    const temEntrega = !!linha.Entrega;
    const temPrevisao = !!linha.PrevisãoEntrega;

    if (temEntrega) {
        return linha.Entrega <= linha.PrevisãoEntrega ? "no_prazo" : "atrasado_entregue";
    }

    if (temPrevisao && linha.PrevisãoEntrega < hojeISO) return "atrasado_pendente";
    return "em_andamento";
}

export function indicadores(dadoslimpos: any[]) {
    const hojeISO = dataParaISO(new Date());

    let entreguesNoPrazo = 0;
    let entreguesComAtraso = 0;
    let pendentesAtrasados = 0;
    let emAndamento = 0;
    let excluidos = 0;

    for (const linha of dadoslimpos) {
        switch (classificarEntrega(linha, hojeISO)) {
            case "no_prazo": entreguesNoPrazo++; break;
            case "atrasado_entregue": entreguesComAtraso++; break;
            case "atrasado_pendente": pendentesAtrasados++; break;
            case "em_andamento": emAndamento++; break;
            case "excluido": excluidos++; break;
        }
    }

    let gastosFrete = 0;
    for (const linha of dadoslimpos) {
        gastosFrete += typeof linha.Frete === "number" && Number.isFinite(linha.Frete) ? linha.Frete : 0;
    }

    let ocorrencias = 0;
    for (const linha of dadoslimpos) {
        if (linha.Motivo && linha.Motivo !== "") ocorrencias++;
    }
    const taxaocorrencia = dadoslimpos.length > 0 ? ocorrencias / dadoslimpos.length : 0;

    return {
        entregas: entreguesNoPrazo + entreguesComAtraso,
        atrasos: entreguesComAtraso + pendentesAtrasados,
        gastosFrete: Number(gastosFrete.toFixed(2)),
        taxaocorrencia,
        detalhamento: {
            entreguesNoPrazo,
            entreguesComAtraso,
            pendentesAtrasados,
            emAndamento,
            excluidos,
        },
    };
}

export function Dashboard(dadoslimpos: any[]) {
    const hojeISO = dataParaISO(new Date());
    const transportadoras = [...new Set(dadoslimpos.map((u) => u.Transportadora))].filter(Boolean);
    const motivos = [...new Set(dadoslimpos.map((m) => m.Motivo))].filter(Boolean);

    const SLA: any[] = [];
    const chartData: any[] = [];
    const chartConfig: Record<string, { label: string; color: string }> = {};
    const coresDoGrafico = [
        "#1d4ed8", "#3b82f6", "#60a5fa", "#1e293b", "#94a3b8",
        "#2563eb", "#93c5fd", "#0f172a", "#cbd5e1", "#334155",
    ];

    let indexTransp = 0;
    for (const transportadora of transportadoras) {
        let entregues = 0;
        let entreguesNoPrazo = 0;

        for (const linha of dadoslimpos) {
            if (linha.Transportadora !== transportadora) continue;
            const classe = classificarEntrega(linha, hojeISO);
            if (classe === "no_prazo" || classe === "atrasado_entregue") {
                entregues++;
                if (classe === "no_prazo") entreguesNoPrazo++;
            }
        }

        const Taxasla = entregues > 0 ? (entreguesNoPrazo / entregues) * 100 : 0;
        const chaveTransp = gerarChave(transportadora);

        SLA.push({
            Transportadora: transportadora,
            SLA: Number(Taxasla.toFixed(2)),
            temDados: entregues > 0,
            fill: `var(--color-${chaveTransp})`,
        });

        chartConfig[chaveTransp] = {
            label: transportadora,
            color: coresDoGrafico[indexTransp % coresDoGrafico.length],
        };
        indexTransp++;
    }

    for (let i = 0; i < motivos.length; i++) {
        const motivo = motivos[i];
        let qtdOcorrencia = 0;
        for (const linha of dadoslimpos) {
            if (linha.Motivo === motivo) qtdOcorrencia++;
        }

        const chaveMotivo = gerarChave(motivo);
        chartData.push({ motivo, visitors: qtdOcorrencia, fill: `var(--color-${chaveMotivo})` });
        chartConfig[chaveMotivo] = { label: motivo, color: coresDoGrafico[i % coresDoGrafico.length] };
    }

    return { SLA, chartData, chartConfig };
}