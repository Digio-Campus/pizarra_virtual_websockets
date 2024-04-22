const ws = new WebSocket('ws://localhost:3000');

const drawingCanvas = document.getElementById('drawingCanvas');
const trackingCanvas = document.getElementById('trackingCanvas');
const drawingCtx = drawingCanvas.getContext('2d');
const trackingCtx = trackingCanvas.getContext('2d');


// Set the drawing size of the canvas to match the size of the canvas element in the DOM
drawingCanvas.width = drawingCanvas.offsetWidth;
drawingCanvas.height = drawingCanvas.offsetHeight;
trackingCanvas.width = trackingCanvas.offsetWidth;
trackingCanvas.height = trackingCanvas.offsetHeight;


let isDrawing = false;
let lastX = 0;
let lastY = 0;
let color = null;
let x = 0;
let y = 0;
let prevX = 0;
let prevY = 0;
let activeSquares = {};


drawingCanvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
});

drawingCanvas.addEventListener("mousemove", (e) => {
    if (!isDrawing) return;
    ws.send(JSON.stringify({type: 'draw', x: e.offsetX, y: e.offsetY, color}));
    [lastX, lastY] = [e.offsetX, e.offsetY];
});

drawingCanvas.addEventListener("mouseup", () => {
    isDrawing = false;
});

trackingCanvas.addEventListener("mousemove", (e) => {
        x = e.offsetX;
        y = e.offsetY;
        ws.send(JSON.stringify({type: 'move', x, y}));
    }
)

let clientId = null; // Add a variable to store the client's ID

ws.onopen = function () {
    ws.send(JSON.stringify({request: 'clientId'}));
};

ws.onmessage = function (event) {
    const data = JSON.parse(event.data);

    if (data.type === 'init') {
        // Initialize the active squares with the data from the server
        activeSquares = data.squares;
        if (activeSquares[clientId]) {
            color = activeSquares[clientId].color;
        }
        drawSquares();
    } else if (data.type === 'move') {
        console.log("moving ", data.x, data.y);
        activeSquares[data.id] = {x: data.x, y: data.y, color: data.color};
        drawSquares();
    } else if (data.type === 'remove') {
        // Remove the square from the active squares
        delete activeSquares[data.id];
        drawSquares();
    } else if (data.type === 'draw') {
        drawLine(drawingCtx, lastX, lastY, data.x, data.y, data.color);
        [lastX, lastY] = [data.x, data.y];
    }
};

function drawLine(context, x1, y1, x2, y2, color) {
    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = 1;
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.closePath();
}

function drawSquares() {
    trackingCtx.clearRect(0, 0, trackingCanvas.width, trackingCanvas.height);
    for (let id in activeSquares) {
        let square = activeSquares[id];

        // Convert the color to RGBA for transparency
        let color = square.color.replace('#', '');
        let r = parseInt(color.substring(0, 2), 16);
        let g = parseInt(color.substring(2, 4), 16);
        let b = parseInt(color.substring(4, 6), 16);

        // Adjust the x and y coordinates to center the square on the pointer
        let centerX = square.x - 75;
        let centerY = square.y - 50;

        // Draw the square with transparency
        trackingCtx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.5)`;
        trackingCtx.fillRect(centerX, centerY, 150, 100);

        // Draw the border
        trackingCtx.strokeStyle = "black";
        trackingCtx.lineWidth = 2;
        trackingCtx.strokeRect(centerX, centerY, 150, 100);

        // Draw the client ID
        trackingCtx.fillStyle = "black";
        trackingCtx.fillText("Usuario " + id, centerX + 50, centerY + 50);
    }
}
