import asyncio
import websockets
import json
import pyautogui
import os
import time

# WebSocket server configuration
HOST = os.getenv('HOST', '0.0.0.0')
PORT = 8082

async def receive_control(websocket):
    while True:
        try:
            message = await websocket.recv()
            control_data = json.loads(message)
            if 'action' in control_data:
                action = control_data['action']
                if action == 'mouseClick':
                    x, y = control_data['x'], control_data['y']
                    pyautogui.click(x, y)
                elif action == 'keyDown':
                    key = control_data['key']
                    pyautogui.press(key)
                elif action == 'mouseWheel':
                    x, y = control_data['x'], control_data['y']
                    pyautogui.scroll(x, y)
                elif action == 'mouseMove':
                    nowInUnix = time.time()
                    # print("time")
                    # print(nowInUnix)
                    # print(control_data['time']/1000)
                    # print(nowInUnix - control_data['time']/1000)
                    if (nowInUnix - control_data['time']/1000)> 0.3:
                        continue
                    x, y = control_data['x'], control_data['y']
                    pyautogui.moveTo(x, y)
        except json.JSONDecodeError:
            print('Invalid control data received')

async def handler(websocket):
    await websocket.send(json.dumps({'status': 'connected'}))
    print("control Client connected")
    await receive_control(websocket)

async def main():
    async with websockets.serve(handler, HOST, PORT):
        print(f'ReceiveControls server running on ws://{HOST}:{PORT}')
        await asyncio.Future()  # Run forever

if __name__ == '__main__':
    asyncio.run(main())
