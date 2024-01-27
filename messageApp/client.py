import socket

def start_client():
    # Create a socket object
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    # Connect to the server
    client_socket.connect(('192.168.1.166', 5555))

    while True:
        print("Options:")
        print("1. Encode")
        print("2. Decode")
        print("3. Exit")

        choice = input("Enter your choice (1/2/3): ")

        if choice == '1':
            # Option to encode
            client_socket.send('encode'.encode())

            # Receive cypher and shuffle seed from the user
            cypher = input("Enter the cypher: ")
            client_socket.send(cypher.encode())

            shuffle_seed = input("Enter the shuffle seed: ")
            client_socket.send(shuffle_seed.encode())

            # Send the message to be encoded
            message = input("Enter the message to encode: ")
            client_socket.send(message.encode())

            # Receive and print the encoded message
            encoded_message = client_socket.recv(1024).decode()
            print(f"Encoded Message: {encoded_message}")
        elif choice == '2':
            # Option to decode
            client_socket.send('decode'.encode())

            # Receive cypher and shuffle seed from the user
            cypher = input("Enter the cypher: ")
            client_socket.send(cypher.encode())

            shuffle_seed = input("Enter the shuffle seed: ")
            client_socket.send(shuffle_seed.encode())

            # Send the encoded message to be decoded
            encoded_message = input("Enter the message to decode: ")
            client_socket.send(encoded_message.encode())

            # Receive and print the decoded message
            decoded_message = client_socket.recv(1024).decode()
            print(f"Decoded Message: {decoded_message}")
        elif choice == '3':
            # Option to exit
            break
        else:
            print("Invalid choice. Try again.")

    # Close the connection with the server
    client_socket.close()

if __name__ == "__main__":
    start_client()
