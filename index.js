// official base colors
const officialPalette = [
    {systemIndex: 0, rgb: [0x00, 0x00, 0x00]},
    {systemIndex: 1, rgb: [0x1d, 0x2b, 0x53]},
    {systemIndex: 2, rgb: [0x7e, 0x25, 0x53]},
    {systemIndex: 3, rgb: [0x00, 0x87, 0x51]},

    {systemIndex: 4, rgb: [0xab, 0x52, 0x36]},
    {systemIndex: 5, rgb: [0x5f, 0x57, 0x4f]},
    {systemIndex: 6, rgb: [0xc2, 0xc3, 0xc7]},
    {systemIndex: 7, rgb: [0xff, 0xf1, 0xe8]},

    {systemIndex: 8, rgb: [0xff, 0x00, 0x4d]},
    {systemIndex: 9, rgb: [0xff, 0xa3, 0x00]},
    {systemIndex: 10, rgb: [0xff, 0xec, 0x27]},
    {systemIndex: 11, rgb: [0x00, 0xe4, 0x36]},

    {systemIndex: 12, rgb: [0x29, 0xad, 0xff]},
    {systemIndex: 13, rgb: [0x83, 0x76, 0x9c]},
    {systemIndex: 14, rgb: [0xff, 0x77, 0xa8]},
    {systemIndex: 15, rgb: [0xff, 0xcc, 0xaa]},
];

// undocumented extra colors
// https://pico-8.fandom.com/wiki/Palette
const undocumentedPalette = [
    {systemIndex: 128, rgb: [0x29, 0x18, 0x14]},
    {systemIndex: 129, rgb: [0x29, 0x18, 0x14]},
    {systemIndex: 130, rgb: [0x42, 0x21, 0x36]},
    {systemIndex: 131, rgb: [0x12, 0x53, 0x59]},

    {systemIndex: 132, rgb: [0x74, 0x2f, 0x29]},
    {systemIndex: 133, rgb: [0x49, 0x33, 0x3b]},
    {systemIndex: 134, rgb: [0xa2, 0x88, 0x79]},
    {systemIndex: 135, rgb: [0xf3, 0xef, 0x7d]},

    {systemIndex: 136, rgb: [0xbe, 0x12, 0x50]},
    {systemIndex: 137, rgb: [0xff, 0x6c, 0x24]},
    {systemIndex: 138, rgb: [0xa8, 0xe7, 0x2e]},
    {systemIndex: 139, rgb: [0x00, 0xb5, 0x43]},

    {systemIndex: 140, rgb: [0x06, 0x5a, 0xb5]},
    {systemIndex: 141, rgb: [0x75, 0x46, 0x65]},
    {systemIndex: 142, rgb: [0xff, 0x6e, 0x59]},
    {systemIndex: 143, rgb: [0xff, 0x9d, 0x81]},
];

const fullSystemPalette = [...officialPalette, ...undocumentedPalette];

// 0x7f-0xaf characters in P8SCII charset
// https://pico-8.fandom.com/wiki/P8SCII
const p8sciiSpecialChars = [
    '○',
    '█', '▒', '🐱', '⬇️', '░', '✽', '●', '♥', '☉', '웃', '⌂', '⬅️', '😐', '♪', '🅾️', '◆',
    '…', '➡️', '★', '⧗', '⬆️', 'ˇ', '∧', '❎', '▤', '▥', 'あ', 'い', 'う', 'え', 'お', 'か',
    'き', 'く', 'け', 'こ', 'さ', 'し', 'す', 'せ', 'そ', 'た', 'ち', 'つ', 'て', 'と', 'な', 'に',
    'ぬ', 'ね', 'の', 'は', 'ひ', 'ふ', 'へ', 'ほ', 'ま', 'み', 'む', 'め', 'も', 'や', 'ゆ', 'よ',
];

const encodeP8scii = (val) => {
    if (val < 0 || val > 0x8f) throw('out of bound');

    const shiftedVal = val + 0x30; // avoid control characters
    return (shiftedVal < 0x7f) ?
        String.fromCharCode(shiftedVal) :
        p8sciiSpecialChars[shiftedVal - 0x7f];
};

const getColorDistance = (rgb1, rgb2) => {
    const [r1, g1, b1] = rgb1;
    const [r2, g2, b2] = rgb2;
    return Math.sqrt(Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2));
};

const getNearestColor = (rgb, palette, virtualPenalty = 20) => {
    return palette.sort((a, b) => {
        const penalty = (getColorDistance(a.rgb, [255,157,129]) < 70) ? 0 : virtualPenalty; // more skin tones
        return getColorDistance(a.rgb, rgb) - getColorDistance(b.rgb, rgb) +
            ((a.drawIndex > 15) ? penalty : 0) - ((b.drawIndex > 15) ? penalty : 0); // avoid virtual colors
    })[0];
};

const getMatrix = (imageCtx) => {
    const matrix = [];
    for (let y = 0; y < imageCtx.canvas.height; y++) {
        const row = [];
        matrix.push(row);
        for (let x = 0; x < imageCtx.canvas.width; x++) {
            row.push(imageCtx.getImageData(x, y, 1, 1).data);
        }
    }
    return matrix;
};

const getBestPalette = (matrix, basePalette, max) => {
    if (basePalette.length <= max) return basePalette;

    const colorScores = {};
    matrix.forEach(row => {
        row.forEach(rgb => {
            const nearestColor = getNearestColor(rgb, basePalette);
            colorScores[nearestColor.systemIndex] ||= {color: nearestColor, score: 0};
            colorScores[nearestColor.systemIndex].score += 1;
        });
    });
    const bestColorIndexes = Object.keys(colorScores).sort(index => colorScores[index].score);
    return bestColorIndexes.slice(0, max).map(index => colorScores[index].color); // TODO: keep original indexes as possible
};

const getBestDrawPalette = (matrix) => {
    return getBestPalette(matrix, fullSystemPalette, 16).map((color, i) => {
        return {...color, drawIndex: i}; // 0 - 15
    });
};

const getFullVirtualPalette = (drawPalette) => {
    const virtualPalette = [];
    drawPalette.forEach(color1 => {
        const [r1, g1, b1] = color1.rgb;
        drawPalette.forEach(color2 => {
            if (color1.drawIndex !== color2.drawIndex && getColorDistance(color1.rgb, color2.rgb) < 90) {
                const [r2, g2, b2] = color2.rgb;

                // virtual color object
                virtualPalette.push({
                    systemIndex: virtualPalette.length + 256, // "system" index for virtual colors.
                    rgb: [
                        Math.floor((r1 + r2) / 2),
                        Math.floor((g1 + g2) / 2),
                        Math.floor((b1 + b2) / 2),
                    ],
                    compositeIndexes: [color1.drawIndex, color2.drawIndex],
                });
            }
        });
    });
    return virtualPalette;
};

const getBestVirtualPalette = (matrix, drawPalette) => {
    return getBestPalette(matrix, getFullVirtualPalette(drawPalette), 48).map((color, i) => {
        return {...color, drawIndex: i + 16}; // 16 - 64
    });
};

const getPaletteMatrix = (matrix, palette) => {
    const paletteMatrix = [];
    matrix.forEach((row, y) => {
        const paletteRow = [];
        paletteMatrix.push(paletteRow);
        row.forEach(rgb => {
            const nearestColor = getNearestColor(rgb, palette);
            paletteRow.push(nearestColor);
        });
    });
    return paletteMatrix;
};

const drawByPaletteMatrix = (imageCtx, paletteMatrix, palette) => {
    paletteMatrix.forEach((row, y) => {
        row.forEach((color, x) => {
            const [r, g, b] = color.rgb;
            imageCtx.fillStyle = `rgb(${r},${g},${b})`;
            imageCtx.fillRect(x, y, 1, 1);
        });
    });
};

const getDrawPaletteHeader = (drawPalette) => {
    return drawPalette.map(color => {
        return encodeP8scii(color.systemIndex); // map systemPaletteIndex to drawPaletteIndex
    }).join('') + '\n';
};

const getVirtualPaletteHeader = (virtualPalette) => {
    return virtualPalette.map(color => {
        // TODO: mix ratios, maybe?
        return encodeP8scii(color.compositeIndexes[0]) + encodeP8scii(color.compositeIndexes[1]);
    }).join('') + '\n';
};

const bindOrphanPixels = (encodedRow) => {
    const one = encodeP8scii(1);
    let row = '';
    let orphanPixels = '';
    for (i = 0; i < encodedRow.length; i += 2) {
        const length = encodedRow.substring(i, i + 1);
        const colorIndex = encodedRow.substring(i + 1, i + 2);
        if (length === one)
            orphanPixels += colorIndex;
        if (
            orphanPixels !== '' &&
            ((i + 2 >= encodedRow.length) || orphanPixels.length > 4 || length !== one)
        ) {
            // use "minus value" characters to indicate number of orphans
            row += String.fromCharCode(0x30 - orphanPixels.length) + orphanPixels;
            orphanPixels = '';
        }
        if (length !== one)
            row += length + colorIndex;
    }
    return row;
};

const bindDittoRows = (encodedBody) => {
    const body = [];
    let dittoRow = '';
    let dittoCount = 0;
    for (let i = 0; i < encodedBody.length; i++) {}
    encodedBody.forEach((row, i) => {
        if (row === dittoRow) {
            dittoCount += 1;
        }
        else {
            if (dittoCount > 0)
                body.push(`*${dittoCount}\n`);
            body.push(row);
            dittoRow = row;
            dittoCount = 0;
        }
    });
    if (dittoCount > 0)
        body.push(`*${dittoCount}\n`);
    return body;
};

const getEncodedBody = (paletteMatrix) => {
    let encodedBody = [];
    paletteMatrix.forEach(paletteRow => {
        let currentColorIndex = paletteRow[0].drawIndex;
        let length = 0;
        let encodedRow = '';
        paletteRow.forEach((color, x) => {
            length += 1;
            if ((color.drawIndex !== currentColorIndex) || (x >= paletteRow.length - 1)) {
                encodedRow += encodeP8scii(length) + encodeP8scii(currentColorIndex);
                currentColorIndex = color.drawIndex;
                length = 0;
            }
        });
        encodedBody.push(bindOrphanPixels(encodedRow) + '\n');
    });
    return bindDittoRows(encodedBody).join('');
};

const encodeImage = () => {
    const img = document.getElementById('originalImage');
    const targetWidth = 128; // TODO
    const targetHeight = img.height / (img.width / targetWidth);

    const resizedImage = document.getElementById('resizedImage');
    resizedImage.width = targetWidth;
    resizedImage.height = targetHeight;
    const resizedImageCtx = resizedImage.getContext('2d', {alpha: false, willReadFrequently: true});
    resizedImageCtx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const convertedImage = document.getElementById('convertedImage');
    convertedImage.width = targetWidth;
    convertedImage.height = targetHeight;
    const convertedImageCtx = convertedImage.getContext('2d', {alpha: false});

    const matrix = getMatrix(resizedImageCtx);
    const drawPalette = getBestDrawPalette(matrix);
    const virtualPalette = getBestVirtualPalette(matrix, drawPalette);
    const availablePalette = [...drawPalette, ...virtualPalette];

    const paletteMatrix = getPaletteMatrix(matrix, availablePalette);
    drawByPaletteMatrix(convertedImageCtx, paletteMatrix, availablePalette);

    document.getElementById('encodedString').value =
        getDrawPaletteHeader(drawPalette) +
        getVirtualPaletteHeader(virtualPalette) +
        '---\n' +
        getEncodedBody(paletteMatrix);
};

const displayImage = () => {
    const fileInput = document.getElementById('imageFile');
    const img = document.getElementById('originalImage');

    const file = fileInput.files[0];
    if (file) {
        img.src = URL.createObjectURL(file);
        img.onload = function() {
          URL.revokeObjectURL(img.src);
          encodeImage();
        }
    }
};
