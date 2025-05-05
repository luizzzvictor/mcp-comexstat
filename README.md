# MCP Server para API Comexstat <img src="https://badge.mcpx.dev?type=server" title="MCP Server"/>

Este projeto implementa um servidor MCP (Model Context Protocol) para a API Comexstat, permitindo que modelos de IA como Claude interajam diretamente com os dados de comércio exterior do Brasil.

<a href="https://glama.ai/mcp/servers/@luizzzvictor/mcp-comexstat">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@luizzzvictor/mcp-comexstat/badge" alt="mcp-comexstat MCP server" />
</a>

## Visão Geral

O servidor MCP Comexstat fornece ferramentas para consultar estatísticas de exportação e importação brasileiras, incluindo:

- Dados gerais de exportação e importação
- Dados por municípios
- Dados históricos (1989-1996)
- Tabelas auxiliares com códigos e descrições

## Características

- Implementado usando [@modelcontextprotocol/sdk](https://github.com/ModelContext/sdk)
- Tipagem com TypeScript
- Validação de dados com Zod
- Suporte para comunicação via stdin/stdout (padrão MCP)
- Tratamento robusto de erros e respostas da API

## Instalação

```bash
# Clone o repositório
git clone https://github.com/luizzzvictor/mcp-comexstat-easy.git
cd mcp-comexstat-easy

# Instale as dependências
npm install

# Compile o código TypeScript
npm run build
```

## Uso Rápido

```bash
# Execute o servidor MCP
npm start
```

## Ferramentas Disponíveis

O servidor MCP fornece as seguintes ferramentas:

### Dados Gerais

- `getLastUpdate()` - Obtém a data da última atualização dos dados
- `getAvailableYears()` - Lista os anos disponíveis para consulta
- `getAvailableFilters()` - Lista os filtros disponíveis
- `getFilterValues(filter, language?)` - Obtém valores para um filtro específico
- `getAvailableFields()` - Lista os campos disponíveis para detalhamento
- `getAvailableMetrics()` - Lista as métricas disponíveis
- `queryData(options)` - Realiza consultas detalhadas com os seguintes parâmetros:
  - `flow`: "export" | "import"
  - `period`: { from: "YYYY-MM", to: "YYYY-MM" }
  - `monthDetail`: boolean
  - `filters`: Array de filtros (opcional)
  - `details`: Array de campos para detalhamento
  - `metrics`: Array de métricas
  - `language`: string (opcional, default: "pt")

### Dados por Municípios

- `queryMunicipalitiesData(options)` - Consulta dados com foco em municípios

### Dados Históricos

- `queryHistoricalData(options)` - Consulta dados históricos (1989-1996)

### Tabelas Auxiliares

- `getStates()` - Lista estados brasileiros
- `getStateDetails(ufId)` - Detalhes de um estado específico
- `getCities()` - Lista municípios
- `getCityDetails(cityId)` - Detalhes de um município específico
- `getCountries(search?)` - Lista países
- `getCountryDetails(countryId)` - Detalhes de um país específico
- `getEconomicBlocks(options?)` - Lista blocos econômicos
- `getHarmonizedSystem(options?)` - Sistema Harmonizado (SH)
- `getNBM(options?)` - Nomenclatura Brasileira de Mercadorias
- `getNBMDetails(coNbm)` - Detalhes de um código NBM específico

## Exemplo de Uso

```typescript
// Consultar exportações para os EUA em 2023
const result = await queryData({
  flow: "export",
  period: { from: "2023-01", to: "2023-12" },
  monthDetail: false,
  filters: [{ filter: "country", values: [105] }],
  details: ["country", "month"],
  metrics: ["metricFOB", "metricKG"],
});
```

## Integração com Claude

Para usar o servidor MCP com Claude Desktop:

1. Adicione a configuração ao arquivo `claude_desktop_config.json`:

   ```json
   {
     "mcpServers": {
       "comexstat": {
         "command": "node",
         "args": ["/caminho/completo/para/mcp-comexstat-easy/dist/index.js"]
       }
     }
   }
   ```

2. No Claude Desktop, use o comando:
   ```
   /mcp comexstat
   ```

## Desenvolvimento

```bash
# Executar em modo de desenvolvimento
npm run dev

# Executar testes
npm test

# Verificar cobertura de testes
npm test -- --coverage
```

## Licença

MIT