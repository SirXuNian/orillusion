import { oc } from "../../packages/opencascade";
import { fonts } from "../../packages/opentype";
import { CascadeStudioStandardUtils } from "./CascadeStudioStandardUtils";

class _OcLib {
  public sceneShapes: any = [];
  public Box(x, y, z, centered?) {
    if (!centered) { centered = false; }
    let curBox = CascadeStudioStandardUtils.CacheOp("Box", arguments, () => {
      // Construct a Box Primitive
      let box = new oc.BRepPrimAPI_MakeBox(x, y, z).Shape();
      if (centered) {
        return OcLib.Translate([-x / 2, -y / 2, -z / 2], box);
      } else {
        return box;
      }
    });

    this.sceneShapes.push(curBox);
    return curBox;
  }

  public Sphere(radius) {
    let curSphere = CascadeStudioStandardUtils.CacheOp("Sphere", arguments, () => {
      // Construct a Sphere Primitive
      let spherePlane = new oc.gp_Ax2(new oc.gp_Pnt(0, 0, 0), oc.gp.prototype.DZ());
      return new oc.BRepPrimAPI_MakeSphere(spherePlane, radius).Shape();
    });

    this.sceneShapes.push(curSphere);
    return curSphere;
  }

  public Cylinder(radius, height, centered) {
    let curCylinder = CascadeStudioStandardUtils.CacheOp("Cylinder", arguments, () => {
      let cylinderPlane = new oc.gp_Ax2(new oc.gp_Pnt(0, 0, centered ? -height / 2 : 0), new oc.gp_Dir(0, 0, 1));
      return new oc.BRepPrimAPI_MakeCylinder(cylinderPlane, radius, height).Shape();
    });
    this.sceneShapes.push(curCylinder);
    return curCylinder;
  }

  public Cone(radius1, radius2, height) {
    let curCone = CascadeStudioStandardUtils.CacheOp("Cone", arguments, () => {
      return new oc.BRepPrimAPI_MakeCone(radius1, radius2, height).Shape();
    });
    this.sceneShapes.push(curCone);
    return curCone;
  }

  public Polygon(points, wire) {
    let curPolygon = CascadeStudioStandardUtils.CacheOp("Polygon", arguments, () => {
      let gpPoints: any = [];
      for (let ind = 0; ind < points.length; ind++) {
        gpPoints.push(CascadeStudioStandardUtils.convertToPnt(points[ind]));
      }

      let polygonWire = new oc.BRepBuilderAPI_MakeWire();
      for (let ind = 0; ind < points.length - 1; ind++) {
        let seg = new oc.GC_MakeSegment(gpPoints[ind], gpPoints[ind + 1]).Value();
        let edge = new oc.BRepBuilderAPI_MakeEdge(seg).Edge();
        let innerWire = new oc.BRepBuilderAPI_MakeWire(edge).Wire();
        polygonWire.Add(innerWire);
      }
      let seg2 = new oc.GC_MakeSegment(gpPoints[points.length - 1], gpPoints[0]).Value();
      let edge2 = new oc.BRepBuilderAPI_MakeEdge(seg2).Edge();
      let innerWire2 = new oc.BRepBuilderAPI_MakeWire(edge2).Wire();
      polygonWire.Add(innerWire2);
      let finalWire = polygonWire.Wire();

      if (wire) {
        return finalWire;
      } else {
        return new oc.BRepBuilderAPI_MakeFace(finalWire).Face();
      }
    });
    this.sceneShapes.push(curPolygon);
    return curPolygon;
  }

  public Circle(radius, wire) {
    let curCircle = CascadeStudioStandardUtils.CacheOp("Circle", arguments, () => {
      let circle = new oc.GC_MakeCircle(new oc.gp_Ax2(new oc.gp_Pnt(0, 0, 0),
        new oc.gp_Dir(0, 0, 1)), radius).Value();
      let edge = new oc.BRepBuilderAPI_MakeEdge(circle).Edge();
      let circleWire = new oc.BRepBuilderAPI_MakeWire(edge).Wire();
      if (wire) { return circleWire; }
      return new oc.BRepBuilderAPI_MakeFace(circleWire).Face();
    });
    this.sceneShapes.push(curCircle);
    return curCircle;
  }

  public BSpline(inPoints, closed) {
    let curSpline = CascadeStudioStandardUtils.CacheOp("BSpline", arguments, () => {
      let ptList = new oc.TColgp_Array1OfPnt(1, inPoints.length + (closed ? 1 : 0));
      for (let pIndex = 1; pIndex <= inPoints.length; pIndex++) {
        ptList.SetValue(pIndex, CascadeStudioStandardUtils.convertToPnt(inPoints[pIndex - 1]));
      }
      if (closed) { ptList.SetValue(inPoints.length + 1, ptList.Value(1)); }

      let geomCurveHandle = new oc.GeomAPI_PointsToBSpline(ptList).Curve();
      let edge = new oc.BRepBuilderAPI_MakeEdge(geomCurveHandle).Edge();
      return new oc.BRepBuilderAPI_MakeWire(edge).Wire();
    });
    this.sceneShapes.push(curSpline);
    return curSpline;
  }

  public Text3D(text, size, height, fontName) {
    if (!size) { size = 36; }
    if (!height && height !== 0.0) { height = 0.15; }
    if (!fontName) { fontName = "Roboto"; }

    let textArgs = JSON.stringify(arguments);
    let curText = CascadeStudioStandardUtils.CacheOp("Text3D", arguments, () => {
      if (fonts[fontName] === undefined) { const argCache = {}; console.log("Font not loaded or found yet!  Try again..."); return; }
      let textFaces: any = [];
      let commands = fonts[fontName].getPath(text, 0, 0, size).commands;
      for (let idx = 0; idx < commands.length; idx++) {
        if (commands[idx].type === "M") {
          // Start a new Glyph
          var firstPoint = new oc.gp_Pnt(commands[idx].x, commands[idx].y, 0);
          var lastPoint = firstPoint;
          var currentWire = new oc.BRepBuilderAPI_MakeWire();
        } else if (commands[idx].type === "Z") {
          // End the current Glyph and Finish the Path
          try {
            let faceBuilder: any = null;
            if (textFaces.length > 0) {
              faceBuilder = new oc.BRepBuilderAPI_MakeFace(
                textFaces[textFaces.length - 1], currentWire.Wire());
            } else {
              faceBuilder = new oc.BRepBuilderAPI_MakeFace(currentWire.Wire());
            }

            textFaces.push(faceBuilder.Face());
          } catch (e) {
            console.error("ERROR: OCC encountered malformed characters when constructing faces from this font (likely self-intersections)!  Try using a more robust font like 'Roboto'.");
          }
        } else if (commands[idx].type === "L") {
          let nextPoint = new oc.gp_Pnt(commands[idx].x, commands[idx].y, 0);
          if (lastPoint.X() === nextPoint.X() && lastPoint.Y() === nextPoint.Y()) { continue; }
          let lineSegment = new oc.GC_MakeSegment(lastPoint, nextPoint).Value();
          let lineEdge = new oc.BRepBuilderAPI_MakeEdge(lineSegment).Edge();
          currentWire.Add(new oc.BRepBuilderAPI_MakeWire(lineEdge).Wire());
          lastPoint = nextPoint;
        } else if (commands[idx].type === "Q") {
          let controlPoint = new oc.gp_Pnt(commands[idx].x1, commands[idx].y1, 0);
          let nextPoint = new oc.gp_Pnt(commands[idx].x, commands[idx].y, 0);

          let ptList = new oc.TColgp_Array1OfPnt(1, 3);
          ptList.SetValue(1, lastPoint);
          ptList.SetValue(2, controlPoint);
          ptList.SetValue(3, nextPoint);
          let quadraticCurve = new oc.Geom_BezierCurve(ptList);
          let lineEdge = new oc.BRepBuilderAPI_MakeEdge(new oc.Handle_Geom_BezierCurve(quadraticCurve)).Edge();
          currentWire.Add(new oc.BRepBuilderAPI_MakeWire(lineEdge).Wire());

          lastPoint = nextPoint;
        } else if (commands[idx].type === "C") {
          let controlPoint1 = new oc.gp_Pnt(commands[idx].x1, commands[idx].y1, 0);
          let controlPoint2 = new oc.gp_Pnt(commands[idx].x2, commands[idx].y2, 0);
          let nextPoint = new oc.gp_Pnt(commands[idx].x, commands[idx].y, 0);

          let ptList = new oc.TColgp_Array1OfPnt(1, 4);
          ptList.SetValue(1, lastPoint);
          ptList.SetValue(2, controlPoint1);
          ptList.SetValue(3, controlPoint2);
          ptList.SetValue(4, nextPoint);
          let cubicCurve = new oc.Geom_BezierCurve(ptList);
          let lineEdge = new oc.BRepBuilderAPI_MakeEdge(new oc.Handle_Geom_BezierCurve(cubicCurve)).Edge();
          currentWire.Add(new oc.BRepBuilderAPI_MakeWire(lineEdge).Wire());

          lastPoint = nextPoint;
        }
      }

      if (height === 0) {
        return textFaces[textFaces.length - 1];
      } else {
        textFaces[textFaces.length - 1].hash = CascadeStudioStandardUtils.stringToHash(textArgs);
        let textSolid = OcLib.Rotate([1, 0, 0], -90, OcLib.Extrude(textFaces[textFaces.length - 1], [0, 0, height * size]));
        this.sceneShapes = CascadeStudioStandardUtils.Remove(this.sceneShapes, textSolid);
        return textSolid;
      }
    });

    this.sceneShapes.push(curText);
    return curText;
  }

  // These foreach functions are not cache friendly right now!
  public ForEachSolid(shape, callback) {
    let solid_index = 0;
    let anExplorer = new oc.TopExp_Explorer(shape, oc.TopAbs_SOLID);
    for (anExplorer.Init(shape, oc.TopAbs_SOLID); anExplorer.More(); anExplorer.Next()) {
      callback(solid_index++, oc.TopoDS.prototype.Solid(anExplorer.Current()));
    }
  }
  public GetNumSolidsInCompound(shape) {
    if (!shape || shape.ShapeType() > 1 || shape.IsNull()) { console.error("Not a compound shape!"); return shape; }
    let solidsFound = 0;
    OcLib.ForEachSolid(shape, (i, s) => { solidsFound++; });
    return solidsFound;
  }
  public GetSolidFromCompound(shape, index, keepOriginal?) {
    if (!shape || shape.ShapeType() > 1 || shape.IsNull()) { console.error("Not a compound shape!"); return shape; }
    if (!index) { index = 0; }

    let sol = CascadeStudioStandardUtils.CacheOp("GetSolidFromCompound", arguments, () => {
      let innerSolid: any = {}; let solidsFound = 0;
      OcLib.ForEachSolid(shape, (i, s) => {
        if (i === index) { innerSolid = new oc.TopoDS_Solid(s); } solidsFound++;
      });
      if (solidsFound === 0) { console.error("NO SOLIDS FOUND IN SHAPE!"); innerSolid = shape; }
      innerSolid.hash = shape.hash + 1;
      return innerSolid;
    });

    if (!keepOriginal) { this.sceneShapes = CascadeStudioStandardUtils.Remove(this.sceneShapes, shape); }
    this.sceneShapes.push(sol);

    return sol;
  }

  public ForEachShell(shape, callback) {
    let shell_index = 0;
    let anExplorer = new oc.TopExp_Explorer(shape, oc.TopAbs_SHELL);
    for (anExplorer.Init(shape, oc.TopAbs_SHELL); anExplorer.More(); anExplorer.Next()) {
      callback(shell_index++, oc.TopoDS.prototype.Shell(anExplorer.Current()));
    }
  }

  public ForEachFace(shape, callback) {
    let face_index = 0;
    let anExplorer = new oc.TopExp_Explorer(shape, oc.TopAbs_FACE, oc.TopAbs_SHAPE);
    for (anExplorer.Init(shape, oc.TopAbs_FACE); anExplorer.More(); anExplorer.Next()) {
      callback(face_index++, oc.TopoDS.prototype.Face(anExplorer.Current()));
    }
  }

  public ForEachWire(shape, callback) {
    let wire_index = 0;
    let anExplorer = new oc.TopExp_Explorer(shape, oc.TopAbs_WIRE);
    for (anExplorer.Init(shape, oc.TopAbs_WIRE); anExplorer.More(); anExplorer.Next()) {
      callback(wire_index++, oc.TopoDS.prototype.Wire(anExplorer.Current()));
    }
  }
  public GetWire(shape, index?, keepOriginal?) {
    if (!shape || shape.ShapeType() > 4 || shape.IsNull()) { console.error("Not a wire shape!"); return shape; }
    if (!index) { index = 0; }

    let wire = CascadeStudioStandardUtils.CacheOp("GetWire", arguments, () => {
      let innerWire: any = {}; let wiresFound = 0;
      OcLib.ForEachWire(shape, (i, s) => {
        if (i === index) { innerWire = new oc.TopoDS_Wire(s); } wiresFound++;
      });
      if (wiresFound === 0) { console.error("NO WIRES FOUND IN SHAPE!"); innerWire = shape; }
      innerWire.hash = shape.hash + 1;
      return innerWire;
    });

    if (!keepOriginal) { this.sceneShapes = CascadeStudioStandardUtils.Remove(this.sceneShapes, shape); }
    this.sceneShapes.push(wire);

    return wire;
  }

  public ForEachEdge(shape, callback) {
    let edgeHashes = {};
    let edgeIndex = 0;
    let anExplorer = new oc.TopExp_Explorer(shape, oc.TopAbs_EDGE);
    for (anExplorer.Init(shape, oc.TopAbs_EDGE); anExplorer.More(); anExplorer.Next()) {
      let edge = oc.TopoDS.prototype.Edge(anExplorer.Current());
      let edgeHash = edge.HashCode(100000000);
      if (!edgeHashes.hasOwnProperty(edgeHash)) {
        edgeHashes[edgeHash] = edgeIndex;
        callback(edgeIndex++, edge);
      }
    }
    return edgeHashes;
  }

  public ForEachVertex(shape, callback) {
    let anExplorer = new oc.TopExp_Explorer(shape, oc.TopAbs_VERTEX);
    for (anExplorer.Init(shape, oc.TopAbs_VERTEX); anExplorer.More(); anExplorer.Next()) {
      callback(oc.TopoDS.prototype.Vertex(anExplorer.Current()));
    }
  }

  public FilletEdges(shape, radius, edgeList, keepOriginal) {
    let curFillet = CascadeStudioStandardUtils.CacheOp("FilletEdges", arguments, () => {
      let mkFillet = new oc.BRepFilletAPI_MakeFillet(shape);
      let foundEdges = 0;
      OcLib.ForEachEdge(shape, (index, edge) => {
        if (edgeList.includes(index)) { mkFillet.Add(radius, edge); foundEdges++; }
      });
      if (foundEdges == 0) {
        console.error("Fillet Edges Not Found!  Make sure you are looking at the object _before_ the Fillet is applied!");
        return new oc.TopoDS_Solid(shape);
      }
      return new oc.TopoDS_Solid(mkFillet.Shape());
    });
    this.sceneShapes.push(curFillet);
    if (!keepOriginal) { this.sceneShapes = CascadeStudioStandardUtils.Remove(this.sceneShapes, shape); }
    return curFillet;
  }

  public ChamferEdges(shape, distance, edgeList, keepOriginal) {
    let curChamfer = CascadeStudioStandardUtils.CacheOp("ChamferEdges", arguments, () => {
      let mkChamfer = new oc.BRepFilletAPI_MakeChamfer(shape);
      let foundEdges = 0;
      OcLib.ForEachEdge(shape, (index, edge) => {
        if (edgeList.includes(index)) { mkChamfer.Add(distance, edge); foundEdges++; }
      });
      if (foundEdges == 0) {
        console.error("Chamfer Edges Not Found!  Make sure you are looking at the object _before_ the Chamfer is applied!");
        return new oc.TopoDS_Solid(shape);
      }
      return new oc.TopoDS_Solid(mkChamfer.Shape());
    });
    this.sceneShapes.push(curChamfer);
    if (!keepOriginal) { this.sceneShapes = CascadeStudioStandardUtils.Remove(this.sceneShapes, shape); }
    return curChamfer;
  }

  public Transform(translation, rotation, scale, shapes) {
    let args = arguments;
    return CascadeStudioStandardUtils.CacheOp("Transform", arguments, () => {
      if (args.length == 4) {
        // Create the transform gizmo and add it to the scene
        // postMessage({ "type": "createTransformHandle", payload: { translation: translation, rotation: rotation, scale: scale, lineAndColumn: CascadeStudioStandardUtils.getCallingLocation() } });
        // Transform the Object(s)
        return OcLib.Translate(translation, OcLib.Rotate(rotation[0], rotation[1], OcLib.Scale(scale, shapes)));
      } else {
        // Create the transform gizmo and add it to the scene
        // postMessage({ "type": "createTransformHandle", payload: { translation: [0, 0, 0], rotation: [[0, 1, 0], 1], scale: 1, lineAndColumn: CascadeStudioStandardUtils.getCallingLocation() } });
        return translation; // The first element will be the shapes
      }
    });
  }

  public Translate(offset, shapes, keepOriginal?) {
    let translated = CascadeStudioStandardUtils.CacheOp("Translate", arguments, () => {
      let transformation = new oc.gp_Trsf();
      transformation.SetTranslation(new oc.gp_Vec(offset[0], offset[1], offset[2]));
      let translation = new oc.TopLoc_Location(transformation);
      if (!CascadeStudioStandardUtils.isArrayLike(shapes)) {
        return new oc.TopoDS_Shape(shapes.Moved(translation));
      } else if (shapes.length >= 1) {      // Do the normal translation
        let newTrans: any = [];
        for (let shapeIndex = 0; shapeIndex < shapes.length; shapeIndex++) {
          newTrans.push(new oc.TopoDS_Shape(shapes[shapeIndex].Moved(translation)));
        }
        return newTrans;
      }
    });

    if (!keepOriginal) { this.sceneShapes = CascadeStudioStandardUtils.Remove(this.sceneShapes, shapes); }
    this.sceneShapes.push(translated);

    return translated;
  }

  public Rotate(axis, degrees, shapes, keepOriginal?) {
    let rotated = null;
    if (degrees === 0) {
      rotated = new oc.TopoDS_Shape(shapes);
    } else {
      rotated = CascadeStudioStandardUtils.CacheOp("Rotate", arguments, () => {
        let newRot;
        let transformation = new oc.gp_Trsf();
        transformation.SetRotation(
          new oc.gp_Ax1(new oc.gp_Pnt(0, 0, 0), new oc.gp_Dir(
            new oc.gp_Vec(axis[0], axis[1], axis[2]))), degrees * 0.0174533);
        let rotation = new oc.TopLoc_Location(transformation);
        if (!CascadeStudioStandardUtils.isArrayLike(shapes)) {
          newRot = new oc.TopoDS_Shape(shapes.Moved(rotation));
        } else if (shapes.length >= 1) {      // Do the normal rotation
          for (let shapeIndex = 0; shapeIndex < shapes.length; shapeIndex++) {
            shapes[shapeIndex].Move(rotation);
          }
        }
        return newRot;
      });
    }
    if (!keepOriginal) { this.sceneShapes = CascadeStudioStandardUtils.Remove(this.sceneShapes, shapes); }
    this.sceneShapes.push(rotated);
    return rotated;
  }

  public Mirror(vector, shapes, keepOriginal) {
    if (!vector) { vector = [1, 0, 0]; }
    const mirrored = CascadeStudioStandardUtils.CacheOp("Mirror", arguments, () => {
      const mirrorTransform = new oc.gp_Trsf();
      const mirrorPlaneOrigin = new oc.gp_Pnt(0, 0, 0);
      const mirrorPlaneNormal = new oc.gp_Dir(vector[0], vector[1], vector[2]);
      mirrorTransform.SetMirror(new oc.gp_Ax2(mirrorPlaneOrigin, mirrorPlaneNormal));

      if (!CascadeStudioStandardUtils.isArrayLike(shapes)) {
        return new oc.BRepBuilderAPI_Transform(shapes, mirrorTransform).Shape();
      } else if (shapes.length >= 1) {
        let newMirroring: any = [];
        for (let shapeIndex = 0; shapeIndex < shapes.length; shapeIndex++) {
          newMirroring.push(new oc.BRepBuilderAPI_Transform(shapes, mirrorTransform).Shape());
        }
        return newMirroring;
      }
    })
    if (!keepOriginal) { this.sceneShapes = CascadeStudioStandardUtils.Remove(this.sceneShapes, shapes); }
    this.sceneShapes.push(mirrored);

    return mirrored;
  }

  public Scale(scale, shapes, keepOriginal?) {
    let scaled = CascadeStudioStandardUtils.CacheOp("Scale", arguments, () => {
      let transformation = new oc.gp_Trsf();
      transformation.SetScaleFactor(scale);
      let scaling = new oc.TopLoc_Location(transformation);
      if (!CascadeStudioStandardUtils.isArrayLike(shapes)) {
        return new oc.TopoDS_Shape(shapes.Moved(scaling));
      } else if (shapes.length >= 1) {      // Do the normal rotation
        let newScale: any = [];
        for (let shapeIndex = 0; shapeIndex < shapes.length; shapeIndex++) {
          newScale.push(new oc.TopoDS_Shape(shapes[shapeIndex].Moved(scaling)));
        }
        return newScale;
      }
    });

    if (!keepOriginal) { this.sceneShapes = CascadeStudioStandardUtils.Remove(this.sceneShapes, shapes); }
    this.sceneShapes.push(scaled);

    return scaled;
  }

  // TODO: These ops can be more cache optimized since they're multiple sequential ops
  public Union(objectsToJoin, keepObjects?, fuzzValue?, keepEdges?) {
    if (!fuzzValue) { fuzzValue = 0.1; }
    let curUnion = CascadeStudioStandardUtils.CacheOp("Union", arguments, () => {
      let combined = new oc.TopoDS_Shape(objectsToJoin[0]);
      if (objectsToJoin.length > 1) {
        for (let i = 0; i < objectsToJoin.length; i++) {
          if (i > 0) {
            let combinedFuse = new oc.BRepAlgoAPI_Fuse(combined, objectsToJoin[i]);
            combinedFuse.SetFuzzyValue(fuzzValue);
            combinedFuse.Build();
            combined = combinedFuse.Shape();
          }
        }
      }

      if (!keepEdges) {
        let fusor = new oc.ShapeUpgrade_UnifySameDomain(combined); fusor.Build();
        combined = fusor.Shape();
      }

      return combined;
    });

    for (let i = 0; i < objectsToJoin.length; i++) {
      if (!keepObjects) { this.sceneShapes = CascadeStudioStandardUtils.Remove(this.sceneShapes, objectsToJoin[i]); }
    }
    this.sceneShapes.push(curUnion);
    return curUnion;
  }

  public Difference(mainBody, objectsToSubtract, keepObjects?, fuzzValue?, keepEdges?) {
    if (!fuzzValue) { fuzzValue = 0.1; }
    let curDifference = CascadeStudioStandardUtils.CacheOp("Difference", arguments, () => {
      if (!mainBody || mainBody.IsNull()) { console.error("Main Shape in Difference is null!"); }

      let difference = new oc.TopoDS_Shape(mainBody);
      if (objectsToSubtract.length >= 1) {
        for (let i = 0; i < objectsToSubtract.length; i++) {
          if (!objectsToSubtract[i] || objectsToSubtract[i].IsNull()) { console.error("Tool in Difference is null!"); }
          let differenceCut = new oc.BRepAlgoAPI_Cut(difference, objectsToSubtract[i]);
          differenceCut.SetFuzzyValue(fuzzValue);
          differenceCut.Build();
          difference = differenceCut.Shape();
        }
      }

      if (!keepEdges) {
        let fusor = new oc.ShapeUpgrade_UnifySameDomain(difference); fusor.Build();
        difference = fusor.Shape();
      }

      difference.hash = CascadeStudioStandardUtils.ComputeHash("Difference", arguments);
      if (OcLib.GetNumSolidsInCompound(difference) === 1) {
        difference = OcLib.GetSolidFromCompound(difference, 0);
      }

      return difference;
    });

    if (Array.isArray(keepObjects)) {
      if (!keepObjects[0]) { this.sceneShapes = CascadeStudioStandardUtils.Remove(this.sceneShapes, mainBody); }
      for (let i = 0; i < objectsToSubtract.length; i++) {
        if (!keepObjects[1]) { this.sceneShapes = CascadeStudioStandardUtils.Remove(this.sceneShapes, objectsToSubtract[i]); }
      }
    } else {
      if (!keepObjects) { this.sceneShapes = CascadeStudioStandardUtils.Remove(this.sceneShapes, mainBody); }
      for (let i = 0; i < objectsToSubtract.length; i++) {
        if (!keepObjects) { this.sceneShapes = CascadeStudioStandardUtils.Remove(this.sceneShapes, objectsToSubtract[i]); }
      }
    }

    this.sceneShapes.push(curDifference);
    return curDifference;
  }

  public Intersection(objectsToIntersect, keepObjects, fuzzValue, keepEdges) {
    if (!fuzzValue) { fuzzValue = 0.1; }
    let curIntersection = CascadeStudioStandardUtils.CacheOp("Intersection", arguments, () => {
      let intersected = new oc.TopoDS_Shape(objectsToIntersect[0]);
      if (objectsToIntersect.length > 1) {
        for (let i = 0; i < objectsToIntersect.length; i++) {
          if (i > 0) {
            let intersectedCommon = new oc.BRepAlgoAPI_Common(intersected, objectsToIntersect[i]);
            intersectedCommon.SetFuzzyValue(fuzzValue);
            intersectedCommon.Build();
            intersected = intersectedCommon.Shape();
          }
        }
      }

      if (!keepEdges) {
        let fusor = new oc.ShapeUpgrade_UnifySameDomain(intersected); fusor.Build();
        intersected = fusor.Shape();
      }

      return intersected;
    });

    for (let i = 0; i < objectsToIntersect.length; i++) {
      if (!keepObjects) { this.sceneShapes = CascadeStudioStandardUtils.Remove(this.sceneShapes, objectsToIntersect[i]); }
    }
    this.sceneShapes.push(curIntersection);
    return curIntersection;
  }

  public Extrude(face, direction, keepFace?) {
    let curExtrusion = CascadeStudioStandardUtils.CacheOp("Extrude", arguments, () => {
      return new oc.BRepPrimAPI_MakePrism(face,
        new oc.gp_Vec(direction[0], direction[1], direction[2])).Shape();
    });

    if (!keepFace) { this.sceneShapes = CascadeStudioStandardUtils.Remove(this.sceneShapes, face); }
    this.sceneShapes.push(curExtrusion);
    return curExtrusion;
  }

  public RemoveInternalEdges(shape, keepShape) {
    let cleanShape = CascadeStudioStandardUtils.CacheOp("RemoveInternalEdges", arguments, () => {
      let fusor = new oc.ShapeUpgrade_UnifySameDomain(shape);
      fusor.Build();
      return fusor.Shape();
    });

    if (!keepShape) { this.sceneShapes = CascadeStudioStandardUtils.Remove(this.sceneShapes, shape); }
    this.sceneShapes.push(cleanShape);
    return cleanShape;
  }

  public Offset(shape, offsetDistance, tolerance, keepShape) {
    if (!shape || shape.IsNull()) { console.error("Offset received Null Shape!"); }
    if (!tolerance) { tolerance = 0.1; }
    if (offsetDistance === 0.0) { return shape; }
    let curOffset = CascadeStudioStandardUtils.CacheOp("Offset", arguments, () => {
      let offset: any = null;
      if (shape.ShapeType() === 5) {
        offset = new oc.BRepOffsetAPI_MakeOffset();
        offset.AddWire(shape);
        offset.Perform(offsetDistance);
      } else {
        offset = new oc.BRepOffsetAPI_MakeOffsetShape();
        offset.PerformByJoin(shape, offsetDistance, tolerance);
      }
      let offsetShape = new oc.TopoDS_Shape(offset.Shape());

      // Convert Shell to Solid as is expected
      if (offsetShape.ShapeType() == 3) {
        let solidOffset = new oc.BRepBuilderAPI_MakeSolid();
        solidOffset.Add(offsetShape);
        offsetShape = new oc.TopoDS_Solid(solidOffset.Solid());
      }

      return offsetShape;
    });

    if (!keepShape) { this.sceneShapes = CascadeStudioStandardUtils.Remove(this.sceneShapes, shape); }
    this.sceneShapes.push(curOffset);
    return curOffset;
  }

  public Revolve(shape, degrees, direction, keepShape, copy) {
    if (!degrees) { degrees = 360.0; }
    if (!direction) { direction = [0, 0, 1]; }
    let curRevolution = CascadeStudioStandardUtils.CacheOp("Revolve", arguments, () => {
      if (degrees >= 360.0) {
        return new oc.BRepPrimAPI_MakeRevol(shape,
          new oc.gp_Ax1(new oc.gp_Pnt(0, 0, 0),
            new oc.gp_Dir(direction[0], direction[1], direction[2])),
          copy).Shape();
      } else {
        return new oc.BRepPrimAPI_MakeRevol(shape,
          new oc.gp_Ax1(new oc.gp_Pnt(0, 0, 0),
            new oc.gp_Dir(direction[0], direction[1], direction[2])),
          degrees * 0.0174533, copy).Shape();
      }
    });

    if (!keepShape) { this.sceneShapes = CascadeStudioStandardUtils.Remove(this.sceneShapes, shape); }
    this.sceneShapes.push(curRevolution);
    return curRevolution;
  }

  public RotatedExtrude(wire, height, rotation, keepWire) {
    if (!wire || wire.IsNull()) { console.error("RotatedExtrude received Null Wire!"); }
    let curExtrusion = CascadeStudioStandardUtils.CacheOp("RotatedExtrude", arguments, () => {
      let upperPolygon = OcLib.Rotate([0, 0, 1], rotation, OcLib.Translate([0, 0, height], wire, true));
      this.sceneShapes = CascadeStudioStandardUtils.Remove(this.sceneShapes, upperPolygon);

      // Define the straight spine going up the middle of the sweep
      let spineWire = OcLib.BSpline([
        [0, 0, 0],
        [0, 0, height]], false);
      this.sceneShapes = CascadeStudioStandardUtils.Remove(this.sceneShapes, spineWire); // Don't render these

      // Define the guiding helical auxiliary spine (which controls the rotation)
      let steps = 30;
      let aspinePoints: any = [];
      for (let i = 0; i <= steps; i++) {
        let alpha = i / steps;
        aspinePoints.push([
          20 * Math.sin(alpha * rotation * 0.0174533),
          20 * Math.cos(alpha * rotation * 0.0174533),
          height * alpha]);
      }

      let aspineWire = OcLib.BSpline(aspinePoints, false);
      this.sceneShapes = CascadeStudioStandardUtils.Remove(this.sceneShapes, aspineWire); // Don't render these

      // Sweep the face wires along the spine to create the extrusion
      let pipe = new oc.BRepOffsetAPI_MakePipeShell(spineWire);
      pipe.SetMode(aspineWire, true);
      pipe.Add(wire);
      pipe.Add(upperPolygon);
      pipe.Build();
      pipe.MakeSolid();
      return new oc.TopoDS_Shape(pipe.Shape());
    });
    if (!keepWire) { this.sceneShapes = CascadeStudioStandardUtils.Remove(this.sceneShapes, wire); }
    this.sceneShapes.push(curExtrusion);
    return curExtrusion;
  }

  public Loft(wires, keepWires) {
    let curLoft = CascadeStudioStandardUtils.CacheOp("Loft", arguments, () => {
      let pipe = new oc.BRepOffsetAPI_ThruSections(true);

      // Construct a Loft that passes through the wires
      wires.forEach((wire) => { pipe.AddWire(wire); });

      pipe.Build();
      return new oc.TopoDS_Shape(pipe.Shape());
    });

    wires.forEach((wire) => {
      if (!keepWires) { this.sceneShapes = CascadeStudioStandardUtils.Remove(this.sceneShapes, wire); }
    });
    this.sceneShapes.push(curLoft);
    return curLoft;
  }

  public Pipe(shape, wirePath, keepInputs) {
    let curPipe = CascadeStudioStandardUtils.CacheOp("Pipe", arguments, () => {
      let pipe = new oc.BRepOffsetAPI_MakePipe(wirePath, shape);
      pipe.Build();
      return new oc.TopoDS_Shape(pipe.Shape());
    });

    if (!keepInputs) {
      this.sceneShapes = CascadeStudioStandardUtils.Remove(this.sceneShapes, shape);
      this.sceneShapes = CascadeStudioStandardUtils.Remove(this.sceneShapes, wirePath);
    }
    this.sceneShapes.push(curPipe);
    return curPipe;
  }

  // This is a utility class for drawing wires/shapes with lines, arcs, and splines
  // This is unique, it needs to be called with the "new" keyword prepended
  public Sketch(startingPoint) {
    var currentIndex = 0;
    var faces = [];
    var wires = [];
    var firstPoint = new oc.gp_Pnt(startingPoint[0], startingPoint[1], 0);
    var lastPoint = firstPoint;
    var wireBuilder = new oc.BRepBuilderAPI_MakeWire();
    var fillets = [];
    var argsString = CascadeStudioStandardUtils.ComputeHash(arguments, true);

    // Functions are: BSplineTo, Fillet, Wire, and Face
    var Start = function (startingPoint) {
      this.firstPoint = new oc.gp_Pnt(startingPoint[0], startingPoint[1], 0);
      this.lastPoint = this.firstPoint;
      this.wireBuilder = new oc.BRepBuilderAPI_MakeWire();
      this.argsString += CascadeStudioStandardUtils.ComputeHash(arguments, true);
      return this;
    }

    var End = function (closed, reversed) {
      this.argsString += CascadeStudioStandardUtils.ComputeHash(arguments, true);

      if (closed &&
        (this.firstPoint.X() !== this.lastPoint.X() ||
          this.firstPoint.Y() !== this.lastPoint.Y())) {
        this.LineTo(this.firstPoint);
      }

      let wire = this.wireBuilder.Wire();
      if (reversed) { wire = wire.Reversed(); }
      wire.hash = CascadeStudioStandardUtils.stringToHash(this.argsString);
      this.wires.push(wire);

      let faceBuilder: any = null;
      if (this.faces.length > 0) {
        faceBuilder = new oc.BRepBuilderAPI_MakeFace(this.wires[0]);
        for (let w = 1; w < this.wires.length; w++) {
          faceBuilder.Add(this.wires[w]);
        }
      } else {
        faceBuilder = new oc.BRepBuilderAPI_MakeFace(wire);
      }

      let face = faceBuilder.Face();
      face.hash = CascadeStudioStandardUtils.stringToHash(this.argsString);
      this.faces.push(face);
      return this;
    }

    var Wire = function (reversed) {
      this.argsString += CascadeStudioStandardUtils.ComputeHash(arguments, true);
      //let wire = this.wires[this.wires.length - 1];
      this.applyFillets();
      this.faces[this.faces.length - 1].hash = CascadeStudioStandardUtils.stringToHash(this.argsString);
      let wire = OcLib.GetWire(this.faces[this.faces.length - 1]);
      if (reversed) { wire = wire.Reversed(); }
      this.sceneShapes.push(wire);
      return wire;
    }
    var Face = function (reversed) {
      this.argsString += CascadeStudioStandardUtils.ComputeHash(arguments, true);
      this.applyFillets();
      let face = this.faces[this.faces.length - 1];
      if (reversed) { face = face.Reversed(); }
      face.hash = CascadeStudioStandardUtils.stringToHash(this.argsString);
      this.sceneShapes.push(face);
      return face;
    }

    var applyFillets = function () {
      // Add Fillets if Necessary
      if (this.fillets.length > 0) {
        let successes = 0; let swapFillets = [];
        for (let f = 0; f < this.fillets.length; f++) { this.fillets[f].disabled = false; }

        // Create Fillet Maker 2D
        let makeFillet = new oc.BRepFilletAPI_MakeFillet2d(this.faces[this.faces.length - 1]);
        // TopExp over the vertices
        OcLib.ForEachVertex(this.faces[this.faces.length - 1], (vertex) => {
          // Check if the X and Y coords of any vertices match our chosen fillet vertex
          let pnt = oc.BRep_Tool.prototype.Pnt(vertex);
          for (let f = 0; f < this.fillets.length; f++) {
            if (!this.fillets[f].disabled &&
              pnt.X() === this.fillets[f].x &&
              pnt.Y() === this.fillets[f].y) {
              // If so: Add a Radius there!
              makeFillet.AddFillet(vertex, this.fillets[f].radius);
              this.fillets[f].disabled = true; successes++;
              break;
            }
          }
        });
        if (successes > 0) { this.faces[this.faces.length - 1] = makeFillet.Shape(); }
        else { console.log("Couldn't find any of the vertices to fillet!!"); }
        this.fillets.concat(swapFillets);
      }
    }

    var AddWire = function (wire) {
      this.argsString += CascadeStudioStandardUtils.ComputeHash(arguments, true);
      // This adds another wire (or edge??) to the currently constructing shape...
      this.wireBuilder.Add(wire);
      // if (endPoint) { this.lastPoint = const endPoint; } // Yike what to do here...?
      return this;
    }

    var LineTo = function (nextPoint) {
      this.argsString += CascadeStudioStandardUtils.ComputeHash(arguments, true);
      let endPoint = null;
      if (nextPoint.X) {
        if (this.lastPoint.X() === nextPoint.X() &&
          this.lastPoint.Y() === nextPoint.Y()) { return this; }
        endPoint = nextPoint;
      } else {
        if (this.lastPoint.X() === nextPoint[0] &&
          this.lastPoint.Y() === nextPoint[1]) { return this; }
        endPoint = new oc.gp_Pnt(nextPoint[0], nextPoint[1], 0);
      }
      let lineSegment = new oc.GC_MakeSegment(this.lastPoint, endPoint).Value();
      let lineEdge = new oc.BRepBuilderAPI_MakeEdge(lineSegment).Edge();
      this.wireBuilder.Add(new oc.BRepBuilderAPI_MakeWire(lineEdge).Wire());
      this.lastPoint = endPoint;
      this.currentIndex++;
      return this;
    }

    var ArcTo = function (pointOnArc, arcEnd) {
      this.argsString += CascadeStudioStandardUtils.ComputeHash(arguments, true);
      let onArc = new oc.gp_Pnt(pointOnArc[0], pointOnArc[1], 0);
      let nextPoint = new oc.gp_Pnt(arcEnd[0], arcEnd[1], 0);
      let arcCurve = new oc.GC_MakeArcOfCircle(this.lastPoint, onArc, nextPoint).Value();
      let arcEdge = new oc.BRepBuilderAPI_MakeEdge(arcCurve).Edge();
      this.wireBuilder.Add(new oc.BRepBuilderAPI_MakeWire(arcEdge).Wire());
      this.lastPoint = nextPoint;
      this.currentIndex++;
      return this;
    }

    // Constructs an order-N Bezier Curve where the first N-1 points are control points
    // and the last point is the endpoint of the curve
    var BezierTo = function (bezierControlPoints) {
      this.argsString += CascadeStudioStandardUtils.ComputeHash(arguments, true);
      let ptList = new oc.TColgp_Array1OfPnt(1, bezierControlPoints.length + 1);
      ptList.SetValue(1, this.lastPoint);
      for (let bInd = 0; bInd < bezierControlPoints.length; bInd++) {
        let ctrlPoint = CascadeStudioStandardUtils.convertToPnt(bezierControlPoints[bInd]);
        ptList.SetValue(bInd + 2, ctrlPoint);
        this.lastPoint = ctrlPoint;
      }
      let cubicCurve = new oc.Geom_BezierCurve(ptList);
      let handle = new oc.Handle_Geom_BezierCurve(cubicCurve);
      let lineEdge = new oc.BRepBuilderAPI_MakeEdge(handle).Edge();
      this.wireBuilder.Add(new oc.BRepBuilderAPI_MakeWire(lineEdge).Wire());
      this.currentIndex++;
      return this;
    }

    /* Constructs a BSpline from the previous point through this set of points */
    var BSplineTo = function (bsplinePoints) {
      this.argsString += CascadeStudioStandardUtils.ComputeHash(arguments, true);
      let ptList = new oc.TColgp_Array1OfPnt(1, bsplinePoints.length + 1);
      ptList.SetValue(1, this.lastPoint);
      for (let bInd = 0; bInd < bsplinePoints.length; bInd++) {
        let ctrlPoint = CascadeStudioStandardUtils.convertToPnt(bsplinePoints[bInd]);
        ptList.SetValue(bInd + 2, ctrlPoint);
        this.lastPoint = ctrlPoint;
      }
      let handle = new oc.GeomAPI_PointsToBSpline(ptList).Curve();
      let lineEdge = new oc.BRepBuilderAPI_MakeEdge(handle).Edge();
      this.wireBuilder.Add(new oc.BRepBuilderAPI_MakeWire(lineEdge).Wire());
      this.currentIndex++;
      return this;
    }

    var Fillet = function (radius) {
      this.argsString += CascadeStudioStandardUtils.ComputeHash(arguments, true);
      this.fillets.push({ x: this.lastPoint.X(), y: this.lastPoint.Y(), radius: radius });
      return this;
    }

    var Circle = function (center, radius, reversed) {
      this.argsString += CascadeStudioStandardUtils.ComputeHash(arguments, true);
      let circle = new oc.GC_MakeCircle(new oc.gp_Ax2(CascadeStudioStandardUtils.convertToPnt(center),
        new oc.gp_Dir(0, 0, 1)), radius).Value();
      let edge = new oc.BRepBuilderAPI_MakeEdge(circle).Edge();
      let wire = new oc.BRepBuilderAPI_MakeWire(edge).Wire();
      if (reversed) { wire = wire.Reversed(); }
      wire.hash = CascadeStudioStandardUtils.stringToHash(this.argsString);
      this.wires.push(wire);

      let faceBuilder: any = null;
      if (this.faces.length > 0) {
        faceBuilder = new oc.BRepBuilderAPI_MakeFace(this.wires[0]);
        for (let w = 1; w < this.wires.length; w++) {
          faceBuilder.Add(this.wires[w]);
        }
      } else {
        faceBuilder = new oc.BRepBuilderAPI_MakeFace(wire);
      }
      let face = faceBuilder.Face();
      face.hash = CascadeStudioStandardUtils.stringToHash(this.argsString);
      this.faces.push(face);
      return this;
    }
  }

  public SaveFile(filename, fileURL) {
    // postMessage({
    //   "type": "saveFile",
    //   payload: { filename: filename, fileURL: fileURL }
    // });
  }
}

export let OcLib = new _OcLib();
