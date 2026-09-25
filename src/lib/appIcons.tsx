import { Blocks, BriefcaseBusiness, Gamepad2, Landmark, ShoppingBag, WalletCards, Wrench } from 'lucide-react';

export function categoryIcon(name: string) {
  const key = name.toLowerCase();
  if (key.includes('shop') || key.includes('store')) return ShoppingBag;
  if (key.includes('block') || key.includes('web3')) return Blocks;
  if (key.includes('wallet') || key.includes('finance')) return WalletCards;
  if (key.includes('game')) return Gamepad2;
  if (key.includes('business')) return BriefcaseBusiness;
  if (key.includes('bank')) return Landmark;
  return Wrench;
}
