"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileIcon,
  FolderIcon,
  ImageIcon,
  FileText as DocumentIcon,
  Video as VideoIcon,
  Music as MusicIcon2,
  ClockIcon,
  PlusIcon,
  ArrowRightIcon,
  HomeIcon,
  SettingsIcon,
  UsersIcon,
  BarChart3Icon,
  BellIcon,
  SearchIcon,
} from "lucide-react";
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
}

interface RecentFile {
  id: string;
  name: string;
  type: "file" | "folder";
  mimeType?: string;
  size?: number;
  createdAt: string;
  category: string;
}

export default function Dashboard() {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get all files (this would come from an API in a real app)
  const allFiles = [...files];

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
    if (category === "folder")
      return allFiles.filter((file) => file.type === "folder");

    return allFiles.filter((file) => getFileCategory(file) === category);
  };

  const getFileIcon = (category: string) => {
    switch (category) {
      case "folder":
        return <FolderIcon className="w-8 h-8 text-blue-500" />;
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
        return <FileIcon className="w-8 h-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const categories = [
    {
      id: "folder",
      name: "Folders",
      icon: FolderIcon,
      color: "blue",
      count: getFilesByCategory("folder").length,
    },
    {
      id: "image",
      name: "Images",
      icon: ImageIcon,
      color: "green",
      count: getFilesByCategory("image").length,
    },
    {
      id: "pdf",
      name: "PDFs",
      icon: DocumentIcon,
      color: "red",
      count: getFilesByCategory("pdf").length,
    },
    {
      id: "document",
      name: "Documents",
      icon: DocumentIcon,
      color: "orange",
      count: getFilesByCategory("document").length,
    },
    {
      id: "video",
      name: "Videos",
      icon: VideoIcon,
      color: "purple",
      count: getFilesByCategory("video").length,
    },
    {
      id: "music",
      name: "Music",
      icon: MusicIcon2,
      color: "pink",
      count: getFilesByCategory("music").length,
    },
  ];

  const menuItems = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: HomeIcon,
      href: "/dashboard",
      active: true,
    },
    {
      id: "documents",
      name: "My Documents",
      icon: FileIcon,
      href: "/my-document",
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

  // Simulate loading data
  useEffect(() => {
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      // For demo purposes, we'll start with empty data
      // In a real app, this would fetch from an API
      setRecentFiles([]);
      setIsLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">
                CorrugatedBox Files - Document Management System
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <Button variant="ghost" size="sm">
                <BellIcon className="w-4 h-4" />
              </Button>
              <Link href="/my-document">
                <Button>
                  My Documents
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 mb-8 text-white">
          <h2 className="text-2xl font-bold mb-2">
            Welcome to CorrugatedBox Files!
          </h2>
          <p className="text-blue-100 mb-4">
            Your document management system is ready. Start by uploading your
            first files or creating folders to organize your documents.
          </p>
          <Link href="/my-document">
            <Button variant="secondary">
              Get Started
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Card
                key={category.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {category.name}
                  </CardTitle>
                  <Icon className={`h-4 w-4 text-${category.color}-500`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{category.count}</div>
                  <p className="text-xs text-muted-foreground">Total items</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* File Categories */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>File Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.map((category) => {
                    const files = getFilesByCategory(category.id);
                    const Icon = category.icon;

                    return (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`w-6 h-6 text-${category.color}-500`}
                          />
                          <div>
                            <h3 className="font-medium">{category.name}</h3>
                            <p className="text-sm text-gray-500">
                              {category.count} files
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">{category.count}</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Files */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClockIcon className="w-5 h-5" />
                  Recent Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    Loading recent files...
                  </div>
                ) : recentFiles.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="mb-4">
                      <FileIcon className="w-16 h-16 mx-auto text-gray-300" />
                    </div>
                    <p className="mb-4">No recent files yet</p>
                    <Link href="/my-document">
                      <Button size="sm">Upload Your First File</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentFiles.map((file) => {
                      const fileItem = allFiles.find((f) => f.id === file.id);
                      return (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          {getFileIcon(file.category)}
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
                          <span className="text-xs text-gray-500">
                            {new Date(file.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/my-document">
                <Button className="w-full" variant="outline">
                  <FileIcon className="w-4 h-4 mr-2" />
                  Browse All Files
                </Button>
              </Link>
              <Link href="/my-document">
                <Button className="w-full" variant="outline">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Upload New File
                </Button>
              </Link>
              <Link href="/my-document">
                <Button className="w-full" variant="outline">
                  <FolderIcon className="w-4 h-4 mr-2" />
                  Create Folder
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
