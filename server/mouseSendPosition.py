import asyncio
import websockets
import json
import pyautogui
import os

# WebSocket server configuration
HOST = os.getenv('HOST', '0.0.0.0')
PORT = 8081

async def stream_mouse_position(websocket):
    while True:
        x, y = pyautogui.position()
        await websocket.send(json.dumps({'status': 'mousePosition', 'x': x, 'y': y}))
        await asyncio.sleep(0.1)

async def handler(websocket):
    await websocket.send(json.dumps({'status': 'connected'}))
    print('mouse Client connected')
    await stream_mouse_position(websocket)

async def main():
    async with websockets.serve(handler, HOST, PORT):
        print(f'MouseSendPosition server running on ws://{HOST}:{PORT}')
        await asyncio.Future()  # Run forever

if __name__ == '__main__':
    asyncio.run(main())
