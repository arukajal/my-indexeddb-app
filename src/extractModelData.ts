/* eslint-disable @typescript-eslint/no-explicit-any */

export async function calculateHash(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function extractModelData(modelBuffer: ArrayBuffer): Promise<{
  indexedDBData: { id: string; geometryBlob: Blob; hash: string }[];
  sqliteData: any[];
}> {
  const rhino = await (window as any).rhino3dm();
  const buffer = new Uint8Array(modelBuffer);
  const doc = rhino.File3dm.fromByteArray(buffer);

  if (!doc) {
    throw new Error("Failed to load model");
  }

  const indexedDBData = [];
  const sqliteData = [];

  for (let i = 0; i < doc.objects().count; i++) {
    const rhinoObject = doc.objects().get(i);
    const geometry = rhinoObject.geometry();
    const attributes = rhinoObject.attributes();

    let geometryBlob = null;

   // console.log('geometry', geometry);
    if (geometry.constructor.name === "Brep") {
      // Handle Brep geometry
      try {
        const faces = geometry.faces();
        for (let j = 0; j < faces.count; j++) {
          const face = faces.get(j);

          const faceMesh = face.getMesh(rhino.MeshType.Render);
          if (faceMesh) {
            const meshJSON = faceMesh.toJSON({});
            geometryBlob = new Blob([JSON.stringify(meshJSON)], { type: "application/json" });
            const hash = await calculateHash(await geometryBlob.arrayBuffer());

            
            indexedDBData.push({
              id: `${attributes.id}-face-${j}`,
              geometryBlob,
              hash,
            });

            faceMesh.delete();
          }
          face.delete();
        }
      } catch (error) {
        console.error("Failed to process Brep geometry:", error);
        continue;
      }
    } else if (geometry.constructor.name === "NurbsCurve" || geometry.constructor.name === "LineCurve") {
      // Handle NurbsCurve and LineCurve as simple JSON serialization
      try {
        const curveJSON = geometry.toJSON({});
        geometryBlob = new Blob([JSON.stringify(curveJSON)], { type: "application/json" });

        const hash = await calculateHash(await geometryBlob.arrayBuffer());

        indexedDBData.push({
          id: `${attributes.id}-curve`,
          geometryBlob,
          hash,
        });
        
      } catch (error) {
        console.error(`Failed to serialize ${geometry.constructor.name}:`, error);
        continue;
      }
    } else {
      console.warn("Unsupported geometry type for serialization:", geometry.constructor.name);
      continue;
    }

    sqliteData.push({
      id: attributes.id,
      name: attributes.name || "Unnamed",
      layerIndex: attributes.layerIndex,
      visible: attributes.visible,
    });

    geometry.delete();
  }

  doc.delete();

  return { indexedDBData, sqliteData };
}





