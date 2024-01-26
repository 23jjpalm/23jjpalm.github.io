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

def load_messages(username):
    file_path = f"{username}_chat_log.txt"
    messages = []
    if os.path.exists(file_path):
        with open(file_path, 'r') as file:
            messages = file.read().splitlines()
    return messages

def save_message(username, message):
    file_path = f"{username}_chat_log.txt"
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
            # Receive and register the client's username
            username = conn.recv(1024).decode()
            print(f"Registered username: {username}")

            # Generate a secret key for this session
            session_key = generate_key()
            conn.send(session_key)

            # Load chat log for the user
            chat_log = load_messages(username)

            # Send chat log to the user
            for chat_entry in chat_log:
                encrypted_message = encrypt_message(chat_entry, session_key)
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
                    if to_username in usernames:
                        to_conn = usernames[to_username]['connection']
                        to_key = usernames[to_username]['key']
                        encrypted_message = encrypt_message(f"{username} (private): {message_content}", to_key)
                        to_conn.send(encrypted_message)
                    else:
                        # If the recipient is not online, inform the sender
                        sender_message = f"Server: User {to_username} is not online. Your message was not delivered."
                        sender_encrypted_message = encrypt_message(sender_message, session_key)
                        conn.send(sender_encrypted_message)
                        # Store the message for later delivery
                        save_message(to_username, f"{username} (private): {message_content}")

                elif decrypted_message.lower() == "convo":
                    # Conversation command
                    to_username = input("Enter the username to view the conversation: ")
                    chat_log = load_messages(f"{username}_{to_username}")
                    for chat_entry in chat_log:
                        encrypted_message = encrypt_message(chat_entry, session_key)
                        conn.send(encrypted_message)

                elif decrypted_message.lower() == "exit":
                    # Handle 'exit' command
                    break

                else:
                    # Broadcast the message to all clients with the same username
                    for client_username, client_info in usernames.items():
                        if client_username != username:
                            client_conn = client_info['connection']
                            client_key = client_info['key']
                            encrypted_message = encrypt_message(f"{username}: {decrypted_message}", client_key)
                            client_conn.send(encrypted_message)

                    # Save the message to the chat log
                    save_message(username, f"{username}: {decrypted_message}")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            # Close the connection when the client disconnects
            if username in usernames:
                del usernames[username]
            conn.close()
            print(f"Connection from {addr} closed")

if __name__ == "__main__":
    usernames = {}
    start_server()
