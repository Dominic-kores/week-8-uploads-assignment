
/*
 * Week 8 - Day 1: File Uploads over HTTP
 *
 * Backend responsibilities:
 * 1. Accept a single image through POST /api/upload.
 * 2. Validate its file type and size using Multer.
 * 3. Store the image buffer in Supabase Storage.
 * 4. Generate and return a public image URL.
 * 5. Optionally generate resized versions using Sharp.
 */

require("dotenv").config();

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const sharp = require("sharp");
const { randomUUID } = require("crypto");
const { createClient } = require("@supabase/supabase-js");

// ----------------------------------------
// SECTION 1: INITIAL SERVER CONFIGURATION
// ----------------------------------------

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
}));

app.use(express.json());

// Verify that required environment variables exist.
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  throw new Error("Missing Supabase environment variables");
}

// Connect to Supabase using private backend credentials.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const BUCKET = "uploads";
const MAX_SIZE = 5 * 1024 * 1024;

// Set to false if you only want to complete Tasks 1-3.
const ENABLE_RESIZING = true;

// ----------------------------------------
// SECTION 2: FILE VALIDATION WITH MULTER
// ----------------------------------------

// Allowed image MIME types.
const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
];

// Store uploaded files in memory, not on disk.
const storage = multer.memoryStorage();

// Validate the MIME type supplied by the upload.
const fileFilter = (req, file, callback) => {
  if (allowedTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new Error(
        "Invalid file type. Only JPG, PNG, and GIF are allowed."
      )
    );
  }
};

// Configure Multer.
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_SIZE,
    files: 1,
  },
});

// ----------------------------------------
// SECTION 3: HELPER FUNCTIONS
// ----------------------------------------

// Generate a unique ID to prevent filename collisions.
function generateUniqueId() {
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}-${randomUUID()}`;
}

// Use a safe base filename for storage paths.
function safeBaseName(originalName) {
  return originalName
    .split(/[\\/]/)
    .pop()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .slice(0, 60) || "image";
}

// Validate the actual image contents with Sharp.
// MIME checks alone cannot prove that a file is an image.
async function validateImageBuffer(file) {
  const metadata = await sharp(file.buffer, {
    animated: false,
  }).metadata();

  const expectedFormats = {
    "image/jpeg": "jpeg",
    "image/png": "png",
    "image/gif": "gif",
  };

  if (metadata.format !== expectedFormats[file.mimetype]) {
    throw new Error(
      "Invalid file type. Only JPG, PNG, and GIF are allowed."
    );
  }

  return metadata;
}

// Upload a buffer to the Supabase uploads bucket.
async function uploadToStorage(path, buffer, contentType) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType,
      upsert: false,
    });

  if (error) {
    console.error("Supabase upload error:", error.message);
    throw new Error("Failed to upload file to storage");
  }

  // Get a publicly accessible URL.
  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

// ----------------------------------------
// SECTION 4: HEALTH CHECK
// ----------------------------------------

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Image Upload API is running",
  });
});

// ----------------------------------------
// SECTION 5: POST /api/upload
// ----------------------------------------

app.post("/api/upload", upload.single("image"), async (req, res) => {
  // Respond when no image is included.
  if (!req.file) {
    return res.status(400).json({
      error: "No file uploaded",
    });
  }

  const file = req.file;

  try {
    // Inspect actual file content, not just its MIME type.
    await validateImageBuffer(file);
  } catch (error) {
    return res.status(400).json({
      error: "Invalid file type. Only JPG, PNG, and GIF are allowed.",
    });
  }

  const uniqueId = generateUniqueId();
  const originalName = safeBaseName(file.originalname);

  // Use the validated image type to choose its extension.
  const extensions = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
  };

  const extension = extensions[file.mimetype];
  const originalPath =
    `original-${uniqueId}-${originalName}.${extension}`;

  // TASK 1 + 2: Upload only the original file.
  if (!ENABLE_RESIZING) {
    try {
      const url = await uploadToStorage(
        originalPath,
        file.buffer,
        file.mimetype
      );

      return res.status(200).json({
        message: "File uploaded successfully",
        file: {
          originalName: file.originalname,
          url,
          size: file.size,
          mimetype: file.mimetype,
        },
      });
    } catch (error) {
      return res.status(500).json({
        error: "Failed to upload file to storage",
      });
    }
  }

  // --------------------------------------
  // OPTIONAL BONUS: IMAGE RESIZING
  // --------------------------------------

  try {
    // Thumbnail: exactly 150x150, JPEG quality 70%.
    const thumbnailBuffer = await sharp(file.buffer, {
      animated: false,
    })
      .rotate()
      .resize(150, 150, {
        fit: "cover",
        position: "centre",
      })
      .jpeg({ quality: 70 })
      .toBuffer();

    // Medium: fit within 800x600, no enlargement.
    const mediumBuffer = await sharp(file.buffer, {
      animated: false,
    })
      .rotate()
      .resize(800, 600, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    const thumbnailPath =
      `thumb-${uniqueId}-${originalName}.jpg`;

    const mediumPath =
      `medium-${uniqueId}-${originalName}.jpg`;

    // Upload each file and retrieve its public URL.
    const originalUrl = await uploadToStorage(
      originalPath,
      file.buffer,
      file.mimetype
    );

    const thumbnailUrl = await uploadToStorage(
      thumbnailPath,
      thumbnailBuffer,
      "image/jpeg"
    );

    const mediumUrl = await uploadToStorage(
      mediumPath,
      mediumBuffer,
      "image/jpeg"
    );

    return res.status(200).json({
      message: "File uploaded with resized versions",
      file: {
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        url: originalUrl,
        original: originalUrl,
        thumbnail: thumbnailUrl,
        medium: mediumUrl,
      },
    });
  } catch (error) {
    console.error("Image upload failed:", error.message);

    return res.status(500).json({
      error: "Failed to upload file to storage",
    });
  }
});

// ----------------------------------------
// SECTION 6: GLOBAL ERROR HANDLING
// ----------------------------------------

app.use((error, req, res, next) => {
  // Handle Multer-specific errors.
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "File too large. Maximum size is 5 MB.",
      });
    }

    return res.status(400).json({
      error: error.code === "LIMIT_UNEXPECTED_FILE"
        ? "Unexpected file field. Use 'image'."
        : "File upload error",
    });
  }

  // Return the required error for unsupported types.
  if (
    error.message ===
    "Invalid file type. Only JPG, PNG, and GIF are allowed."
  ) {
    return res.status(400).json({
      error: error.message,
    });
  }

  // Log unexpected errors without leaking details.
  console.error("Server error:", error);

  res.status(500).json({
    error: "Internal server error",
  });
});

// ----------------------------------------
// SECTION 7: START THE EXPRESS SERVER
// ----------------------------------------

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
