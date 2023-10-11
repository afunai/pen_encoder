// official base colors
const officialPallete = [
    [0x00, 0x00, 0x00],
    [0x1d, 0x2b, 0x53],
    [0x7e, 0x25, 0x53],
    [0x00, 0x87, 0x51],

    [0xab, 0x52, 0x36],
    [0x5f, 0x57, 0x4f],
    [0xc2, 0xc3, 0xc7],
    [0xff, 0xf1, 0xe8],

    [0xff, 0x00, 0x4d],
    [0xff, 0xa3, 0x00],
    [0xff, 0xec, 0x27],
    [0x00, 0xe4, 0x36],

    [0x29, 0xad, 0xff],
    [0x83, 0x76, 0x9c],
    [0xff, 0x77, 0xa8],
    [0xff, 0xcc, 0xaa],
];

// undocumented extra colors
// https://pico-8.fandom.com/wiki/Palette
const undocumentedPallete = [
    [0x29, 0x18, 0x14],
    [0x29, 0x18, 0x14],
    [0x42, 0x21, 0x36],
    [0x12, 0x53, 0x59],

    [0x74, 0x2f, 0x29],
    [0x49, 0x33, 0x3b],
    [0xa2, 0x88, 0x79],
    [0xf3, 0xef, 0x7d],

    [0xbe, 0x12, 0x50],
    [0xff, 0x6c, 0x24],
    [0xa8, 0xe7, 0x2e],
    [0x00, 0xb5, 0x43],

    [0x06, 0x5a, 0xb5],
    [0x75, 0x46, 0x65],
    [0xff, 0x6e, 0x59],
    [0xff, 0x9d, 0x81],
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
    let nearestColor = [0, 0, 0, 0];
    let minDistance = Infinity;
    pallete.forEach((palleteRgb, palleteNo) => {
        const distance = getColorDistance(palleteRgb, rgb);
        if (distance < minDistance) {
            const [pR, pG, pB] = palleteRgb;
            nearestColor = [pR, pG, pB, palleteNo];
            minDistance = distance;
        }
    });
    return nearestColor;
}

const getBestDrawPallete = (matrix) => {
    const colorScores = {};
    matrix.forEach(line => {
        line.forEach(pixel => {
            const[r, g, b, tmpPalleteNo] = getNearestColor(pixel, allSystemPalletes);
            const systemPalleteNo = (tmpPalleteNo <= 0x0f) ?
                tmpPalleteNo : (tmpPalleteNo + 0x70); // undocumented colors begins with 0x80
            colorScores[systemPalleteNo] ||= {color: [r, g, b], score: 0};
            colorScores[systemPalleteNo].score += 1;
        });
    });
    const bestPalletteNos = Object.keys(colorScores).sort(pNo => colorScores[pNo].score);
    return bestPalletteNos.slice(0, 16).map(pNo => [...colorScores[pNo].color, parseInt(pNo)]); // TODO: keep original codes as possible
};

const encodeImage = () => {
    const img = document.getElementById('originalImage');
    const resizedImage = document.getElementById('resizedImage');

    const targetWidth = 128; // TODO
    const targetHeight = img.height / (img.width / targetWidth);

    resizedImage.width = targetWidth;
    resizedImage.height = targetHeight;
    const resizedImageCtx = resizedImage.getContext('2d', {alpha: false, willReadFrequently: true});
    resizedImageCtx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const convertedImage = document.getElementById('convertedImage');
    convertedImage.width = targetWidth;
    convertedImage.height = targetHeight;
    const convertedImageCtx = convertedImage.getContext('2d', {alpha: false});

    const matrix = [];
    for (let y = 0; y < targetHeight; y++) {
        const line = [];
        matrix.push(line);
        for (let x = 0; x < targetWidth; x++) {
            line.push(resizedImageCtx.getImageData(x, y, 1, 1).data);
        }
    }

    const bestDrawPallete = getBestDrawPallete(matrix);

    const palleteMatrix = [];
    matrix.forEach((line, y) => {
        const palleteLine = [];
        palleteMatrix.push(palleteLine);
        line.forEach((rgb, x) => {
            const [r, g, b, drawPalleteNo] = getNearestColor(rgb, bestDrawPallete);
            convertedImageCtx.fillStyle = `rgb(${r},${g},${b})`;
            convertedImageCtx.fillRect(x, y, 1, 1);
            palleteLine.push(drawPalleteNo);
        });
    });

    const drawPalleteHeader = bestDrawPallete.map(rgbAndNo => {
        const [r, g, b, systemPalleteNo] = rgbAndNo;
        return encodeP8scii(systemPalleteNo);
    }).join('');

    let encodedBody = '';
    palleteMatrix.forEach(palleteLine => {
        let currentPalleteNo = palleteLine[0];
        let length = 0;
        palleteLine.forEach((drawPalleteNo, x) => {
            length += 1;
            if ((drawPalleteNo !== currentPalleteNo) || (x >= targetWidth - 1)) {
                encodedBody += encodeP8scii(currentPalleteNo) + encodeP8scii(length);
                currentPalleteNo = drawPalleteNo;
                length = 0;
            }
        });
        encodedBody += '\n';
    });
    document.getElementById('encodedString').value = drawPalleteHeader + '\n\n' + encodedBody;
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
