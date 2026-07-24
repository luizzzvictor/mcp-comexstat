# MCP Comex Stat

[![smithery badge](https://smithery.ai/badge/@luizzzvictor/mcp-comexstat)](https://smithery.ai/server/@luizzzvictor/mcp-comexstat)

Servidor [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) para consultar a API oficial do [Comex Stat](https://comexstat.mdic.gov.br/pt/home), sistema de estatísticas de comércio exterior do Brasil mantido pelo MDIC.

## Recursos

- 21 ferramentas MCP para exportações, importações, municípios, séries históricas e tabelas auxiliares;
- validação dos parâmetros com Zod;
- transporte MCP por `stdin`/`stdout`;
- repetição automática com espera exponencial para respostas `429` e erros temporários `5xx`;
- respeito ao cabeçalho HTTP `Retry-After`;
- espaçamento configurável entre requisições;
- cache temporário para metadados e consultas idempotentes;
- validação normal de certificados TLS;
- teste de saúde da API e teste automatizado do protocolo MCP.

Os dados vêm da API `https://api-comexstat.mdic.gov.br`. O MDIC também publica a [base detalhada em CSV](https://www.gov.br/mdic/pt-br/assuntos/comercio-exterior/estatisticas/base-de-dados-bruta).

## Requisitos

- Node.js 18 ou versão posterior;
- npm.

## Instalação

```bash
git clone https://github.com/luizzzvictor/mcp-comexstat.git
cd mcp-comexstat
npm install
npm run build
```

Inicie o servidor:

```bash
npm start
```

Um cliente MCP pode executar o arquivo compilado com esta configuração:

```json
{
  "mcpServers": {
    "comexstat": {
      "command": "node",
      "args": ["/caminho/absoluto/mcp-comexstat/dist/index.js"]
    }
  }
}
```

## Ferramentas

### Saúde e metadados

- `healthCheck()` — confirma o acesso à API, a data de atualização e os anos disponíveis;
- `getLastUpdate()` — informa a data da última atualização;
- `getAvailableYears()` — informa o intervalo anual disponível;
- `getAvailableFilters()` — lista filtros;
- `getFilterValues(filter, language?)` — lista valores aceitos por um filtro;
- `getAvailableFields()` — lista campos de detalhamento;
- `getAvailableMetrics()` — lista métricas.

### Consultas

- `queryData(...)` — consulta exportações ou importações gerais;
- `queryMunicipalitiesData(...)` — consulta dados por município;
- `queryHistoricalData(...)` — consulta a série histórica de 1989 a 1996.

Parâmetros principais de `queryData`:

```text
flow: "export" | "import"
period: { from: "YYYY-MM", to: "YYYY-MM" }
monthDetail: boolean
filters: [{ filter: string, values: number[] }]
details: string[]
metrics: string[]
language: string (padrão: "pt")
```

Exemplo de argumentos para consultar exportações brasileiras destinadas à Rússia:

```json
{
  "flow": "export",
  "period": {
    "from": "2026-01",
    "to": "2026-06"
  },
  "monthDetail": false,
  "filters": [
    {
      "filter": "country",
      "values": [676]
    }
  ],
  "details": ["country"],
  "metrics": ["metricFOB", "metricKG"],
  "language": "pt"
}
```

Use `getCountries("Rússia")` para descobrir o código `676` diretamente pela API.

### Tabelas auxiliares

- `getAuxiliaryTable(table, search?, page?, pageSize?)`;
- `getStates()` e `getStateDetails(ufId)`;
- `getCities()` e `getCityDetails(cityId)`;
- `getCountries(search?)` e `getCountryDetails(countryId)`;
- `getEconomicBlocks(options?)`;
- `getHarmonizedSystem(options?)`;
- `getNBM(options?)` e `getNBMDetails(coNbm)`.

## Controle de requisições

A API pode aplicar limites de frequência em períodos de uso intenso. O cliente organiza as chamadas em fila e repete respostas temporárias. As variáveis abaixo permitem ajustar esse comportamento:

| Variável | Padrão | Finalidade |
| --- | ---: | --- |
| `COMEXSTAT_API_URL` | `https://api-comexstat.mdic.gov.br` | URL-base da API |
| `COMEXSTAT_TIMEOUT_MS` | `30000` | Tempo máximo de cada requisição |
| `COMEXSTAT_MAX_RETRIES` | `4` | Quantidade máxima de novas tentativas |
| `COMEXSTAT_RETRY_BASE_DELAY_MS` | `1000` | Espera inicial do recuo exponencial |
| `COMEXSTAT_MIN_REQUEST_INTERVAL_MS` | `500` | Intervalo mínimo entre chamadas |
| `COMEXSTAT_QUERY_MIN_REQUEST_INTERVAL_MS` | `10000` | Intervalo mínimo entre consultas de dados |
| `COMEXSTAT_CACHE_TTL_MS` | `300000` | Validade do cache de respostas |

Mensagens operacionais são enviadas para `stderr`, preservando o `stdout` para o protocolo MCP.

## Desenvolvimento

```bash
# Compilar
npm run build

# Executar testes unitários e de integração em memória
npm test

# Validar a comunicação MCP por stdio
npm run smoke

# Executar todas as verificações
npm run check

# Gerar cobertura
npm run test:coverage
```

## Licença

MIT
