// Server-Sent Events (SSE) Hub
const clients = new Set();

export const sseMiddleware = (req, res, next) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  
  // Flush headers
  res.flushHeaders();

  // Keep connection alive
  clients.add(res);

  // Remove client on close
  req.on("close", () => {
    clients.delete(res);
  });
};

export const broadcastSOS = (payload) => {
  const data = JSON.stringify(payload);
  for (const client of clients) {
    client.write(`data: ${data}\n\n`);
  }
};
