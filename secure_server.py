import socket
import os
from cryptography.fernet import Fernet

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

def load_messages(room_name):
    file_path = f"{room_name}_chat_log.txt"
    messages = []
    if os.path.exists(file_path):
        with open(file_path, 'r') as file:
            messages = file.read().splitlines()
    return messages

def save_message(room_name, message):
    file_path = f"{room_name}_chat_log.txt"
    with open(file_path, 'a') as file:
        file.write(message + '\n')

def start_server():
    host = '192.168.1.166'
    port = 12345

    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.bind((host, port))
    server_socket.listen()

    print(f"Server listening on {host}:{port}")

    while True:
        conn, addr = server_socket.accept()
        print(f"Connection from {addr}")

        try:
            # Receive and register the client's room name
            room_name = conn.recv(1024).decode()
            print(f"Joined room: {room_name}")

            # Generate a secret key for this session
            session_key = generate_key()
            conn.send(session_key)

            # Load chat log for the room
            chat_log = load_messages(room_name)

            # Send chat log to the user
            for chat_entry in chat_log:
                encrypted_message = encrypt_message(chat_entry, session_key)
                conn.send(encrypted_message)

            # Receive and save messages from the client
            while True:
                encrypted_data = conn.recv(1024)
                if not encrypted_data:
                    break

                decrypted_message = decrypt_message(encrypted_data, session_key)
                print(f"Received from {room_name}: {decrypted_message}")

                # Save the message to the chat log
                save_message(room_name, f"{room_name}: {decrypted_message}")

                # Broadcast the message to all clients in the same room
                for client_conn, client_room in client_rooms.items():
                    if client_room == room_name and client_conn != conn:
                        encrypted_message = encrypt_message(f"{room_name}: {decrypted_message}", session_key)
                        client_conn.send(encrypted_message)

        except Exception as e:
            print(f"Error: {e}")
        finally:
            # Close the connection when the client disconnects
            conn.close()
            print(f"Connection from {addr} closed")

if __name__ == "__main__":
    client_rooms = {}
    start_server()
