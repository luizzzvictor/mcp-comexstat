# Opções de Implantação do Servidor MCP Comexstat

Este documento descreve as diferentes opções para implantar o servidor MCP Comexstat em diversos ambientes, desde execução local até implantação em nuvem.

## Índice

1. [Execução Local](#execução-local)
2. [Contêiner Docker](#contêiner-docker)
3. [Implantação em Nuvem](#implantação-em-nuvem)
   - [AWS Lambda](#aws-lambda)
   - [Google Cloud Functions](#google-cloud-functions)
   - [Azure Functions](#azure-functions)
4. [Integração com n8n](#integração-com-n8n)
5. [Considerações de Segurança](#considerações-de-segurança)
6. [Monitoramento e Manutenção](#monitoramento-e-manutenção)

## Execução Local

### Execução Direta

A maneira mais simples de executar o servidor MCP é localmente:

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Compile o código TypeScript:

   ```bash
   npm run build
   ```

3. Execute o servidor:
   ```bash
   npm start
   ```

### Execução como Serviço Systemd (Linux)

Para executar o servidor como um serviço no Linux:

1. Crie um arquivo de serviço systemd:

   ```bash
   sudo nano /etc/systemd/system/mcp-comexstat.service
   ```

2. Adicione o seguinte conteúdo:

   ```
   [Unit]
   Description=Comexstat MCP Server
   After=network.target

   [Service]
   Type=simple
   User=seu_usuario
   WorkingDirectory=/caminho/para/mcp-comexstat-easy
   ExecStart=/usr/bin/node /caminho/para/mcp-comexstat-easy/dist/index.js
   Restart=on-failure
   Environment=NODE_ENV=production

   [Install]
   WantedBy=multi-user.target
   ```

3. Habilite e inicie o serviço:

   ```bash
   sudo systemctl enable mcp-comexstat
   sudo systemctl start mcp-comexstat
   ```

4. Verifique o status:
   ```bash
   sudo systemctl status mcp-comexstat
   ```

## Contêiner Docker

### Construção da Imagem

O projeto inclui um Dockerfile para facilitar a implantação:

1. Construa a imagem:

   ```bash
   docker build -t mcp-comexstat .
   ```

2. Execute o contêiner:
   ```bash
   docker run -i --rm mcp-comexstat
   ```

Para o modo HTTP:

```bash
docker run -p 3000:3000 -e HTTP_MODE=true --rm mcp-comexstat
```

### Docker Compose

Para uma configuração mais completa, você pode usar Docker Compose:

1. Crie um arquivo `docker-compose.yml`:

   ```yaml
   version: "3"
   services:
     mcp-comexstat:
       build: .
       environment:
         - HTTP_MODE=true
         - PORT=3000
       ports:
         - "3000:3000"
       restart: unless-stopped
   ```

2. Inicie com Docker Compose:
   ```bash
   docker-compose up -d
   ```

## Implantação em Nuvem

### AWS Lambda

Para implantar como uma função AWS Lambda:

1. Instale o Serverless Framework:

   ```bash
   npm install -g serverless
   ```

2. Crie um arquivo `serverless.yml`:

   ```yaml
   service: mcp-comexstat

   provider:
     name: aws
     runtime: nodejs16.x
     region: us-east-1

   functions:
     mcp:
       handler: dist/lambda.handler
       events:
         - http:
             path: /
             method: any
             cors: true
   ```

3. Crie um arquivo `src/lambda.ts`:

   ```typescript
   import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
   import mcp from "./ComexstatMCP";

   export const handler = async (
     event: APIGatewayProxyEvent
   ): Promise<APIGatewayProxyResult> => {
     try {
       // Parse the incoming request
       const body = JSON.parse(event.body || "{}");

       // Process the MCP request
       const result = await mcp.processRequest(body);

       return {
         statusCode: 200,
         headers: {
           "Content-Type": "application/json",
           "Access-Control-Allow-Origin": "*",
         },
         body: JSON.stringify(result),
       };
     } catch (error) {
       return {
         statusCode: 500,
         headers: {
           "Content-Type": "application/json",
           "Access-Control-Allow-Origin": "*",
         },
         body: JSON.stringify({ error: (error as Error).message }),
       };
     }
   };
   ```

4. Implante:
   ```bash
   serverless deploy
   ```

### Google Cloud Functions

Para implantar no Google Cloud Functions:

1. Crie um arquivo `index.js` na pasta `dist`:

   ```javascript
   const { default: mcp } = require("./ComexstatMCP");

   exports.mcpHandler = async (req, res) => {
     try {
       const result = await mcp.processRequest(req.body);
       res.status(200).json(result);
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   };
   ```

2. Implante usando gcloud CLI:
   ```bash
   gcloud functions deploy mcp-comexstat \
     --runtime nodejs16 \
     --trigger-http \
     --allow-unauthenticated \
     --entry-point mcpHandler
   ```

### Azure Functions

Para implantar no Azure Functions:

1. Instale o Azure Functions Core Tools:

   ```bash
   npm install -g azure-functions-core-tools@4
   ```

2. Inicialize um projeto Azure Functions:

   ```bash
   func init --typescript
   func new --name mcpHandler --template "HTTP trigger"
   ```

3. Modifique o arquivo `mcpHandler/index.ts`:

   ```typescript
   import { AzureFunction, Context, HttpRequest } from "@azure/functions";
   import mcp from "../dist/ComexstatMCP";

   const httpTrigger: AzureFunction = async function (
     context: Context,
     req: HttpRequest
   ): Promise<void> {
     try {
       const result = await mcp.processRequest(req.body);
       context.res = {
         status: 200,
         body: result,
       };
     } catch (error) {
       context.res = {
         status: 500,
         body: { error: (error as Error).message },
       };
     }
   };

   export default httpTrigger;
   ```

4. Implante:
   ```bash
   func azure functionapp publish <nome-do-app>
   ```

## Integração com n8n

Para integrar o servidor MCP Comexstat com o n8n:

### Opção 1: Usando o n8n HTTP Request Node

1. Implante o servidor MCP com o modo HTTP ativado.

2. No n8n, adicione um nó "HTTP Request":

   - Método: POST
   - URL: http://seu-servidor-mcp:3000/
   - Corpo: JSON com a requisição MCP

3. Configure o corpo da requisição:
   ```json
   {
     "type": "tool",
     "name": "queryData",
     "parameters": {
       "flow": "export",
       "period": { "from": "2023-01", "to": "2023-12" },
       "filters": [{ "filter": "country", "values": [105] }],
       "details": ["country"],
       "metrics": ["metricFOB"]
     }
   }
   ```

### Opção 2: Usando o n8n Execute Command Node

1. No n8n, adicione um nó "Execute Command":

   - Comando: node
   - Argumentos: /caminho/para/mcp-comexstat-easy/dist/index.js

2. Adicione um nó "Function" antes para preparar a entrada:

   ```javascript
   return {
     json: {
       type: "tool",
       name: "queryData",
       parameters: {
         flow: "export",
         period: { from: "2023-01", to: "2023-12" },
         filters: [{ filter: "country", values: [105] }],
         details: ["country"],
         metrics: ["metricFOB"],
       },
     },
   };
   ```

3. Conecte a saída do nó Function à entrada do nó Execute Command.

## Considerações de Segurança

### Autenticação

Para adicionar autenticação ao servidor MCP no modo HTTP:

1. Instale as dependências:

   ```bash
   npm install jsonwebtoken express-jwt
   ```

2. Modifique o código para adicionar autenticação JWT.

### HTTPS

Para habilitar HTTPS no modo HTTP:

1. Gere certificados SSL:

   ```bash
   openssl req -nodes -new -x509 -keyout server.key -out server.cert
   ```

2. Configure o servidor para usar HTTPS.

### Limitação de Taxa

Para proteger contra abuso, considere adicionar limitação de taxa:

1. Instale o middleware:

   ```bash
   npm install express-rate-limit
   ```

2. Configure a limitação de taxa no servidor HTTP.

## Monitoramento e Manutenção

### Logs

Configure logs estruturados para facilitar o monitoramento:

1. Instale uma biblioteca de logging:

   ```bash
   npm install winston
   ```

2. Configure logs estruturados no formato JSON.

### Métricas

Para coletar métricas de uso:

1. Instale o Prometheus client:

   ```bash
   npm install prom-client
   ```

2. Configure métricas para monitorar:
   - Número de requisições
   - Tempo de resposta
   - Taxa de erros
   - Uso de memória

### Atualizações

Para manter o servidor atualizado:

1. Configure integração contínua (CI/CD) para automatizar testes e implantação.

2. Estabeleça um processo para atualizar dependências regularmente.

3. Monitore a API Comexstat para mudanças que possam afetar o servidor MCP.
