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
    host = '192.168.1.166'
    port = 12345

    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    client_socket.connect((host, port))

    # Receive the session key from the server
    server_key = client_socket.recv(1024)

    # Register a username
    username = input("Enter your username: ")
    client_socket.send(username.encode())

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
