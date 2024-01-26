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

def load_chat_log(room_name):
    file_path = f"{room_name}_chat_log.txt"
    chat_log = []
    if os.path.exists(file_path):
        with open(file_path, 'r') as file:
            chat_log = file.read().splitlines()
    return chat_log

def save_message(room_name, message):
    file_path = f"{room_name}_chat_log.txt"
    with open(file_path, 'a') as file:
        file.write(message + '\n')

def send_chat_history(conn, session_key, chat_log):
    for chat_entry in chat_log:
        encrypted_message = encrypt_message(chat_entry, session_key)
        conn.send(encrypted_message)

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
            chat_log = load_chat_log(room_name)

            # Send chat log to the user
            send_chat_history(conn, session_key, chat_log)

            # Add the client connection to the room_connections dictionary
            if room_name not in room_connections:
                room_connections[room_name] = []
            room_connections[room_name].append(conn)

            # Receive and broadcast messages from the client
            while True:
                encrypted_data = conn.recv(1024)
                if not encrypted_data:
                    break

                decrypted_message = decrypt_message(encrypted_data, session_key)
                print(f"Received from {room_name}: {decrypted_message}")

                # Broadcast the message to all clients in the room
                for client_conn in room_connections.get(room_name, []):
                    if client_conn != conn:
                        client_conn.send(encrypt_message(f"{room_name}: {decrypted_message}", session_key))

                # Save the message to the chat log
                save_message(room_name, f"{room_name}: {decrypted_message}")

            # After the client leaves, update their chat log
            chat_log = load_chat_log(room_name)
            send_chat_history(conn, session_key, chat_log)

        except Exception as e:
            print(f"Error: {e}")
        finally:
            # Close the connection when the client disconnects
            if room_name in room_connections:
                room_connections[room_name].remove(conn)
                if not room_connections[room_name]:
                    del room_connections[room_name]
            conn.close()
            print(f"Connection from {addr} closed")

if __name__ == "__main__":
    room_connections = {}
    start_server()
