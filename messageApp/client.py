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

            # Receive the encoded message and cypher and shuffle seed
            encoded_data = client_socket.recv(1024).decode()
            print(encoded_data)
        elif choice == '2':
            # Option to decode
            client_socket.send('decode'.encode())

            # Input cypher seed, shuffle seed, and encoded message
            cypher_seed = int(input("Enter cypher seed: "))
            shuffle_seed = int(input("Enter shuffle seed: "))
            encoded_message = input("Enter the encoded message: ")

            # Send cypher seed, shuffle seed, and encoded message to the server
            client_socket.send(str(cypher_seed).encode())
            client_socket.send(str(shuffle_seed).encode())
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
