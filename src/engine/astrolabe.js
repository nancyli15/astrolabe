// Where each node sits on the astrolabe's circle. Pure maths, no screen code.
// Positions are percentages of the dial, so they work at any size.

// #region nodePositions
export function computeNodePositions(count, radius = 38, center = 50) {
  const positions = [];
  // Divide the full circle (2π radians) into equal slices, one per node.
  const slice = (2 * Math.PI) / count;
  // Screen y grows downward, so -90° (-π/2) is the top of the circle.
  const startAngle = -Math.PI / 2;

  for (let index = 0; index < count; index++) {
    const angle = startAngle + index * slice;
    // cos gives the sideways share of the radius, sin gives the up-down share.
    positions.push({
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    });
  }
  return positions;
}
// #endregion
