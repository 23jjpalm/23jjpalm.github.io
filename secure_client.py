import socket

def start_client():
    host = '192.168.1.166'
    port = 12345

    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    client_socket.connect((host, port))

    # Register a username
    username = input("Enter your username: ")
    client_socket.send(username.encode())

    try:
        # Receive and display messages from the server
        while True:
            message = client_socket.recv(1024).decode()
            if not message:
                break

            print(message)

    except Exception as e:
        print(f"Error: {e}")
    finally:
        # Close the socket when exiting the loop
        client_socket.close()

if __name__ == "__main__":
    start_client()
