import socket
import os
import base64
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

def decode_image(encoded_image, image_path):
    with open(image_path, "wb") as image_file:
        image_file.write(base64.b64decode(encoded_image))

def receive_images(client_socket, session_key):
    try:
        while True:
            encrypted_data = client_socket.recv(1024)
            if not encrypted_data:
                break

            decoded_image = decrypt_message(encrypted_data, session_key)
            print("Received an image.")
            image_path = "received_image.png"  # Set your desired image path
            decode_image(decoded_image, image_path)
            print(f"Image saved at {image_path}")

    except Exception as e:
        print(f"Error receiving image: {e}")
    finally:
        client_socket.close()

def start_client():
    host = '127.0.0.1'
    port = 12345

    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    client_socket.connect((host, port))

    username = input("Enter your username: ")
    client_socket.send(username.encode())

    session_key = client_socket.recv(1024)

    # Start a thread to receive images
    receive_thread = threading.Thread(target=receive_images, args=(client_socket, session_key))
    receive_thread.start()

    try:
        while True:
            clear_console()

            print("\nCommand Menu:")
            print("1. Receive Image")
            print("2. Exit")

            choice = input("Enter your choice (1-2): ")

            if choice == "1":
                # Request the server to send an image
                encrypted_message = encrypt_message("SEND_IMAGE", session_key)
                client_socket.send(encrypted_message)

            elif choice == "2":
                # Exit command
                encrypted_message = encrypt_message("exit", session_key)
                client_socket.send(encrypted_message)
                break

            else:
                print("Invalid choice. Please enter a number from 1 to 2.")
                continue

    except Exception as e:
        print(f"Error: {e}")
    finally:
        client_socket.close()

if __name__ == "__main__":
    start_client()
