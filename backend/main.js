import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path'; 

import AI from './ai.js';
import { createOGSSocket, createAIAnalysisServer } from './socket.js';
import { dueProcessOfReviews } from './analysis.js';

const createAIObject = (filePaths) => new AI(filePaths);

async function readEntryPointFile() {
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const filePath = join(moduleDir, 'entryPoint.json');

  try {
    const entryPointData = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(entryPointData);
  } catch (err) {
    throw new Error(`Failed to read and parse entryPoint.json: ${err.message}`);
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
    const entryPoint = await readEntryPointFile();
    console.log('Parsed entryPoint.json:', entryPoint);
    const kataGo = createAIObject(entryPoint.katago);
    const ogsSocket = createOGSSocket(entryPoint.url, entryPoint.params);
    const analysisServer = createAIAnalysisServer();

    initializeServerEvents(analysisServer, games, kataGo);

    process.on('SIGINT', () => {
      console.log('\nGracefully shutting down from SIGINT (Ctrl+C)');
      kataGo.close();
      ogsSocket.close();
      analysisServer.close();
      process.exit();
    });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

export default main;
