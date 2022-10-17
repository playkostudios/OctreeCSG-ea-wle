// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/globals.d.ts" />

import { OctreeCSG } from 'octreecsg-ea';
import { MaterialMeshAttributeMap } from './MaterialMeshAttributeMap';

import type { Vertex } from 'octreecsg-ea';

type AttributesMap = Map<number, WL.MeshAttributeAccessor>;

function uploadVertex(vertex: Vertex, index: number, posAccessor: WL.MeshAttributeAccessor, attributes: AttributesMap) {
    posAccessor.set(index, vertex.pos as number[]);

    if (vertex.extra) {
        const extraCount = vertex.extra.length;

        for (let i = 0; i < extraCount; i++) {
            const accessor = attributes.get(i);
            if (accessor) {
                accessor.set(index, vertex.extra[i]);
            }
        }
    }
}

export default function wleOctreeCSGToMesh(octree: OctreeCSG, materialMap: Readonly<Map<number, [Readonly<MaterialMeshAttributeMap>, WL.Material]>>): Map<WL.Material, WL.Mesh> {
    // get polygons
    const polygons = octree.getPolygons();

    // count polygons for each material ID
    const polygonCounts = new Map<number, number>();
    for (const poly of polygons) {
        const materialID = poly.shared;

        if (!materialMap.has(materialID)) {
            throw new Error(`Missing material ID (${materialID}) found in CSG. Make sure to include it in the material map. A fallback material can be specified with an undefined key`);
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
        const [propMap, material] = materialMap.get(materialID) as [MaterialMeshAttributeMap, WL.Material];
        const position = mesh.attribute(WL.MeshAttribute.Position);
        const attributes: AttributesMap = new Map();

        if (propMap) {
            for (const [extraIndex, attributeType] of propMap) {
                // TODO joints
                switch (attributeType) {
                    case WL.MeshAttribute.Tangent:
                    {
                        const tangents = mesh.attribute(WL.MeshAttribute.Tangent);
                        if (tangents) {
                            attributes.set(extraIndex, tangents);
                        } else {
                            console.warn(`Could not create tangent mesh attribute accessor. Vertex property ignored`);
                        }
                        break;
                    }
                    case WL.MeshAttribute.Normal:
                    {
                        const normals = mesh.attribute(WL.MeshAttribute.Normal);
                        if (normals) {
                            attributes.set(extraIndex, normals);
                        } else {
                            console.warn(`Could not create normal mesh attribute accessor. Vertex property ignored`);
                        }
                        break;
                    }
                    case WL.MeshAttribute.TextureCoordinate:
                    {
                        const texCoords = mesh.attribute(WL.MeshAttribute.TextureCoordinate);
                        if (texCoords) {
                            attributes.set(extraIndex, texCoords);
                        } else {
                            console.warn(`Could not create texture coordinate mesh attribute accessor. Vertex property ignored`);
                        }
                        break;
                    }
                    case WL.MeshAttribute.Color:
                    {
                        const colors = mesh.attribute(WL.MeshAttribute.Color);
                        if (colors) {
                            attributes.set(extraIndex, colors);
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
                uploadVertex(poly.vertices[0], v++, position, attributes);
                uploadVertex(poly.vertices[1], v++, position, attributes);
                uploadVertex(poly.vertices[2], v++, position, attributes);
            }
        }

        groups.set(material, mesh);
    }

    return groups;
}