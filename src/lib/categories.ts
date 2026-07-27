import { CategoryType } from '../types';

export interface CategoryInfo {
  name: CategoryType;
  color: string;
  bgColor: string;
  borderColor: string;
  iconName: string;
}

export const CATEGORY_INFO: Record<CategoryType, CategoryInfo> = {
  Spożywcze: {
    name: 'Spożywcze',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-300',
    iconName: 'ShoppingBag',
  },
  'Chemia/Kosmetyki': {
    name: 'Chemia/Kosmetyki',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    iconName: 'Sparkles',
  },
  Dom: {
    name: 'Dom',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    iconName: 'Home',
  },
  Zdrowie: {
    name: 'Zdrowie',
    color: 'text-rose-700',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-300',
    iconName: 'HeartPulse',
  },
  Odzież: {
    name: 'Odzież',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    iconName: 'Shirt',
  },
  Rozrywka: {
    name: 'Rozrywka',
    color: 'text-pink-700',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-300',
    iconName: 'Smile',
  },
  'Rachunki/Usługi': {
    name: 'Rachunki/Usługi',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-300',
    iconName: 'Receipt',
  },
  Inne: {
    name: 'Inne',
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-300',
    iconName: 'Tag',
  },
};

export const COMMON_STORES = [
  'Biedronka',
  'Lidl',
  'Rossmann',
  'Pepco',
  'Żabka',
  'Dino',
  'Apteka',
  'Kaufland',
  'Auchan',
  'Carrefour',
  'Castorama',
  'Leroy Merlin',
  'Action',
  'RTV AGD',
  'Orlen',
  'Inny sklep',
];
