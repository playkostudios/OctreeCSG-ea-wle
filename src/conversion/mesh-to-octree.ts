// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/globals.d.ts" />

import { OctreeCSG } from 'octreecsg-ea';
import wleAddMeshToOctreeCSG from './add-mesh-to-octree';

import type { MaterialAttributes } from 'octreecsg-ea';

export default function wleMeshToOctreeCSG(mesh: WL.Mesh, materialIndex?: number): [octree: OctreeCSG, attributes: MaterialAttributes] {
    const octree = new OctreeCSG();
    return [octree, wleAddMeshToOctreeCSG(octree, mesh, materialIndex)];
}