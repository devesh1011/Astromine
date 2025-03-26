export class SimplexNoise {
  constructor() {
    this.grad3 = [
      [1, 1, 0],
      [-1, 1, 0],
      [1, -1, 0],
      [-1, -1, 0],
      [1, 0, 1],
      [-1, 0, 1],
      [1, 0, -1],
      [-1, 0, -1],
      [0, 1, 1],
      [0, -1, 1],
      [0, 1, -1],
      [0, -1, -1],
    ];
    this.p = [];

    // Populate with values 0..255
    for (let i = 0; i < 256; i++) {
      this.p[i] = Math.floor(Math.random() * 256);
    }

    // To remove the need for index wrapping, double the permutation table length
    this.perm = new Array(512);
    this.gradP = new Array(512);

    // Extend the permutation table
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
      this.gradP[i] = this.grad3[this.perm[i] % 12];
    }
  }

  // Simple 3D noise function
  noise3D(x, y, z) {
    // Find unit grid cell containing point
    let X = Math.floor(x);
    let Y = Math.floor(y);
    let Z = Math.floor(z);

    // Get relative xyz coordinates of point within cell
    x = x - X;
    y = y - Y;
    z = z - Z;

    // Wrap to avoid truncation effects
    X = X & 255;
    Y = Y & 255;
    Z = Z & 255;

    // Calculate noise contributions from each corner
    const n000 = this.dotProduct(
      this.gradP[(X + this.perm[Y + this.perm[Z]]) % 512],
      x,
      y,
      z
    );
    const n001 = this.dotProduct(
      this.gradP[(X + this.perm[Y + this.perm[Z + 1]]) % 512],
      x,
      y,
      z - 1
    );
    const n010 = this.dotProduct(
      this.gradP[(X + this.perm[Y + 1 + this.perm[Z]]) % 512],
      x,
      y - 1,
      z
    );
    const n011 = this.dotProduct(
      this.gradP[(X + this.perm[Y + 1 + this.perm[Z + 1]]) % 512],
      x,
      y - 1,
      z - 1
    );
    const n100 = this.dotProduct(
      this.gradP[(X + 1 + this.perm[Y + this.perm[Z]]) % 512],
      x - 1,
      y,
      z
    );
    const n101 = this.dotProduct(
      this.gradP[(X + 1 + this.perm[Y + this.perm[Z + 1]]) % 512],
      x - 1,
      y,
      z - 1
    );
    const n110 = this.dotProduct(
      this.gradP[(X + 1 + this.perm[Y + 1 + this.perm[Z]]) % 512],
      x - 1,
      y - 1,
      z
    );
    const n111 = this.dotProduct(
      this.gradP[(X + 1 + this.perm[Y + 1 + this.perm[Z + 1]]) % 512],
      x - 1,
      y - 1,
      z - 1
    );

    // Compute the fade curve value
    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    // Interpolate
    const nx00 = this.mix(n000, n100, u);
    const nx01 = this.mix(n001, n101, u);
    const nx10 = this.mix(n010, n110, u);
    const nx11 = this.mix(n011, n111, u);

    const nxy0 = this.mix(nx00, nx10, v);
    const nxy1 = this.mix(nx01, nx11, v);

    return this.mix(nxy0, nxy1, w);
  }

  dotProduct(g, x, y, z) {
    return g[0] * x + g[1] * y + g[2] * z;
  }

  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  mix(a, b, t) {
    return (1 - t) * a + t * b;
  }
}
