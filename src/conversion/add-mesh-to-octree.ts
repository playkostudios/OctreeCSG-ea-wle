// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/globals.d.ts" />

import { vec2, vec3, vec4 } from 'gl-matrix';
import { MaterialAttributeStandardType, Polygon, Vertex, MaterialAttributeValueType, MaterialAttributeTransform } from 'octreecsg-ea';

import type { OctreeCSG, MaterialAttribute, MaterialAttributes } from 'octreecsg-ea';

type AttributeAccessors = Array<[accessor: WL.MeshAttributeAccessor, vecFactory: () => Array<number> | Float32Array]> | null;

function makeVertex(index: number, posAccessor: WL.MeshAttributeAccessor, attributeAccessors: AttributeAccessors): Vertex {
    let extra = undefined;
    if (attributeAccessors) {
        extra = [];

        for (const [accessor, vecFactory] of attributeAccessors) {
            extra.push(accessor.get(index, vecFactory()) as vec3);
        }
    }

    return new Vertex(posAccessor.get(index, vec3.create()) as vec3, extra);
}

export default function wleAddMeshToOctreeCSG(octree: OctreeCSG, mesh: WL.Mesh, materialIndex?: number): MaterialAttributes {
    // validate vertex count
    const indexData = mesh.indexData;
    const vertexCount = indexData === null ? mesh.vertexCount : indexData.length;

    if (vertexCount % 3 !== 0) {
        throw new Error(`Mesh has an invalid vertex count (${vertexCount}). Must be a multiple of 3`);
    }

    // prepare accessors
    // TODO joint vertex attributes
    const positions = mesh.attribute(WL.MeshAttribute.Position);
    let attributeAccessors: AttributeAccessors = [];
    const attributes = [];

    const tangents = mesh.attribute(WL.MeshAttribute.Tangent);
    if (tangents) {
        attributeAccessors.push([tangents, () => vec4.create()]);
        attributes.push(<MaterialAttribute>{
            type: MaterialAttributeStandardType.Tangent,
            valueType: MaterialAttributeValueType.Vec4,
            transformable: MaterialAttributeTransform.Model,
            flippable: false,
        });
    }

    const normals = mesh.attribute(WL.MeshAttribute.Normal);
    if (normals) {
        attributeAccessors.push([normals, () => vec3.create()]);
        attributes.push(<MaterialAttribute>{
            type: MaterialAttributeStandardType.Normal,
            valueType: MaterialAttributeValueType.Vec3,
            transformable: MaterialAttributeTransform.Normal,
            flippable: true,
        });
    }

    const texCoords = mesh.attribute(WL.MeshAttribute.TextureCoordinate);
    if (texCoords) {
        attributeAccessors.push([texCoords, () => vec2.create()]);
        attributes.push(<MaterialAttribute>{
            type: MaterialAttributeStandardType.TextureCoordinate,
            valueType: MaterialAttributeValueType.Vec2,
            transformable: null,
            flippable: false,
        });
    }

    const colors = mesh.attribute(WL.MeshAttribute.Color);
    if (colors) {
        attributeAccessors.push([colors, () => vec4.create()]);
        attributes.push(<MaterialAttribute>{
            type: MaterialAttributeStandardType.Color,
            valueType: MaterialAttributeValueType.Vec3,
            transformable: null,
            flippable: false,
        });
    }

    if (!attributeAccessors.length) {
        attributeAccessors = null;
    }

    // convert
    for (let i = 0; i < vertexCount;) {
        let a, b, c;

        if (indexData === null) {
            a = makeVertex(i++, positions, attributeAccessors);
            b = makeVertex(i++, positions, attributeAccessors);
            c = makeVertex(i++, positions, attributeAccessors);
        } else {
            const ia = indexData[i++];
            const ib = indexData[i++];
            const ic = indexData[i++];
            a = makeVertex(ia, positions, attributeAccessors);
            b = makeVertex(ib, positions, attributeAccessors);
            c = makeVertex(ic, positions, attributeAccessors);
        }
        const polygon = new Polygon([a, b, c], materialIndex);
        polygon.originalValid = true;
        octree.addPolygon(polygon);
    }

    return attributes;
}