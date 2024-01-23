import opentype from "opentype.js";
export var fonts = {};

// export async function loadOpentypeFont(preloadedFonts: string[]) {
//     return new Promise<void>((resolve, reject) => {
//         Promise.all(preloadedFonts.map(async (fontPath) => {
//             let font = await opentype.load(fontPath, null, undefined);
//             let fontName = fontPath.split("fonts/")[1].split(".ttf")[0];
//             fonts[fontName] = font;
//         })).then(() => {
//             resolve();
//         });
//     });
// }

export async function loadOpentypeFont(preloadedFonts: string[]) {
    return await Promise.all(preloadedFonts.map(async (fontPath) => {
        let font = await opentype.load(fontPath, null, undefined);
        let fontName = fontPath.split("fonts/")[1].split(".ttf")[0];
        fonts[fontName] = font;
    }))
}