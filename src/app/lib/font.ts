export const GRID_SIZE = 15;
export const CHAR_WIDTH = 5;
export const CHAR_HEIGHT = 7;
export const CHAR_SPACING = 1;

export const FONT_DATA: { [char: string]: boolean[][] } = {
    'A':[[false,true,true,true,false],[true,false,false,false,true],[true,false,false,false,true],[true,true,true,true,true],[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true]],
    'B':[[true,true,true,true,false],[true,false,false,false,true],[true,false,false,false,true],[true,true,true,true,false],[true,false,false,false,true],[true,false,false,false,true],[true,true,true,true,false]],
    'C':[[false,true,true,true,true],[true,false,false,false,false],[true,false,false,false,false],[true,false,false,false,false],[true,false,false,false,false],[true,false,false,false,false],[false,true,true,true,true]],
    'D':[[true,true,true,true,false],[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true],[true,true,true,true,false]],
    'E':[[true,true,true,true,true],[true,false,false,false,false],[true,false,false,false,false],[true,true,true,true,false],[true,false,false,false,false],[true,false,false,false,false],[true,true,true,true,true]],
    'F':[[true,true,true,true,true],[true,false,false,false,false],[true,false,false,false,false],[true,true,true,true,false],[true,false,false,false,false],[true,false,false,false,false],[true,false,false,false,false]],
    'G':[[false,true,true,true,false],[true,false,false,false,true],[true,false,false,false,false],[true,false,true,true,true],[true,false,false,false,true],[true,false,false,false,true],[false,true,true,true,true]],
    'H':[[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true],[true,true,true,true,true],[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true]],
    'I':[[true,true,true,true,true],[false,false,true,false,false],[false,false,true,false,false],[false,false,true,false,false],[false,false,true,false,false],[false,false,true,false,false],[true,true,true,true,true]],
    'J':[[false,false,false,false,true],[false,false,false,false,true],[false,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true],[false,true,true,true,false]],
    'K':[[true,false,false,false,true],[true,false,false,true,false],[true,false,true,false,false],[true,true,false,false,false],[true,false,true,false,false],[true,false,false,true,false],[true,false,false,false,true]],
    'L':[[true,false,false,false,false],[true,false,false,false,false],[true,false,false,false,false],[true,false,false,false,false],[true,false,false,false,false],[true,false,false,false,false],[true,true,true,true,true]],
    'M':[[true,false,false,false,true],[true,true,false,true,true],[true,false,true,false,true],[true,false,true,false,true],[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true]],
    'N':[[true,false,false,false,true],[true,true,false,false,true],[true,false,true,false,true],[true,false,false,true,true],[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true]],
    'O':[[false,true,true,true,false],[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true],[false,true,true,true,false]],
    'P':[[true,true,true,true,false],[true,false,false,false,true],[true,false,false,false,true],[true,true,true,true,false],[true,false,false,false,false],[true,false,false,false,false],[true,false,false,false,false]],
    'Q':[[false,true,true,true,false],[true,false,false,false,true],[true,false,false,false,true],[true,false,true,false,true],[true,false,false,true,true],[false,true,true,true,false],[false,false,false,false,true]],
    'R':[[true,true,true,true,false],[true,false,false,false,true],[true,false,false,false,true],[true,true,true,true,false],[true,false,true,false,false],[true,false,false,true,false],[true,false,false,false,true]],
    'S':[[false,true,true,true,false],[true,false,false,false,false],[false,true,true,true,false],[false,false,false,false,true],[true,true,true,true,false],[false,false,false,false,false],[false,false,false,false,false]],
    'T':[[true,true,true,true,true],[false,false,true,false,false],[false,false,true,false,false],[false,false,true,false,false],[false,false,true,false,false],[false,false,true,false,false],[false,false,true,false,false]],
    'U':[[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true],[false,true,true,true,false]],
    'V':[[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true],[false,true,false,true,false],[false,true,false,true,false],[false,false,true,false,false],[false,false,true,false,false]],
    'W':[[true,false,false,false,true],[true,false,false,false,true],[true,false,true,false,true],[true,false,true,false,true],[true,true,false,true,true],[true,true,false,true,true],[false,false,false,false,false]],
    'X':[[true,false,false,false,true],[false,true,false,true,false],[false,false,true,false,false],[false,false,true,false,false],[false,true,false,true,false],[true,false,false,false,true],[false,false,false,false,false]],
    'Y':[[true,false,false,false,true],[true,false,false,false,true],[false,true,false,true,false],[false,false,true,false,false],[false,false,true,false,false],[false,false,true,false,false],[false,false,true,false,false]],
    'Z':[[true,true,true,true,true],[false,false,false,true,false],[false,false,true,false,false],[false,true,false,false,false],[true,false,false,false,false],[true,true,true,true,true],[false,false,false,false,false]],
    ' ': [[false,false,false,false,false],[false,false,false,false,false],[false,false,false,false,false],[false,false,false,false,false],[false,false,false,false,false],[false,false,false,false,false],[false,false,false,false,false]],
    '0':[[false,true,true,true,false],[true,false,false,true,true],[true,false,true,false,true],[true,true,false,false,true],[false,true,true,true,false],[false,false,false,false,false],[false,false,false,false,false]],
    '1':[[false,false,true,false,false],[false,true,true,false,false],[false,false,true,false,false],[false,false,true,false,false],[false,false,true,false,false],[false,true,true,true,false],[false,false,false,false,false]],
    '2':[[false,true,true,true,false],[true,false,false,false,true],[false,false,false,true,false],[false,false,true,false,false],[false,true,false,false,false],[true,true,true,true,true],[false,false,false,false,false]],
    '3':[[true,true,true,true,false],[false,false,false,false,true],[false,true,true,true,false],[false,false,false,false,true],[true,true,true,true,false],[false,false,false,false,false],[false,false,false,false,false]],
    '4':[[true,false,false,true,false],[true,false,false,true,false],[true,true,true,true,true],[false,false,false,true,false],[false,false,false,true,false],[false,false,false,false,false],[false,false,false,false,false]],
    '5':[[true,true,true,true,true],[true,false,false,false,false],[true,true,true,true,false],[false,false,false,false,true],[true,true,true,true,false],[false,false,false,false,false],[false,false,false,false,false]],
    '6':[[false,true,true,true,false],[true,false,false,false,false],[true,true,true,true,false],[true,false,false,false,true],[false,true,true,true,false],[false,false,false,false,false],[false,false,false,false,false]],
    '7':[[true,true,true,true,true],[false,false,false,false,true],[false,false,false,true,false],[false,false,true,false,false],[false,true,false,false,false],[false,false,false,false,false],[false,false,false,false,false]],
    '8':[[false,true,true,true,false],[true,false,false,false,true],[false,true,true,true,false],[true,false,false,false,true],[false,true,true,true,false],[false,false,false,false,false],[false,false,false,false,false]],
    '9':[[false,true,true,true,false],[true,false,false,false,true],[false,true,true,true,true],[false,false,false,false,true],[false,true,true,true,false],[false,false,false,false,false],[false,false,false,false,false]],
    '.':[[false,false,false,false,false],[false,false,false,false,false],[false,false,false,false,false],[false,false,false,false,false],[false,false,false,false,false],[false,true,true,false,false],[false,true,true,false,false]],
    '!':[[false,false,true,false,false],[false,false,true,false,false],[false,false,true,false,false],[false,false,true,false,false],[false,false,false,false,false],[false,false,true,false,false],[false,false,false,false,false]],
};

export function generateTextColumnBuffer(text: string): (boolean[])[] {
    const buffer: (boolean[])[] = [];
    const upperText = text.toUpperCase();
    const yOffset = Math.floor((GRID_SIZE - CHAR_HEIGHT) / 2);

    for (const char of upperText) {
        const charData = FONT_DATA[char] || FONT_DATA[' '];
        if (charData) {
            for (let c = 0; c < CHAR_WIDTH; c++) {
                const colBuffer: boolean[] = Array(GRID_SIZE).fill(false);
                for (let r = 0; r < CHAR_HEIGHT; r++) {
                    if (yOffset + r >= 0 && yOffset + r < GRID_SIZE) {
                        colBuffer[yOffset + r] = charData[r][c];
                    }
                }
                buffer.push(colBuffer);
            }
            for (let s = 0; s < CHAR_SPACING; s++) {
                buffer.push(Array(GRID_SIZE).fill(false));
            }
        }
    }
    return buffer;
}
