with open('src/app/my-document/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("fetch(/api/files/{draggedFile.id}", "fetch(`/api/files/${draggedFile.id}`")
content = content.replace("fetch(/api/files/{file.id}", "fetch(`/api/files/${file.id}`")
content = content.replace("fetch(/api/files/{fileId}", "fetch(`/api/files/${fileId}`")

with open('src/app/my-document/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Quotes fixed")
