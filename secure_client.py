import socket
import os
from cryptography.fernet import Fernet
import threading
import platform

def clear_console():
    # Clear console based on the platform
    if platform.system() == 'Windows':
        os.system('cls')
    else:
        os.system('clear')

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

def receive_messages(client_socket, session_key):
    try:
        # Receive and display messages from the server
        while True:
            encrypted_data = client_socket.recv(1024)
            if not encrypted_data:
                break

            decrypted_message = decrypt_message(encrypted_data, session_key)
            print(decrypted_message)

    except Exception as e:
        print(f"Error: {e}")
    finally:
        # Close the socket when exiting the loop
        client_socket.close()

def start_client():
    host = '192.168.1.166'
    port = 12345

    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    client_socket.connect((host, port))

    # Register a username
    username = input("Enter your username: ")
    client_socket.send(username.encode())

    # Receive the session key from the server
    session_key = client_socket.recv(1024)

    # Start a thread to receive messages
    receive_thread = threading.Thread(target=receive_messages, args=(client_socket, session_key))
    receive_thread.start()

    try:
        # Display command menu
        while True:
            clear_console()  # Clear console before displaying options

            print("\nCommand Menu:")
            print("1. Broadcast message")
            print("2. Private message")
            print("3. Exit")
            print("4. Conversation (View conversation with another user)")

            choice = input("Enter your choice (1-4): ")

            if choice == "1":
                # Broadcast message
                message = input("Enter your broadcast message: ")
                encrypted_message = encrypt_message(message, session_key)

            elif choice == "2":
                # Private message
                to_username = input("Enter the username of the recipient: ")
                message_content = input("Enter your private message: ")
                message = f"TO:{to_username} {message_content}"
                encrypted_message = encrypt_message(message, session_key)

            elif choice == "3":
                # Exit command
                encrypted_message = encrypt_message("exit", session_key)
                break

            elif choice == "4":
                # Conversation command
                to_username = input("Enter the username to view the conversation: ")
                encrypted_message = encrypt_message("convo", session_key)
                client_socket.send(encrypted_message)

            else:
                print("Invalid choice. Please enter a number from 1 to 4.")
                continue

            # Send the chosen command to the server
            client_socket.send(encrypted_message)

    except Exception as e:
        print(f"Error: {e}")
    finally:
        # Close the socket when exiting the loop
        client_socket.close()

if __name__ == "__main__":
    start_client()
