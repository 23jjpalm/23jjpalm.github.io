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

    message = input("Enter your message: ")
    client_socket.send(message.encode())

    if choice == 'encode' or choice == 'decode':
        shift = int(input("Enter the cipher shift: "))
        client_socket.send(str(shift).encode())
        response = client_socket.recv(1024).decode()
        print(f"Server response: {response}")
    else:
        print("Invalid choice. Closing connection.")

    client_socket.close()

if __name__ == "__main__":
    main()
