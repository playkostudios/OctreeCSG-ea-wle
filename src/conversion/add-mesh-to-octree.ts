// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/globals.d.ts" />

import { vec2, vec3, vec4 } from 'gl-matrix';
import { Polygon, Vertex } from 'octreecsg-ea';
import { MaterialAttributeType, MaterialAttributeTransform } from 'octreecsg-ea';

import type { MaterialMeshAttributeMap } from './MaterialMeshAttributeMap';
import type { OctreeCSG, MaterialAttribute, MaterialAttributes } from 'octreecsg-ea';

type AttributesList = Array<[accessor: WL.MeshAttributeAccessor, vecFactory: () => Array<number> | Float32Array]> | null;

function makeVertex(index: number, posAccessor: WL.MeshAttributeAccessor, attributes: AttributesList): Vertex {
    let extra = undefined;
    if (attributes) {
        extra = [];

        for (const [accessor, vecFactory] of attributes) {
            extra.push(accessor.get(index, vecFactory()) as vec3);
        }
    }

    return new Vertex(posAccessor.get(index, vec3.create()) as vec3, extra);
}

export default function wleAddMeshToOctreeCSG(octree: OctreeCSG, mesh: WL.Mesh, materialIndex?: number): [propertyMap: MaterialMeshAttributeMap, materialDefinition: MaterialAttributes] {
    // validate vertex count
    const indexData = mesh.indexData;
    const vertexCount = indexData === null ? mesh.vertexCount : indexData.length;

    if (vertexCount % 3 !== 0) {
        throw new Error(`Mesh has an invalid vertex count (${vertexCount}). Must be a multiple of 3`);
    }

    // prepare accessors
    // TODO joint vertex attributes
    const positions = mesh.attribute(WL.MeshAttribute.Position);
    let attributes: AttributesList = [];
    const materialDefinition = [];
    let vertexPropertyMap: MaterialMeshAttributeMap = new Map();

    const tangents = mesh.attribute(WL.MeshAttribute.Tangent);
    if (tangents) {
        vertexPropertyMap.set(attributes.length, WL.MeshAttribute.Tangent);
        attributes.push([tangents, () => vec4.create()]);
        materialDefinition.push(<MaterialAttribute>{
            type: MaterialAttributeType.Vec4,
            transformable: MaterialAttributeTransform.Model,
            flippable: false,
        });
    }

    const normals = mesh.attribute(WL.MeshAttribute.Normal);
    if (normals) {
        vertexPropertyMap.set(attributes.length, WL.MeshAttribute.Normal);
        attributes.push([normals, () => vec3.create()]);
        materialDefinition.push(<MaterialAttribute>{
            type: MaterialAttributeType.Vec3,
            transformable: MaterialAttributeTransform.Normal,
            flippable: true,
        });
    }

    const texCoords = mesh.attribute(WL.MeshAttribute.TextureCoordinate);
    if (texCoords) {
        vertexPropertyMap.set(attributes.length, WL.MeshAttribute.TextureCoordinate);
        attributes.push([texCoords, () => vec2.create()]);
        materialDefinition.push(<MaterialAttribute>{
            type: MaterialAttributeType.Vec2,
            transformable: null,
            flippable: false,
        });
    }

    const colors = mesh.attribute(WL.MeshAttribute.Color);
    if (colors) {
        vertexPropertyMap.set(attributes.length, WL.MeshAttribute.Color);
        attributes.push([colors, () => vec4.create()]);
        materialDefinition.push(<MaterialAttribute>{
            type: MaterialAttributeType.Vec3,
            transformable: null,
            flippable: false,
        });
    }

    if (!attributes.length) {
        attributes = null;
        vertexPropertyMap = null;
    }

    // convert
    for (let i = 0; i < vertexCount;) {
        let a, b, c;

        if (indexData === null) {
            a = makeVertex(i++, positions, attributes);
            b = makeVertex(i++, positions, attributes);
            c = makeVertex(i++, positions, attributes);
        } else {
            const ia = indexData[i++];
            const ib = indexData[i++];
            const ic = indexData[i++];
            a = makeVertex(ia, positions, attributes);
            b = makeVertex(ib, positions, attributes);
            c = makeVertex(ic, positions, attributes);
        }
        const polygon = new Polygon([a, b, c], materialIndex);
        polygon.originalValid = true;
        octree.addPolygon(polygon);
    }

    return [vertexPropertyMap, materialDefinition];
}