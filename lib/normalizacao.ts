export interface ItemRelatorio {
    linha: number;
    coluna: string;
    valorEncontrado: string;
    problema: string;
    correcaoAplicada?: string;
}

export interface RelatorioValidacao {
    erros: ItemRelatorio[];
    avisos: ItemRelatorio[];
    correcoes: ItemRelatorio[];
}

export function criarRelatorioVazio(): RelatorioValidacao {
    return { erros: [], avisos: [], correcoes: [] };
}

export function limparTexto(valor: unknown): string {
    if (valor === null || valor === undefined) return "";
    return String(valor)
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

export function gerarChave(valor: unknown): string {
    return (
        limparTexto(valor)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "") || "indefinido"
    );
}

const CONECTORES = new Set(["com", "de", "da", "do", "das", "dos", "e", "em", "a", "o"]);
function paraTitleCase(valor: string): string {
    return valor
        .toLowerCase()
        .split(" ")
        .map((p, i) => {
            if (p.length === 0) return p;
            if (i > 0 && CONECTORES.has(p)) return p;
            return p[0].toUpperCase() + p.slice(1);
        })
        .join(" ");
}

export function normalizarNomeColuna(valor: string): string {
    return limparTexto(valor)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ");
}

const SINONIMOS_STATUS: Record<string, string> = {
    "entregue": "Entregue", "concluido": "Entregue", "concluida": "Entregue",
    "finalizado": "Entregue", "finalizada": "Entregue", "entregou": "Entregue",
    "ok": "Entregue", "delivered": "Entregue",

    "entregue com atraso": "Entregue com Atraso", "entregue c/ atraso": "Entregue com Atraso",
    "entregue atrasado": "Entregue com Atraso", "entregue atrasada": "Entregue com Atraso",
    "entrega atrasada": "Entregue com Atraso", "delivered late": "Entregue com Atraso",

    "atrasado": "Atrasado", "atrasada": "Atrasado", "atraso": "Atrasado",
    "em atraso": "Atrasado", "delayed": "Atrasado", "late": "Atrasado",

    "em transporte": "Em Transporte", "em transito": "Em Transporte",
    "a caminho": "Em Transporte", "em rota": "Em Transporte",
    "saiu para entrega": "Em Transporte", "in transit": "Em Transporte",

    "em separacao": "Em Separação", "separando": "Em Separação",
    "em preparo": "Em Separação", "preparando": "Em Separação",
    "processing": "Em Separação", "pendente": "Em Separação",

    "cancelado": "Cancelado", "cancelada": "Cancelado",
    "canceled": "Cancelado", "cancelled": "Cancelado",

    "devolvido": "Devolvido", "devolvida": "Devolvido", "returned": "Devolvido",

    "extraviado": "Extraviado", "extraviada": "Extraviado",
    "perdido": "Extraviado", "perdida": "Extraviado", "lost": "Extraviado",
};

function reconhecerStatusPorAproximacao(chave: string): string | null {
    const temEntrega = chave.includes("entreg");
    const temAtraso = chave.includes("atras");
    if (temEntrega && temAtraso) return "Entregue com Atraso";
    if (temEntrega) return "Entregue";
    if (temAtraso) return "Atrasado";
    if (chave.includes("cancel")) return "Cancelado";
    if (chave.includes("devol")) return "Devolvido";
    if (chave.includes("extravi") || chave.includes("perdid")) return "Extraviado";
    if (chave.includes("transport") || chave.includes("transit") || chave.includes("caminho") || chave.includes("rota")) return "Em Transporte";
    if (chave.includes("separa") || chave.includes("prepar") || chave.includes("process")) return "Em Separação";
    return null;
}

export function normalizarStatus(valorBruto: unknown) {
    const limpo = limparTexto(valorBruto);

    if (limpo === "") {
        return { valor: "", foiCorrigido: false, naoReconhecido: false, vazio: true };
    }

    const chave = limpo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const direto = SINONIMOS_STATUS[chave];
    if (direto) {
        return { valor: direto, foiCorrigido: direto !== limpo, naoReconhecido: false, vazio: false };
    }

    const aproximado = reconhecerStatusPorAproximacao(chave);
    if (aproximado) {
        return { valor: aproximado, foiCorrigido: true, naoReconhecido: false, vazio: false };
    }

    const valorPadronizado = paraTitleCase(limpo);
    return {
        valor: valorPadronizado,
        foiCorrigido: valorPadronizado !== limpo,
        naoReconhecido: true,
        vazio: false,
    };
}

const VALORES_VAZIOS = new Set(["-", "--", "n/a", "na", "nao informado", "nao se aplica"]);

export function normalizarTextoLivre(valorBruto: unknown) {
    const limpo = limparTexto(valorBruto);
    const chave = limpo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (VALORES_VAZIOS.has(chave)) {
        return { valor: "", foiCorrigido: limpo !== "" };
    }
    const padronizado = paraTitleCase(limpo);
    return { valor: padronizado, foiCorrigido: padronizado !== limpo };
}

export function normalizarFrete(valorBruto: unknown) {
    if (typeof valorBruto === "number") {
        if (!Number.isFinite(valorBruto)) {
            return { valor: null, erro: "Frete inválido (Infinity/NaN)", foiCorrigido: false };
        }
        return { valor: valorBruto, aviso: valorBruto < 0 ? "Frete negativo" : undefined, foiCorrigido: false };
    }

    const bruto = limparTexto(valorBruto);
    if (bruto === "") {
        return { valor: null, erro: "Frete ausente/vazio", foiCorrigido: false };
    }

    let s = bruto.replace(/R\$/gi, "").replace(/\s/g, "");
    const temPonto = s.includes(".");
    const temVirgula = s.includes(",");

    if (temPonto && temVirgula) {
        const posPonto = s.lastIndexOf(".");
        const posVirgula = s.lastIndexOf(",");
        s = posVirgula > posPonto ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
    } else if (temVirgula) {
        s = s.replace(",", ".");
    } else if (temPonto) {
        const partes = s.split(".");
        if (partes.length === 2 && partes[1].length === 3) s = s.replace(".", "");
    }

    const numero = parseFloat(s);
    if (isNaN(numero) || !Number.isFinite(numero)) {
        return { valor: null, erro: `Frete não conversível: "${bruto}"`, foiCorrigido: false };
    }

    return { valor: numero, aviso: numero < 0 ? "Frete negativo" : undefined, foiCorrigido: String(numero) !== bruto };
}

function dataEhValida(ano: number, mes: number, dia: number): boolean {
    if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return false;
    const d = new Date(ano, mes - 1, dia);
    return d.getFullYear() === ano && d.getMonth() === mes - 1 && d.getDate() === dia;
}

function expandirAno2Digitos(ano2: number): number {
    const anoAtual = new Date().getFullYear();
    const candidato = Math.floor(anoAtual / 100) * 100 + ano2;
    return candidato > anoAtual + 20 ? candidato - 100 : candidato;
}

export function parseDataBR(valorBruto: unknown): { data: Date | null; erro?: string; foiCorrigido: boolean } {
    if (valorBruto === null || valorBruto === undefined || valorBruto === "") {
        return { data: null, erro: "Data ausente", foiCorrigido: false };
    }

    if (valorBruto instanceof Date) {
        if (isNaN(valorBruto.getTime())) return { data: null, erro: "Data inválida", foiCorrigido: false };
        return { data: valorBruto, foiCorrigido: false };
    }

    if (typeof valorBruto === "number") {
        const utcDias = Math.floor(valorBruto - 25569);
        const d = new Date(utcDias * 86400 * 1000);
        if (isNaN(d.getTime())) return { data: null, erro: "Data serial Excel inválida", foiCorrigido: false };
        return { data: new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()), foiCorrigido: false };
    }

    const texto = limparTexto(valorBruto);

    const isoMatch = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
        const [, anoS, mesS, diaS] = isoMatch;
        const ano = Number(anoS), mes = Number(mesS), dia = Number(diaS);
        if (!dataEhValida(ano, mes, dia)) return { data: null, erro: `Data ISO impossível: "${texto}"`, foiCorrigido: false };
        return { data: new Date(ano, mes - 1, dia), foiCorrigido: false };
    }

    const brMatch = texto.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
    if (brMatch) {
        const [, diaS, mesS, anoS] = brMatch;
        let ano = Number(anoS);
        let foiCorrigido = false;
        if (anoS.length <= 2) {
            ano = expandirAno2Digitos(ano);
            foiCorrigido = true;
        }
        const dia = Number(diaS), mes = Number(mesS);
        if (!dataEhValida(ano, mes, dia)) {
            return { data: null, erro: `Data impossível: "${texto}"`, foiCorrigido: false };
        }
        return { data: new Date(ano, mes - 1, dia), foiCorrigido };
    }

    return { data: null, erro: `Formato de data não reconhecido: "${texto}"`, foiCorrigido: false };
}

export function dataParaISO(d: Date): string {
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}