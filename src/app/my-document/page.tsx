"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileIcon,
  FolderIcon,
  FolderOpenIcon,
  UploadIcon,
  TrashIcon,
  EyeIcon,
  GridIcon,
  ListIcon,
  MoreVerticalIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  Image as ImageIcon,
  FileText as DocumentIcon,
  Video as VideoIcon,
  Music as MusicIcon2,
  File as DefaultFileIcon,
  PlusIcon,
  UndoIcon,
  XIcon,
  HomeIcon,
  SettingsIcon,
  UsersIcon,
  BarChart3Icon,
  BellIcon,
  SearchIcon,
  EditIcon,
  DownloadIcon,
  MaximizeIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

interface FileItem {
  id: string;
  name: string;
  type: "file" | "folder";
  mimeType?: string;
  size?: number;
  path?: string;
  content?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  children?: FileItem[];
  originalParentId?: string;
  fileData?: string; // Base64 encoded file data for preview
}

interface UploadProgress {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "completed" | "error";
}

interface FileAction {
  id: string;
  type: "move" | "delete" | "rename";
  fileId: string;
  fromParentId?: string;
  toParentId?: string;
  oldName?: string;
  newName?: string;
  timestamp: number;
}

interface RecentFile {
  id: string;
  name: string;
  type: "file" | "folder";
  mimeType?: string;
  size?: number;
  createdAt: string;
  category: string;
  fileData?: string;
}

export default function MyDocument() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [fileActions, setFileActions] = useState<FileAction[]>([]);
  const [draggedFile, setDraggedFile] = useState<FileItem | null>(null);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fetch files from database on mount
  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch('/api/files');
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const allFiles = [...files];

  const getCurrentFiles = useCallback(() => {
    let currentFiles: FileItem[] = [];

    if (currentPath.length === 0) {
      currentFiles = allFiles.filter((file) => !file.parentId);
    } else {
      let currentFolder = allFiles.find(
        (file) => file.id === currentPath[currentPath.length - 1]
      );
      if (!currentFolder) return [];

      currentFiles = allFiles.filter(
        (file) => file.parentId === currentFolder.id
      );
    }

    // Apply search filter
    if (searchTerm) {
      currentFiles = currentFiles.filter((file) =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      if (selectedCategory === "folder") {
        currentFiles = currentFiles.filter((file) => file.type === "folder");
      } else {
        currentFiles = currentFiles.filter((file) => {
          if (file.type === "folder") return false;
          if (!file.mimeType) return false;

          switch (selectedCategory) {
            case "image":
              return file.mimeType.startsWith("image/");
            case "pdf":
              return file.mimeType === "application/pdf";
            case "document":
              return (
                file.mimeType.includes("document") ||
                file.mimeType.includes("text") ||
                file.mimeType.includes("sheet") ||
                file.mimeType.includes("presentation")
              );
            case "video":
              return file.mimeType.startsWith("video/");
            case "music":
              return file.mimeType.startsWith("audio/");
            default:
              return true;
          }
        });
      }
    }

    return currentFiles;
  }, [currentPath, allFiles, searchTerm, selectedCategory]);

  const getFileCategory = (file: FileItem) => {
    if (file.type === "folder") return "folder";

    if (!file.mimeType) return "other";

    if (file.mimeType.startsWith("image/")) return "image";
    if (file.mimeType === "application/pdf") return "pdf";
    if (
      file.mimeType.includes("document") ||
      file.mimeType.includes("text") ||
      file.mimeType.includes("sheet") ||
      file.mimeType.includes("presentation")
    )
      return "document";
    if (file.mimeType.startsWith("video/")) return "video";
    if (file.mimeType.startsWith("audio/")) return "music";

    return "other";
  };

  const getFilesByCategory = (category: string) => {
    if (category === "all")
      return allFiles.filter((file) => file.type === "file");
    if (category === "folder")
      return allFiles.filter((file) => file.type === "folder");

    return allFiles.filter((file) => getFileCategory(file) === category);
  };

  const getFileIcon = (file: FileItem) => {
    if (file.type === "folder") {
      return <FolderIcon className="w-8 h-8 text-blue-500" />;
    }

    const category = getFileCategory(file);

    switch (category) {
      case "image":
        return <ImageIcon className="w-8 h-8 text-green-500" />;
      case "pdf":
        return <DocumentIcon className="w-8 h-8 text-red-500" />;
      case "document":
        return <DocumentIcon className="w-8 h-8 text-orange-500" />;
      case "video":
        return <VideoIcon className="w-8 h-8 text-purple-500" />;
      case "music":
        return <MusicIcon2 className="w-8 h-8 text-pink-500" />;
      default:
        return <DefaultFileIcon className="w-8 h-8 text-gray-500" />;
    }
  };

  const getFileTypeLabel = (file: FileItem) => {
    if (file.type === "folder") {
      const childrenCount = allFiles.filter(
        (f) => f.parentId === file.id
      ).length;
      return `${childrenCount} items`;
    }

    if (!file.size) return "Unknown";

    const sizeInKB = file.size / 1024;
    const sizeInMB = sizeInKB / 1024;

    if (sizeInMB >= 1) {
      return `${sizeInMB.toFixed(1)} MB`;
    }

    return `${sizeInKB.toFixed(0)} KB`;
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (
    acceptedFiles: File[],
    targetFolderId?: string
  ) => {
    const currentFolderId =
      currentPath.length > 0
        ? currentPath[currentPath.length - 1]
        : targetFolderId;

    for (const file of acceptedFiles) {
      const uploadId = Math.random().toString(36).substr(2, 9);

      setUploadProgress((prev) => [
        ...prev,
        { id: uploadId, name: file.name, progress: 0, status: "uploading" },
      ]);

      try {
        const fileData = await readFileAsBase64(file);

        setUploadProgress((prev) =>
          prev.map((item) =>
            item.id === uploadId ? { ...item, progress: 50 } : item
          )
        );

        const formData = new FormData();
        formData.append("file", file);
        if (currentFolderId) {
          formData.append("parentId", currentFolderId);
        }

        const res = await fetch("/api/files", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");

        const savedFile = await res.json();

        setFiles((prev) => [...prev, { ...savedFile, fileData }]);

        setRecentFiles((prev) => [
          {
            id: savedFile.id,
            name: savedFile.name,
            type: savedFile.type,
            mimeType: savedFile.mimeType,
            size: savedFile.size,
            fileData,
            createdAt: savedFile.createdAt,
            category: getFileCategory(savedFile),
          },
          ...prev.slice(0, 9),
        ]);

        setUploadProgress((prev) =>
          prev.map((item) =>
            item.id === uploadId
              ? { ...item, progress: 100, status: "completed" }
              : item
          )
        );

        setTimeout(() => {
          setUploadProgress((prev) =>
            prev.filter((item) => item.id !== uploadId)
          );
        }, 2000);

        toast({
          title: "File uploaded successfully",
          description: `${file.name} has been uploaded`,
        });
      } catch (error) {
        setUploadProgress((prev) =>
          prev.map((item) =>
            item.id === uploadId
              ? { ...item, progress: 100, status: "error" }
              : item
          )
        );
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        });
      }
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setIsDragging(false);
      setDragOverFolder(null);

      if (acceptedFiles.length > 0) {
        // Show confirmation dialog
        if (
          confirm(
            `Are you sure you want to upload ${acceptedFiles.length} file(s)?`
          )
        ) {
          handleFileUpload(acceptedFiles);
        }
      }
    },
    [currentPath]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
  });

  const handleFolderClick = (folder: FileItem) => {
    if (folder.type === "folder") {
      setCurrentPath((prev) => [...prev, folder.id]);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    setCurrentPath((prev) => prev.slice(0, index + 1));
  };

  const handleDragStart = (e: React.DragEvent, file: FileItem) => {
    if (file.type === "file") {
      setDraggedFile(file);
      e.dataTransfer.setData("text/plain", file.id);
      e.dataTransfer.effectAllowed = "move";
    }
  };

  const handleDragOver = (e: React.DragEvent, folderId?: string) => {
    e.preventDefault();
    if (folderId && draggedFile) {
      setDragOverFolder(folderId);
    }
  };

  const handleDragLeave = () => {
    setDragOverFolder(null);
  };

  const handleDropOnFolder = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    setDragOverFolder(null);

    if (draggedFile && draggedFile.type === "file") {
      // Store original parent for undo
      const originalParentId = draggedFile.parentId;

      // Move file to folder via API
      fetch(`/api/files/${draggedFile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId: folderId }),
      });

      setFiles((prev) =>
        prev.map((f) =>
          f.id === draggedFile.id
            ? { ...f, parentId: folderId, originalParentId }
            : f
        )
      );

      // Add to action history for undo
      setFileActions((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substr(2, 9),
          type: "move",
          fileId: draggedFile.id,
          fromParentId: originalParentId,
          toParentId: folderId,
          timestamp: Date.now(),
        },
      ]);

      toast({
        title: "File moved successfully",
        description: `${draggedFile.name} moved to folder`,
      });

      setDraggedFile(null);
    }
  };

  const handleDelete = (file: FileItem) => {
    if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
      // Store action for undo
      setFileActions((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substr(2, 9),
          type: "delete",
          fileId: file.id,
          timestamp: Date.now(),
        },
      ]);

      // Remove from database
      fetch(`/api/files/${file.id}`, { method: "DELETE" });

      // Remove from files array
      setFiles((prev) => prev.filter((f) => f.id !== file.id));

      toast({
        title: "File deleted",
        description: `${file.name} has been deleted`,
      });
    }
  };

  const handlePreview = (file: FileItem) => {
    setPreviewFile(file);
  };

  const handleMoveOutOfFolder = (file: FileItem) => {
    // Store original parent for undo
    const originalParentId = file.parentId;

    // Update in database
    fetch(`/api/files/${file.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentId: null }),
    });

    setFiles((prev) =>
      prev.map((f) =>
        f.id === file.id ? { ...f, parentId: undefined, originalParentId } : f
      )
    );

    // Add to action history for undo
    setFileActions((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        type: "move",
        fileId: file.id,
        fromParentId: originalParentId,
        toParentId: undefined,
        timestamp: Date.now(),
      },
    ]);

    toast({
      title: "File moved",
      description: `${file.name} moved out of folder`,
    });
  };

  const handleRename = (file: FileItem, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering preview dialog
    setRenamingFile(file.id);
    setNewName(file.name);
  };

  const handleRenameSubmit = (fileId: string) => {
    if (!newName.trim()) return;

    const file = allFiles.find((f) => f.id === fileId);
    if (!file) return;

    const oldName = file.name;

    // Update file name in database
    fetch(`/api/files/${fileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });

    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, name: newName.trim() } : f))
    );

    // Add to action history for undo
    setFileActions((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        type: "rename",
        fileId: fileId,
        oldName,
        newName: newName.trim(),
        timestamp: Date.now(),
      },
    ]);

    toast({
      title: "File renamed",
      description: `"${oldName}" renamed to "${newName.trim()}"`,
    });

    setRenamingFile(null);
    setNewName("");
  };

  const handleDownload = (file: FileItem) => {
    // Create a download link
    const link = document.createElement("a");

    // If we have file data, create a blob
    if (file.fileData) {
      const blob = fetch(file.fileData)
        .then((res) => res.blob())
        .then((blob) => {
          link.href = URL.createObjectURL(blob);
          link.download = file.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
        });
    } else {
      // For demo purposes, create a text file with some content
      const content = `This is a demo file: ${file.name}\n\nIn a real application, this would download the actual file content.`;
      const blob = new Blob([content], { type: file.mimeType || "text/plain" });
      link.href = URL.createObjectURL(blob);
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }

    toast({
      title: "Download started",
      description: `${file.name} is being downloaded`,
    });
  };

  const handleOpenInNewTab = (file: FileItem) => {
    if (file.fileData) {
      // Open file data in new tab
      const newWindow = window.open();
      if (newWindow) {
        if (file.mimeType?.startsWith("image/")) {
          newWindow.document.write(`
            <html>
              <head><title>${file.name}</title></head>
              <body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f0f0f0;">
                <img src="${file.fileData}" style="max-width:100%; max-height:100%; object-fit:contain;" />
              </body>
            </html>
          `);
        } else if (file.mimeType === "application/pdf") {
          newWindow.document.write(`
            <html>
              <head><title>${file.name}</title></head>
              <body style="margin:0;">
                <embed src="${file.fileData}" type="application/pdf" width="100%" height="100%" />
              </body>
            </html>
          `);
        } else {
          // For other file types, show download prompt
          newWindow.document.write(`
            <html>
              <head><title>${file.name}</title></head>
              <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h1>${file.name}</h1>
                <p>File type: ${file.mimeType}</p>
                <p>Size: ${
                  file.size ? formatFileSize(file.size) : "Unknown"
                }</p>
                <button onclick="window.close()" style="padding: 10px 20px; background: #007cba; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
              </body>
            </html>
          `);
        }
      }
    } else {
      toast({
        title: "Cannot open file",
        description: "File data not available for preview",
        variant: "destructive",
      });
    }
  };

  const handleUndo = () => {
    const lastAction = fileActions[fileActions.length - 1];
    if (!lastAction) return;

    if (lastAction.type === "move") {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === lastAction.fileId
            ? { ...f, parentId: lastAction.fromParentId }
            : f
        )
      );

      toast({
        title: "Move undone",
        description: "File moved back to original location",
      });
    } else if (lastAction.type === "rename") {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === lastAction.fileId ? { ...f, name: lastAction.oldName || f.name } : f
        )
      );

      toast({
        title: "Rename undone",
        description: `File name restored to "${lastAction.oldName}"`,
      });
    } else if (lastAction.type === "delete") {
      // Restore deleted file (this is simplified - in real app you'd need to store the file data)
      toast({
        title: "Undo not available",
        description: "Cannot undo delete operation",
      });
    }

    // Remove the action from history
    setFileActions((prev) => prev.slice(0, -1));
  };

  const handleCreateFolder = async () => {
    const folderName = prompt("Enter folder name:");
    if (folderName) {
      try {
        const parentId =
          currentPath.length > 0
            ? currentPath[currentPath.length - 1]
            : null;

        const res = await fetch("/api/folders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: folderName, parentId }),
        });

        if (!res.ok) throw new Error("Failed to create folder");

        const savedFolder = await res.json();
        setFiles((prev) => [...prev, savedFolder]);
        toast({
          title: "Folder created",
          description: `${folderName} has been created`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create folder",
          variant: "destructive",
        });
      }
    }
  };

  const getCurrentFolderName = () => {
    if (currentPath.length === 0) return "Direktori Utama";

    const folderId = currentPath[currentPath.length - 1];
    const folder = allFiles.find((f) => f.id === folderId);
    return folder?.name || "Unknown";
  };

  const currentFiles = getCurrentFiles();

  const categories = [
    {
      id: "all",
      name: "All Files",
      icon: FileIcon,
      count: allFiles.filter((f) => f.type === "file").length,
    },
    {
      id: "folder",
      name: "Folders",
      icon: FolderIcon,
      count: allFiles.filter((f) => f.type === "folder").length,
    },
    {
      id: "image",
      name: "Images",
      icon: ImageIcon,
      count: getFilesByCategory("image").length,
    },
    {
      id: "pdf",
      name: "PDFs",
      icon: DocumentIcon,
      count: getFilesByCategory("pdf").length,
    },
    {
      id: "document",
      name: "Documents",
      icon: DocumentIcon,
      count: getFilesByCategory("document").length,
    },
    {
      id: "video",
      name: "Videos",
      icon: VideoIcon,
      count: getFilesByCategory("video").length,
    },
    {
      id: "music",
      name: "Music",
      icon: MusicIcon2,
      count: getFilesByCategory("music").length,
    },
    {
      id: "other",
      name: "Other",
      icon: DefaultFileIcon,
      count: getFilesByCategory("other").length,
    },
  ];

  const menuItems = [
    { id: "dashboard", name: "Dashboard", icon: HomeIcon, href: "/dashboard" },
    {
      id: "documents",
      name: "My Documents",
      icon: FileIcon,
      href: "/my-document",
      active: true,
    },
    { id: "shared", name: "Shared", icon: UsersIcon, href: "/shared" },
    {
      id: "analytics",
      name: "Analytics",
      icon: BarChart3Icon,
      href: "/analytics",
    },
    { id: "settings", name: "Settings", icon: SettingsIcon, href: "/settings" },
  ];

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Left Sidebar - Hidden on mobile */}
      <div
        className={`hidden md:block bg-white shadow-lg z-40 transition-all duration-300 ${
          isLeftSidebarOpen ? "w-64" : "w-16"
        }`}
      >
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            {isLeftSidebarOpen && (
              <h2 className="text-lg font-semibold">Menu</h2>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
            >
              {isLeftSidebarOpen ? (
                <XIcon className="w-4 h-4" />
              ) : (
                <ArrowRightIcon className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  item.active
                    ? "bg-blue-100 text-blue-700"
                    : "hover:bg-gray-100"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isLeftSidebarOpen && (
                  <span className="font-medium">{item.name}</span>
                )}
              </Link>
            );
          })}
        </div>

        {isLeftSidebarOpen && (
          <>
            <div className="p-4 border-t">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">
                CATEGORIES
              </h3>
              <div className="space-y-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        selectedCategory === category.id
                          ? "bg-blue-100 text-blue-700"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <div className="font-medium">{category.name}</div>
                        <div className="text-xs text-gray-500">
                          {category.count} items
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-4 md:px-6 py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  My Documents
                </h1>
                <p className="text-gray-600 text-sm md:text-base">
                  CorrugatedBox Files - Document Management System
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Search Bar */}
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-48 md:w-64"
                  />
                </div>
                <Button variant="ghost" size="sm" className="hidden md:flex">
                  <BellIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                >
                  <ArrowRightIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden bg-white border-b">
          <div className="px-4 py-2">
            <div className="flex gap-2 overflow-x-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap ${
                      item.active
                        ? "bg-blue-100 text-blue-700"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Categories */}
        <div className="md:hidden bg-white border-b">
          <div className="px-4 py-2">
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap ${
                      selectedCategory === category.id
                        ? "bg-blue-100 text-blue-700"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <Icon className="w-4 h-4" />
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="p-4 md:p-6">
            <div className="max-w-none">
              {/* Breadcrumb */}
              <Breadcrumb className="mb-4 md:mb-6">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      href="#"
                      onClick={() => handleBreadcrumbClick(-1)}
                      className="cursor-pointer"
                    >
                      Direktori Utama
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {currentPath.map((pathId, index) => {
                    const folder = allFiles.find((f) => f.id === pathId);
                    return (
                      <div key={pathId} className="flex items-center">
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          {index === currentPath.length - 1 ? (
                            <BreadcrumbPage className="text-sm md:text-base">
                              {folder?.name}
                            </BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink
                              href="#"
                              onClick={() => handleBreadcrumbClick(index)}
                              className="cursor-pointer text-sm md:text-base"
                            >
                              {folder?.name}
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                      </div>
                    );
                  })}
                </BreadcrumbList>
              </Breadcrumb>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 md:mb-6">
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <ListIcon className="w-4 h-4 mr-2" />
                    List
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <GridIcon className="w-4 h-4 mr-2" />
                    Grid
                  </Button>
                  {fileActions.length > 0 && (
                    <Button variant="outline" size="sm" onClick={handleUndo}>
                      <UndoIcon className="w-4 h-4 mr-2" />
                      Undo
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadIcon className="w-4 h-4 mr-2" />
                    Browse Files
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateFolder}
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    New Folder
                  </Button>
                </div>
              </div>

              {/* Upload Progress */}
              {uploadProgress.length > 0 && (
                <div className="mb-4 md:mb-6 space-y-2">
                  {uploadProgress.map((upload) => (
                    <div key={upload.id} className="flex items-center gap-4">
                      <span className="text-sm font-medium truncate flex-1">
                        {upload.name}
                      </span>
                      <Progress
                        value={upload.progress}
                        className="flex-1 min-w-0"
                      />
                      <span className="text-sm text-gray-500 whitespace-nowrap">
                        {upload.progress}%
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Drop Zone */}
              <div
                {...getRootProps()}
                className={`mb-4 md:mb-6 border-2 border-dashed rounded-lg p-4 md:p-8 text-center transition-colors ${
                  isDragActive || isDragging
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={() => setIsDragging(true)}
                onDragLeave={() => setIsDragging(false)}
              >
                <input {...getInputProps()} />
                <UploadIcon className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-4 text-gray-400" />
                <p className="text-base md:text-lg font-medium text-gray-700 mb-2">
                  Drag and drop your files or browse your files
                </p>
                <p className="text-sm text-gray-500">
                  Files will be uploaded to {getCurrentFolderName()}
                </p>
              </div>

              {/* File List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">
                    {selectedCategory === "all"
                      ? `Files in ${getCurrentFolderName()}`
                      : selectedCategory === "folder"
                      ? "All Folders"
                      : `${
                          categories.find((c) => c.id === selectedCategory)
                            ?.name
                        } Files`}
                    {searchTerm && ` (Search: "${searchTerm}")`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentFiles.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {searchTerm
                        ? "No files found matching your search."
                        : selectedCategory === "all"
                        ? "No files or folders found. Upload some files to get started!"
                        : `No ${categories
                            .find((c) => c.id === selectedCategory)
                            ?.name.toLowerCase()} found.`}
                    </div>
                  ) : (
                    <div
                      className={
                        viewMode === "grid"
                          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                          : "space-y-2"
                      }
                    >
                      {currentFiles.map((file) => (
                        <div
                          key={file.id}
                          className={`p-3 md:p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${
                            dragOverFolder === file.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200"
                          }`}
                          onClick={(e) => {
                            if (renamingFile !== file.id) {
                              if (file.type === "folder") {
                                handleFolderClick(file);
                              } else {
                                handlePreview(file);
                              }
                            }
                          }}
                          draggable={file.type === "file"}
                          onDragStart={(e) => handleDragStart(e, file)}
                          onDragOver={(e) =>
                            file.type === "folder" && handleDragOver(e, file.id)
                          }
                          onDragLeave={handleDragLeave}
                          onDrop={(e) =>
                            file.type === "folder" &&
                            handleDropOnFolder(e, file.id)
                          }
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {getFileIcon(file)}
                              <div className="flex-1 min-w-0">
                                {renamingFile === file.id ? (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      value={newName}
                                      onChange={(e) =>
                                        setNewName(e.target.value)
                                      }
                                      onBlur={() => handleRenameSubmit(file.id)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter")
                                          handleRenameSubmit(file.id);
                                        if (e.key === "Escape") {
                                          setRenamingFile(null);
                                          setNewName("");
                                        }
                                      }}
                                      className="h-8 text-sm"
                                      autoFocus
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                ) : (
                                  <>
                                    <h3 className="font-medium text-gray-900 truncate text-sm md:text-base">
                                      {file.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {file.type === "folder"
                                          ? "Folder"
                                          : getFileCategory(file)}
                                      </Badge>
                                      <span className="text-xs text-gray-500">
                                        {getFileTypeLabel(file)}
                                      </span>
                                      {file.size && (
                                        <span className="text-xs text-gray-500">
                                          • {formatFileSize(file.size)}
                                        </span>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVerticalIcon className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePreview(file);
                                  }}
                                >
                                  <EyeIcon className="w-4 h-4 mr-2" />
                                  Preview
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => handleRename(file, e)}
                                >
                                  <EditIcon className="w-4 h-4 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(file);
                                  }}
                                >
                                  <DownloadIcon className="w-4 h-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                                {file.mimeType &&
                                  (file.mimeType.startsWith("image/") ||
                                    file.mimeType === "application/pdf" ||
                                    file.mimeType.includes("document") ||
                                    file.mimeType.includes("text")) && (
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenInNewTab(file);
                                      }}
                                    >
                                      <ExternalLinkIcon className="w-4 h-4 mr-2" />
                                      Open in New Tab
                                    </DropdownMenuItem>
                                  )}
                                {file.parentId && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveOutOfFolder(file);
                                    }}
                                  >
                                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                                    Move out of folder
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(file);
                                  }}
                                  className="text-red-600"
                                >
                                  <TrashIcon className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Recent Files */}
      {isRightSidebarOpen && (
        <div className="w-64 md:w-80 bg-white shadow-lg border-l hidden lg:block">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Files</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsRightSidebarOpen(false)}
              >
                <XIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="p-4">
            {recentFiles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No recent files
              </div>
            ) : (
              <div className="space-y-3">
                {recentFiles.map((file) => {
                  const fileItem = allFiles.find((f) => f.id === file.id);
                  return (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => fileItem && handlePreview(fileItem)}
                    >
                      {fileItem ? (
                        getFileIcon(fileItem)
                      ) : (
                        <FileIcon className="w-8 h-8 text-gray-500" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">
                          {file.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {file.category}
                          </Badge>
                          {file.size && (
                            <span className="text-xs text-gray-500">
                              {formatFileSize(file.size)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={!!previewFile}
        onOpenChange={() => {
          setPreviewFile(null);
          setIsFullscreen(false);
        }}
      >
        <DialogContent
          className={`max-w-4xl w-11/12 max-h-[90vh] overflow-auto ${
            isFullscreen
              ? "fixed inset-0 max-w-full max-h-full m-0 rounded-none"
              : ""
          }`}
        >
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-lg">{previewFile?.name}</DialogTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                <MaximizeIcon className="w-4 h-4" />
              </Button>
              {previewFile?.mimeType &&
                (previewFile.mimeType.startsWith("image/") ||
                  previewFile.mimeType === "application/pdf" ||
                  previewFile.mimeType.includes("document") ||
                  previewFile.mimeType.includes("text")) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      previewFile && handleOpenInNewTab(previewFile)
                    }
                  >
                    <ExternalLinkIcon className="w-4 h-4" />
                  </Button>
                )}
            </div>
          </DialogHeader>
          <div className="mt-4">
            {previewFile?.mimeType?.startsWith("image/") ? (
              <div className="text-center">
                <img
                  src={
                    previewFile.fileData ||
                    "https://via.placeholder.com/400x300?text=Image+Not+Available"
                  }
                  alt={previewFile.name}
                  className={`max-w-full ${
                    isFullscreen ? "max-h-[calc(100vh-200px)]" : "max-h-96"
                  } mx-auto rounded-lg shadow-lg object-contain`}
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/400x300?text=Image+Not+Available";
                  }}
                />
              </div>
            ) : previewFile?.mimeType?.includes("pdf") ? (
              <div className="text-center py-8">
                <DocumentIcon className="w-16 h-16 mx-auto mb-4 text-red-500" />
                <p className="text-gray-600">PDF Document</p>
                <p className="text-sm text-gray-500 mt-2">
                  File size:{" "}
                  {previewFile.size
                    ? formatFileSize(previewFile.size)
                    : "Unknown"}
                </p>
                <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-600">
                    PDF preview requires a PDF viewer. In a production
                    environment, this would show the actual PDF content.
                  </p>
                </div>
              </div>
            ) : previewFile?.mimeType?.includes("text") ? (
              <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm">
                  {previewFile.content ||
                    "This is a sample text file content. In a real application, this would show the actual file content."}
                </pre>
              </div>
            ) : previewFile?.mimeType?.startsWith("video/") ? (
              <div className="text-center py-8">
                <VideoIcon className="w-16 h-16 mx-auto mb-4 text-purple-500" />
                <p className="text-gray-600">Video File</p>
                <p className="text-sm text-gray-500 mt-2">
                  Duration: Not available • Size:{" "}
                  {previewFile.size
                    ? formatFileSize(previewFile.size)
                    : "Unknown"}
                </p>
                <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Video preview requires a video player. In a production
                    environment, this would show the actual video content.
                  </p>
                </div>
              </div>
            ) : previewFile?.mimeType?.startsWith("audio/") ? (
              <div className="text-center py-8">
                <MusicIcon2 className="w-16 h-16 mx-auto mb-4 text-pink-500" />
                <p className="text-gray-600">Audio File</p>
                <p className="text-sm text-gray-500 mt-2">
                  Duration: Not available • Size:{" "}
                  {previewFile.size
                    ? formatFileSize(previewFile.size)
                    : "Unknown"}
                </p>
                <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Audio preview requires an audio player. In a production
                    environment, this would show an audio player with playback
                    controls.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <DefaultFileIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-600">File Preview</p>
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-500">
                    Type: {previewFile?.mimeType || "Unknown"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Size:{" "}
                    {previewFile?.size
                      ? formatFileSize(previewFile.size)
                      : "Unknown"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Category:{" "}
                    {previewFile ? getFileCategory(previewFile) : "Unknown"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Created:{" "}
                    {previewFile?.createdAt
                      ? new Date(previewFile.createdAt).toLocaleDateString()
                      : "Unknown"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            handleFileUpload(Array.from(e.target.files));
          }
        }}
      />
    </div>
  );
}
