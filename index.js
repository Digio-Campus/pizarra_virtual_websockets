const Bun = require('bun');

let clientId = 0; // Initialize a counter for client IDs

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

const server = Bun.serve({
    fetch(req, server) {
        // upgrade the request to a WebSocket
        if (server.upgrade(req)) {
            return; // do not return a Response
        }
        return new Response("Upgrade failed :(", {status: 500});
    },
    websocket: {
        open(ws) {
            ws.id = clientId++; // Assign a unique ID to each WebSocket connection
            ws.color = getRandomColor(); // Assign a random color to each WebSocket connection
            console.log(`Socket opened with ID: ${ws.id}`);
        },
        message(ws, message) {
            const data = JSON.parse(message);

            // If the client is requesting its ID, send it
            if (data.request === 'clientId') {
                ws.send(JSON.stringify({request: 'clientId', id: ws.id}));
                return;
            }

            ws.subscribe("pizarra")
            server.publish("pizarra", JSON.stringify({id: ws.id, color: ws.color, x: data.x, y: data.y}))
        },
        close(ws, code, message) {
            console.log(`Socket with ID: ${ws.id} closed`, code, message);
        },
    },
});

console.log("Server started on port 3000");
