
/*
 * ImageUploader.jsx
 *
 * React component for uploading an image using
 * drag-and-drop or the computer's file picker.
 */

import { useRef, useState } from "react";
import "./ImageUploader.css";

const MAX_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
];

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function ImageUploader() {
  // Track the chosen file and its preview.
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");

  // Track drag-and-drop styling.
  const [dragOver, setDragOver] = useState(false);

  // Track API and upload states.
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // Reference to the hidden file input.
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);
  const xhrRef = useRef(null);

  // ---------------------------------------
  // SECTION 1: FILE SIZE FORMATTING
  // ---------------------------------------

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // ---------------------------------------
  // SECTION 2: FILE VALIDATION AND PREVIEW
  // ---------------------------------------

  const validateAndSetFile = (file) => {
    setError("");
    setResult(null);
    setProgress(0);

    if (!file) return;

    // Reject unsupported file types.
    if (!ALLOWED_TYPES.includes(file.type)) {
      setSelectedFile(null);
      setPreview("");
      setError(
        "Invalid file type. Only JPG, PNG, and GIF are allowed."
      );
      return;
    }

    // Reject images over the 5 MB limit.
    if (file.size > MAX_SIZE) {
      setSelectedFile(null);
      setPreview("");
      setError("File too large. Maximum size is 5 MB.");
      return;
    }

    // Read image as a Data URL to display its preview.
    const reader = new FileReader();

    reader.onload = () => {
      setSelectedFile(file);
      setPreview(reader.result);
    };

    reader.onerror = () => {
      setError("Could not read the selected image.");
      setSelectedFile(null);
      setPreview("");
    };

    reader.readAsDataURL(file);
  };

  // ---------------------------------------
  // SECTION 3: FILE PICKER
  // ---------------------------------------

  const handleFileChange = (event) => {
    const file = event.target.files[0];

    validateAndSetFile(file);

    // Allow selecting the same file again later.
    event.target.value = "";
  };

  // ---------------------------------------
  // SECTION 4: DRAG AND DROP
  // ---------------------------------------

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDragOver(true);
  };

  const handleDragEnter = (event) => {
    event.preventDefault();

    dragCounter.current += 1;
    setDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();

    dragCounter.current = Math.max(
      0,
      dragCounter.current - 1
    );

    if (dragCounter.current === 0) {
      setDragOver(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();

    dragCounter.current = 0;
    setDragOver(false);

    // Read the first dropped file.
    const droppedFile = event.dataTransfer.files[0];

    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  // ---------------------------------------
  // SECTION 5: UPLOAD IMAGE OVER HTTP
  // ---------------------------------------

  const handleUpload = () => {
    if (!selectedFile || uploading) return;

    setUploading(true);
    setProgress(0);
    setError("");
    setResult(null);

    // FormData automatically prepares multipart data.
    const formData = new FormData();
    formData.append("image", selectedFile);

    // XMLHttpRequest provides upload progress events.
    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.open("POST", `${API_BASE_URL}/api/upload`);

    // Track the amount of data sent to the server.
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentage = Math.round(
          (event.loaded / event.total) * 100
        );

        setProgress(percentage);
      }
    };

    // Process the API response.
    xhr.onload = () => {
      setUploading(false);
      xhrRef.current = null;

      let data;

      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        setError("Invalid response received from the server.");
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        setResult(data);
        setProgress(100);
      } else {
        setError(data.error || "Image upload failed.");
      }
    };

    // Network-related errors.
    xhr.onerror = () => {
      setUploading(false);
      xhrRef.current = null;

      setError(
        "Network error. Check that the backend is running."
      );
    };

    // Send the image to Express.
    xhr.send(formData);
  };

  // ---------------------------------------
  // SECTION 6: CLEAR CURRENT SELECTION
  // ---------------------------------------

  const handleClear = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }

    setSelectedFile(null);
    setPreview("");
    setProgress(0);
    setError("");
    setResult(null);
    setUploading(false);
  };

  // Prefer the uploaded original URL.
  const uploadedUrl = result?.file?.original || result?.file?.url;

  return (
    <section className="uploader-card">
      <header className="uploader-header">
        <div className="header-icon">↑</div>

        <h2>Upload your image</h2>

        <p>
          Choose an image or drag and drop it below.
        </p>
      </header>

      {/* Drag-and-drop upload area */}
      <div
        className={`drop-zone ${dragOver ? "drag-over" : ""}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!uploading) fileInputRef.current?.click();
        }}
        onKeyDown={(event) => {
          if (
            !uploading &&
            (event.key === "Enter" || event.key === " ")
          ) {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={uploading ? -1 : 0}
        aria-disabled={uploading}
      >
        <div className="drop-icon">☁</div>

        <h3>Drag and drop an image here</h3>

        <p>or click to browse</p>

        <span className="file-help">
          JPG, PNG or GIF · Maximum 5 MB
        </span>

        <input
          type="file"
          ref={fileInputRef}
          accept="image/jpeg,image/png,image/gif"
          onChange={handleFileChange}
          style={{ display: "none" }}
          disabled={uploading}
        />
      </div>

      {/* Image preview and selected file metadata */}
      {selectedFile && preview && (
        <div className="preview-section">
          <div className="section-heading">
            <h3>Selected image</h3>

            <button
              type="button"
              className="clear-button"
              onClick={handleClear}
            >
              Remove
            </button>
          </div>

          <img
            src={preview}
            alt="Preview of the selected file"
            className="image-preview"
          />

          <div className="file-details">
            <span className="file-name">
              {selectedFile.name}
            </span>

            <span>
              {formatFileSize(selectedFile.size)}
            </span>
          </div>
        </div>
      )}

      {/* Show validation or API errors */}
      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="progress-section">
          <div className="progress-label">
            <span>
              {progress === 100
                ? "Finishing storage upload..."
                : "Uploading image..."}
            </span>
            <span>{progress}%</span>
          </div>

          <div
            className="progress-track"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Submit selected image */}
      <button
        type="button"
        className="upload-button"
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
      >
        {uploading ? "Uploading..." : "Upload Image"}
      </button>

      {/* Successful upload response */}
      {result && uploadedUrl && (
        <div className="success-section">
          <h3>✓ Upload successful!</h3>

          <p>
            Your image has been uploaded to Supabase.
          </p>

          <img
            src={uploadedUrl}
            alt="Uploaded image"
            className="uploaded-image"
          />

          <div className="result-link">
            <strong>Public URL:</strong>

            <a
              href={uploadedUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {uploadedUrl}
            </a>
          </div>

          {/* Bonus: display resized image links */}
          {result.file.thumbnail && (
            <div className="resized-links">
              <h4>Resized versions</h4>

              <a
                href={result.file.thumbnail}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Thumbnail (150×150)
              </a>

              <a
                href={result.file.medium}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Medium Image (800×600 max)
              </a>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default ImageUploader;
