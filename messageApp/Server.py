import socket
import threading

def handle_client(client_socket):
    # This function will handle the communication with a single client
    while True:
        # Receive data from the client
        data = client_socket.recv(1024)
        if not data:
            break  # Break the loop if no data is received

        # Echo the received data back to the client
        client_socket.send(data)

    # Close the connection with the client
    client_socket.close()

def start_server():
    # Create a socket object
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    # Bind the socket to a specific address and port
    server_socket.bind(('192.168.1.166', 5555))

    # Enable the server to accept connections
    server_socket.listen(5)
    print("[*] Listening on 192.168.1.166:5555")

    while True:
        # Accept a connection from a client
        client_socket, addr = server_socket.accept()
        print(f"[*] Accepted connection from {addr[0]}:{addr[1]}")

        # Create a new thread to handle the client
        client_handler = threading.Thread(target=handle_client, args=(client_socket,))
        client_handler.start()

if __name__ == "__main__":
    start_server()
