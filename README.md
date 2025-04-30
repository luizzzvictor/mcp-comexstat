# MCP Server para API Comexstat

Este projeto implementa um servidor MCP (Model Context Protocol) para a API Comexstat, permitindo que modelos de IA como Claude interajam diretamente com os dados de comércio exterior do Brasil.

## Visão Geral

O servidor MCP Comexstat fornece ferramentas para consultar estatísticas de exportação e importação brasileiras, incluindo:

- Dados gerais de exportação e importação
- Dados por municípios
- Dados históricos (1989-1996)
- Tabelas auxiliares com códigos e descrições

## Características

- Implementado usando a biblioteca [easy-mcp](https://github.com/zcaceres/easy-mcp)
- Abordagem com decoradores experimentais para uma API limpa e declarativa
- Suporte para comunicação via stdin/stdout (padrão MCP)
- Opção para modo HTTP para integração com outras ferramentas
- Testes unitários e de integração abrangentes
- Documentação detalhada de uso e implantação

## Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/mcp-comexstat-easy.git
cd mcp-comexstat-easy

# Instale as dependências
npm install
n
# Compile o código TypeScript
npm run build
```

## Uso Rápido

```bash
# Execute o servidor MCP
npm start
```

Para mais detalhes sobre como usar o servidor, consulte a [documentação de uso](./docs/usage.md).

## Integração com Claude

Para usar o servidor MCP com Claude Desktop:

1. Adicione a configuração ao arquivo `claude_desktop_config.json`:
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

2. No Claude Desktop, use o comando:
   ```
   /mcp comexstat
   ```

## Documentação

- [Guia de Uso](./docs/usage.md) - Instruções detalhadas sobre como usar o servidor MCP
- [Opções de Implantação](./docs/deployment.md) - Guia para implantar o servidor em diferentes ambientes

## Ferramentas Disponíveis

O servidor MCP fornece as seguintes ferramentas:

### Dados Gerais
- `getLastUpdate()` - Obtém a data da última atualização dos dados
- `getAvailableYears()` - Lista os anos disponíveis para consulta
- `getAvailableFilters()` - Lista os filtros disponíveis
- `getFilterValues(filter, search?, page?, pageSize?)` - Obtém valores para um filtro específico
- `getAvailableFields()` - Lista os campos disponíveis para detalhamento
- `getAvailableMetrics()` - Lista as métricas disponíveis
- `queryData(flow, period, filters?, details, metrics)` - Realiza consultas detalhadas

### Dados por Municípios
- `queryMunicipalitiesData(flow, period, filters?, details, metrics)` - Consulta dados com foco em municípios

### Dados Históricos
- `queryHistoricalData(flow, period, filters?, details, metrics)` - Consulta dados históricos (1989-1996)

### Tabelas Auxiliares
- `getAuxiliaryTable(table, search?, page?, pageSize?)` - Acessa tabelas auxiliares

## Exemplo de Uso

```javascript
// Consultar exportações para os EUA em 2023
const result = await queryData(
  "export",
  {"from": "2023-01", "to": "2023-12"},
  [{"filter": "country", "values": [105]}],
  ["country", "month"],
  ["metricFOB", "metricKG"]
);
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
