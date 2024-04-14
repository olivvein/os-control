import subprocess
import signal
import sys

def launch_server(file_path):
    return subprocess.Popen(["python3.11", file_path])

if __name__ == "__main__":
    server_files = [
        "betterStreamCapture.py",
        "receiveControls.py",
        "mouseSendPosition.py",
        #"playServer.py"
    ]

    processes = []
    try:
        for file in server_files:
            process = launch_server(file)
            processes.append(process)
    except Exception as e:
        print(f"Error launching server: {e}")
        print("Ctrl+C pressed. Terminating subprocesses...")
        for process in processes:
            process.terminate()
        sys.exit(0)


    print("All servers launched successfully!")

    def signal_handler(sig, frame):
        print("Ctrl+C pressed. Terminating subprocesses...")
        for process in processes:
            process.terminate()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)

    # Keep the main process alive
    signal.pause()
