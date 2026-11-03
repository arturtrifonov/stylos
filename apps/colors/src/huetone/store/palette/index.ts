// The graph reads the selected Stylos ramp. Project ownership stays in App.
import { computed, map } from 'nanostores'
import { colorSpaces } from 'shared/colorFuncs'
import { Palette, spaceName } from 'shared/types'

export const paletteStore = map<Palette>({
  mode: spaceName.oklch, name: 'Stylos', hues: ['slate'], tones: ['25'],
  colors: [[colorSpaces.oklch.hex2color('#000000')!]],
})
export const colorSpaceStore = computed(paletteStore, palette => colorSpaces[palette.mode])
