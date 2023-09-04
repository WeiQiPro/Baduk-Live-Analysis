import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path'; 

import AI from './ai.js';
import { createOGSSocket, createAIAnalysisServer } from './socket.js';
import { dueProcessOfReviews } from './analysis.js';

async function readEntryPointFile() {
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const filePath = join(moduleDir, '_.json');

  try {
    const _Data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(_Data);
  } catch (err) {
    throw new Error(`Failed to read and parse _.json: ${err.message}`);
  }
}

function initializeServerEvents(analysisServer, games, kataGo) {
  analysisServer.server.on('connection', (client) => {
    console.log('A client connected. Welcome to the server.');
    analysisServer.client = client;

    if (Object.keys(games).length > 0) {
        client.emit('allGames', games);
      }

    client.on('message', (message) => {
      console.log(`Received message: ${message}`);
    });

    client.on('links', (links) => {
      console.log(links);
      const parseData = JSON.parse(links);
      const reviews = parseData.data;
      dueProcessOfReviews(analysisServer, ogsSocket, reviews, games, kataGo);
    });
  });
}

async function main() {
  let games = {};
  try {
    const _ = await readEntryPointFile();
    console.log('Parsed _.json:', _);
    const kataGo = new AI(_.katago);
    const ogsSocket = createOGSSocket(_.url, _.params);
    const analysisServer = createAIAnalysisServer();

    initializeServerEvents(analysisServer, games, kataGo);

    process.on('SIGINT', () => {
      console.log('\nGracefully shutting down from SIGINT (Ctrl+C)');
      kataGo.close();
      ogsSocket.close();
      analysisServer.server.close();
      process.exit();
    });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

export default main;
main();
