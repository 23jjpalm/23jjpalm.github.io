import socket
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

def start_server():
    host = '192.168.1.166'
    port = 12345

    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.bind((host, port))
    server_socket.listen()

    print(f"Server listening on {host}:{port}")

    message_dict = {}  # Dictionary to store messages based on username

    while True:
        conn, addr = server_socket.accept()
        print(f"Connection from {addr}")

        # Receive and register the client's username
        username = conn.recv(1024).decode()
        print(f"Registered username: {username}")

        # Add the new client to the dictionary
        if username not in message_dict:
            message_dict[username] = {'messages': [], 'connection': conn}
        else:
            # If the username already exists, retrieve and send existing messages to the client
            existing_messages = message_dict[username]['messages']
            for message in existing_messages:
                conn.send(encrypt_message(message, generate_key()))

        try:
            # Receive and store messages from the client
            while True:
                encrypted_data = conn.recv(1024)
                if not encrypted_data:
                    break

                decrypted_message = decrypt_message(encrypted_data, generate_key())
                print(f"Received from {username}: {decrypted_message}")

                # Store the message in the dictionary
                message_dict[username]['messages'].append(decrypted_message)

                # Send the message to all clients with the same username
                for client_username, client_info in message_dict.items():
                    if client_username != username:
                        client_conn = client_info['connection']
                        encrypted_message = encrypt_message(f"{username}: {decrypted_message}", generate_key())
                        client_conn.send(encrypted_message)

        except Exception as e:
            print(f"Error: {e}")
        finally:
            # Close the connection when the client disconnects
            conn.close()
            print(f"Connection from {addr} closed")

if __name__ == "__main__":
    start_server()
