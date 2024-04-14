import asyncio
import websockets
import numpy as np
import cv2
import json
import os
from screeninfo import get_monitors
import pyautogui
from collections import deque
import zlib
import threading

def get_screen_size():
    monitor = get_monitors()[0]
    return monitor.width, monitor.height

width, height = get_screen_size()
print(f'Screen size is {width}x{height}')

# WebSocket server configuration
HOST = os.getenv('HOST', '0.0.0.0')
PORT = 8083

# Screen capture configuration
ENCODING = 'jpg'
QUALITY = 10
BUFFER_SIZE = 2 

# Stream control variables
stream_running = True

frame_buffer = deque(maxlen=BUFFER_SIZE)
prev_screenshot = None

def capture_screenshots(screenshot_queue):
    while stream_running:
        screenshot = pyautogui.screenshot(region=(0, 0, width, height))
        screenshot_queue.append(screenshot)

async def stream_screen(websocket):
    global stream_running
    global prev_screenshot

    screenshot_queue = deque(maxlen=10)
    screenshot_thread = threading.Thread(target=capture_screenshots, args=(screenshot_queue,))
    screenshot_thread.start()

    while stream_running:
        try:
            if len(screenshot_queue) > 0:
                screenshot = screenshot_queue.popleft()
                img = np.array(screenshot)
                img_bgr = cv2.cvtColor(img, cv2.COLOR_BGRA2RGB)

                # Custom encoding and decoding
                _, img_encoded = cv2.imencode(f'.{ENCODING}', img_bgr, [cv2.IMWRITE_JPEG_QUALITY, QUALITY])
                frame_data = img_encoded.tobytes()

                # Compress frame data
                #compressed_data = zlib.compress(frame_data)

                # Send compressed frame data over WebSocket
                await websocket.send(frame_data)

            # Delay to control frame rate
            await asyncio.sleep(0.03)  # Approximately 30 FPS
        except Exception as e:
            print(f"Error in stream_screen: {e}")
            break

async def handler(websocket):
    print('Screen Client connected')
    await websocket.send(json.dumps({'status': 'connected'}))
    await websocket.send(json.dumps({'status': 'size', 'width': width, 'height': height}))

    await stream_screen(websocket)

    print('Client disconnected')

async def main():
    async with websockets.serve(handler, HOST, PORT):
        print(f'StreamCapture server running on ws://{HOST}:{PORT}')
        await asyncio.Future()  # Run forever

if __name__ == '__main__':
    asyncio.run(main())
