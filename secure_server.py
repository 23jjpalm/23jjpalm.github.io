import socket
from cryptography.fernet import Fernet
import os

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

def load_messages(username):
    filename = f"{username}_messages.txt"
    messages = []

    if os.path.exists(filename):
        with open(filename, "r") as file:
            messages = [line.strip() for line in file]

    return messages

def save_messages(username, messages):
    filename = f"{username}_messages.txt"

    with open(filename, "w") as file:
        for message in messages:
            file.write(f"{message}\n")

def start_server():
    host = '192.168.1.166'
    port = 12345

    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.bind((host, port))
    server_socket.listen()

    print(f"Server listening on {host}:{port}")

    clients = {}

    while True:
        conn, addr = server_socket.accept()
        print(f"Connection from {addr}")

        try:
            # Receive and register the client's username
            username = conn.recv(1024).decode()
            print(f"Registered username: {username}")

            # Generate a secret key for this session
            session_key = generate_key()
            conn.send(session_key)

            # Load stored messages for the user
            stored_messages = load_messages(username)

            # Store the user's connection, key, and stored messages
            clients[username] = {'connection': conn, 'key': session_key, 'messages': stored_messages}

            # Send stored messages to the user
            for stored_message in stored_messages:
                encrypted_message = encrypt_message(stored_message, session_key)
                conn.send(encrypted_message)

            # Receive and broadcast messages from the client
            while True:
                encrypted_data = conn.recv(1024)
                if not encrypted_data:
                    break

                decrypted_message = decrypt_message(encrypted_data, session_key)
                print(f"Received from {username}: {decrypted_message}")

                # Check if the message is intended for another user
                if decrypted_message.startswith("TO:"):
                    to_username, message_content = decrypted_message.split(":", 1)[1].split(" ", 1)
                    if to_username in clients:
                        to_conn = clients[to_username]['connection']
                        to_key = clients[to_username]['key']
                        encrypted_message = encrypt_message(f"{username} (private): {message_content}", to_key)
                        to_conn.send(encrypted_message)
                    else:
                        # If the recipient is not found, store the message for later
                        clients[to_username]['messages'].append(f"{username} (private): {message_content}")

                elif decrypted_message.lower() == "inbox":
                    # Send stored messages to the user when 'inbox' is received
                    for stored_message in clients[username]['messages']:
                        encrypted_message = encrypt_message(stored_message, session_key)
                        conn.send(encrypted_message)
                    # Clear the stored messages for the user
                    clients[username]['messages'] = []

                else:
                    # Broadcast the message to all clients with the same username
                    for client_username, client_info in clients.items():
                        if client_username != username:
                            client_conn = client_info['connection']
                            client_key = client_info['key']
                            encrypted_message = encrypt_message(f"{username}: {decrypted_message}", client_key)
                            client_conn.send(encrypted_message)

        except Exception as e:
            print(f"Error: {e}")
        finally:
            # Save stored messages for the user
            if username in clients:
                stored_messages = clients[username]['messages']
                save_messages(username, stored_messages)
                del clients[username]

            # Close the connection when the client disconnects
            conn.close()
            print(f"Connection from {addr} closed")

if __name__ == "__main__":
    start_server()
