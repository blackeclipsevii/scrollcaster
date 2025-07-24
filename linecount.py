import os
import sys

def count_lines_by_extension(directory, extension):
    total_lines = 0
    for root, dirs, files in os.walk(directory):
        # Skip node_modules folders
        dirs[:] = [d for d in dirs if d != "node_modules"]
        
        for file in files:
            if file.endswith(extension):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                        total_lines += len(lines)
                except Exception as e:
                    print(f"Could not read {file_path}: {e}")
    return total_lines

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python count_lines.py <directory_path> <file_extension>")
        sys.exit(1)

    directory_path = sys.argv[1]
    extension = sys.argv[2]
    
    if not extension.startswith("."):
        print("Error: File extension should start with a '.' (e.g. .js)")
        sys.exit(1)

    if not os.path.isdir(directory_path):
        print(f"Error: '{directory_path}' is not a valid directory.")
        sys.exit(1)

    total = count_lines_by_extension(directory_path, extension)
    print(f"📊 Total lines of code in '{extension}' files (excluding node_modules): {total}")