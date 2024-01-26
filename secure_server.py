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

    conn, addr = server_socket.accept()
    print(f"Connection from {addr}")

    # Generate a secret key for this session
    session_key = generate_key()

    # Send the session key to the client
    conn.send(session_key)

    # Receive and register the client's username
    username = conn.recv(1024).decode()
    print(f"Registered username: {username}")

    while True:
        encrypted_data = conn.recv(1024)
        if not encrypted_data:
            break

        decrypted_message = decrypt_message(encrypted_data, session_key)
        print(f"Received from {username}: {decrypted_message}")

    conn.close()

if __name__ == "__main__":
    start_server()
