import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import ComexstatClient from "../src/ComexstatClient";
import { ComexstatMCP } from "../src/ComexstatMCP";

describe("ComexstatMCP", () => {
  test("exposes its tools and serves a health check", async () => {
    const mockClient = {
      getLastUpdate: jest.fn(async () => "2026-07-03"),
      getAvailableYears: jest.fn(async () => ({
        min: "1997",
        max: "2026",
      })),
    } as unknown as ComexstatClient;
    const server = new ComexstatMCP({
      version: "test",
      client: mockClient,
    });
    const client = new Client({ name: "test-client", version: "1.0.0" });
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();

    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const tools = await client.listTools();
    expect(tools.tools.map((tool) => tool.name)).toEqual(
      expect.arrayContaining([
        "healthCheck",
        "getLastUpdate",
        "getAvailableYears",
        "queryData",
        "getCountries",
      ])
    );
    expect(tools.tools).toHaveLength(21);

    const health = await client.callTool({
      name: "healthCheck",
      arguments: {},
    });
    const healthResult = health as {
      isError?: boolean;
      content: Array<{ type: "text"; text: string }>;
    };
    expect(healthResult.isError).not.toBe(true);
    expect(JSON.parse(healthResult.content[0].text)).toEqual({
      status: "ok",
      lastUpdate: "2026-07-03",
      availableYears: { min: "1997", max: "2026" },
    });

    await client.close();
    await server.close();
  });
});
