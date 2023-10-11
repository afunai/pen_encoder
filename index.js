// official base colors
const officialPallete = [
    {index: 0, rgb: [0x00, 0x00, 0x00]},
    {index: 1, rgb: [0x1d, 0x2b, 0x53]},
    {index: 2, rgb: [0x7e, 0x25, 0x53]},
    {index: 3, rgb: [0x00, 0x87, 0x51]},

    {index: 4, rgb: [0xab, 0x52, 0x36]},
    {index: 5, rgb: [0x5f, 0x57, 0x4f]},
    {index: 6, rgb: [0xc2, 0xc3, 0xc7]},
    {index: 7, rgb: [0xff, 0xf1, 0xe8]},

    {index: 8, rgb: [0xff, 0x00, 0x4d]},
    {index: 9, rgb: [0xff, 0xa3, 0x00]},
    {index: 10, rgb: [0xff, 0xec, 0x27]},
    {index: 11, rgb: [0x00, 0xe4, 0x36]},

    {index: 12, rgb: [0x29, 0xad, 0xff]},
    {index: 13, rgb: [0x83, 0x76, 0x9c]},
    {index: 14, rgb: [0xff, 0x77, 0xa8]},
    {index: 15, rgb: [0xff, 0xcc, 0xaa]},
];

// undocumented extra colors
// https://pico-8.fandom.com/wiki/Palette
const undocumentedPallete = [
    {index: 128, rgb: [0x29, 0x18, 0x14]},
    {index: 129, rgb: [0x29, 0x18, 0x14]},
    {index: 130, rgb: [0x42, 0x21, 0x36]},
    {index: 131, rgb: [0x12, 0x53, 0x59]},

    {index: 132, rgb: [0x74, 0x2f, 0x29]},
    {index: 133, rgb: [0x49, 0x33, 0x3b]},
    {index: 134, rgb: [0xa2, 0x88, 0x79]},
    {index: 135, rgb: [0xf3, 0xef, 0x7d]},

    {index: 136, rgb: [0xbe, 0x12, 0x50]},
    {index: 137, rgb: [0xff, 0x6c, 0x24]},
    {index: 138, rgb: [0xa8, 0xe7, 0x2e]},
    {index: 139, rgb: [0x00, 0xb5, 0x43]},

    {index: 140, rgb: [0x06, 0x5a, 0xb5]},
    {index: 141, rgb: [0x75, 0x46, 0x65]},
    {index: 142, rgb: [0xff, 0x6e, 0x59]},
    {index: 143, rgb: [0xff, 0x9d, 0x81]},
];

const fullSystemPallete = [...officialPallete, ...undocumentedPallete];

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

const getNearestColor = (rgb, pallete) => {
    return pallete.sort(
        (a, b) => getColorDistance(a.rgb, rgb) - getColorDistance(b.rgb, rgb)
    )[0];
};

const getMatrix = (imageCtx) => {
    const matrix = [];
    for (let y = 0; y < imageCtx.canvas.height; y++) {
        const line = [];
        matrix.push(line);
        for (let x = 0; x < imageCtx.canvas.width; x++) {
            line.push(imageCtx.getImageData(x, y, 1, 1).data);
        }
    }
    return matrix;
};

const getBestPallete = (matrix, basePallete, max) => {
    const colorScores = {};
    matrix.forEach(line => {
        line.forEach(rgb => {
            const nearestColor = getNearestColor(rgb, basePallete);
            colorScores[nearestColor.index] ||= {color: nearestColor, score: 0};
            colorScores[nearestColor.index].score += 1;
        });
    });
    const bestColorIndexes = Object.keys(colorScores).sort(index => colorScores[index].score);
    return bestColorIndexes.slice(0, max).map(index => colorScores[index].color); // TODO: keep original indexes as possible
};

const getBestDrawPallete = (matrix) => {
    return getBestPallete(matrix, fullSystemPallete, 16).map((color, i) => {
        return {...color, drawIndex: i}; // 0 - 15
    });
};

const getFullVirtualPallete = (drawPallete) => {
    const virtualPallete = [];
    drawPallete.forEach(color1 => {
        const [r1, g1, b1] = color1.rgb;
        drawPallete.forEach(color2 => {
            if (color1.drawIndex !== color2.drawIndex) {
                const [r2, g2, b2] = color2.rgb;

                // virtual color object
                virtualPallete.push({
                    index: virtualPallete.length + 256, // "system" index for virtual colors.
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
    return virtualPallete;
};

const getBestVirtualPallete = (matrix, drawPallete) => {
    return getBestPallete(matrix, getFullVirtualPallete(drawPallete), 48).map((color, i) => {
        return {...color, drawIndex: i + 16}; // 16 - 64
    });
};

const getPalleteMatrix = (matrix, pallete) => {
    const palleteMatrix = [];
    matrix.forEach((line, y) => {
        const palleteLine = [];
        palleteMatrix.push(palleteLine);
        line.forEach(rgb => {
            const nearestColor = getNearestColor(rgb, pallete);
            palleteLine.push(nearestColor);
        });
    });
    return palleteMatrix;
};

const drawByPalleteMatrix = (imageCtx, palleteMatrix, pallete) => {
    palleteMatrix.forEach((line, y) => {
        line.forEach((color, x) => {
            const [r, g, b] = color.rgb;
            imageCtx.fillStyle = `rgb(${r},${g},${b})`;
            imageCtx.fillRect(x, y, 1, 1);
        });
    });
};

const getDrawPalleteHeader = (drawPallete) => {
    return drawPallete.map(color => {
        return encodeP8scii(color.index); // map systemPalleteIndex to drawPalleteIndex
    }).join('') + '\n';
};

const getVirtualPalleteHeader = (virtualPallete) => {
    return virtualPallete.map(color => {
        // TODO: mix ratios, maybe?
        return encodeP8scii(color.compositeIndexes[0]) + encodeP8scii(color.compositeIndexes[1]);
    }).join('') + '\n';
};

const getEncodedBody = (palleteMatrix) => {
    let encodedBody = '';
    palleteMatrix.forEach(palleteLine => {
        let currentColorIndex = palleteLine[0].drawIndex;
        let length = 0;
        palleteLine.forEach((color, x) => {
            length += 1;
            if ((color.drawIndex !== currentColorIndex) || (x >= palleteLine.length - 1)) {
                encodedBody += encodeP8scii(currentColorIndex) + encodeP8scii(length);
                currentColorIndex = color.drawIndex;
                length = 0;
            }
        });
        encodedBody += '\n';
    });
    return encodedBody;
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
    const drawPallete = getBestDrawPallete(matrix);
    const virtualPallete = getBestVirtualPallete(matrix, drawPallete);
    const availablePallete = [...drawPallete, ...virtualPallete];

    const palleteMatrix = getPalleteMatrix(matrix, availablePallete);
    drawByPalleteMatrix(convertedImageCtx, palleteMatrix, availablePallete);

    document.getElementById('encodedString').value =
        getDrawPalleteHeader(drawPallete) +
        getVirtualPalleteHeader(virtualPallete) +
        '---\n' +
        getEncodedBody(palleteMatrix);
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
