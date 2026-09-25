export type Vec3 = [number, number, number]

export interface PartConfig {
  id: string
  name: string
  category: string
  description: string
  spec: string
  assembled: Vec3
  exploded: Vec3
  /** Euler offset in the exploded state; the assembled orientation is zero. */
  rotation?: Vec3
  range: [number, number]
}

/**
 * Editable prototype transforms, in centimetre-equivalent world units.
 * X runs along the long edge, Y is up, +Z is the analog / power edge.
 * Component locations are interpreted from the supplied visual references;
 * this is an educational model, not manufacturing CAD.
 * Hardware: https://docs.arduino.cc/hardware/uno-r4-wifi/
 * Specifications: https://docs.arduino.cc/resources/datasheets/ABX00087-datasheet.pdf
 */
export const PARTS: PartConfig[] = [
  { id: 'pcb', name: 'Printed circuit board', category: 'Foundation', description: 'The board connects every component through copper traces beneath its blue solder mask. It stays in place as the rest of the assembly comes together.', spec: 'UNO footprint · 68.85 × 53.34 mm', assembled: [0, 0, 0], exploded: [0, 0, 0], range: [0, 1] },
  { id: 'ra4m1', name: 'Renesas RA4M1', category: 'Processing', description: 'The main microcontroller runs your Arduino sketch. Its Arm Cortex-M4 core brings 32-bit processing to the familiar UNO format.', spec: '48 MHz · 256 KB flash · 32 KB SRAM', assembled: [1.68, 0.13, -1.16], exploded: [2.8, 2.9, -2.05], rotation: [0.04, -0.18, 0.08], range: [0.36, 0.72] },
  { id: 'esp32', name: 'ESP32-S3 module', category: 'Connectivity', description: 'A dedicated Espressif module provides Wi-Fi and Bluetooth LE connectivity. Its metal shield encloses the wireless circuitry.', spec: 'ESP32-S3-MINI-1 · 2.4 GHz Wi-Fi', assembled: [-1.48, 0.13, 0.7], exploded: [-2.35, 2.6, 1.6], rotation: [0.07, 0.14, -0.08], range: [0.4, 0.76] },
  { id: 'led-matrix', name: '12 × 8 LED matrix', category: 'Output', description: 'Ninety-six individually addressable red LEDs turn small messages, animations and live data into a visible output right on the board.', spec: '96 red LEDs · 12 columns × 8 rows', assembled: [1.41, 0.11, 0.83], exploded: [2.45, 2.1, 2.25], rotation: [0.05, -0.08, 0.04], range: [0.32, 0.67] },
  { id: 'usb-c', name: 'USB-C port', category: 'Connection', description: 'Connect the board to a computer to upload sketches, exchange serial data and supply power.', spec: 'USB-C · programming, data and power', assembled: [-3.03, 0.1, -1.13], exploded: [-4.75, 1.3, -1.9], rotation: [0.04, 0.2, -0.07], range: [0.59, 0.9] },
  { id: 'barrel-jack', name: 'DC power jack', category: 'Power', description: 'The barrel connector lets the board run from an external DC supply when it is away from a computer.', spec: 'External supply · 6–24 V input', assembled: [-3.03, 0.1, 1.45], exploded: [-4.6, 0.8, 2.8], rotation: [0, -0.16, -0.04], range: [0.61, 0.92] },
  { id: 'digital-a', name: 'Digital header · A', category: 'Input / output', description: 'The first digital header exposes digital I/O and the dedicated I²C connections. Socket headers also connect UNO-compatible shields.', spec: 'SCL · SDA · AREF · GND · D8–D13', assembled: [-0.33, 0.1, -2.37], exploded: [-0.6, 2.1, -4.0], rotation: [0.07, -0.04, -0.06], range: [0.66, 0.98] },
  { id: 'digital-b', name: 'Digital header · B', category: 'Input / output', description: 'The second digital header brings out pins D0 through D7, including UART receive and transmit.', spec: 'D0–D7 · UART · PWM-capable pins', assembled: [2.11, 0.1, -2.37], exploded: [3.8, 1.8, -3.75], rotation: [-0.04, -0.14, 0.05], range: [0.69, 1] },
  { id: 'power-header', name: 'Power header', category: 'Power', description: 'Power and reference connections are grouped on the lower edge, making it easier to supply external circuits and stack compatible shields.', spec: 'IOREF · RESET · 3.3 V · 5 V · GND · VIN', assembled: [-0.37, 0.1, 2.36], exploded: [-0.85, 1.3, 4.15], rotation: [-0.08, 0.05, 0.07], range: [0.67, 0.98] },
  { id: 'analog-header', name: 'Analog header', category: 'Input / output', description: 'Six analog inputs read changing voltages from sensors. A0 can also operate as the board’s digital-to-analog output.', spec: 'A0–A5 · up to 14-bit ADC · 12-bit DAC', assembled: [2.13, 0.1, 2.36], exploded: [3.8, 1.05, 3.55], rotation: [-0.06, -0.1, -0.03], range: [0.7, 1] },
  { id: 'reset', name: 'Reset button', category: 'Control', description: 'Pressing reset restarts the main microcontroller and your sketch without disconnecting the board’s power.', spec: 'Momentary tactile switch', assembled: [-2.81, 0.1, -2.18], exploded: [-3.55, 1.8, -3.65], rotation: [0.12, 0.12, -0.1], range: [0.58, 0.89] },
  { id: 'qwiic', name: 'Qwiic connector', category: 'Connectivity', description: 'This small keyed connector carries I²C signals and 3.3 V power for compatible sensors and accessories.', spec: '4-pin JST SH · 3.3 V I²C', assembled: [3.05, 0.1, 0.58], exploded: [4.85, 0.65, 0.8], rotation: [0.03, -0.23, 0.07], range: [0.59, 0.9] },
  { id: 'spi', name: 'SPI header', category: 'Input / output', description: 'The six-pin SPI connector exposes the synchronous serial bus used by many displays, storage modules and other peripherals.', spec: '2 × 3 pins · SPI bus', assembled: [3.02, 0.1, -1.0], exploded: [4.8, 1.1, -1.7], rotation: [0.04, 0.11, -0.07], range: [0.58, 0.91] },
  { id: 'esp-header', name: 'ESP programming header', category: 'Development', description: 'Dedicated access points support advanced work with the ESP32-S3 connectivity processor.', spec: 'Connectivity module access', assembled: [-1.67, 0.1, -1.72], exploded: [-1.9, 1.1, -3.15], rotation: [0.06, 0.08, 0.05], range: [0.55, 0.85] },
  { id: 'inductor', name: 'Power inductor', category: 'Power', description: 'An inductor stores energy as a magnetic field, forming part of the switching power supply that converts the input voltage.', spec: 'Shielded power inductor', assembled: [-0.2, 0.12, 1.02], exploded: [-0.25, 1.6, 2.95], rotation: [0.1, -0.18, 0.08], range: [0.28, 0.57] },
  { id: 'regulator-5v', name: '5 V regulator', category: 'Power', description: 'The power supply maintains the main 5 V rail used by the RA4M1 and the board’s I/O.', spec: 'Main board power rail', assembled: [-0.43, 0.1, 1.82], exploded: [-1.25, 0.65, 3.25], rotation: [0.04, 0.08, 0.1], range: [0.19, 0.49] },
  { id: 'regulator-3v3', name: '3.3 V regulator', category: 'Power', description: 'A lower-voltage rail supplies the connectivity module and other 3.3 V circuitry.', spec: 'Wireless and peripheral power', assembled: [-2.12, 0.1, 1.82], exploded: [-3.0, 0.65, 3.15], rotation: [-0.08, -0.15, 0.08], range: [0.18, 0.46] },
  { id: 'voltage-translator', name: 'Logic level translator', category: 'Signal', description: 'Level translation lets the board’s 5 V and 3.3 V digital domains exchange signals.', spec: '5 V ↔ 3.3 V logic', assembled: [-1.4, 0.1, -0.68], exploded: [-2.1, 1.65, -0.7], rotation: [0.06, 0.13, 0.06], range: [0.23, 0.52] },
  { id: 'usb-protection', name: 'USB support circuitry', category: 'Signal', description: 'Small support components around the USB port condition and protect the board’s wired connection.', spec: 'USB signal support', assembled: [-2.72, 0.1, -0.17], exploded: [-3.9, 0.62, -0.25], rotation: [0.03, 0.06, -0.05], range: [0.16, 0.43] },
  { id: 'clock', name: 'Clock circuitry', category: 'Processing', description: 'Timing and support circuitry provide the stable electrical rhythm that digital components need to operate.', spec: 'Timing support components', assembled: [0.34, 0.1, -1.61], exploded: [0.5, 1.2, -2.8], rotation: [0.06, 0.12, 0.08], range: [0.18, 0.46] },
  { id: 'smd-power', name: 'Power passives', category: 'Support', description: 'Resistors and capacitors filter power and stabilize the supply close to the components that use it.', spec: 'Grouped surface-mount components', assembled: [-2.51, 0.1, 0.45], exploded: [-3.65, 0.85, 0.85], rotation: [0.02, -0.14, 0.05], range: [0.15, 0.38] },
  { id: 'smd-mcu', name: 'Processor passives', category: 'Support', description: 'Nearby passive components provide local decoupling and signal conditioning for the main processor.', spec: 'Grouped surface-mount components', assembled: [0.53, 0.1, -0.91], exploded: [0.2, 1.18, -0.9], rotation: [0.04, 0.05, -0.06], range: [0.17, 0.4] },
  { id: 'smd-analog', name: 'Analog support circuitry', category: 'Support', description: 'Small surface-mount components support signals and peripheral connections along the analog side of the board.', spec: 'Grouped surface-mount components', assembled: [2.92, 0.1, 1.56], exploded: [4.1, 0.6, 2.15], rotation: [0.04, -0.06, 0.06], range: [0.16, 0.41] },
  { id: 'battery', name: 'RTC / power-off header', category: 'Power', description: 'Dedicated pins expose the real-time clock backup supply and the OFF control signal for advanced power configurations.', spec: 'OFF · GND · VRTC', assembled: [-1.64, 0.1, 2.23], exploded: [-2.6, 0.75, 4.0], rotation: [-0.02, 0.13, -0.07], range: [0.55, 0.85] },
]

export type PartId = (typeof PARTS)[number]['id']
