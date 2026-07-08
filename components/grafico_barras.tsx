"use client"

import { gerarChave } from "@/lib/normalizacao"
import { Bar, BarChart, CartesianGrid, XAxis, Cell, YAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "A Performance de Entrega (SLA)"

export function ChartBarDefault({data, config}: {data:any[], config:any}) {
    
    // Criamos uma configuração local para mudar o texto que aparece no balão (Tooltip)
    const mapeamentoTexto = {
        ...config,
        SLA: {
            label: "No Prazo" // Troque aqui pelo texto que você preferir aparecer no balão
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-black font-bold text-2xl">Performance de Entrega (SLA)</CardTitle>
                <CardDescription className="text-gray-700">Percentual de entregas no prazo por transportadora</CardDescription>
            </CardHeader>
            <CardContent>
                {/* Mudamos o config do container para usar o nosso mapeamento com o texto novo */}
                <ChartContainer config={mapeamentoTexto}>
                    <BarChart accessibilityLayer data={data}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="Transportadora"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                        />
                        <YAxis 
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            unit="%"
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel={false} 
                            formatter={(value) => `${Number(value).toFixed(2)}%`}/>}
                        />
                        <Bar dataKey="SLA" radius={8}>
                            {data.map((entry, index) => {
                            const chaveTransp = gerarChave(entry.Transportadora);
                            return (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={config[chaveTransp]?.color || "#3b82f6"} 
                                />
                            )
                        })}
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </CardContent>

        </Card>
    )
}