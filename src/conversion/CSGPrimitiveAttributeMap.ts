// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/globals.d.ts" />

// XXX ideally this would be an exported const readonly map, but the WL
// namespace is not ready at import time because there is no official typescript
// wonderland package yet, and therefore it can't be marked as a dependency,
// only accessed via the WL global
export default class CSGPrimitiveAttributeMap extends Map<number, WL.MeshAttribute> {
    constructor() {
        super();

        this.set(0, WL.MeshAttribute.Normal);
    }
}