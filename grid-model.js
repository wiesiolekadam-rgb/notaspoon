function createGridVertices() {
  const lines = [];
  const range = 5; // Grid will extend from -range to +range
  const step = 0.5; // Spacing between lines

  for (let i = -range; i <= range; i += step) {
    // Lines along Z axis
    lines.push(-range, 0, i); // x1, y1, z1
    lines.push(range, 0, i);  // x2, y2, z2
    // Lines along X axis
    lines.push(i, 0, -range); // x1, y1, z1
    lines.push(i, 0, range);  // x2, y2, z2
  }

  return {
    lines: lines,
    vertexCount: lines.length / 3, // 3 components per vertex (x,y,z)
  };
}

export { createGridVertices };
