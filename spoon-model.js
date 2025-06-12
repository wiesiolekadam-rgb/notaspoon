const spoonModelData = {
  positions: [
    // --- HANDLE ---
    // Bottom back of handle (near the end)
    -0.08, -0.6, -0.04, // 0
     0.08, -0.6, -0.04, // 1
    -0.08, -0.6,  0.04, // 2
     0.08, -0.6,  0.04, // 3

    // Mid-section 1 of handle
    -0.07, -0.2, -0.035, // 4
     0.07, -0.2, -0.035, // 5
    -0.07, -0.2,  0.035, // 6
     0.07, -0.2,  0.035, // 7

    // Mid-section 2 of handle (tapering)
    -0.06,  0.2, -0.03, // 8
     0.06,  0.2, -0.03, // 9
    -0.06,  0.2,  0.03, // 10
     0.06,  0.2,  0.03, // 11

    // Top front of handle (connecting to spoon head)
    -0.05,  0.5, -0.025, // 12
     0.05,  0.5, -0.025, // 13
    -0.05,  0.5,  0.025, // 14
     0.05,  0.5,  0.025, // 15

    // --- SPOON HEAD (BOWL) ---
    // Transition from handle to bowl (slightly wider)
    -0.15,  0.55, -0.02, // 16 (Outer rim - back left)
     0.15,  0.55, -0.02, // 17 (Outer rim - back right)
    -0.15,  0.55,  0.05, // 18 (Bottom transition - back left)
     0.15,  0.55,  0.05, // 19 (Bottom transition - back right)

    // Outer rim of the spoon bowl
    -0.25,  0.7, -0.01, // 20 (Outer rim - mid left)
     0.25,  0.7, -0.01, // 21 (Outer rim - mid right)
    -0.2,   1.1, -0.01, // 22 (Outer rim - front left)
     0.2,   1.1, -0.01, // 23 (Outer rim - front right)
     0.0,   1.2, -0.01, // 24 (Outer rim - tip)

    // Inner part of the spoon bowl (concave)
    // Layer 1 (shallower part of the depression)
    -0.12,  0.6,   0.03, // 25 (Inner bottom - back left)
     0.12,  0.6,   0.03, // 26 (Inner bottom - back right)
    -0.20,  0.75,  0.04, // 27 (Inner bottom - mid left)
     0.20,  0.75,  0.04, // 28 (Inner bottom - mid right)
    -0.15,  1.05,  0.04, // 29 (Inner bottom - front left)
     0.15,  1.05,  0.04, // 30 (Inner bottom - front right)
     0.0,   1.15,  0.04, // 31 (Inner bottom - tip)

    // Layer 2 (deeper part of the depression)
    -0.10,  0.7,   0.06, // 32 (Deepest - mid left)
     0.10,  0.7,   0.06, // 33 (Deepest - mid right)
    -0.05,  1.0,   0.06, // 34 (Deepest - front center)
     0.0,   0.85,  0.07, // 35 (Center bottom of bowl)


    // Underside of the spoon bowl (convex)
    // Matches outer rim but slightly lower Z to give thickness
    -0.25,  0.7,  0.01,  // 36 (Underside outer rim - mid left)
     0.25,  0.7,  0.01,  // 37 (Underside outer rim - mid right)
    -0.2,   1.1,  0.01,  // 38 (Underside outer rim - front left)
     0.2,   1.1,  0.01,  // 39 (Underside outer rim - front right)
     0.0,   1.2,  0.01,  // 40 (Underside outer rim - tip)

    // Central part of the underside (more convex)
    -0.10,  0.7,   0.08, // 41 (Underside convex bulge - mid left)
     0.10,  0.7,   0.08, // 42 (Underside convex bulge - mid right)
    -0.05,  1.0,   0.08, // 43 (Underside convex bulge - front center)
     0.0,   0.85,  0.09, // 44 (Center bottom of Underside bowl)

  ],
  normals: [
    // --- HANDLE NORMALS ---
    // Bottom back of handle (vertices 0-3)
    // Assuming a relatively flat bottom and back surface initially
    0.0, -1.0,  0.0, // 0 (bottom)
    0.0, -1.0,  0.0, // 1 (bottom)
    0.0,  0.0,  1.0, // 2 (back)
    0.0,  0.0,  1.0, // 3 (back)

    // Mid-section 1 of handle (vertices 4-7)
    // Normals pointing outwards from the sides
    -1.0,  0.0,  0.0, // 4 (left)
     1.0,  0.0,  0.0, // 5 (right)
    -1.0,  0.0,  0.0, // 6 (left, back part of side)
     1.0,  0.0,  0.0, // 7 (right, back part of side)

    // Mid-section 2 of handle (vertices 8-11)
    // Normals pointing outwards, considering taper
    -0.8,  0.0, -0.6, // 8 (left, front face normal approximation)
     0.8,  0.0, -0.6, // 9 (right, front face normal approximation)
    -0.8,  0.0,  0.6, // 10 (left, back face normal approximation)
     0.8,  0.0,  0.6, // 11 (right, back face normal approximation)

    // Top front of handle (vertices 12-15)
    // Normals pointing outwards and slightly up/down for front/back faces
    0.0, 0.0, -1.0, // 12 (front face)
    0.0, 0.0, -1.0, // 13 (front face)
    0.0, 0.0,  1.0, // 14 (back face)
    0.0, 0.0,  1.0, // 15 (back face)

    // --- SPOON HEAD (BOWL) NORMALS ---
    // Transition from handle to bowl (vertices 16-19)
    // Outer rim transition
    -0.5, 0.5, -0.5, // 16 (Outer rim - back left) - pointing up and out
     0.5, 0.5, -0.5, // 17 (Outer rim - back right) - pointing up and out
    // Bottom transition
    -0.5, -0.5, 0.5, // 18 (Bottom transition - back left) - pointing down and out
     0.5, -0.5, 0.5, // 19 (Bottom transition - back right) - pointing down and out

    // Outer rim of the spoon bowl (vertices 20-24) - Generally pointing upwards and outwards
    -0.7, 0.7, 0.0,  // 20 (Outer rim - mid left)
     0.7, 0.7, 0.0,  // 21 (Outer rim - mid right)
    -0.5, 0.8, 0.0,  // 22 (Outer rim - front left)
     0.5, 0.8, 0.0,  // 23 (Outer rim - front right)
     0.0, 1.0, 0.0,  // 24 (Outer rim - tip) - pointing mostly up

    // Inner part of the spoon bowl (concave) (vertices 25-31) - Pointing "inward" towards Z+
    // These should be generally pointing "upwards" from the concave surface
    -0.3, 0.4, 0.8, // 25 (Inner bottom - back left)
     0.3, 0.4, 0.8, // 26 (Inner bottom - back right)
    -0.4, 0.5, 0.7, // 27 (Inner bottom - mid left)
     0.4, 0.5, 0.7, // 28 (Inner bottom - mid right)
    -0.3, 0.6, 0.7, // 29 (Inner bottom - front left)
     0.3, 0.6, 0.7, // 30 (Inner bottom - front right)
     0.0, 0.7, 0.7, // 31 (Inner bottom - tip)

    // Layer 2 (deeper part of the depression) (vertices 32-35) - Pointing more directly "up" (Z+)
     -0.2, 0.3, 0.9, // 32 (Deepest - mid left)
      0.2, 0.3, 0.9, // 33 (Deepest - mid right)
     -0.1, 0.4, 0.9, // 34 (Deepest - front center)
      0.0, 0.0, 1.0, // 35 (Center bottom of bowl) - pointing straight up

    // Underside of the spoon bowl (convex) (vertices 36-40) - Pointing "downwards" and outwards
    // Matched to outer rim but normals point more downwards
    -0.7, 0.7, -0.1,  // 36 (Underside outer rim - mid left)
     0.7, 0.7, -0.1,  // 37 (Underside outer rim - mid right)
    -0.5, 0.8, -0.1,  // 38 (Underside outer rim - front left)
     0.5, 0.8, -0.1,  // 39 (Underside outer rim - front right)
     0.0, 1.0, -0.1,  // 40 (Underside outer rim - tip)

    // Central part of the underside (vertices 41-44) - Pointing more directly "down" (Z-)
    -0.2, 0.3, -0.9, // 41 (Underside convex bulge - mid left)
     0.2, 0.3, -0.9, // 42 (Underside convex bulge - mid right)
    -0.1, 0.4, -0.9, // 43 (Underside convex bulge - front center)
     0.0, 0.0, -1.0, // 44 (Center bottom of Underside bowl) - pointing straight down
  ],
  indices: [
    // --- HANDLE ---
    // Segment 1: Bottom back (0,1,2,3) to Mid-section 1 (4,5,6,7)
    // Bottom face (connecting to nothing, or could be closed if it's the absolute end)
    0, 2, 3,   0, 3, 1, // Assuming 0,1,3,2 is a quad for the very end bottom face if needed.

    // Sides
    0, 4, 6,   0, 6, 2, // Left side
    1, 3, 7,   1, 7, 5, // Right side
    // Top (connecting to mid-section 1 bottom)
    2, 6, 7,   2, 7, 3, // Back-facing top of this segment
    // Front (connecting to mid-section 1 back)
    0, 1, 5,   0, 5, 4, // Front-facing bottom of this segment

    // Segment 2: Mid-section 1 (4,5,6,7) to Mid-section 2 (8,9,10,11)
    4, 8, 10,  4, 10, 6,  // Left side
    5, 7, 11,  5, 11, 9,  // Right side
    6, 10, 11, 6, 11, 7,  // Top side
    4, 5, 9,   4, 9, 8,   // Bottom side

    // Segment 3: Mid-section 2 (8,9,10,11) to Top front (12,13,14,15)
    8, 12, 14,  8, 14, 10, // Left side
    9, 11, 15,  9, 15, 13, // Right side
    10, 14, 15, 10, 15, 11,// Top side
    8,  9, 13,  8, 13, 12, // Bottom side

    // --- TRANSITION: Handle to Spoon Head ---
    // Connect top of handle (12,13,14,15) to transition rim (16,17) and bottom (18,19)
    // Top surface transition
    12, 16, 17,  12, 17, 13, // Connects front-bottom of handle to back of spoon rim
    // Underside transition
    14, 15, 19,  14, 19, 18, // Connects back-bottom of handle to back of spoon underside

    // Side walls of the transition
    12, 14, 18,  12, 18, 16, // Left wall of transition
    13, 17, 19,  13, 19, 15, // Right wall of transition

    // --- SPOON HEAD (BOWL) ---
    // Outer Rim Surface (top edge of the bowl)
    16, 20, 25,  16, 25, 18, // Back-left outer to inner connection (this creates a wall)
    17, 19, 26,  17, 26, 21, // Back-right outer to inner connection

    16, 20, 22,  16, 22, 24, // Part of the top flat rim (if any) - simplified
    17, 21, 23,  17, 23, 24,

    // Inner Bowl - Top Layer (connecting outer rim (20-24) to inner layer 1 (25-31))
    // This forms the first slope of the concave interior
    16, 25, 20, // Corrected: from transition to first inner ring
    20, 25, 27,  // Left side of bowl - upper part
    25, 32, 27,  // Left side of bowl - lower part (to deepest)
    27, 32, 35,  // Connecting to center bottom

    17, 21, 26, // Corrected: from transition to first inner ring
    21, 28, 26,  // Right side of bowl - upper part
    26, 33, 28,  // Right side of bowl - lower part (to deepest)
    28, 33, 35,  // Connecting to center bottom

    // Front part of the bowl - upper
    20, 27, 22,
    22, 27, 29,
    27, 29, 31, // Connecting towards tip (inner layer 1)

    21, 23, 28,
    23, 30, 28,
    28, 30, 31, // Connecting towards tip (inner layer 1)

    // Front tip (connecting outer rim to inner layer 1)
    22, 29, 24,
    24, 29, 31,
    23, 24, 31,
    23, 31, 30,

    // Inner Bowl - Deeper Layer (connecting inner layer 1 (25-31) to layer 2 (32-35))
    25, 35, 32, // Back-left to center
    26, 33, 35, // Back-right to center

    32, 34, 35, // Mid-left to front-center to absolute center
    33, 35, 34, // Mid-right to absolute center to front-center (winding might need check)

    27, 35, 34, // Mid-left (layer 1) to center and front-center (layer 2)
    28, 34, 35, // Mid-right (layer 1) to front-center and center (layer 2)

    29, 34, 31, // Front-left (layer 1) to front-center (layer 2) and tip (layer 1)
    30, 31, 34, // Front-right (layer 1) to tip (layer 1) and front-center (layer 2)


    // Underside of the Spoon Bowl (convex)
    // Connecting handle transition (18,19) to underside rim (36,37 similar to 20,21)
    18, 36, 41,  18, 41, 44, // Back-left underside
    19, 42, 37,  19, 44, 42, // Back-right underside

    // Connecting underside rim (36-40) to central underside bulge (41-44)
    36, 41, 38, // Left side
    38, 41, 43,
    41, 43, 44,

    37, 39, 42, // Right side
    39, 43, 42,
    42, 43, 44,

    38, 43, 40, // Front tip
    39, 40, 43,

    // Edge of the spoon head (connecting top rim with underside rim)
    // Back edge, near handle
    16, 18, 36,  16, 36, 20, // Left back edge
    17, 21, 37,  17, 37, 19, // Right back edge

    // Side edges
    20, 36, 38,  20, 38, 22, // Left edge
    21, 37, 23,  23, 37, 39, // Right edge

    // Front tip edge
    22, 38, 40,  22, 40, 24, // Left part of tip edge
    23, 39, 24,  24, 39, 40, // Right part of tip edge
  ]
};

export { spoonModelData };
