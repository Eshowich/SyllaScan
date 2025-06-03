"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { FileText, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FileUploaderProps {
  onFilesUploaded: (files: File[]) => void
}

export function FileUploader({ onFilesUploaded }: FileUploaderProps) {
  const [files, setFiles] = useState<File[]>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
  })

  const handleUpload = () => {
    if (files.length > 0) {
      onFilesUploaded(files)
    }
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer ${
          isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/20"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2">
          <Upload className="h-10 w-10 text-muted-foreground" />
          <h3 className="font-medium">Drag & drop files here</h3>
          <p className="text-sm text-muted-foreground">or click to browse files</p>
          <p className="text-xs text-muted-foreground mt-2">Supports PDF, DOC, DOCX, and TXT files</p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">Selected Files</h3>
            <ul className="space-y-2">
              {files.map((file, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{file.name}</span>
                  <span className="text-xs text-muted-foreground">({Math.round(file.size / 1024)} KB)</span>
                </li>
              ))}
            </ul>
          </div>
          <Button onClick={handleUpload} className="w-full">
            Upload and Process Files
          </Button>
        </div>
      )}
    </div>
  )
}
