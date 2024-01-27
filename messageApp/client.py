import socket

def main():
    host = "192.168.1.166"
    port = 12345

    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    client_socket.connect((host, port))

    print(client_socket.recv(1024).decode())

    choice = input().lower()
    client_socket.send(choice.encode())

    print(client_socket.recv(1024).decode())

    message = input()
    client_socket.send(message.encode())

    response = client_socket.recv(1024).decode()
    print(f"Server response: {response}")

    client_socket.close()

if __name__ == "__main__":
    main()
