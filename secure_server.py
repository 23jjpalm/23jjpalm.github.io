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

    clients = []

    while True:
        conn, addr = server_socket.accept()
        print(f"Connection from {addr}")

        # Receive and register the client's username
        username = conn.recv(1024).decode()
        print(f"Registered username: {username}")

        # Generate a secret key for this session
        session_key = generate_key()
        conn.send(session_key)

        clients.append((username, conn, session_key))

        try:
            # Receive and broadcast messages from the client
            while True:
                encrypted_data = conn.recv(1024)
                if not encrypted_data:
                    break

                decrypted_message = decrypt_message(encrypted_data, session_key)
                print(f"Received from {username}: {decrypted_message}")

                # Broadcast the message to all clients with the same username
                for client_username, client_conn, client_key in clients:
                    if client_username != username:
                        encrypted_message = encrypt_message(f"{username}: {decrypted_message}", client_key)
                        client_conn.send(encrypted_message)

        except Exception as e:
            print(f"Error: {e}")
        finally:
            # Remove the client when disconnected
            clients = [(u, c, k) for u, c, k in clients if c != conn]
            # Close the connection when the client disconnects
            conn.close()
            print(f"Connection from {addr} closed")

if __name__ == "__main__":
    start_server()
