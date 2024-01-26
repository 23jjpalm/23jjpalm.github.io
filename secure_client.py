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

    # Register a username
    username = input("Enter your username: ")
    client_socket.send(username.encode())

    # Store the connection in a dictionary
    client_info = {'connection': client_socket}

    # Receive and display messages from the server
    try:
        while True:
            encrypted_data = client_socket.recv(1024)
            if not encrypted_data:
                break

            decrypted_message = decrypt_message(encrypted_data, generate_key())
            print(decrypted_message)

    except Exception as e:
        print(f"Error: {e}")
    finally:
        # Close the socket when exiting the loop
        client_socket.close()

if __name__ == "__main__":
    start_client()
