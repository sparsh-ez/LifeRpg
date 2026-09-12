import { ShopItem } from '@/types/rpg';

export const SHOP_CATALOG: ShopItem[] = [
  {
    slug: 'legendary-water-bottle',
    name: 'Legendary Water Bottle',
    description: 'Electrolytes distilled in the mountains of discipline. Boosts hydration and cellular stamina.',
    category: 'Cosmetic',
    price: 100,
    rarity: 'Common',
    icon_name: 'Droplets',
  },
  {
    slug: 'touch-grass-pass',
    name: 'Touch Grass Pass',
    description: 'Official certification confirming you occasionally step outside, breathe air, and observe nature.',
    category: 'Title',
    price: 200,
    rarity: 'Uncommon',
    icon_name: 'Footprints',
  },
  {
    slug: 'rgb-gaming-setup',
    name: 'RGB Battlestation',
    description: 'Adds +100 aesthetic to your mental workflow. 240Hz productivity guaranteed.',
    category: 'Cosmetic',
    price: 450,
    rarity: 'Rare',
    icon_name: 'Monitor',
  },
  {
    slug: 'legendary-brain',
    name: 'Legendary Brain',
    description: 'Folded with raw discipline and high-dimensional problem solving capability.',
    category: 'Cosmetic',
    price: 800,
    rarity: 'Epic',
    icon_name: 'Brain',
  },
  {
    slug: 'sigma-aura',
    name: 'Sigma Aura',
    description: 'A discreet dark-purple particle aura that surrounds your character card. Pure unspoken dominance.',
    category: 'Aura',
    price: 1000,
    rarity: 'Epic',
    icon_name: 'Sparkles',
  },
  {
    slug: 'xp-shrine',
    name: 'XP Shrine',
    description: 'An ancient stone altar honoring your relentless daily consistency.',
    category: 'Cosmetic',
    price: 1200,
    rarity: 'Epic',
    icon_name: 'Flame',
  },
  {
    slug: 'gigachad-jawline',
    name: 'Gigachad Jawline',
    description: 'Chiseled by pure grit. Sharp enough to effortlessly slice through procrastination.',
    category: 'Flair',
    price: 1500,
    rarity: 'Legendary',
    icon_name: 'Smile',
  },
  {
    slug: 'golden-crown',
    name: 'Golden Crown',
    description: 'The ultimate emblem of supreme dedication. Pure auric prestige.',
    category: 'Flair',
    price: 2000,
    rarity: 'Legendary',
    icon_name: 'Crown',
  },
];

export function getShopItemBySlug(slug: string): ShopItem | undefined {
  return SHOP_CATALOG.find((item) => item.slug === slug);
}
