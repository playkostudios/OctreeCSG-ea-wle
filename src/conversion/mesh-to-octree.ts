// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/globals.d.ts" />

import { OctreeCSG } from 'octreecsg-ea';
import wleAddMeshToOctreeCSG from './add-mesh-to-octree';

import type { MaterialMeshAttributeMap } from './MaterialMeshAttributeMap';
import type { MaterialAttributes } from 'octreecsg-ea/base/MaterialDefinition';

export default function wleMeshToOctreeCSG(mesh: WL.Mesh, materialIndex?: number): [octree: OctreeCSG, propertyMap: MaterialMeshAttributeMap, materialDefinition: MaterialAttributes] {
    const octree = new OctreeCSG();
    const [vertexPropertyMap, materialDefinition] = wleAddMeshToOctreeCSG(octree, mesh, materialIndex);

    return [octree, vertexPropertyMap, materialDefinition];
}