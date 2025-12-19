// Custom random function that allows for quick adjustment of min and max.
export const random = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
};

// Used for calculating distance between users mouse and animal.
export const getEuclidianDistnace = (deltaX: number, deltaZ: number) => {
    return Math.sqrt(deltaX ** 2 + deltaZ ** 2);
};

// Used in color replacement for animals - I referenced code found here https://gist.github.com/mjackson/5311256
export const rgbToHsv = (
    r: number,
    g: number,
    b: number
): [number, number, number] => {
    // Normalize RGB values to [0, 1]
    // Pixel image data is actually in [0, 255] which is why I normalize it here.
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    let s = 0;
    const v = max;

    // Calculate saturation
    if (max !== 0) {
        s = delta / max;
    }

    // Calculate hue
    if (delta !== 0) {
        if (max === r) {
            h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
        } else if (max === g) {
            h = ((b - r) / delta + 2) / 6;
        } else {
            h = ((r - g) / delta + 4) / 6;
        }
    }

    return [h * 360, s, v];
};

// Used in color replacement for animals - I referenced code found here https://gist.github.com/mjackson/5311256
export const hsvToRgb = (
    h: number,
    s: number,
    v: number
): [number, number, number] => {
    // Normalize hue to [0, 1]
    h /= 360;

    // ensure saturation and value are within the range [0, 1]
    s = Math.max(0, Math.min(1, s));
    v = Math.max(0, Math.min(1, v));

    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    let r = 0,
        g = 0,
        b = 0;

    switch (i % 6) {
        case 0:
            r = v;
            g = t;
            b = p;
            break;
        case 1:
            r = q;
            g = v;
            b = p;
            break;
        case 2:
            r = p;
            g = v;
            b = t;
            break;
        case 3:
            r = p;
            g = q;
            b = v;
            break;
        case 4:
            r = t;
            g = p;
            b = v;
            break;
        case 5:
            r = v;
            g = p;
            b = q;
            break;
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

export type AnimationState = "moving" | "rotating" | "waiting";

export type ColorBounds = {
    rMax: number;
    rMin: number;
    gMax: number;
    gMin: number;
    bMax: number;
    bMin: number;
};

export type SceneInfo = {
    animalCount: number,
    grassCount: number,
    loadedCount: number
}
