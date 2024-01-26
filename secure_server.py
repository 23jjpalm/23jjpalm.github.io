import socket
import os
import base64
from cryptography.fernet import Fernet

def generate_key():
    return Fernet.generate_key()

def encrypt_message(message, key):
    cipher_suite = Fernet(key)
    encrypted_message = cipher_suite.encrypt(message.encode())
    return encrypted_message

def decode_image(encoded_image, image_path):
    with open(image_path, "wb") as image_file:
        image_file.write(base64.b64decode(encoded_image))

def load_images(image_path):
    encoded_images = []
    try:
        with open(image_path, "rb") as image_file:
            encoded_images.append(base64.b64encode(image_file.read()).decode())
    except FileNotFoundError:
        print(f"Image file '{image_path}' not found.")
    return encoded_images

def send_image(conn, session_key, image_path):
    try:
        full_image_path = os.path.join("images", image_path)
        encoded_images = load_images(full_image_path)
        for encoded_image in encoded_images:
            encrypted_message = encrypt_message(encoded_image, session_key)
            conn.send(encrypted_message)
    except Exception as e:
        print(f"Error sending image: {e}")

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
        print(f"Error: {e}")
    finally:
        client_socket.close()

def start_server():
    host = '127.0.0.1'
    port = 12345

    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.bind((host, port))
    server_socket.listen()

    print(f"Server listening on {host}:{port}")

    while True:
        conn, addr = server_socket.accept()
        print(f"Connection from {addr}")

        try:
            username = conn.recv(1024).decode()
            print(f"Registered username: {username}")

            session_key = generate_key()
            conn.send(session_key)

            image_path = "PG.jpg"  # Set your image file name

            # Send the image to the client
            send_image(conn, session_key, image_path)

        except Exception as e:
            print(f"Error: {e}")
        finally:
            if username in usernames:
                del usernames[username]
            conn.close()
            print(f"Connection from {addr} closed")

if __name__ == "__main__":
    usernames = {}
    start_server()
