"use client";

import { useRouter } from "next/navigation";
import { useState, type DragEvent } from "react";
import { ExtrairArquivoExcel } from "@/lib/excel";

const COLUNAS_OBRIGATORIAS = [
  "Status",
  "Motivo",
  "Frete",
  "Previsão de Entrega",
  "Entrega",
  "Transportadora",
];

export default function Home() {
  const router = useRouter();
  const [arrastando, setArrastando] = useState(false);

  function processarArquivo(file: File) {
    ExtrairArquivoExcel(file, (dadosLimpos) => {
      localStorage.setItem("DadosExcel", JSON.stringify(dadosLimpos));
      router.push("/dashboard");
    });
  }

  function handleDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setArrastando(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processarArquivo(file);
  }

  return (
    <main className="relative min-h-screen w-full">
      <div className="absolute inset-0 bg-[url('/img-fundo.png')] bg-cover bg-center bg-no-repeat" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-16 lg:px-16">
        <div className="flex w-full max-w-xl flex-col">
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Dashboard de Logística
          </h1>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-slate-600">
            Faça upload do seu arquivo CSV para gerar automaticamente os
            indicadores logísticos da sua operação.
          </p>

          <div className="mt-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <input
              type="file"
              id="subir-csv"
              className="hidden"
              accept=".csv, .xlsx, .xls"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                processarArquivo(file);
              }}
            />

            <label
              htmlFor="subir-csv"
              onDragOver={(e) => {
                e.preventDefault();
                setArrastando(true);
              }}
              onDragLeave={() => setArrastando(false)}
              onDrop={handleDrop}
              className={`flex h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition-colors ${
                arrastando
                  ? "border-blue-400 bg-blue-50"
                  : "border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:bg-blue-50/40"
              }`}
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <UploadCloudIcon className="h-7 w-7 text-blue-600" />
              </div>

              <p className="font-heading text-lg font-medium text-slate-900">
                Arraste seu arquivo CSV aqui
              </p>
              <p className="mt-1 text-sm text-slate-400">
                ou clique para selecionar
              </p>

              <span className="mt-5 inline-flex items-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700">
                Selecionar arquivo
              </span>
            </label>

            <div className="mt-6 border-t border-slate-100 pt-6">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
                  <FileTextIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-700">
                    Seu arquivo CSV deve conter as seguintes colunas:
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {COLUNAS_OBRIGATORIAS.map((coluna) => (
                      <span
                        key={coluna}
                        className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600"
                      >
                        {coluna}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function UploadCloudIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M7 17a4.5 4.5 0 0 1-.4-8.98A5.5 5.5 0 0 1 17.3 9.02 4 4 0 0 1 17 17H7Z"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 11v6m0-6-2.2 2.2M12 11l2.2 2.2"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <path d="M14 3v5h5" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" />
      <path d="M9 13h6M9 17h6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}