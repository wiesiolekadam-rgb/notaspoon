# notaspoon

## WebGL Environmental Notes

This application uses WebGL for 3D rendering. While the JavaScript and shader code is standard, WebGL's successful execution can be sensitive to the environment it runs in:

- **GPU Access:** Direct GPU access is generally required for hardware-accelerated WebGL. Some virtualized or sandboxed environments (including certain automated testing setups or headless browsers) may have limited or no direct GPU access.
- **Software Fallback:** While some browsers offer a software rendering fallback (like SwiftShader), this may also face limitations or require specific browser flags (e.g., `--enable-unsafe-swiftshader` in Chromium-based browsers).
- **`CreateCommandBuffer` Errors:** If you encounter errors like `Failed to send GpuControl.CreateCommandBuffer` or similar low-level graphics initialization errors in the browser console, it likely indicates an issue with the WebGL setup in that specific environment, rather than an error in the application's JavaScript code itself. The application logic may run correctly (as indicated by console logs), but no visuals will be produced.

If the spoon and grid do not render but you see console logs from `app.js` (especially the 'Success condition met' message), it's likely due to such an environmental constraint. The `glMatrix` library has been embedded in `index.html` to improve reliability across environments where fetching from CDNs might be restricted.

## Running Locally

To run this WebGL application, you need to serve the files through a local HTTP server. This is because modern browsers have security restrictions that prevent loading JavaScript modules (like `app.js`) and other assets directly from the local file system (`file:///...`).

1.  **Start a simple HTTP server:**
    Open your terminal or command prompt, navigate to the root directory of this project, and run the following command (if you have Python installed):
    ```bash
    python -m http.server 8000
    ```
    If port 8000 is in use, you can choose another port (e.g., 8080).

2.  **Open in your browser:**
    Once the server is running, open your web browser and navigate to:
    ```
    http://localhost:8000
    ```
    (If you used a different port, replace `8000` with that port number).

    You should see the spoon and grid rendered in your browser.

## Roadmap

Here's a suggested roadmap for the next 5 iterations of the "notaspoon" project:

1.  **Iteration 1: Refactor for Clarity and Modularity** - Done ✓
    *   Break down `app.js` into smaller, more focused modules (e.g., for WebGL setup, shader management, object creation, rendering loop).
    *   This will improve code readability, maintainability, and make it easier to implement future features.

2.  **Iteration 2: Enhance Spoon Model & Appearance - Done ✓**
    *   Increase the detail of the 3D spoon model (e.g., more vertices, refined shape for a more realistic look).
    *   Improve its appearance through shader enhancements (e.g., more sophisticated material properties like specular highlights).

3.  **Iteration 3: Introduce User Interaction**
    *   Implement basic camera controls (e.g., zoom with mouse wheel, orbit/pan with mouse drag).
    *   Alternatively, allow manual rotation of the spoon object using mouse input.

4.  **Iteration 4: Advanced Lighting & Basic Environment Mapping**
    *   Improve the lighting model: explore adding multiple light sources, different types of lights (point, directional, spot), or shadows if feasible.
    *   Implement basic environment mapping using a cubemap to allow the spoon to reflect a simple surrounding environment, enhancing realism.

5.  **Iteration 5: Expand the Scene**
    *   Add more objects to the WebGL scene alongside the spoon. These could be other simple geometric primitives or duplicates of the spoon.
    *   Alternatively, explore loading a simple 3D model in a common format (e.g., OBJ - though this might be a stretch goal depending on complexity).