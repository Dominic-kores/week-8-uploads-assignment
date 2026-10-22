
# Image Upload Platform

## Week 8 - Day 1: File Uploads over HTTP

A full-stack image uploading application built with React,
Node.js, Express, Multer, Supabase Storage and Sharp.

The application demonstrates how to upload files over HTTP,
validate images, store files in cloud storage and display
uploaded images using public URLs.

## Project Overview

The Image Upload Platform enables users to select or
drag and drop an image, preview the file and upload
it to a backend server.

The backend validates file types and sizes using Multer
before storing the image in Supabase Storage.

The optional Sharp feature automatically generates
thumbnail and medium-sized images.

##  Project Objectives

- Understand HTTP multipart/form-data requests.
- Build an Express file upload endpoint.
- Process image uploads using Multer.
- Validate file type and size on the server.
- Upload image buffers to Supabase Storage.
- Generate unique filenames and public URLs.
- Build a React drag-and-drop upload component.
- Display image previews and upload progress.
- Handle invalid uploads and server errors.
- Generate resized images using Sharp.

##  Technologies Used

| Technology | Purpose |
|------------|---------|
| React | Frontend interface |
| Vite | React development and build tool |
| Node.js | Backend runtime |
| Express | REST API |
| Multer | File upload middleware |
| Supabase Storage | Cloud image storage |
| Sharp | Image resizing |
| CORS | Cross-origin communication |
| Dotenv | Environment variable management |
| CSS | Responsive frontend styling |

##  Main Features

### Backend
- POST /api/upload
- Multer memory storage
- Single image upload
- Supported types: JPG, PNG and GIF
- Maximum file size: 5 MB
- HTTP 400 validation errors
- HTTP 500 storage error handling
- Unique storage filenames
- Supabase integration

### Frontend
- Drag-and-drop image selection
- File picker support
- Image preview before upload
- File name and formatted size
- Client-side validation
- Upload progress feedback
- Error and success messages
- Uploaded image preview
- Public URL display
- Responsive layout


##  Project Structure

week-8-day-1-assignment/
├── server/
│   ├── server.js
│   ├── .env.example
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ImageUploader.jsx
│   │   │   └── ImageUploader.css
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   └── package.json
├── .gitignore
└── README.md


## API Documentation

### Endpoint

POST /api/upload

### Request Format

Content-Type: multipart/form-data

Field name: image

### Valid Upload Response

HTTP 200

```json
{
  "message": "File uploaded successfully",
  "file": {
    "originalName": "photo.jpg",
    "url": "PUBLIC_IMAGE_URL",
    "size": 245678,
    "mimetype": "image/jpeg"
  }
}
```

This is the response when bonus resizing is disabled.

### Error Responses

| Condition | HTTP Status |
|-----------|-------------|
| No image uploaded | 400 |
| Unsupported file type | 400 |
| File larger than 5 MB | 400 |
| Failed cloud storage upload | 500 |

## Testing

Test the application using cURL or Thunder Client.

Recommended tests:

1. Upload a valid JPG image.
2. Upload a valid PNG image.
3. Upload a valid GIF image.
4. Upload a PDF to verify file rejection.
5. Upload an image exceeding 5 MB.
6. Submit without attaching a file.
7. Test drag-and-drop file selection.
8. Confirm the public image URL works.
9. Verify resized images in Supabase.
10. Confirm errors are displayed clearly.



##  Learning Outcomes

Through this project, I gained practical understanding
of how images are transferred from a frontend application
to a backend server using HTTP.

I learned to configure Multer memory storage, validate
file uploads, process file buffers, integrate Supabase
Storage, and build an interactive React uploader.

The bonus challenge also provided experience in
resizing and optimizing images before cloud storage.







##  Author

**Dominic Kores Kisioya**

Full-Stack Software & AI Engineer

