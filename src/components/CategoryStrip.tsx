import { categoryIcon } from '../lib/appIcons';
import type { Category } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

export function CategoryStrip({ categories, selected, onSelect }: { categories: Category[]; selected: string; onSelect: (id: string) => void }) {
  const { language } = useLanguage();
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      <button type="button" onClick={() => onSelect('all')} className={`category-chip ${selected === 'all' ? 'category-chip-active' : ''}`}>
        {language === 'ar' ? 'الكل' : 'All'}
      </button>
      {categories.map((category) => {
        const Icon = categoryIcon(category.icon);
        return (
          <button key={category.id} type="button" onClick={() => onSelect(category.id)} className={`category-chip ${selected === category.id ? 'category-chip-active' : ''}`}>
            <Icon className="h-4 w-4" />
            {language === 'ar' ? category.name_ar : category.name_en}
          </button>
        );
      })}
    </div>
  );
}
