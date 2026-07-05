# Dashboard de Logística

Dashboard que lê um arquivo CSV com dados de entregas e gera automaticamente indicadores e gráficos de logística: entregas concluídas, atrasos, gasto com frete, SLA por transportadora e ocorrências.

Demo: https://dashboard-logistica-nextjs.vercel.app/

---

## Demonstração

**Upload** — envio do arquivo CSV via drag-and-drop ou seleção manual
![Upload](public/docs/screenshots/upload.png)

**Dashboard** — indicadores e gráficos gerados automaticamente
![Dashboard](public/docs/screenshots/dashboard.png)

## Funcionalidades

- Upload de CSV via drag-and-drop ou seleção manual
- Cálculo automático de indicadores:
  - Entregas concluídas
  - Entregas em atraso
  - Gasto total com frete
  - Taxa de ocorrências
- Gráfico de performance de SLA por transportadora
- Gráfico de análise de ocorrências (donut) por motivo
- Layout responsivo

## Tecnologias

- Next.js
- React
- TypeScript
- Tailwind CSS
- Shadcn UI
- SheetJS (xlsx) para leitura do CSV
- Recharts para os gráficos

## Formato do CSV

O arquivo precisa conter estas colunas:

- `Status`
- `Motivo`
- `Frete`
- `Previsão de Entrega` (dd/mm/aaaa)
- `Entrega` (dd/mm/aaaa)
- `Transportadora`

## Como rodar localmente

```bash
git clone https://github.com/kaykybazzan/dashboard-logistica-nextjs.git
cd dashboard-logistica-nextjs
npm install
npm run dev
```

Abra http://localhost:3000.

## Nota técnica

Datas podem vir de duas formas diferentes: como número serial (quando o arquivo é .xlsx) ou como string dd/mm/aaaa (quando é .csv puro). O parser de data trata os dois casos — tratar só um formato causava contagem errada de atraso e SLA.

O valor do frete também precisou de tratamento: CSVs no padrão brasileiro usam vírgula como separador decimal, e parseFloat sozinho ignora tudo depois da vírgula, então o valor precisa ser normalizado antes da conversão.

## Autor

Kayky Bazzan

LinkedIn: https://www.linkedin.com/in/kaykybazzan
GitHub: https://github.com/kaykybazzan