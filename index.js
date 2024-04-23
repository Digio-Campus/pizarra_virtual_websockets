const Bun = require('bun');

let clientId = 0;
let activeSquares = {};
let activeLines = [];
let lastX = 0;
let lastY = 0;


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
        if (server.upgrade(req)) {
            return;
        }
        return new Response("Upgrade failed :(", {status: 500});
    },
    websocket: {
        open(ws) {
            ws.id = clientId++;
            ws.color = getRandomColor();
            ws.subscribe("pizarra");
            // Send the current list of active squares to the new client
            ws.send(JSON.stringify({type: 'init', squares: activeSquares}));
        },
        message(ws, message) {
            const data = JSON.parse(message);

            if (data.request === 'clientId') {
                ws.send(JSON.stringify({request: 'clientId', id: ws.id}));
                return;
            }

            if (data.type === 'move') {
                // Update the square in the server's record
                activeSquares[ws.id] = {x: data.x, y: data.y, color: ws.color};
            }
            if (data.type === 'draw') {
                // Always publish the draw coordinates and the message type to all clients
              //  [lastX, lastY] = [data.x, data.y];

                activeLines.push({x1: lastX, y1: lastY, x2: data.x, y2: data.y, color: data.color});
                server.publish("pizarra", JSON.stringify({activeLines}));
                /* server.publish("pizarra", JSON.stringify({
                     id: ws.id,
                     color: ws.color,
                     type: data.type,
                     x: data.x,
                     y: data.y
                 }));

                 */
            }

            // Always publish the mouse coordinates and the message type to all clients
            server.publish("pizarra", JSON.stringify({
                id: ws.id,
                color: ws.color,
                type: data.type,
                x: data.x,
                y: data.y
            }));
        },
        close(ws, code, message) {
            console.log(`Socket with ID: ${ws.id} closed`, code, message);

            // Remove the square from the server's record
            delete activeSquares[ws.id];

            // Notify all clients that this square has been removed
            server.publish("pizarra", JSON.stringify({type: 'remove', id: ws.id}));
        },
    },
});

console.log(`Server started at http://${server.hostname}:${server.port}`);
