import * as XLSX from "xlsx";
import {
    criarRelatorioVazio,
    normalizarNomeColuna,
    normalizarStatus,
    normalizarTextoLivre,
    normalizarFrete,
    parseDataBR,
    dataParaISO,
    type RelatorioValidacao,
} from "@/lib/normalizacao";

const COLUNAS_NECESSARIAS = [
    "Status", "Motivo", "Frete", "Previsão de Entrega", "Entrega", "Transportadora",
];

export function ExtrairArquivoExcel(
    file: File,
    onDadosProntos: (dados: any[], relatorio: RelatorioValidacao) => void,
    onErro?: (mensagem: string, relatorio?: RelatorioValidacao) => void
) {
    const leitor = new FileReader();

    leitor.onerror = function () {
        onErro?.("Não foi possível ler o arquivo. Tente novamente.");
    };

    leitor.onload = function (event) {
        const relatorio = criarRelatorioVazio();

        try {
            const dados = event.target?.result;
            if (!dados || (dados as ArrayBuffer).byteLength === 0) {
                onErro?.("O arquivo está vazio.");
                return;
            }

            const workbook = XLSX.read(dados, { type: "array" });
            if (!workbook.SheetNames.length) {
                onErro?.("O arquivo não contém nenhuma planilha.");
                return;
            }

            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const headerRow = (
                (XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[]) ?? []
            ).map((c) => String(c ?? ""));

            if (headerRow.every((c) => c.trim() === "")) {
                onErro?.("A planilha não tem cabeçalho ou está vazia.");
                return;
            }

            const mapaColunas = new Map<string, string[]>();
            for (const original of headerRow) {
                if (original.trim() === "") continue;
                const chave = normalizarNomeColuna(original);
                mapaColunas.set(chave, [...(mapaColunas.get(chave) ?? []), original]);
            }

            const resolucaoColunas: Record<string, string> = {};
            const faltando: string[] = [];
            const duplicadas: string[] = [];

            for (const necessaria of COLUNAS_NECESSARIAS) {
                const encontradas = mapaColunas.get(normalizarNomeColuna(necessaria));
                if (!encontradas) faltando.push(necessaria);
                else if (encontradas.length > 1) duplicadas.push(necessaria);
                else resolucaoColunas[necessaria] = encontradas[0];
            }

            if (faltando.length > 0) {
                onErro?.(`O arquivo está sem as colunas: ${faltando.join(", ")}`);
                return;
            }
            if (duplicadas.length > 0) {
                onErro?.(`Coluna duplicada no arquivo: ${duplicadas.join(", ")}`);
                return;
            }

            const jsondata = XLSX.utils.sheet_to_json(worksheet) as any[];
            if (jsondata.length === 0) {
                onErro?.("A planilha não tem nenhuma linha de dados.");
                return;
            }

            const idsVistos = new Set<string>();
            const dadosLimpos: any[] = [];

            jsondata.forEach((linhaBruta, indice) => {
                const numeroLinha = indice + 2;

                const idBruto = resolucaoColunas["ID"] ? linhaBruta[resolucaoColunas["ID"]] : undefined;
                const idOriginal = idBruto === undefined || idBruto === null ? "" : String(idBruto).trim();
                const id = idOriginal !== "" ? idOriginal : `linha-${numeroLinha}`;

                if (idOriginal !== "") {
                    if (idsVistos.has(id)) {
                        relatorio.avisos.push({
                            linha: numeroLinha, coluna: "ID", valorEncontrado: id,
                            problema: "ID duplicado — linha ignorada",
                        });
                        return;
                    }
                    idsVistos.add(id);
                }

                let bloqueada = false;

                const statusR = normalizarStatus(linhaBruta[resolucaoColunas["Status"]]);
                if (statusR.vazio) {
                    relatorio.erros.push({
                        linha: numeroLinha, coluna: "Status", valorEncontrado: "",
                        problema: "Status obrigatório vazio",
                    });
                    bloqueada = true;
                }
                if (statusR.foiCorrigido) {
                    relatorio.correcoes.push({
                        linha: numeroLinha, coluna: "Status",
                        valorEncontrado: String(linhaBruta[resolucaoColunas["Status"]] ?? ""),
                        problema: "Escrita divergente do padrão", correcaoAplicada: statusR.valor,
                    });
                }
                if (statusR.naoReconhecido) {
                    relatorio.avisos.push({
                        linha: numeroLinha, coluna: "Status", valorEncontrado: statusR.valor,
                        problema: "Status não reconhecido — não entra em nenhuma contagem conhecida",
                    });
                }

                const transpR = normalizarTextoLivre(linhaBruta[resolucaoColunas["Transportadora"]]);
                if (transpR.valor === "") {
                    relatorio.erros.push({
                        linha: numeroLinha, coluna: "Transportadora", valorEncontrado: "",
                        problema: "Transportadora obrigatória vazia",
                    });
                    bloqueada = true;
                }

                const motivoR = normalizarTextoLivre(linhaBruta[resolucaoColunas["Motivo"]]);

                const freteR = normalizarFrete(linhaBruta[resolucaoColunas["Frete"]]);
                if (freteR.erro) {
                    relatorio.erros.push({
                        linha: numeroLinha, coluna: "Frete",
                        valorEncontrado: String(linhaBruta[resolucaoColunas["Frete"]] ?? ""),
                        problema: freteR.erro,
                    });
                    bloqueada = true;
                } else if (freteR.aviso) {
                    relatorio.avisos.push({
                        linha: numeroLinha, coluna: "Frete", valorEncontrado: String(freteR.valor), problema: freteR.aviso,
                    });
                } else if (freteR.foiCorrigido) {
                    relatorio.correcoes.push({
                        linha: numeroLinha, coluna: "Frete",
                        valorEncontrado: String(linhaBruta[resolucaoColunas["Frete"]] ?? ""),
                        problema: "Formatação de moeda", correcaoAplicada: String(freteR.valor),
                    });
                }

                const previsaoR = parseDataBR(linhaBruta[resolucaoColunas["Previsão de Entrega"]]);
                if (previsaoR.erro) {
                    relatorio.erros.push({
                        linha: numeroLinha, coluna: "Previsão de Entrega",
                        valorEncontrado: String(linhaBruta[resolucaoColunas["Previsão de Entrega"]] ?? ""),
                        problema: previsaoR.erro,
                    });
                    bloqueada = true;
                }

                const entregaBruta = linhaBruta[resolucaoColunas["Entrega"]];
                const entregaPreenchida = entregaBruta !== undefined && entregaBruta !== null && String(entregaBruta).trim() !== "";
                const entregaR = parseDataBR(entregaBruta);
                if (entregaPreenchida && entregaR.erro) {
                    relatorio.erros.push({
                        linha: numeroLinha, coluna: "Entrega", valorEncontrado: String(entregaBruta), problema: entregaR.erro,
                    });
                    bloqueada = true;
                }

                if (bloqueada) return;

                dadosLimpos.push({
                    ID: id,
                    Status: statusR.valor,
                    Motivo: motivoR.valor,
                    Frete: freteR.valor ?? 0,
                    PrevisãoEntrega: previsaoR.data ? dataParaISO(previsaoR.data) : "",
                    Entrega: entregaR.data ? dataParaISO(entregaR.data) : "",
                    Transportadora: transpR.valor,
                });
            });

            if (dadosLimpos.length === 0) {
                onErro?.("Nenhuma linha válida após a validação. Verifique o relatório de erros.", relatorio);
                return;
            }

            onDadosProntos(dadosLimpos, relatorio);
        } catch (erro) {
            console.error("Erro ao processar o arquivo:", erro);
            onErro?.("Não foi possível processar o arquivo. Verifique o formato.");
        }
    };

    leitor.readAsArrayBuffer(file);
}