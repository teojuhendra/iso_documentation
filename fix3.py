with open('src/app/my-document/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("let currentFiles = [];", "let currentFiles: FileItem[] = [];")
content = content.replace("f.id === lastAction.fileId ? { ...f, name: lastAction.oldName } : f", "f.id === lastAction.fileId ? { ...f, name: lastAction.oldName || f.name } : f")

with open('src/app/my-document/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("TypeScript errors fixed")
