// official base colors
const officialPalletes = [
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
const undocumentedPalletes = [
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

const allSystemPalletes = [...officialPalletes, ...undocumentedPalletes];

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

const getNearestColor = (rgb) => {
    let nearestColor = [0, 0, 0, 0];
    let minDistance = Infinity;
    officialPalletes.forEach((color, p) => {
        const distance = getColorDistance(color, rgb);
        if (distance < minDistance) {
            nearestColor = [...color, p];
            minDistance = distance;
        }
    });
    return nearestColor;
}

const encodeImage = () => {
    const img = document.getElementById('originalImage');
    const resizedImage = document.getElementById('resizedImage');

    const targetWidth = 128;
    const targetHeight = img.height / (img.width / targetWidth);

    resizedImage.width = targetWidth;
    resizedImage.height = targetHeight;
    const resizedImageCtx = resizedImage.getContext('2d', {alpha: false, willReadFrequently: true});
    resizedImageCtx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const convertedImage = document.getElementById('convertedImage');
    convertedImage.width = targetWidth;
    convertedImage.height = targetHeight;
    const convertedImageCtx = convertedImage.getContext('2d', {alpha: false});
    const palleteMatrix = [];
    for (let y = 0; y < targetHeight; y++) {
        const palleteLine = [];
        palleteMatrix.push(palleteLine);
        for (let x = 0; x < targetWidth; x++) {
            const [r, g, b, p] = getNearestColor(resizedImageCtx.getImageData(x, y, 1, 1).data);
            convertedImageCtx.fillStyle = `rgb(${r},${g},${b})`;
            convertedImageCtx.fillRect(x, y, 1, 1);
            palleteLine.push(p);
        }
    }

    let encodedString = '';
    palleteMatrix.forEach(palleteLine => {
        let currentP = palleteLine[0];
        let length = 0;
        palleteLine.forEach((p, x) => {
            length += 1;
            if ((p !== currentP) || (x >= targetWidth - 1)) {
                encodedString += encodeP8scii(currentP) + encodeP8scii(length);
                currentP = p;
                length = 0;
            }
        });
        encodedString += '\n';
    });
    document.getElementById('encodedString').value = encodedString;
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
