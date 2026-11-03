import { map } from 'nanostores'

export type TSettings = { showColors: boolean; showP3: boolean; showRec2020: boolean }
export const chartSettingsStore = map<TSettings>({ showColors: true, showP3: false, showRec2020: false })
