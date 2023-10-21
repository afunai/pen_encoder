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

// virtual displayIndex 16 is reserved for 'transparent' color
const transparentColor = {systemIndex: -1, displayIndex: 16, rgb: [0x00, 0xcc, 0x00]};

// 0x7f-0xff characters in P8SCII charset
// https://pico-8.fandom.com/wiki/P8SCII
const p8sciiSpecialChars = [
    '○',
    '█', '▒', '🐱', '⬇️', '░', '✽', '●', '♥', '☉', '웃', '⌂', '⬅️', '😐', '♪', '🅾️', '◆',
    '…', '➡️', '★', '⧗', '⬆️', 'ˇ', '∧', '❎', '▤', '▥', 'あ', 'い', 'う', 'え', 'お', 'か',
    'き', 'く', 'け', 'こ', 'さ', 'し', 'す', 'せ', 'そ', 'た', 'ち', 'つ', 'て', 'と', 'な', 'に',
    'ぬ', 'ね', 'の', 'は', 'ひ', 'ふ', 'へ', 'ほ', 'ま', 'み', 'む', 'め', 'も', 'や', 'ゆ', 'よ',
    'ら', 'り', 'る', 'れ', 'ろ', 'わ', 'を', 'ん', 'っ', 'ゃ', 'ゅ', 'ょ', 'ア', 'イ', 'ウ', 'エ',
    'オ', 'カ', 'キ', 'ク', 'ケ', 'コ', 'サ', 'シ', 'ス', 'セ', 'ソ', 'タ', 'チ', 'ツ', 'テ', 'ト',
    'ナ', 'ニ', 'ヌ', 'ネ', 'ノ', 'ハ', 'ヒ', 'フ', 'ヘ', 'ホ', 'マ', 'ミ', 'ム', 'メ', 'モ', 'ヤ',
    'ユ', 'ヨ', 'ラ', 'リ', 'ル', 'レ', 'ロ', 'ワ', 'ヲ', 'ン', 'ッ', 'ャ', 'ュ', 'ョ', '◜', '◝',
];

const maxEncodableVal = 0xff - 0x30; // 207

const encodeP8scii = (val) => {
    if (val < 0 || val > maxEncodableVal) throw('out of bound');

    const shiftedVal = val + 0x30; // avoid control characters
    return (shiftedVal < 0x7f) ?
        String.fromCharCode(shiftedVal) :
        p8sciiSpecialChars[shiftedVal - 0x7f];
};

const getColorDistance = (rgb1, rgb2) => {
    return chroma.deltaE([...rgb1.slice(0, 3)], [...rgb2.slice(0, 3)], 1.5, 1, 0.9);
};

const alpha_threshold = 127; // TODO

const getNearestColor = (rgba, palette, virtualPenalty = 5) => {
    if (rgba[3] < alpha_threshold)
        return transparentColor;
    else {
        let nearestColor = null;
        let colorDistance = 100000;
        palette.forEach(color => {
            const cd = getColorDistance(color.rgb, rgba) + ((color.displayIndex > 15) ? virtualPenalty : 0); + ((color.systemIndex === 0) ? -3 : 0);
            if (cd < colorDistance) {
                nearestColor = color;
                colorDistance = cd;
            }
        });
        return nearestColor;
    }
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
        row.forEach(rgba => {
            if (rgba[3] >= alpha_threshold) { // skip 'transparent' pixel
                const nearestColor = getNearestColor(rgba, basePalette);
                colorScores[nearestColor.systemIndex] ||= {color: nearestColor, score: 0};
                colorScores[nearestColor.systemIndex].score += 1;
            }
        });
    });
    const bestColorIndexes = Object.keys(colorScores).sort(index => colorScores[index].score);
    return bestColorIndexes.slice(0, max).map(index => colorScores[index].color); // TODO: keep original indexes as possible
};

const getDisplayPalette = (paletteType, matrix) => {
    let displayPalette;
    if (paletteType == 'mixed')
        displayPalette = getBestPalette(matrix, fullSystemPalette, 16).sort(
            color => color.systemIndex
        );
    else if (paletteType == 'undocumented')
        displayPalette = undocumentedPalette;
    else
        displayPalette = officialPalette;

    return displayPalette.map((color, i) => {
        return {...color, displayIndex: i}; // 0 - 15
    });
};

const getFullVirtualPalette = (displayPalette) => {
    const virtualPalette = [];
    displayPalette.forEach((color1, i) => {
        const [r1, g1, b1] = color1.rgb;
        displayPalette.slice(i + 1).forEach(color2 => {
            if (getColorDistance(color1.rgb, color2.rgb) < 28) {
                const [r2, g2, b2] = color2.rgb;

                // virtual color object
                virtualPalette.push({
                    systemIndex: virtualPalette.length + 256, // "system" index for virtual colors.
                    rgb: chroma.average([[r1, g1, b1], [r2, g2, b2]], 'rgb').rgb(),
                    compositeIndexes: [color1.displayIndex, color2.displayIndex],
                });

                // 3:1 composite ratio
                if (getColorDistance(color1.rgb, color2.rgb) < 20) {
                    virtualPalette.push({
                        systemIndex: virtualPalette.length + 256,
                        rgb: chroma.average([[r1, g1, b1], [r2, g2, b2]], 'rgb', [3, 1]).rgb(),
                        compositeIndexes: [color1.displayIndex + 16, color2.displayIndex], // displayIndex1 = 16..31
                    });
                }
            }
        });
    });
    return virtualPalette;
};

const getBestVirtualPalette = (matrix, displayPalette) => {
    return getBestPalette(matrix, getFullVirtualPalette(displayPalette), 63).map((color, i) => {
        return {...color, displayIndex: i + 17}; // displayIndex = 17..79 (expandable to 207)
    });
};

const getPaletteMatrix = (matrix, palette) => {
    const paletteMatrix = [];
    matrix.forEach((row, y) => {
        const paletteRow = [];
        paletteMatrix.push(paletteRow);
        row.forEach(rgba => {
            const nearestColor = getNearestColor(rgba, palette);
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

const getDisplayPaletteHeader = (displayPalette) => {
    return displayPalette.map(color => {
        return encodeP8scii(color.systemIndex); // map systemPaletteIndex to displayPaletteIndex
    }).join('') + '\n';
};

const getVirtualPaletteHeader = (virtualPalette) => {
    return virtualPalette.map(color => {
        // TODO: mix ratios, maybe?
        return encodeP8scii(color.compositeIndexes[0]) + encodeP8scii(color.compositeIndexes[1]);
    }).join('') + '\n';
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
                body.push(`*${dittoCount}`);
            body.push(row);
            dittoRow = row;
            dittoCount = 0;
        }
    });
    if (dittoCount > 0)
        body.push(`*${dittoCount}`);
    return body;
};

const maxLength = 64;
const tokenIndexOffset = 0x40;
const singlePixelColorOffset = 0x80;

const getFrequentTokens = (encodedBody, max) => {
    tokenCount = {};
    encodedBody.forEach(row => {
        let i = 0;
        while (i < row.length) {
            const firstByteVal = row.charCodeAt(i) - 0x30;
            if (firstByteVal < 0) // special control characters (eg. ditto lines)
                break;
            else if (firstByteVal < singlePixelColorOffset) {
                const token = row.substr(i, 2);
                tokenCount[token] ||= 0;
                tokenCount[token] += 1;
                i += 2;
            }
            else
                i += 1;
        }
    });
    return Object.keys(tokenCount).sort(k => tokenCount[k]).slice(0, max);
};

const replaceFrequentTokens = (encodedBody, frequentTokens) => {
    const replacedBody = [];
    encodedBody.forEach(row => {
        let replacedRow = '';
        let i = 0;
        while (i < row.length) {
            const firstByteVal = row.charCodeAt(i) - 0x30;
            if (firstByteVal < 0) { // special control characters (eg. ditto lines)
                replacedRow = row;
                break;
            }
            else if (firstByteVal < singlePixelColorOffset) {
                const token = row.substr(i, 2);
                const tokenIndex = frequentTokens.findIndex(t => t === token);
                replacedRow += (tokenIndex >= 0) ? encodeP8scii(tokenIndexOffset + tokenIndex) : token;
                i += 2;
            }
            else {
                replacedRow += row.substr(i, 1); // singlePixelColor
                i += 1;
            }
        }
        replacedBody.push(replacedRow);
    });
    return replacedBody;
}

const getEncodedBody = (paletteMatrix) => {
    let encodedBody = [];
    paletteMatrix.forEach(paletteRow => {
        let currentColorIndex = paletteRow[0].displayIndex;
        let length = 0;
        let encodedRow = '';
        paletteRow.forEach((color, x) => {
            length += 1;
            if ((color.displayIndex !== currentColorIndex) || (x >= paletteRow.length - 1) || length >= maxLength) {
                encodedRow += (length > 1 || (singlePixelColorOffset + currentColorIndex) > maxEncodableVal) ?
                    encodeP8scii(length - 1) + encodeP8scii(currentColorIndex) :
                    encodeP8scii(singlePixelColorOffset + currentColorIndex);
                currentColorIndex = color.displayIndex;
                length = 0;
            }
        });
        encodedBody.push(encodedRow);
    });
    return bindDittoRows(encodedBody);
};

//
// minimum UI in plain Javascript
//

const getTargetDimension = (img) => {
    const targetWidth = parseInt(document.getElementById('targetWidth').value);
    const targetHeight = img.height / (img.width / targetWidth);
    return [targetWidth, targetHeight];
};

const drawResizedImage = () => {
    const img = document.getElementById('originalImage');
    const [targetWidth, targetHeight] = getTargetDimension(img);

    const resizedImage = document.getElementById('resizedImage');
    resizedImage.width = targetWidth;
    resizedImage.height = targetHeight;
    const resizedImageCtx = resizedImage.getContext('2d', {
        alpha: true,
        globalAlpha: 1,
        willReadFrequently: true,
    });
    resizedImageCtx.drawImage(img, 0, 0, targetWidth, targetHeight);
};

const printPalette = (palette, targetElementId) => {
    const targetElement = document.getElementById(targetElementId);
    targetElement.innerHTML = '';

    palette.forEach(color => {
        const [r, g, b] = color.rgb;

        var colorSpan = document.createElement('span');
        colorSpan.style.display = 'inline-block';
        colorSpan.style.background = `rgb(${r},${g},${b})`;
        colorSpan.style.width = '1.5em';
        colorSpan.style.height = '1.5em';

        targetElement.appendChild(colorSpan);
    });
};

const disableForm = (disabled) => {
    ['#imageFile', '#targetWidth', '#encodeButton'].forEach(id => {
        document.querySelector(id).disabled = disabled;
    });
    document.body.style.cursor = disabled ? 'progress' : 'pointer';
};

const encodeImage = () => {
    const resizedImage = document.getElementById('resizedImage');
    const resizedImageCtx = resizedImage.getContext('2d', {
        alpha: true,
        globalAlpha: 1,
        willReadFrequently: true,
    });
    const [targetWidth, targetHeight] = getTargetDimension(resizedImage);

    const convertedImage = document.getElementById('convertedImage');
    convertedImage.width = targetWidth;
    convertedImage.height = targetHeight;
    const convertedImageCtx = convertedImage.getContext('2d', {alpha: true});

    const matrix = getMatrix(resizedImageCtx);

    const paletteType = document.getElementById('paletteType').value;
    const displayPalette = getDisplayPalette(paletteType, matrix);

    const virtualPalette = getBestVirtualPalette(matrix, displayPalette);
    const availablePalette = [...displayPalette, ...virtualPalette];

    const paletteMatrix = getPaletteMatrix(matrix, availablePalette);
    drawByPaletteMatrix(convertedImageCtx, paletteMatrix, availablePalette);

    const encodedBody = getEncodedBody(paletteMatrix);
    const frequentTokens = getFrequentTokens(encodedBody, 64);

    document.getElementById('encodedString').value =
        getDisplayPaletteHeader(displayPalette) +
        getVirtualPaletteHeader(virtualPalette) +
        (frequentTokens.join('') + '\n') +
        '---\n' +
        replaceFrequentTokens(encodedBody, frequentTokens).join('\n') +
        '\n';

    printPalette(displayPalette, 'displayPalette');
    printPalette(virtualPalette, 'virtualPalette');
};

const selectImage = () => {
    const fileInput = document.getElementById('imageFile');
    const img = document.getElementById('originalImage');

    const file = fileInput.files[0];
    if (file) {
        img.src = URL.createObjectURL(file);
        img.onload = function() {
            URL.revokeObjectURL(img.src);
            drawResizedImage(img);
            document.querySelector('#encodeButton').disabled = false;
        }
    }
};
