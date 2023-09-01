import { Server } from 'socket.io';
import io from 'socket.io-client';
import http from 'http';

export const createAIAnalysisServer = () => {
  const nodeServer = http.createServer();
  const server = {
    http: nodeServer,
    client: {},
    server: new Server(nodeServer),
    port: 2468,
  };

  nodeServer.listen(2468, () => {
    console.log('Node server is running on http://localhost:2468');
  });

  console.log('Server is running on ws://localhost:2468'); // Updated port
  return server;
};


export const ogsSocket = (url, params) => {
    const socket = io(url, params);

    socket.on('connect', () => {
        console.log('socket connected');
        socket.emit('hostinfo');
        socket.emit('authenticate', { device_id: 'live_stream_commentary' })
    });

    socket.on('hostinfo', (hostinfo) => {
        console.log('Termination server', hostinfo);
    });

    socket.on('authenticate', (auth) => {
        console.log(auth)
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected');
    });

    socket.on('error', (error) => {
        console.error('Socket connection error:', error);
    });

    return socket
}