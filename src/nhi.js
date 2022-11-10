function decode(arrayBuffer, byteOffset, byteLength, outputChannels) {
    if (typeof byteOffset === "undefined" || byteOffset === null) {
    byteOffset = 0;
    }
    if (typeof byteLength === "undefined" || byteLength === null) {
    byteLength = arrayBuffer.byteLength - byteOffset;
    }
    const uint8 = new Uint8Array(arrayBuffer, byteOffset, byteLength);
    const magic1 = uint8[0];
    const magic2 = uint8[1];
    const magic3 = uint8[2];
    const magic4 = uint8[3];
    const width =
    ((uint8[4] << 24) |
        (uint8[5] << 16) |
        (uint8[6] << 8) |
        uint8[7]) >>>
    0;
    const height =
    ((uint8[8] << 24) |
        (uint8[9] << 16) |
        (uint8[10] << 8) |
        uint8[11]) >>>
    0;
    const channels = uint8[12];
    const colorspace = uint8[13];
    if (
    typeof outputChannels === "undefined" ||
    outputChannels === null
    ) {
    outputChannels = channels;
    }
    if (
    magic1 !== 113 ||
    magic2 !== 111 ||
    magic3 !== 105 ||
    magic4 !== 102
    ) {
    throw new Error(
        "QOI.decode: The signature of the QOI file is invalid"
    );
    }
    if (channels < 3 || channels > 4) {
    throw new Error(
        "QOI.decode: The number of channels declared in the file is invalid"
    );
    }
    if (colorspace > 1) {
    throw new Error(
        "QOI.decode: The colorspace declared in the file is invalid"
    );
    }
    if (outputChannels < 3 || outputChannels > 4) {
    throw new Error(
        "QOI.decode: The number of channels for the output is invalid"
    );
    }
    const pixelLength = width * height * outputChannels;
    const result = new Uint8Array(pixelLength);
    let arrayPosition = 14;
    const index = new Uint8Array(64 * 4);
    let indexPosition = 0;
    let red = 0;
    let green = 0;
    let blue = 0;
    let alpha = 255;
    const chunksLength = byteLength - 8;
    let run = 0;
    let pixelPosition = 0;
    for (
    ;
    pixelPosition < pixelLength && arrayPosition < byteLength - 4;
    pixelPosition += outputChannels
    ) {
    if (run > 0) {
        run--;
    } else if (arrayPosition < chunksLength) {
        const byte1 = uint8[arrayPosition++];
        if (byte1 === 254) {
        red = uint8[arrayPosition++];
        green = uint8[arrayPosition++];
        blue = uint8[arrayPosition++];
        } else if (byte1 === 255) {
        red = uint8[arrayPosition++];
        green = uint8[arrayPosition++];
        blue = uint8[arrayPosition++];
        alpha = uint8[arrayPosition++];
        } else if ((byte1 & 192) === 0) {
        red = index[byte1 * 4];
        green = index[byte1 * 4 + 1];
        blue = index[byte1 * 4 + 2];
        alpha = index[byte1 * 4 + 3];
        } else if ((byte1 & 192) === 64) {
        red += ((byte1 >> 4) & 3) - 2;
        green += ((byte1 >> 2) & 3) - 2;
        blue += (byte1 & 3) - 2;
        red = (red + 256) % 256;
        green = (green + 256) % 256;
        blue = (blue + 256) % 256;
        } else if ((byte1 & 192) === 128) {
        const byte2 = uint8[arrayPosition++];
        const greenDiff = (byte1 & 63) - 32;
        const redDiff = greenDiff + ((byte2 >> 4) & 15) - 8;
        const blueDiff = greenDiff + (byte2 & 15) - 8;
        red = (red + redDiff + 256) % 256;
        green = (green + greenDiff + 256) % 256;
        blue = (blue + blueDiff + 256) % 256;
        } else if ((byte1 & 192) === 192) {
        run = byte1 & 63;
        }
        indexPosition =
        ((red * 3 + green * 5 + blue * 7 + alpha * 11) % 64) * 4;
        index[indexPosition] = red;
        index[indexPosition + 1] = green;
        index[indexPosition + 2] = blue;
        index[indexPosition + 3] = alpha;
    }
    if (outputChannels === 4) {
        result[pixelPosition] = red;
        result[pixelPosition + 1] = green;
        result[pixelPosition + 2] = blue;
        result[pixelPosition + 3] = alpha;
    } else {
        result[pixelPosition] = red;
        result[pixelPosition + 1] = green;
        result[pixelPosition + 2] = blue;
    }
    }
    if (pixelPosition < pixelLength) {
    throw new Error("QOI.decode: Incomplete image");
    }
    return {
    width: width,
    height: height,
    colorspace: colorspace,
    channels: outputChannels,
    data: result,
    };
}