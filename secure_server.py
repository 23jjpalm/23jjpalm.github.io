import socket

def start_server():
    host = '192.168.1.166'
    port = 12345

    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.bind((host, port))
    server_socket.listen()

    print(f"Server listening on {host}:{port}")

    clients = []

    while True:
        conn, addr = server_socket.accept()
        print(f"Connection from {addr}")

        # Receive and register the client's username
        username = conn.recv(1024).decode()
        print(f"Registered username: {username}")

        clients.append((username, conn))

        try:
            # Receive and broadcast messages from the client
            while True:
                message = conn.recv(1024).decode()
                if not message:
                    break

                print(f"Received from {username}: {message}")

                # Broadcast the message to all clients with the same username
                for client_username, client_conn in clients:
                    if client_username != username:
                        client_conn.send(f"{username}: {message}".encode())

        except Exception as e:
            print(f"Error: {e}")
        finally:
            # Remove the client when disconnected
            clients = [(u, c) for u, c in clients if c != conn]
            # Close the connection when the client disconnects
            conn.close()
            print(f"Connection from {addr} closed")

if __name__ == "__main__":
    start_server()
