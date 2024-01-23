import { OcLib } from "./OcLib";

class _OpenCascade {

    public test_oc0() {
        let holeRadius = 5;
        let sphere = OcLib.Box(50 * 2, 50 * 2, 50 * 2, [-50, -50, -50]);
        let cylinderZ = OcLib.Cylinder(holeRadius, 200, true);
        let cylinderY = OcLib.Rotate([0, 1, 0], 90, cylinderZ, true);

        let count = 4;
        let space = 18;
        let offset = 18 * count * 0.5;
        let holos = [];
        for (let i = 0; i < count; i++) {
            for (let j = 0; j < count; j++) {
                let cylinder1 = OcLib.Translate([i * space - offset, j * space - offset, 0], cylinderZ);
                let cylinder2 = OcLib.Translate([0, j * space - offset, i * space - offset], cylinderY);
                holos.push(cylinder1);
                holos.push(cylinder2);
            }
        }

        let holo = OcLib.Union(holos);

        // let s1 = OcLib.Translate([0, 0, 50], OcLib.Difference(sphere, [holo]));
        let s2 = OcLib.Translate([-40, -55, 0], OcLib.Text3D("ORILLISION", 14, 2.15, 'Consolas'));
        s2 = OcLib.Rotate([1, 0, 0], 180, s2);
        s2 = OcLib.Rotate([0, 1, 0], 90, s2);
        let s1 = OcLib.Translate([0, 0, 50], OcLib.Difference(sphere, [s2, holo]));
        // return [s1, s3];
        return [s1];
    }

    public test_oc1() {
        // let s1 = OcLib.Translate([0, 0, 50], OcLib.Difference(sphere, [holo]));
        let s2 = OcLib.Translate([-40, -55, 0], OcLib.Text3D("ORILLISION", 14, 2.15, 'Consolas'));
        return [s2];
    }

    public test_oc2() {
        let size = 25;
        let sphereShape = OcLib.Sphere(size);
        let shapes = [];
        for (let i = 0; i < 5; i++) {
            let sphereShape = OcLib.Sphere(Math.random() * size + 5);
            let cylinder1 = OcLib.Translate([
                Math.random() * size - size * 0.5,
                Math.random() * size - size * 0.5,
                Math.random() * size - size * 0.5,
            ], sphereShape);
            shapes.push(cylinder1);
        }
        let holo = OcLib.Union(shapes);
        let end = OcLib.Difference(sphereShape, [holo]);
        return [end];
    }
}

export let OpenCascade: _OpenCascade = new _OpenCascade();