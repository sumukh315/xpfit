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

  // ── pets2.png — 4 cols × 2 rows ──────────────────────────────────────────
  {
    id: 'steel_wolf',
    name: 'Steel Wolf',
    desc: 'Forged in battle, fueled by blue flame. Only the relentless earn this beast.',
    cost: 900,
    costType: 'points',
    col: 0, row: 0, cols: 4, rows: 2, sheet: '/pets2.png',
  },
  {
    id: 'mini_golem',
    name: 'Mini Golem',
    desc: 'Born from lava and stone. Grows stronger every time you break a record.',
    cost: 200,
    costType: 'pr_points',
    col: 1, row: 0, cols: 4, rows: 2, sheet: '/pets2.png',
  },
  {
    id: 'owl_scout',
    name: 'Owl Scout',
    desc: 'A tactical companion who tracks every rep. Wisdom wins the long game.',
    cost: 700,
    costType: 'points',
    col: 0, row: 1, cols: 4, rows: 2, sheet: '/pets2.png',
  },
  {
    id: 'shadow_cat',
    name: 'Shadow Cat',
    desc: 'Haunts the gym at midnight. Earned by those who shatter their own limits.',
    cost: 175,
    costType: 'pr_points',
    col: 1, row: 1, cols: 4, rows: 2, sheet: '/pets2.png',
  },
  {
    id: 'mini_griffin',
    name: 'Mini Griffin',
    desc: 'Half eagle, half lion — all elite. The rarest points companion in the shop.',
    cost: 1500,
    costType: 'points',
    col: 2, row: 1, cols: 4, rows: 2, sheet: '/pets2.png',
  },
  {
    id: 'skeleton_dog',
    name: 'Skeleton Dog',
    desc: 'Risen from the graveyard of missed PRs. A reminder to never give up.',
    cost: 300,
    costType: 'pr_points',
    col: 3, row: 1, cols: 4, rows: 2, sheet: '/pets2.png',
  },
]

export function getPet(id) {
  return PETS.find(p => p.id === id) || null
}
