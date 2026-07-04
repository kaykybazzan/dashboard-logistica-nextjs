import * as XLSX from "xlsx";

export function ExtrairArquivoExcel(
    file: File,
    onDadosProntos: (dados: any[]) => void,
    onErro?: (mensagem: string) => void
) {

    const leitor = new FileReader()

    leitor.onerror = function () {
        console.error("Erro ao ler o arquivo")
        onErro?.("Não foi possível ler o arquivo. Tente novamente.")
    }

    leitor.onload = function (event) {
        try {
            const dados = event.target?.result

            const workbook = XLSX.read(dados, { type: "array" })
            const sheetname = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetname]

            // Pega o cabeçalho real da planilha (linha 1) e remove espaços
            // acidentais no início/fim de cada nome de coluna (ex: "Motivo ").
            const headerRowBruto = (XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[]) ?? []
            const headerRow = headerRowBruto.map((coluna) => String(coluna ?? "").trim())

            console.log("Cabeçalho exato lido:", JSON.stringify(headerRow))

            const jsondata = XLSX.utils.sheet_to_json(worksheet) as any[]

            const colunasNecessarias = [
                "ID",
                "Status",
                "Motivo",
                "Frete",
                "Previsão de Entrega",
                "Entrega",
                "Transportadora",
            ]
            const faltando = colunasNecessarias.filter(
                (coluna) => !headerRow.includes(coluna)
            )

            if (faltando.length > 0) {
                console.error("Colunas faltando no arquivo:", faltando)
                onErro?.(
                    `O arquivo está sem as colunas: ${faltando.join(", ")}`
                )
                return
            }

            const dadosfiltrados = jsondata.filter((linha) => {
                return linha.ID !== undefined
            })

            const dadoslimpos = dadosfiltrados.map((linha) => {
                const freteBruto = parseFloat(
                    String(linha["Frete"] ?? "0").replace(",", ".")
                )

                return {
                    ID: linha["ID"],
                    Status: linha["Status"],
                    Motivo: linha["Motivo"],
                    Frete: isNaN(freteBruto) ? 0 : freteBruto,
                    PrevisãoEntrega: linha["Previsão de Entrega"],
                    Entrega: linha["Entrega"],
                    Transportadora: linha["Transportadora"],
                }
            })

            onDadosProntos(dadoslimpos)
        } catch (erro) {
            console.error("Erro ao processar o arquivo:", erro)
            onErro?.("Não foi possível processar o arquivo. Verifique o formato.")
        }
    }

    leitor.readAsArrayBuffer(file)
}
