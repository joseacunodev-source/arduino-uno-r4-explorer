# Official Arduino CAD reference

Retrieved 2026-09-25 from Arduino's [UNO R4 WiFi resource page](https://docs.arduino.cc/hardware/uno-r4-wifi/).

- Original download: [ABX00087 STEP archive](https://docs.arduino.cc/resources/models/ABX00087-step.zip)
- Local archive: `ABX00087-step.zip` (1,313,116 bytes)
- Extracted source: `official-step/UNO_R4_WIFI.step` (7,229,567 bytes)
- STEP header: Open CASCADE 7.5, source model dated 2023-06-19.
- This is a real named component assembly: 285 PRODUCT declarations, including Board, U1, J1, PB1, JDIGITAL, JANALOG and individual passive components. There are also 36 COLOUR_RGB declarations. Counts refer to STEP entities, not necessarily the final exported mesh count.

## Conversion

No Blender, FreeCADCmd or Assimp executable was present on PATH when checked. Node.js is available. [occt-import-js](https://github.com/kovacsv/occt-import-js) supports reading STEP in Node through WebAssembly and returns the assembly tree plus indexed geometry and colors. It can be used as an offline development tool, followed by GLB export, without shipping the CAD parser in the website runtime. Preserve component hierarchy and assembled positions during conversion; simplify and regroup only after reviewing the model visually.

Converted successfully with `scripts/convert-cad.mjs`: `public/models/arduino-uno-r4-wifi.glb` is 8,524,440 bytes, contains 274,924 triangles, and uses 43 merged material meshes in 25 named interaction groups. `public/models/arduino-uno-r4-wifi.parts.json` records the source designators and measured bounds for each group. `src/data/cadParts.ts` provides the actual assembled pivot positions. The original STEP remains available for later refinement.

Source coordinate system: X/Y are the board plane in millimeters, +Z points above the PCB, and the PCB surface is Z=0. Source assembly bounds are approximately `[-1.960, 0, -3.406]` to `[68.580, 53.340, 11.094]` mm including projecting ports and pins. Conversion maps each vertex to `[(X-34.29)/10, Z/10, (26.67-Y)/10]`; world Y is up and one world unit is 10 mm. The PCB footprint in this CAD is 68.58 × 53.34 mm. The Arduino store's 68.85 mm listing differs from this measured source geometry.

The source CAD is not a finished photorealistic asset: board silkscreen, drilled PCB holes and markings may need refinement, and physical CAD materials need lighting/material review. The electrical parts are official CAD geometry; exploded locations are authored educational presentation choices.

To regenerate (Node.js):

```sh
npm install --prefix .tools/cad occt-import-js three
node scripts/convert-cad.mjs
```

The optional `triangulated.json` inspection cache is ignored by Git. The converter works directly from STEP when it is absent. CAD tessellation uses 0.08 mm linear deflection and 0.35 rad angular deflection. Source per-face colors are retained and geometry is merged only within each logical group/material. The Node converter's dependencies stay in `.tools/cad` and are not website runtime dependencies.

## Source and license notes

Original design and supplied CAD: Arduino. Arduino is a trademark of Arduino S.r.l. This project is an independent educational visualization.

The downloaded STEP ZIP contains only the STEP file and no standalone license. Arduino's [hardware licensing guidance](https://support.arduino.cc/hc/en-us/articles/4415094490770-Licensing-for-products-based-on-Arduino) says its hardware designs generally use CC BY-SA 4.0 and derived hardware designs must retain the original license. This general guidance does not identify an explicit license for this particular STEP file. Preserve attribution and the original source; do not relabel the CAD asset as MIT or claim its exact license was verified. Arduino's [trademark and copyright page](https://www.arduino.cc/en/trademark/) separately identifies editorial content as CC BY-SA 4.0.

The separate [electrical CAD archive](https://docs.arduino.cc/static/41d76ccb600d3cb1ec1e98a28d24f111/ABX00087-cad-files.zip) was not downloaded: the work network returned a temporary Zscaler file-analysis page. The STEP download above succeeded normally.

## Technical references

- [UNO R4 WiFi datasheet](https://docs.arduino.cc/resources/datasheets/ABX00087-datasheet.pdf)
- [UNO R4 WiFi user manual](https://docs.arduino.cc/tutorials/uno-r4-wifi/cheat-sheet/)
- [Schematics](https://docs.arduino.cc/resources/schematics/ABX00087-schematics.pdf)

Verified specifications: Renesas RA4M1, 32-bit Arm Cortex-M4 at 48 MHz, 256 kB flash, 32 kB SRAM, ESP32-S3 for Wi-Fi and Bluetooth LE, 12 x 8 red LED matrix, USB-C, 14 digital I/O and 6 analog inputs. RA4M1/GPIO operates at 5 V; the ESP32-S3 module is 3.3 V. VIN/barrel input is 6–24 V. Avoid presenting 24 V as a GPIO or USB rating.
