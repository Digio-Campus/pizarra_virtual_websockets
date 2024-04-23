const ws = new WebSocket('ws://localhost:3000');

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const drawingCanvas = document.getElementById('drawingCanvas');
const drawingContext = drawingCanvas.getContext('2d');


canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;
drawingCanvas.width = drawingCanvas.offsetWidth;
drawingCanvas.height = drawingCanvas.offsetHeight;


let isDrawing = false;
let lastX = 0;
let lastY = 0;
let color = null;
let x = 0;
let y = 0;
let activeSquares = {};
let lines = [];

canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
});

canvas.addEventListener("mousemove", (e) => {
    x = e.offsetX;
    y = e.offsetY;
    ws.send(JSON.stringify({type: 'move', x, y}));

    if (!isDrawing) return;
    ws.send(JSON.stringify({type: 'draw', x: e.offsetX, y: e.offsetY, color}));
    [lastX, lastY] = [e.offsetX, e.offsetY];
});

canvas.addEventListener("mouseup", () => {
    isDrawing = false;
});
let clientId = null;

ws.onopen = function () {
    ws.send(JSON.stringify({request: 'clientId'}));
};

ws.onmessage = function (event) {
    const data = JSON.parse(event.data);

    if (data.type === 'init') {
        activeSquares = data.squares;
        if (activeSquares[clientId]) {
            color = activeSquares[clientId].color;
        }
        drawSquares().then(r => drawLines());
    } else if (data.type === 'move') {
        activeSquares[data.id] = {x: data.x, y: data.y, color: data.color};
        drawSquares().then(r => drawLines());

    } else if (data.type === 'remove') {
        delete activeSquares[data.id];
        drawSquares().then(r => drawLines());

    } else if (data.type === 'draw') {
        drawLine(drawingContext, lastX, lastY, data.x, data.y, data.color);
        [lastX, lastY] = [data.x, data.y];

      //  lines.push({x1: lastX, y1: lastY, x2: data.x, y2: data.y, color: data.color});

    }

};

function drawLine(context, x1, y1, x2, y2, color) {
    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = 5;
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.closePath();
}

async function drawSquares() {
    await context.clearRect(0, 0, canvas.width, canvas.height);
    drawLines()

    for (let id in activeSquares) {
        let square = activeSquares[id];
        let centerX = square.x - 75;
        let centerY = square.y - 50;
        let color = square.color.replace('#', '');
        let r = parseInt(color.substring(0, 2), 16);
        let g = parseInt(color.substring(2, 4), 16);
        let b = parseInt(color.substring(4, 6), 16);
        context.fillStyle = `rgba(${r}, ${g}, ${b}, 0.5)`;
        context.fillRect(centerX, centerY, 150, 100);
        context.strokeStyle = "black";
        context.lineWidth = 2;
        context.strokeRect(centerX, centerY, 150, 100);
        context.fillStyle = "black";
        context.fillText("Usuario " + id, centerX + 50, centerY + 50);
    }
}

function drawLines() {
    console.log("Drawing lines");
    for (let line of lines) {
        drawLine(context, line.x1, line.y1, line.x2, line.y2, line.color);
    }
}
