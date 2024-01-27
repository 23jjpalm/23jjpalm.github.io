import socket

def start_client():
    # Create a socket object
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    # Connect to the server
    client_socket.connect(('192.168.1.166', 5555))

    while True:
        print("Options:")
        print("1. Encode")
        print("2. Exit")

        choice = input("Enter your choice (1/2): ")

        if choice == '1':
            # Option to encode
            client_socket.send('encode'.encode())

            # Receive the encoded message and cypher and shuffle seed
            encoded_data = client_socket.recv(1024).decode()
            print(encoded_data)
        elif choice == '2':
            # Option to exit
            break
        else:
            print("Invalid choice. Try again.")

    # Close the connection with the server
    client_socket.close()

if __name__ == "__main__":
    start_client()
