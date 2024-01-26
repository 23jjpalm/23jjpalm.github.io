import socket
from cryptography.fernet import Fernet
import threading

def generate_key():
    return Fernet.generate_key()

def encrypt_message(message, key):
    cipher_suite = Fernet(key)
    encrypted_message = cipher_suite.encrypt(message.encode())
    return encrypted_message

def decrypt_message(encrypted_message, key):
    cipher_suite = Fernet(key)
    decrypted_message = cipher_suite.decrypt(encrypted_message).decode()
    return decrypted_message

def receive_messages(client_socket, session_key):
    try:
        # Receive and display messages from the server
        while True:
            encrypted_data = client_socket.recv(1024)
            if not encrypted_data:
                break

            decrypted_message = decrypt_message(encrypted_data, session_key)
            print(decrypted_message)

    except Exception as e:
        print(f"Error: {e}")
    finally:
        # Close the socket when exiting the loop
        client_socket.close()

def start_client():
    host = '192.168.1.166'
    port = 12345

    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    client_socket.connect((host, port))

    # Register a username
    username = input("Enter your username: ")
    client_socket.send(username.encode())

    # Receive the session key from the server
    session_key = client_socket.recv(1024)

    # Start a thread to receive messages
    receive_thread = threading.Thread(target=receive_messages, args=(client_socket, session_key))
    receive_thread.start()

    try:
        # Send messages to the server
        while True:
            message = input("Enter your message (type 'exit' to disconnect): ")
            if message.lower() == 'exit':
                break
            elif message.lower() == 'inbox':
                # Request inbox from the server
                encrypted_message = encrypt_message("
