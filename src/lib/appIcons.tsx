import {
  Blocks,
  BriefcaseBusiness,
  CircleDollarSign,
  Gamepad2,
  Globe2,
  Landmark,
  LayoutGrid,
  MessageCircle,
  Package,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Store,
  WalletCards,
  Wrench
} from 'lucide-react';

const categoryIconMap = {
  store: Store,
  blocks: Blocks,
  'shopping-bag': ShoppingBag,
  wallet: WalletCards,
  finance: CircleDollarSign,
  business: BriefcaseBusiness,
  social: MessageCircle,
  games: Gamepad2,
  tools: Wrench,
  apps: LayoutGrid,
  mobile: Smartphone,
  web: Globe2,
  services: Package,
  bank: Landmark,
  featured: Sparkles
} as const;

export function categoryIcon(name?: string | null) {
  const key = (name ?? '').trim().toLowerCase();

  // Keep the admin value and the public UI on the exact same icon mapping.
  if (key in categoryIconMap) return categoryIconMap[key as keyof typeof categoryIconMap];

  // Backward compatibility for older category values that may already exist.
  if (key.includes('shop')) return ShoppingBag;
  if (key.includes('block') || key.includes('web3')) return Blocks;
  if (key.includes('wallet')) return WalletCards;
  if (key.includes('finance')) return CircleDollarSign;
  if (key.includes('game')) return Gamepad2;
  if (key.includes('business')) return BriefcaseBusiness;
  if (key.includes('social') || key.includes('chat')) return MessageCircle;
  if (key.includes('mobile') || key.includes('phone')) return Smartphone;
  if (key.includes('service')) return Package;
  if (key.includes('bank')) return Landmark;
  if (key.includes('featured') || key.includes('star')) return Sparkles;
  if (key.includes('web') || key.includes('globe')) return Globe2;
  if (key.includes('app')) return LayoutGrid;
  if (key.includes('store')) return Store;

  return Wrench;
}
