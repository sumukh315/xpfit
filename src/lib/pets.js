// Pet definitions — col/row are positions in the 1024×1536 spritesheet (2 cols × 3 rows, 512px each)
export const PETS = [
  {
    id: 'angel_cat',
    name: 'Angel Cat',
    desc: 'A blessed companion who watches over your gains.',
    cost: 500,
    costType: 'points',
    col: 0, row: 0,
  },
  {
    id: 'dragon',
    name: 'Baby Dragon',
    desc: 'Breathes fire — almost as hot as your PRs.',
    cost: 1200,
    costType: 'points',
    col: 1, row: 0,
  },
  {
    id: 'hellhound',
    name: 'Hellhound',
    desc: 'Forged in the depths. Only earned through blood and iron.',
    cost: 150,
    costType: 'pr_points',
    col: 0, row: 1,
  },
  {
    id: 'unicorn',
    name: 'Unicorn',
    desc: 'The rarest companion. Reserved for legends who never stop pushing.',
    cost: 500,
    costType: 'pr_points',
    col: 1, row: 1,
  },
  {
    id: 'shroom_pup',
    name: 'Shroom Pup',
    desc: 'A mystical forest critter carrying treasures.',
    cost: 800,
    costType: 'points',
    col: 0.5, row: 2,
  },
]

export function getPet(id) {
  return PETS.find(p => p.id === id) || null
}
