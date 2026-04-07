const { createServer } = require("http");
const { WebSocketServer, WebSocket } = require("ws");
const Y = require("yjs");
const awarenessProtocol = require("y-protocols/awareness");
const syncProtocol = require("y-protocols/sync");
const encoding = require("lib0/encoding");
const decoding = require("lib0/decoding");

const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;

const rooms = new Map();

const server = createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Yjs WebSocket Server\n");
});

const wss = new WebSocketServer({ server });

function getRoomName(req) {
  const url = req.url || "/";
  const pathname = url.split("?")[0] || "/";
  const room = decodeURIComponent(pathname.replace(/^\//, "")).trim();
  return room || "default-room";
}

function getOrCreateRoom(roomName) {
  const existing = rooms.get(roomName);
  if (existing) return existing;

  const doc = new Y.Doc();
  const awareness = new awarenessProtocol.Awareness(doc);
  const conns = new Map();
  const roomState = { doc, awareness, conns };

  doc.on("update", (update, origin) => {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeUpdate(encoder, update);
    const message = encoding.toUint8Array(encoder);

    conns.forEach((_ids, conn) => {
      if (conn !== origin && conn.readyState === WebSocket.OPEN) {
        conn.send(message);
      }
    });
  });

  awareness.on("update", ({ added, updated, removed }, origin) => {
    const changedClients = added.concat(updated, removed);

    if (origin instanceof WebSocket) {
      const controlled = conns.get(origin);
      if (controlled) {
        added.concat(updated).forEach((clientId) => controlled.add(clientId));
        removed.forEach((clientId) => controlled.delete(clientId));
      }
    }

    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients)
    );
    const message = encoding.toUint8Array(encoder);

    conns.forEach((_ids, conn) => {
      if (conn.readyState === WebSocket.OPEN) {
        conn.send(message);
      }
    });
  });

  rooms.set(roomName, roomState);
  return roomState;
}

function closeConnection(roomName, ws) {
  const room = rooms.get(roomName);
  if (!room) return;

  const controlled = room.conns.get(ws) || new Set();
  room.conns.delete(ws);

  awarenessProtocol.removeAwarenessStates(room.awareness, Array.from(controlled), ws);

  if (room.conns.size === 0) {
    room.awareness.destroy();
    room.doc.destroy();
    rooms.delete(roomName);
  }
}

function sendInitialSync(ws, room) {
  const syncEncoder = encoding.createEncoder();
  encoding.writeVarUint(syncEncoder, MESSAGE_SYNC);
  syncProtocol.writeSyncStep1(syncEncoder, room.doc);
  ws.send(encoding.toUint8Array(syncEncoder));

  const awarenessStates = room.awareness.getStates();
  if (awarenessStates.size > 0) {
    const awarenessEncoder = encoding.createEncoder();
    encoding.writeVarUint(awarenessEncoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(
      awarenessEncoder,
      awarenessProtocol.encodeAwarenessUpdate(
        room.awareness,
        Array.from(awarenessStates.keys())
      )
    );
    ws.send(encoding.toUint8Array(awarenessEncoder));
  }
}

function toUint8Array(data) {
  if (Array.isArray(data)) {
    return new Uint8Array(Buffer.concat(data));
  }
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }
  return new Uint8Array(data);
}

wss.on("connection", (ws, req) => {
  const roomName = getRoomName(req);
  const room = getOrCreateRoom(roomName);

  room.conns.set(ws, new Set());
  sendInitialSync(ws, room);

  ws.on("message", (data) => {
    const decoder = decoding.createDecoder(toUint8Array(data));
    const messageType = decoding.readVarUint(decoder);

    if (messageType === MESSAGE_SYNC) {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_SYNC);
      syncProtocol.readSyncMessage(decoder, encoder, room.doc, ws);
      const reply = encoding.toUint8Array(encoder);
      if (reply.length > 1 && ws.readyState === WebSocket.OPEN) {
        ws.send(reply);
      }
      return;
    }

    if (messageType === MESSAGE_AWARENESS) {
      const update = decoding.readVarUint8Array(decoder);
      awarenessProtocol.applyAwarenessUpdate(room.awareness, update, ws);
    }
  });

  ws.on("close", () => closeConnection(roomName, ws));
  ws.on("error", () => closeConnection(roomName, ws));
});

const PORT = Number(process.env.PORT || 1234);
server.listen(PORT, () => {
  console.log(`Yjs WebSocket server listening on ws://localhost:${PORT}`);
});

module.exports = server;
