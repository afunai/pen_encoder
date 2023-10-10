const colorPalletes = [
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

const getColorDistance = (rgb1, rgb2) => {
    const [r1, g1, b1] = rgb1;
    const [r2, g2, b2] = rgb2;
    return Math.sqrt(Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2));
};

const getNearestColor = (rgb) => {
    let nearestColor = [0, 0, 0];
    let minDistance = Infinity;
    colorPalletes.forEach(color => {
        const distance = getColorDistance(color, rgb);
        if (distance < minDistance) {
            nearestColor = color;
            minDistance = distance;
        }
    });
    return nearestColor;
}

const encodeImage = () => {
    const img = document.getElementById('originalImage');
    const resizedImage = document.getElementById('resizedImage');

    const targetWidth = 128;
    const targetHeight = img.height / (img.width / 128);

    resizedImage.width = targetWidth;
    resizedImage.height = targetHeight;
    const resizedImageCtx = resizedImage.getContext('2d');
    resizedImageCtx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const convertedImage = document.getElementById('convertedImage');
    convertedImage.width = targetWidth;
    convertedImage.height = targetHeight;
    const convertedImageCtx = convertedImage.getContext('2d');
    for (let y = 0; y < targetHeight; y++) {
        for (let x = 0; x < targetWidth; x++) {
            const [r, g, b] = getNearestColor(resizedImageCtx.getImageData(x, y, 1, 1).data);
            convertedImageCtx.fillStyle = `rgb(${r},${g},${b})`;
            convertedImageCtx.fillRect(x, y, 1, 1);
        }
    }
};

const displayImage = () => {
    const fileInput = document.getElementById('imageFile');
    const img = document.getElementById('originalImage');

    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target.result;
            encodeImage();
        };
        reader.readAsDataURL(file);
    }
};
