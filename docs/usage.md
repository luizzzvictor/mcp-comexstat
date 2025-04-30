# Comexstat MCP Server - Guia de Uso

Este documento fornece instruções detalhadas sobre como usar o servidor MCP (Model Context Protocol) para a API Comexstat, que permite que modelos de IA interajam com os dados de comércio exterior do Brasil.

## Índice

1. [Instalação](#instalação)
2. [Configuração](#configuração)
3. [Execução](#execução)
4. [Integração com Modelos de IA](#integração-com-modelos-de-ia)
5. [Ferramentas Disponíveis](#ferramentas-disponíveis)
6. [Exemplos de Uso](#exemplos-de-uso)
7. [Solução de Problemas](#solução-de-problemas)

## Instalação

### Pré-requisitos

- Node.js 16.x ou superior
- npm 7.x ou superior

### Passos para Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/mcp-comexstat-easy.git
   cd mcp-comexstat-easy
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Compile o código TypeScript:
   ```bash
   npm run build
   ```

## Configuração

O servidor MCP não requer configuração especial para funcionar com as configurações padrão. No entanto, você pode personalizar alguns aspectos:

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis (opcionais):

```
# URL base da API Comexstat (opcional, padrão: https://api-comexstat.mdic.gov.br)
COMEXSTAT_API_URL=https://api-comexstat.mdic.gov.br

# Timeout para requisições à API em milissegundos (opcional, padrão: 30000)
COMEXSTAT_API_TIMEOUT=30000

# Nível de log (opcional, padrão: info)
LOG_LEVEL=info
```

## Execução

### Modo Padrão (stdin/stdout)

Para executar o servidor MCP no modo padrão (comunicação via stdin/stdout):

```bash
npm start
```

Este é o modo recomendado para integração com modelos de IA como Claude, que se comunicam com servidores MCP via stdin/stdout.

### Modo HTTP (opcional)

Para executar o servidor com uma interface HTTP adicional:

```bash
HTTP_MODE=true npm start
```

Isso iniciará um servidor HTTP na porta 3000 (ou na porta definida pela variável de ambiente `PORT`).

## Integração com Modelos de IA

### Claude Desktop

Para usar o servidor MCP com Claude Desktop:

1. Certifique-se de que o servidor MCP está compilado:
   ```bash
   npm run build
   ```

2. Adicione a configuração ao arquivo `claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "comexstat": {
         "command": "node",
         "args": [
           "/caminho/completo/para/mcp-comexstat-easy/dist/index.js"
         ]
       }
     }
   }
   ```

3. Reinicie o Claude Desktop.

4. Agora você pode usar o servidor MCP no Claude Desktop com o comando:
   ```
   /mcp comexstat
   ```

### Claude na Web (via Docker)

Para usar o servidor MCP com Claude na web:

1. Construa a imagem Docker:
   ```bash
   docker build -t mcp-comexstat .
   ```

2. Execute o contêiner:
   ```bash
   docker run -i --rm mcp-comexstat
   ```

3. Copie a saída do servidor e cole-a na interface web do Claude quando solicitado a fornecer um servidor MCP.

### Outros Modelos de IA

Para outros modelos de IA que suportam o protocolo MCP, consulte a documentação específica do modelo para instruções de integração.

## Ferramentas Disponíveis

O servidor MCP Comexstat oferece as seguintes ferramentas:

### Dados Gerais

1. **getLastUpdate**
   - Descrição: Obtém a data da última atualização dos dados
   - Parâmetros: Nenhum
   - Exemplo: `getLastUpdate()`

2. **getAvailableYears**
   - Descrição: Lista os anos disponíveis para consulta
   - Parâmetros: Nenhum
   - Exemplo: `getAvailableYears()`

3. **getAvailableFilters**
   - Descrição: Lista os filtros disponíveis para consulta
   - Parâmetros: Nenhum
   - Exemplo: `getAvailableFilters()`

4. **getFilterValues**
   - Descrição: Obtém valores para um filtro específico
   - Parâmetros:
     - `filter`: String (obrigatório) - Nome do filtro (ex: 'country', 'ncm')
     - `search`: String (opcional) - Termo para busca
     - `page`: Number (opcional) - Número da página
     - `pageSize`: Number (opcional) - Itens por página
   - Exemplo: `getFilterValues("country", "bra", 1, 10)`

5. **getAvailableFields**
   - Descrição: Lista os campos disponíveis para detalhamento
   - Parâmetros: Nenhum
   - Exemplo: `getAvailableFields()`

6. **getAvailableMetrics**
   - Descrição: Lista as métricas disponíveis para consulta
   - Parâmetros: Nenhum
   - Exemplo: `getAvailableMetrics()`

7. **queryData**
   - Descrição: Realiza consultas detalhadas de exportação/importação
   - Parâmetros:
     - `flow`: String (obrigatório) - 'export' ou 'import'
     - `period`: Object (obrigatório) - {from: 'YYYY-MM', to: 'YYYY-MM'}
     - `filters`: Array (opcional) - [{filter: string, values: number[]}]
     - `details`: Array (obrigatório) - Campos para detalhamento
     - `metrics`: Array (obrigatório) - Métricas a incluir
   - Exemplo: 
     ```
     queryData(
       "export", 
       {"from": "2023-01", "to": "2023-12"}, 
       [{"filter": "country", "values": [105]}], 
       ["country"], 
       ["metricFOB"]
     )
     ```

### Dados por Municípios

1. **queryMunicipalitiesData**
   - Descrição: Consulta dados com foco em municípios
   - Parâmetros: Similares ao queryData
   - Exemplo: 
     ```
     queryMunicipalitiesData(
       "export", 
       {"from": "2023-01", "to": "2023-12"}, 
       [{"filter": "municipality", "values": [3550308]}], 
       ["municipality", "sh4"], 
       ["metricFOB"]
     )
     ```

### Dados Históricos

1. **queryHistoricalData**
   - Descrição: Consulta dados históricos (1989-1996)
   - Parâmetros: Similares ao queryData
   - Exemplo: 
     ```
     queryHistoricalData(
       "export", 
       {"from": "1995-01", "to": "1996-12"}, 
       [], 
       ["nbm", "country"], 
       ["metricFOB"]
     )
     ```

### Tabelas Auxiliares

1. **getAuxiliaryTable**
   - Descrição: Acessa tabelas auxiliares com códigos e descrições
   - Parâmetros:
     - `table`: String (obrigatório) - Nome da tabela (ex: 'countries', 'ncm')
     - `search`: String (opcional) - Termo para busca
     - `page`: Number (opcional) - Número da página
     - `pageSize`: Number (opcional) - Itens por página
   - Exemplo: `getAuxiliaryTable("countries", "bra", 1, 20)`

## Exemplos de Uso

### Exemplo 1: Consultar exportações para os EUA em 2023

```
// Primeiro, encontrar o código do país
const countriesResult = await getFilterValues("country", "united states");
const usaCode = countriesResult.values[0].id;

// Realizar a consulta
const result = await queryData(
  "export",
  {"from": "2023-01", "to": "2023-12"},
  [{"filter": "country", "values": [usaCode]}],
  ["country", "month"],
  ["metricFOB", "metricKG"]
);

// Analisar os resultados
console.log(`Total de exportações para os EUA em 2023: ${result.data.reduce((sum, item) => sum + item.metricFOB, 0)} USD`);
```

### Exemplo 2: Consultar exportações de café por município

```
// Encontrar o código SH4 para café
const productsResult = await getFilterValues("sh4", "coffee");
const coffeeCode = productsResult.values[0].id;

// Realizar a consulta
const result = await queryMunicipalitiesData(
  "export",
  {"from": "2023-01", "to": "2023-12"},
  [{"filter": "sh4", "values": [coffeeCode]}],
  ["municipality", "country"],
  ["metricFOB"]
);

// Analisar os resultados
const topExporters = result.data
  .sort((a, b) => b.metricFOB - a.metricFOB)
  .slice(0, 10);

console.log("Top 10 municípios exportadores de café:");
topExporters.forEach((item, index) => {
  console.log(`${index + 1}. ${item.municipality}: ${item.metricFOB} USD`);
});
```

## Solução de Problemas

### Problemas Comuns

1. **Erro de conexão com a API**
   - Verifique sua conexão com a internet
   - Confirme se a API Comexstat está acessível
   - Aumente o timeout na variável de ambiente `COMEXSTAT_API_TIMEOUT`

2. **Resultados muito grandes**
   - Use filtros mais específicos para reduzir o volume de dados
   - Divida a consulta em períodos menores
   - Reduza o número de campos de detalhamento

3. **Erro "Invalid parameters"**
   - Verifique se os códigos de filtro estão corretos
   - Confirme se o formato do período está correto (YYYY-MM)
   - Verifique se os campos de detalhamento e métricas são válidos

### Logs

Para depuração, você pode aumentar o nível de log:

```
LOG_LEVEL=debug npm start
```

Níveis disponíveis: error, warn, info, debug

### Suporte

Se encontrar problemas não cobertos nesta documentação, abra uma issue no repositório do projeto ou entre em contato com o suporte.
