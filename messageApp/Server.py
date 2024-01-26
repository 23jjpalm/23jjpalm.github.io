import socket
import threading
import random

def shuffle_string(s):
    # Shuffle the characters in the string
    shuffled_list = list(s)
    random.shuffle(shuffled_list)
    return ''.join(shuffled_list)

def caesar_cipher(text, shift):
    result = ""
    for char in text:
        if char.isalpha():
            shifted_char = chr((ord(char) + shift - ord('A' if char.isupper() else 'a')) % 26 + ord('A' if char.isupper() else 'a'))
            result += shifted_char
        else:
            result += char

    # Shuffle the resulting string to randomize the location of the letters
    result = shuffle_string(result)
    return result

def handle_client(client_socket, access_code):
    while True:
        data = client_socket.recv(1024)
        if not data:
            break

        # Check if the received message starts with the correct access code
        if data.decode().startswith(access_code):
            # If yes, encode the message and send it back
            shift = random.randint(1, 25)
            encoded_data = caesar_cipher(data.decode()[len(access_code):], shift)
            client_socket.send(encoded_data.encode())
        else:
            print("Incorrect access code. Message ignored.")

    client_socket.close()

def start_server(access_code):
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.bind(('192.168.1.166', 5555))
    server_socket.listen(5)
    print("[*] Listening on 192.168.1.166:5555")

    while True:
        client_socket, addr = server_socket.accept()
        print(f"[*] Accepted connection from {addr[0]}:{addr[1]}")

        client_handler = threading.Thread(target=handle_client, args=(client_socket, access_code))
        client_handler.start()

if __name__ == "__main__":
    access_code = input("Enter the server access code: ")
    start_server(access_code)