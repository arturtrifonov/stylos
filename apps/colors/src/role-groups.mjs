/** @typedef {import('./model.mjs').Role} Role */
export const ROLE_STATES = ['default', 'hover', 'active', 'disabled']

/** @param {string} value */
export function roleLabel(value) {
  return value.split('/').map(part => part.replaceAll('-', ' ').replace(/^./, letter => letter.toUpperCase())).join(' / ')
}

/** Group paths by their actual area, intensity and tone/hue; states stay together.
 * @param {Role[]} roles @param {boolean} special @param {string} filter
 */
export function groupRoles(roles, special, filter = '') {
  /** @type {Map<string,{area:string,sections:Map<string,{name:string,families:Map<string,{name:string,roles:Role[]}>}>}>} */
  const areas = new Map()
  for (const role of roles) {
    if (Boolean(role.generated) !== special || !role.path.toLowerCase().includes(filter.toLowerCase())) continue
    const [area, intensity, ...rest] = role.path.split('/')
    const section = area === 'surface' ? intensity : ''
    const family = area === 'surface' ? rest.slice(0, -1).filter(part => part !== 'special').join('/') : ''
    if (!areas.has(area)) areas.set(area, { area, sections: new Map() })
    const group = areas.get(area)
    if (!group.sections.has(section)) group.sections.set(section, { name: section, families: new Map() })
    const sectionGroup = group.sections.get(section)
    if (!sectionGroup.families.has(family)) sectionGroup.families.set(family, { name: family, roles: [] })
    sectionGroup.families.get(family).roles.push(role)
  }
  return [...areas.values()].map(group => ({
    area: group.area,
    sections: [...group.sections.values()].map(section => ({
      name: section.name,
      families: [...section.families.values()].map(family => ({
        ...family,
        roles: group.area === 'surface' ? [...family.roles].sort((a, b) => ROLE_STATES.indexOf(a.path.split('/').at(-1)) - ROLE_STATES.indexOf(b.path.split('/').at(-1))) : family.roles,
      })),
    })),
  }))
}
