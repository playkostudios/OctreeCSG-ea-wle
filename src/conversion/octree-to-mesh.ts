// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/globals.d.ts" />

import { MaterialAttributeStandardType } from 'octreecsg-ea';

import type { OctreeCSG, Vertex, MaterialDefinitions } from 'octreecsg-ea';

type AttributesMap = Map<number, WL.MeshAttributeAccessor>;

function uploadVertex(vertex: Vertex, index: number, posAccessor: WL.MeshAttributeAccessor, wleAttributes: AttributesMap) {
    posAccessor.set(index, vertex.pos as number[]);

    if (vertex.extra) {
        const extraCount = vertex.extra.length;

        for (let i = 0; i < extraCount; i++) {
            const accessor = wleAttributes.get(i);
            if (accessor) {
                accessor.set(index, vertex.extra[i]);
            }
        }
    }
}

export default function wleOctreeCSGToMesh(octree: OctreeCSG, materialDefinitions: MaterialDefinitions, materialMap: Readonly<Map<number, WL.Material>>): Map<WL.Material, WL.Mesh> {
    // get polygons
    const polygons = octree.getPolygons();

    // count polygons for each material ID
    const polygonCounts = new Map<number, number>();
    for (const poly of polygons) {
        const materialID = poly.shared;

        if (!materialMap.has(materialID)) {
            // ignore material if it's not present in the map
            continue;
        }

        const count = polygonCounts.get(materialID) ?? 0;
        polygonCounts.set(materialID, count + 1);
    }

    // make meshes for each material group
    const groups = new Map<WL.Material, WL.Mesh>();
    for (const [materialID, polygonCount] of polygonCounts) {
        // make index buffer
        const vertexCount = polygonCount * 3;
        let indexType: WL.MeshIndexType, indexData: Uint8Array | Uint16Array | Uint32Array;
        if (vertexCount <= 255) {
            indexType = WL.MeshIndexType.UnsignedByte;
            indexData = new Uint8Array(vertexCount);
        } else if (vertexCount <= 65535) {
            indexType = WL.MeshIndexType.UnsignedShort;
            indexData = new Uint16Array(vertexCount);
        } else {
            indexType = WL.MeshIndexType.UnsignedInt;
            indexData = new Uint32Array(vertexCount);
        }

        for (let i = 0; i < vertexCount; i++) {
            indexData[i] = i;
        }

        // make mesh from index buffer
        const mesh = new WL.Mesh({ vertexCount, indexType, indexData });
        const material = materialMap.get(materialID) as WL.Material;
        const position = mesh.attribute(WL.MeshAttribute.Position);
        const wleAttributes: AttributesMap = new Map();
        const attributes = materialDefinitions.get(materialID);

        if (attributes) {
            for (const [extraIndex, attributeType] of attributes.entries()) {
                // TODO joints
                switch (attributeType.type) {
                    case MaterialAttributeStandardType.Tangent:
                    {
                        const tangents = mesh.attribute(WL.MeshAttribute.Tangent);
                        if (tangents) {
                            wleAttributes.set(extraIndex, tangents);
                        } else {
                            console.warn(`Could not create tangent mesh attribute accessor. Vertex property ignored`);
                        }
                        break;
                    }
                    case MaterialAttributeStandardType.Normal:
                    {
                        const normals = mesh.attribute(WL.MeshAttribute.Normal);
                        if (normals) {
                            wleAttributes.set(extraIndex, normals);
                        } else {
                            console.warn(`Could not create normal mesh attribute accessor. Vertex property ignored`);
                        }
                        break;
                    }
                    case MaterialAttributeStandardType.TextureCoordinate:
                    {
                        const texCoords = mesh.attribute(WL.MeshAttribute.TextureCoordinate);
                        if (texCoords) {
                            wleAttributes.set(extraIndex, texCoords);
                        } else {
                            console.warn(`Could not create texture coordinate mesh attribute accessor. Vertex property ignored`);
                        }
                        break;
                    }
                    case MaterialAttributeStandardType.Color:
                    {
                        const colors = mesh.attribute(WL.MeshAttribute.Color);
                        if (colors) {
                            wleAttributes.set(extraIndex, colors);
                        } else {
                            console.warn(`Could not create color mesh attribute accessor. Vertex property ignored`);
                        }
                        break;
                    }
                    default:
                        console.warn(`Unsupported mesh attribute ID (${attributeType}) ignored`);
                }
            }
        }

        // populate mesh with polygons
        let v = 0;
        for (const poly of polygons) {
            if (poly.shared === materialID) {
                uploadVertex(poly.vertices[0], v++, position, wleAttributes);
                uploadVertex(poly.vertices[1], v++, position, wleAttributes);
                uploadVertex(poly.vertices[2], v++, position, wleAttributes);
            }
        }

        groups.set(material, mesh);
    }

    return groups;
}