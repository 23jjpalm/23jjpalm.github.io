import socket
import threading
import subprocess
import time
import sys

def handle_server_response(client_socket):
    while True:
        # Receive and print messages from the server
        response = client_socket.recv(1024)
        print(f"Server response: {response.decode()}")

def rainbow_flash():
    colors = ["4F", "2F", "1F", "4", "2", "1", "A", "5", "E", "6", "C"]
    delay = 0.2  # Time delay between color changes

    try:
        while True:
            for color in colors:
                subprocess.run(f'color {color}', shell=True)
                time.sleep(delay)
    except KeyboardInterrupt:
        # Handle Ctrl+C to exit
        print("\nExiting rainbow flash.")

def start_client():
    # Create a socket object
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    # Connect to the server
    client_socket.connect(('192.168.1.166', 5555))

    # Start a thread to handle server responses
    response_thread = threading.Thread(target=handle_server_response, args=(client_socket,))
    response_thread.start()

    try:
        while True:
            # Get user input to send to the server
            message = input("Enter a message to send to the server (type 'exit' to quit): ")

            if message.lower() == 'exit':
                break  # Break the loop if the user enters 'exit'

            # Send the user input to the server
            client_socket.send(message.encode())
    finally:
        # Close the connection with the server
        client_socket.close()

if __name__ == "__main__":
    start_client()
    rainbow_flash()
