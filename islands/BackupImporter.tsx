import { useState } from "preact/hooks";

const CHUNK_SIZE = 50 * 1024; // 50KB chunks
const API_BASE = "/api/admin/backup";

interface ImportResult {
  success: boolean;
  message: string;
  entriesImported?: number;
  entriesSkipped?: number;
  errors?: string[];
}

export default function BackupImporter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Preparing upload...");
  const [result, setResult] = useState<
    {
      data: ImportResult;
      type: "success" | "warning" | "error";
    } | null
  >(null);
  const [dryRun, setDryRun] = useState(false);
  const [skipExisting, setSkipExisting] = useState(true);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setResult(null);
    setProgress(0);

    const sessionId = generateSessionId();
    const totalChunks = Math.ceil(selectedFile.size / CHUNK_SIZE);

    try {
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, selectedFile.size);
        const chunk = selectedFile.slice(start, end);
        const chunkText = await chunk.text();

        setProgress(Math.round((i / totalChunks) * 100));
        setStatusMessage("Uploading chunks...");

        const response = await fetch(API_BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            chunkIndex: i,
            totalChunks,
            data: chunkText,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Chunk upload failed");
        }
      }

      setProgress(100);
      setStatusMessage("Processing import...");

      const completeUrl =
        `${API_BASE}?action=complete&sessionId=${sessionId}&dryRun=${dryRun}&skipExisting=${skipExisting}`;
      const completeResponse = await fetch(completeUrl, { method: "POST" });
      const resultData = await completeResponse.json();

      if (completeResponse.ok || completeResponse.status === 207) {
        setResult({
          data: resultData,
          type: completeResponse.status === 207 ? "warning" : "success",
        });
      } else {
        throw new Error(resultData.message || "Import failed");
      }
    } catch (error) {
      setResult({
        data: {
          success: false,
          message: error instanceof Error ? error.message : "Unknown error",
          errors: [String(error)],
        },
        type: "error",
      });

      try {
        await fetch(`${API_BASE}?sessionId=${sessionId}`, { method: "DELETE" });
      } catch {
        console.error("Cleanup failed");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const generateSessionId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const fileSizeMB = selectedFile
    ? (selectedFile.size / (1024 * 1024)).toFixed(2)
    : "0";
  const chunkCount = selectedFile
    ? Math.ceil(selectedFile.size / CHUNK_SIZE)
    : 0;

  const alertClass = result?.type ? `alert-${result?.type}` : "alert-error";

  return (
    <div class="card bg-base-100 shadow-xl w-full max-w-xl">
      <div class="card-body">
        <h2 class="card-title text-2xl mb-2">Backup Importer</h2>
        <p class="text-base-content/70 mb-6">
          Upload large backup files by splitting them into manageable chunks
        </p>

        {/* File Input - using label for native click behavior */}
        <label
          for="backup-file-input"
          class={`border-2 border-dashed rounded-box p-8 text-center cursor-pointer transition-all hover:border-primary hover:bg-base-200 block ${
            isDragOver ? "border-primary bg-base-200" : "border-base-300"
          }`}
          onDragOver={(e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(true);
          }}
          onDragLeave={(e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
          }}
          onDrop={(e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
            const files = e.dataTransfer?.files;
            if (files && files.length > 0) {
              handleFileSelect(files[0]);
            }
          }}
        >
          <div class="text-5xl mb-3">📁</div>
          <p class="font-semibold">
            Click to select{" "}
            <span class="font-normal">or drag and drop your backup file</span>
          </p>
          <p class="text-sm text-base-content/50 mt-2">Supports .jsonl files</p>
        </label>
        <input
          id="backup-file-input"
          type="file"
          accept=".jsonl,.json"
          class="hidden"
          onChange={(e: Event) => {
            const input = e.target as HTMLInputElement;
            const files = input.files;
            if (files && files.length > 0) {
              handleFileSelect(files[0]);
            }
          }}
        />

        {selectedFile && (
          <div class="bg-base-200 rounded-box p-4 mt-4">
            <p>
              <span class="font-semibold">File:</span> {selectedFile.name}
            </p>
            <p>
              <span class="font-semibold">Size:</span> {fileSizeMB} MB
            </p>
            <p>
              <span class="font-semibold">Chunks:</span> {chunkCount}
            </p>
          </div>
        )}

        <div class="form-control mt-4">
          <label class="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              class="checkbox checkbox-primary"
              checked={dryRun}
              onChange={(e: Event) =>
                setDryRun((e.target as HTMLInputElement).checked)}
            />
            <span class="label-text">Dry run (test without importing)</span>
          </label>
          <label class="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              class="checkbox checkbox-primary"
              checked={skipExisting}
              onChange={(e: Event) =>
                setSkipExisting((e.target as HTMLInputElement).checked)}
            />
            <span class="label-text">Skip existing entries</span>
          </label>
        </div>

        <button
          type="button"
          class={`btn btn-primary w-full mt-4 ${isUploading ? "loading" : ""}`}
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
        >
          {!selectedFile
            ? "Select a file to upload"
            : isUploading
            ? "Uploading..."
            : "Start Upload"}
        </button>

        {isUploading && (
          <div class="mt-4">
            <progress
              class="progress progress-primary w-full"
              value={progress}
              max="100"
            >
            </progress>
            <p class="text-center text-sm text-base-content/70 mt-2">
              {statusMessage} ({progress}%)
            </p>
          </div>
        )}

        {result && (
          <div class={`alert ${alertClass} mt-4`}>
            <div class="w-full">
              <p class="font-semibold">{result.data.message}</p>
              {result.data.entriesImported !== undefined && (
                <p>Entries imported: {result.data.entriesImported}</p>
              )}
              {result.data.entriesSkipped !== undefined &&
                result.data.entriesSkipped > 0 && (
                <p>Entries skipped: {result.data.entriesSkipped}</p>
              )}
              {result.data.errors && result.data.errors.length > 0 && (
                <div class="mt-2 max-h-40 overflow-y-auto text-sm">
                  <p class="font-semibold">
                    Errors ({result.data.errors.length}):
                  </p>
                  {result.data.errors.slice(0, 10).map((error, i) => (
                    <p key={i}>• {error}</p>
                  ))}
                  {result.data.errors.length > 10 && (
                    <p>... and {result.data.errors.length - 10} more</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
