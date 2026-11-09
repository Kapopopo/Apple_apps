#!/usr/bin/env node
/** Serveur MCP Component Atlas (stdio). Lancement : node dist/mcp/index.js */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

const server = createServer();
await server.connect(new StdioServerTransport());
process.stderr.write('component-atlas MCP prêt (stdio)\n');
