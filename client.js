const ws = new WebSocket('ws://localhost:3000');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');



// When true, moving the mouse draws on the canvas
let isDrawing = false;
let x = 0;
let y = 0;

canvas.addEventListener("mousedown", (e) => {
    x = e.offsetX;
    y = e.offsetY;
    isDrawing = true;

    // Send the initial coordinates to the server and draw a point on the canvas
    ws.send(JSON.stringify({x, y}));
    ctx.fillRect(x, y, 1, 1);
});

canvas.addEventListener("mousemove", (e) => {
    if (isDrawing) {
        drawLine(ctx, x, y, e.offsetX, e.offsetY);
        x = e.offsetX;
        y = e.offsetY;

        // Only send the coordinates to the server and draw on the canvas if the user is clicking and dragging the mouse
        ws.send(JSON.stringify({x, y}));
    }
});

window.addEventListener("mouseup", (e) => {
    if (isDrawing) {
        drawLine(ctx, x, y, e.offsetX, e.offsetY);
        x = 0;
        y = 0;
        isDrawing = false;
    }
});

function drawLine(context, x1, y1, x2, y2) {
    context.beginPath();
    context.strokeStyle = "black";
    context.lineWidth = 1;
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.closePath();
}

let clientId = null; // Add a variable to store the client's ID

ws.onopen = function() {
    // Send a message to the server to request the client's ID
    ws.send(JSON.stringify({request: 'clientId'}));
};

ws.onmessage = function (event) {
    const data = JSON.parse(event.data);

    // If the message is the client's ID, store it and return
    if (data.id && data.request === 'clientId') {
        clientId = data.id;
        return;
    }

    console.log('Cliente con ID: ', data.id, data.x, data.y);

    if (data.id !== clientId) {
        ctx.fillStyle = data.color;
        ctx.fillRect(data.x, data.y, 5, 5);
    }
};
