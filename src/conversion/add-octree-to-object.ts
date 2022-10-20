// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/globals.d.ts" />

import wleOctreeCSGToMesh from './octree-to-mesh';

import type { OctreeCSG, MaterialDefinitions } from 'octreecsg-ea';

export default function wleAddOctreeCSGToObject(object: WL.Object, octree: OctreeCSG, materialDefinitions: MaterialDefinitions, materialMap: Readonly<Map<number, WL.Material>>): void {
    const results = wleOctreeCSGToMesh(octree, materialDefinitions, materialMap);
    for (const [material, mesh] of results.entries()) {
        object.addComponent('mesh', { material, mesh });
    }
}