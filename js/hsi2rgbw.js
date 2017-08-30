module.exports = function(H, S, I) {
  var r, g, b, w;
  var cos_h, cos_1047_h;

  H = H % 360; // cycle H around to 0-360 degrees
  H = Math.PI * H / 180.0; // Convert to radians.
  // clamp S and I to interval [0,1]
  S = S > 0 ? (S < 1 ? S : 1) : 0;
  I = I > 0 ? (I < 1 ? I : 1) : 0;

  if (H < 2.09439) {
    cos_h = Math.cos(H);
    cos_1047_h = Math.cos(1.047196667 - H);
    r = S * 255 * I / 3 * (1 + cos_h / cos_1047_h);
    g = S * 255 * I / 3 * (1 + (1 - cos_h / cos_1047_h));
    b = 0;
    w = 255 * (1 - S) * I;
  } else if (H < 4.188787) {
    H = H - 2.09439;
    cos_h = Math.cos(H);
    cos_1047_h = Math.cos(1.047196667 - H);
    g = S * 255 * I / 3 * (1 + cos_h / cos_1047_h);
    b = S * 255 * I / 3 * (1 + (1 - cos_h / cos_1047_h));
    r = 0;
    w = 255 * (1 - S) * I;
  } else {
    H = H  -  4.188787;
    cos_h = Math.cos(H);
    cos_1047_h = Math.cos(1.047196667 - H);
    b = S * 255 * I / 3 * (1 + cos_h / cos_1047_h);
    r = S * 255 * I / 3 * (1 + (1 - cos_h / cos_1047_h));
    g = 0;
    w = 255 * (1 - S) * I;
  }

  return {
    r: r,
    g: g,
    b: b,
    w: w
  }
}
