import { useRef, useState } from "preact/hooks";

const CHUNK_SIZE = 50 * 1024; // 50KB chunks
const API_BASE = "/api/admin/backup";

interface ImportResult {
  success: boolean;
  message: string;
  entriesImported?: number;
  entriesSkipped?: number;
  errors?: string[];
}

export default function BackupImporterIsland() {
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setResult(null);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setResult(null);
    setProgress(0);

    const sessionId = generateSessionId();
    const totalChunks = Math.ceil(selectedFile.size / CHUNK_SIZE);

    try {
      // Upload chunks
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

      // Complete the import
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

      // Attempt cleanup
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

  return (
    <div class="backup-container">
      <h1>Backup Importer</h1>
      <p class="subtitle">
        Upload large backup files by splitting them into manageable chunks
      </p>

      <div
        class={`upload-area ${isDragOver ? "drag-over" : ""}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <div class="icon">📁</div>
        <p>
          <strong>Click to select</strong> or drag and drop your backup file
        </p>
        <p class="hint">Supports .jsonl files</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".jsonl,.json"
          onChange={(e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files && files.length > 0) {
              handleFileSelect(files[0]);
            }
          }}
        />
      </div>

      {selectedFile && (
        <div class="file-info">
          <p>
            <strong>File:</strong> {selectedFile.name}
          </p>
          <p>
            <strong>Size:</strong> {fileSizeMB} MB
          </p>
          <p>
            <strong>Chunks:</strong> {chunkCount}
          </p>
        </div>
      )}

      <div class="options">
        <div class="checkbox-group">
          <input
            type="checkbox"
            id="dryRun"
            checked={dryRun}
            onChange={(e) => setDryRun((e.target as HTMLInputElement).checked)}
          />
          <label for="dryRun">Dry run (test without importing)</label>
        </div>
        <div class="checkbox-group">
          <input
            type="checkbox"
            id="skipExisting"
            checked={skipExisting}
            onChange={(e) =>
              setSkipExisting((e.target as HTMLInputElement).checked)}
          />
          <label for="skipExisting">Skip existing entries</label>
        </div>
      </div>

      <button
        type="button"
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
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" style={{ width: `${progress}%` }}>
              {progress}%
            </div>
          </div>
          <div class="status">{statusMessage}</div>
        </div>
      )}

      {result && (
        <div class={`result ${result.type}`}>
          <p>
            <strong>{result.data.message}</strong>
          </p>
          {result.data.entriesImported !== undefined && (
            <p>Entries imported: {result.data.entriesImported}</p>
          )}
          {result.data.entriesSkipped !== undefined &&
            result.data.entriesSkipped > 0 && (
            <p>Entries skipped: {result.data.entriesSkipped}</p>
          )}
          {result.data.errors && result.data.errors.length > 0 && (
            <div class="error-list">
              <p>
                <strong>Errors ({result.data.errors.length}):</strong>
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
      )}
    </div>
  );
}
