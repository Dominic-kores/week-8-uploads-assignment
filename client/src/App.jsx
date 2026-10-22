
// App.jsx
// Main React component for the image upload application.

import ImageUploader from "./components/ImageUploader";
import "./App.css";

function App() {
  return (
    <div className="app-container">
      {/* Application heading */}
      <header className="app-header">
        <h1>Image Upload Platform</h1>

        <p>
          Secure image uploads using React, Express,
          Multer and Supabase Storage.
        </p>
      </header>

      {/* Main image upload component */}
      <main>
        <ImageUploader />
      </main>

      {/* Application footer */}
      <footer className="app-footer">
        <p>
          Week 8 · Day 1 | File Uploads over HTTP
        </p>
      </footer>
    </div>
  );
}

export default App;
