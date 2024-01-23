import { loadOpentypeFont } from "../opentype";
import opencascade from "./opencascade.wasm";

export var oc: any;

export default async function initOpencascade() {
    await loadOpentypeFont(['fonts/Roboto.ttf',
        'fonts/Papyrus.ttf', 'fonts/Consolas.ttf']);
    oc = await opencascade();
    return oc;
}