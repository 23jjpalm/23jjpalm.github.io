import socket
import threading
import random

def handle_client(client_socket):
    while True:
        data = client_socket.recv(1024)
        if not data:
            break

        # Encode the received message using a Caesar cipher with a random shift
        shift = random.randint(1, 25)
        encoded_data = caesar_cipher(data.decode(), shift)

        # Send back the encoded message
        client_socket.send(encoded_data.encode())

    client_socket.close()


def caesar_cipher(text, shift):
    result = ""
    for char in text:
        if char.isalpha():
            shifted_char = chr((ord(char) + shift - ord('A' if char.isupper() else 'a')) % 26 + ord('A' if char.isupper() else 'a'))
            result += shifted_char
        else:
            result += char
    return result

def start_server():
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.bind(('192.168.1.166', 5555))
    server_socket.listen(5)
    print("[*] Listening on 192.168.1.166:5555")

    while True:
        client_socket, addr = server_socket.accept()
        print(f"[*] Accepted connection from {addr[0]}:{addr[1]}")

        client_handler = threading.Thread(target=handle_client, args=(client_socket,))
        client_handler.start()

if __name__ == "__main__":
    start_server()
