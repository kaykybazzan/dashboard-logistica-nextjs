"use client"

import { TrendingUp } from "lucide-react"
import { Pie, PieChart, Cell, Legend } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "A donut chart"

export function ChartPieDonut({data, config}: {data:any[], config:any}) {
    return (
        <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
                <CardTitle className="text-black font-bold text-2xl">Análise de Ocorrências</CardTitle>
                <CardDescription className="text-gray-700">Principais gargalos nas tentativas de entrega</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={config}
                    className="mx-auto w-full h-[300px]"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent nameKey="motivo" hideLabel />}
                        />
                        <Pie
                            data={data}
                            dataKey="visitors"
                            nameKey="motivo"
                            innerRadius={60}
                        >
                            {data.map((entry, index) => {
                                const chaveMotivo = entry.motivo
                                    .toLowerCase()
                                    .normalize("NFD")
                                    .replace(/[\u0300-\u036f]/g, "")
                                    .replace(/[^a-z0-9]/g, "_");

                                return (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={config[chaveMotivo]?.color || "#3b82f6"}
                                    />
                                )
                            })}
                        </Pie>
                        <Legend 
                            layout="vertical" 
                            verticalAlign="middle" 
                            align="right"
                            iconType="square"
                            iconSize={12}
                        />
                    </PieChart>
                </ChartContainer>
            </CardContent>

        </Card>
    )
}