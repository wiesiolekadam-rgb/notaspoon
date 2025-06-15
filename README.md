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

## Ideas for Dramatic Animation

Here are some ideas to make the scene more entertaining and dramatic through the movement of the spoon and monster figures:

1.  **The Chase:** The monster actively chases the spoon around the grid. The spoon could have a slight speed advantage, creating a sense of urgency.
2.  **Hide and Seek:** The monster periodically hides behind the grid or moves off-screen, then lunges out towards the spoon, which has to dodge.
3.  **Spoon Taunts Monster:** The spoon performs a quick, playful animation (e.g., a little spin or wiggle) when the monster is at a distance, then quickly darts away when the monster approaches.
4.  **Monster's Frustration:** If the monster fails to "catch" the spoon after a certain number of attempts, it performs a frustration animation (e.g., stomping its foot, shaking its head).
5.  **Dynamic Grid Interaction:** Parts of the grid could react to the characters' movements. For example, grid cells ripple or temporarily change color when the spoon or monster moves over them.
6.  **The "Almost Gotcha":** The monster lunges and narrowly misses the spoon, which does a quick evasive maneuver (e.g., a barrel roll or a sharp turn). This could be accompanied by a dramatic camera zoom-in and slow-motion effect for a split second.
7.  **Spoon's Special Move:** The spoon could have a rare "special move" it can activate, perhaps after being chased for a while, where it performs a dazzling acrobatic maneuver that temporarily stuns or confuses the monster.

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