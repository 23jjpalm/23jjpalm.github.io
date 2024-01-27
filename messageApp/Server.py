import socket
import threading
import random

def shuffle_string(s, seed):
    random.seed(seed)
    shuffled_list = list(s)
    random.shuffle(shuffled_list)
    return ''.join(shuffled_list)

def caesar_cipher(text, shift):
    result = ""
    for char in text:
        if char.isalpha():
            shifted_char = chr((ord(char) - shift - ord('A' if char.isupper() else 'a') + 26) % 26 + ord('A' if char.isupper() else 'a'))
            result += shifted_char
        else:
            result += char

    return result

def reverse_shuffle_string(s, seed):
    # Reverse the shuffling operation to reconstruct the original string
    original_list = list(s)
    random.seed(seed)
    reversed_list = [original_list.pop(random.randint(0, i)) for i in range(len(original_list)-1, -1, -1)]
    return ''.join(reversed_list)

def handle_client(client_socket):
    while True:
        # Receive option from the client
        option = client_socket.recv(1024).decode()

        if option == 'encode':
            # Generate a random cypher and shuffle seed
            cypher_seed = random.randint(1, 1000)
            shuffle_seed = random.randint(1, 1000)

            # Encode the message using the generated cypher and shuffle seed
            message = client_socket.recv(1024).decode()
            shuffled_message = shuffle_string(message, shuffle_seed)
            encoded_message = caesar_cipher(shuffled_message, cypher_seed)

            # Send back the encoded message and the cypher and shuffle seed within quotes
            response = f'Encoded Message: "{encoded_message}" Cypher Seed: {cypher_seed} Shuffle Seed: {shuffle_seed}'
            client_socket.send(response.encode())
        elif option == 'decode':
            # Receive cypher seed, shuffle seed, and encoded message from the client
            cypher_seed = int(client_socket.recv(1024).decode())
            shuffle_seed = int(client_socket.recv(1024).decode())
            encoded_message = client_socket.recv(1024).decode()

            # Reverse the shuffling and then decode the message
            shuffled_message = reverse_shuffle_string(encoded_message, shuffle_seed)
            decoded_message = caesar_cipher(shuffled_message, cypher_seed)

            # Send back the decoded message within quotes
            client_socket.send(f'Decoded Message: "{decoded_message}"'.encode())
        elif option == 'exit':
            print("Client disconnected.")
            break
        else:
            print("Invalid option. Closing connection.")
            break

    client_socket.close()

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
