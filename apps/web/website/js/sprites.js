// Embr's poses, cut from the model sheet (website/tools/source/embr-model-sheet.webp).
// w, h: image size in pixels
// ax, ay: where his feet touch the ground (x = middle of his body)
// scale: makes every pose the same size as the walking frames
// Numbers come from website/tools/export_layers.py.
export const POSES = {
  walk0: { w: 166, h: 245, ax: 61.9, ay: 243, scale: 1 },
  walk1: { w: 165, h: 239, ax: 64.6, ay: 236, scale: 1 },
  walk2: { w: 154, h: 241, ax: 58.0, ay: 239, scale: 1 },
  walk3: { w: 163, h: 230, ax: 64.0, ay: 228, scale: 1 },
  walk4: { w: 158, h: 238, ax: 64.2, ay: 236, scale: 1 },
  walk5: { w: 148, h: 237, ax: 58.2, ay: 234, scale: 1 },
  'lie-sleep': { w: 283, h: 207, ax: 176.1, ay: 206, scale: 0.701, mirror: true },
  'lie-awake': { w: 302, h: 205, ax: 191.2, ay: 204, scale: 0.676, mirror: true },
  right: { w: 198, h: 315, ax: 85.1, ay: 312, scale: 0.866 },
};

export const WALK = ['walk0', 'walk1', 'walk2', 'walk3', 'walk4', 'walk5'];

// the other layers (sizes of the images in website/assets)
export const ART = {
  // the sky, and where its sun is (fractions of the image)
  sky: { w: 2000, h: 750, sunX: 0.79, sunY: 0.81 },
  // mountains.webp and hill.webp share one size and line up exactly.
  // They were extended to the right (to 2112 wide) so the tree can sit further left;
  // `base` is the width of the original painting, which sets how big everything is drawn.
  // leavesRight: where the canopy ends (ignoring the last few stray leaf tips)
  scene: { w: 2112, h: 941, base: 1672, leavesRight: 1100, sun: [1560, 505] },
  grass: { w: 2000, h: 667, top: 0.4 }, // grass tips start 40% down the image
};

// Embr's path through the grass (scene pixels). He naps at the first point, on the open grass
// in front of the tree, then walks diagonally down the field toward the bottom right,
// and on past the edge of the picture so he can leave the screen.
export const RIDGE = [
  [444, 620], [523, 624], [700, 658], [900, 696], [1100, 734], [1300, 772], [1406, 792],
  [1672, 842], [2035, 911], [2300, 961],
];

// While napping he lies with a slight tilt to follow the ground (degrees)
export const NAP_TILT = 4;

// He grows a little as he walks down the field toward the viewer (extra size at the path's end)
export const DEPTH_GROW = 0.18;

// Embr's height on the hill, in painting pixels, when he is standing up
export const EMBR_HEIGHT = 150;
