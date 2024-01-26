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

def clear_console():
    # Clear console screen based on the operating system
    if os.name == 'nt':
        os.system('cls')
    else:
        os.system('clear')

def start_client():
    host = '192.168.1.166'
    port = 12345

    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    client_socket.connect((host, port))

    # Receive and set the session key
    session_key = client_socket.recv(1024)
    cipher_suite = Fernet(session_key)

    while True:
        clear_console()
        print("Options:")
        print("1. Send a message")
        print("2. Send a private message")
        print("3. Check inbox")
        print("4. Exit")

        choice = input("Enter the number of your choice: ")

        if choice == "1":
            message = input("Enter your message: ")
            encrypted_message = encrypt_message(message, session_key)
            client_socket.send(encrypted_message)

        elif choice == "2":
            to_username = input("Enter the username of the recipient: ")
            message = input("Enter your private message: ")
            encrypted_message = encrypt_message(f"TO:{to_username} {message}", session_key)
            client_socket.send(encrypted_message)

        elif choice == "3":
            client_socket.send(encrypt_message("INBOX", session_key))
            print("Inbox:")
            while True:
                encrypted_message = client_socket.recv(1024)
                if not encrypted_message:
                    break
                decrypted_message = decrypt_message(encrypted_message, session_key)
                print(decrypted_message)

        elif choice == "4":
            client_socket.send(encrypt_message("EXIT", session_key))
            break

        input("Press Enter to continue...")

    client_socket.close()

if __name__ == "__main__":
    start_client()
