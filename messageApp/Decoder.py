import socket
import threading
import random

def reverse_shuffle_string(s):
    # Reverse the shuffling operation to reconstruct the original string
    original_list = list(s)
    random.shuffle(original_list)
    return ''.join(original_list)

def caesar_decipher(encoded_text, shift):
    result = ""
    for char in encoded_text:
        if char.isalpha():
            shifted_char = chr((ord(char) - shift - ord('A' if char.isupper() else 'a') + 26) % 26 + ord('A' if char.isupper() else 'a'))
            result += shifted_char
        else:
            result += char

    return result

def handle_server_response(client_socket, access_code):
    while True:
        # Receive and decode messages from the server
        response = client_socket.recv(1024)
        decoded_response = reverse_shuffle_string(response.decode())

        # Check if the access code is correct
        if decoded_response.startswith(access_code):
            shift = int(decoded_response[len(access_code):])
            original_message = caesar_decipher(decoded_response[len(access_code):], shift)
            print(f"Decoded Server response: {original_message}")
        else:
            print("Incorrect access code. Message ignored.")

def start_decoder(access_code):
    # Create a socket object
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    # Connect to the server
    client_socket.connect(('192.168.1.166', 5555))

    # Start a thread to handle server responses
    response_thread = threading.Thread(target=handle_server_response, args=(client_socket, access_code))
    response_thread.start()

    try:
        response_thread.join()  # Wait for the response thread to finish
    finally:
        # Close the connection with the server
        client_socket.close()

if __name__ == "__main__":
    access_code = input("Enter the access code: ")
    start_decoder(access_code)
