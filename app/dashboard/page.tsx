"use client"

import { SectionCards } from "@/components/indicadores"
import { ChartBarDefault } from "@/components/grafico_barras"
import { ChartPieDonut } from "@/components/grafico_pizza"
import { indicadores, Dashboard } from "@/lib/calculos"
import { useEffect, useState } from "react"


function dashboard() {

    const [dadosPlanilha, setdadosPlanilha] = useState<any[]>([])

    useEffect (() => {
        const dadosGet = localStorage.getItem("DadosExcel")

        if(dadosGet) {
            setdadosPlanilha(JSON.parse(dadosGet))
        }
    },[]
        
)   
    const calculoIndicadores = indicadores(dadosPlanilha)
    const calculosDashboard = Dashboard(dadosPlanilha)

    
    return (
        <div className="min-h-screen w-full bg-gray-100">
        <h1 className="flex items-center justify-center p-10 text-5xl font-bold">Dashboard de Logística</h1>
            <SectionCards data={calculoIndicadores}/>

            <div className="grid grid-cols-2 p-6 gap-6">
                <ChartBarDefault data={calculosDashboard.SLA} config={calculosDashboard.chartConfig}/>
                <ChartPieDonut data={calculosDashboard.chartData} config={calculosDashboard.chartConfig}/>
            </div >

        </div>

    )
}

export default dashboard 