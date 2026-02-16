
import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Moon, Sun, Palette } from 'lucide-react';
import { useTheme, ThemeColor } from '@/contexts/ThemeContext';

const ThemeSwitcher: React.FC = () => {
  const { themeColor, themeMode, setThemeColor, toggleTheme } = useTheme();

  const themeColors: { name: string; value: ThemeColor; color: string }[] = [
    { name: 'Blue', value: 'blue', color: 'bg-blue-500' },
    { name: 'Purple', value: 'purple', color: 'bg-purple-500' },
    { name: 'Teal', value: 'teal', color: 'bg-teal-500' },
    { name: 'Green', value: 'green', color: 'bg-green-500' },
    { name: 'Orange', value: 'orange', color: 'bg-orange-500' },
  ];

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleTheme}
        className="h-8 w-8 p-0"
      >
        {themeMode === 'light' ? (
          <Moon className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Palette className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {themeColors.map((color) => (
            <DropdownMenuItem
              key={color.value}
              onClick={() => setThemeColor(color.value)}
              className="flex items-center gap-2"
            >
              <div className={`w-4 h-4 rounded-full ${color.color}`} />
              <span>{color.name}</span>
              {themeColor === color.value && (
                <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ThemeSwitcher;
