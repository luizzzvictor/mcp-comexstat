import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import mcp from '../src/ComexstatMCP';

describe('MCP Server Integration', () => {
  test('MCP server has all required tools', () => {
    // Get the capabilities of the MCP server
    const capabilities = mcp.listCapabilities();
    
    // Check for general data tools
    expect(capabilities.tools).toContainEqual(expect.objectContaining({ name: 'getLastUpdate' }));
    expect(capabilities.tools).toContainEqual(expect.objectContaining({ name: 'getAvailableYears' }));
    expect(capabilities.tools).toContainEqual(expect.objectContaining({ name: 'getAvailableFilters' }));
    expect(capabilities.tools).toContainEqual(expect.objectContaining({ name: 'getFilterValues' }));
    expect(capabilities.tools).toContainEqual(expect.objectContaining({ name: 'getAvailableFields' }));
    expect(capabilities.tools).toContainEqual(expect.objectContaining({ name: 'getAvailableMetrics' }));
    expect(capabilities.tools).toContainEqual(expect.objectContaining({ name: 'queryData' }));
    
    // Check for municipality data tools
    expect(capabilities.tools).toContainEqual(expect.objectContaining({ name: 'queryMunicipalitiesData' }));
    
    // Check for historical data tools
    expect(capabilities.tools).toContainEqual(expect.objectContaining({ name: 'queryHistoricalData' }));
    
    // Check for auxiliary table tools
    expect(capabilities.tools).toContainEqual(expect.objectContaining({ name: 'getAuxiliaryTable' }));
    
    // Check for prompts
    expect(capabilities.prompts).toContainEqual(expect.objectContaining({ name: 'Export Data Query' }));
  });

  test('MCP server has correct metadata', () => {
    expect(mcp.name).toBe('ComexstatMCP');
    expect(mcp.version).toBe('1.0.0');
    expect(mcp.description).toContain('Brazilian foreign trade statistics');
  });

  test('MCP server has correct root', () => {
    const capabilities = mcp.listCapabilities();
    expect(capabilities.roots).toContainEqual(expect.objectContaining({ 
      uri: '/comexstat-data' 
    }));
  });
});
