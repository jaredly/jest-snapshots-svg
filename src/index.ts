import * as fs from "fs"
import * as path from "path"

export interface Component {
    type: string,
    props: any,
    children: Component[] | null
}

export interface Settings {
    width: number
    height: number
}

import componentTreeToNodeTree from "./component-tree-to-nodes"
import treeToSVG from "./tree-to-svg"

// toMatchSVGSnapshot(1024, 768)

const fail = (msg) => ({ message: () => msg, pass: false })

expect.extend({
    toMatchSVGSnapshot(root: Component, width, height) {
        if (!root) { return fail("A falsy Component was passed to toMatchSVGSnapshot") }
        if (!root.props) { return fail("A Component without props was passed to toMatchSVGSnapshot") }
        if (!root.type) { return fail("A Component without a type was passed to toMatchSVGSnapshot") }

        // This isn't in the d.ts
        const currentTest = (expect as any).getState().testPath

        //  Figure out the paths
        const snapshotsDir = path.join(currentTest, "..", "__snapshots__")
        const expectedSnapshot = path.join(snapshotsDir, path.basename(currentTest) + ".svg")

        // We will need to do something smarter in the future, these snapshots need to be 1 file per test
        // whereas jest-snapshots can be multi-test per file.

        const settings: Settings = { width, height }
        const rootNode = componentTreeToNodeTree(root, settings)
        const svgText = treeToSVG(rootNode, settings)

        // Are we in write mode?

        if (!fs.existsSync(expectedSnapshot)) {
            fs.writeFileSync(expectedSnapshot, svgText)
            return {
                message: () => "Created a new Snapshot for you"
            }

        } else {
            const contents = fs.readFileSync(expectedSnapshot, "utf8")
            if (contents !== svgText) {
                fs.writeFileSync(expectedSnapshot, svgText)
                return {
                    message: () => (
                        `SVG Snapshot failed: we have updated it for you`
                    ),
                    pass: false,
                }
            }
            return { message: () => "All good", pass: true }
        }
    }
} as any)
