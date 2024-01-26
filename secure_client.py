import socket
from cryptography.fernet import Fernet

def encrypt_message(message, key):
    cipher_suite = Fernet(key)
    encrypted_message = cipher_suite.encrypt(message.encode())
    return encrypted_message

def decrypt_message(encrypted_message, key):
    cipher_suite = Fernet(key)
    decrypted_message = cipher_suite.decrypt(encrypted_message).decode()
    return decrypted_message

def start_client():
    host = '127.0.0.1'
    port = 12345

    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    client_socket.connect((host, port))

    # Receive the session key from the server
    server_key = client_socket.recv(1024)

    # Register a username
    username = input("Enter your username: ")
    client_socket.send(username.encode())

    # Enter the user's key
    user_key = input("Enter your key: ")
    client_socket.send(user_key.encode())

    # Receive and display messages from the server
    while True:
        encrypted_data = client_socket.recv(1024)
        if not encrypted_data:
            break

        decrypted_message = decrypt_message(encrypted_data, server_key)
        print(decrypted_message)

    # Enter and send messages to the server
    try:
        while True:
            message = input("Enter your message (type 'exit' to disconnect): ")

            if message.lower() == 'exit':
                break

            encrypted_message = encrypt_message(message, server_key)
            client_socket.send(encrypted_message)

    finally:
        # Close the socket when exiting the loop
        client_socket.close()

if __name__ == "__main__":
    start_client()
