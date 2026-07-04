function parseDataBR(valor: any): Date {
  if (!valor) return new Date(NaN)
  if (valor instanceof Date) return valor
  if (typeof valor === "number") {
    const utc_days = Math.floor(valor - 25569)
    const utc_value = utc_days * 86400
    const date_info = new Date(utc_value * 1000)
    return new Date(date_info.getUTCFullYear(), date_info.getUTCMonth(), date_info.getUTCDate())
  }
  if (typeof valor === "string") {
    const [dia, mes, ano] = valor.split("/").map(Number)
    return new Date(ano, mes - 1, dia)
  }
  return new Date(NaN)
}

export function indicadores (dadoslimpos: any[]) {

    let entregas = 0

    for (const linha of dadoslimpos) {
        if (linha.Status === "Entregue") {
            entregas++
        }
    }

    let atrasos = 0

    for (const linha of dadoslimpos) {
        const previsao = parseDataBR(linha.PrevisãoEntrega)
        const entrega = parseDataBR(linha.Entrega)

        if (linha.Status === "Entregue" && entrega > previsao) {
            atrasos++
        }
    }

    let gastosFrete = 0

    for (const linha of dadoslimpos) {
        gastosFrete += linha.Frete
    }

    let ocorrencias = 0
    

    for (const linha of dadoslimpos) {
        if (linha.Motivo && linha.Motivo !== "") {
            ocorrencias++
        }
    }

    const taxaocorrencia = dadoslimpos.length > 0 ? (ocorrencias/dadoslimpos.length) : 0

    return {
        entregas,
        atrasos,
        gastosFrete: Number(gastosFrete.toFixed(2)),
        taxaocorrencia
    }
    
}

export function Dashboard (dadoslimpos: any[]) {

    const transportadoras = [...new Set(dadoslimpos.map((u) => u.Transportadora))].filter(Boolean)
    const motivos = [...new Set(dadoslimpos.map((m) => m.Motivo))].filter(Boolean)

    const SLA = []
    const chartData = []
    const chartConfig: Record<string, {label:string, color:string}> = {}
    const coresDoGrafico = [
        "#1d4ed8",
        "#3b82f6",
        "#60a5fa",
        "#1e293b",
        "#94a3b8",
        "#2563eb",
        "#93c5fd",
        "#0f172a",
        "#cbd5e1",
        "#334155"
    ];

    let indexTransp = 0

    for (const transportadora of transportadoras) {

        let entregas = 0
        let entreganoprazo = 0
        
        for (const linha of dadoslimpos) {

            const previsao = parseDataBR(linha.PrevisãoEntrega)
            const entrega = parseDataBR(linha.Entrega)

            if (linha.Status === "Entregue" && linha.Transportadora === transportadora) {
                entregas++

                if (entrega <= previsao) {
                    entreganoprazo++
                }
            }
        }

        const Taxasla = entregas > 0 ? (entreganoprazo / entregas) * 100 : 0
        const chaveTransp = transportadora
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "_")

        SLA.push({
            Transportadora: transportadora, 
            SLA: Number(Taxasla.toFixed(2)),
            fill: `var(--color-${chaveTransp})`
        })

        chartConfig[chaveTransp] = {
            label: transportadora,
            color: coresDoGrafico[indexTransp % coresDoGrafico.length]
        }

        indexTransp++
    }

    for (let i = 0; i < motivos.length; i++) {

        const motivo = motivos[i]
        let qtdOcorrencia = 0

        for (const linha of dadoslimpos) {
            if (linha.Motivo === motivo) {
                qtdOcorrencia++
            }
        }

        const chaveMotivo = motivo
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "_")

        chartData.push({ 
            motivo: motivo, 
            visitors: qtdOcorrencia, 
            fill: `var(--color-${chaveMotivo})` 
        })
        
        chartConfig[chaveMotivo] = {
            label: motivo,
            color: coresDoGrafico[i % coresDoGrafico.length],
        }
    }

    return {
        SLA,
        chartData,
        chartConfig
    }
}