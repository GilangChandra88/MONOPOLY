export function getGridCoordinate(id: number, size: number = 2.2): { x: number, z: number, rotation: number } {
  // Grid is 11x11. Origin (0,0) is center.
  // x goes from -5 (left) to 5 (right)
  // z goes from -5 (top/far) to 5 (bottom/near)
  // Corners: 0 (bottom-right: x=5, z=5), 10 (bottom-left: x=-5, z=5), 20 (top-left: x=-5, z=-5), 30 (top-right: x=5, z=-5)
  
  if (id >= 0 && id <= 10) {
    // Bottom row (z = 5), x moves from 5 to -5
    return { x: (5 - id) * size, z: 5 * size, rotation: 0 };
  } else if (id > 10 && id <= 20) {
    // Left column (x = -5), z moves from 5 to -5. Center is at +x, so -z (strip) should point to +x. Rotation = -Math.PI / 2
    return { x: -5 * size, z: (5 - (id - 10)) * size, rotation: -Math.PI / 2 };
  } else if (id > 20 && id <= 30) {
    // Top row (z = -5), x moves from -5 to 5. Center is at +z. Rotation = Math.PI
    return { x: (-5 + (id - 20)) * size, z: -5 * size, rotation: Math.PI };
  } else if (id > 30 && id <= 39) {
    // Right column (x = 5), z moves from -5 to 5. Center is at -x. Rotation = Math.PI / 2
    return { x: 5 * size, z: (-5 + (id - 30)) * size, rotation: Math.PI / 2 };
  }
  return { x: 0, z: 0, rotation: 0 };
}

export function getInterpolatedCoordinate(pos: number, size: number = 2.2): { x: number, z: number, rotation: number } {
  const index1 = Math.floor(pos) % 40;
  const index2 = (index1 + 1) % 40;
  const t = pos - Math.floor(pos);

  const c1 = getGridCoordinate(index1, size);
  const c2 = getGridCoordinate(index2, size);

  return {
    x: c1.x + (c2.x - c1.x) * t,
    z: c1.z + (c2.z - c1.z) * t,
    rotation: c1.rotation // rotation doesn't need to interpolate smoothly for now
  };
}
