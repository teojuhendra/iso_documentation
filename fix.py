import re

with open('src/app/my-document/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix broken syntax from previous regex
content = content.replace("description: ${'$'}{file.name} has been uploaded,", "description: `${file.name} has been uploaded`,")
content = content.replace("description: Failed to upload {file.name},", "description: `Failed to upload ${file.name}`,")

# Fix API URLs
content = content.replace("fetch(`/api/files/${'$'}{draggedFile.id}`", "fetch(`/api/files/${draggedFile.id}`")
content = content.replace("fetch(`/api/files/${'$'}{file.id}`", "fetch(`/api/files/${file.id}`")
content = content.replace("fetch(`/api/files/${'$'}{fileId}`", "fetch(`/api/files/${fileId}`")

with open('src/app/my-document/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Template strings fixed")
