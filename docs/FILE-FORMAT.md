# Design File Format

## Overview

Designs are saved/loaded as JSON files conforming to `DesignFileV1` schema. The schema validator lives in `src/utils/schemaValidator.ts`.

## Schema (v1)

```json
{
  "schemaVersion": 1,
  "metadata": {
    "name": "My Patio Design",
    "createdAt": "2026-03-10T12:34:56.789Z",
    "lastModifiedAt": "2026-03-10T14:20:00.000Z",
    "schemaVersion": 1
  },
  "gridSettings": {
    "widthFt": 50,
    "heightFt": 50,
    "increment": "1ft"
  },
  "grid": [
    ["grass_light", "grass_light", "concrete", "concrete"],
    ["grass_light", "pavers", "pavers", "concrete"],
    ...
  ],
  "heightOverrides": [],
  "placedObjects": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "type": "pergola",
      "position": [10, 0, 15],
      "rotation": [0, 0.785, 0],
      "scale": [1, 1, 1],
      "size": {
        "widthFt": 12,
        "depthFt": 10,
        "heightFt": 9
      },
      "customProps": {
        "postShape": "square",
        "postDiameter": 4,
        "postCount": 2,
        "color": "#8b7355"
      }
    }
  ]
}
```

## Notes

- **Grid format**: 2D array of material string IDs (not byte indices). Converted to/from `Uint8Array` on load/save.
- **Grid dimensions**: Must match `gridSettings.widthFt / heightFt / increment`. A 50ft × 50ft grid at 1ft increment = 50 rows × 50 cols.
- **Material values**: Must be valid `Material` enum strings (e.g., `"grass_light"`, `"pavers"`).
- **Max grid size**: 200 × 200 ft.
- **Object positions**: In feet, relative to grid origin (top-left corner).
- **Object rotations**: Euler angles in radians. Only `rotation[1]` (yaw) is typically used.
- **customProps**: Keys/values match the `editableProps` definitions in `PREFAB_CATALOG`.

## Validation

`validateDesignFile(data)` checks:
1. `schemaVersion` === 1
2. Required metadata fields present
3. Grid dimensions match settings
4. All material values are valid
5. Grid size within MAX_GRID_FT bounds

## Save/Load Flow

**Save** (`useDesignIO.saveDesign()`):
1. `designStore.toDesignFile()` — converts Uint8Array grid to 2D string array
2. `JSON.stringify()` with formatting
3. Download as `.json` file via blob URL

**Load** (`useDesignIO.loadDesign(file)`):
1. `FileReader.readAsText()`
2. `parseDesignFile(json)` — parse + validate
3. `designStore.loadDesign(file)` — convert 2D array back to Uint8Array, set state
4. `historyStore.clear()` — reset undo/redo stacks
