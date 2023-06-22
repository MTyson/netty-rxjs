import { fromEvent } from 'rxjs';
import { switchMap, takeUntil, filter } from 'rxjs/operators';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('canvas');
  const context = canvas.getContext('2d');
  const socket = new WebSocket('ws://34.30.36.100:8080/drawing');

  socket.addEventListener('open', (event) => {
    console.log('WebSocket connection opened');
  });

  socket.addEventListener('message', (event) => {
    //const message = event.data;
    const message = JSON.parse(event.data);
    console.log('Received message from server:', message);
    drawLine(message.startX, message.startY, message.endX, message.endY);
  });

  const mouseDown$ = fromEvent(canvas, 'mousedown');
  const mouseUp$ = fromEvent(canvas, 'mouseup');

  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;

  const mouseMove$ = mouseDown$.pipe(
    switchMap(() =>
      fromEvent(canvas, 'mousemove').pipe(
        takeUntil(mouseUp$),
        filter(() => isDrawing)
      )
    )
  );

  mouseDown$.subscribe((event) => {
    isDrawing = true;
    [lastX, lastY] = [event.offsetX, event.offsetY];
  });

  mouseMove$.subscribe((moveEvent) => {
    drawLine(lastX, lastY, moveEvent.offsetX, moveEvent.offsetY);
    const data = {
      startX: lastX,
      startY: lastY,
      endX: moveEvent.offsetX,
      endY: moveEvent.offsetY,
    };
    socket.send(JSON.stringify(data));

    [lastX, lastY] = [moveEvent.offsetX, moveEvent.offsetY];
  });

  mouseUp$.subscribe(() => {
    isDrawing = false;
  });

  function drawLine(startX, startY, endX, endY) {
    context.beginPath();
    context.moveTo(startX, startY);
    context.lineTo(endX, endY);
    context.stroke();
  }
});

