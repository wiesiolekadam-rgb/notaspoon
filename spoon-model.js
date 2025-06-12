const spoonModelData = {
  positions: [
    // Handle - 8 vertices
    -0.1, -0.5, -0.05, // 0
     0.1, -0.5, -0.05, // 1
     0.1,  0.5, -0.05, // 2
    -0.1,  0.5, -0.05, // 3
    -0.1, -0.5,  0.05, // 4
     0.1, -0.5,  0.05, // 5
     0.1,  0.5,  0.05, // 6
    -0.1,  0.5,  0.05, // 7

    // Head (simplified) - let's make it wider and flatter
    // Top surface of the spoon head (approximate)
    -0.3,  0.5, -0.02, // 8
     0.3,  0.5, -0.02, // 9
     0.3,  1.0, -0.02, // 10
    -0.3,  1.0, -0.02, // 11

    // Bottom surface of the spoon head
    -0.3,  0.5,  0.02, // 12
     0.3,  0.5,  0.02, // 13
     0.3,  1.0,  0.02, // 14
    -0.3,  1.0,  0.02, // 15
  ],
  normals: [
    // Handle normals (pointing outwards)
    // Front face
    0.0,  0.0, -1.0,
    0.0,  0.0, -1.0,
    0.0,  0.0, -1.0,
    0.0,  0.0, -1.0,
    // Back face
    0.0,  0.0,  1.0,
    0.0,  0.0,  1.0,
    0.0,  0.0,  1.0,
    0.0,  0.0,  1.0,
    // Top face
    0.0,  1.0,  0.0,
    0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,
    0.0,  1.0,  0.0,
    // Bottom face
    0.0, -1.0,  0.0,
    0.0, -1.0,  0.0,
    0.0, -1.0,  0.0,
    0.0, -1.0,  0.0,
    // Right face
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
    // Left face
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,

    // Spoon head normals (simplified - could be more nuanced)
    // Top surface (pointing up)
    0.0, 0.0, -1.0,
    0.0, 0.0, -1.0,
    0.0, 0.0, -1.0,
    0.0, 0.0, -1.0,
    // Bottom surface (pointing down)
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,
  ],
  indices: [
    // Handle
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    7,  6,  2,      7,  2,  3,    // top
    4,  5,  1,      4,  1,  0,    // bottom
    1,  5,  6,      1,  6,  2,    // right
    4,  0,  3,      4,  3,  7,    // left
    // Spoon Head - Top
    8, 9, 10,     8, 10, 11,
    // Spoon Head - Bottom
    12, 13, 14,   12, 14, 15,
    // Connecting sides for spoon head (simplified)
    8, 12, 13,     8, 13, 9,    // front edge
    11, 15, 14,    11, 14, 10,   // back edge
    9, 13, 14,     9, 14, 10,   // right edge
    8, 12, 15,     8, 15, 11,   // left edge
  ]
};

export { spoonModelData };
