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
    host = '127.0.0.1'
    port = 12345

    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.bind((host, port))
    server_socket.listen()

    print(f"Server listening on {host}:{port}")

    message_dict = {}  # Dictionary to store messages based on key
    clients = []  # List to store connected clients

    while True:
        conn, addr = server_socket.accept()
        print(f"Connection from {addr}")

        # Generate a secret key for this session
        session_key = generate_key()

        # Send the session key to the client
        conn.send(session_key)

        # Receive and register the client's username
        username = conn.recv(1024).decode()
        print(f"Registered username: {username}")

        # Receive the user's key
        user_key = conn.recv(1024).decode()

        # Store the key for the user
        message_dict[username] = {'key': user_key, 'messages': []}

        # Add the new client to the list
        clients.append(conn)

        try:
            # Receive and store messages from the client
            while True:
                encrypted_data = conn.recv(1024)
                if not encrypted_data:
                    break

                decrypted_message = decrypt_message(encrypted_data, session_key)
                print(f"Received from {username}: {decrypted_message}")

                # Store the message in the dictionary
                message_dict[username]['messages'].append(decrypted_message)

                # Send the message to all clients
                for client in clients:
                    if client != conn:  # Avoid sending the message back to the sender
                        encrypted_message = encrypt_message(f"{username}: {decrypted_message}", session_key)
                        client.send(encrypted_message)

        except Exception as e:
            print(f"Error: {e}")
        finally:
            # Remove the client from the list when disconnected
            clients.remove(conn)
            # Close the connection when the client disconnects
            conn.close()
            print(f"Connection from {addr} closed")

if __name__ == "__main__":
    start_server()
