import sys
import time

def print_rainbow_text(text):
    colors = [
        "\033[91m",  # Red
        "\033[93m",  # Yellow
        "\033[92m",  # Green
        "\033[96m",  # Cyan
        "\033[94m",  # Blue
        "\033[95m"   # Magenta
    ]

    for char, color in zip(text, colors):
        sys.stdout.write(color + char)
        sys.stdout.flush()
        time.sleep(0.1)  # Adjust the sleep duration to control the speed

    # Reset color to default at the end
    sys.stdout.write("\033[0m")
    sys.stdout.flush()

if __name__ == "__main__":
    rainbow_text = "Rainbow Text!"
    print_rainbow_text(rainbow_text)
