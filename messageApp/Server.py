import socket
import random

def caesar_cipher(message, shift):
    result = ""
    for char in message:
        if char.isalpha():
            if char.isupper():
                result += chr((ord(char) - 65 + shift) % 26 + 65)
            else:
                result += chr((ord(char) - 97 + shift) % 26 + 97)
        else:
            result += char
    return result

def shuffle_cipher(message):
    message_list = list(message)
    random.shuffle(message_list)
    return ''.join(message_list)

def reverse_shuffle(message):
    message_list = list(message)
    random.shuffle(message_list)
    return ''.join(message_list)

def handle_client(client_socket):
    client_socket.send("Welcome to the server! Choose 'encode' or 'decode': ".encode())
    choice = client_socket.recv(1024).decode().lower()

    client_socket.send("Enter your message: ".encode())
    message = client_socket.recv(1024).decode()

    if choice == 'encode':
        shift = int(input("Enter the shift for Caesar cipher: "))
        encoded_message = caesar_cipher(message, shift)
        shuffled_message = shuffle_cipher(encoded_message)
        client_socket.send(shuffled_message.encode())
    elif choice == 'decode':
        reversed_message = reverse_shuffle(message)
        shift = int(input("Enter the shift for reversing Caesar cipher: "))
        decoded_message = caesar_cipher(reversed_message, -shift)
        client_socket.send(decoded_message.encode())
    else:
        client_socket.send("Invalid choice. Closing connection.".encode())

    client_socket.close()

def start_server():
    host = "192.168.1.166"
    port = 12345

    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.bind((host, port))
    server_socket.listen(5)

    print(f"Server listening on {host}:{port}")

    while True:
        client_socket, addr = server_socket.accept()
        print(f"Connection from {addr}")
        handle_client(client_socket)

if __name__ == "__main__":
    start_server()
